import httpx
import json

BASE_URL = 'http://localhost:8000/api/v1'

def login(email, password):
    r = httpx.post(f'{BASE_URL}/auth/login', json={'email': email, 'password': password})
    return r.json()['access_token']

token = login('prof.smith@campus.edu', 'password123')
r = httpx.post(f'{BASE_URL}/ai/query', json={'question': 'What events are happening?'}, headers={'Authorization': f'Bearer {token}'}, timeout=60.0)
print('Faculty AI status:', r.status_code)
