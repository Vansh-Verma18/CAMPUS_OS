"""
AI Operations Agent API Route

POST /api/v1/ai/query

Security:
  - Requires authenticated JWT (via get_current_active_user dependency)
  - Role is NEVER accepted from request body — always sourced from JWT
  - Provider failures are caught and returned as HTTP 503

Responsibilities of this route:
  - Authentication & request validation only
  - Delegates all business logic to AIAgentService
  - Formats the structured response
"""
from fastapi import APIRouter, Depends, HTTPException, status
import logging

from app.api.deps import get_current_active_user
from app.schemas.users import UserInDB
from app.schemas.ai import AIQueryRequest, AIQueryResponse, AIClaim, ClaimType

router = APIRouter()
logger = logging.getLogger(__name__)


def _get_ai_agent_service():  # type: ignore[return]
    """
    Dependency factory for AIAgentService.
    Imports here to avoid circular imports and to allow mocking in tests.
    """
    from app.db.mongodb import get_database
    from app.repositories.base import BaseRepository
    from app.schemas.events import EventInDB, EventCreate
    from app.schemas.clubs import ClubInDB, ClubCreate
    from app.schemas.venues import VenueInDB, VenueCreate
    from app.schemas.resources import ResourceInDB, ResourceCreate
    from app.schemas.registrations import RegistrationInDB, RegistrationCreate
    from app.schemas.attendance import AttendanceInDB, AttendanceCreate
    from app.schemas.feedback import FeedbackInDB, FeedbackCreate
    from app.schemas.expenses import ExpenseInDB, ExpenseCreate
    from app.services.ai_retrieval import AIRetrievalService
    from app.services.ai_agent import AIAgentService
    from app.services.ai_provider import get_ai_provider

    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    try:
        provider = get_ai_provider()
    except Exception as exc:
        logger.error("AI provider init failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service is not configured. Please contact the administrator."
        )

    retrieval = AIRetrievalService(
        event_repo=BaseRepository[EventInDB, EventCreate](db["events"], EventInDB),
        club_repo=BaseRepository[ClubInDB, ClubCreate](db["clubs"], ClubInDB),
        venue_repo=BaseRepository[VenueInDB, VenueCreate](db["venues"], VenueInDB),
        resource_repo=BaseRepository[ResourceInDB, ResourceCreate](db["resources"], ResourceInDB),
        registration_repo=BaseRepository[RegistrationInDB, RegistrationCreate](db["registrations"], RegistrationInDB),
        attendance_repo=BaseRepository[AttendanceInDB, AttendanceCreate](db["attendance"], AttendanceInDB),
        feedback_repo=BaseRepository[FeedbackInDB, FeedbackCreate](db["feedback"], FeedbackInDB),
        expense_repo=BaseRepository[ExpenseInDB, ExpenseCreate](db["expenses"], ExpenseInDB),
        ai_provider=provider,
    )

    return AIAgentService(retrieval_service=retrieval, provider=provider)


@router.post(
    "/query",
    response_model=AIQueryResponse,
    summary="Query the CampusOS AI Operations Agent",
    description=(
        "Submit a natural language question about institutional data. "
        "The response is permission-scoped to the authenticated user's role. "
        "Role is determined from the JWT — never from the request body."
    ),
)
async def query_ai(
    request: AIQueryRequest,
    current_user: UserInDB = Depends(get_current_active_user),
):
    """
    POST /api/v1/ai/query

    Security contract:
      - user identity and role are read from the validated JWT
      - the request body MUST NOT contain a role field (schema enforces this)
      - data retrieved is scoped to the user's authorised role
      - LLM provider failures return HTTP 503, never hallucinated data
    """
    try:
        agent_service = _get_ai_agent_service()
        response = await agent_service.process_query(request, current_user)
        return response
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(
            "Unexpected error in AI query for user=%s: %s",
            str(current_user.id), exc
        )
        # Safe fallback — never propagate internal errors to client
        return AIQueryResponse(
            answer="The AI Operations Agent encountered an unexpected error. Please try again.",
            claims=[AIClaim(
                type=ClaimType.INSUFFICIENT_EVIDENCE,
                text="Unexpected server error — cannot complete query.",
                source=None
            )],
            recommendations=[],
            sources=[],
            role_context=current_user.role,
        )
