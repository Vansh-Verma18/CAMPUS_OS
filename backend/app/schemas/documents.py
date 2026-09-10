from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.core import PyObjectId, generate_object_id

class DocumentBase(BaseModel):
    name: str
    document_type: str
    source: str
    department_id: Optional[PyObjectId] = None
    academic_year: Optional[str] = None
    access_classification: str = Field(default="public", description="Classification: public, internal, restricted")
    storage_path: str
    processing_status: str = Field(default="pending", description="Status: pending, processing, vectorized, failed")
    uploaded_by: PyObjectId

class DocumentCreate(DocumentBase):
    pass

class DocumentInDB(DocumentBase):
    id: PyObjectId = Field(default_factory=generate_object_id, alias="_id")
    uploaded_timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DocumentResponse(DocumentBase):
    id: PyObjectId = Field(alias="_id")
    uploaded_timestamp: datetime
    updated_at: datetime
