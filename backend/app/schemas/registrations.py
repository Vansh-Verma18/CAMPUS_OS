from datetime import datetime, timezone
from pydantic import BaseModel, Field
from app.schemas.core import PyObjectId, generate_object_id

class RegistrationBase(BaseModel):
    event_id: PyObjectId
    user_id: PyObjectId
    status: str = Field(default="registered", description="Status: registered, waitlisted, cancelled")
    attendance_status: str = Field(default="pending", description="Status: pending, attended, missed")

class RegistrationCreate(RegistrationBase):
    pass

class RegistrationInDB(RegistrationBase):
    id: PyObjectId = Field(default_factory=generate_object_id, alias="_id")
    registration_timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RegistrationResponse(RegistrationBase):
    id: PyObjectId = Field(alias="_id")
    registration_timestamp: datetime
    updated_at: datetime
