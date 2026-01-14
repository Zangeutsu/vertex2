from typing import Sequence
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.client import Client
from app.repositories.client_repository import ClientRepository
from app.schemas.client import ClientCreate, ClientUpdate


class ClientService:
    def __init__(self, session: AsyncSession):
        self.repo = ClientRepository(session)

    async def list_clients(self) -> Sequence[Client]:
        return await self.repo.list()

    async def create_client(self, payload: ClientCreate) -> Client:
        return await self.repo.create(payload)

    async def update_client(self, client_id: uuid.UUID, payload: ClientUpdate) -> Client:
        client = await self.repo.get(client_id)
        if not client:
            raise ValueError("Client not found")
        return await self.repo.update(client, payload)

    async def delete_client(self, client_id: uuid.UUID) -> None:
        client = await self.repo.get(client_id)
        if not client:
            raise ValueError("Client not found")
        await self.repo.delete(client)
