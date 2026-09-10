from typing import Any, List
from fastapi import APIRouter, Depends
from app.schemas.venues import VenueInDB, VenueCreate, VenueResponse
from app.schemas.users import UserInDB
from app.api.deps import get_current_active_user, get_venue_service
from app.services.venues import VenueService

router = APIRouter()

@router.get("", response_model=List[VenueResponse])
async def read_venues(
    skip: int = 0,
    limit: int = 100,
    current_user: UserInDB = Depends(get_current_active_user),
    venue_service: VenueService = Depends(get_venue_service)
) -> Any:
    return await venue_service.get_all(skip=skip, limit=limit)

@router.get("/{venue_id}", response_model=VenueResponse)
async def read_venue(
    venue_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    venue_service: VenueService = Depends(get_venue_service)
) -> Any:
    venue = await venue_service.get_by_id(venue_id)
    if not venue:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Venue not found")
    return venue

@router.post("", response_model=VenueResponse)
async def create_venue(
    obj_in: VenueCreate,
    current_user: UserInDB = Depends(get_current_active_user),
    venue_service: VenueService = Depends(get_venue_service)
) -> Any:
    return await venue_service.create_venue(obj_in, current_user)

@router.put("/{venue_id}", response_model=VenueResponse)
async def update_venue(
    venue_id: str,
    obj_in: VenueCreate,
    current_user: UserInDB = Depends(get_current_active_user),
    venue_service: VenueService = Depends(get_venue_service)
) -> Any:
    return await venue_service.update_venue(venue_id, obj_in.model_dump(exclude_unset=True), current_user)

@router.delete("/{venue_id}")
async def delete_venue(
    venue_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    venue_service: VenueService = Depends(get_venue_service)
) -> Any:
    await venue_service.delete_venue(venue_id, current_user)
    return {"status": "deleted"}
