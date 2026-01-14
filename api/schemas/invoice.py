from datetime import date, datetime
from typing import List, Optional

from pydantic import Field
import uuid

from api.models.invoice import InvoiceStatus
from api.schemas.base import ORMModel

class InvoiceBase(ORMModel):
    client_id: uuid.UUID
    number: str = Field(..., min_length=1, max_length=50)
    issue_date: date
    due_date: date
    total_amount: float = Field(..., ge=0)
    status: InvoiceStatus = InvoiceStatus.draft
    notes: Optional[str] = None

class InvoiceCreate(InvoiceBase):
    pass

class InvoiceUpdate(ORMModel):
    status: Optional[InvoiceStatus] = None
    notes: Optional[str] = None
    due_date: Optional[date] = None

from api.schemas.timesheet import TimesheetOut

class InvoiceOut(InvoiceBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

class InvoiceDetailOut(InvoiceOut):
    timesheets: List[TimesheetOut] = []
