from datetime import date, datetime
from enum import Enum
from typing import Optional

from sqlalchemy import Date, DateTime, Enum as SQLEnum, ForeignKey, Numeric, String, func, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid

from api.db.session import Base


class ContractStatus(str, Enum):
    draft = "draft"
    active = "active"
    terminated = "terminated"
    expired = "expired"


class Contract(Base):
    __tablename__ = "contracts"
    __table_args__ = {"schema": "app"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    worker_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workers.id", ondelete="CASCADE"))
    client_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("clients.id", ondelete="CASCADE"))
    role: Mapped[str] = mapped_column(String(120))
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    status: Mapped[ContractStatus] = mapped_column(SQLEnum(ContractStatus, name="contract_status_enum"), default=ContractStatus.draft)
    hourly_rate: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    document_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    worker: Mapped["Worker"] = relationship("Worker", back_populates="contracts")
    client: Mapped["Client"] = relationship("Client", back_populates="contracts")
