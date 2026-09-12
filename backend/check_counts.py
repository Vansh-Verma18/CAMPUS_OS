import asyncio
from app.db.mongodb import connect_to_mongo, get_database, close_mongo_connection

async def check():
    await connect_to_mongo()
    db = get_database()
    for coll in ["users", "clubs", "events", "documents", "registrations", "attendance", "expenses", "venues", "departments"]:
        count = await db[coll].count_documents({})
        print(f"{coll}: {count}")
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(check())
