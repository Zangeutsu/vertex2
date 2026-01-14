from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any, Optional, Union

from app.models.invoice import Invoice
from app.repositories.base import BaseRepository
from app.schemas.invoice import InvoiceCreate, InvoiceUpdate

from sqlalchemy import select
from sqlalchemy.orm import selectinload

class InvoiceRepository(BaseRepository[Invoice, InvoiceCreate, InvoiceUpdate]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Invoice)

    async def get_with_timesheets(self, id_: Any) -> Optional[Invoice]:
        result = await self.session.execute(
            select(Invoice).where(Invoice.id == id_).options(selectinload(Invoice.timesheets))
        )
        return result.scalar_one_or_none()
