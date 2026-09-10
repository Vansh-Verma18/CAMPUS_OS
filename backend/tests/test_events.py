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
from app.security.jwt import create_access_token

@pytest_asyncio.fixture(scope="function")
async def setup_db():
    await connect_to_mongo()
    db_conn = get_database()
    if db_conn is None:
        pytest.skip("MongoDB is not available.")
    await setup_indexes()
    
    user_repo = BaseRepository[UserInDB, UserCreate](db_conn["users"], UserInDB)
    hashed = get_password_hash("password")
    
    admin = await user_repo.create(UserCreate(email="admin_ev@campus.edu", username="admin_ev", role="admin", display_name="Admin", password="password"), password_hash=hashed)
    org1 = await user_repo.create(UserCreate(email="org1_ev@campus.edu", username="org1_ev", role="organizer", display_name="Org1", password="password"), password_hash=hashed)
    org2 = await user_repo.create(UserCreate(email="org2_ev@campus.edu", username="org2_ev", role="organizer", display_name="Org2", password="password"), password_hash=hashed)
    student = await user_repo.create(UserCreate(email="student_ev@campus.edu", username="student_ev", role="student", display_name="Student", password="password"), password_hash=hashed)
    
    yield {
        "db": db_conn,
        "admin": admin, "org1": org1, "org2": org2, "student": student,
        "admin_token": create_access_token(str(admin.id), "admin"),
        "org1_token": create_access_token(str(org1.id), "organizer"),
        "org2_token": create_access_token(str(org2.id), "organizer"),
        "student_token": create_access_token(str(student.id), "student")
    }
    
    # Teardown
    await db_conn["users"].delete_many({"email": {"$regex": "_ev@campus.edu"}})
    await db_conn["events"].delete_many({"title": {"$regex": "Test Event"}})
    await close_mongo_connection()

@pytest.mark.asyncio
async def test_events(setup_db: Any):
    client = AsyncClient(transport=ASGITransport(app=app), base_url="http://test")
    ctx = setup_db
    now = datetime.now(timezone.utc)
    
    # 5. Authorized event creation succeeds.
    resp = await client.post("/api/v1/events", json={
        "title": "Test Event 1",
        "description": "Desc",
        "category": "Tech",
        "start_datetime": (now + timedelta(days=1)).isoformat(),
        "end_datetime": (now + timedelta(days=1, hours=2)).isoformat(),
        "expected_participants": 50,
        "target_audience": ["All"]
    }, headers={"Authorization": f"Bearer {ctx['org1_token']}"})
    assert resp.status_code == 200
    ev_1 = resp.json()
    assert ev_1["title"] == "Test Event 1"
    
    # 6. Event retrieval succeeds.
    resp = await client.get(f"/api/v1/events/{ev_1['_id']}", headers={"Authorization": f"Bearer {ctx['student_token']}"})
    assert resp.status_code == 200
    assert resp.json()["_id"] == ev_1["_id"]
    
    # 7. Event update by authorized owner succeeds.
    resp = await client.put(f"/api/v1/events/{ev_1['_id']}", json={
        "title": "Test Event 1 Updated",
        "description": "Desc",
        "category": "Tech",
        "start_datetime": (now + timedelta(days=1)).isoformat(),
        "end_datetime": (now + timedelta(days=1, hours=2)).isoformat(),
        "expected_participants": 50,
        "target_audience": ["All"]
    }, headers={"Authorization": f"Bearer {ctx['org1_token']}"})
    assert resp.status_code == 200
    assert resp.json()["title"] == "Test Event 1 Updated"
    
    # 8. Another organizer cannot modify the event.
    resp = await client.put(f"/api/v1/events/{ev_1['_id']}", json={
        "title": "Test Event 1 Hacked",
        "description": "Desc",
        "category": "Tech",
        "start_datetime": (now + timedelta(days=1)).isoformat(),
        "end_datetime": (now + timedelta(days=1, hours=2)).isoformat(),
        "expected_participants": 50,
        "target_audience": ["All"]
    }, headers={"Authorization": f"Bearer {ctx['org2_token']}"})
    assert resp.status_code == 403
    
    # 9. Invalid datetime range is rejected.
    resp = await client.post("/api/v1/events", json={
        "title": "Test Event 2",
        "description": "Desc",
        "category": "Tech",
        "start_datetime": (now + timedelta(days=1)).isoformat(),
        "end_datetime": (now - timedelta(days=1)).isoformat(), # End before start
        "expected_participants": 50,
        "target_audience": ["All"]
    }, headers={"Authorization": f"Bearer {ctx['org1_token']}"})
    assert resp.status_code == 422
    
    # 10. Invalid references are rejected.
    resp = await client.post("/api/v1/events", json={
        "title": "Test Event 3",
        "description": "Desc",
        "category": "Tech",
        "start_datetime": (now + timedelta(days=1)).isoformat(),
        "end_datetime": (now + timedelta(days=1, hours=2)).isoformat(),
        "expected_participants": 50,
        "target_audience": ["All"],
        "venue_id": "603d2b0e8b2a3f7a8b4e7e9f" # Non-existent venue
    }, headers={"Authorization": f"Bearer {ctx['org1_token']}"})
    assert resp.status_code == 400
    assert "venue does not exist" in resp.json()["detail"]
    
    # 11. Event filtering works.
    resp = await client.get("/api/v1/events?category=Tech", headers={"Authorization": f"Bearer {ctx['student_token']}"})
    assert resp.status_code == 200
    assert len(resp.json()) >= 1
    
    # 12. Event pagination works.
    resp = await client.get("/api/v1/events?limit=1&skip=0", headers={"Authorization": f"Bearer {ctx['student_token']}"})
    assert resp.status_code == 200
    assert len(resp.json()) <= 1

    await client.aclose()
