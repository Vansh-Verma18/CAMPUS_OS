from typing import Any, List
from fastapi import APIRouter, Depends
from app.schemas.clubs import ClubInDB, ClubCreate, ClubResponse
from app.schemas.users import UserInDB
from app.api.deps import get_current_active_user, get_club_service
from app.services.clubs import ClubService

router = APIRouter()

@router.get("", response_model=List[ClubResponse])
async def read_clubs(
    skip: int = 0,
    limit: int = 100,
    current_user: UserInDB = Depends(get_current_active_user),
    club_service: ClubService = Depends(get_club_service)
) -> Any:
    return await club_service.get_all(skip=skip, limit=limit)

@router.get("/{club_id}", response_model=ClubResponse)
async def read_club(
    club_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    club_service: ClubService = Depends(get_club_service)
) -> Any:
    club = await club_service.get_by_id(club_id)
    if not club:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Club not found")
    return club

@router.post("", response_model=ClubResponse)
async def create_club(
    obj_in: ClubCreate,
    current_user: UserInDB = Depends(get_current_active_user),
    club_service: ClubService = Depends(get_club_service)
) -> Any:
    return await club_service.create_club(obj_in, current_user)

@router.put("/{club_id}", response_model=ClubResponse)
async def update_club(
    club_id: str,
    obj_in: ClubCreate,
    current_user: UserInDB = Depends(get_current_active_user),
    club_service: ClubService = Depends(get_club_service)
) -> Any:
    return await club_service.update_club(club_id, obj_in.model_dump(exclude_unset=True), current_user)

@router.delete("/{club_id}")
async def delete_club(
    club_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    club_service: ClubService = Depends(get_club_service)
) -> Any:
    await club_service.delete_club(club_id, current_user)
    return {"status": "deleted"}
