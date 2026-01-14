from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from api.db.session import get_session
from api.services.activity_service import ActivityService
from api.schemas.activity import ActivityOut

router = APIRouter()

@router.get("/", response_model=List[ActivityOut])
async def list_activities(
    limit: int = Query(10, gt=0, le=50),
    session: AsyncSession = Depends(get_session)
):
    service = ActivityService(session)
    return await service.list_recent_activities(limit=limit)
