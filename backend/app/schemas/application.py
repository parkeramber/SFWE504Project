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


class ApplicationCreate(ApplicationBase):
    """
    Data the frontend sends when creating an application.
    For now your frontend is just sending:
      { user_id, scholarship_id }
    which is fine because everything else is optional.
    """
    pass


class ApplicationRead(ApplicationBase):
    """
    Data you send back to the client when reading an application.
    """
    id: int
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
