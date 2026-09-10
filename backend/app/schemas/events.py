from pydantic import ConfigDict
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, model_validator
from app.schemas.core import PyObjectId, generate_object_id

class EventBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    title: str
    description: str
    category: str
    organizer_club_id: Optional[PyObjectId] = None
    department_id: Optional[PyObjectId] = None
    venue_id: Optional[PyObjectId] = None
    start_datetime: datetime
    end_datetime: datetime
    expected_participants: int = Field(ge=0)
    target_audience: List[str] = Field(default_factory=list)
    required_resource_ids: List[PyObjectId] = Field(default_factory=list)
    status: str = Field(default="scheduled", description="Status: scheduled, ongoing, completed, cancelled")
    created_by: Optional[PyObjectId] = None

    @model_validator(mode='after')
    def check_dates(self):
        if self.end_datetime < self.start_datetime:
            raise ValueError('end_datetime must not be earlier than start_datetime')
        return self

class EventCreate(EventBase):
    pass

class EventInDB(EventBase):
    id: PyObjectId = Field(default_factory=generate_object_id, alias="_id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EventResponse(EventBase):
    id: PyObjectId = Field(alias="_id")
    created_at: datetime
    updated_at: datetime
