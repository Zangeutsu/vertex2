from typing import Optional, Sequence
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.worker import Worker
from app.models.activity import ActivityType
from app.services.activity_service import ActivityService
from app.repositories.worker_repository import WorkerRepository
from app.schemas.worker import WorkerCreate, WorkerUpdate


class WorkerService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = WorkerRepository(session)

    async def list_workers(self) -> Sequence[Worker]:
        return await self.repo.list()

    async def get_worker_detail(self, worker_id: uuid.UUID) -> Optional[Worker]:
        return await self.repo.get_with_details(worker_id)

    async def create_worker(self, payload: WorkerCreate) -> Worker:
        worker = await self.repo.create(payload)
        activity_service = ActivityService(self.session)
        await activity_service.log_activity(
            ActivityType.worker_created,
            f"Novo colaborador registado: {worker.first_name} {worker.last_name}",
            "worker",
            worker.id
        )
        return worker

    async def update_worker(self, worker_id: uuid.UUID, payload: WorkerUpdate) -> Worker:
        worker = await self.repo.get(worker_id)
        if not worker:
            raise ValueError("Worker not found")
        return await self.repo.update(worker, payload)

    async def delete_worker(self, worker_id: uuid.UUID) -> None:
        worker = await self.repo.get(worker_id)
        if not worker:
            raise ValueError("Worker not found")
        await self.repo.delete(worker)
