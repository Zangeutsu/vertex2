from datetime import date, timedelta
import uuid
from typing import List, Optional
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload

from api.models.invoice import Invoice, InvoiceStatus
from api.models.timesheet import Timesheet
from api.models.contract import Contract
from api.repositories.invoice_repository import InvoiceRepository
from api.schemas.invoice import InvoiceCreate
from api.models.activity import ActivityType
from api.services.activity_service import ActivityService

class InvoiceService:
    def __init__(self, session):
        self.session = session
        self.repo = InvoiceRepository(session)

    async def list_invoices(self) -> List[Invoice]:
        return await self.repo.list()

    async def get_invoice(self, invoice_id: uuid.UUID) -> Optional[Invoice]:
        return await self.repo.get_with_timesheets(invoice_id)

    async def generate_draft_invoice(self, client_id: uuid.UUID, start_date: date, end_date: date) -> Optional[Invoice]:
        # 1. Find all unbilled timesheets for this client in the period
        query = select(Timesheet).where(
            and_(
                Timesheet.client_id == client_id,
                Timesheet.invoice_id == None,
                Timesheet.date >= start_date,
                Timesheet.date <= end_date
            )
        )
        result = await self.session.execute(query)
        timesheets = result.scalars().all()

        if not timesheets:
            return None

        # 2. Calculate total amount based on active contracts for those workers
        total_amount = 0.0
        for ts in timesheets:
            # Find the contract for this worker and client that was active on the timesheet date
            contract_query = select(Contract).where(
                and_(
                    Contract.worker_id == ts.worker_id,
                    Contract.client_id == client_id,
                    Contract.start_date <= ts.date,
                    (Contract.end_date == None) | (Contract.end_date >= ts.date)
                )
            ).order_by(Contract.id.desc()).limit(1)
            
            c_result = await self.session.execute(contract_query)
            contract = c_result.scalar_one_or_none()
            
            if contract and contract.hourly_rate:
                total_amount += float(ts.hours) * float(contract.hourly_rate)
            else:
                # Default rate or handle error? For now just skip or use 0
                pass

        # 3. Create the invoice
        invoice_number = f"INV-{client_id}-{date.today().strftime('%Y%m%d%H%M')}"
        invoice = Invoice(
            client_id=client_id,
            number=invoice_number,
            issue_date=date.today(),
            due_date=date.today() + timedelta(days=30),
            total_amount=total_amount,
            status=InvoiceStatus.draft
        )
        self.session.add(invoice)
        await self.session.commit()
        await self.session.refresh(invoice)

        # 4. Link timesheets to invoice
        for ts in timesheets:
            ts.invoice_id = invoice.id
            self.session.add(ts)

        await self.session.commit()
        await self.session.refresh(invoice)
        
        activity_service = ActivityService(self.session)
        await activity_service.log_activity(
            ActivityType.invoice_generated,
            f"Fatura rascunho gerada: {invoice.number}",
            "invoice",
            invoice.id
        )
        return invoice

    async def update_status(self, invoice_id: uuid.UUID, status: InvoiceStatus) -> Optional[Invoice]:
        invoice = await self.repo.get(invoice_id)
        if invoice:
            old_status = invoice.status
            invoice.status = status
            await self.session.commit()
            await self.session.refresh(invoice)
            
            if status == InvoiceStatus.paid:
                activity_service = ActivityService(self.session)
                await activity_service.log_activity(
                    ActivityType.invoice_paid,
                    f"Fatura marcada como paga: {invoice.number}",
                    "invoice",
                    invoice.id
                )
        return invoice
