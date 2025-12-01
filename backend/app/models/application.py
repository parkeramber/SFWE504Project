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

    # Primary key
    id = Column(Integer, primary_key=True, index=True)

    # Who applied (FK to users)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Which scholarship (FK to scholarships)
    scholarship_id = Column(Integer, ForeignKey("scholarships.id"), nullable=False)

    # OPTIONAL FIELDS – only used if scholarship requires them
    essay_text = Column(Text, nullable=True)
    transcript_url = Column(String, nullable=True)
    answers_json = Column(Text, nullable=True)  # e.g. JSON with answers

    # Which reviewer is assigned (can be null if not assigned yet)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Simple status
    status = Column(String, nullable=False, default="submitted")

    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )
