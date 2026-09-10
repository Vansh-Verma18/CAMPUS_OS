from typing import List, Any
from fastapi import HTTPException, status
from app.services.base import BaseService
from app.schemas.attendance import AttendanceInDB, AttendanceCreate
from app.schemas.users import UserInDB
from app.schemas.events import EventInDB
from app.repositories.base import BaseRepository

class AttendanceService(BaseService[AttendanceInDB, AttendanceCreate]):
    
    def __init__(self, 
                 repository: BaseRepository[AttendanceInDB, AttendanceCreate],
                 event_repo: BaseRepository[EventInDB, Any]):
        super().__init__(repository)
        self.event_repo = event_repo

    async def _check_event_auth(self, event_id: str, current_user: UserInDB) -> EventInDB:
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
            
        if current_user.role not in ["admin", "faculty"]:
            if str(event.created_by) != str(current_user.id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You are not authorized to manage attendance for this event"
                )
        return event

    async def record_attendance(self, event_id: str, obj_in: AttendanceCreate, current_user: UserInDB) -> AttendanceInDB:
        # Enforce that only authorized users can record attendance
        await self._check_event_auth(event_id, current_user)
        
        # Override fields to prevent hijacking
        obj_in.event_id = event_id
        
        # Check if already recorded
        existing = await self.get_all(query={"event_id": event_id, "user_id": obj_in.user_id})
        if existing:
            raise HTTPException(status_code=400, detail="Attendance already recorded for this user")
            
        return await self.create(obj_in)

    async def get_event_attendance(self, event_id: str, current_user: UserInDB) -> List[AttendanceInDB]:
        await self._check_event_auth(event_id, current_user)
        return await self.get_all(query={"event_id": event_id}, limit=1000)

    async def get_my_attendance(self, current_user: UserInDB) -> List[AttendanceInDB]:
        return await self.get_all(query={"user_id": current_user.id}, limit=100)
