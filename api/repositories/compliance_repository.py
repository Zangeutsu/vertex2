from datetime import date
from typing import Sequence

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy.orm import selectinload
from api.models.compliance import ComplianceRecord, ComplianceStatus
from api.repositories.base import BaseRepository
from api.schemas.compliance import ComplianceCreate, ComplianceUpdate


class ComplianceRepository(BaseRepository[ComplianceRecord, ComplianceCreate, ComplianceUpdate]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, ComplianceRecord)

    async def pending_alerts(self) -> Sequence[ComplianceRecord]:
        stmt = select(ComplianceRecord).where(
            ComplianceRecord.status.in_([ComplianceStatus.pending, ComplianceStatus.overdue])
        ).options(selectinload(ComplianceRecord.worker))
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def count_pending(self) -> int:
        stmt = select(func.count()).select_from(ComplianceRecord).where(
            ComplianceRecord.status.in_([ComplianceStatus.pending, ComplianceStatus.overdue])
        )
        result = await self.session.execute(stmt)
        return result.scalar_one()

    async def mark_overdue(self) -> None:
        today = date.today()
        stmt = (
            select(ComplianceRecord)
            .where(ComplianceRecord.due_date < today, ComplianceRecord.status == ComplianceStatus.pending)
            .with_for_update()
        )
        result = await self.session.execute(stmt)
        records = result.scalars().all()
        for record in records:
            record.status = ComplianceStatus.overdue
        if records:
            await self.session.commit()
