from typing import Dict, Any, Optional
from fastapi import HTTPException, status
from app.services.base import BaseService
from app.schemas.clubs import ClubInDB, ClubCreate
from app.schemas.users import UserInDB

class ClubService(BaseService[ClubInDB, ClubCreate]):
    
    async def create_club(self, obj_in: ClubCreate, current_user: UserInDB) -> ClubInDB:
        if current_user.role == "student":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students are not authorized to create clubs"
            )
        
        # If no coordinator provided, default to the creator
        if obj_in.coordinator_id is None:
            obj_in.coordinator_id = current_user.id
            
        return await self.create(obj_in)

    async def update_club(self, id: str, obj_in: Dict[str, Any], current_user: UserInDB) -> Optional[ClubInDB]:
        if current_user.role == "student":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students are not authorized to modify clubs"
            )
            
        club = await self.get_by_id(id)
        if not club:
            raise HTTPException(status_code=404, detail="Club not found")
            
        # Object-level authorization
        if current_user.role == "organizer":
            if str(club.coordinator_id) != str(current_user.id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You are not authorized to modify this club"
                )
                
        return await self.update(id, obj_in)

    async def delete_club(self, id: str, current_user: UserInDB) -> bool:
        if current_user.role == "student":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students are not authorized to delete clubs"
            )
            
        club = await self.get_by_id(id)
        if not club:
            raise HTTPException(status_code=404, detail="Club not found")
            
        if current_user.role == "organizer":
            if str(club.coordinator_id) != str(current_user.id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You are not authorized to delete this club"
                )
                
        return await self.delete(id)
