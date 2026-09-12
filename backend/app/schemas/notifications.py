from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
from bson import ObjectId


class NotificationBase(BaseModel):
    title: str
    message: str
    type: Literal["info", "success", "warning", "error"] = "info"
    link: Optional[str] = None  # optional route to navigate to on click


class NotificationCreate(NotificationBase):
    user_id: str


class NotificationInDB(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    title: str
    message: str
    type: str = "info"
    link: Optional[str] = None
    read: bool = False
    created_at: datetime

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    type: str
    link: Optional[str]
    read: bool
    created_at: datetime

    @classmethod
    def from_db(cls, doc: dict) -> "NotificationResponse":
        return cls(
            id=str(doc["_id"]),
            title=doc["title"],
            message=doc["message"],
            type=doc.get("type", "info"),
            link=doc.get("link"),
            read=doc.get("read", False),
            created_at=doc["created_at"],
        )
