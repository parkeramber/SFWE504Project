# app/models/scholarship.py

from sqlalchemy import Boolean, Column, Integer, String, Text, Date
from app.database import Base


class Scholarship(Base):
    __tablename__ = "scholarships"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    amount = Column(Integer, nullable=False)
    deadline = Column(Date, nullable=False)
    requirements = Column(Text, nullable=True)

    # NEW flags controlled by ENGR Admin
    requires_essay = Column(Boolean, nullable=False, default=False)
    requires_transcript = Column(Boolean, nullable=False, default=False)
    requires_questions = Column(Boolean, nullable=False, default=False)
