"""
Notifications API — GET /api/v1/notifications/my
                   PATCH /api/v1/notifications/{id}/read
                   PATCH /api/v1/notifications/read-all
                   POST  /api/v1/notifications (internal — for seeding/admin)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timezone
from bson import ObjectId
import logging

from app.api.deps import get_current_active_user
from app.schemas.users import UserInDB
from app.schemas.notifications import NotificationResponse
from app.db.mongodb import get_database

router = APIRouter()
logger = logging.getLogger(__name__)


def _get_db():
    db = get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    return db


@router.get("/my", response_model=list[NotificationResponse])
async def get_my_notifications(
    current_user: UserInDB = Depends(get_current_active_user),
    limit: int = 20,
):
    """Return the current user's notifications, unread first."""
    db = _get_db()
    cursor = db["notifications"].find(
        {"user_id": str(current_user.id)},
        sort=[("read", 1), ("created_at", -1)],
        limit=limit,
    )
    docs = await cursor.to_list(length=limit)
    return [NotificationResponse.from_db(doc) for doc in docs]


@router.get("/unread-count")
async def get_unread_count(
    current_user: UserInDB = Depends(get_current_active_user),
):
    """Return count of unread notifications for badge display."""
    db = _get_db()
    count = await db["notifications"].count_documents({
        "user_id": str(current_user.id),
        "read": False,
    })
    return {"count": count}


@router.patch("/{notification_id}/read")
async def mark_as_read(
    notification_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
):
    """Mark a single notification as read."""
    db = _get_db()
    try:
        obj_id = ObjectId(notification_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid notification ID")

    result = await db["notifications"].update_one(
        {"_id": obj_id, "user_id": str(current_user.id)},
        {"$set": {"read": True}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"ok": True}


@router.patch("/read-all")
async def mark_all_as_read(
    current_user: UserInDB = Depends(get_current_active_user),
):
    """Mark all of current user's notifications as read."""
    db = _get_db()
    await db["notifications"].update_many(
        {"user_id": str(current_user.id), "read": False},
        {"$set": {"read": True}},
    )
    return {"ok": True}


# ─── Internal helper (used by other services) ────────────────────────────────

async def create_notification(
    user_id: str,
    title: str,
    message: str,
    ntype: str = "info",
    link: str | None = None,
) -> None:
    """
    Create a notification for a user.
    Call this from other service modules (events, registrations, etc.)
    """
    db = get_database()
    if db is None:
        logger.warning("Cannot create notification — DB not connected")
        return
    try:
        await db["notifications"].insert_one({
            "user_id": user_id,
            "title": title,
            "message": message,
            "type": ntype,
            "link": link,
            "read": False,
            "created_at": datetime.now(timezone.utc),
        })
    except Exception as e:
        logger.error("Failed to create notification: %s", e)
