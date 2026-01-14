import pytest
from datetime import date, timedelta
from app.models.invoice import InvoiceStatus
from app.models.activity import ActivityType
from app.services.invoice_service import InvoiceService
from app.services.activity_service import ActivityService
from app.models.client import Client
from app.models.worker import Worker
from app.models.contract import Contract, ContractStatus
from app.models.timesheet import Timesheet

from app.db.session import SessionLocal

@pytest.mark.asyncio
async def test_invoice_generation_logs_activity():
    async with SessionLocal() as db_session:
        # 1. Setup Data
        client = Client(name="Test Client", contact_email="test@client.com")
        db_session.add(client)
        worker = Worker(first_name="John", last_name="Doe", email="john@doe.com", document_id="123")
        db_session.add(worker)
        await db_session.commit()
        await db_session.refresh(client)
        await db_session.refresh(worker)

        contract = Contract(
            worker_id=worker.id,
            client_id=client.id,
            role="Dev",
            start_date=date.today() - timedelta(days=10),
            status=ContractStatus.active,
            hourly_rate=50.0
        )
        db_session.add(contract)
        timesheet = Timesheet(
            worker_id=worker.id,
            client_id=client.id,
            date=date.today() - timedelta(days=1),
            hours=8.0
        )
        db_session.add(timesheet)
        await db_session.commit()

        # 2. Run Service
        invoice_service = InvoiceService(db_session)
        invoice = await invoice_service.generate_draft_invoice(
            client_id=client.id,
            start_date=date.today() - timedelta(days=5),
            end_date=date.today()
        )

        # 3. Assertions
        assert invoice is not None
        assert invoice.total_amount == 400.0  # 8 hours * 50.0
        assert invoice.status == InvoiceStatus.draft

        # 4. Verify Activity Log
        activity_service = ActivityService(db_session)
        activities = await activity_service.list_recent_activities()
        
        # We expect at least one activity for invoice_generated (and potentially worker creation if mapped)
        # Filter for invoice_generated
        invoice_act = next((a for a in activities if a.type == ActivityType.invoice_generated), None)
        assert invoice_act is not None
        assert str(invoice.id) in str(invoice_act.entity_id)
