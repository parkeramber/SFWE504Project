# app/schemas/suitability.py
from pydantic import BaseModel
from typing import List


class SuitabilityResult(BaseModel):
    status: str  # qualified | unqualified | unknown
    notes: List[str]
