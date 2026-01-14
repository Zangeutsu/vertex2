from datetime import date, datetime
from typing import Optional

from sqlalchemy import Date, ForeignKey, Numeric, Text, DateTime, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
import uuid

from api.db.session import Base

class Timesheet(Base):
    __tablename__ = "timesheets"
    __table_args__ = {"schema": "app"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    worker_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workers.id", ondelete="CASCADE"))
    client_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("clients.id", ondelete="CASCADE"))
    invoice_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("invoices.id", ondelete="SET NULL"), nullable=True)
    date: Mapped[date] = mapped_column(Date, index=True)
    hours: Mapped[float] = mapped_column(Numeric(4, 2))
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    worker: Mapped["Worker"] = relationship("Worker", back_populates="timesheets")
    client: Mapped["Client"] = relationship("Client", back_populates="timesheets")
    invoice: Mapped[Optional["Invoice"]] = relationship("Invoice", back_populates="timesheets")
