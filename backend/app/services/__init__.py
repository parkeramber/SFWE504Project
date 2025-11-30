# app/services/__init__.py
from .scholarship_service import create_scholarship, list_scholarships,get_scholarship,update_scholarship,delete_scholarship

__all__ = [
    "list_scholarships",
    "create_scholarship",
    "get_scholarship",
    "update_scholarship",
    "delete_scholarship",
]
