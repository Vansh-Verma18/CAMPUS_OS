from typing import Any, List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from app.schemas.events import EventInDB, EventCreate, EventResponse
from app.schemas.registrations import RegistrationResponse, RegistrationCreate
from app.schemas.attendance import AttendanceResponse, AttendanceCreate
from app.schemas.feedback import FeedbackResponse, FeedbackCreate
from app.schemas.expenses import ExpenseResponse, ExpenseCreate
from app.schemas.users import UserInDB
from app.api.deps import (
    get_current_active_user, 
    get_event_service,
    get_registration_service,
    get_attendance_service,
    get_feedback_service,
    get_expense_service,
    get_event_conflict_service
)
from app.services.events import EventService
from app.services.registrations import RegistrationService
from app.services.attendance import AttendanceService
from app.services.feedback import FeedbackService
from app.services.expenses import ExpenseService
from app.services.event_conflicts import EventConflictService
from app.schemas.event_conflicts import ConflictDetectionRequest, ConflictAnalysis

router = APIRouter()

@router.post("/detect-conflicts", response_model=ConflictAnalysis)
async def detect_event_conflicts(
    request: ConflictDetectionRequest,
    current_user: UserInDB = Depends(get_current_active_user),
    conflict_service: EventConflictService = Depends(get_event_conflict_service)
) -> Any:
    return await conflict_service.detect_conflicts(request, current_user)

@router.get("", response_model=List[EventResponse])
async def read_events(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    category: Optional[str] = None,
    club_id: Optional[str] = None,
    venue_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: UserInDB = Depends(get_current_active_user),
    event_service: EventService = Depends(get_event_service)
) -> Any:
    query = {}
    if category: query["category"] = category
    if club_id: query["organizer_club_id"] = club_id
    if venue_id: query["venue_id"] = venue_id
    if status: query["status"] = status
    
    return await event_service.get_all(skip=skip, limit=limit, query=query)

@router.get("/{event_id}", response_model=EventResponse)
async def read_event(
    event_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    event_service: EventService = Depends(get_event_service)
) -> Any:
    event = await event_service.get_by_id(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@router.post("", response_model=EventResponse)
async def create_event(
    obj_in: EventCreate,
    current_user: UserInDB = Depends(get_current_active_user),
    event_service: EventService = Depends(get_event_service)
) -> Any:
    return await event_service.create_event(obj_in, current_user)

@router.put("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: str,
    obj_in: EventCreate,
    current_user: UserInDB = Depends(get_current_active_user),
    event_service: EventService = Depends(get_event_service)
) -> Any:
    return await event_service.update_event(event_id, obj_in.model_dump(exclude_unset=True), current_user)

@router.delete("/{event_id}")
async def delete_event(
    event_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    event_service: EventService = Depends(get_event_service)
) -> Any:
    await event_service.delete_event(event_id, current_user)
    return {"status": "deleted"}

# Registrations
@router.post("/{event_id}/registrations", response_model=RegistrationResponse)
async def register_for_event(
    event_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    registration_service: RegistrationService = Depends(get_registration_service)
) -> Any:
    return await registration_service.register_user(event_id, current_user)

@router.get("/{event_id}/registrations", response_model=List[RegistrationResponse])
async def read_event_registrations(
    event_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    registration_service: RegistrationService = Depends(get_registration_service)
) -> Any:
    return await registration_service.get_event_registrations(event_id, current_user)

@router.delete("/{event_id}/registrations/me")
async def unregister_for_event(
    event_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    registration_service: RegistrationService = Depends(get_registration_service)
) -> Any:
    await registration_service.unregister_user(event_id, current_user)
    return {"status": "unregistered"}

# Attendance
@router.post("/{event_id}/attendance", response_model=AttendanceResponse)
async def record_attendance(
    event_id: str,
    obj_in: AttendanceCreate,
    current_user: UserInDB = Depends(get_current_active_user),
    attendance_service: AttendanceService = Depends(get_attendance_service)
) -> Any:
    return await attendance_service.record_attendance(event_id, obj_in, current_user)

@router.get("/{event_id}/attendance", response_model=List[AttendanceResponse])
async def read_event_attendance(
    event_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    attendance_service: AttendanceService = Depends(get_attendance_service)
) -> Any:
    return await attendance_service.get_event_attendance(event_id, current_user)

# Feedback
@router.post("/{event_id}/feedback", response_model=FeedbackResponse)
async def submit_feedback(
    event_id: str,
    obj_in: FeedbackCreate,
    current_user: UserInDB = Depends(get_current_active_user),
    feedback_service: FeedbackService = Depends(get_feedback_service)
) -> Any:
    return await feedback_service.submit_feedback(event_id, obj_in, current_user)

@router.get("/{event_id}/feedback", response_model=List[FeedbackResponse])
async def read_event_feedback(
    event_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    feedback_service: FeedbackService = Depends(get_feedback_service)
) -> Any:
    return await feedback_service.get_event_feedback(event_id, current_user)

# Expenses
@router.post("/{event_id}/expenses", response_model=ExpenseResponse)
async def record_expense(
    event_id: str,
    obj_in: ExpenseCreate,
    current_user: UserInDB = Depends(get_current_active_user),
    expense_service: ExpenseService = Depends(get_expense_service)
) -> Any:
    return await expense_service.record_expense(event_id, obj_in, current_user)

@router.get("/{event_id}/expenses", response_model=List[ExpenseResponse])
async def read_event_expenses(
    event_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    expense_service: ExpenseService = Depends(get_expense_service)
) -> Any:
    return await expense_service.get_event_expenses(event_id, current_user)
