import httpx
import asyncio

async def test():
    async with httpx.AsyncClient() as client:
        # login as student
        r = await client.post("http://localhost:8000/api/v1/auth/login", json={"email": "student@campus.edu", "password": "password123"})
        token = r.json()["access_token"]
        
        # trigger AI
        r2 = await client.post(
            "http://localhost:8000/api/v1/ai/query",
            headers={"Authorization": f"Bearer {token}"},
            json={"question": "anything"}
        )
        print(r2.json()["answer"])

if __name__ == "__main__":
    asyncio.run(test())
