# app/schemas/scholarship.py
from datetime import date
from typing import Optional

from pydantic import BaseModel


class ScholarshipBase(BaseModel):
    name: str
    description: Optional[str] = None
    amount: int  # change to float/Decimal if your DB uses that
    deadline: date
    requirements: Optional[str] = None


class ScholarshipCreate(ScholarshipBase):
    """Schema for creating a scholarship."""
    pass


class ScholarshipUpdate(BaseModel):
    """
    Schema for updating a scholarship.
    All fields are optional to allow partial updates.
    """
    name: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[int] = None
    deadline: Optional[date] = None
    requirements: Optional[str] = None


class ScholarshipRead(ScholarshipBase):
    """Schema returned to the frontend."""
    id: int

    class Config:
        # Pydantic v2 version of orm_mode = True
        from_attributes = True
