"""
Step 8 — Analytics API Router

GET /api/v1/analytics/summary
  - Protected: admin + faculty only.
  - Returns InstitutionalSummary.
  - Financial data (FinancialStats) present only when role == admin.
"""
from typing import Any
from fastapi import APIRouter, Depends

from app.schemas.analytics import InstitutionalSummary
from app.schemas.users import UserInDB
from app.api.deps import get_current_active_user, RoleChecker, get_analytics_service
from app.services.analytics import AnalyticsService

router = APIRouter()

_require_analytics_access = RoleChecker(["admin", "faculty"])


@router.get("/summary", response_model=InstitutionalSummary)
async def get_analytics_summary(
    current_user: UserInDB = Depends(_require_analytics_access),
    analytics_service: AnalyticsService = Depends(get_analytics_service),
) -> Any:
    """
    Returns aggregated institutional analytics.
    - admin: includes financial summary.
    - faculty: excludes financial summary.
    Role is always read from JWT — never from client input.
    """
    return await analytics_service.get_institutional_summary(current_user.role)
