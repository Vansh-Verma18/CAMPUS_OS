import httpx
import json

BASE_URL = 'http://localhost:8000/api/v1'

def login(email, password):
    r = httpx.post(f'{BASE_URL}/auth/login', json={'email': email, 'password': password})
    if r.status_code != 200:
        print(f'Failed to login {email}: {r.status_code}')
        return None
    return r.json()['access_token']

def get_headers(token):
    return {'Authorization': f'Bearer {token}'}

def test_ai(token, question):
    r = httpx.post(f'{BASE_URL}/ai/query', json={'question': question}, headers=get_headers(token), timeout=60.0)
    return r

def run_tests():
    print('Starting E2E API Verification...')
    
    tokens = {}
    users = ['admin', 'faculty', 'organizer', 'student']
    for u in users:
        t = login(f'{u}@campus.edu', 'password123')
        if t: tokens[u] = t
        else: print(f'Could not login as {u}')
        
    # ADMIN
    print('\n--- TEST 1: ADMIN ---')
    if 'admin' in tokens:
        print('Ask AI about events...')
        r = test_ai(tokens['admin'], 'What events are happening this week?')
        print('Admin AI status:', r.status_code)
            
        print('Test Event Conflict...')
        event = {
            'title': 'Conflict Event',
            'description': 'Test',
            'start_datetime': '2026-09-13T04:31:52.300Z',
            'end_datetime': '2026-09-13T07:31:52.300Z',
            'venue_id': '6aa384384d96cbc408d8d459',
            'organizer_id': '6aa384384d96cbc408d8d456',
            'status': 'scheduled',
            'expected_participants': 10
        }
        r = httpx.post(f'{BASE_URL}/events/detect-conflicts', json=event, headers=get_headers(tokens['admin']))
        print('Conflict Detection status:', r.status_code)
        
    # FACULTY
    print('\n--- TEST 2: FACULTY ---')
    if 'faculty' in tokens:
        print('Ask AI about permitted info (events)...')
        r = test_ai(tokens['faculty'], 'What events are happening?')
        print('Faculty AI status:', r.status_code)

    # ORGANIZER
    print('\n--- TEST 3: ORGANIZER ---')
    if 'organizer' in tokens:
        print('Ask AI about info...')
        r = test_ai(tokens['organizer'], 'What events are happening?')
        print('Organizer AI status:', r.status_code)

    # STUDENT
    print('\n--- TEST 4: STUDENT ---')
    if 'student' in tokens:
        print('Ask AI about public events...')
        r = test_ai(tokens['student'], 'What events are happening?')
        print('Student AI status:', r.status_code)
            
        print('Test unauthorized access to analytics...')
        r = httpx.get(f'{BASE_URL}/analytics/dashboard', headers=get_headers(tokens['student']))
        print('Student Analytics Access status:', r.status_code)

if __name__ == '__main__':
    run_tests()
