from typing import Any, List
from fastapi import HTTPException, status
from app.services.base import BaseService
from app.schemas.registrations import RegistrationInDB, RegistrationCreate
from app.schemas.users import UserInDB
from app.schemas.events import EventInDB
from app.repositories.base import BaseRepository

class RegistrationService(BaseService[RegistrationInDB, RegistrationCreate]):
    
    def __init__(self, 
                 repository: BaseRepository[RegistrationInDB, RegistrationCreate],
                 event_repo: BaseRepository[EventInDB, Any]):
        super().__init__(repository)
        self.event_repo = event_repo

    async def register_user(self, event_id: str, current_user: UserInDB) -> RegistrationInDB:
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
            
        if not getattr(event, "registration_enabled", True):
            raise HTTPException(status_code=400, detail="Registration is not enabled for this event")
            
        # Check if already registered
        existing = await self.get_all(query={"event_id": event.id, "user_id": current_user.id})
        if existing:
            raise HTTPException(status_code=400, detail="User already registered for this event")
            
        # Check capacity
        if event.expected_participants > 0:
            current_registrations = await self.get_all(query={"event_id": event.id}, limit=1000000)
            if len(current_registrations) >= event.expected_participants:
                raise HTTPException(status_code=400, detail="Event has reached maximum capacity")
                
        obj_in = RegistrationCreate(
            event_id=event.id,
            user_id=current_user.id,
            status="confirmed"
        )
        return await self.create(obj_in)

    async def get_event_registrations(self, event_id: str, current_user: UserInDB) -> List[RegistrationInDB]:
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
            
        # Only authorized organizers or admin can view all registrations for an event
        if current_user.role not in ["admin", "faculty"]:
            if str(event.created_by) != str(current_user.id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You are not authorized to view registrations for this event"
                )
                
        return await self.get_all(query={"event_id": event.id}, limit=100)

    async def get_my_registrations(self, current_user: UserInDB) -> List[RegistrationInDB]:
        from bson import ObjectId
        user_id = ObjectId(str(current_user.id)) if current_user.id else current_user.id
        return await self.get_all(query={"user_id": user_id}, limit=100)

    async def unregister_user(self, event_id: str, current_user: UserInDB) -> bool:
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
            
        registrations = await self.get_all(query={"event_id": event.id, "user_id": current_user.id})
        if not registrations:
            raise HTTPException(status_code=404, detail="Registration not found")
            
        reg = registrations[0]
        return await self.delete(str(reg.id))
