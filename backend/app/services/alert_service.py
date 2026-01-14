from datetime import date
from typing import List

from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.dashboard import AlertItem
from app.repositories.compliance_repository import ComplianceRepository
from app.repositories.contract_repository import ContractRepository


class AlertService:
    def __init__(self, session: AsyncSession):
        self.contract_repo = ContractRepository(session)
        self.compliance_repo = ComplianceRepository(session)

    async def get_alerts(self) -> List[AlertItem]:
        alerts: List[AlertItem] = []
        contracts = await self.contract_repo.expiring_within(7)
        for contract in contracts:
            days_left = (contract.end_date - date.today()).days if contract.end_date else None
            priority = 10 - min(days_left or 0, 7)
            alerts.append(
                AlertItem(
                    title=f"Contrato de {contract.worker.full_name} expira em {days_left} dia(s)",
                    due_date=contract.end_date,
                    priority=priority,
                    entity="contract",
                    reference_id=contract.id,
                )
            )

        await self.compliance_repo.mark_overdue()
        compliance_records = await self.compliance_repo.pending_alerts()
        for record in compliance_records:
            days_overdue = (
                (date.today() - record.due_date).days if record.due_date < date.today() else 0
            )
            priority = 8 + min(days_overdue, 5)
            alerts.append(
                AlertItem(
                    title=f"Compliance {record.type} para {record.worker.full_name}",
                    due_date=record.due_date,
                    priority=priority,
                    entity="compliance",
                    reference_id=record.id,
                )
            )
        return sorted(alerts, key=lambda a: a.priority, reverse=True)
