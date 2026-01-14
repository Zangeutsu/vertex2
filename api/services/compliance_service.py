from typing import Sequence

from sqlalchemy.ext.asyncio import AsyncSession

from api.models.compliance import ComplianceRecord
from api.models.activity import ActivityType
from api.repositories.compliance_repository import ComplianceRepository
from api.schemas.compliance import ComplianceCreate, ComplianceUpdate
import uuid


class ComplianceService:
    def __init__(self, session: AsyncSession):
        self.repo = ComplianceRepository(session)

    async def list_compliance(self) -> Sequence[ComplianceRecord]:
        return await self.repo.list()

    async def create_record(self, payload: ComplianceCreate) -> ComplianceRecord:
        record = await self.repo.create(payload)
        from api.services.activity_service import ActivityService
        activity_service = ActivityService(self.repo.session)
        await activity_service.log_activity(
            ActivityType.compliance_overdue if record.status == "overdue" else ActivityType.compliance_updated,
            f"Novo registo de conformidade ({record.type}) para colaborador ID: {record.worker_id}",
            "compliance",
            record.id
        )
        return record

    async def update_record(self, record_id: uuid.UUID, payload: ComplianceUpdate) -> ComplianceRecord:
        record = await self.repo.get(record_id)
        if not record:
            raise ValueError("Compliance record not found")
        updated = await self.repo.update(record, payload)
        
        from api.services.activity_service import ActivityService
        activity_service = ActivityService(self.repo.session)
        await activity_service.log_activity(
            ActivityType.compliance_updated,
            f"Registo de conformidade atualizado para colaborador ID: {updated.worker_id}",
            "compliance",
            updated.id
        )
        return updated

    async def delete_record(self, record_id: uuid.UUID) -> None:
        record = await self.repo.get(record_id)
        if not record:
            raise ValueError("Compliance record not found")
        await self.repo.delete(record)

    async def mark_overdue(self) -> None:
        await self.repo.mark_overdue()
