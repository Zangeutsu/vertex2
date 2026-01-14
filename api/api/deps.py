from typing import AsyncGenerator

from api.db.session import get_session


async def get_db() -> AsyncGenerator:
    async for session in get_session():
        yield session
