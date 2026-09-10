from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, Field
from app.schemas.core import PyObjectId, generate_object_id

class StudentBase(BaseModel):
    user_id: PyObjectId
    department_id: Optional[PyObjectId] = None
    enrollment_year: int
    current_semester: int
    interests: List[str] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    account_status: str = Field(default="active", description="Status: active, alumni, suspended")

class StudentCreate(StudentBase):
    pass

class StudentInDB(StudentBase):
    id: PyObjectId = Field(default_factory=generate_object_id, alias="_id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StudentResponse(StudentBase):
    id: PyObjectId = Field(alias="_id")
    created_at: datetime
    updated_at: datetime
