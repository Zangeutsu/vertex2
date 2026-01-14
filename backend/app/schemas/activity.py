from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.activity import ActivityType
from app.schemas.base import ORMModel

class ActivityOut(ORMModel):
    id: int
    type: ActivityType
    description: str
    entity_type: str
    entity_id: int
    created_at: datetime
