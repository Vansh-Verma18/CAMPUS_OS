# CampusOS API Structure

## Base URL
/api/v1

## Current Endpoints (Step 6)

### Authentication
- POST /auth/login: Authenticate user and get JWT
- GET /auth/me: Get current authenticated user details

### Clubs
- GET /clubs: List all clubs
- GET /clubs/{id}: Get club by ID
- POST /clubs: Create a new club (Organizer/Admin)
- PUT /clubs/{id}: Update club (Coordinator/Admin)
- DELETE /clubs/{id}: Delete club (Admin)

### Events
- GET /events: List all events with filters (category, club, venue, status)
- GET /events/{id}: Get event by ID
- POST /events: Create a new event (Organizer/Admin)
- PUT /events/{id}: Update event (Owner/Admin)
- DELETE /events/{id}: Delete event (Admin)
- POST /events/detect-conflicts: Deterministic conflict detection (Organizer/Admin/Faculty)

### Venues & Resources
- GET /venues: List venues
- POST /venues: Create venue (Admin)
- PUT /venues/{id}: Update venue (Admin)
- DELETE /venues/{id}: Delete venue (Admin)
- GET /resources: List resources
- POST /resources: Create resource (Admin)
- PUT /resources/{id}: Update resource (Admin)
- DELETE /resources/{id}: Delete resource (Admin)

### Operations (Nested Event Resources)
- POST /events/{id}/registrations: Register for event
- GET /events/{id}/registrations: View event registrations (Organizer/Admin)
- DELETE /events/{id}/registrations/me: Unregister from event
- GET /registrations/me: View my registrations
- POST /events/{id}/attendance: Record attendance (Organizer/Admin)
- GET /events/{id}/attendance: View event attendance (Organizer/Admin)
- GET /attendance/me: View my attendance
- POST /events/{id}/feedback: Submit feedback
- GET /events/{id}/feedback: View event feedback (Organizer/Admin)
- POST /events/{id}/expenses: Record expense (Organizer/Admin)
- GET /events/{id}/expenses: View expenses (Organizer/Admin)
- PUT /expenses/{id}: Update expense (Creator/Admin)
- DELETE /expenses/{id}: Delete expense (Admin)

### AI Operations Agent (Step 6)
- POST /ai/query: Submit a natural language query to the AI Operations Agent

  **Request:** `{ "question": "string" }` — role field is NOT accepted; role is read from JWT only.

  **Response:** `{ "answer": str, "claims": [...], "recommendations": [...], "sources": [...], "processing_time_ms": int, "role_context": str }`

  **Claim types:**
  - `VERIFIED` — directly supported by retrieved institutional data
  - `DERIVED` — calculated or logically inferred from retrieved data
  - `RECOMMENDATION` — AI-generated suggestion, clearly labelled
  - `INSUFFICIENT_EVIDENCE` — data was not available to answer

  **Access:** All authenticated, active users. Data scope is role-restricted:
  - Student: public events, active clubs, own registrations
  - Organizer/Faculty: above + venues, resources, registration counts
  - Admin: institution-wide data including financial summaries

  **Security:** Role is always sourced from the JWT. The LLM never receives data the user is not authorized to see. Provider failures return HTTP 503 with a safe message.

## System
- GET /health: System health status (MongoDB, ChromaDB)

