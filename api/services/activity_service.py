from typing import Any, List, Optional, Union
from sqlalchemy import select
from api.models.activity import Activity, ActivityType
from api.repositories.activity_repository import ActivityRepository

class ActivityService:
    def __init__(self, session):
        self.session = session
        self.repo = ActivityRepository(session)

    async def log_activity(
        self, 
        type: ActivityType, 
        description: str, 
        entity_type: str, 
        entity_id: Any
    ) -> Activity:
        activity = Activity(
            type=type,
            description=description,
            entity_type=entity_type,
            entity_id=str(entity_id)
        )
        self.session.add(activity)
        await self.session.commit()
        await self.session.refresh(activity)
        return activity

    async def list_recent_activities(self, limit: int = 10) -> List[Activity]:
        query = select(Activity).order_by(Activity.created_at.desc()).limit(limit)
        result = await self.session.execute(query)
        return result.scalars().all()
