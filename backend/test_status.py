import asyncio
from app.db.mongodb import connect_to_mongo, get_database, close_mongo_connection

async def test():
    await connect_to_mongo()
    db = get_database()
    r = await db['registrations'].find_one()
    print('Seed status:', r['status'] if r else None)
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(test())
