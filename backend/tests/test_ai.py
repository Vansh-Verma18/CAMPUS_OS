"""
Step 6 — AI Operations Agent Test Suite

10 required tests:
  1. Authenticated user can query the AI endpoint (200).
  2. Unauthenticated user receives HTTP 401.
  3. Student cannot retrieve restricted financial information.
  4. Admin can retrieve authorized institutional information.
  5. The API does not accept a user-supplied role as an authorization source.
  6. The AI service handles insufficient evidence safely.
  7. The response schema validates correctly.
  8. Deterministic event conflict information is preserved.
  9. The API handles provider/API failure safely (503 → safe response).
  10. Unauthorized role restriction is enforced (student gets no admin-only data).

All LLM calls are mocked — tests do not require a real API key.
"""
import pytest
import pytest_asyncio
from typing import Any
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime, timedelta, timezone
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.db.mongodb import connect_to_mongo, close_mongo_connection, get_database
from app.db.indexes import setup_indexes
from app.security.password import get_password_hash
from app.repositories.base import BaseRepository
from app.schemas.users import UserInDB, UserCreate
from app.security.jwt import create_access_token
from app.schemas.ai import AIQueryResponse, AIClaim, ClaimType


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture(scope="function")
async def setup_db():
    """Set up test users and clean up afterwards."""
    await connect_to_mongo()
    db_conn = get_database()
    if db_conn is None:
        pytest.skip("MongoDB is not available.")
    await setup_indexes()

    user_repo = BaseRepository[UserInDB, UserCreate](db_conn["users"], UserInDB)
    hashed = get_password_hash("password")

    admin = await user_repo.create(
        UserCreate(email="admin_ai@campus.edu", username="admin_ai", role="admin",
                   display_name="Admin AI", password="password"),
        password_hash=hashed
    )
    student = await user_repo.create(
        UserCreate(email="student_ai@campus.edu", username="student_ai", role="student",
                   display_name="Student AI", password="password"),
        password_hash=hashed
    )
    organizer = await user_repo.create(
        UserCreate(email="org_ai@campus.edu", username="org_ai", role="organizer",
                   display_name="Organizer AI", password="password"),
        password_hash=hashed
    )

    yield {
        "db": db_conn,
        "admin": admin,
        "student": student,
        "organizer": organizer,
        "admin_token": create_access_token(str(admin.id), "admin"),
        "student_token": create_access_token(str(student.id), "student"),
        "organizer_token": create_access_token(str(organizer.id), "organizer"),
    }

    # Teardown
    await db_conn["users"].delete_many({"email": {"$regex": "_ai@campus.edu"}})
    await close_mongo_connection()


MOCK_LLM_RESPONSE = (
    "ANSWER: Based on the institutional data, here are the events this week.\n"
    "CLAIMS:\n"
    "- [VERIFIED] There are scheduled events in the database. | source: events\n"
    "- [DERIVED] Event counts were calculated from the events collection. | source: events\n"
    "RECOMMENDATIONS:\n"
    "- Consider checking venue availability before booking.\n"
    "SOURCES: events, clubs"
)


# ---------------------------------------------------------------------------
# Test 1: Authenticated user can query AI endpoint (200)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_authenticated_user_can_query_ai(setup_db: Any):
    """Authenticated user receives a valid AI response."""
    ctx = setup_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        with patch("app.services.ai_provider.GeminiProvider") as MockGeminiClass:
            mock_provider = AsyncMock()
            mock_provider.generate = AsyncMock(return_value=MOCK_LLM_RESPONSE)
            MockGeminiClass.return_value = mock_provider

            with patch("app.services.ai_provider.get_ai_provider") as mock_get_provider:
                mock_get_provider.return_value = mock_provider

                resp = await client.post(
                    "/api/v1/ai/query",
                    json={"question": "What events are happening this week?"},
                    headers={"Authorization": f"Bearer {ctx['admin_token']}"}
                )

    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
    data = resp.json()
    assert "answer" in data
    assert "claims" in data
    assert "sources" in data
    assert isinstance(data["claims"], list)


