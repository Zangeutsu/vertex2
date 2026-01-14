from datetime import date
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from api.db.session import get_session
from api.schemas.scheduling import ShiftCreate, ShiftUpdate, ShiftOut, BookingBase, BookingOut
from api.services.scheduling_service import SchedulingService

router = APIRouter()

@router.get("/shifts", response_model=List[ShiftOut])
async def list_shifts(
    start_date: date, 
    end_date: date, 
    db: AsyncSession = Depends(get_session)
):
    service = SchedulingService(db)
    return await service.get_shifts(start_date, end_date)

@router.post("/shifts", response_model=ShiftOut)
async def create_shift(payload: ShiftCreate, db: AsyncSession = Depends(get_session)):
    service = SchedulingService(db)
    return await service.create_shift(payload)

@router.patch("/shifts/{shift_id}", response_model=ShiftOut)
async def update_shift(shift_id: uuid.UUID, payload: ShiftUpdate, db: AsyncSession = Depends(get_session)):
    service = SchedulingService(db)
    shift = await service.update_shift(shift_id, payload)
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    return shift

@router.delete("/shifts/{shift_id}")
async def delete_shift(shift_id: uuid.UUID, db: AsyncSession = Depends(get_session)):
    service = SchedulingService(db)
    if not await service.delete_shift(shift_id):
        raise HTTPException(status_code=404, detail="Shift not found")
    return {"detail": "Shift deleted"}

@router.post("/bookings", response_model=BookingOut)
async def create_booking(payload: BookingBase, db: AsyncSession = Depends(get_session)):
    service = SchedulingService(db)
    return await service.create_booking(payload)

@router.delete("/bookings/{booking_id}")
async def delete_booking(booking_id: uuid.UUID, db: AsyncSession = Depends(get_session)):
    service = SchedulingService(db)
    if not await service.delete_booking(booking_id):
        raise HTTPException(status_code=404, detail="Booking not found")
    return {"detail": "Booking deleted"}
