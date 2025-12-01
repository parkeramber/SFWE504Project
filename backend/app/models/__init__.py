# app/models/__init__.py
from app.models.user import User
from app.models.scholarship import Scholarship
from app.models.application import Application
from app.models.applicant_profile import ApplicantProfile

__all__ = ["User", "Scholarship", "Application", "ApplicantProfile"]
