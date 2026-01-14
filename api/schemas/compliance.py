from datetime import date, datetime
from typing import Optional

from pydantic import Field
import uuid

from api.models.compliance import ComplianceStatus, ComplianceType
from api.schemas.base import ORMModel


class ComplianceBase(ORMModel):
    worker_id: uuid.UUID
    type: ComplianceType
    due_date: date
    status: ComplianceStatus = ComplianceStatus.pending
    notes: Optional[str] = None
    document_url: Optional[str] = None


class ComplianceCreate(ComplianceBase):
    pass


class ComplianceUpdate(ORMModel):
    type: Optional[ComplianceType] = None
    due_date: Optional[date] = None
    status: Optional[ComplianceStatus] = None
    notes: Optional[str] = None
    document_url: Optional[str] = None


class ComplianceOut(ComplianceBase):
    id: uuid.UUID
    created_at: datetime
