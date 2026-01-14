from functools import lru_cache
from typing import AsyncGenerator

from pydantic_settings import BaseSettings
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./data.db"
    echo_sql: bool = False

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()


class Base(DeclarativeBase):
    """Shared declarative base."""


def get_engine() -> AsyncEngine:
    return create_async_engine(settings.database_url, echo=settings.echo_sql, future=True)


engine = get_engine()
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session
