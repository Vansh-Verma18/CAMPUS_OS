from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, Field
from app.schemas.core import PyObjectId, generate_object_id

class ClubBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: str
    department_id: Optional[PyObjectId] = None
    coordinator_id: Optional[PyObjectId] = None
    status: str = Field(default="active", description="Status: active, inactive")

class ClubCreate(ClubBase):
    pass

class ClubInDB(ClubBase):
    id: PyObjectId = Field(default_factory=generate_object_id, alias="_id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ClubResponse(ClubBase):
    id: PyObjectId = Field(alias="_id")
    created_at: datetime
    updated_at: datetime
