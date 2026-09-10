import asyncio
import logging
from datetime import datetime, timedelta, timezone
from bson import ObjectId

from app.db.mongodb import connect_to_mongo, close_mongo_connection, get_database
from app.security.password import get_password_hash

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

    # 2. Users (Admin, Faculty, Organizer, Student)
    admin_id = ObjectId()
    faculty_id = ObjectId()
    organizer_id = ObjectId()
    organizer_2_id = ObjectId()
    student_id = ObjectId()
    student_2_id = ObjectId()

    default_password = get_password_hash("password123")

    await db["users"].insert_many([
        {"_id": admin_id, "email": "admin@campus.edu", "username": "admin", "role": "admin", "display_name": "System Admin", "account_status": "active", "password_hash": default_password, "created_at": now, "updated_at": now},
        {"_id": faculty_id, "email": "prof.smith@campus.edu", "username": "smith", "role": "faculty", "display_name": "Dr. Smith", "department_id": cs_dept_id, "account_status": "active", "password_hash": default_password, "created_at": now, "updated_at": now},
        {"_id": organizer_id, "email": "organizer@campus.edu", "username": "organizer", "role": "organizer", "display_name": "Event Organizer", "department_id": cs_dept_id, "account_status": "active", "password_hash": default_password, "created_at": now, "updated_at": now},
        {"_id": organizer_2_id, "email": "organizer2@campus.edu", "username": "organizer2", "role": "organizer", "display_name": "Arts Organizer", "department_id": math_dept_id, "account_status": "active", "password_hash": default_password, "created_at": now, "updated_at": now},
        {"_id": student_id, "email": "student@campus.edu", "username": "student", "role": "student", "display_name": "Alice Johnson", "department_id": math_dept_id, "account_status": "active", "password_hash": default_password, "created_at": now, "updated_at": now},
        {"_id": student_2_id, "email": "student2@campus.edu", "username": "student2", "role": "student", "display_name": "Bob Williams", "department_id": cs_dept_id, "account_status": "active", "password_hash": default_password, "created_at": now, "updated_at": now}
    ])

    # 3. Clubs
    coding_club_id = ObjectId()
    arts_club_id = ObjectId()
    robotics_club_id = ObjectId()
    await db["clubs"].insert_many([
        {"_id": coding_club_id, "name": "Coding Club", "description": "For programmers.", "category": "Academic", "department_id": cs_dept_id, "coordinator_id": organizer_id, "status": "active", "created_at": now, "updated_at": now},
        {"_id": arts_club_id, "name": "Arts Club", "description": "For artists.", "category": "Cultural", "department_id": math_dept_id, "coordinator_id": organizer_2_id, "status": "active", "created_at": now, "updated_at": now},
        {"_id": robotics_club_id, "name": "Robotics Club", "description": "Building robots.", "category": "Academic", "department_id": cs_dept_id, "coordinator_id": organizer_id, "status": "active", "created_at": now, "updated_at": now}
    ])

    # 4. Venues
    hall_id = ObjectId()
    lab_id = ObjectId()
    await db["venues"].insert_many([
        {"_id": hall_id, "name": "Main Auditorium", "location": "Building A", "capacity": 500, "available_resources": ["Projector", "Sound System"], "status": "available", "created_at": now, "updated_at": now},
        {"_id": lab_id, "name": "Computer Lab 1", "location": "Building B", "capacity": 50, "available_resources": ["Computers", "Whiteboard"], "status": "available", "created_at": now, "updated_at": now}
    ])

    # 5. Resources
    projector_id = ObjectId()
    sound_system_id = ObjectId()
    await db["resources"].insert_many([
        {"_id": projector_id, "name": "Portable Projector", "category": "Equipment", "quantity": 5, "availability_status": "available", "created_at": now, "updated_at": now},
        {"_id": sound_system_id, "name": "Wireless Mics", "category": "Equipment", "quantity": 10, "availability_status": "available", "created_at": now, "updated_at": now}
    ])

    # 6. Events
    event_1_id = ObjectId()
    event_2_id = ObjectId()
    event_3_id = ObjectId()
    event_start = now + timedelta(days=2)
    event_end = now + timedelta(days=2, hours=3)
    await db["events"].insert_many([
        {
            "_id": event_1_id, "title": "Hackathon 2026", "description": "Annual coding event", "category": "Competition", 
            "organizer_club_id": coding_club_id, "department_id": cs_dept_id, "venue_id": hall_id, 
            "start_datetime": event_start, "end_datetime": event_end, "expected_participants": 100, 
            "target_audience": ["Students"], "required_resource_ids": [projector_id], 
            "status": "scheduled", "registration_enabled": True, "created_by": organizer_id, "created_at": now, "updated_at": now
        },
        {
            "_id": event_2_id, "title": "Art Exhibition", "description": "Displaying student art", "category": "Cultural", 
            "organizer_club_id": arts_club_id, "department_id": math_dept_id, "venue_id": hall_id, 
            "start_datetime": now - timedelta(days=5), "end_datetime": now - timedelta(days=5, hours=-3), "expected_participants": 200, 
            "target_audience": ["Everyone"], "required_resource_ids": [], 
            "status": "completed", "registration_enabled": False, "created_by": organizer_2_id, "created_at": now, "updated_at": now
        },
        {
            "_id": event_3_id, "title": "AI Workshop", "description": "Intro to neural networks", "category": "Academic", 
            "organizer_club_id": robotics_club_id, "department_id": cs_dept_id, "venue_id": lab_id, 
            "start_datetime": now + timedelta(days=10), "end_datetime": now + timedelta(days=10, hours=2), "expected_participants": 40, 
            "target_audience": ["CS Students"], "required_resource_ids": [projector_id], 
            "status": "scheduled", "registration_enabled": True, "created_by": organizer_id, "created_at": now, "updated_at": now
        }
    ])

    # 7. Registrations
    await db["registrations"].insert_many([
        {"_id": ObjectId(), "event_id": event_1_id, "user_id": student_id, "status": "confirmed", "created_at": now, "updated_at": now},
        {"_id": ObjectId(), "event_id": event_3_id, "user_id": student_id, "status": "confirmed", "created_at": now, "updated_at": now},
        {"_id": ObjectId(), "event_id": event_1_id, "user_id": student_2_id, "status": "confirmed", "created_at": now, "updated_at": now}
    ])

    # 8. Attendance
    await db["attendance"].insert_many([
        {"_id": ObjectId(), "event_id": event_2_id, "user_id": student_id, "status": "attended", "check_in_timestamp": now, "created_at": now, "updated_at": now},
        {"_id": ObjectId(), "event_id": event_2_id, "user_id": student_2_id, "status": "attended", "check_in_timestamp": now, "created_at": now, "updated_at": now}
    ])

    # 9. Feedback
    await db["feedback"].insert_many([
        {"_id": ObjectId(), "event_id": event_2_id, "submitted_by": student_id, "rating": 5, "comments": "Great exhibition!", "tags": [], "submitted_timestamp": now}
    ])

    # 10. Expenses
    await db["expenses"].insert_many([
        {"_id": ObjectId(), "event_id": event_1_id, "category": "Food", "amount": 250.0, "currency": "USD", "description": "Pizza for hackathon", "recorded_by": admin_id, "date": now, "status": "approved", "created_at": now, "updated_at": now},
        {"_id": ObjectId(), "event_id": event_2_id, "category": "Supplies", "amount": 100.0, "currency": "USD", "description": "Canvas and paint", "recorded_by": organizer_2_id, "date": now, "status": "approved", "created_at": now, "updated_at": now}
    ])

    logger.info("Seed data inserted successfully.")
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(seed_data())