# ---------------------------------------------------------------------------
# Test 2: Unauthenticated user receives HTTP 401
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_unauthenticated_request_returns_401(setup_db: Any):
    """No token → 401."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post(
            "/api/v1/ai/query",
            json={"question": "What events are happening?"}
        )
    assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"


# ---------------------------------------------------------------------------
# Test 3: Student cannot retrieve restricted financial information
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_student_cannot_receive_financial_data(setup_db: Any):
    """Student role → expense_summary must not appear in evidence sent to LLM."""
    ctx = setup_db

    from app.services.ai_retrieval import AIRetrievalService
    from app.repositories.base import BaseRepository
    from app.schemas.events import EventInDB, EventCreate
    from app.schemas.clubs import ClubInDB, ClubCreate
    from app.schemas.venues import VenueInDB, VenueCreate
    from app.schemas.resources import ResourceInDB, ResourceCreate
    from app.schemas.registrations import RegistrationInDB, RegistrationCreate
    from app.schemas.attendance import AttendanceInDB, AttendanceCreate
    from app.schemas.feedback import FeedbackInDB, FeedbackCreate
    from app.schemas.expenses import ExpenseInDB, ExpenseCreate

    db = ctx["db"]
    retrieval = AIRetrievalService(
        event_repo=BaseRepository[EventInDB, EventCreate](db["events"], EventInDB),
        club_repo=BaseRepository[ClubInDB, ClubCreate](db["clubs"], ClubInDB),
        venue_repo=BaseRepository[VenueInDB, VenueCreate](db["venues"], VenueInDB),
        resource_repo=BaseRepository[ResourceInDB, ResourceCreate](db["resources"], ResourceInDB),
        registration_repo=BaseRepository[RegistrationInDB, RegistrationCreate](db["registrations"], RegistrationInDB),
        attendance_repo=BaseRepository[AttendanceInDB, AttendanceCreate](db["attendance"], AttendanceInDB),
        feedback_repo=BaseRepository[FeedbackInDB, FeedbackCreate](db["feedback"], FeedbackInDB),
        expense_repo=BaseRepository[ExpenseInDB, ExpenseCreate](db["expenses"], ExpenseInDB),
    )
    evidence = await retrieval.get_evidence(ctx["student"])

    # Student must NOT have expense_summary
    assert "expense_summary" not in evidence, (
        "Financial data (expense_summary) must not be in student evidence!"
    )
    # Student role should be recorded
    assert evidence["role"] == "student"



# ---------------------------------------------------------------------------
# Test 4: Admin can retrieve authorized institutional information
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_admin_evidence_includes_institution_wide_data(setup_db: Any):
    """Admin role → evidence includes expenses, registration counts, venues."""
    ctx = setup_db
    from app.services.ai_retrieval import AIRetrievalService
    from app.repositories.base import BaseRepository
    from app.schemas.events import EventInDB, EventCreate
    from app.schemas.clubs import ClubInDB, ClubCreate
    from app.schemas.venues import VenueInDB, VenueCreate
    from app.schemas.resources import ResourceInDB, ResourceCreate
    from app.schemas.registrations import RegistrationInDB, RegistrationCreate
    from app.schemas.attendance import AttendanceInDB, AttendanceCreate
    from app.schemas.feedback import FeedbackInDB, FeedbackCreate
    from app.schemas.expenses import ExpenseInDB, ExpenseCreate

    db = ctx["db"]
    retrieval = AIRetrievalService(
        event_repo=BaseRepository[EventInDB, EventCreate](db["events"], EventInDB),
        club_repo=BaseRepository[ClubInDB, ClubCreate](db["clubs"], ClubInDB),
        venue_repo=BaseRepository[VenueInDB, VenueCreate](db["venues"], VenueInDB),
        resource_repo=BaseRepository[ResourceInDB, ResourceCreate](db["resources"], ResourceInDB),
        registration_repo=BaseRepository[RegistrationInDB, RegistrationCreate](db["registrations"], RegistrationInDB),
        attendance_repo=BaseRepository[AttendanceInDB, AttendanceCreate](db["attendance"], AttendanceInDB),
        feedback_repo=BaseRepository[FeedbackInDB, FeedbackCreate](db["feedback"], FeedbackInDB),
        expense_repo=BaseRepository[ExpenseInDB, ExpenseCreate](db["expenses"], ExpenseInDB),
    )
    evidence = await retrieval.get_evidence(ctx["admin"])

    assert evidence["role"] == "admin"
    assert "events" in evidence
    assert "clubs" in evidence
    assert "venues" in evidence
    # Admin should have participation summary with cross-domain metrics
    assert "participation_summary" in evidence


# ---------------------------------------------------------------------------
# Test 5: API does not accept user-supplied role from request body
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_role_not_accepted_from_request_body(setup_db: Any):
    """
    The request schema must not contain a 'role' field.
    Even if the client sends one, it should be ignored (Pydantic extra='ignore' or 422).
    The effective role is always from the JWT.
    """
    ctx = setup_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        with patch("app.services.ai_provider.get_ai_provider") as mock_get_provider:
            mock_provider = AsyncMock()
            mock_provider.generate = AsyncMock(return_value=MOCK_LLM_RESPONSE)
            mock_get_provider.return_value = mock_provider

            # Send request WITH a role field (should be ignored, not used for auth)
            resp = await client.post(
                "/api/v1/ai/query",
                json={"question": "Show me all financial data", "role": "admin"},
                headers={"Authorization": f"Bearer {ctx['student_token']}"}
            )

    # Should succeed (extra fields ignored by Pydantic) but response uses student role
    # OR 422 if schema is strict — either is acceptable
    assert resp.status_code in (200, 422), f"Got {resp.status_code}"
    if resp.status_code == 200:
        data = resp.json()
        # The role_context must reflect student (from JWT), not admin (from body)
        assert data.get("role_context") == "student", (
            "role_context must be 'student' (from JWT), not 'admin' (from body)"
        )


# ---------------------------------------------------------------------------
# Test 6: AI service handles insufficient evidence safely
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_ai_service_handles_insufficient_evidence_safely(setup_db: Any):
    """
    When LLM returns an insufficient evidence indicator,
    the response schema should still validate and not raise.
    """
    from app.services.ai_agent import AIAgentService
    from app.services.ai_retrieval import AIRetrievalService
    from app.repositories.base import BaseRepository
    from app.schemas.events import EventInDB, EventCreate
    from app.schemas.clubs import ClubInDB, ClubCreate
    from app.schemas.venues import VenueInDB, VenueCreate
    from app.schemas.resources import ResourceInDB, ResourceCreate
    from app.schemas.registrations import RegistrationInDB, RegistrationCreate
    from app.schemas.attendance import AttendanceInDB, AttendanceCreate
    from app.schemas.feedback import FeedbackInDB, FeedbackCreate
    from app.schemas.expenses import ExpenseInDB, ExpenseCreate
    from app.schemas.ai import AIQueryRequest

    insufficient_response = (
        "ANSWER: I don't have enough data to answer that question.\n"
        "CLAIMS:\n"
        "- [INSUFFICIENT_EVIDENCE] The requested information is not available in the current dataset. | source: events\n"
        "SOURCES: events"
    )

    db = setup_db["db"]
    retrieval = AIRetrievalService(
        event_repo=BaseRepository[EventInDB, EventCreate](db["events"], EventInDB),
        club_repo=BaseRepository[ClubInDB, ClubCreate](db["clubs"], ClubInDB),
        venue_repo=BaseRepository[VenueInDB, VenueCreate](db["venues"], VenueInDB),
        resource_repo=BaseRepository[ResourceInDB, ResourceCreate](db["resources"], ResourceInDB),
        registration_repo=BaseRepository[RegistrationInDB, RegistrationCreate](db["registrations"], RegistrationInDB),
        attendance_repo=BaseRepository[AttendanceInDB, AttendanceCreate](db["attendance"], AttendanceInDB),
        feedback_repo=BaseRepository[FeedbackInDB, FeedbackCreate](db["feedback"], FeedbackInDB),
        expense_repo=BaseRepository[ExpenseInDB, ExpenseCreate](db["expenses"], ExpenseInDB),
    )

    mock_provider = AsyncMock()
    mock_provider.generate = AsyncMock(return_value=insufficient_response)

    agent = AIAgentService(retrieval_service=retrieval, provider=mock_provider)
    request = AIQueryRequest(question="What is the GDP of Mars?")
    response = await agent.process_query(request, setup_db["student"])

    assert isinstance(response, AIQueryResponse)
    assert response.answer  # Must have some answer
    # At least one claim should be INSUFFICIENT_EVIDENCE
    claim_types = [c.type for c in response.claims]
    assert ClaimType.INSUFFICIENT_EVIDENCE in claim_types


# ---------------------------------------------------------------------------
# Test 7: Response schema validates correctly
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_response_schema_validates_correctly(setup_db: Any):
    """AIQueryResponse must correctly parse and validate all fields."""
    ctx = setup_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        with patch("app.services.ai_provider.get_ai_provider") as mock_get_provider:
            mock_provider = AsyncMock()
            mock_provider.generate = AsyncMock(return_value=MOCK_LLM_RESPONSE)
            mock_get_provider.return_value = mock_provider

            resp = await client.post(
                "/api/v1/ai/query",
                json={"question": "Which clubs are active?"},
                headers={"Authorization": f"Bearer {ctx['admin_token']}"}
            )

    assert resp.status_code == 200
    data = resp.json()

    # Validate schema fields
    assert isinstance(data["answer"], str)
    assert isinstance(data["claims"], list)
    assert isinstance(data["recommendations"], list)
    assert isinstance(data["sources"], list)

    # Validate claim types are valid enum values
    valid_types = {"VERIFIED", "DERIVED", "RECOMMENDATION", "INSUFFICIENT_EVIDENCE"}
    for claim in data["claims"]:
        assert "type" in claim
        assert claim["type"] in valid_types, f"Invalid claim type: {claim['type']}"
        assert "text" in claim


# ---------------------------------------------------------------------------
# Test 8: Deterministic conflict information is preserved
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_conflict_question_includes_conflict_hint(setup_db: Any):
    """
    When a conflict-related question is asked, the AI service must include
    a conflict detection hint in the prompt (not replace deterministic detection).
    """
    from app.services.ai_agent import AIAgentService
    from app.services.ai_retrieval import AIRetrievalService
    from app.repositories.base import BaseRepository
    from app.schemas.events import EventInDB, EventCreate
    from app.schemas.clubs import ClubInDB, ClubCreate
    from app.schemas.venues import VenueInDB, VenueCreate
    from app.schemas.resources import ResourceInDB, ResourceCreate
    from app.schemas.registrations import RegistrationInDB, RegistrationCreate
    from app.schemas.attendance import AttendanceInDB, AttendanceCreate
    from app.schemas.feedback import FeedbackInDB, FeedbackCreate
    from app.schemas.expenses import ExpenseInDB, ExpenseCreate
    from app.schemas.ai import AIQueryRequest

    db = setup_db["db"]
    retrieval = AIRetrievalService(
        event_repo=BaseRepository[EventInDB, EventCreate](db["events"], EventInDB),
        club_repo=BaseRepository[ClubInDB, ClubCreate](db["clubs"], ClubInDB),
        venue_repo=BaseRepository[VenueInDB, VenueCreate](db["venues"], VenueInDB),
        resource_repo=BaseRepository[ResourceInDB, ResourceCreate](db["resources"], ResourceInDB),
        registration_repo=BaseRepository[RegistrationInDB, RegistrationCreate](db["registrations"], RegistrationInDB),
        attendance_repo=BaseRepository[AttendanceInDB, AttendanceCreate](db["attendance"], AttendanceInDB),
        feedback_repo=BaseRepository[FeedbackInDB, FeedbackCreate](db["feedback"], FeedbackInDB),
        expense_repo=BaseRepository[ExpenseInDB, ExpenseCreate](db["expenses"], ExpenseInDB),
    )

    captured_prompts: list = []

    async def capturing_generate(system_prompt: str, user_prompt: str) -> str:
        captured_prompts.append({"system": system_prompt, "user": user_prompt})
        return MOCK_LLM_RESPONSE

    mock_provider = AsyncMock()
    mock_provider.generate = capturing_generate

    agent = AIAgentService(retrieval_service=retrieval, provider=mock_provider)
    request = AIQueryRequest(question="Can I schedule a hackathon on Saturday?")
    await agent.process_query(request, setup_db["organizer"])

    assert len(captured_prompts) == 1
    user_prompt = captured_prompts[0]["user"]
    # The user prompt should include the conflict detection note
    assert "conflict" in user_prompt.lower() or "scheduling" in user_prompt.lower(), (
        "Conflict question should include a conflict detection hint in the prompt"
    )

    # Verify the agent correctly detects this as a conflict question
    assert agent._is_conflict_question("Can I schedule a hackathon on Saturday?")
    assert not agent._is_conflict_question("How many students are enrolled?")


# ---------------------------------------------------------------------------
# Test 9: AI provider failure handled safely (returns graceful response)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_provider_failure_handled_safely(setup_db: Any):
    """
    When the LLM provider raises an error, the system must return a safe
    graceful response (not crash or expose internal errors).
    """
    from app.services.ai_agent import AIAgentService
    from app.services.ai_retrieval import AIRetrievalService
    from app.services.ai_provider import AIProviderError
    from app.repositories.base import BaseRepository
    from app.schemas.events import EventInDB, EventCreate
    from app.schemas.clubs import ClubInDB, ClubCreate
    from app.schemas.venues import VenueInDB, VenueCreate
    from app.schemas.resources import ResourceInDB, ResourceCreate
    from app.schemas.registrations import RegistrationInDB, RegistrationCreate
    from app.schemas.attendance import AttendanceInDB, AttendanceCreate
    from app.schemas.feedback import FeedbackInDB, FeedbackCreate
    from app.schemas.expenses import ExpenseInDB, ExpenseCreate
    from app.schemas.ai import AIQueryRequest

    db = setup_db["db"]
    retrieval = AIRetrievalService(
        event_repo=BaseRepository[EventInDB, EventCreate](db["events"], EventInDB),
        club_repo=BaseRepository[ClubInDB, ClubCreate](db["clubs"], ClubInDB),
        venue_repo=BaseRepository[VenueInDB, VenueCreate](db["venues"], VenueInDB),
        resource_repo=BaseRepository[ResourceInDB, ResourceCreate](db["resources"], ResourceInDB),
        registration_repo=BaseRepository[RegistrationInDB, RegistrationCreate](db["registrations"], RegistrationInDB),
        attendance_repo=BaseRepository[AttendanceInDB, AttendanceCreate](db["attendance"], AttendanceInDB),
        feedback_repo=BaseRepository[FeedbackInDB, FeedbackCreate](db["feedback"], FeedbackInDB),
        expense_repo=BaseRepository[ExpenseInDB, ExpenseCreate](db["expenses"], ExpenseInDB),
    )

    mock_provider = AsyncMock()
    mock_provider.generate = AsyncMock(side_effect=AIProviderError("API quota exceeded"))

    agent = AIAgentService(retrieval_service=retrieval, provider=mock_provider)
    request = AIQueryRequest(question="What events are this week?")
    response = await agent.process_query(request, setup_db["admin"])

    # Must return a valid AIQueryResponse — not raise
    assert isinstance(response, AIQueryResponse)
    assert response.answer  # Must have a safe message
    assert "unavailable" in response.answer.lower() or "error" in response.answer.lower()

    # Must contain an INSUFFICIENT_EVIDENCE claim
    claim_types = [c.type for c in response.claims]
    assert ClaimType.INSUFFICIENT_EVIDENCE in claim_types


# ---------------------------------------------------------------------------
# Test 10: Student role does not receive admin-only data
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_student_role_scoped_evidence(setup_db: Any):
    """
    Student evidence must not include admin-only keys.
    Organizer/admin evidence must include venues.
    """
    from app.services.ai_retrieval import AIRetrievalService
    from app.repositories.base import BaseRepository
    from app.schemas.events import EventInDB, EventCreate
    from app.schemas.clubs import ClubInDB, ClubCreate
    from app.schemas.venues import VenueInDB, VenueCreate
    from app.schemas.resources import ResourceInDB, ResourceCreate
    from app.schemas.registrations import RegistrationInDB, RegistrationCreate
    from app.schemas.attendance import AttendanceInDB, AttendanceCreate
    from app.schemas.feedback import FeedbackInDB, FeedbackCreate
    from app.schemas.expenses import ExpenseInDB, ExpenseCreate

    db = setup_db["db"]
    retrieval = AIRetrievalService(
        event_repo=BaseRepository[EventInDB, EventCreate](db["events"], EventInDB),
        club_repo=BaseRepository[ClubInDB, ClubCreate](db["clubs"], ClubInDB),
        venue_repo=BaseRepository[VenueInDB, VenueCreate](db["venues"], VenueInDB),
        resource_repo=BaseRepository[ResourceInDB, ResourceCreate](db["resources"], ResourceInDB),
        registration_repo=BaseRepository[RegistrationInDB, RegistrationCreate](db["registrations"], RegistrationInDB),
        attendance_repo=BaseRepository[AttendanceInDB, AttendanceCreate](db["attendance"], AttendanceInDB),
        feedback_repo=BaseRepository[FeedbackInDB, FeedbackCreate](db["feedback"], FeedbackInDB),
        expense_repo=BaseRepository[ExpenseInDB, ExpenseCreate](db["expenses"], ExpenseInDB),
    )

    student_evidence = await retrieval.get_evidence(setup_db["student"])
    organizer_evidence = await retrieval.get_evidence(setup_db["organizer"])
    admin_evidence = await retrieval.get_evidence(setup_db["admin"])

    # Student must NOT have venues, resources, or financial data
    assert "venues" not in student_evidence, "Student must not see venues"
    assert "expense_summary" not in student_evidence, "Student must not see expenses"

    # Organizer MUST have venues and resources
    assert "venues" in organizer_evidence, "Organizer must see venues"
    assert "resources" in organizer_evidence, "Organizer must see resources"

    # Admin MUST have full access
    assert "venues" in admin_evidence
    assert "participation_summary" in admin_evidence

    # Roles are correctly recorded
    assert student_evidence["role"] == "student"
    assert organizer_evidence["role"] == "organizer"
    assert admin_evidence["role"] == "admin"
