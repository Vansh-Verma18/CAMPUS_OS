import pytest
import pytest_asyncio
from typing import Any
from httpx import AsyncClient, ASGITransport
from datetime import timedelta
from fastapi import HTTPException
from app.main import app
from app.db.mongodb import connect_to_mongo, close_mongo_connection, get_database
from app.db.indexes import setup_indexes
from app.security.password import get_password_hash, verify_password
from app.security.jwt import create_access_token, decode_access_token
from app.schemas.users import UserCreate
from app.repositories.base import BaseRepository
from app.schemas.users import UserInDB
from app.api.deps import RoleChecker



@pytest_asyncio.fixture(scope="function")
async def setup_db():
    await connect_to_mongo()
    db_conn = get_database()
    if db_conn is None:
        pytest.skip("MongoDB is not available (Docker offline). Skipping DB tests.")
    assert db_conn is not None
    await setup_indexes()
    
    yield db_conn
    
    # Teardown
    await db_conn["users"].delete_many({"email": {"$in": ["teststudent@campus.edu", "inactive@campus.edu"]}})
    await close_mongo_connection()

@pytest.mark.asyncio
async def test_password_hashing():
    # 1. Password hashing works.
    # 2. Plaintext password is not stored.
    password = "supersecretpassword123"
    hashed = get_password_hash(password)
    
    assert hashed != password
    assert "supersecretpassword123" not in hashed
    
    # 3. Correct password succeeds.
    assert verify_password(password, hashed) is True
    
    # 4. Incorrect password fails.
    assert verify_password("wrongpassword", hashed) is False

def test_jwt_utilities():
    # 5. Valid JWT succeeds.
    token = create_access_token("test_sub", "student")
    payload = decode_access_token(token)
    assert payload["sub"] == "test_sub"
    assert payload["role"] == "student"
    
    # 16. JWT contains no sensitive information.
    assert "password" not in payload
    assert "password_hash" not in payload
    
    # 6. Invalid JWT fails.
    with pytest.raises(ValueError, match="Invalid token"):
        decode_access_token(token + "invalid")
        
    # 7. Expired JWT fails.
    expired_token = create_access_token("test_sub", "student", expires_delta=timedelta(seconds=-10))
    with pytest.raises(ValueError, match="Token has expired"):
        decode_access_token(expired_token)

@pytest.mark.asyncio
async def test_auth_endpoints(setup_db: Any):
    # Setup test user
    user_repo = BaseRepository[UserInDB, UserCreate](setup_db["users"], UserInDB)
    
    password = "password123"
    hashed = get_password_hash(password)
    
    user_data = UserCreate(
        email="teststudent@campus.edu",
        username="teststudent",
        role="student",
        display_name="Test Student",
        password=password
    )
    await user_repo.create(user_data, password_hash=hashed)
    
    # Test Login Endpoint
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/auth/login", json={
            "email": "teststudent@campus.edu",
            "password": "password123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        
        # 15. Password hash is never returned.
        assert "password" not in data["user"]
        assert "password_hash" not in data["user"]
        
        token = data["access_token"]
        
        # Test Login Failures (Wrong Password)
        response_fail = await client.post("/api/v1/auth/login", json={
            "email": "teststudent@campus.edu",
            "password": "wrongpassword"
        })
        assert response_fail.status_code == 401
        
        # Test Login Failures (Unknown Email)
        response_fail_email = await client.post("/api/v1/auth/login", json={
            "email": "unknown@campus.edu",
            "password": "password123"
        })
        assert response_fail_email.status_code == 401
        
        # Test Missing Email
        response_missing_email = await client.post("/api/v1/auth/login", json={
            "password": "password123"
        })
        assert response_missing_email.status_code == 422
        
        # Test Missing Password
        response_missing_pass = await client.post("/api/v1/auth/login", json={
            "email": "teststudent@campus.edu"
        })
        assert response_missing_pass.status_code == 422
        
        # Test /auth/me
        response_me = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert response_me.status_code == 200
        me_data = response_me.json()
        assert me_data["email"] == "teststudent@campus.edu"
        assert "password_hash" not in me_data
        
        # 8. Missing JWT fails.
        # 9. /auth/me requires authentication.
        response_no_auth = await client.get("/api/v1/auth/me")
        assert response_no_auth.status_code == 401

@pytest.mark.asyncio
async def test_inactive_user_login(setup_db: Any):
    user_repo = BaseRepository[UserInDB, UserCreate](setup_db["users"], UserInDB)
    hashed = get_password_hash("password")
    
    user_data = UserCreate(
        email="inactive@campus.edu",
        username="inactive",
        role="student",
        display_name="Inactive",
        password="password",
        account_status="inactive"
    )
    await user_repo.create(user_data, password_hash=hashed)
    
    # 17. Inactive users cannot log in.
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/auth/login", json={
            "email": "inactive@campus.edu",
            "password": "password"
        })
        assert response.status_code == 401
        assert response.json()["detail"] == "Inactive user"

def test_role_checker_logic():
    # Test Role Checker
    checker = RoleChecker(["admin", "faculty"])
    
    # Valid role
    valid_user = UserInDB(
        email="test@campus.edu",
        username="test",
        role="admin",
        display_name="Test",
        password_hash="hash"
    )
    
    result = checker(valid_user)
    assert result == valid_user
    
    # Invalid role
    invalid_user = UserInDB(
        email="student@campus.edu",
        username="student",
        role="student",
        display_name="Student",
        password_hash="hash"
    )
    
    with pytest.raises(HTTPException) as excinfo:
        checker(invalid_user)
    assert excinfo.value.status_code == 403
    assert excinfo.value.detail == "Insufficient permissions"
