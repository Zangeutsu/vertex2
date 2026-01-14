from enum import Enum
from sqlalchemy import Enum as SQLEnum, ForeignKey, Integer, String, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid
from app.db.session import Base

class BookingStatus(str, Enum):
    pending = "pending"
    confirmed = "confirmed"
    cancelled = "cancelled"

class Booking(Base):
    __tablename__ = "bookings"
    __table_args__ = {"schema": "app"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    shift_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("shifts.id", ondelete="CASCADE"))
    worker_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workers.id", ondelete="CASCADE"))
    status: Mapped[BookingStatus] = mapped_column(
        SQLEnum(BookingStatus, name="booking_status_enum"), default=BookingStatus.pending
    )

    shift = relationship("Shift", back_populates="bookings")
    worker = relationship("Worker", backref="bookings")
