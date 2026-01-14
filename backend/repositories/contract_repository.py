from datetime import date, timedelta
from typing import Sequence

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.models import Contract, ContractStatus
from backend.schemas import ContractCreate, ContractUpdate
from backend.repositories.base import BaseRepository


class ContractRepository(BaseRepository[Contract, ContractCreate, ContractUpdate]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Contract)

    async def expiring_within(self, days: int = 7) -> Sequence[Contract]:
        """Contratos ativos que acabam nos próximos N dias."""
        today = date.today()
        limit_date = today + timedelta(days=days)
        stmt = (
            select(Contract)
            .options(selectinload(Contract.worker), selectinload(Contract.client))
            .where(
                Contract.status == ContractStatus.active,
                Contract.contract_end_date.is_not(None),
                Contract.contract_end_date <= limit_date,
            )
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def count_expiring_within(self, days: int = 7) -> int:
        today = date.today()
        limit_date = today + timedelta(days=days)
        stmt = select(func.count()).select_from(Contract).where(
            Contract.status == ContractStatus.active,
            Contract.contract_end_date.is_not(None),
            Contract.contract_end_date <= limit_date,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one()
