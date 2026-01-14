import csv
import io
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from api.api.deps import get_db
from api.services.worker_service import WorkerService
from api.services.contract_service import ContractService

router = APIRouter()

@router.get("/workers")
async def export_workers(db: AsyncSession = Depends(get_db)):
    service = WorkerService(db)
    workers = await service.list_workers()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Primeiro Nome", "Último Nome", "Email", "Telefone", "Documento ID", "Ativo", "Data Nascimento"])
    
    for w in workers:
        writer.writerow([
            w.id, w.first_name, w.last_name, w.email, w.phone or "", 
            w.document_id, "Sim" if w.active else "Não", w.date_of_birth or ""
        ])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=colaboradores.csv"}
    )

@router.get("/contracts")
async def export_contracts(db: AsyncSession = Depends(get_db)):
    service = ContractService(db)
    contracts = await service.list_contracts()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Colaborador", "Cliente", "Função", "Início", "Fim", "Estado", "Tarifa"])
    
    for c in contracts:
        # Assuming eager load of worker/client or fetch later
        writer.writerow([
            c.id, c.worker_id, c.client_id, c.role, 
            c.start_date, c.end_date or "", c.status, c.hourly_rate or 0
        ])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=contratos.csv"}
    )
