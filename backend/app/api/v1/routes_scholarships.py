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
    search_scholarships as search_scholarships_service,
)

router = APIRouter(tags=["scholarships"])


@router.get("/scholarships/", response_model=List[ScholarshipRead])
def get_scholarships(db: Session = Depends(get_db)):
    return list_scholarships(db)


# 🔍 SIMPLE, SAFE SEARCH ENDPOINT
@router.get("/scholarships/search", response_model=List[ScholarshipRead])
def search_scholarships_endpoint(
    keyword: str = "",  # read from query: /scholarships/search?keyword=foo
    db: Session = Depends(get_db),
):
    # if keyword is empty, just return all scholarships
    if not keyword.strip():
        return list_scholarships(db)

    return search_scholarships_service(db, keyword.strip())


@router.post(
    "/scholarships/",
    response_model=ScholarshipRead,
    status_code=status.HTTP_201_CREATED,
)
def create_scholarship_endpoint(
    payload: ScholarshipCreate,
    db: Session = Depends(get_db),
):
    return create_scholarship(db, payload)


@router.put("/scholarships/{scholarship_id}", response_model=ScholarshipRead)
def update_scholarship_endpoint(
    scholarship_id: int,
    payload: ScholarshipUpdate,
    db: Session = Depends(get_db),
):
    updated = update_scholarship(db, scholarship_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Scholarship not found")
    return updated


@router.delete("/scholarships/{scholarship_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_scholarship_endpoint(
    scholarship_id: int,
    db: Session = Depends(get_db),
):
    ok = delete_scholarship(db, scholarship_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Scholarship not found")
