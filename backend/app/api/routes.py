from fastapi import APIRouter
from app.api import workers, clients, contracts, compliance, dashboard, health, timesheets, reports, invoices, activities, scheduling

api_router = APIRouter()
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(workers.router, prefix="/workers", tags=["workers"])
api_router.include_router(clients.router, prefix="/clients", tags=["clients"])
api_router.include_router(contracts.router, prefix="/contracts", tags=["contracts"])
api_router.include_router(compliance.router, prefix="/compliance", tags=["compliance"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(timesheets.router, prefix="/timesheets", tags=["timesheets"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(invoices.router, prefix="/invoices", tags=["invoices"])
api_router.include_router(activities.router, prefix="/activities", tags=["activities"])
api_router.include_router(scheduling.router, prefix="/scheduling", tags=["scheduling"])
