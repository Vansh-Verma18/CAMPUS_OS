from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, Field
from app.schemas.core import PyObjectId, generate_object_id

class FeedbackBase(BaseModel):
    event_id: PyObjectId
    submitted_by: Optional[PyObjectId] = None
    rating: Optional[int] = Field(None, ge=1, le=5)
    comments: Optional[str] = None
    tags: List[str] = Field(default_factory=list)

class FeedbackCreate(FeedbackBase):
    pass

class FeedbackInDB(FeedbackBase):
    id: PyObjectId = Field(default_factory=generate_object_id, alias="_id")
    submitted_timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FeedbackResponse(FeedbackBase):
    id: PyObjectId = Field(alias="_id")
    submitted_timestamp: datetime
