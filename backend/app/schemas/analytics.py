"""
Step 8 — Analytics & Reporting Schemas
"""
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class EventStats(BaseModel):
    total: int = 0
    by_status: Dict[str, int] = Field(default_factory=dict)
    by_category: Dict[str, int] = Field(default_factory=dict)
    upcoming: int = 0
    ongoing: int = 0
    completed: int = 0
    cancelled: int = 0


class ClubStats(BaseModel):
    total: int = 0
    active: int = 0
    inactive: int = 0
    by_category: Dict[str, int] = Field(default_factory=dict)


class ParticipationStats(BaseModel):
    total_registrations: int = 0
    confirmed_registrations: int = 0
    cancelled_registrations: int = 0
    total_attendance_records: int = 0
    attended: int = 0
    attendance_rate_pct: float = 0.0


class FeedbackStats(BaseModel):
    total_responses: int = 0
    average_rating: float = 0.0
    rating_distribution: Dict[str, int] = Field(default_factory=dict)


class FinancialStats(BaseModel):
    """Only returned for admin role."""
    total_amount: float = 0.0
    currency: str = "USD"
    total_records: int = 0
    by_category: Dict[str, float] = Field(default_factory=dict)
    by_status: Dict[str, int] = Field(default_factory=dict)
    pending_amount: float = 0.0
    approved_amount: float = 0.0
    paid_amount: float = 0.0


class DocumentStats(BaseModel):
    total: int = 0
    vectorized: int = 0
    failed: int = 0
    by_classification: Dict[str, int] = Field(default_factory=dict)


class InstitutionalSummary(BaseModel):
    """Full institutional analytics summary. Financial data omitted for non-admin roles."""
    role: str
    events: EventStats = Field(default_factory=EventStats)
    clubs: ClubStats = Field(default_factory=ClubStats)
    participation: ParticipationStats = Field(default_factory=ParticipationStats)
    feedback: FeedbackStats = Field(default_factory=FeedbackStats)
    documents: DocumentStats = Field(default_factory=DocumentStats)
    financials: Optional[FinancialStats] = None  # None for non-admin
