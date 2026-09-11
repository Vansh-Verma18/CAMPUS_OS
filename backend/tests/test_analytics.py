"""
Step 8 — Analytics & Reporting Test Suite
"""
import pytest
import pytest_asyncio
from typing import Any
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport
from datetime import datetime, timezone

from app.main import app
from app.db.mongodb import connect_to_mongo, close_mongo_connection, get_database
from app.db.indexes import setup_indexes
from app.security.password import get_password_hash
from app.repositories.base import BaseRepository
from app.schemas.users import UserInDB, UserCreate
from app.security.jwt import create_access_token
from app.schemas.events import EventInDB, EventCreate
from app.schemas.clubs import ClubInDB, ClubCreate
from app.schemas.registrations import RegistrationInDB, RegistrationCreate
from app.schemas.attendance import AttendanceInDB, AttendanceCreate
from app.schemas.feedback import FeedbackInDB, FeedbackCreate
from app.schemas.expenses import ExpenseInDB, ExpenseCreate


@pytest_asyncio.fixture(scope="function")
async def analytics_db():
    await connect_to_mongo()
    db = get_database()
    if db is None:
        pytest.skip("MongoDB not available.")
    await setup_indexes()

    user_repo = BaseRepository[UserInDB, UserCreate](db["users"], UserInDB)
    hashed = get_password_hash("password")

    admin = await user_repo.create(
        UserCreate(email="admin_analytics@campus.edu", username="admin_analytics",
                   role="admin", display_name="Admin Analytics", password="password"),
        password_hash=hashed
    )
    faculty = await user_repo.create(
        UserCreate(email="faculty_analytics@campus.edu", username="faculty_analytics",
                   role="faculty", display_name="Faculty Analytics", password="password"),
        password_hash=hashed
    )
    organizer = await user_repo.create(
        UserCreate(email="organizer_analytics@campus.edu", username="organizer_analytics",
                   role="organizer", display_name="Organizer Analytics", password="password"),
        password_hash=hashed
    )
    student = await user_repo.create(
        UserCreate(email="student_analytics@campus.edu", username="student_analytics",
                   role="student", display_name="Student Analytics", password="password"),
        password_hash=hashed
    )

    # Seed data
    event_repo = BaseRepository[EventInDB, EventCreate](db["events"], EventInDB)
    club_repo = BaseRepository[ClubInDB, ClubCreate](db["clubs"], ClubInDB)
    reg_repo = BaseRepository[RegistrationInDB, RegistrationCreate](db["registrations"], RegistrationInDB)
    att_repo = BaseRepository[AttendanceInDB, AttendanceCreate](db["attendance"], AttendanceInDB)
    fb_repo = BaseRepository[FeedbackInDB, FeedbackCreate](db["feedback"], FeedbackInDB)
    exp_repo = BaseRepository[ExpenseInDB, ExpenseCreate](db["expenses"], ExpenseInDB)

    now = datetime.now(timezone.utc)
    ev1 = await event_repo.create(EventInDB(
        title="Hackathon", description="Annual hackathon", category="tech",
        start_datetime=now, end_datetime=now, status="scheduled", expected_participants=100,
        created_by=admin.id
    ))
    ev2 = await event_repo.create(EventInDB(
        title="Cultural Fest", description="Cultural event", category="cultural",
        start_datetime=now, end_datetime=now, status="completed", expected_participants=200,
        created_by=admin.id
    ))
    await club_repo.create(ClubInDB(
        name="Coding Club", category="technical", status="active",
        description="Coding club desc", coordinator_id=faculty.id
    ))
    await club_repo.create(ClubInDB(
        name="Drama Club", category="cultural", status="inactive",
        description="Drama club desc", coordinator_id=faculty.id
    ))
    await reg_repo.create(RegistrationInDB(event_id=ev1.id, user_id=student.id, status="registered"))
    await reg_repo.create(RegistrationInDB(event_id=ev1.id, user_id=organizer.id, status="cancelled"))
    await att_repo.create(AttendanceInDB(event_id=ev2.id, user_id=student.id, status="attended"))
    await fb_repo.create(FeedbackInDB(event_id=ev2.id, submitted_by=student.id, rating=4, comments="Great"))
    await fb_repo.create(FeedbackInDB(event_id=ev2.id, submitted_by=organizer.id, rating=5, comments="Excellent"))
    await exp_repo.create(ExpenseInDB(
        event_id=ev1.id, category="equipment", amount=5000.0, currency="USD",
        description="Laptop", date=now, recorded_by=admin.id, status="approved"
    ))
    await exp_repo.create(ExpenseInDB(
        event_id=ev2.id, category="food", amount=2000.0, currency="USD",
        description="Catering", date=now, recorded_by=admin.id, status="paid"
    ))

    yield {
        "admin_token": create_access_token(str(admin.id), "admin"),
        "faculty_token": create_access_token(str(faculty.id), "faculty"),
        "organizer_token": create_access_token(str(organizer.id), "organizer"),
        "student_token": create_access_token(str(student.id), "student"),
    }

    # Teardown
    await db["users"].delete_many({"email": {"$regex": "_analytics@campus.edu"}})
    await db["events"].delete_many({"title": {"$in": ["Hackathon", "Cultural Fest"]}})
    await db["clubs"].delete_many({"name": {"$in": ["Coding Club", "Drama Club"]}})
    await db["registrations"].delete_many({})
    await db["attendance"].delete_many({})
    await db["feedback"].delete_many({})
    await db["expenses"].delete_many({})
    await close_mongo_connection()


