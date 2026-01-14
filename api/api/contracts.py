from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from api.api.deps import get_db
from api.schemas.contract import ContractCreate, ContractOut, ContractUpdate
from api.services.contract_service import ContractService
from api.services.storage_service import StorageService

router = APIRouter()


@router.get("", response_model=list[ContractOut])
async def list_contracts(db: AsyncSession = Depends(get_db)) -> list[ContractOut]:
    service = ContractService(db)
    return [ContractOut.model_validate(c) for c in await service.list_contracts()]


@router.post("", response_model=ContractOut, status_code=status.HTTP_201_CREATED)
async def create_contract(payload: ContractCreate, db: AsyncSession = Depends(get_db)) -> ContractOut:
    service = ContractService(db)
    contract = await service.create_contract(payload)
    return ContractOut.model_validate(contract)


@router.put("/{contract_id}", response_model=ContractOut)
async def update_contract(
    contract_id: uuid.UUID, payload: ContractUpdate, db: AsyncSession = Depends(get_db)
) -> ContractOut:
    service = ContractService(db)
    try:
        contract = await service.update_contract(contract_id, payload)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")
    return ContractOut.model_validate(contract)


@router.delete("/{contract_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contract(contract_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> None:
    service = ContractService(db)
    try:
        await service.delete_contract(contract_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")


@router.post("/{contract_id}/upload", response_model=ContractOut)
async def upload_contract_document(
    contract_id: uuid.UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    storage: StorageService = Depends(StorageService),
) -> ContractOut:
    service = ContractService(db)
    try:
        # Save file
        relative_path = storage.save_file(file, "contracts")
        # Update contract with the document URL
        contract = await service.update_contract(
            contract_id, ContractUpdate(document_url=relative_path)
        )
        return ContractOut.model_validate(contract)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")
