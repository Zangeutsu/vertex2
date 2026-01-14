from sqlalchemy.ext.asyncio import AsyncSession

from api.models.client import Client
from api.repositories.base import BaseRepository
from api.schemas.client import ClientCreate, ClientUpdate


class ClientRepository(BaseRepository[Client, ClientCreate, ClientUpdate]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Client)
