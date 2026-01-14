from typing import TYPE_CHECKING, List, Optional
from datetime import datetime

from sqlalchemy import DateTime, String, func, Text, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid

from app.db.session import Base

if TYPE_CHECKING:
    from .contract import Contract
    from .timesheet import Timesheet


class Client(Base):
    __tablename__ = "clients"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(120), unique=True)
    contact_email: Mapped[str] = mapped_column(String(120))
    phone: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    contracts: Mapped[List["Contract"]] = relationship("Contract", back_populates="client", cascade="all, delete-orphan")
    timesheets: Mapped[List["Timesheet"]] = relationship("Timesheet", back_populates="client", cascade="all, delete-orphan")
