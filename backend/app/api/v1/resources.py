from typing import Any, List
from fastapi import APIRouter, Depends
from app.schemas.resources import ResourceInDB, ResourceCreate, ResourceResponse
from app.schemas.users import UserInDB
from app.api.deps import get_current_active_user, get_resource_service
from app.services.resources import ResourceService

router = APIRouter()

@router.get("", response_model=List[ResourceResponse])
async def read_resources(
    skip: int = 0,
    limit: int = 100,
    current_user: UserInDB = Depends(get_current_active_user),
    resource_service: ResourceService = Depends(get_resource_service)
) -> Any:
    return await resource_service.get_all(skip=skip, limit=limit)

@router.get("/{resource_id}", response_model=ResourceResponse)
async def read_resource(
    resource_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    resource_service: ResourceService = Depends(get_resource_service)
) -> Any:
    resource = await resource_service.get_by_id(resource_id)
    if not resource:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Resource not found")
    return resource

@router.post("", response_model=ResourceResponse)
async def create_resource(
    obj_in: ResourceCreate,
    current_user: UserInDB = Depends(get_current_active_user),
    resource_service: ResourceService = Depends(get_resource_service)
) -> Any:
    return await resource_service.create_resource(obj_in, current_user)

@router.put("/{resource_id}", response_model=ResourceResponse)
async def update_resource(
    resource_id: str,
    obj_in: ResourceCreate,
    current_user: UserInDB = Depends(get_current_active_user),
    resource_service: ResourceService = Depends(get_resource_service)
) -> Any:
    return await resource_service.update_resource(resource_id, obj_in.model_dump(exclude_unset=True), current_user)

@router.delete("/{resource_id}")
async def delete_resource(
    resource_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    resource_service: ResourceService = Depends(get_resource_service)
) -> Any:
    await resource_service.delete_resource(resource_id, current_user)
    return {"status": "deleted"}
