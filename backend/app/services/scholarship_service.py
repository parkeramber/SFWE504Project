# app/services/scholarship.py
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.scholarship import Scholarship  # <-- if your model is elsewhere, adjust this import
from app.schemas import ScholarshipCreate, ScholarshipUpdate


def list_scholarships(db: Session) -> List[Scholarship]:
    """Return all scholarships."""
    return db.query(Scholarship).all()


def create_scholarship(db: Session, payload: ScholarshipCreate) -> Scholarship:
    """Create and persist a new scholarship."""
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
    """Fetch a single scholarship by ID, or None if not found."""
    return db.query(Scholarship).filter(Scholarship.id == scholarship_id).first()


def update_scholarship(
    db: Session,
    scholarship_id: int,
    payload: ScholarshipUpdate,
) -> Optional[Scholarship]:
    """
    Apply partial updates to a scholarship.
    Returns the updated scholarship or None if not found.
    """
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
    """
    Delete a scholarship by ID.
    Returns True if deleted, False if not found.
    """
    sch = get_scholarship(db, scholarship_id)
    if not sch:
        return False

    db.delete(sch)
    db.commit()
    return True
