from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.repositories.base import BaseRepository
from app.models.shift import Shift
from app.schemas.scheduling import ShiftCreate, ShiftUpdate
from datetime import date

class ShiftRepository(BaseRepository[Shift, ShiftCreate, ShiftUpdate]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Shift)

    async def get_by_date_range(self, start_date: date, end_date: date) -> List[Shift]:
        result = await self.session.execute(
            select(Shift)
            .where(Shift.date >= start_date, Shift.date <= end_date)
            .options(selectinload(Shift.bookings))
        )
        return list(result.scalars().all())

    async def get_shift_with_bookings(self, shift_id: int) -> Shift:
        result = await self.session.execute(
            select(Shift).where(Shift.id == shift_id).options(selectinload(Shift.bookings))
        )
        return result.scalar_one_or_none()
