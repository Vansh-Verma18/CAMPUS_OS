from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.repositories.base import BaseRepository
from app.schemas.users import UserInDB, UserCreate, UserResponse
from app.schemas.token import Token
from app.api.deps import get_user_repo, get_current_active_user
from app.security.password import verify_password
from app.security.jwt import create_access_token

router = APIRouter()

@router.post("/login", response_model=Token)
async def login_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    user_repo: BaseRepository[UserInDB, UserCreate] = Depends(get_user_repo)
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    Uses 'username' field from form to match 'email' in our system.
    """
    users = await user_repo.get_all(query={"email": form_data.username})
    user = users[0] if users else None
    
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )
    elif user.account_status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    access_token = create_access_token(subject=user.id, role=user.role)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse(**user.model_dump(by_alias=True))
    }

@router.get("/me", response_model=UserResponse)
async def read_users_me(
    current_user: UserInDB = Depends(get_current_active_user)
) -> Any:
    """
    Get current user profile safely.
    """
    return UserResponse(**current_user.model_dump(by_alias=True))
