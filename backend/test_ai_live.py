import asyncio
import httpx

API_URL = "http://localhost:8000/api/v1"

async def test_ai():
    async with httpx.AsyncClient() as client:
        print("\n--- TEST 1: STUDENT RBAC ---")
        # Login as student
        resp = await client.post(f"{API_URL}/auth/login", data={"username": "student@campus.edu", "password": "password123"})
        student_token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {student_token}"}
        
        # Ask about a restricted document
        query = {"question": "Can you summarize the confidential budget report?"}
        resp = await client.post(f"{API_URL}/ai/query", json=query, headers=headers)
        data = resp.json()
        print("Student Ask (Budget):", data.get("answer", data))
        
        print("\n--- TEST 2: ADMIN RBAC ---")
        # Login as admin
        resp = await client.post(f"{API_URL}/auth/login", data={"username": "admin@campus.edu", "password": "password123"})
        admin_token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Ask about a restricted document
        resp = await client.post(f"{API_URL}/ai/query", json=query, headers=headers)
        data = resp.json()
        print("Admin Ask (Budget):", data.get("answer", data))

        print("\n--- TEST 3: AI MEMORY (HISTORY) ---")
        # Ask a sequence
        q1 = {"question": "My name is Alice and I love robotics.", "conversation_history": []}
        resp = await client.post(f"{API_URL}/ai/query", json=q1, headers=headers)
        ans1 = resp.json().get("answer", "")
        print("Q1 (No History):", ans1)
        
        history = [
            {"role": "user", "content": "My name is Alice and I love robotics."},
            {"role": "assistant", "content": ans1}
        ]
        
        q2 = {"question": "What is my name and what do I like?", "conversation_history": history}
        resp = await client.post(f"{API_URL}/ai/query", json=q2, headers=headers)
        print("Q2 (With History):", resp.json().get("answer", ""))

if __name__ == "__main__":
    asyncio.run(test_ai())
