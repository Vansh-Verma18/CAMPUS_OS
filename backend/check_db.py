import asyncio
from app.db.mongodb import connect_to_mongo, get_database, close_mongo_connection

async def check():
    await connect_to_mongo()
    db = get_database()
    users = await db['users'].find({}).to_list(10)
    print(users)
    await close_mongo_connection()

asyncio.run(check())
