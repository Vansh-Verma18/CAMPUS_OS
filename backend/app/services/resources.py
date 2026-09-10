from typing import Dict, Any, Optional
from fastapi import HTTPException, status
from app.services.base import BaseService
from app.schemas.resources import ResourceInDB, ResourceCreate
from app.schemas.users import UserInDB

class ResourceService(BaseService[ResourceInDB, ResourceCreate]):
    
    async def create_resource(self, obj_in: ResourceCreate, current_user: UserInDB) -> ResourceInDB:
        if current_user.role == "student":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students are not authorized to create resources"
            )
        return await self.create(obj_in)

    async def update_resource(self, id: str, obj_in: Dict[str, Any], current_user: UserInDB) -> Optional[ResourceInDB]:
        if current_user.role == "student":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students are not authorized to modify resources"
            )
        resource = await self.get_by_id(id)
        if not resource:
            raise HTTPException(status_code=404, detail="Resource not found")
            
        return await self.update(id, obj_in)

    async def delete_resource(self, id: str, current_user: UserInDB) -> bool:
        if current_user.role == "student":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students are not authorized to delete resources"
            )
        resource = await self.get_by_id(id)
        if not resource:
            raise HTTPException(status_code=404, detail="Resource not found")
            
        return await self.delete(id)
