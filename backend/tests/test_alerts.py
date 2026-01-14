from datetime import date, timedelta
import uuid
import pytest

from app.db.init_db import init_db
from app.db.session import SessionLocal
from app.models.contract import ContractStatus
from app.schemas.compliance import ComplianceCreate, ComplianceStatus, ComplianceType
from app.schemas.contract import ContractCreate
from app.schemas.worker import WorkerCreate
from app.schemas.client import ClientCreate
from app.services.alert_service import AlertService
from app.repositories.worker_repository import WorkerRepository
from app.repositories.client_repository import ClientRepository
from app.repositories.contract_repository import ContractRepository
from app.repositories.compliance_repository import ComplianceRepository


@pytest.mark.asyncio
async def test_alerts_prioritize_contracts_and_compliance():
    async with SessionLocal() as session:
        worker_repo = WorkerRepository(session)
        client_repo = ClientRepository(session)
        contract_repo = ContractRepository(session)
        compliance_repo = ComplianceRepository(session)

        uid = uuid.uuid4().hex[:8]
        worker = await worker_repo.create(
            WorkerCreate(
                first_name="Test",
                last_name="User",
                email=f"test_{uid}@example.com",
                document_id=f"DOC_{uid}",
                active=True,
            )
        )
        client = await client_repo.create(
            ClientCreate(name=f"ACME_{uid}", contact_email=f"client_{uid}@example.com")
        )
        await contract_repo.create(
            ContractCreate(
                worker_id=worker.id,
                client_id=client.id,
                role="Developer",
                start_date=date.today(),
                end_date=date.today() + timedelta(days=3),
                status=ContractStatus.active,
            )
        )
        await compliance_repo.create(
            ComplianceCreate(
                worker_id=worker.id,
                type=ComplianceType.medical_exam,
                due_date=date.today() - timedelta(days=1),
                status=ComplianceStatus.pending,
            )
        )

        service = AlertService(session)
        alerts = await service.get_alerts()
        assert alerts, "Alerts should be generated"
        assert alerts[0].priority >= alerts[-1].priority
