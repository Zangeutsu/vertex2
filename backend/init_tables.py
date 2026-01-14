import asyncio
from app.db.session import engine, Base
# Import all models to register them with Base
from app.models.worker import Worker
from app.models.client import Client
from app.models.contract import Contract
from app.models.compliance import ComplianceRecord
from app.models.timesheet import Timesheet

async def init_db():
    async with engine.begin() as conn:
        # This will create any missing tables
        await conn.run_sync(Base.metadata.create_all)
    print("Database initialized (missing tables created)")

if __name__ == "__main__":
    asyncio.run(init_db())
