from typing import TYPE_CHECKING, List, Optional
from datetime import date, datetime
from sqlalchemy import Boolean, Date, DateTime, String, Text, func, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid

from api.db.session import Base

if TYPE_CHECKING:
    from .compliance import ComplianceRecord
    from .contract import Contract
    from .timesheet import Timesheet


class Worker(Base):
    __tablename__ = "workers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    first_name: Mapped[str] = mapped_column(String(80))
    last_name: Mapped[str] = mapped_column(String(80))
    email: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    document_id: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    date_of_birth: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    contracts: Mapped[List["Contract"]] = relationship("Contract", back_populates="worker", cascade="all, delete-orphan")
    compliances: Mapped[List["ComplianceRecord"]] = relationship("ComplianceRecord", back_populates="worker", cascade="all, delete-orphan")
    timesheets: Mapped[List["Timesheet"]] = relationship("Timesheet", back_populates="worker", cascade="all, delete-orphan")

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"
