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
    
    # Create test users
    user_repo = BaseRepository[UserInDB, UserCreate](db_conn["users"], UserInDB)
    hashed = get_password_hash("password")
    
    admin = await user_repo.create(UserCreate(email="admin_club@campus.edu", username="admin_club", role="admin", display_name="Admin", password="password"), password_hash=hashed)
    org1 = await user_repo.create(UserCreate(email="org1_club@campus.edu", username="org1_club", role="organizer", display_name="Org1", password="password"), password_hash=hashed)
    org2 = await user_repo.create(UserCreate(email="org2_club@campus.edu", username="org2_club", role="organizer", display_name="Org2", password="password"), password_hash=hashed)
    student = await user_repo.create(UserCreate(email="student_club@campus.edu", username="student_club", role="student", display_name="Student", password="password"), password_hash=hashed)
    
    yield {
        "db": db_conn,
        "admin": admin, "org1": org1, "org2": org2, "student": student,
        "admin_token": create_access_token(str(admin.id), "admin"),
        "org1_token": create_access_token(str(org1.id), "organizer"),
        "org2_token": create_access_token(str(org2.id), "organizer"),
        "student_token": create_access_token(str(student.id), "student")
    }
    
    # Teardown
    await db_conn["users"].delete_many({"email": {"$regex": "_club@campus.edu"}})
    await db_conn["clubs"].delete_many({"name": {"$regex": "Test Club"}})
    await close_mongo_connection()

@pytest.mark.asyncio
async def test_clubs(setup_db: Any):
    client = AsyncClient(transport=ASGITransport(app=app), base_url="http://test")
    ctx = setup_db
    
    # 1. Authorized club creation succeeds.
    resp = await client.post("/api/v1/clubs", json={
        "name": "Test Club 1",
        "category": "Tech"
    }, headers={"Authorization": f"Bearer {ctx['org1_token']}"})
    assert resp.status_code == 200
    club_1 = resp.json()
    assert club_1["coordinator_id"] == str(ctx["org1"].id)
    
    # 2. Student cannot create a club if not authorized.
    resp = await client.post("/api/v1/clubs", json={
        "name": "Test Club 2",
        "category": "Tech"
    }, headers={"Authorization": f"Bearer {ctx['student_token']}"})
    assert resp.status_code == 403
    
    # 3. Authorized club retrieval succeeds.
    resp = await client.get("/api/v1/clubs", headers={"Authorization": f"Bearer {ctx['student_token']}"})
    assert resp.status_code == 200
    assert len([c for c in resp.json() if "Test Club" in c["name"]]) >= 1
    
    # 4. Unauthorized club modification is rejected.
    # Student attempts to modify
    resp = await client.put(f"/api/v1/clubs/{club_1['_id']}", json={
        "name": "Test Club 1 Mod",
        "category": "Tech"
    }, headers={"Authorization": f"Bearer {ctx['student_token']}"})
    assert resp.status_code == 403
    
    # Org2 attempts to modify Org1's club
    resp = await client.put(f"/api/v1/clubs/{club_1['_id']}", json={
        "name": "Test Club 1 Mod",
        "category": "Tech"
    }, headers={"Authorization": f"Bearer {ctx['org2_token']}"})
    assert resp.status_code == 403
    
    # Org1 modifies own club successfully
    resp = await client.put(f"/api/v1/clubs/{club_1['_id']}", json={
        "name": "Test Club 1 Modified",
        "category": "Tech"
    }, headers={"Authorization": f"Bearer {ctx['org1_token']}"})
    assert resp.status_code == 200
    assert resp.json()["name"] == "Test Club 1 Modified"

    await client.aclose()
