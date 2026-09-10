from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.core import PyObjectId, generate_object_id

class ExpenseBase(BaseModel):
    event_id: Optional[PyObjectId] = None
    category: str
    amount: float = Field(ge=0.0)
    currency: str = Field(default="USD")
    description: str
    recorded_by: PyObjectId
    approved_by: Optional[PyObjectId] = None
    date: datetime
    status: str = Field(default="pending", description="Status: pending, approved, paid, rejected")

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseInDB(ExpenseBase):
    id: PyObjectId = Field(default_factory=generate_object_id, alias="_id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ExpenseResponse(ExpenseBase):
    id: PyObjectId = Field(alias="_id")
    created_at: datetime
    updated_at: datetime
