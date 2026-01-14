import os
import asyncio
import pytest
import pytest_asyncio

# Set test database URL before any imports that use settings
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test.db"

from app.db.session import engine, Base
from app.db.init_db import init_db

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test case."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_test_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    # Clean up test database file
    if os.path.exists("test.db"):
        try:
            os.remove("test.db")
        except:
            pass
