# app/models/application.py

from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
)

from app.database import Base


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)

    # who applied
    user_id = Column(Integer, nullable=False)
    # you *can* make this a real FK if you want:
    # user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # which scholarship
    scholarship_id = Column(Integer, nullable=False)
    # or: scholarship_id = Column(Integer, ForeignKey("scholarships.id"), nullable=False)

    # OPTIONAL FIELDS – only used if scholarship requires them
    essay_text = Column(Text, nullable=True)
    transcript_url = Column(String, nullable=True)
    answers_json = Column(Text, nullable=True)  # e.g. JSON with answers

    # simple status
    status = Column(String, nullable=False, default="submitted")

    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )
