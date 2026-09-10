import logging
from pymongo import IndexModel, ASCENDING
from app.db.mongodb import get_database

logger = logging.getLogger(__name__)

async def setup_indexes():
    db = get_database()
    if db is None:
        logger.warning("Database connection is not available. Skipping index setup.")
        return

    logger.info("Setting up database indexes...")
    try:
        # 1. Users
        await db["users"].create_indexes([
            IndexModel([("email", ASCENDING)], unique=True, background=True)
        ])

        # 2. Registrations (Unique composite index)
        await db["registrations"].create_indexes([
            IndexModel([("event_id", ASCENDING), ("user_id", ASCENDING)], unique=True, background=True)
        ])

        # 3. Events (For future conflict detection and quick lookup)
        await db["events"].create_indexes([
            IndexModel([("start_datetime", ASCENDING)], background=True),
            IndexModel([("venue_id", ASCENDING)], background=True),
            IndexModel([("organizer_club_id", ASCENDING)], background=True),
            IndexModel([("department_id", ASCENDING)], background=True),
            IndexModel([("status", ASCENDING)], background=True)
        ])

        # 4. Attendance
        await db["attendance"].create_indexes([
            IndexModel([("event_id", ASCENDING), ("user_id", ASCENDING)], unique=True, background=True)
        ])
        
        # 5. Documents
        await db["documents"].create_indexes([
            IndexModel([("access_classification", ASCENDING)], background=True)
        ])
        
        # 6. Feedback
        await db["feedback"].create_indexes([
            IndexModel([("event_id", ASCENDING), ("submitted_by", ASCENDING)], unique=True, background=True)
        ])
        
        # 7. Expenses
        await db["expenses"].create_indexes([
            IndexModel([("event_id", ASCENDING)], background=True),
            IndexModel([("recorded_by", ASCENDING)], background=True)
        ])

        logger.info("Successfully created database indexes.")
    except Exception as e:
        logger.error(f"Error while setting up indexes: {e}")
