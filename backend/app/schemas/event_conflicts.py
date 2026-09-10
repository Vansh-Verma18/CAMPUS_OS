from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional
from datetime import datetime
from app.schemas.core import PyObjectId

class ConflictDetectionRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    event_id: Optional[str] = Field(default=None, description="Provide event_id if updating an existing event to exclude it from conflict detection")
    title: str
    start_datetime: datetime
    end_datetime: datetime
    venue_id: Optional[PyObjectId] = None
    required_resource_ids: List[PyObjectId] = Field(default_factory=list)
    target_audience: List[str] = Field(default_factory=list)
    organizer_club_id: Optional[PyObjectId] = None
    department_id: Optional[PyObjectId] = None

class ConflictEvidence(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    venue_id: Optional[str] = None
    venue_name: Optional[str] = None
    resource_id: Optional[str] = None
    resource_name: Optional[str] = None
    requested_quantity: Optional[int] = None
    available_quantity: Optional[int] = None
    capacity_conflict: Optional[bool] = None
    proposed_time: Optional[str] = None
    existing_time: Optional[str] = None
    overlap_minutes: Optional[int] = None

class Conflict(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    conflict_type: str = Field(description="VENUE, RESOURCE, TIME")
    severity: str = Field(description="CRITICAL, WARNING, INFO")
    event_id: str
    event_title: str
    explanation: str
    evidence: ConflictEvidence

class AudienceOverlapDetails(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    event_id: str
    event_title: str
    overlapping_categories: List[str]
    overlap_score: float
    calculation_basis: str

class ConflictAnalysis(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    has_conflicts: bool
    conflicts: List[Conflict] = Field(default_factory=list)
    audience_overlaps: List[AudienceOverlapDetails] = Field(default_factory=list)
    summary: str
