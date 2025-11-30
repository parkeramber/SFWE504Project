# app/services/scholarship_service.py
from typing import List

from sqlalchemy.orm import Session

from app.models.scholarship import Scholarship
from app.schemas import ScholarshipCreate


def create_scholarship(db: Session, data: ScholarshipCreate) -> Scholarship:
    scholarship = Scholarship(
        name=data.name,
        description=data.description,
        requirements=data.requirements,
        amount=data.amount,
        deadline=data.deadline,
    )
    db.add(scholarship)
    db.commit()
    db.refresh(scholarship)
    return scholarship


def list_scholarships(db: Session) -> List[Scholarship]:
    # simplest version: return all, newest first
    return db.query(Scholarship).order_by(Scholarship.deadline.asc()).all()
