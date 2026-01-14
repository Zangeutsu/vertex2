from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from api.api.deps import get_db
from api.schemas.dashboard import DashboardResponse
from api.services.dashboard_service import DashboardService

router = APIRouter()


@router.get("", response_model=DashboardResponse)
async def get_dashboard(db: AsyncSession = Depends(get_db)) -> DashboardResponse:
    service = DashboardService(db)
    return await service.get_dashboard()
