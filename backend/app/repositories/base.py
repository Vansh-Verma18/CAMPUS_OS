from typing import TypeVar, Generic, Type, Optional, List, Dict, Any
from bson import ObjectId
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorCollection

ModelType = TypeVar("ModelType", bound=BaseModel)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)

class BaseRepository(Generic[ModelType, CreateSchemaType]):
    def __init__(self, collection: AsyncIOMotorCollection[Any], model: Type[ModelType]):
        self.collection = collection
        self.model = model

    async def get_by_id(self, id: str) -> Optional[ModelType]:
        try:
            obj_id = ObjectId(id)
        except Exception:
            return None
            
        doc = await self.collection.find_one({"_id": obj_id})
        if doc:
            return self.model(**doc)
        return None

    async def get_all(self, limit: int = 100, skip: int = 0, query: Optional[Dict[str, Any]] = None) -> List[ModelType]:
        if query is None:
            query = {}
        cursor = self.collection.find(query).skip(skip).limit(limit)
        docs = await cursor.to_list(length=limit)
        return [self.model(**doc) for doc in docs]

    async def create(self, obj_in: CreateSchemaType, **additional_data: Any) -> ModelType:
        obj_in_data = obj_in.model_dump()
        obj_in_data.update(additional_data)
        
        # Ensure created_at and updated_at if applicable
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        if "created_at" not in obj_in_data:
            obj_in_data["created_at"] = now
        if "updated_at" not in obj_in_data:
            obj_in_data["updated_at"] = now

        result = await self.collection.insert_one(obj_in_data)
        doc = await self.collection.find_one({"_id": result.inserted_id})
        if not doc:
            raise ValueError("Failed to retrieve created document")
        return self.model(**doc)

    async def update(self, id: str, obj_in: Dict[str, Any]) -> Optional[ModelType]:
        try:
            obj_id = ObjectId(id)
        except Exception:
            return None

        obj_in["updated_at"] = __import__("datetime").datetime.now(__import__("datetime").timezone.utc)
        result = await self.collection.update_one(
            {"_id": obj_id},
            {"$set": obj_in}
        )
        if result.modified_count == 0:
            return await self.get_by_id(id) # Return existing if no fields changed
            
        return await self.get_by_id(id)

    async def delete(self, id: str) -> bool:
        try:
            obj_id = ObjectId(id)
        except Exception:
            return False
            
        result = await self.collection.delete_one({"_id": obj_id})
        return result.deleted_count > 0
