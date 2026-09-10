from typing import Dict, Any, Optional, List
from fastapi import HTTPException, status
from app.services.base import BaseService
from app.schemas.expenses import ExpenseInDB, ExpenseCreate
from app.schemas.users import UserInDB
from app.schemas.events import EventInDB
from app.repositories.base import BaseRepository

class ExpenseService(BaseService[ExpenseInDB, ExpenseCreate]):
    
    def __init__(self, 
                 repository: BaseRepository[ExpenseInDB, ExpenseCreate],
                 event_repo: BaseRepository[EventInDB, Any]):
        super().__init__(repository)
        self.event_repo = event_repo

    async def _check_event_auth(self, event_id: str, current_user: UserInDB) -> EventInDB:
        if current_user.role == "student":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students are not authorized to access expenses"
            )
            
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
            
        if current_user.role == "organizer":
            if str(event.created_by) != str(current_user.id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You are not authorized to manage expenses for this event"
                )
        return event

    async def record_expense(self, event_id: str, obj_in: ExpenseCreate, current_user: UserInDB) -> ExpenseInDB:
        await self._check_event_auth(event_id, current_user)
        
        # Override identifiers to prevent spoofing
        obj_in.event_id = event_id
        obj_in.recorded_by = current_user.id
        
        return await self.create(obj_in)

    async def get_event_expenses(self, event_id: str, current_user: UserInDB) -> List[ExpenseInDB]:
        await self._check_event_auth(event_id, current_user)
        return await self.get_all(query={"event_id": event_id}, limit=100)

    async def update_expense(self, id: str, obj_in: Dict[str, Any], current_user: UserInDB) -> Optional[ExpenseInDB]:
        expense = await self.get_by_id(id)
        if not expense:
            raise HTTPException(status_code=404, detail="Expense not found")
            
        await self._check_event_auth(str(expense.event_id), current_user)
        return await self.update(id, obj_in)

    async def delete_expense(self, id: str, current_user: UserInDB) -> bool:
        expense = await self.get_by_id(id)
        if not expense:
            raise HTTPException(status_code=404, detail="Expense not found")
            
        await self._check_event_auth(str(expense.event_id), current_user)
        return await self.delete(id)
