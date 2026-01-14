from api.repositories.base import BaseRepository
from api.models.booking import Booking
from api.schemas.scheduling import BookingBase
from sqlalchemy.ext.asyncio import AsyncSession

class BookingRepository(BaseRepository[Booking, BookingBase, BookingBase]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Booking)
