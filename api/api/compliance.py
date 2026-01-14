from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from api.api.deps import get_db
from api.schemas.compliance import ComplianceCreate, ComplianceOut, ComplianceUpdate
from api.services.compliance_service import ComplianceService
from api.services.storage_service import StorageService

router = APIRouter()


@router.get("", response_model=list[ComplianceOut])
async def list_compliance(db: AsyncSession = Depends(get_db)) -> list[ComplianceOut]:
    service = ComplianceService(db)
    return [ComplianceOut.model_validate(c) for c in await service.list_compliance()]


@router.post("", response_model=ComplianceOut, status_code=status.HTTP_201_CREATED)
async def create_compliance(payload: ComplianceCreate, db: AsyncSession = Depends(get_db)) -> ComplianceOut:
    service = ComplianceService(db)
    record = await service.create_record(payload)
    return ComplianceOut.model_validate(record)


@router.put("/{record_id}", response_model=ComplianceOut)
async def update_compliance(
    record_id: uuid.UUID, payload: ComplianceUpdate, db: AsyncSession = Depends(get_db)
) -> ComplianceOut:
    service = ComplianceService(db)
    try:
        record = await service.update_record(record_id, payload)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Compliance record not found")
    return ComplianceOut.model_validate(record)


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_compliance(record_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> None:
    service = ComplianceService(db)
    try:
        await service.delete_record(record_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Compliance record not found")


@router.post("/{record_id}/upload", response_model=ComplianceOut)
async def upload_compliance_document(
    record_id: uuid.UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    storage: StorageService = Depends(StorageService),
) -> ComplianceOut:
    service = ComplianceService(db)
    try:
        # Save file
        relative_path = storage.save_file(file, "compliance")
        # Update record with the document URL
        record = await service.update_record(
            record_id, ComplianceUpdate(document_url=relative_path)
        )
        return ComplianceOut.model_validate(record)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Compliance record not found")
