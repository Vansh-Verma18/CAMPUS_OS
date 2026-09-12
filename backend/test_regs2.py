import asyncio
from app.db.mongodb import connect_to_mongo, get_database, close_mongo_connection
from bson import ObjectId

async def test():
    await connect_to_mongo()
    db = get_database()
    
    # Alice ID is 6aa4c6ab490996cadf14314f (as printed before)
    # But let's find her again dynamically to be safe
    alice = await db['users'].find_one({'email': 'student@campus.edu'})
    alice_id = alice['_id']
    
    # Fetch all registrations for alice
    regs_obj = await db['registrations'].find({'user_id': alice_id}).to_list(100)
    print("ObjectId match:", len(regs_obj))
    
    regs_str = await db['registrations'].find({'user_id': str(alice_id)}).to_list(100)
    print("String match:", len(regs_str))
    
    r2 = await db['registrations'].find_one()
    print("Any registration user_id type:", type(r2['user_id']))
    
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(test())
