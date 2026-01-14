from datetime import date, datetime
from enum import Enum
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.database import Base


class ContractStatus(str, Enum):
    draft = "draft"
    active = "active"
    terminated = "terminated"
    expired = "expired"


class ComplianceStatus(str, Enum):
    pending = "pending"
    scheduled = "scheduled"
    completed = "completed"
    overdue = "overdue"


class ComplianceType(str, Enum):
    medical_exam = "medical_exam"
    training = "training"
    document = "document"


class Worker(Base):
    __tablename__ = "workers"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    first_name: Mapped[str] = mapped_column(String(80))
    last_name: Mapped[str] = mapped_column(String(80))
    email: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    document_id: Mapped[str] = mapped_column(String(50), unique=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    medical_exam_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    contracts: Mapped[List["Contract"]] = relationship(
        back_populates="worker",
        cascade="all, delete-orphan",
    )
    compliances: Mapped[List["Compliance"]] = relationship(
        back_populates="worker",
        cascade="all, delete-orphan",
    )

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"


class Client(Base):
    __tablename__ = "clients"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), unique=True)
    contact_email: Mapped[str] = mapped_column(String(120))
    phone: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    contracts: Mapped[List["Contract"]] = relationship(
        back_populates="client",
        cascade="all, delete-orphan",
    )


class Contract(Base):
    __tablename__ = "contracts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    worker_id: Mapped[int] = mapped_column(ForeignKey("workers.id", ondelete="CASCADE"))
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id", ondelete="CASCADE"))
    role: Mapped[str] = mapped_column(String(120))
    start_date: Mapped[date] = mapped_column(Date)
    contract_end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    status: Mapped[ContractStatus] = mapped_column(String(20), default=ContractStatus.draft)
    hourly_rate: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    worker: Mapped[Worker] = relationship(back_populates="contracts")
    client: Mapped[Client] = relationship(back_populates="contracts")


class Compliance(Base):
    __tablename__ = "compliance_records"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    worker_id: Mapped[int] = mapped_column(ForeignKey("workers.id", ondelete="CASCADE"))
    type: Mapped[ComplianceType] = mapped_column(String(50))
    due_date: Mapped[date] = mapped_column(Date)
    status: Mapped[ComplianceStatus] = mapped_column(String(20), default=ComplianceStatus.pending)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    worker: Mapped[Worker] = relationship(back_populates="compliances")
