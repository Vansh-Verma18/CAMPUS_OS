import pytest
import pytest_asyncio
from typing import Any
from pymongo.errors import DuplicateKeyError
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.mongodb import connect_to_mongo, close_mongo_connection, get_database
from app.repositories.base import BaseRepository
from app.schemas.users import UserInDB, UserCreate
from app.db.indexes import setup_indexes

@pytest_asyncio.fixture(scope="function")
async def setup_db():
    await connect_to_mongo()
    db_conn = get_database()
    if db_conn is None:
        pytest.skip("MongoDB is not available (Docker offline). Skipping DB tests.")
    assert db_conn is not None
    
    # Run in a test collection
    await setup_indexes()
    
    yield db_conn
    
    # Teardown
    await db_conn["users"].delete_many({})
    await close_mongo_connection()

@pytest.mark.asyncio
async def test_repository_create_and_get(setup_db: AsyncIOMotorDatabase[Any]):
    user_repo = BaseRepository[UserInDB, UserCreate](setup_db["users"], UserInDB)
    
    user_data = UserCreate(
        email="testrepo@campus.edu",
        username="testrepo",
        role="Student",
        display_name="Test Repo",
        password="password123"
    )
    
    created_user = await user_repo.create(user_data, password_hash="hashed!")
    assert created_user is not None
    assert created_user.email == "testrepo@campus.edu"
    assert created_user.password_hash == "hashed!"
    assert hasattr(created_user, "id")
    
    fetched_user = await user_repo.get_by_id((created_user.id))
    assert fetched_user is not None
    assert fetched_user.email == "testrepo@campus.edu"

@pytest.mark.asyncio
async def test_unique_email_index(setup_db: AsyncIOMotorDatabase[Any]):
    user_repo = BaseRepository[UserInDB, UserCreate](setup_db["users"], UserInDB)
    
    user_data = UserCreate(
        email="unique@campus.edu",
        username="unique1",
        role="Student",
        display_name="Unique 1",
        password="pwd"
    )
    
    await user_repo.create(user_data, password_hash="hash")
    
    # Try to insert same email
    user_data.username = "unique2"
    with pytest.raises(DuplicateKeyError):
        await user_repo.create(user_data, password_hash="hash")
