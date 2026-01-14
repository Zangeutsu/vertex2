from api.schemas.dashboard import DashboardKpis, DashboardResponse
from api.services.alert_service import AlertService
from api.services.compliance_service import ComplianceService
from api.repositories.contract_repository import ContractRepository
from api.repositories.worker_repository import WorkerRepository
from sqlalchemy.ext.asyncio import AsyncSession


class DashboardService:
    def __init__(self, session: AsyncSession):
        self.worker_repo = WorkerRepository(session)
        self.contract_repo = ContractRepository(session)
        self.compliance_service = ComplianceService(session)
        self.alert_service = AlertService(session)

    async def get_dashboard(self) -> DashboardResponse:
        kpis = DashboardKpis(
            active_workers=await self.worker_repo.count_active(),
            contracts_expiring_7d=await self.contract_repo.count_expiring_within(7),
            compliance_pending=await self.compliance_service.repo.count_pending(),
        )
        alerts = await self.alert_service.get_alerts()
        return DashboardResponse(kpis=kpis, alerts=alerts)
