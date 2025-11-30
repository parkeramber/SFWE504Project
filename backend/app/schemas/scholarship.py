# app/schemas/scholarship.py
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field


class ScholarshipBase(BaseModel):
    name: str = Field(..., max_length=200)
    description: Optional[str] = None
    requirements: Optional[str] = None
    amount: int = Field(..., ge=0)
    deadline: date


class ScholarshipCreate(ScholarshipBase):
    """Used when creating a scholarship."""
    pass


class ScholarshipRead(ScholarshipBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # tells Pydantic to read from SQLAlchemy model
