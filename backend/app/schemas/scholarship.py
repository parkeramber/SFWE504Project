# app/schemas/scholarship.py
from datetime import date
from typing import Optional

from pydantic import BaseModel


class ScholarshipBase(BaseModel):
    name: str
    description: str
    amount: int
    deadline: date
    requirements: Optional[str] = None

    # NEW fields – what the admin can toggle
    requires_essay: bool = False
    requires_transcript: bool = False
    requires_questions: bool = False


class ScholarshipCreate(ScholarshipBase):
    """Fields required when creating a scholarship."""
    pass


class ScholarshipUpdate(BaseModel):
    """Fields that can be updated (all optional)."""
    name: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[int] = None
    deadline: Optional[date] = None
    requirements: Optional[str] = None

    # NEW optional flags for partial updates
    requires_essay: Optional[bool] = None
    requires_transcript: Optional[bool] = None
    requires_questions: Optional[bool] = None


class ScholarshipRead(ScholarshipBase):
    id: int

    class Config:
        orm_mode = True
