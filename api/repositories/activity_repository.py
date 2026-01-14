from api.models.activity import Activity
from api.repositories.base import BaseRepository
from api.schemas.base import ORMModel
from pydantic import BaseModel

# Dummy schemas for BaseRepository requirement
class ActivityCreate(BaseModel):
    pass
class ActivityUpdate(BaseModel):
    pass

class ActivityRepository(BaseRepository[Activity, ActivityCreate, ActivityUpdate]):
    def __init__(self, session):
        super().__init__(session, Activity)
