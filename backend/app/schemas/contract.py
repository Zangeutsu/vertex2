from datetime import date, datetime
from typing import Optional

from pydantic import Field
import uuid

from app.models.contract import ContractStatus
from app.schemas.base import ORMModel


class ContractBase(ORMModel):
    worker_id: uuid.UUID
    client_id: uuid.UUID
    role: str = Field(..., min_length=2, max_length=120)
    start_date: date
    end_date: Optional[date] = None
    status: ContractStatus = ContractStatus.draft
    hourly_rate: Optional[float] = Field(None, ge=0)
    document_url: Optional[str] = None


class ContractCreate(ContractBase):
    pass


class ContractUpdate(ORMModel):
    role: Optional[str] = Field(None, min_length=2, max_length=120)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[ContractStatus] = None
    hourly_rate: Optional[float] = Field(None, ge=0)
    document_url: Optional[str] = None


class ContractOut(ContractBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
