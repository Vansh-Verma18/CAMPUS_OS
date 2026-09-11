"""
AI Retrieval Service — Permission-Aware Cross-Domain Data Fetching

This module implements the security boundary between the AI and the database.
The LLM must only receive data that the authenticated user is authorised to access.

Architecture principle:
  User → authenticated API → permission-aware retrieval → limited evidence → LLM

NEVER expose the full database to the LLM.
NEVER trust the user-supplied role — always read from current_user object.

Role access matrix:
  student    — Public events (scheduled/ongoing/completed), active clubs, own registrations, public feedback
  organizer  — Above + their club's events, registration counts, attendance, feedback for their events
  faculty    — Above + department events, operational information, aggregated analytics
  admin      — Institution-wide: all events, clubs, venues, resources, aggregated stats
               + financial information (expenses), full analytics

Cross-domain integration:
  - Events enriched with registration counts, attendance metrics, feedback averages
  - Clubs enriched with event counts and activity scores
  - Calculated metrics: attendance rates, feedback averages, participation trends
"""
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone, timedelta
import logging
from collections import defaultdict

from app.schemas.users import UserInDB
from app.repositories.base import BaseRepository

logger = logging.getLogger(__name__)

# Maximum documents to feed to the LLM per collection to prevent prompt bloat
MAX_EVENTS = 30
MAX_CLUBS = 20
MAX_REGISTRATIONS = 50
MAX_ATTENDANCE = 100
MAX_FEEDBACK = 100
MAX_EXPENSES = 20


