from typing import Dict, Any, Optional
from fastapi import HTTPException, status
from app.services.base import BaseService
from app.schemas.venues import VenueInDB, VenueCreate
from app.schemas.users import UserInDB

class VenueService(BaseService[VenueInDB, VenueCreate]):
    
    async def create_venue(self, obj_in: VenueCreate, current_user: UserInDB) -> VenueInDB:
        if current_user.role == "student":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students are not authorized to create venues"
            )
        return await self.create(obj_in)

    async def update_venue(self, id: str, obj_in: Dict[str, Any], current_user: UserInDB) -> Optional[VenueInDB]:
        if current_user.role == "student":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students are not authorized to modify venues"
            )
        venue = await self.get_by_id(id)
        if not venue:
            raise HTTPException(status_code=404, detail="Venue not found")
            
        return await self.update(id, obj_in)

    async def delete_venue(self, id: str, current_user: UserInDB) -> bool:
        if current_user.role == "student":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students are not authorized to delete venues"
            )
        venue = await self.get_by_id(id)
        if not venue:
            raise HTTPException(status_code=404, detail="Venue not found")
            
        return await self.delete(id)
