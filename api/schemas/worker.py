from datetime import date, datetime
from typing import List, Optional

from pydantic import EmailStr, Field, constr
import uuid

from api.schemas.base import ORMModel


class WorkerBase(ORMModel):
    first_name: str = Field(..., min_length=2, max_length=80)
    last_name: str = Field(..., min_length=2, max_length=80)
    email: EmailStr
    phone: Optional[str] = None
    city: Optional[str] = None
    document_id: constr(min_length=5, max_length=50)  # type: ignore[valid-type]
    active: bool = True
    date_of_birth: Optional[date] = None
    start_date: Optional[date] = None
    notes: Optional[str] = None


class WorkerCreate(WorkerBase):
    pass


class WorkerUpdate(ORMModel):
    first_name: Optional[str] = Field(None, min_length=2, max_length=80)
    last_name: Optional[str] = Field(None, min_length=2, max_length=80)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    document_id: Optional[constr(min_length=5, max_length=50)] = None  # type: ignore[valid-type]
    active: Optional[bool] = None
    date_of_birth: Optional[date] = None
    start_date: Optional[date] = None
    notes: Optional[str] = None


class WorkerOut(WorkerBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


from api.schemas.contract import ContractOut
from api.schemas.compliance import ComplianceOut


class WorkerDetail(WorkerOut):
    contracts: List[ContractOut] = []
    compliances: List[ComplianceOut] = []
