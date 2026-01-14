from typing import List, Optional
import uuid
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from api.models.shift import Shift
from api.models.booking import Booking, BookingStatus
from api.repositories.shift_repository import ShiftRepository
from api.repositories.booking_repository import BookingRepository
from api.schemas.scheduling import ShiftCreate, ShiftUpdate, BookingBase

class SchedulingService:
    def __init__(self, session: AsyncSession):
        self.shift_repo = ShiftRepository(session)
        self.booking_repo = BookingRepository(session)

    async def create_shift(self, payload: ShiftCreate) -> Shift:
        return await self.shift_repo.create(payload)

    async def get_shifts(self, start_date: date, end_date: date) -> List[Shift]:
        return await self.shift_repo.get_by_date_range(start_date, end_date)

    async def update_shift(self, shift_id: uuid.UUID, payload: ShiftUpdate) -> Optional[Shift]:
        shift = await self.shift_repo.get(shift_id)
        if not shift:
            return None
        return await self.shift_repo.update(shift, payload)

    async def delete_shift(self, shift_id: uuid.UUID) -> bool:
        shift = await self.shift_repo.get(shift_id)
        if not shift:
            return False
        await self.shift_repo.delete(shift)
        return True

    async def create_booking(self, payload: BookingBase) -> Booking:
        # Here we could check for double booking or worker availability
        return await self.booking_repo.create(payload)

    async def delete_booking(self, booking_id: uuid.UUID) -> bool:
        booking = await self.booking_repo.get(booking_id)
        if not booking:
            return False
        await self.booking_repo.delete(booking)
        return True

    async def update_booking_status(self, booking_id: uuid.UUID, status: BookingStatus) -> Optional[Booking]:
        booking = await self.booking_repo.get(booking_id)
        if not booking:
            return None
        booking.status = status
        await self.booking_repo.session.commit()
        await self.booking_repo.session.refresh(booking)
        return booking
