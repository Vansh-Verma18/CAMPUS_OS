from enum import Enum
from pydantic import ConfigDict
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.core import PyObjectId, generate_object_id

class DocumentAccessClassification(str, Enum):
    PUBLIC = "PUBLIC"
    DEPARTMENT = "DEPARTMENT"
    CLUB = "CLUB"
    ADMIN = "ADMIN"

class DocumentBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    document_name: str
    document_type: str
    source: str = "manual_upload"
    department: Optional[str] = None
    year: Optional[int] = None
    access_classification: DocumentAccessClassification = Field(default=DocumentAccessClassification.PUBLIC)
    
class DocumentCreate(DocumentBase):
    pass

class DocumentInDB(DocumentBase):
    id: PyObjectId = Field(default_factory=generate_object_id, alias="_id")
    file_path: str
    file_size_bytes: int
    page_count: Optional[int] = None
    chunk_count: int = 0
    uploaded_by: PyObjectId
    upload_timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    processing_status: str = Field(default="pending")

class DocumentResponse(DocumentBase):
    id: PyObjectId = Field(alias="_id")
    file_path: str
    file_size_bytes: int
    page_count: Optional[int] = None
    chunk_count: int
    uploaded_by: PyObjectId
    upload_timestamp: datetime
    processing_status: str

