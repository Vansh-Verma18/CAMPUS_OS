import pytest
import pytest_asyncio
from typing import Any
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
    
    admin = await user_repo.create(UserCreate(email="admin_vr@campus.edu", username="admin_vr", role="admin", display_name="Admin", password="password"), password_hash=hashed)
    student = await user_repo.create(UserCreate(email="student_vr@campus.edu", username="student_vr", role="student", display_name="Student", password="password"), password_hash=hashed)
    
    yield {
        "db": db_conn,
        "admin": admin, "student": student,
        "admin_token": create_access_token(str(admin.id), "admin"),
        "student_token": create_access_token(str(student.id), "student")
    }
    
    # Teardown
    await db_conn["users"].delete_many({"email": {"$regex": "_vr@campus.edu"}})
    await db_conn["venues"].delete_many({"name": {"$regex": "Test Venue"}})
    await db_conn["resources"].delete_many({"name": {"$regex": "Test Resource"}})
    await close_mongo_connection()

@pytest.mark.asyncio
async def test_venues(setup_db: Any):
    client = AsyncClient(transport=ASGITransport(app=app), base_url="http://test")
    ctx = setup_db
    
    # 13. Authorized venue creation succeeds.
    resp = await client.post("/api/v1/venues", json={
        "name": "Test Venue 1",
        "location": "B1",
        "capacity": 50
    }, headers={"Authorization": f"Bearer {ctx['admin_token']}"})
    assert resp.status_code == 200
    venue_1 = resp.json()
    assert venue_1["name"] == "Test Venue 1"
    
    # 14. Invalid capacity is rejected.
    resp = await client.post("/api/v1/venues", json={
        "name": "Test Venue 2",
        "location": "B1",
        "capacity": -10
    }, headers={"Authorization": f"Bearer {ctx['admin_token']}"})
    assert resp.status_code == 422 # Pydantic validation error
    
    # 15. Student cannot modify venue.
    resp = await client.put(f"/api/v1/venues/{venue_1['_id']}", json={
        "name": "Test Venue 1",
        "location": "B1",
        "capacity": 60
    }, headers={"Authorization": f"Bearer {ctx['student_token']}"})
    assert resp.status_code == 403

    await client.aclose()

@pytest.mark.asyncio
async def test_resources(setup_db: Any):
    client = AsyncClient(transport=ASGITransport(app=app), base_url="http://test")
    ctx = setup_db
    
    # 16. Resource creation validation works.
    resp = await client.post("/api/v1/resources", json={
        "name": "Test Resource 1",
        "category": "Tech",
        "quantity": 5
    }, headers={"Authorization": f"Bearer {ctx['admin_token']}"})
    assert resp.status_code == 200
    res_1 = resp.json()
    
    # 17. Negative quantity is rejected.
    resp = await client.post("/api/v1/resources", json={
        "name": "Test Resource 2",
        "category": "Tech",
        "quantity": -5
    }, headers={"Authorization": f"Bearer {ctx['admin_token']}"})
    assert resp.status_code == 422
    
    # 18. Unauthorized modification is rejected.
    resp = await client.put(f"/api/v1/resources/{res_1['_id']}", json={
        "name": "Test Resource 1 Mod",
        "category": "Tech",
        "quantity": 10
    }, headers={"Authorization": f"Bearer {ctx['student_token']}"})
    assert resp.status_code == 403

    await client.aclose()
