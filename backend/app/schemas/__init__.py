# app/schemas/__init__.py
from .scholarship import ScholarshipCreate, ScholarshipRead, ScholarshipUpdate
from .application import ApplicationCreate, ApplicationRead

__all__ = [
    "ScholarshipCreate",
    "ScholarshipRead",
    "ScholarshipUpdate",
    "ApplicationCreate",
    "ApplicationRead",
]
