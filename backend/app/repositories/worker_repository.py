from typing import Optional, Sequence
import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.worker import Worker
from app.schemas.worker import WorkerCreate, WorkerUpdate
from app.repositories.base import BaseRepository


from sqlalchemy.orm import selectinload


class WorkerRepository(BaseRepository[Worker, WorkerCreate, WorkerUpdate]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Worker)

    async def get_with_details(self, id_: uuid.UUID) -> Optional[Worker]:
        stmt = (
            select(Worker)
            .where(Worker.id == id_)
            .options(selectinload(Worker.contracts), selectinload(Worker.compliances))
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def count_active(self) -> int:
        result = await self.session.execute(select(func.count()).select_from(Worker).where(Worker.active.is_(True)))
        return result.scalar_one()

    async def search(self, query: str) -> Sequence[Worker]:
        stmt = select(Worker).where(
            (func.lower(Worker.first_name + " " + Worker.last_name).like(f"%{query.lower()}%")) |
            (func.lower(Worker.city).like(f"%{query.lower()}%"))
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()