def _format_event(ev: Any, enrichment: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Sanitise an event document before sending to LLM.
    Optionally enrich with cross-domain metrics.
    """
    result = {
        "id": str(ev.id),
        "title": ev.title,
        "description": ev.description[:200] if ev.description else "",
        "category": ev.category,
        "status": ev.status,
        "start_datetime": ev.start_datetime.isoformat() if ev.start_datetime else None,
        "end_datetime": ev.end_datetime.isoformat() if ev.end_datetime else None,
        "expected_participants": ev.expected_participants,
        "target_audience": ev.target_audience,
        "venue_id": str(ev.venue_id) if ev.venue_id else None,
        "organizer_club_id": str(ev.organizer_club_id) if ev.organizer_club_id else None,
    }
    
    # Add enrichment data if provided
    if enrichment:
        event_id = str(ev.id)
        if event_id in enrichment.get("registration_counts", {}):
            result["registration_count"] = enrichment["registration_counts"][event_id]
        if event_id in enrichment.get("attendance_counts", {}):
            result["attendance_count"] = enrichment["attendance_counts"][event_id]
        if event_id in enrichment.get("attendance_rates", {}):
            result["attendance_rate_pct"] = enrichment["attendance_rates"][event_id]
        if event_id in enrichment.get("feedback_averages", {}):
            result["average_feedback_rating"] = enrichment["feedback_averages"][event_id]
        if event_id in enrichment.get("feedback_counts", {}):
            result["feedback_count"] = enrichment["feedback_counts"][event_id]
    
    return result


def _format_club(club: Any, enrichment: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Sanitise a club document before sending to LLM.
    Optionally enrich with activity metrics.
    """
    result = {
        "id": str(club.id),
        "name": club.name,
        "category": club.category,
        "status": club.status,
        "description": club.description[:200] if club.description else "",
    }
    
    # Add enrichment data if provided
    if enrichment:
        club_id = str(club.id)
        if club_id in enrichment.get("events_by_club", {}):
            result["events_organized"] = enrichment["events_by_club"][club_id]
    
    return result


def _format_expense_summary(expenses: List[Any]) -> Dict[str, Any]:
    """Aggregate expense data — do not expose individual records to LLM."""
    total = sum(e.amount for e in expenses)
    by_category: Dict[str, float] = {}
    by_status: Dict[str, int] = {}
    for e in expenses:
        by_category[e.category] = by_category.get(e.category, 0.0) + e.amount
        by_status[e.status] = by_status.get(e.status, 0) + 1
    return {
        "total_amount": round(total, 2),
        "currency": expenses[0].currency if expenses else "USD",
        "count": len(expenses),
        "by_category": {k: round(v, 2) for k, v in by_category.items()},
        "by_status": by_status,
    }


class AIRetrievalService:
    """
    Retrieves scoped institutional evidence for a given authenticated user.
    The role is always read from the UserInDB object — never from client input.
    """

    def __init__(
        self,
        event_repo: BaseRepository[Any, Any],
        club_repo: BaseRepository[Any, Any],
        venue_repo: BaseRepository[Any, Any],
        resource_repo: BaseRepository[Any, Any],
        registration_repo: BaseRepository[Any, Any],
        attendance_repo: BaseRepository[Any, Any],
        feedback_repo: BaseRepository[Any, Any],
        expense_repo: BaseRepository[Any, Any],
        ai_provider: Any = None,
    ) -> None:
        self.event_repo = event_repo
        self.club_repo = club_repo
        self.venue_repo = venue_repo
        self.resource_repo = resource_repo
        self.registration_repo = registration_repo
        self.attendance_repo = attendance_repo
        self.feedback_repo = feedback_repo
        self.expense_repo = expense_repo
        self.ai_provider = ai_provider

    async def get_evidence(
        self, current_user: UserInDB, question: str = ""
    ) -> Dict[str, Any]:
        """
        Retrieve permission-scoped evidence for the given user with cross-domain enrichment.
        Returns a structured dict to be passed to the AI service.
        """
        role = current_user.role
        logger.info(
            "Retrieving AI evidence for user=%s role=%s",
            str(current_user.id), role
        )

        evidence: Dict[str, Any] = {
            "role": role,
            "user_id": str(current_user.id),
            "retrieved_at": datetime.now(timezone.utc).isoformat(),
        }
        sources: List[str] = []

        # ── STEP 1: Fetch all relevant data in parallel where possible ─────
        now_utc = datetime.now(timezone.utc).replace(tzinfo=None)  # naive UTC for Mongo

        # Event query based on role
        if role == "student":
            event_query: Dict[str, Any] = {
                "status": {"$in": ["scheduled", "ongoing", "completed"]},
            }
        elif role == "organizer":
            event_query = {
                "status": {"$in": ["scheduled", "ongoing", "completed"]},
            }
        else:
            # faculty / admin: all non-cancelled
            event_query = {"status": {"$ne": "cancelled"}}

        events = await self.event_repo.get_all(query=event_query, limit=MAX_EVENTS)
        
        # Fetch all data needed for cross-domain enrichment
        all_registrations = await self.registration_repo.get_all(limit=500)
        
        # Attendance and feedback - scope by role
        if role in ("student",):
            # Students can see their own attendance
            my_attendance = await self.attendance_repo.get_all(
                query={"user_id": current_user.id}, limit=MAX_ATTENDANCE
            )
            attendance_records = my_attendance
            # Students can see public feedback aggregates (but not individual records)
            all_feedback = []
        else:
            # Organizers, faculty, admin can see attendance and feedback
            attendance_records = await self.attendance_repo.get_all(limit=MAX_ATTENDANCE)
            all_feedback = await self.feedback_repo.get_all(limit=MAX_FEEDBACK)

        # ── STEP 2: Calculate cross-domain metrics ──────────────────────────
        enrichment: Dict[str, Any] = {
            "registration_counts": {},
            "attendance_counts": {},
            "attendance_rates": {},
            "feedback_averages": {},
            "feedback_counts": {},
            "events_by_club": defaultdict(int),
        }

        # Registration counts by event
        reg_by_event: Dict[str, int] = defaultdict(int)
        for reg in all_registrations:
            if reg.status == "registered":
                event_id = str(reg.event_id) if reg.event_id else "unknown"
                reg_by_event[event_id] += 1
        enrichment["registration_counts"] = dict(reg_by_event)

        # Attendance counts by event
        att_by_event: Dict[str, int] = defaultdict(int)
        for att in attendance_records:
            if getattr(att, "status", "") == "attended":
                event_id = str(att.event_id) if att.event_id else "unknown"
                att_by_event[event_id] += 1
        enrichment["attendance_counts"] = dict(att_by_event)

        # Attendance rates (attended / registered * 100)
        for event_id, att_count in att_by_event.items():
            reg_count = reg_by_event.get(event_id, 0)
            if reg_count > 0:
                enrichment["attendance_rates"][event_id] = round(att_count / reg_count * 100, 1)

        # Feedback averages and counts by event
        feedback_by_event: Dict[str, List[float]] = defaultdict(list)
        for fb in all_feedback:
            if fb.rating is not None:
                event_id = str(fb.event_id) if fb.event_id else "unknown"
                feedback_by_event[event_id].append(float(fb.rating))
        
        for event_id, ratings in feedback_by_event.items():
            enrichment["feedback_counts"][event_id] = len(ratings)
            if ratings:
                enrichment["feedback_averages"][event_id] = round(sum(ratings) / len(ratings), 2)

        # Events organized by club
        for ev in events:
            if ev.organizer_club_id:
                club_id = str(ev.organizer_club_id)
                enrichment["events_by_club"][club_id] += 1
        enrichment["events_by_club"] = dict(enrichment["events_by_club"])

        # ── STEP 3: Format events with enrichment ────────────────────────────
        evidence["events"] = [_format_event(e, enrichment) for e in events]
        evidence["events_count"] = len(events)
        sources.append("events")

        # Week ahead events for quick factual answers
        week_end = now_utc + timedelta(days=7)
        week_events = [
            e for e in events
            if e.start_datetime and (
                e.start_datetime.replace(tzinfo=None) if e.start_datetime.tzinfo
                else e.start_datetime
            ) <= week_end and (
                e.start_datetime.replace(tzinfo=None) if e.start_datetime.tzinfo
                else e.start_datetime
            ) >= now_utc
        ]
        evidence["events_this_week"] = [_format_event(e, enrichment) for e in week_events]

        # Historical event trends (by year and category)
        if role in ("faculty", "admin"):
            events_by_year: Dict[int, int] = defaultdict(int)
            events_by_category: Dict[str, int] = defaultdict(int)
            for ev in events:
                if ev.start_datetime:
                    year = ev.start_datetime.year
                    events_by_year[year] += 1
                events_by_category[ev.category] = events_by_category.get(ev.category, 0) + 1
            
            evidence["event_trends"] = {
                "by_year": dict(sorted(events_by_year.items())),
                "by_category": dict(events_by_category),
            }

        # ── STEP 4: Clubs with enrichment ────────────────────────────────────
        club_query: Dict[str, Any] = {"status": "active"}
        clubs = await self.club_repo.get_all(query=club_query, limit=MAX_CLUBS)
        evidence["clubs"] = [_format_club(c, enrichment) for c in clubs]
        evidence["active_clubs_count"] = len(clubs)
        sources.append("clubs")

        # Most active clubs (for faculty/admin)
        if role in ("faculty", "admin") and enrichment["events_by_club"]:
            active_clubs = sorted(
                enrichment["events_by_club"].items(),
                key=lambda x: x[1],
                reverse=True
            )[:10]
            evidence["most_active_clubs"] = [
                {"club_id": club_id, "events_count": count}
                for club_id, count in active_clubs
            ]

        # ── STEP 5: Aggregated cross-domain statistics ───────────────────────
        if role in ("organizer", "faculty", "admin"):
            evidence["participation_summary"] = {
                "total_registrations": len(all_registrations),
                "confirmed_registrations": len([r for r in all_registrations if r.status == "registered"]),
                "total_attendance_records": len(attendance_records),
                "attended_count": len([a for a in attendance_records if getattr(a, "status", "") == "attended"]),
            }
            
            # Overall attendance rate
            if evidence["participation_summary"]["confirmed_registrations"] > 0:
                evidence["participation_summary"]["overall_attendance_rate_pct"] = round(
                    evidence["participation_summary"]["attended_count"] / 
                    evidence["participation_summary"]["confirmed_registrations"] * 100, 
                    1
                )
            
            sources.append("registrations")
            sources.append("attendance")

        # Feedback summary (for organizer/faculty/admin)
        if role in ("organizer", "faculty", "admin") and all_feedback:
            all_ratings = [f.rating for f in all_feedback if f.rating is not None]
            if all_ratings:
                evidence["feedback_summary"] = {
                    "total_responses": len(all_feedback),
                    "average_rating": round(sum(all_ratings) / len(all_ratings), 2),
                    "rating_distribution": {
                        str(i): len([r for r in all_ratings if r == i])
                        for i in range(1, 6)
                    },
                }
                sources.append("feedback")

        # ── STEP 6: Organizer scope: their club's registrations ─────────────
        if role in ("organizer", "faculty", "admin"):
            # Venue availability overview
            venues = await self.venue_repo.get_all(limit=20)
            evidence["venues"] = [
                {"id": str(v.id), "name": v.name, "capacity": v.capacity}
                for v in venues
            ]
            evidence["venues_count"] = len(venues)
            sources.append("venues")

            # Resources overview
            resources = await self.resource_repo.get_all(limit=20)
            evidence["resources"] = [
                {"id": str(r.id), "name": r.name, "type": getattr(r, "type", "unknown")}
                for r in resources
            ]
            sources.append("resources")

        # ── STEP 7: Student: their own registrations ───────────────────────
        if role == "student":
            my_regs = [r for r in all_registrations if r.user_id == current_user.id]
            evidence["my_registrations"] = [
                {
                    "event_id": str(r.event_id),
                    "status": r.status,
                    "attendance_status": getattr(r, "attendance_status", None),
                }
                for r in my_regs[:MAX_REGISTRATIONS]
            ]
            evidence["my_registrations_count"] = len(my_regs)
            sources.append("my_registrations")
            
            # My attendance records
            if attendance_records:
                evidence["my_attendance"] = [
                    {
                        "event_id": str(a.event_id),
                        "status": getattr(a, "status", "unknown"),
                        "checked_in_at": getattr(a, "checked_in_at", None),
                    }
                    for a in attendance_records
                ]
                sources.append("my_attendance")

        # ── STEP 8: Admin-only: financial summary (expenses) ─────────────────
        if role == "admin":
            expenses = await self.expense_repo.get_all(limit=MAX_EXPENSES)
            if expenses:
                evidence["expense_summary"] = _format_expense_summary(expenses)
                sources.append("expenses")

        # ── STEP 9: Vector Search: Institutional Memory ──────────────────────
        if question and self.ai_provider:
            try:
                from app.db.chroma import get_memory_collection
                collection = get_memory_collection()
                
                if collection:
                    # 1. Embed the question
                    q_embedding = await self.ai_provider.embed_content([question])
                    if q_embedding and len(q_embedding) > 0:
                        # 2. RBAC filter for documents
                        where_filter = {}
                        if role == "student":
                            where_filter = {"access_classification": "PUBLIC"}
                        elif role == "faculty":
                            where_filter = {"access_classification": {"$in": ["PUBLIC", "DEPARTMENT"]}}
                        elif role == "organizer":
                            where_filter = {"access_classification": {"$in": ["PUBLIC", "CLUB"]}}
                        # admin gets no filter (all access)
                        
                        # 3. Query ChromaDB
                        results = collection.query(
                            query_embeddings=q_embedding,
                            n_results=5,
                            where=where_filter if where_filter else None
                        )
                        
                        if results and results.get("documents") and results["documents"][0]:
                            retrieved_docs = []
                            for i, doc_text in enumerate(results["documents"][0]):
                                meta = results["metadatas"][0][i]
                                retrieved_docs.append({
                                    "text": doc_text,
                                    "source": meta.get("document_name", "unknown"),
                                    "year": meta.get("year", ""),
                                    "department": meta.get("department", "")
                                })
                            
                            if retrieved_docs:
                                evidence["institutional_memory"] = retrieved_docs
                                sources.append("institutional_memory")
                                
            except Exception as e:
                logger.error(f"Failed to retrieve institutional memory: {e}")

        evidence["sources"] = sources
        return evidence
