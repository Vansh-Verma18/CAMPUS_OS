import httpx
import asyncio

async def test():
    async with httpx.AsyncClient() as client:
        # login as alice
        r = await client.post("http://localhost:8000/api/v1/auth/login", json={"email": "student@campus.edu", "password": "password123"})
        token = r.json()["access_token"]
        print("Got token")
        
        # fetch registrations
        r2 = await client.get("http://localhost:8000/api/v1/registrations/me", headers={"Authorization": f"Bearer {token}"})
        print(r2.json())

if __name__ == "__main__":
    asyncio.run(test())
