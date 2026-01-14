from datetime import date
from typing import List

from api.schemas.base import ORMModel


class DashboardKpis(ORMModel):
    active_workers: int
    contracts_expiring_7d: int
    compliance_pending: int


class AlertItem(ORMModel):
    title: str
    due_date: date | None = None
    priority: int
    entity: str
    reference_id: int


class DashboardResponse(ORMModel):
    kpis: DashboardKpis
    alerts: List[AlertItem]
