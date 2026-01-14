from datetime import date, time
from sqlalchemy import Date, ForeignKey, Integer, String, Time, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from api.db.session import Base
import uuid

class Shift(Base):
    __tablename__ = "shifts"
    __table_args__ = {"schema": "app"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("clients.id", ondelete="CASCADE"))
    date: Mapped[date] = mapped_column(Date, index=True)
    role: Mapped[str] = mapped_column(String(100))
    required_count: Mapped[int] = mapped_column(Integer, default=1)
    start_time: Mapped[time] = mapped_column(Time, nullable=True)
    end_time: Mapped[time] = mapped_column(Time, nullable=True)
    notes: Mapped[str] = mapped_column(String(500), nullable=True)

    client = relationship("Client", backref="shifts")
    bookings = relationship("Booking", back_populates="shift", cascade="all, delete-orphan")
