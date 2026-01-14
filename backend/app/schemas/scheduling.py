from datetime import date, time
from typing import List, Optional
from pydantic import Field
import uuid
from app.schemas.base import ORMModel

class ShiftBase(ORMModel):
    client_id: uuid.UUID
    date: date
    role: str = Field(..., min_length=1, max_length=100)
    required_count: int = Field(1, ge=1)
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    notes: Optional[str] = None

class ShiftCreate(ShiftBase):
    pass

class ShiftUpdate(ORMModel):
    role: Optional[str] = None
    required_count: Optional[int] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    notes: Optional[str] = None

class BookingBase(ORMModel):
    shift_id: int
    worker_id: uuid.UUID

class BookingOut(BookingBase):
    id: uuid.UUID
    status: str

class ShiftOut(ShiftBase):
    id: uuid.UUID
    bookings: List[BookingOut] = []
