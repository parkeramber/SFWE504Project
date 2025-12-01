# app/api/v1/routes_admin.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.scholarship import Scholarship

router = APIRouter(
    prefix="/admin",   # <-- keep this
    tags=["admin"],
)

@router.get("/summary")
def admin_summary(db: Session = Depends(get_db)):
    total_scholarships = db.query(Scholarship).count()
    total_users = db.query(User).count()

    # snake_case keys → TS maps them to camelCase
    return {
        "total_users": total_users,
        "total_scholarships": total_scholarships,
        "total_applicants": 12,        # fake number for now
        "total_applications": 5,       # fake number for now
    }
