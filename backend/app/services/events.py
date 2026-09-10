from typing import Dict, Any, Optional
from fastapi import HTTPException, status
from app.services.base import BaseService
from app.schemas.events import EventInDB, EventCreate
from app.schemas.users import UserInDB
from app.schemas.clubs import ClubInDB
from app.schemas.venues import VenueInDB
from app.schemas.resources import ResourceInDB
from app.repositories.base import BaseRepository

class EventService(BaseService[EventInDB, EventCreate]):
    
    def __init__(self, 
                 repository: BaseRepository[EventInDB, EventCreate],
                 club_repo: BaseRepository[ClubInDB, Any],
                 venue_repo: BaseRepository[VenueInDB, Any],
                 resource_repo: BaseRepository[ResourceInDB, Any]):
        super().__init__(repository)
        self.club_repo = club_repo
        self.venue_repo = venue_repo
        self.resource_repo = resource_repo

    async def _validate_references(self, obj_in: EventCreate):
        if obj_in.organizer_club_id:
            club = await self.club_repo.get_by_id(str(obj_in.organizer_club_id))
            if not club:
                raise HTTPException(status_code=400, detail="Referenced club does not exist")
                
        if obj_in.venue_id:
            venue = await self.venue_repo.get_by_id(str(obj_in.venue_id))
            if not venue:
                raise HTTPException(status_code=400, detail="Referenced venue does not exist")
                
        if obj_in.required_resource_ids:
            for res_id in obj_in.required_resource_ids:
                res = await self.resource_repo.get_by_id(str(res_id))
                if not res:
                    raise HTTPException(status_code=400, detail=f"Referenced resource {res_id} does not exist")

    async def create_event(self, obj_in: EventCreate, current_user: UserInDB) -> EventInDB:
        if current_user.role == "student":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students are not authorized to create events"
            )
            
        # Hard override the created_by field to be the authenticated user
        obj_in.created_by = current_user.id
        
        await self._validate_references(obj_in)
        
        return await self.create(obj_in)

    async def update_event(self, id: str, obj_in: Dict[str, Any], current_user: UserInDB) -> Optional[EventInDB]:
        if current_user.role == "student":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students are not authorized to modify events"
            )
            
        event = await self.get_by_id(id)
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
            
        # Object-level authorization
        if current_user.role != "admin":
            if str(event.created_by) != str(current_user.id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You are not authorized to modify this event"
                )
                
        # To validate references for partial updates, we'd need to convert dict to schema or check keys
        # For simplicity, we can instantiate a mock create schema or just check the repos if keys exist
        if "organizer_club_id" in obj_in and obj_in["organizer_club_id"]:
            if not await self.club_repo.get_by_id(str(obj_in["organizer_club_id"])):
                raise HTTPException(status_code=400, detail="Referenced club does not exist")
                
        if "venue_id" in obj_in and obj_in["venue_id"]:
            if not await self.venue_repo.get_by_id(str(obj_in["venue_id"])):
                raise HTTPException(status_code=400, detail="Referenced venue does not exist")
                
        if "required_resource_ids" in obj_in and obj_in["required_resource_ids"]:
            for res_id in obj_in["required_resource_ids"]:
                if not await self.resource_repo.get_by_id(str(res_id)):
                    raise HTTPException(status_code=400, detail=f"Referenced resource {res_id} does not exist")

        return await self.update(id, obj_in)

    async def delete_event(self, id: str, current_user: UserInDB) -> bool:
        if current_user.role == "student":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students are not authorized to delete events"
            )
            
        event = await self.get_by_id(id)
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
            
        if current_user.role != "admin":
            if str(event.created_by) != str(current_user.id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You are not authorized to delete this event"
                )
                
        return await self.delete(id)
