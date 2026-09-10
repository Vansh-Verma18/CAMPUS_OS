from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from app.schemas.core import PyObjectId, generate_object_id

class UserBase(BaseModel):
    email: EmailStr
    username: str
    role: str = Field(..., description="Role of the user: admin, faculty, organizer, student")
    display_name: str
    department_id: Optional[PyObjectId] = None
    club_id: Optional[PyObjectId] = None
    account_status: str = Field(default="active", description="Status: active, suspended, inactive")

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    id: PyObjectId = Field(default_factory=generate_object_id, alias="_id")
    password_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserResponse(UserBase):
    id: PyObjectId = Field(alias="_id")
    created_at: datetime
    updated_at: datetime
