"""
Step 8 — Analytics Service

Aggregates institutional statistics from MongoDB collections.
Security contract:
  - Financial data (expenses) is ONLY returned when role == 'admin'.
  - This service receives pre-validated role from the dependency injector, never from client input.
  - No raw records are surfaced — only aggregated counts/totals.
"""
import logging
from typing import Any, Dict, List
from datetime import datetime, timezone

from app.repositories.base import BaseRepository
from app.schemas.analytics import (
    InstitutionalSummary,
    EventStats,
    ClubStats,
    ParticipationStats,
    FeedbackStats,
    FinancialStats,
    DocumentStats,
)

logger = logging.getLogger(__name__)


class AnalyticsService:
    def __init__(
        self,
        event_repo: BaseRepository[Any, Any],
        club_repo: BaseRepository[Any, Any],
        registration_repo: BaseRepository[Any, Any],
        attendance_repo: BaseRepository[Any, Any],
        feedback_repo: BaseRepository[Any, Any],
        expense_repo: BaseRepository[Any, Any],
        document_repo: BaseRepository[Any, Any],
    ) -> None:
        self.event_repo = event_repo
        self.club_repo = club_repo
        self.registration_repo = registration_repo
        self.attendance_repo = attendance_repo
        self.feedback_repo = feedback_repo
        self.expense_repo = expense_repo
        self.document_repo = document_repo

    async def get_institutional_summary(self, role: str) -> InstitutionalSummary:
        """
        Build an aggregated institutional analytics summary.
        Financial data is only included when role == 'admin'.
        """
        logger.info("Computing institutional analytics for role=%s", role)

        events_data = await self._get_event_stats()
        clubs_data = await self._get_club_stats()
        participation_data = await self._get_participation_stats()
        feedback_data = await self._get_feedback_stats()
        doc_data = await self._get_document_stats()

        financials = None
        if role == "admin":
            financials = await self._get_financial_stats()

        return InstitutionalSummary(
            role=role,
            events=events_data,
            clubs=clubs_data,
            participation=participation_data,
            feedback=feedback_data,
            documents=doc_data,
            financials=financials,
        )

    async def _get_event_stats(self) -> EventStats:
        try:
            all_events = await self.event_repo.get_all(limit=2000)
        except Exception as e:
            logger.error("Error fetching events for analytics: %s", e)
            return EventStats()

        by_status: Dict[str, int] = {}
        by_category: Dict[str, int] = {}

        for ev in all_events:
            s = getattr(ev, "status", "unknown")
            by_status[s] = by_status.get(s, 0) + 1
            c = getattr(ev, "category", "unknown")
            by_category[c] = by_category.get(c, 0) + 1

        return EventStats(
            total=len(all_events),
            by_status=by_status,
            by_category=by_category,
            upcoming=by_status.get("scheduled", 0),
            ongoing=by_status.get("ongoing", 0),
            completed=by_status.get("completed", 0),
            cancelled=by_status.get("cancelled", 0),
        )

    async def _get_club_stats(self) -> ClubStats:
        try:
            all_clubs = await self.club_repo.get_all(limit=1000)
        except Exception as e:
            logger.error("Error fetching clubs for analytics: %s", e)
            return ClubStats()

        by_category: Dict[str, int] = {}
        active = 0
        inactive = 0

        for club in all_clubs:
            s = getattr(club, "status", "inactive")
            if s == "active":
                active += 1
            else:
                inactive += 1
            cat = getattr(club, "category", "other")
            by_category[cat] = by_category.get(cat, 0) + 1

        return ClubStats(
            total=len(all_clubs),
            active=active,
            inactive=inactive,
            by_category=by_category,
        )

    async def _get_participation_stats(self) -> ParticipationStats:
        try:
            registrations = await self.registration_repo.get_all(limit=5000)
        except Exception as e:
            logger.error("Error fetching registrations: %s", e)
            registrations = []

        try:
            attendance = await self.attendance_repo.get_all(limit=5000)
        except Exception as e:
            logger.error("Error fetching attendance: %s", e)
            attendance = []

        confirmed = sum(1 for r in registrations if getattr(r, "status", "") == "registered")
        cancelled = sum(1 for r in registrations if getattr(r, "status", "") == "cancelled")
        attended = sum(1 for a in attendance if getattr(a, "status", "") == "attended")

        total_regs = len(registrations)
        total_att = len(attendance)
        attendance_rate = (attended / total_regs * 100) if total_regs > 0 else 0.0

        return ParticipationStats(
            total_registrations=total_regs,
            confirmed_registrations=confirmed,
            cancelled_registrations=cancelled,
            total_attendance_records=total_att,
            attended=attended,
            attendance_rate_pct=round(attendance_rate, 1),
        )

    async def _get_feedback_stats(self) -> FeedbackStats:
        try:
            feedback_items = await self.feedback_repo.get_all(limit=5000)
        except Exception as e:
            logger.error("Error fetching feedback: %s", e)
            return FeedbackStats()

        ratings = [f.rating for f in feedback_items if f.rating is not None]
        distribution: Dict[str, int] = {}
        for r in range(1, 6):
            distribution[str(r)] = ratings.count(r)

        avg = sum(ratings) / len(ratings) if ratings else 0.0

        return FeedbackStats(
            total_responses=len(feedback_items),
            average_rating=round(avg, 2),
            rating_distribution=distribution,
        )

    async def _get_financial_stats(self) -> FinancialStats:
        """Admin-only financial aggregation."""
        try:
            expenses = await self.expense_repo.get_all(limit=5000)
        except Exception as e:
            logger.error("Error fetching expenses: %s", e)
            return FinancialStats()

        total = 0.0
        by_category: Dict[str, float] = {}
        by_status: Dict[str, int] = {}
        pending = 0.0
        approved = 0.0
        paid = 0.0
        currency = "USD"

        for e in expenses:
            amt = getattr(e, "amount", 0.0)
            cat = getattr(e, "category", "other")
            status = getattr(e, "status", "pending")
            curr = getattr(e, "currency", "USD")

            total += amt
            currency = curr
            by_category[cat] = round(by_category.get(cat, 0.0) + amt, 2)
            by_status[status] = by_status.get(status, 0) + 1

            if status == "pending":
                pending += amt
            elif status == "approved":
                approved += amt
            elif status == "paid":
                paid += amt

        return FinancialStats(
            total_amount=round(total, 2),
            currency=currency,
            total_records=len(expenses),
            by_category={k: round(v, 2) for k, v in by_category.items()},
            by_status=by_status,
            pending_amount=round(pending, 2),
            approved_amount=round(approved, 2),
            paid_amount=round(paid, 2),
        )

    async def _get_document_stats(self) -> DocumentStats:
        try:
            docs = await self.document_repo.get_all(limit=2000)
        except Exception as e:
            logger.error("Error fetching documents for analytics: %s", e)
            return DocumentStats()

        by_classification: Dict[str, int] = {}
        vectorized = 0
        failed = 0

        for d in docs:
            cls = getattr(d, "access_classification", None)
            cls_val = cls.value if hasattr(cls, "value") else str(cls)
            by_classification[cls_val] = by_classification.get(cls_val, 0) + 1

            ps = getattr(d, "processing_status", "")
            if ps == "vectorized":
                vectorized += 1
            elif ps == "failed":
                failed += 1

        return DocumentStats(
            total=len(docs),
            vectorized=vectorized,
            failed=failed,
            by_classification=by_classification,
        )
