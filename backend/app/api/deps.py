from typing import List, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.db.mongodb import get_database
from app.repositories.base import BaseRepository
from app.schemas.users import UserInDB, UserCreate
from app.security.jwt import decode_access_token
from app.schemas.token import TokenPayload

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"/api/v1/auth/login")

def get_user_repo(db: Any = Depends(get_database)) -> BaseRepository[UserInDB, UserCreate]:
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    return BaseRepository[UserInDB, UserCreate](db["users"], UserInDB)

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    user_repo: BaseRepository[UserInDB, UserCreate] = Depends(get_user_repo)
) -> UserInDB:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = TokenPayload(**payload)
    except Exception:
        raise credentials_exception
    
    user = await user_repo.get_by_id(token_data.sub)
    if user is None:
        raise credentials_exception
    
    return user

async def get_current_active_user(
    current_user: UserInDB = Depends(get_current_user)
) -> UserInDB:
    if current_user.account_status != "active":
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: UserInDB = Depends(get_current_active_user)) -> UserInDB:
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return user

from app.schemas.clubs import ClubInDB, ClubCreate
from app.schemas.events import EventInDB, EventCreate
from app.schemas.venues import VenueInDB, VenueCreate
from app.schemas.resources import ResourceInDB, ResourceCreate
from app.schemas.registrations import RegistrationInDB, RegistrationCreate
from app.schemas.attendance import AttendanceInDB, AttendanceCreate
from app.schemas.feedback import FeedbackInDB, FeedbackCreate
from app.schemas.expenses import ExpenseInDB, ExpenseCreate

from app.services.clubs import ClubService
from app.services.events import EventService
from app.services.venues import VenueService
from app.services.resources import ResourceService
from app.services.registrations import RegistrationService
from app.services.attendance import AttendanceService
from app.services.feedback import FeedbackService
from app.services.expenses import ExpenseService
from app.services.event_conflicts import EventConflictService

def get_club_repo(db: Any = Depends(get_database)) -> BaseRepository[ClubInDB, ClubCreate]:
    return BaseRepository[ClubInDB, ClubCreate](db["clubs"], ClubInDB)
def get_club_service(repo: BaseRepository[ClubInDB, ClubCreate] = Depends(get_club_repo)) -> ClubService:
    return ClubService(repo)

def get_venue_repo(db: Any = Depends(get_database)) -> BaseRepository[VenueInDB, VenueCreate]:
    return BaseRepository[VenueInDB, VenueCreate](db["venues"], VenueInDB)
def get_venue_service(repo: BaseRepository[VenueInDB, VenueCreate] = Depends(get_venue_repo)) -> VenueService:
    return VenueService(repo)

def get_resource_repo(db: Any = Depends(get_database)) -> BaseRepository[ResourceInDB, ResourceCreate]:
    return BaseRepository[ResourceInDB, ResourceCreate](db["resources"], ResourceInDB)
def get_resource_service(repo: BaseRepository[ResourceInDB, ResourceCreate] = Depends(get_resource_repo)) -> ResourceService:
    return ResourceService(repo)

def get_event_repo(db: Any = Depends(get_database)) -> BaseRepository[EventInDB, EventCreate]:
    return BaseRepository[EventInDB, EventCreate](db["events"], EventInDB)
def get_event_service(
    repo: BaseRepository[EventInDB, EventCreate] = Depends(get_event_repo),
    club_repo: BaseRepository[ClubInDB, ClubCreate] = Depends(get_club_repo),
    venue_repo: BaseRepository[VenueInDB, VenueCreate] = Depends(get_venue_repo),
    resource_repo: BaseRepository[ResourceInDB, ResourceCreate] = Depends(get_resource_repo)
) -> EventService:
    return EventService(repo, club_repo, venue_repo, resource_repo)

def get_registration_repo(db: Any = Depends(get_database)) -> BaseRepository[RegistrationInDB, RegistrationCreate]:
    return BaseRepository[RegistrationInDB, RegistrationCreate](db["registrations"], RegistrationInDB)
def get_registration_service(
    repo: BaseRepository[RegistrationInDB, RegistrationCreate] = Depends(get_registration_repo),
    event_repo: BaseRepository[EventInDB, EventCreate] = Depends(get_event_repo)
) -> RegistrationService:
    return RegistrationService(repo, event_repo)

def get_attendance_repo(db: Any = Depends(get_database)) -> BaseRepository[AttendanceInDB, AttendanceCreate]:
    return BaseRepository[AttendanceInDB, AttendanceCreate](db["attendance"], AttendanceInDB)
def get_attendance_service(
    repo: BaseRepository[AttendanceInDB, AttendanceCreate] = Depends(get_attendance_repo),
    event_repo: BaseRepository[EventInDB, EventCreate] = Depends(get_event_repo)
) -> AttendanceService:
    return AttendanceService(repo, event_repo)

def get_feedback_repo(db: Any = Depends(get_database)) -> BaseRepository[FeedbackInDB, FeedbackCreate]:
    return BaseRepository[FeedbackInDB, FeedbackCreate](db["feedback"], FeedbackInDB)
def get_feedback_service(
    repo: BaseRepository[FeedbackInDB, FeedbackCreate] = Depends(get_feedback_repo),
    event_repo: BaseRepository[EventInDB, EventCreate] = Depends(get_event_repo)
) -> FeedbackService:
    return FeedbackService(repo, event_repo)

def get_expense_repo(db: Any = Depends(get_database)) -> BaseRepository[ExpenseInDB, ExpenseCreate]:
    return BaseRepository[ExpenseInDB, ExpenseCreate](db["expenses"], ExpenseInDB)
def get_expense_service(
    repo: BaseRepository[ExpenseInDB, ExpenseCreate] = Depends(get_expense_repo),
    event_repo: BaseRepository[EventInDB, EventCreate] = Depends(get_event_repo)
) -> ExpenseService:
    return ExpenseService(repo, event_repo)

def get_event_conflict_service(
    event_repo: BaseRepository[EventInDB, EventCreate] = Depends(get_event_repo),
    venue_repo: BaseRepository[VenueInDB, VenueCreate] = Depends(get_venue_repo),
    resource_repo: BaseRepository[ResourceInDB, ResourceCreate] = Depends(get_resource_repo)
) -> EventConflictService:
    return EventConflictService(event_repo, venue_repo, resource_repo)
