from typing import List, Any
from fastapi import HTTPException, status
from app.services.base import BaseService
from app.schemas.feedback import FeedbackInDB, FeedbackCreate
from app.schemas.users import UserInDB
from app.schemas.events import EventInDB
from app.repositories.base import BaseRepository

class FeedbackService(BaseService[FeedbackInDB, FeedbackCreate]):
    
    def __init__(self, 
                 repository: BaseRepository[FeedbackInDB, FeedbackCreate],
                 event_repo: BaseRepository[EventInDB, Any]):
        super().__init__(repository)
        self.event_repo = event_repo

    async def submit_feedback(self, event_id: str, obj_in: FeedbackCreate, current_user: UserInDB) -> FeedbackInDB:
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
            
        # Prevent hijacking by hardcoding IDs
        obj_in.event_id = event_id
        obj_in.submitted_by = current_user.id
        
        # Prevent duplicate feedback
        existing = await self.get_all(query={"event_id": event.id, "submitted_by": current_user.id})
        if existing:
            raise HTTPException(status_code=400, detail="Feedback already submitted for this event")
            
        return await self.create(obj_in)

    async def get_event_feedback(self, event_id: str, current_user: UserInDB) -> List[FeedbackInDB]:
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
            
        # Only authorized organizers or admin/faculty can view all feedback
        if current_user.role not in ["admin", "faculty"]:
            if str(event.created_by) != str(current_user.id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You are not authorized to view feedback for this event"
                )
                
        return await self.get_all(query={"event_id": event.id}, limit=100)
