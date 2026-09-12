"""
Add demo notifications to seeded users.
Run after seed.py:
    $env:PYTHONPATH="."; .\venv\Scripts\python.exe seed_notifications.py
"""
import asyncio
import logging
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

logging.basicConfig(level=logging.INFO)

async def seed_notifications():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.MONGODB_DATABASE]

    users = await db.users.find({}).to_list(length=20)
    user_map = {u["email"]: str(u["_id"]) for u in users}

    admin_id = user_map.get("admin@campus.edu")
    student_id = user_map.get("student@campus.edu")
    organizer_id = user_map.get("organizer@campus.edu")
    faculty_id = user_map.get("prof.smith@campus.edu")

    now = datetime.now(timezone.utc)

    await db.notifications.delete_many({})

    notifications = []
    if admin_id:
        notifications += [
            {"user_id": admin_id, "title": "New Event Submitted", "message": "Hackathon 2026 is pending your review.", "type": "info", "link": "/events", "read": False, "created_at": now - timedelta(minutes=5)},
            {"user_id": admin_id, "title": "Document Indexed", "message": "Campus Policy 2026 has been vectorized and added to the knowledge base.", "type": "success", "link": "/institutional-memory", "read": False, "created_at": now - timedelta(hours=1)},
            {"user_id": admin_id, "title": "Conflict Detected", "message": "AI Workshop overlaps with an existing event on the same venue.", "type": "warning", "link": "/event-planner", "read": True, "created_at": now - timedelta(hours=3)},
        ]
    if student_id:
        notifications += [
            {"user_id": student_id, "title": "Registration Confirmed", "message": "Your registration for Hackathon 2026 is confirmed.", "type": "success", "link": "/my-registrations", "read": False, "created_at": now - timedelta(minutes=30)},
            {"user_id": student_id, "title": "Event Reminder", "message": "Hackathon 2026 starts in 2 days. Don't forget to attend!", "type": "info", "link": "/events", "read": False, "created_at": now - timedelta(hours=2)},
        ]
    if organizer_id:
        notifications += [
            {"user_id": organizer_id, "title": "Feedback Received", "message": "Your Art Exhibition received a 5-star rating.", "type": "success", "link": "/events", "read": False, "created_at": now - timedelta(hours=1)},
        ]
    if faculty_id:
        notifications += [
            {"user_id": faculty_id, "title": "Analytics Ready", "message": "Monthly institutional report is now available.", "type": "info", "link": "/analytics", "read": False, "created_at": now - timedelta(hours=4)},
        ]

    if notifications:
        await db.notifications.insert_many(notifications)
        print(f"Inserted {len(notifications)} demo notifications.")
    else:
        print("No users found — run seed.py first.")

    client.close()

asyncio.run(seed_notifications())
