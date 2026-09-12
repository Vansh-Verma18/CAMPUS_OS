import asyncio
import time
from app.db.mongodb import connect_to_mongo, get_database, close_mongo_connection
from app.api.v1.ai import _get_ai_agent_service
from app.schemas.users import UserInDB

async def test():
    await connect_to_mongo()
    db = get_database()
    alice = await db['users'].find_one({'email': 'student@campus.edu'})
    current_user = UserInDB(**alice)
    
    agent_service = _get_ai_agent_service()
    
    # get evidence manually
    evidence = await agent_service.retrieval_service.get_evidence(current_user)
    
    start = int(time.time() * 1000)
    # run fallback
    res = await agent_service._deterministic_fallback("highest registration", evidence, current_user, start)
    print(res.answer)
        
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(test())
