from sqlalchemy.ext.asyncio import AsyncSession

from app.models.client import Client
from app.repositories.base import BaseRepository
from app.schemas.client import ClientCreate, ClientUpdate


class ClientRepository(BaseRepository[Client, ClientCreate, ClientUpdate]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Client)
