# app/schemas/application.py
from typing import Optional
from datetime import datetime

from pydantic import BaseModel


class ApplicationBase(BaseModel):
    user_id: int
    scholarship_id: int

    # Optional fields – only used if the scholarship requires them
    essay_text: Optional[str] = None
    transcript_url: Optional[str] = None
    answers_json: Optional[str] = None  # e.g., JSON string of Q&A


class ApplicationCreate(BaseModel):
    user_id: int
    scholarship_id: int
    essay_text: Optional[str] = None
    transcript_url: Optional[str] = None
    answers_json: Optional[str] = None
    # NEW
    reviewer_id: Optional[int] = None


class ApplicationRead(BaseModel):
    id: int
    user_id: int
    scholarship_id: int
    essay_text: Optional[str] = None
    transcript_url: Optional[str] = None
    answers_json: Optional[str] = None
    status: str
    created_at: datetime
    # NEW
    reviewer_id: Optional[int] = None

    class Config:
        orm_mode = True

class ApplicationAssign(BaseModel):
    reviewer_id: int