import asyncio
import json
from app.db.mongodb import connect_to_mongo, get_database, close_mongo_connection
from app.api.deps import get_current_active_user
from app.api.v1.ai import _get_ai_agent_service
from app.schemas.users import UserInDB
from app.schemas.ai import AIQueryRequest
from unittest.mock import MagicMock

async def test():
    await connect_to_mongo()
    db = get_database()
    alice = await db['users'].find_one({'email': 'student@campus.edu'})
    current_user = UserInDB(**alice)
    
    agent_service = _get_ai_agent_service()
    
    # get evidence manually
    evidence = await agent_service.retrieval_service.get_evidence(current_user)
    
    for ev in evidence['events']:
        print(f"{ev['title']}: {ev.get('registration_count', 0)} registrations")
        
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(test())
