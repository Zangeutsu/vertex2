from datetime import date, datetime
from enum import Enum
from typing import Optional

from sqlalchemy import Date, DateTime, Enum as SQLEnum, ForeignKey, String, Text, func, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid

from api.db.session import Base


class ComplianceType(str, Enum):
    medical_exam = "medical_exam"
    training = "training"
    document = "document"


class ComplianceStatus(str, Enum):
    pending = "pending"
    scheduled = "scheduled"
    completed = "completed"
    overdue = "overdue"


class ComplianceRecord(Base):
    __tablename__ = "compliance_records"
    __table_args__ = {"schema": "app"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    worker_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workers.id", ondelete="CASCADE"))
    type: Mapped[ComplianceType] = mapped_column(SQLEnum(ComplianceType, name="compliance_type_enum"))
    due_date: Mapped[date] = mapped_column(Date)
    status: Mapped[ComplianceStatus] = mapped_column(SQLEnum(ComplianceStatus, name="compliance_status_enum"), default=ComplianceStatus.pending)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    document_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    worker: Mapped["Worker"] = relationship("Worker", back_populates="compliances")
