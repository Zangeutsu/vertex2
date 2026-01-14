from typing import Sequence
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from app.models.timesheet import Timesheet
from app.repositories.timesheet_repository import TimesheetRepository
from app.schemas.timesheet import TimesheetCreate, TimesheetUpdate

class TimesheetService:
    def __init__(self, session: AsyncSession):
        self.repo = TimesheetRepository(session)

    async def list_timesheets(self) -> Sequence[Timesheet]:
        return await self.repo.list()

    async def create_timesheet(self, payload: TimesheetCreate) -> Timesheet:
        return await self.repo.create(payload)

    async def update_timesheet(self, timesheet_id: uuid.UUID, payload: TimesheetUpdate) -> Timesheet:
        timesheet = await self.repo.get(timesheet_id)
        if not timesheet:
            raise ValueError("Timesheet not found")
        return await self.repo.update(timesheet, payload)

    async def delete_timesheet(self, timesheet_id: uuid.UUID) -> None:
        timesheet = await self.repo.get(timesheet_id)
        if not timesheet:
            raise ValueError("Timesheet not found")
        await self.repo.delete(timesheet)
