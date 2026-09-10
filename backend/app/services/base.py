from typing import TypeVar, Generic, Optional, List, Dict, Any
from app.repositories.base import BaseRepository
from pydantic import BaseModel

ModelType = TypeVar("ModelType", bound=BaseModel)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)

class BaseService(Generic[ModelType, CreateSchemaType]):
    def __init__(self, repository: BaseRepository[ModelType, CreateSchemaType]):
        self.repository = repository

    async def get_by_id(self, id: str) -> Optional[ModelType]:
        return await self.repository.get_by_id(id)

    async def get_all(self, limit: int = 100, skip: int = 0, query: Optional[Dict[str, Any]] = None) -> List[ModelType]:
        return await self.repository.get_all(limit=limit, skip=skip, query=query)

    async def create(self, obj_in: CreateSchemaType, **additional_data: Any) -> ModelType:
        return await self.repository.create(obj_in, **additional_data)

    async def update(self, id: str, obj_in: Dict[str, Any]) -> Optional[ModelType]:
        return await self.repository.update(id, obj_in)

    async def delete(self, id: str) -> bool:
        return await self.repository.delete(id)
