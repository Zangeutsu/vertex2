from datetime import date, timedelta
from typing import Sequence

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy.orm import selectinload
from app.models.contract import Contract, ContractStatus
from app.repositories.base import BaseRepository
from app.schemas.contract import ContractCreate, ContractUpdate


class ContractRepository(BaseRepository[Contract, ContractCreate, ContractUpdate]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Contract)

    async def expiring_within(self, days: int = 7) -> Sequence[Contract]:
        today = date.today()
        limit_date = today + timedelta(days=days)
        stmt = select(Contract).where(
            Contract.end_date.is_not(None),
            Contract.end_date <= limit_date,
            Contract.status == ContractStatus.active,
        ).options(selectinload(Contract.worker))
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def count_expiring_within(self, days: int = 7) -> int:
        today = date.today()
        limit_date = today + timedelta(days=days)
        stmt = select(func.count()).select_from(Contract).where(
            Contract.end_date.is_not(None),
            Contract.end_date <= limit_date,
            Contract.status == ContractStatus.active,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one()
