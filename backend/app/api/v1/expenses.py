from typing import Any
from fastapi import APIRouter, Depends
from app.schemas.expenses import ExpenseInDB, ExpenseCreate, ExpenseResponse
from app.schemas.users import UserInDB
from app.api.deps import get_current_active_user, get_expense_service
from app.services.expenses import ExpenseService

router = APIRouter()

@router.put("/{expense_id}", response_model=ExpenseResponse)
async def update_expense(
    expense_id: str,
    obj_in: ExpenseCreate,
    current_user: UserInDB = Depends(get_current_active_user),
    expense_service: ExpenseService = Depends(get_expense_service)
) -> Any:
    return await expense_service.update_expense(expense_id, obj_in.model_dump(exclude_unset=True), current_user)

@router.delete("/{expense_id}")
async def delete_expense(
    expense_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    expense_service: ExpenseService = Depends(get_expense_service)
) -> Any:
    await expense_service.delete_expense(expense_id, current_user)
    return {"status": "deleted"}
