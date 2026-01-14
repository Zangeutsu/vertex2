from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from api.api.deps import get_db
from api.schemas.worker import WorkerCreate, WorkerDetail, WorkerOut, WorkerUpdate
from api.services.worker_service import WorkerService

router = APIRouter()


@router.get("", response_model=list[WorkerOut])
async def list_workers(db: AsyncSession = Depends(get_db)) -> list[WorkerOut]:
    service = WorkerService(db)
    return [WorkerOut.model_validate(w) for w in await service.list_workers()]


@router.get("/{worker_id}", response_model=WorkerDetail)
async def get_worker(worker_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> WorkerDetail:
    service = WorkerService(db)
    worker = await service.get_worker_detail(worker_id)
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found")
    return WorkerDetail.model_validate(worker)


@router.post("", response_model=WorkerOut, status_code=status.HTTP_201_CREATED)
async def create_worker(payload: WorkerCreate, db: AsyncSession = Depends(get_db)) -> WorkerOut:
    service = WorkerService(db)
    worker = await service.create_worker(payload)
    return WorkerOut.model_validate(worker)


@router.put("/{worker_id}", response_model=WorkerOut)
async def update_worker(worker_id: uuid.UUID, payload: WorkerUpdate, db: AsyncSession = Depends(get_db)) -> WorkerOut:
    service = WorkerService(db)
    try:
        worker = await service.update_worker(worker_id, payload)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found")
    return WorkerOut.model_validate(worker)


@router.delete("/{worker_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_worker(worker_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> None:
    service = WorkerService(db)
    try:
        await service.delete_worker(worker_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found")
