from typing import Any, List
from fastapi import APIRouter, Depends
from app.schemas.registrations import RegistrationResponse
from app.schemas.users import UserInDB
from app.api.deps import get_current_active_user, get_registration_service
from app.services.registrations import RegistrationService

router = APIRouter()

@router.get("/me", response_model=List[RegistrationResponse])
async def read_my_registrations(
    current_user: UserInDB = Depends(get_current_active_user),
    registration_service: RegistrationService = Depends(get_registration_service)
) -> Any:
    return await registration_service.get_my_registrations(current_user)
