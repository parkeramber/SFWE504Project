# app/models/scholarship.py
from datetime import datetime, date

from sqlalchemy import Column, Integer, String, Text, Date, DateTime
from sqlalchemy.sql import func

from app.database import Base


class Scholarship(Base):
    __tablename__ = "scholarships"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    requirements = Column(Text, nullable=True)

    # simple: store amount as integer dollars for now
    amount = Column(Integer, nullable=False)

    deadline = Column(Date, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
