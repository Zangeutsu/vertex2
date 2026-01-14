from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings


settings = get_settings()


class Base(DeclarativeBase):
    __table_args__ = {"schema": "app"}


def get_engine() -> AsyncEngine:
    # If using postgres, we can set the search path
    connect_args = {}
    if "postgresql" in settings.database_url:
        connect_args = {"server_settings": {"search_path": "app,public"}}
    
    return create_async_engine(
        settings.database_url, 
        echo=settings.echo_sql, 
        future=True,
        connect_args=connect_args
    )


engine = get_engine()
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session
