# app/api/v1/routes_scholarships.py
from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import ScholarshipCreate, ScholarshipRead
from app.services import create_scholarship, list_scholarships

# ⬅️ NOTE: no prefix here – we’ll add "/api/v1" in main.py
router = APIRouter(tags=["scholarships"])


@router.get("/scholarships/", response_model=List[ScholarshipRead])
def get_scholarships(db: Session = Depends(get_db)):
    """
    Return all scholarships (for now: no filters).
    This is what the Dashboard will call for applicants.
    """
    return list_scholarships(db)


@router.post(
    "/scholarships/",
    response_model=ScholarshipRead,
    status_code=status.HTTP_201_CREATED,
)
def create_scholarship_endpoint(
    payload: ScholarshipCreate,
    db: Session = Depends(get_db),
):
    """
    Create a new scholarship.

    For demo: open to everyone.
    Later: lock down to admin users only.
    """
    return create_scholarship(db, payload)
