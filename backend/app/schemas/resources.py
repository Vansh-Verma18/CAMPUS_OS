from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.core import PyObjectId, generate_object_id

class ResourceBase(BaseModel):
    name: str
    category: str
    quantity: int = Field(ge=0)
    location: Optional[str] = None
    availability_status: str = Field(default="available", description="Status: available, in-use, maintenance")

class ResourceCreate(ResourceBase):
    pass

class ResourceInDB(ResourceBase):
    id: PyObjectId = Field(default_factory=generate_object_id, alias="_id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ResourceResponse(ResourceBase):
    id: PyObjectId = Field(alias="_id")
    created_at: datetime
    updated_at: datetime
