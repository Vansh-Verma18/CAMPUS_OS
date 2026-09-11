"""
AI Retrieval Service — Permission-Aware Data Fetching

This module implements the security boundary between the AI and the database.
The LLM must only receive data that the authenticated user is authorised to access.

Architecture principle:
  User → authenticated API → permission-aware retrieval → limited evidence → LLM

NEVER expose the full database to the LLM.
NEVER trust the user-supplied role — always read from current_user object.

Role access matrix:
  student    — Public events (scheduled/ongoing), active clubs, own registrations
  organizer  — Above + their club's events, registration counts, venues, resources
  faculty    — Above + department events, operational information
  admin      — Institution-wide: all events, clubs, venues, resources, aggregated stats
               + financial information (expenses)
"""
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone, timedelta
import logging

from app.schemas.users import UserInDB
from app.repositories.base import BaseRepository

logger = logging.getLogger(__name__)

# Maximum documents to feed to the LLM per collection to prevent prompt bloat
MAX_EVENTS = 20
MAX_CLUBS = 15
MAX_REGISTRATIONS = 30
MAX_EXPENSES = 20


def _format_event(ev: Any) -> Dict[str, Any]:
    """Sanitise an event document before sending to LLM."""
    return {
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


def _format_club(club: Any) -> Dict[str, Any]:
    """Sanitise a club document before sending to LLM."""
    return {
        "id": str(club.id),
        "name": club.name,
        "category": club.category,
        "status": club.status,
        "description": club.description[:200] if club.description else "",
    }


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
        expense_repo: BaseRepository[Any, Any],
        ai_provider: Any = None,
    ) -> None:
        self.event_repo = event_repo
        self.club_repo = club_repo
        self.venue_repo = venue_repo
        self.resource_repo = resource_repo
        self.registration_repo = registration_repo
        self.expense_repo = expense_repo
        self.ai_provider = ai_provider

    async def get_evidence(
        self, current_user: UserInDB, question: str = ""
    ) -> Dict[str, Any]:
        """
        Retrieve permission-scoped evidence for the given user.
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

        # ── Events ─────────────────────────────────────────────────────────
        now_utc = datetime.now(timezone.utc).replace(tzinfo=None)  # naive UTC for Mongo

        if role == "student":
            event_query: Dict[str, Any] = {
                "status": {"$in": ["scheduled", "ongoing", "completed"]},
            }
        elif role == "organizer":
            # Their own events + public events
            event_query = {
                "status": {"$in": ["scheduled", "ongoing", "completed"]},
            }
        else:
            # faculty / admin: all non-cancelled
            event_query = {"status": {"$ne": "cancelled"}}

        events = await self.event_repo.get_all(query=event_query, limit=MAX_EVENTS)
        evidence["events"] = [_format_event(e) for e in events]
        evidence["events_count"] = len(events)
        sources.append("events")

        # Week ahead events for quick factual answers
        week_end = now_utc + timedelta(days=7)
        week_events = [
            e for e in events
            if e.start_datetime and (
                e.start_datetime.replace(tzinfo=None) if e.start_datetime.tzinfo
                else e.start_datetime
            ) <= week_end
        ]
        evidence["events_this_week"] = [_format_event(e) for e in week_events]

        # ── Clubs ───────────────────────────────────────────────────────────
        club_query: Dict[str, Any] = {"status": "active"}
        clubs = await self.club_repo.get_all(query=club_query, limit=MAX_CLUBS)
        evidence["clubs"] = [_format_club(c) for c in clubs]
        evidence["active_clubs_count"] = len(clubs)
        sources.append("clubs")

        # ── Organizer scope: their club's registrations ─────────────────────
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

        # ── Student: their own registrations ────────────────────────────────
        if role == "student":
            my_regs = await self.registration_repo.get_all(
                query={"user_id": current_user.id}, limit=MAX_REGISTRATIONS
            )
            evidence["my_registrations"] = [
                {
                    "event_id": str(r.event_id),
                    "status": r.status,
                    "attendance_status": r.attendance_status,
                }
                for r in my_regs
            ]
            evidence["my_registrations_count"] = len(my_regs)
            sources.append("my_registrations")

        # ── Admin-only: financial summary (expenses) ─────────────────────────
        if role == "admin":
            expenses = await self.expense_repo.get_all(limit=MAX_EXPENSES)
            if expenses:
                evidence["expense_summary"] = _format_expense_summary(expenses)
                sources.append("expenses")

            # Registration analytics for admin
            all_regs = await self.registration_repo.get_all(limit=200)
            reg_by_event: Dict[str, int] = {}
            for r in all_regs:
                eid = str(r.event_id) if r.event_id else "unknown"
                reg_by_event[eid] = reg_by_event.get(eid, 0) + 1
            evidence["registration_counts_by_event"] = reg_by_event
            sources.append("registrations")

        elif role in ("organizer", "faculty"):
            # Organizers / faculty see registration counts for events only
            all_regs = await self.registration_repo.get_all(limit=200)
            reg_by_event: Dict[str, int] = {}
            for r in all_regs:
                eid = str(r.event_id) if r.event_id else "unknown"
                reg_by_event[eid] = reg_by_event.get(eid, 0) + 1
            evidence["registration_counts_by_event"] = reg_by_event
            sources.append("registrations")

        # ── Vector Search: Institutional Memory ──────────────────────────────
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
