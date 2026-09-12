import asyncio
from app.db.mongodb import connect_to_mongo, get_database, close_mongo_connection
from datetime import datetime, timezone
from bson import ObjectId

async def add_data():
    await connect_to_mongo()
    db = get_database()
    
    # Get Alice
    alice = await db['users'].find_one({'email': 'student@campus.edu'})
    if not alice:
        print("Alice not found")
        return
        
    alice_id = alice['_id']
    print(f"Found Alice: {alice_id}")
    
    # Get some events
    events = await db['events'].find({}).to_list(5)
    if not events:
        print("No events found")
        return
        
    now = datetime.now(timezone.utc)
    registrations = []
    
    for event in events:
        # Check if already registered
        existing = await db['registrations'].find_one({'user_id': alice_id, 'event_id': event['_id']})
        if not existing:
            reg = {
                "_id": ObjectId(),
                "user_id": alice_id,
                "event_id": event['_id'],
                "status": "confirmed",
                "registered_at": now,
                "created_at": now,
                "updated_at": now
            }
            registrations.append(reg)
            
    if registrations:
        await db['registrations'].insert_many(registrations)
        print(f"Added {len(registrations)} registrations for Alice.")
    else:
        print("Alice is already registered for these events.")
        
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(add_data())
