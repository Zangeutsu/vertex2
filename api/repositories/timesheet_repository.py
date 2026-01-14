from sqlalchemy.ext.asyncio import AsyncSession
from api.models.timesheet import Timesheet
from api.repositories.base import BaseRepository
from api.schemas.timesheet import TimesheetCreate, TimesheetUpdate

class TimesheetRepository(BaseRepository[Timesheet, TimesheetCreate, TimesheetUpdate]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Timesheet)
