from app.models.activity import Activity
from app.repositories.base import BaseRepository
from app.schemas.base import ORMModel
from pydantic import BaseModel

# Dummy schemas for BaseRepository requirement
class ActivityCreate(BaseModel):
    pass
class ActivityUpdate(BaseModel):
    pass

class ActivityRepository(BaseRepository[Activity, ActivityCreate, ActivityUpdate]):
    def __init__(self, session):
        super().__init__(session, Activity)
