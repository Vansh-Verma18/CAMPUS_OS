from typing import Any, List
from fastapi import APIRouter, Depends
from app.schemas.attendance import AttendanceResponse
from app.schemas.users import UserInDB
from app.api.deps import get_current_active_user, get_attendance_service
from app.services.attendance import AttendanceService

router = APIRouter()

@router.get("/me", response_model=List[AttendanceResponse])
async def read_my_attendance(
    current_user: UserInDB = Depends(get_current_active_user),
    attendance_service: AttendanceService = Depends(get_attendance_service)
) -> Any:
    return await attendance_service.get_my_attendance(current_user)
