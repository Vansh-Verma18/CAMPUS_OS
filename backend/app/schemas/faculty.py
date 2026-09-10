from pydantic import ConfigDict
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.core import PyObjectId, generate_object_id

class FacultyBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    user_id: Optional[PyObjectId] = None
    department_id: Optional[PyObjectId] = None
    designation: str
    account_status: str = Field(default="active", description="Status: active, retired, suspended")

class FacultyCreate(FacultyBase):
    pass

class FacultyInDB(FacultyBase):
    id: PyObjectId = Field(default_factory=generate_object_id, alias="_id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FacultyResponse(FacultyBase):
    id: PyObjectId = Field(alias="_id")
    created_at: datetime
    updated_at: datetime
