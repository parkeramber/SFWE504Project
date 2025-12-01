# app/services/__init__.py

from .scholarship_service import (
    list_scholarships,
    search_scholarships,
    create_scholarship,
    get_scholarship,
    update_scholarship,
    delete_scholarship,
)

from .application_service import (
    create_application,
    list_applications_for_user,
    get_application,
    assign_reviewer, 
    list_applications_for_reviewer,
    list_all_applications, 
)

__all__ = [
    # scholarships
    "list_scholarships",
    "search_scholarships",
    "create_scholarship",
    "get_scholarship",
    "update_scholarship",
    "delete_scholarship",
    # applications
    "create_application",
    "list_applications_for_user",
    "get_application",
    "assign_reviewer",
    "list_applications_for_reviewer",
    "list_all_applications", 
]
