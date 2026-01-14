import logging

from app.db.session import Base, engine
from app.models import Client, ComplianceRecord, Contract, Worker, Timesheet, Invoice, Activity, Shift, Booking  # noqa: F401

logger = logging.getLogger(__name__)


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database schema ensured.")
