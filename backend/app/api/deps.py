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
