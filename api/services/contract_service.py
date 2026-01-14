from typing import Sequence
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from api.models.contract import Contract
from api.models.activity import ActivityType
from api.services.activity_service import ActivityService
from api.repositories.contract_repository import ContractRepository
from api.schemas.contract import ContractCreate, ContractUpdate


class ContractService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = ContractRepository(session)

    async def list_contracts(self) -> Sequence[Contract]:
        return await self.repo.list()

    async def create_contract(self, payload: ContractCreate) -> Contract:
        contract = await self.repo.create(payload)
        activity_service = ActivityService(self.session)
        await activity_service.log_activity(
            ActivityType.contract_signed,
            f"Novo contrato assinado para colaborador ID: {contract.worker_id}",
            "contract",
            contract.id
        )
        return contract

    async def update_contract(self, contract_id: uuid.UUID, payload: ContractUpdate) -> Contract:
        contract = await self.repo.get(contract_id)
        if not contract:
            raise ValueError("Contract not found")
        return await self.repo.update(contract, payload)

    async def delete_contract(self, contract_id: uuid.UUID) -> None:
        contract = await self.repo.get(contract_id)
        if not contract:
            raise ValueError("Contract not found")
        await self.repo.delete(contract)
