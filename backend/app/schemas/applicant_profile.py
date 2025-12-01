# app/schemas/applicant_profile.py
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ApplicantProfileBase(BaseModel):
    student_id: str = Field(..., min_length=2, max_length=50)
    netid: str = Field(..., min_length=2, max_length=50)
    degree_major: str = Field(..., min_length=2, max_length=100)
    degree_minor: Optional[str] = Field(None, max_length=100)
    gpa: float = Field(..., ge=0.0, le=4.0)
    academic_achievements: Optional[str] = None
    financial_information: Optional[str] = None
    written_essays: Optional[str] = None


class ApplicantProfileCreate(ApplicantProfileBase):
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class ApplicantProfileRead(ApplicantProfileBase):
    id: int
    user_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
