from pydantic import ConfigDict
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.core import PyObjectId, generate_object_id

class DepartmentBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    name: str
    code: str
    description: Optional[str] = None
    head_faculty_id: Optional[PyObjectId] = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentInDB(DepartmentBase):
    id: PyObjectId = Field(default_factory=generate_object_id, alias="_id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DepartmentResponse(DepartmentBase):
    id: PyObjectId = Field(alias="_id")
    created_at: datetime
    updated_at: datetime
