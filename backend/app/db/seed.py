import asyncio
import logging
from datetime import datetime, timedelta, timezone
from bson import ObjectId

from app.core.config import settings
from app.db.mongodb import connect_to_mongo, close_mongo_connection, get_database

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def seed_data():
    logger.info("Starting seed data process...")
    await connect_to_mongo()
    db = get_database()
    
    if db is None:
        logger.error("MongoDB not connected. Seed failed.")
        return

    # Clear existing data for a clean seed (only in development)
    collections = ["users", "students", "faculty", "departments", "clubs", "events", 
                   "venues", "resources", "registrations", "attendance", "expenses", 
                   "feedback", "documents"]
    for col in collections:
        await db[col].delete_many({})
        
    logger.info("Existing collections cleared.")

    now = datetime.now(timezone.utc)

    # 1. Departments
    cs_dept_id = ObjectId()
    math_dept_id = ObjectId()
    await db["departments"].insert_many([
        {"_id": cs_dept_id, "name": "Computer Science", "code": "CS", "created_at": now, "updated_at": now},
        {"_id": math_dept_id, "name": "Mathematics", "code": "MATH", "created_at": now, "updated_at": now}
    ])

    # 2. Users (Admin, Faculty, Students)
    admin_id = ObjectId()
    faculty_1_id = ObjectId()
    student_1_id = ObjectId()
    student_2_id = ObjectId()

    await db["users"].insert_many([
        {"_id": admin_id, "email": "admin@campus.edu", "username": "admin", "role": "Admin", "display_name": "System Admin", "account_status": "active", "password_hash": "fakehash_admin", "created_at": now, "updated_at": now},
        {"_id": faculty_1_id, "email": "prof.smith@campus.edu", "username": "smith", "role": "Faculty", "display_name": "Dr. Smith", "department_id": cs_dept_id, "account_status": "active", "password_hash": "fakehash_smith", "created_at": now, "updated_at": now},
        {"_id": student_1_id, "email": "alice@campus.edu", "username": "alice", "role": "Student", "display_name": "Alice Johnson", "department_id": cs_dept_id, "account_status": "active", "password_hash": "fakehash_alice", "created_at": now, "updated_at": now},
        {"_id": student_2_id, "email": "bob@campus.edu", "username": "bob", "role": "Student", "display_name": "Bob Lee", "department_id": math_dept_id, "account_status": "active", "password_hash": "fakehash_bob", "created_at": now, "updated_at": now}
    ])

    # 3. Students
    await db["students"].insert_many([
        {"_id": ObjectId(), "user_id": student_1_id, "department_id": cs_dept_id, "enrollment_year": 2023, "current_semester": 3, "interests": ["AI", "Web Dev"], "skills": ["Python"], "account_status": "active", "created_at": now, "updated_at": now},
        {"_id": ObjectId(), "user_id": student_2_id, "department_id": math_dept_id, "enrollment_year": 2024, "current_semester": 1, "interests": ["Calculus"], "skills": ["Math"], "account_status": "active", "created_at": now, "updated_at": now}
    ])

    # 4. Faculty
    await db["faculty"].insert_many([
        {"_id": ObjectId(), "user_id": faculty_1_id, "department_id": cs_dept_id, "designation": "Professor", "account_status": "active", "created_at": now, "updated_at": now}
    ])

    # Update Department Head
    await db["departments"].update_one({"_id": cs_dept_id}, {"$set": {"head_faculty_id": faculty_1_id}})

    # 5. Clubs
    coding_club_id = ObjectId()
    await db["clubs"].insert_one({
        "_id": coding_club_id, "name": "Coding Club", "description": "For programmers.", "category": "Academic", "department_id": cs_dept_id, "coordinator_id": student_1_id, "status": "active", "created_at": now, "updated_at": now
    })

    # 6. Venues
    hall_id = ObjectId()
    await db["venues"].insert_one({
        "_id": hall_id, "name": "Main Auditorium", "location": "Building A", "capacity": 500, "available_resources": ["Projector", "Sound System"], "status": "available", "created_at": now, "updated_at": now
    })

    # 7. Resources
    projector_id = ObjectId()
    await db["resources"].insert_one({
        "_id": projector_id, "name": "Portable Projector", "category": "Equipment", "quantity": 5, "availability_status": "available", "created_at": now, "updated_at": now
    })

    # 8. Events
    event_1_id = ObjectId()
    event_start = now + timedelta(days=2)
    event_end = now + timedelta(days=2, hours=3)
    await db["events"].insert_one({
        "_id": event_1_id, "title": "Hackathon 2026", "description": "Annual coding event", "category": "Competition", "organizer_club_id": coding_club_id, "department_id": cs_dept_id, "venue_id": hall_id, "start_datetime": event_start, "end_datetime": event_end, "expected_participants": 100, "target_audience": ["Students"], "required_resource_ids": [projector_id], "status": "scheduled", "created_by": faculty_1_id, "created_at": now, "updated_at": now
    })

    # 9. Registrations
    reg_id = ObjectId()
    await db["registrations"].insert_one({
        "_id": reg_id, "event_id": event_1_id, "user_id": student_1_id, "status": "registered", "attendance_status": "pending", "registration_timestamp": now, "updated_at": now
    })

    # 10. Expenses
    await db["expenses"].insert_one({
        "_id": ObjectId(), "event_id": event_1_id, "category": "Food", "amount": 250.0, "currency": "USD", "description": "Pizza for hackathon", "recorded_by": admin_id, "date": now, "status": "pending", "created_at": now, "updated_at": now
    })

    # 11. Documents
    await db["documents"].insert_one({
        "_id": ObjectId(), "name": "Hackathon Rules", "document_type": "PDF", "source": "Upload", "department_id": cs_dept_id, "access_classification": "public", "storage_path": "/docs/hackathon_rules.pdf", "processing_status": "pending", "uploaded_by": faculty_1_id, "uploaded_timestamp": now, "updated_at": now
    })

    logger.info("Seed data inserted successfully.")
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(seed_data())