# ── Tests ──────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_student_cannot_access_analytics(analytics_db: Any):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get(
            "/api/v1/analytics/summary",
            headers={"Authorization": f"Bearer {analytics_db['student_token']}"}
        )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_organizer_cannot_access_analytics(analytics_db: Any):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get(
            "/api/v1/analytics/summary",
            headers={"Authorization": f"Bearer {analytics_db['organizer_token']}"}
        )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_admin_gets_full_summary_with_financials(analytics_db: Any):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get(
            "/api/v1/analytics/summary",
            headers={"Authorization": f"Bearer {analytics_db['admin_token']}"}
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["role"] == "admin"
    
    # Events
    assert data["events"]["total"] >= 2
    assert "scheduled" in data["events"]["by_status"] or "completed" in data["events"]["by_status"]
    
    # Clubs
    assert data["clubs"]["total"] >= 2
    assert data["clubs"]["active"] >= 1
    
    # Participation
    assert data["participation"]["total_registrations"] >= 2
    
    # Feedback
    assert data["feedback"]["total_responses"] >= 2
    assert 4.0 <= data["feedback"]["average_rating"] <= 5.0
    
    # Financials — admin only
    assert data["financials"] is not None
    assert data["financials"]["total_amount"] >= 7000.0
    assert "equipment" in data["financials"]["by_category"]


@pytest.mark.asyncio
async def test_faculty_gets_summary_without_financials(analytics_db: Any):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get(
            "/api/v1/analytics/summary",
            headers={"Authorization": f"Bearer {analytics_db['faculty_token']}"}
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["role"] == "faculty"
    
    # Core stats present
    assert "events" in data
    assert "clubs" in data
    assert "participation" in data
    assert "feedback" in data
    
    # NO financial data for faculty
    assert data["financials"] is None


@pytest.mark.asyncio
async def test_analytics_response_structure(analytics_db: Any):
    """Verify the response has the complete expected schema."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get(
            "/api/v1/analytics/summary",
            headers={"Authorization": f"Bearer {analytics_db['admin_token']}"}
        )
    assert resp.status_code == 200
    data = resp.json()
    
    # Top-level keys
    for key in ["role", "events", "clubs", "participation", "feedback", "documents", "financials"]:
        assert key in data, f"Missing key: {key}"
    
    # Events sub-keys
    for key in ["total", "by_status", "by_category", "upcoming", "ongoing", "completed", "cancelled"]:
        assert key in data["events"], f"Missing events.{key}"
    
    # Participation sub-keys
    for key in ["total_registrations", "confirmed_registrations", "total_attendance_records", "attended", "attendance_rate_pct"]:
        assert key in data["participation"], f"Missing participation.{key}"
    
    # Financials sub-keys for admin
    for key in ["total_amount", "currency", "total_records", "by_category", "by_status", "pending_amount", "approved_amount", "paid_amount"]:
        assert key in data["financials"], f"Missing financials.{key}"


@pytest.mark.asyncio
async def test_unauthenticated_request_rejected(analytics_db: Any):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/v1/analytics/summary")
    assert resp.status_code == 401
