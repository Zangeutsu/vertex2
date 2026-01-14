from datetime import datetime
from enum import Enum
from typing import Optional

from sqlalchemy import DateTime, Enum as SQLEnum, ForeignKey, String, Text, func, UUID
from sqlalchemy.orm import Mapped, mapped_column
import uuid

from app.db.session import Base

class ActivityType(str, Enum):
    worker_created = "worker_created"
    contract_signed = "contract_signed"
    contract_expired = "contract_expired"
    invoice_generated = "invoice_generated"
    invoice_paid = "invoice_paid"
    compliance_overdue = "compliance_overdue"
    compliance_updated = "compliance_updated"

class Activity(Base):
    __tablename__ = "activities"
    __table_args__ = {"schema": "app"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type: Mapped[ActivityType] = mapped_column(SQLEnum(ActivityType, name="activity_type_enum"))
    description: Mapped[str] = mapped_column(Text)
    entity_type: Mapped[str] = mapped_column(String(50))  # e.g., "worker", "contract", "invoice"
    entity_id: Mapped[str] = mapped_column(String(50), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
