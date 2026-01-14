from datetime import date
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.db.session import get_session
from app.schemas.invoice import InvoiceOut, InvoiceDetailOut, InvoiceUpdate, InvoiceStatus
from app.services.invoice_service import InvoiceService

router = APIRouter()

@router.get("/", response_model=List[InvoiceOut])
async def list_invoices(db: AsyncSession = Depends(get_session)):
    service = InvoiceService(db)
    return await service.list_invoices()

@router.get("/{invoice_id}", response_model=InvoiceDetailOut)
async def get_invoice(invoice_id: uuid.UUID, db: AsyncSession = Depends(get_session)):
    service = InvoiceService(db)
    invoice = await service.get_invoice(invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice

@router.post("/generate", response_model=InvoiceDetailOut)
async def generate_invoice(
    client_id: uuid.UUID, 
    start_date: date, 
    end_date: date, 
    db: AsyncSession = Depends(get_session)
):
    service = InvoiceService(db)
    invoice = await service.generate_draft_invoice(client_id, start_date, end_date)
    if not invoice:
        raise HTTPException(status_code=400, detail="No unbilled timesheets found for this period")
    return invoice

@router.patch("/{invoice_id}/status", response_model=InvoiceDetailOut)
async def update_invoice_status(
    invoice_id: uuid.UUID, 
    status: InvoiceStatus, 
    db: AsyncSession = Depends(get_session)
):
    service = InvoiceService(db)
    invoice = await service.update_status(invoice_id, status)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice
