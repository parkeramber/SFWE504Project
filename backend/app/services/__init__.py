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
    upsert_review,
    list_reviews_for_application,
    list_reviews_for_reviewer,
    update_application_status,
    evaluate_application_suitability,
)
from .applicant_profile_service import (
    applicant_profile_exists,
    get_profile_for_user,
    upsert_applicant_profile,
)
from .notification_service import (
    create_notification,
    list_notifications_for_user,
    list_unread_notifications_for_user,
    mark_notification_read,
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
    "upsert_review",
    "list_reviews_for_application",
    "list_reviews_for_reviewer",
    "update_application_status",
    "evaluate_application_suitability",
    # applicant profiles
    "applicant_profile_exists",
    "get_profile_for_user",
    "upsert_applicant_profile",
    # notifications
    "create_notification",
    "list_notifications_for_user",
    "list_unread_notifications_for_user",
    "mark_notification_read",
]
