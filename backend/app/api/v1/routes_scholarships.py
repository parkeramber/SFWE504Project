# app/api/v1/routes_scholarships.py
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import ScholarshipCreate, ScholarshipRead, ScholarshipUpdate
from app.services import (
    list_scholarships,
    create_scholarship,
    get_scholarship,
    update_scholarship,
    delete_scholarship,
)

router = APIRouter(
    prefix="/scholarships",
    tags=["scholarships"],
)


@router.get("/", response_model=List[ScholarshipRead])
def get_scholarships(db: Session = Depends(get_db)):
    """Return all scholarships."""
    return list_scholarships(db)


@router.post(
    "/",
    response_model=ScholarshipRead,
    status_code=status.HTTP_201_CREATED,
)
def create_scholarship_endpoint(
    payload: ScholarshipCreate,
    db: Session = Depends(get_db),
):
    """Create a new scholarship."""
    return create_scholarship(db, payload)


@router.get("/{scholarship_id}", response_model=ScholarshipRead)
def get_scholarship_endpoint(
    scholarship_id: int,
    db: Session = Depends(get_db),
):
    """Get a single scholarship by ID."""
    sch = get_scholarship(db, scholarship_id)
    if not sch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scholarship not found",
        )
    return sch


@router.patch("/{scholarship_id}", response_model=ScholarshipRead)
def update_scholarship_endpoint(
    scholarship_id: int,
    payload: ScholarshipUpdate,
    db: Session = Depends(get_db),
):
    """Update an existing scholarship (partial update)."""
    sch = update_scholarship(db, scholarship_id, payload)
    if not sch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scholarship not found",
        )
    return sch


@router.delete(
    "/{scholarship_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_scholarship_endpoint(
    scholarship_id: int,
    db: Session = Depends(get_db),
):
    """Delete a scholarship."""
    deleted = delete_scholarship(db, scholarship_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scholarship not found",
        )
    # 204 No Content: just return None
    return None
