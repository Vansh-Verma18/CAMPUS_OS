from pydantic import ConfigDict
from datetime import datetime, timezone
from typing import  List
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.core import PyObjectId, generate_object_id

class VenueBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    name: str
    location: str
    capacity: int = Field(ge=0)
    available_resources: List[str] = Field(default_factory=list)
    status: str = Field(default="available", description="Status: available, maintenance, booked")

class VenueCreate(VenueBase):
    pass

class VenueInDB(VenueBase):
    id: PyObjectId = Field(default_factory=generate_object_id, alias="_id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class VenueResponse(VenueBase):
    id: PyObjectId = Field(alias="_id")
    created_at: datetime
    updated_at: datetime
