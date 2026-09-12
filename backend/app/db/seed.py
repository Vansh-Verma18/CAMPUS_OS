import asyncio
import logging
from datetime import datetime, timedelta, timezone

from bson import ObjectId

from app.db.mongodb import (
    connect_to_mongo,
    close_mongo_connection,
    get_database,
)
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

    # Development/demo reset
    collections = [
        "users",
        "students",
        "faculty",
        "departments",
        "clubs",
        "events",
        "venues",
        "resources",
        "registrations",
        "attendance",
        "expenses",
        "feedback",
        "documents",
    ]

    for collection in collections:
        await db[collection].delete_many({})

    logger.info("Existing collections cleared.")

    now = datetime.now(timezone.utc)

    # ============================================================
    # 1. DEPARTMENTS
    # ============================================================

    cs_dept_id = ObjectId()
    math_dept_id = ObjectId()
    electronics_dept_id = ObjectId()

    await db["departments"].insert_many(
        [
            {
                "_id": cs_dept_id,
                "name": "Computer Science",
                "code": "CS",
                "created_at": now,
                "updated_at": now,
            },
            {
                "_id": math_dept_id,
                "name": "Mathematics",
                "code": "MATH",
                "created_at": now,
                "updated_at": now,
            },
            {
                "_id": electronics_dept_id,
                "name": "Electronics & Communication",
                "code": "ECE",
                "created_at": now,
                "updated_at": now,
            },
        ]
    )

    # ============================================================
    # 2. USERS
    # ============================================================

    admin_id = ObjectId()
    faculty_id = ObjectId()
    organizer_id = ObjectId()
    organizer_2_id = ObjectId()

    student_id = ObjectId()
    student_2_id = ObjectId()
    student_3_id = ObjectId()
    student_4_id = ObjectId()
    student_5_id = ObjectId()
    student_6_id = ObjectId()
    student_7_id = ObjectId()

    default_password = get_password_hash("password123")

    await db["users"].insert_many(
        [
            {
                "_id": admin_id,
                "email": "admin@campus.edu",
                "username": "admin",
                "role": "admin",
                "display_name": "System Admin",
                "account_status": "active",
                "password_hash": default_password,
                "created_at": now,
                "updated_at": now,
            },
            {
                "_id": faculty_id,
                "email": "prof.smith@campus.edu",
                "username": "smith",
                "role": "faculty",
                "display_name": "Dr. Smith",
                "department_id": cs_dept_id,
                "account_status": "active",
                "password_hash": default_password,
                "created_at": now,
                "updated_at": now,
            },
            {
                "_id": organizer_id,
                "email": "organizer@campus.edu",
                "username": "organizer",
                "role": "organizer",
                "display_name": "Event Organizer",
                "department_id": cs_dept_id,
                "account_status": "active",
                "password_hash": default_password,
                "created_at": now,
                "updated_at": now,
            },
            {
                "_id": organizer_2_id,
                "email": "organizer2@campus.edu",
                "username": "organizer2",
                "role": "organizer",
                "display_name": "Arts Organizer",
                "department_id": math_dept_id,
                "account_status": "active",
                "password_hash": default_password,
                "created_at": now,
                "updated_at": now,
            },
            {
                "_id": student_id,
                "email": "student@campus.edu",
                "username": "student",
                "role": "student",
                "display_name": "Alice Johnson",
                "department_id": math_dept_id,
                "account_status": "active",
                "password_hash": default_password,
                "created_at": now,
                "updated_at": now,
            },
            {
                "_id": student_2_id,
                "email": "student2@campus.edu",
                "username": "student2",
                "role": "student",
                "display_name": "Bob Williams",
                "department_id": cs_dept_id,
                "account_status": "active",
                "password_hash": default_password,
                "created_at": now,
                "updated_at": now,
            },
            {
                "_id": student_3_id,
                "email": "student3@campus.edu",
                "username": "student3",
                "role": "student",
                "display_name": "Charlie Davis",
                "department_id": cs_dept_id,
                "account_status": "active",
                "password_hash": default_password,
                "created_at": now,
                "updated_at": now,
            },
            {
                "_id": student_4_id,
                "email": "student4@campus.edu",
                "username": "student4",
                "role": "student",
                "display_name": "Diana Wilson",
                "department_id": math_dept_id,
                "account_status": "active",
                "password_hash": default_password,
                "created_at": now,
                "updated_at": now,
            },
            {
                "_id": student_5_id,
                "email": "student5@campus.edu",
                "username": "student5",
                "role": "student",
                "display_name": "Ethan Brown",
                "department_id": cs_dept_id,
                "account_status": "active",
                "password_hash": default_password,
                "created_at": now,
                "updated_at": now,
            },
            {
                "_id": student_6_id,
                "email": "student6@campus.edu",
                "username": "student6",
                "role": "student",
                "display_name": "Fiona Taylor",
                "department_id": math_dept_id,
                "account_status": "active",
                "password_hash": default_password,
                "created_at": now,
                "updated_at": now,
            },
            {
                "_id": student_7_id,
                "email": "student7@campus.edu",
                "username": "student7",
                "role": "student",
                "display_name": "George Miller",
                "department_id": electronics_dept_id,
                "account_status": "active",
                "password_hash": default_password,
                "created_at": now,
                "updated_at": now,
            },
        ]
    )

    # ============================================================
    # 3. CLUBS
    # ============================================================

    coding_club_id = ObjectId()
    arts_club_id = ObjectId()
    robotics_club_id = ObjectId()

    await db["clubs"].insert_many(
        [
            {
                "_id": coding_club_id,
                "name": "Coding Club",
                "description": "Software development, programming and competitive coding.",
                "category": "Academic",
                "department_id": cs_dept_id,
                "coordinator_id": organizer_id,
                "status": "active",
                "created_at": now,
                "updated_at": now,
            },
            {
                "_id": arts_club_id,
                "name": "Arts Club",
                "description": "Creative arts, cultural performances and student showcases.",
                "category": "Cultural",
                "department_id": math_dept_id,
                "coordinator_id": organizer_2_id,
                "status": "active",
                "created_at": now,
                "updated_at": now,
            },
            {
                "_id": robotics_club_id,
                "name": "Robotics Club",
                "description": "Robotics, automation and engineering innovation.",
                "category": "Technology",
                "department_id": electronics_dept_id,
                "coordinator_id": organizer_id,
                "status": "active",
                "created_at": now,
                "updated_at": now,
            },
        ]
    )

    # ============================================================
    # 4. VENUES
    # ============================================================

    hall_id = ObjectId()
    lab_id = ObjectId()
    seminar_id = ObjectId()
    innovation_lab_id = ObjectId()

    await db["venues"].insert_many(
        [
            {
                "_id": hall_id,
                "name": "Main Auditorium",
                "location": "Building A",
                "capacity": 500,
                "available_resources": [
                    "Projector",
                    "Sound System",
                    "Stage",
                ],
                "status": "available",
                "created_at": now,
                "updated_at": now,
            },
            {
                "_id": lab_id,
                "name": "Computer Lab 1",
                "location": "Building B",
                "capacity": 50,
                "available_resources": [
                    "Computers",
                    "Projector",
                    "Whiteboard",
                ],
                "status": "available",
                "created_at": now,
                "updated_at": now,
            },
            {
                "_id": seminar_id,
                "name": "Seminar Hall",
                "location": "Building C",
                "capacity": 150,
                "available_resources": [
                    "Projector",
                    "Sound System",
                    "Whiteboard",
                ],
                "status": "available",
                "created_at": now,
                "updated_at": now,
            },
            {
                "_id": innovation_lab_id,
                "name": "Innovation Lab",
                "location": "Building D",
                "capacity": 80,
                "available_resources": [
                    "Computers",
                    "Projector",
                    "Robotics Kits",
                ],
                "status": "available",
                "created_at": now,
                "updated_at": now,
            },
        ]
    )

    # ============================================================
    # 5. RESOURCES
    # ============================================================

    projector_id = ObjectId()
    sound_system_id = ObjectId()
    robotics_kit_id = ObjectId()
    camera_id = ObjectId()

    await db["resources"].insert_many(
        [
            {
                "_id": projector_id,
                "name": "Portable Projector",
                "category": "Equipment",
                "quantity": 5,
                "availability_status": "available",
                "created_at": now,
                "updated_at": now,
            },
            {
                "_id": sound_system_id,
                "name": "Wireless Mics",
                "category": "Equipment",
                "quantity": 10,
                "availability_status": "available",
                "created_at": now,
                "updated_at": now,
            },
            {
                "_id": robotics_kit_id,
                "name": "Robotics Kits",
                "category": "Equipment",
                "quantity": 12,
                "availability_status": "available",
                "created_at": now,
                "updated_at": now,
            },
            {
                "_id": camera_id,
                "name": "Event Cameras",
                "category": "Media",
                "quantity": 4,
                "availability_status": "available",
                "created_at": now,
                "updated_at": now,
            },
        ]
    )

    # ============================================================
    # 6. EVENTS
    # ============================================================

    event_1_id = ObjectId()
    event_2_id = ObjectId()
    event_3_id = ObjectId()
    event_4_id = ObjectId()
    event_5_id = ObjectId()
    event_6_id = ObjectId()
    event_7_id = ObjectId()
    event_8_id = ObjectId()

    events = [
        {
            "_id": event_1_id,
            "title": "Campus Hackathon 2026",
            "description": "24-hour software innovation and coding competition.",
            "category": "Competition",
            "organizer_club_id": coding_club_id,
            "department_id": cs_dept_id,
            "venue_id": hall_id,
            "start_datetime": now + timedelta(days=2),
            "end_datetime": now + timedelta(days=3),
            "expected_participants": 100,
            "target_audience": ["Students"],
            "required_resource_ids": [projector_id, sound_system_id],
            "status": "scheduled",
            "registration_enabled": True,
            "created_by": organizer_id,
            "created_at": now,
            "updated_at": now,
        },
        {
            "_id": event_2_id,
            "title": "AI & Machine Learning Workshop",
            "description": "Hands-on introduction to neural networks and machine learning.",
            "category": "Academic",
            "organizer_club_id": robotics_club_id,
            "department_id": cs_dept_id,
            "venue_id": lab_id,
            "start_datetime": now + timedelta(days=4),
            "end_datetime": now + timedelta(days=4, hours=2),
            "expected_participants": 50,
            "target_audience": ["CS Students"],
            "required_resource_ids": [projector_id],
            "status": "scheduled",
            "registration_enabled": True,
            "created_by": organizer_id,
            "created_at": now,
            "updated_at": now,
        },
        {
            "_id": event_3_id,
            "title": "Cultural Night",
            "description": "Music, dance and cultural performances by students.",
            "category": "Cultural",
            "organizer_club_id": arts_club_id,
            "department_id": math_dept_id,
            "venue_id": hall_id,
            "start_datetime": now + timedelta(days=6),
            "end_datetime": now + timedelta(days=6, hours=4),
            "expected_participants": 300,
            "target_audience": ["Everyone"],
            "required_resource_ids": [sound_system_id, camera_id],
            "status": "scheduled",
            "registration_enabled": True,
            "created_by": organizer_2_id,
            "created_at": now,
            "updated_at": now,
        },
        {
            "_id": event_4_id,
            "title": "Robotics Challenge",
            "description": "Inter-team robotics and automation competition.",
            "category": "Competition",
            "organizer_club_id": robotics_club_id,
            "department_id": electronics_dept_id,
            "venue_id": innovation_lab_id,
            "start_datetime": now + timedelta(days=8),
            "end_datetime": now + timedelta(days=8, hours=3),
            "expected_participants": 60,
            "target_audience": ["Students"],
            "required_resource_ids": [projector_id, robotics_kit_id],
            "status": "scheduled",
            "registration_enabled": True,
            "created_by": organizer_id,
            "created_at": now,
            "updated_at": now,
        },
        {
            "_id": event_5_id,
            "title": "Art & Design Exhibition",
            "description": "Student artwork and design showcase.",
            "category": "Cultural",
            "organizer_club_id": arts_club_id,
            "department_id": math_dept_id,
            "venue_id": seminar_id,
            "start_datetime": now - timedelta(days=7),
            "end_datetime": now - timedelta(days=7) + timedelta(hours=3),
            "expected_participants": 200,
            "target_audience": ["Everyone"],
            "required_resource_ids": [camera_id],
            "status": "completed",
            "registration_enabled": False,
            "created_by": organizer_2_id,
            "created_at": now,
            "updated_at": now,
        },
        {
            "_id": event_6_id,
            "title": "Tech Talk: Building AI Systems",
            "description": "Technical session covering modern AI systems and architecture.",
            "category": "Academic",
            "organizer_club_id": coding_club_id,
            "department_id": cs_dept_id,
            "venue_id": seminar_id,
            "start_datetime": now - timedelta(days=14),
            "end_datetime": now - timedelta(days=14) + timedelta(hours=2),
            "expected_participants": 150,
            "target_audience": ["Students", "Faculty"],
            "required_resource_ids": [projector_id, sound_system_id],
            "status": "completed",
            "registration_enabled": False,
            "created_by": organizer_id,
            "created_at": now,
            "updated_at": now,
        },
        {
            "_id": event_7_id,
            "title": "Coding Bootcamp",
            "description": "Practical programming and problem-solving bootcamp.",
            "category": "Academic",
            "organizer_club_id": coding_club_id,
            "department_id": cs_dept_id,
            "venue_id": lab_id,
            "start_datetime": now - timedelta(days=21),
            "end_datetime": now - timedelta(days=21) + timedelta(hours=4),
            "expected_participants": 80,
            "target_audience": ["Students"],
            "required_resource_ids": [projector_id],
            "status": "completed",
            "registration_enabled": False,
            "created_by": organizer_id,
            "created_at": now,
            "updated_at": now,
        },
        {
            "_id": event_8_id,
            "title": "Innovation & Startup Meet",
            "description": "Student founders, innovators and mentors networking session.",
            "category": "Business",
            "organizer_club_id": coding_club_id,
            "department_id": cs_dept_id,
            "venue_id": hall_id,
            "start_datetime": now + timedelta(days=12),
            "end_datetime": now + timedelta(days=12, hours=3),
            "expected_participants": 180,
            "target_audience": ["Students", "Faculty"],
            "required_resource_ids": [projector_id, sound_system_id],
            "status": "scheduled",
            "registration_enabled": True,
            "created_by": organizer_id,
            "created_at": now,
            "updated_at": now,
        },
    ]

    await db["events"].insert_many(events)

    # ============================================================
    # 7. REGISTRATIONS
    # ============================================================

    await db["registrations"].insert_many(
        [
            # Hackathon
            {"_id": ObjectId(), "event_id": event_1_id, "user_id": student_id, "status": "confirmed", "created_at": now, "updated_at": now},
            {"_id": ObjectId(), "event_id": event_1_id, "user_id": student_2_id, "status": "confirmed", "created_at": now, "updated_at": now},
            {"_id": ObjectId(), "event_id": event_1_id, "user_id": student_3_id, "status": "confirmed", "created_at": now, "updated_at": now},
            {"_id": ObjectId(), "event_id": event_1_id, "user_id": student_4_id, "status": "confirmed", "created_at": now, "updated_at": now},
            {"_id": ObjectId(), "event_id": event_1_id, "user_id": student_5_id, "status": "confirmed", "created_at": now, "updated_at": now},
            {"_id": ObjectId(), "event_id": event_1_id, "user_id": student_6_id, "status": "confirmed", "created_at": now, "updated_at": now},

            # AI Workshop
            {"_id": ObjectId(), "event_id": event_2_id, "user_id": student_id, "status": "confirmed", "created_at": now, "updated_at": now},
            {"_id": ObjectId(), "event_id": event_2_id, "user_id": student_2_id, "status": "confirmed", "created_at": now, "updated_at": now},
            {"_id": ObjectId(), "event_id": event_2_id, "user_id": student_3_id, "status": "confirmed", "created_at": now, "updated_at": now},
            {"_id": ObjectId(), "event_id": event_2_id, "user_id": student_6_id, "status": "confirmed", "created_at": now, "updated_at": now},

            # Cultural Night
            {"_id": ObjectId(), "event_id": event_3_id, "user_id": student_id, "status": "confirmed", "created_at": now, "updated_at": now},
            {"_id": ObjectId(), "event_id": event_3_id, "user_id": student_2_id, "status": "confirmed", "created_at": now, "updated_at": now},
            {"_id": ObjectId(), "event_id": event_3_id, "user_id": student_3_id, "status": "confirmed", "created_at": now, "updated_at": now},
            {"_id": ObjectId(), "event_id": event_3_id, "user_id": student_4_id, "status": "confirmed", "created_at": now, "updated_at": now},
            {"_id": ObjectId(), "event_id": event_3_id, "user_id": student_5_id, "status": "confirmed", "created_at": now, "updated_at": now},
            {"_id": ObjectId(), "event_id": event_3_id, "user_id": student_6_id, "status": "confirmed", "created_at": now, "updated_at": now},
            {"_id": ObjectId(), "event_id": event_3_id, "user_id": student_7_id, "status": "confirmed", "created_at": now, "updated_at": now},

            # Robotics
            {"_id": ObjectId(), "event_id": event_4_id, "user_id": student_2_id, "status": "confirmed", "created_at": now, "updated_at": now},
            {"_id": ObjectId(), "event_id": event_4_id, "user_id": student_3_id, "status": "confirmed", "created_at": now, "updated_at": now},
            {"_id": ObjectId(), "event_id": event_4_id, "user_id": student_5_id, "status": "confirmed", "created_at": now, "updated_at": now},
            {"_id": ObjectId(), "event_id": event_4_id, "user_id": student_7_id, "status": "confirmed", "created_at": now, "updated_at": now},

            # Completed exhibition
            {"_id": ObjectId(), "event_id": event_5_id, "user_id": student_id, "status": "confirmed", "created_at": now, "updated_at": now},
            {"_id": ObjectId(), "event_id": event_5_id, "user_id": student_4_id, "status": "confirmed", "created_at": now, "updated_at": now},
            {"_id": ObjectId(), "event_id": event_5_id, "user_id": student_6_id, "status": "confirmed", "created_at": now, "updated_at": now},

            # Tech Talk
            {"_id": ObjectId(), "event_id": event_6_id, "user_id": student_id, "status": "confirmed", "created_at": now, "updated_at": now},
            {"_id": ObjectId(), "event_id": event_6_id, "user_id": student_2_id, "status": "confirmed", "created_at": now, "updated_at": now},
            {"_id": ObjectId(), "event_id": event_6_id, "user_id": student_3_id, "status": "confirmed", "created_at": now, "updated_at": now},
            {"_id": ObjectId(), "event_id": event_6_id, "user_id": student_5_id, "status": "confirmed", "created_at": now, "updated_at": now},

            # Bootcamp
            {"_id": ObjectId(), "event_id": event_7_id, "user_id": student_id, "status": "confirmed", "created_at": now, "updated_at": now},
            {"_id": ObjectId(), "event_id": event_7_id, "user_id": student_5_id, "status": "confirmed", "created_at": now, "updated_at": now},
            {"_id": ObjectId(), "event_id": event_7_id, "user_id": student_6_id, "status": "confirmed", "created_at": now, "updated_at": now},

            # Startup Meet
            {"_id": ObjectId(), "event_id": event_8_id, "user_id": student_id, "status": "confirmed", "created_at": now, "updated_at": now},
            {"_id": ObjectId(), "event_id": event_8_id, "user_id": student_2_id, "status": "confirmed", "created_at": now, "updated_at": now},
            {"_id": ObjectId(), "event_id": event_8_id, "user_id": student_4_id, "status": "confirmed", "created_at": now, "updated_at": now},
            {"_id": ObjectId(), "event_id": event_8_id, "user_id": student_7_id, "status": "confirmed", "created_at": now, "updated_at": now},
        ]
    )

    # ============================================================
    # 8. ATTENDANCE
    # ============================================================

    await db["attendance"].insert_many(
        [
            # Exhibition
            {"_id": ObjectId(), "event_id": event_5_id, "user_id": student_id, "status": "attended", "check_in_timestamp": now, "created_at": now, "updated_at": now},
            {"_id": ObjectId(), "event_id": event_5_id, "user_id": student_4_id, "status": "attended", "check_in_timestamp": now, "created_at": now, "updated_at": now},
            {"_id": ObjectId(), "event_id": event_5_id, "user_id": student_6_id, "status": "no_show", "check_in_timestamp": now, "created_at": now, "updated_at": now},

            # Tech Talk
            {"_id": ObjectId(), "event_id": event_6_id, "user_id": student_id, "status": "attended", "check_in_timestamp": now, "created_at": now, "updated_at": now},
            {"_id": ObjectId(), "event_id": event_6_id, "user_id": student_2_id, "status": "attended", "check_in_timestamp": now, "created_at": now, "updated_at": now},
            {"_id": ObjectId(), "event_id": event_6_id, "user_id": student_3_id, "status": "attended", "check_in_timestamp": now, "created_at": now, "updated_at": now},
            {"_id": ObjectId(), "event_id": event_6_id, "user_id": student_5_id, "status": "no_show", "check_in_timestamp": now, "created_at": now, "updated_at": now},

            # Bootcamp
            {"_id": ObjectId(), "event_id": event_7_id, "user_id": student_id, "status": "attended", "check_in_timestamp": now, "created_at": now, "updated_at": now},
            {"_id": ObjectId(), "event_id": event_7_id, "user_id": student_5_id, "status": "attended", "check_in_timestamp": now, "created_at": now, "updated_at": now},
            {"_id": ObjectId(), "event_id": event_7_id, "user_id": student_6_id, "status": "attended", "check_in_timestamp": now, "created_at": now, "updated_at": now},
        ]
    )

    # ============================================================
    # 9. FEEDBACK
    # ============================================================

    await db["feedback"].insert_many(
        [
            {
                "_id": ObjectId(),
                "event_id": event_5_id,
                "submitted_by": student_id,
                "rating": 5,
                "comments": "Beautiful exhibition with excellent student work.",
                "tags": ["creative", "well-organized"],
                "submitted_timestamp": now,
            },
            {
                "_id": ObjectId(),
                "event_id": event_5_id,
                "submitted_by": student_4_id,
                "rating": 4,
                "comments": "Good variety of artwork.",
                "tags": ["creative"],
                "submitted_timestamp": now,
            },
            {
                "_id": ObjectId(),
                "event_id": event_6_id,
                "submitted_by": student_id,
                "rating": 5,
                "comments": "Excellent technical session.",
                "tags": ["technical", "useful"],
                "submitted_timestamp": now,
            },
            {
                "_id": ObjectId(),
                "event_id": event_6_id,
                "submitted_by": student_2_id,
                "rating": 4,
                "comments": "Very useful for project work.",
                "tags": ["technical"],
                "submitted_timestamp": now,
            },
            {
                "_id": ObjectId(),
                "event_id": event_7_id,
                "submitted_by": student_id,
                "rating": 5,
                "comments": "The hands-on exercises were great.",
                "tags": ["practical"],
                "submitted_timestamp": now,
            },
            {
                "_id": ObjectId(),
                "event_id": event_7_id,
                "submitted_by": student_5_id,
                "rating": 4,
                "comments": "Good bootcamp for beginners.",
                "tags": ["beginner-friendly"],
                "submitted_timestamp": now,
            },
        ]
    )

    # ============================================================
    # 10. EXPENSES
    # ============================================================

    await db["expenses"].insert_many(
        [
            {
                "_id": ObjectId(),
                "event_id": event_1_id,
                "category": "Food",
                "amount": 25000.0,
                "currency": "INR",
                "description": "Food and refreshments for hackathon",
                "recorded_by": admin_id,
                "date": now,
                "status": "approved",
                "created_at": now,
                "updated_at": now,
            },
            {
                "_id": ObjectId(),
                "event_id": event_1_id,
                "category": "Equipment",
                "amount": 12000.0,
                "currency": "INR",
                "description": "Hackathon AV and equipment",
                "recorded_by": organizer_id,
                "date": now,
                "status": "approved",
                "created_at": now,
                "updated_at": now,
            },
            {
                "_id": ObjectId(),
                "event_id": event_2_id,
                "category": "Equipment",
                "amount": 8000.0,
                "currency": "INR",
                "description": "Workshop equipment",
                "recorded_by": organizer_id,
                "date": now,
                "status": "approved",
                "created_at": now,
                "updated_at": now,
            },
            {
                "_id": ObjectId(),
                "event_id": event_3_id,
                "category": "Production",
                "amount": 30000.0,
                "currency": "INR",
                "description": "Stage, lighting and sound",
                "recorded_by": organizer_2_id,
                "date": now,
                "status": "approved",
                "created_at": now,
                "updated_at": now,
            },
            {
                "_id": ObjectId(),
                "event_id": event_5_id,
                "category": "Supplies",
                "amount": 7500.0,
                "currency": "INR",
                "description": "Canvas, paint and exhibition supplies",
                "recorded_by": organizer_2_id,
                "date": now,
                "status": "approved",
                "created_at": now,
                "updated_at": now,
            },
            {
                "_id": ObjectId(),
                "event_id": event_6_id,
                "category": "Speaker",
                "amount": 15000.0,
                "currency": "INR",
                "description": "Technical speaker and event logistics",
                "recorded_by": organizer_id,
                "date": now,
                "status": "approved",
                "created_at": now,
                "updated_at": now,
            },
            {
                "_id": ObjectId(),
                "event_id": event_4_id,
                "category": "Materials",
                "amount": 18000.0,
                "currency": "INR",
                "description": "Robotics challenge components",
                "recorded_by": organizer_id,
                "date": now,
                "status": "approved",
                "created_at": now,
                "updated_at": now,
            },
        ]
    )

    logger.info("Seed data inserted successfully.")

    await close_mongo_connection()


if __name__ == "__main__":
    asyncio.run(seed_data())