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
