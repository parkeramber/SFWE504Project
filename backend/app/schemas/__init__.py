# app/schemas/__init__.py
from .scholarship import ScholarshipCreate, ScholarshipRead, ScholarshipUpdate
from .application import ApplicationCreate, ApplicationRead
from .applicant_profile import ApplicantProfileCreate, ApplicantProfileRead

__all__ = [
    "ScholarshipCreate",
    "ScholarshipRead",
    "ScholarshipUpdate",
    "ApplicationCreate",
    "ApplicationRead",
    "ApplicantProfileCreate",
    "ApplicantProfileRead",
]
