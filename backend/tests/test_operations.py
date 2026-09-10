import pytest
import pytest_asyncio
from typing import Any
from datetime import datetime, timedelta, timezone
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db.mongodb import connect_to_mongo, close_mongo_connection, get_database
from app.db.indexes import setup_indexes
from app.security.password import get_password_hash
from app.repositories.base import BaseRepository
from app.schemas.users import UserInDB, UserCreate
from app.schemas.events import EventInDB, EventCreate
from app.security.jwt import create_access_token

@pytest_asyncio.fixture(scope="function")
async def setup_db():
    await connect_to_mongo()
    db_conn = get_database()
    if db_conn is None:
        pytest.skip("MongoDB is not available.")
    await setup_indexes()
    
    user_repo = BaseRepository[UserInDB, UserCreate](db_conn["users"], UserInDB)
    event_repo = BaseRepository[EventInDB, EventCreate](db_conn["events"], EventInDB)
    hashed = get_password_hash("password")
    
    admin = await user_repo.create(UserCreate(email="admin_op@campus.edu", username="admin_op", role="admin", display_name="Admin", password="password"), password_hash=hashed)
    org1 = await user_repo.create(UserCreate(email="org1_op@campus.edu", username="org1_op", role="organizer", display_name="Org1", password="password"), password_hash=hashed)
    org2 = await user_repo.create(UserCreate(email="org2_op@campus.edu", username="org2_op", role="organizer", display_name="Org2", password="password"), password_hash=hashed)
    student = await user_repo.create(UserCreate(email="student_op@campus.edu", username="student_op", role="student", display_name="Student", password="password"), password_hash=hashed)
    
    now = datetime.now(timezone.utc)
    ev_create = EventCreate(
        title="Test Event Op", description="Desc", category="Tech", 
        start_datetime=now, end_datetime=now+timedelta(hours=2),
        expected_participants=2, target_audience=["All"], created_by=org1.id
    )
    event = await event_repo.create(ev_create)
    
    yield {
        "db": db_conn,
        "admin": admin, "org1": org1, "org2": org2, "student": student, "event": event,
        "admin_token": create_access_token(str(admin.id), "admin"),
        "org1_token": create_access_token(str(org1.id), "organizer"),
        "org2_token": create_access_token(str(org2.id), "organizer"),
        "student_token": create_access_token(str(student.id), "student")
    }
    
    # Teardown
    await db_conn["users"].delete_many({"email": {"$regex": "_op@campus.edu"}})
    await db_conn["events"].delete_many({"title": "Test Event Op"})
    await db_conn["registrations"].delete_many({"event_id": event.id})
    await db_conn["attendance"].delete_many({"event_id": event.id})
    await db_conn["feedback"].delete_many({"event_id": event.id})
    await db_conn["expenses"].delete_many({"event_id": event.id})
    await close_mongo_connection()

@pytest.mark.asyncio
async def test_registrations(setup_db: Any):
    client = AsyncClient(transport=ASGITransport(app=app), base_url="http://test")
    ctx = setup_db
    ev_id = str(ctx['event'].id)
    
    # 19. Registration succeeds.
    resp = await client.post(f"/api/v1/events/{ev_id}/registrations", headers={"Authorization": f"Bearer {ctx['student_token']}"})
    assert resp.status_code == 200
    
    # 20. Duplicate registration is rejected.
    resp2 = await client.post(f"/api/v1/events/{ev_id}/registrations", headers={"Authorization": f"Bearer {ctx['student_token']}"})
    assert resp2.status_code == 400
    
    # 21. User can retrieve own registrations.
    resp3 = await client.get("/api/v1/registrations/me", headers={"Authorization": f"Bearer {ctx['student_token']}"})
    assert resp3.status_code == 200
    assert len(resp3.json()) == 1
    
    # 22. User cannot retrieve another user's private registration information.
    # Student attempts to get all registrations for the event
    resp4 = await client.get(f"/api/v1/events/{ev_id}/registrations", headers={"Authorization": f"Bearer {ctx['student_token']}"})
    assert resp4.status_code == 403
    
    # Org1 can view registrations
    resp5 = await client.get(f"/api/v1/events/{ev_id}/registrations", headers={"Authorization": f"Bearer {ctx['org1_token']}"})
    assert resp5.status_code == 200
    
    # Org2 cannot view Org1's event registrations
    resp6 = await client.get(f"/api/v1/events/{ev_id}/registrations", headers={"Authorization": f"Bearer {ctx['org2_token']}"})
    assert resp6.status_code == 403
    
    # 23. Registration for a nonexistent event is rejected.
    resp7 = await client.post("/api/v1/events/603d2b0e8b2a3f7a8b4e7e9f/registrations", headers={"Authorization": f"Bearer {ctx['student_token']}"})
    assert resp7.status_code == 404
    
    await client.aclose()

