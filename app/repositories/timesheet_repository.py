from sqlalchemy.ext.asyncio import AsyncSession
from app.models.timesheet import Timesheet
from app.repositories.base import BaseRepository
from app.schemas.timesheet import TimesheetCreate, TimesheetUpdate

class TimesheetRepository(BaseRepository[Timesheet, TimesheetCreate, TimesheetUpdate]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Timesheet)
