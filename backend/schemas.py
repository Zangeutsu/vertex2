from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, constr

from backend.models import ComplianceStatus, ComplianceType, ContractStatus


class ORMModel(BaseModel):
    model_config = {"from_attributes": True}


class WorkerBase(ORMModel):
    first_name: constr(min_length=2, max_length=80)  # type: ignore[valid-type]
    last_name: constr(min_length=2, max_length=80)  # type: ignore[valid-type]
    email: EmailStr
    phone: Optional[str] = None
    document_id: constr(min_length=5, max_length=50)  # type: ignore[valid-type]
    active: bool = True
    medical_exam_date: Optional[date] = None


class WorkerCreate(WorkerBase):
    pass


class WorkerUpdate(ORMModel):
    first_name: Optional[constr(min_length=2, max_length=80)] = None  # type: ignore[valid-type]
    last_name: Optional[constr(min_length=2, max_length=80)] = None  # type: ignore[valid-type]
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    document_id: Optional[constr(min_length=5, max_length=50)] = None  # type: ignore[valid-type]
    active: Optional[bool] = None
    medical_exam_date: Optional[date] = None


class WorkerOut(WorkerBase):
    id: int
    created_at: datetime
    updated_at: datetime


class ClientBase(ORMModel):
    name: constr(min_length=2, max_length=120)  # type: ignore[valid-type]
    contact_email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None


class ClientCreate(ClientBase):
    pass


class ClientUpdate(ORMModel):
    name: Optional[constr(min_length=2, max_length=120)] = None  # type: ignore[valid-type]
    contact_email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class ClientOut(ClientBase):
    id: int


class ContractBase(ORMModel):
    worker_id: int
    client_id: int
    role: constr(min_length=2, max_length=120)  # type: ignore[valid-type]
    start_date: date
    contract_end_date: Optional[date] = Field(None, description="Data final prevista do contrato")
    status: ContractStatus = ContractStatus.draft
    hourly_rate: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None


class ContractCreate(ContractBase):
    pass


class ContractUpdate(ORMModel):
    role: Optional[constr(min_length=2, max_length=120)] = None  # type: ignore[valid-type]
    start_date: Optional[date] = None
    contract_end_date: Optional[date] = None
    status: Optional[ContractStatus] = None
    hourly_rate: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None


class ContractOut(ContractBase):
    id: int
    created_at: datetime
    updated_at: datetime


class ComplianceBase(ORMModel):
    worker_id: int
    type: ComplianceType
    due_date: date
    status: ComplianceStatus = ComplianceStatus.pending
    notes: Optional[str] = None


class ComplianceCreate(ComplianceBase):
    pass


class ComplianceUpdate(ORMModel):
    type: Optional[ComplianceType] = None
    due_date: Optional[date] = None
    status: Optional[ComplianceStatus] = None
    notes: Optional[str] = None


class ComplianceOut(ComplianceBase):
    id: int
    created_at: datetime
