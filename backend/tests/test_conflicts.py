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
from app.schemas.venues import VenueInDB, VenueCreate
from app.schemas.resources import ResourceInDB, ResourceCreate
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
    venue_repo = BaseRepository[VenueInDB, VenueCreate](db_conn["venues"], VenueInDB)
    res_repo = BaseRepository[ResourceInDB, ResourceCreate](db_conn["resources"], ResourceInDB)
    hashed = get_password_hash("password")
    
    org1 = await user_repo.create(UserCreate(email="org_conf@campus.edu", username="org_conf", role="organizer", display_name="Org", password="password"), password_hash=hashed)
    student = await user_repo.create(UserCreate(email="student_conf@campus.edu", username="student_conf", role="student", display_name="Student", password="password"), password_hash=hashed)
    
    v1 = await venue_repo.create(VenueCreate(name="Hall A", location="B1", capacity=100))
    v2 = await venue_repo.create(VenueCreate(name="Hall B", location="B1", capacity=50))
    
    r1 = await res_repo.create(ResourceCreate(name="Proj", category="Tech", quantity=5))
    
    now = datetime.now(timezone.utc)
    ev_create = EventCreate(
        title="Existing Event", description="Desc", category="Tech", 
        start_datetime=now, end_datetime=now+timedelta(hours=2),
        venue_id=v1.id, required_resource_ids=[r1.id],
        expected_participants=2, target_audience=["Students", "Tech"], created_by=org1.id
    )
    event = await event_repo.create(ev_create)
    
    yield {
        "db": db_conn,
        "org1": org1, "student": student, "event": event, "v1": v1, "v2": v2, "r1": r1,
        "org1_token": create_access_token(str(org1.id), "organizer"),
        "student_token": create_access_token(str(student.id), "student"),
        "now": now
    }
    
    # Teardown
    await db_conn["users"].delete_many({"email": {"$regex": "_conf@campus.edu"}})
    await db_conn["events"].delete_many({"title": "Existing Event"})
    await db_conn["venues"].delete_many({"name": {"$regex": "Hall"}})
    await db_conn["resources"].delete_many({"name": "Proj"})
    await close_mongo_connection()

@pytest.mark.asyncio
async def test_detect_conflicts(setup_db: Any):
    client = AsyncClient(transport=ASGITransport(app=app), base_url="http://test")
    ctx = setup_db
    now = ctx["now"]
    
    headers = {"Authorization": f"Bearer {ctx['org1_token']}"}
    
    # 22. Unauthenticated conflict request -> rejected
    resp = await client.post("/api/v1/events/detect-conflicts", json={
        "title": "New Event", "start_datetime": now.isoformat(), "end_datetime": (now+timedelta(hours=1)).isoformat()
    })
    assert resp.status_code == 401
    
    # 25. Unauthorized student cannot use conflict detection -> rejected
    resp = await client.post("/api/v1/events/detect-conflicts", json={
        "title": "New Event", "start_datetime": now.isoformat(), "end_datetime": (now+timedelta(hours=1)).isoformat()
    }, headers={"Authorization": f"Bearer {ctx['student_token']}"})
    assert resp.status_code == 403
    
    # 1. Non-overlapping events -> no time conflict
    resp = await client.post("/api/v1/events/detect-conflicts", json={
        "title": "New Event", "start_datetime": (now+timedelta(hours=3)).isoformat(), "end_datetime": (now+timedelta(hours=5)).isoformat()
    }, headers=headers)
    data = resp.json()
    assert data["has_conflicts"] == False
    
    # 2 & 9. Partially overlapping + same venue -> venue conflict (CRITICAL)
    resp = await client.post("/api/v1/events/detect-conflicts", json={
        "title": "New Event", "start_datetime": (now+timedelta(hours=1)).isoformat(), "end_datetime": (now+timedelta(hours=3)).isoformat(),
        "venue_id": str(ctx["v1"].id)
    }, headers=headers)
    data = resp.json()
    assert data["has_conflicts"] == True
    assert any(c["conflict_type"] == "VENUE" and c["severity"] == "CRITICAL" for c in data["conflicts"])
    
    # 11. Overlapping time + different venue -> NO venue conflict
    resp = await client.post("/api/v1/events/detect-conflicts", json={
        "title": "New Event", "start_datetime": (now+timedelta(hours=1)).isoformat(), "end_datetime": (now+timedelta(hours=3)).isoformat(),
        "venue_id": str(ctx["v2"].id)
    }, headers=headers)
    data = resp.json()
    assert not any(c["conflict_type"] == "VENUE" for c in data["conflicts"])
    
    # 13. Same resource + overlapping time -> resource conflict
    resp = await client.post("/api/v1/events/detect-conflicts", json={
        "title": "New Event", "start_datetime": (now+timedelta(hours=1)).isoformat(), "end_datetime": (now+timedelta(hours=3)).isoformat(),
        "required_resource_ids": [str(ctx["r1"].id)]
    }, headers=headers)
    data = resp.json()
    assert any(c["conflict_type"] == "RESOURCE" for c in data["conflicts"])
    
    # 18 & 19. Audience overlap calculations
    resp = await client.post("/api/v1/events/detect-conflicts", json={
        "title": "New Event", "start_datetime": (now+timedelta(hours=1)).isoformat(), "end_datetime": (now+timedelta(hours=3)).isoformat(),
        "target_audience": ["Tech"]
    }, headers=headers)
    data = resp.json()
    assert len(data["audience_overlaps"]) > 0
    assert data["audience_overlaps"][0]["overlap_score"] > 0
    
    # 8. Exclude self during update
    resp = await client.post("/api/v1/events/detect-conflicts", json={
        "event_id": str(ctx["event"].id),
        "title": "Updated Event", "start_datetime": now.isoformat(), "end_datetime": (now+timedelta(hours=2)).isoformat(),
        "venue_id": str(ctx["v1"].id)
    }, headers=headers)
    data = resp.json()
    assert data["has_conflicts"] == False

    # 7. Invalid datetime range
    resp = await client.post("/api/v1/events/detect-conflicts", json={
        "title": "New Event", "start_datetime": now.isoformat(), "end_datetime": (now-timedelta(hours=1)).isoformat()
    }, headers=headers)
    assert resp.status_code == 422

    await client.aclose()
