from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.api.deps import get_db
from app.schemas.timesheet import TimesheetCreate, TimesheetOut, TimesheetUpdate
from app.services.timesheet_service import TimesheetService

router = APIRouter()

@router.get("", response_model=list[TimesheetOut])
async def list_timesheets(db: AsyncSession = Depends(get_db)) -> list[TimesheetOut]:
    service = TimesheetService(db)
    return [TimesheetOut.model_validate(t) for t in await service.list_timesheets()]

@router.post("", response_model=TimesheetOut, status_code=status.HTTP_201_CREATED)
async def create_timesheet(payload: TimesheetCreate, db: AsyncSession = Depends(get_db)) -> TimesheetOut:
    service = TimesheetService(db)
    timesheet = await service.create_timesheet(payload)
    return TimesheetOut.model_validate(timesheet)

@router.put("/{timesheet_id}", response_model=TimesheetOut)
async def update_timesheet(
    timesheet_id: uuid.UUID, payload: TimesheetUpdate, db: AsyncSession = Depends(get_db)
) -> TimesheetOut:
    service = TimesheetService(db)
    try:
        timesheet = await service.update_timesheet(timesheet_id, payload)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Timesheet not found")
    return TimesheetOut.model_validate(timesheet)

@router.delete("/{timesheet_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_timesheet(timesheet_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> None:
    service = TimesheetService(db)
    try:
        await service.delete_timesheet(timesheet_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Timesheet not found")
