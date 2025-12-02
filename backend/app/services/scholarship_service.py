# app/services/scholarship_service.py
from typing import List, Optional

from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.models.scholarship import Scholarship
from app.schemas import ScholarshipCreate, ScholarshipUpdate


def list_scholarships(db: Session) -> List[Scholarship]:
    return db.query(Scholarship).all()


def search_scholarships(db: Session, keyword: str) -> List[Scholarship]:
    """
    Case-insensitive keyword search across scholarship name, description,
    and requirements.
    """
    pattern = f"%{keyword.lower()}%"
    return (
        db.query(Scholarship)
        .filter(
            or_(
                func.lower(Scholarship.name).like(pattern),
                func.lower(Scholarship.description).like(pattern),
                func.lower(Scholarship.requirements).like(pattern),
            )
        )
        .all()
    )


def create_scholarship(db: Session, payload: ScholarshipCreate) -> Scholarship:
    sch = Scholarship(
        name=payload.name,
        description=payload.description,
        amount=payload.amount,
        deadline=payload.deadline,
        requirements=payload.requirements,
        min_gpa=payload.min_gpa,
        required_citizenship=payload.required_citizenship,
        required_major=payload.required_major,
        required_minor=payload.required_minor,
        # NEW flags:
        requires_essay=payload.requires_essay,
        requires_transcript=payload.requires_transcript,
        requires_questions=payload.requires_questions,
    )
    db.add(sch)
    db.commit()
    db.refresh(sch)
    return sch


def get_scholarship(db: Session, scholarship_id: int) -> Optional[Scholarship]:
    return db.query(Scholarship).filter(Scholarship.id == scholarship_id).first()


def update_scholarship(
    db: Session,
    scholarship_id: int,
    payload: ScholarshipUpdate,
) -> Optional[Scholarship]:
    sch = get_scholarship(db, scholarship_id)
    if not sch:
        return None

    if payload.name is not None:
        sch.name = payload.name
    if payload.description is not None:
        sch.description = payload.description
    if payload.amount is not None:
        sch.amount = payload.amount
    if payload.deadline is not None:
        sch.deadline = payload.deadline
    if payload.requirements is not None:
        sch.requirements = payload.requirements
    if payload.min_gpa is not None:
        sch.min_gpa = payload.min_gpa
    if payload.required_citizenship is not None:
        sch.required_citizenship = payload.required_citizenship
    if payload.required_major is not None:
        sch.required_major = payload.required_major
    if payload.required_minor is not None:
        sch.required_minor = payload.required_minor

    # NEW optional updates for flags
    if payload.requires_essay is not None:
        sch.requires_essay = payload.requires_essay
    if payload.requires_transcript is not None:
        sch.requires_transcript = payload.requires_transcript
    if payload.requires_questions is not None:
        sch.requires_questions = payload.requires_questions

    db.add(sch)
    db.commit()
    db.refresh(sch)
    return sch


def delete_scholarship(db: Session, scholarship_id: int) -> bool:
    sch = get_scholarship(db, scholarship_id)
    if not sch:
        return False

    db.delete(sch)
    db.commit()
    return True
