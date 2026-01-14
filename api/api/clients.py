from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from api.api.deps import get_db
from api.schemas.client import ClientCreate, ClientOut, ClientUpdate
from api.services.client_service import ClientService

router = APIRouter()


@router.get("", response_model=list[ClientOut])
async def list_clients(db: AsyncSession = Depends(get_db)) -> list[ClientOut]:
    service = ClientService(db)
    return [ClientOut.model_validate(c) for c in await service.list_clients()]


@router.post("", response_model=ClientOut, status_code=status.HTTP_201_CREATED)
async def create_client(payload: ClientCreate, db: AsyncSession = Depends(get_db)) -> ClientOut:
    service = ClientService(db)
    client = await service.create_client(payload)
    return ClientOut.model_validate(client)


@router.put("/{client_id}", response_model=ClientOut)
async def update_client(client_id: uuid.UUID, payload: ClientUpdate, db: AsyncSession = Depends(get_db)) -> ClientOut:
    service = ClientService(db)
    try:
        client = await service.update_client(client_id, payload)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    return ClientOut.model_validate(client)


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(client_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> None:
    service = ClientService(db)
    try:
        await service.delete_client(client_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
