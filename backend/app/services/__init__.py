# app/services/__init__.py
from .scholarship_service import create_scholarship, list_scholarships

__all__ = [
    "create_scholarship",
    "list_scholarships",
]
