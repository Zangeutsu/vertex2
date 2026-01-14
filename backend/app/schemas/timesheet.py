from datetime import date, datetime
from typing import Optional
from pydantic import Field
import uuid
from .base import ORMModel

class TimesheetBase(ORMModel):
    worker_id: uuid.UUID
    client_id: uuid.UUID
    date: date
    hours: float = Field(..., ge=0, le=24)
    notes: Optional[str] = None

class TimesheetCreate(TimesheetBase):
    pass

class TimesheetUpdate(ORMModel):
    date: Optional[date] = None
    hours: Optional[float] = Field(None, ge=0, le=24)
    notes: Optional[str] = None

class TimesheetOut(TimesheetBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
