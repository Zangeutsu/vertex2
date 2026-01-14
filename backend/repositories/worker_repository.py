from datetime import date
from typing import Sequence

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import Worker
from backend.schemas import WorkerCreate, WorkerUpdate
from backend.repositories.base import BaseRepository


class WorkerRepository(BaseRepository[Worker, WorkerCreate, WorkerUpdate]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Worker)

    async def count_active(self) -> int:
        stmt = select(func.count()).select_from(Worker).where(Worker.active.is_(True))
        result = await self.session.execute(stmt)
        return result.scalar_one()

    async def medical_exam_pending(self) -> Sequence[Worker]:
        today = date.today()
        stmt = select(Worker).where(
            Worker.active.is_(True),
            (Worker.medical_exam_date.is_(None)) | (Worker.medical_exam_date < today),
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()
