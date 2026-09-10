from typing import Optional
from pydantic import ConfigDict
from datetime import datetime, timezone
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.core import PyObjectId, generate_object_id

class RegistrationBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    event_id: Optional[PyObjectId] = None
    user_id: Optional[PyObjectId] = None
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