@pytest.mark.asyncio
async def test_attendance(setup_db: Any):
    client = AsyncClient(transport=ASGITransport(app=app), base_url="http://test")
    ctx = setup_db
    ev_id = str(ctx['event'].id)
    stu_id = str(ctx['student'].id)
    
    # 26. Unauthorized attendance operation is rejected.
    resp = await client.post(f"/api/v1/events/{ev_id}/attendance", json={
        "user_id": stu_id,
        "status": "attended"
    }, headers={"Authorization": f"Bearer {ctx['student_token']}"})
    assert resp.status_code == 403
    
    # 25. Authorized attendance operation succeeds.
    resp2 = await client.post(f"/api/v1/events/{ev_id}/attendance", json={
        "user_id": stu_id,
        "status": "attended"
    }, headers={"Authorization": f"Bearer {ctx['org1_token']}"})
    assert resp2.status_code == 200
    
    # 27. User can retrieve own attendance.
    resp3 = await client.get("/api/v1/attendance/me", headers={"Authorization": f"Bearer {ctx['student_token']}"})
    assert resp3.status_code == 200
    assert len(resp3.json()) == 1

    await client.aclose()

@pytest.mark.asyncio
async def test_feedback(setup_db: Any):
    client = AsyncClient(transport=ASGITransport(app=app), base_url="http://test")
    ctx = setup_db
    ev_id = str(ctx['event'].id)
    
    # 28. Feedback submission succeeds.
    resp = await client.post(f"/api/v1/events/{ev_id}/feedback", json={
        "rating": 5,
        "comments": "Great"
    }, headers={"Authorization": f"Bearer {ctx['student_token']}"})
    assert resp.status_code == 200
    
    # 29. Invalid rating is rejected.
    resp2 = await client.post(f"/api/v1/events/{ev_id}/feedback", json={
        "rating": 10,
        "comments": "Great"
    }, headers={"Authorization": f"Bearer {ctx['admin_token']}"})
    assert resp2.status_code == 422
    
    # 30. Duplicate feedback is handled according to the defined rule.
    resp3 = await client.post(f"/api/v1/events/{ev_id}/feedback", json={
        "rating": 4,
        "comments": "Good"
    }, headers={"Authorization": f"Bearer {ctx['student_token']}"})
    assert resp3.status_code == 400
    
    # 31. Unauthorized feedback access is rejected.
    resp4 = await client.get(f"/api/v1/events/{ev_id}/feedback", headers={"Authorization": f"Bearer {ctx['student_token']}"})
    assert resp4.status_code == 403
    
    # Org1 can view feedback
    resp5 = await client.get(f"/api/v1/events/{ev_id}/feedback", headers={"Authorization": f"Bearer {ctx['org1_token']}"})
    assert resp5.status_code == 200

    await client.aclose()

@pytest.mark.asyncio
async def test_expenses(setup_db: Any):
    client = AsyncClient(transport=ASGITransport(app=app), base_url="http://test")
    ctx = setup_db
    ev_id = str(ctx['event'].id)
    
    now = datetime.now(timezone.utc).isoformat()
    # 32. Authorized expense creation succeeds.
    resp = await client.post(f"/api/v1/events/{ev_id}/expenses", json={
        "category": "Food",
        "amount": 100.0,
        "currency": "USD",
        "description": "Pizza",
        "date": now,
        "status": "pending"
    }, headers={"Authorization": f"Bearer {ctx['org1_token']}"})
    assert resp.status_code == 200
    exp_id = resp.json()["_id"]
    
    # 33. Negative expense is rejected.
    resp2 = await client.post(f"/api/v1/events/{ev_id}/expenses", json={
        "category": "Food",
        "amount": -100.0,
        "currency": "USD",
        "description": "Pizza",
        "date": now,
        "status": "pending"
    }, headers={"Authorization": f"Bearer {ctx['org1_token']}"})
    assert resp2.status_code == 422
    
    # 34. Student cannot access protected expenses.
    resp3 = await client.get(f"/api/v1/events/{ev_id}/expenses", headers={"Authorization": f"Bearer {ctx['student_token']}"})
    assert resp3.status_code == 403
    
    # 35. Unauthorized expense modification is rejected.
    resp4 = await client.put(f"/api/v1/expenses/{exp_id}", json={
        "category": "Food",
        "amount": 150.0,
        "currency": "USD",
        "description": "Pizza",
        "date": now,
        "status": "pending"
    }, headers={"Authorization": f"Bearer {ctx['org2_token']}"})
    assert resp4.status_code == 403
    
    resp5 = await client.put(f"/api/v1/expenses/{exp_id}", json={
        "category": "Food",
        "amount": 150.0,
        "currency": "USD",
        "description": "Pizza",
        "date": now,
        "status": "pending"
    }, headers={"Authorization": f"Bearer {ctx['student_token']}"})
    assert resp5.status_code == 403
    
    # Org1 can modify
    resp6 = await client.put(f"/api/v1/expenses/{exp_id}", json={
        "category": "Food",
        "amount": 150.0,
        "currency": "USD",
        "description": "Pizza",
        "date": now,
        "status": "pending"
    }, headers={"Authorization": f"Bearer {ctx['org1_token']}"})
    assert resp6.status_code == 200
    assert resp6.json()["amount"] == 150.0

    await client.aclose()
