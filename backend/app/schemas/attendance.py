from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.core import PyObjectId, generate_object_id

class AttendanceBase(BaseModel):
    event_id: PyObjectId
    user_id: PyObjectId
    status: str = Field(default="attended", description="Status: attended, excused")
    check_in_timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    check_out_timestamp: Optional[datetime] = None

class AttendanceCreate(AttendanceBase):
    pass

class AttendanceInDB(AttendanceBase):
    id: PyObjectId = Field(default_factory=generate_object_id, alias="_id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AttendanceResponse(AttendanceBase):
    id: PyObjectId = Field(alias="_id")
    created_at: datetime
    updated_at: datetime
