import logging
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

logger = logging.getLogger(__name__)

from typing import Optional, Any
class MongoDB:
    client: Optional[AsyncIOMotorClient[Any]] = None

db = MongoDB()

async def connect_to_mongo():
    try:
        logger.info("Connecting to MongoDB...")
        db.client = AsyncIOMotorClient(settings.MONGODB_URI)
        # Verify connection
        await db.client.admin.command('ping')
        logger.info("Successfully connected to MongoDB.")
    except Exception as e:
        logger.error(f"Could not connect to MongoDB: {e}")
        # Not raising error to allow app to start without DB for now

async def close_mongo_connection():
    try:
        if db.client:
            logger.info("Closing MongoDB connection...")
            db.client.close()
            logger.info("MongoDB connection closed.")
    except Exception as e:
        logger.error(f"Error while closing MongoDB connection: {e}")

def get_database():
    return db.client[settings.MONGODB_DATABASE] if db.client else None
