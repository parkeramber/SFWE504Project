from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def test_scholarships():
    return {"message": "Scholarships route is working"}

