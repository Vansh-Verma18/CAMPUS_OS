# CampusOS Architecture

## High-Level Design (Step 6)

### Frontend
- React 18, TypeScript, Vite
- TailwindCSS for styling
- Core components: Authentication, Routing
- Client API utility for authenticated fetch requests
- Pages: Dashboard, EventPlanner, AIAgent (/ai)

### Backend API
- FastAPI (Python 3.13)
- JWT Authentication & Role-Based Access Control (RBAC)
- Pydantic for request/response validation

### Services Layer (Business Logic)
- **BaseService**: Reusable logic for CRUD operations.
- **Domain Services**: ClubService, EventService, VenueService, ResourceService, RegistrationService, AttendanceService, FeedbackService, ExpenseService.
- **EventConflictService**: Deterministic conflict detection (venue, resource, audience overlap).
- **AIAgentService**: AI query orchestration — retrieves evidence, builds prompts, calls LLM, parses structured response.
- **AIRetrievalService**: Permission-aware data fetching — role-scoped evidence, LLM never receives unauthorized data.
- **AIProvider / GeminiProvider**: Swappable LLM provider abstraction (Google Gemini, with MockProvider for tests).
- Object-level ownership checks (e.g., organizers only modify their own events).

### AI Operations Agent (Step 6)
```
User → POST /api/v1/ai/query (JWT auth)
  → get_current_active_user (role from JWT only)
  → AIAgentService
    → AIRetrievalService  (permission-scoped evidence)
    → EventConflictService (deterministic, if conflict question)
    → GeminiProvider (evidence → LLM)
  → AIQueryResponse { answer, claims[VERIFIED|DERIVED|RECOMMENDATION|INSUFFICIENT_EVIDENCE], sources }
```

**Security invariants:**
- Role is NEVER accepted from request body — always from JWT.
- LLM only receives data the authenticated user is authorized to see.
- Deterministic conflict detection cannot be overridden by the LLM.
- Provider failures return HTTP 503 with a safe message, never hallucinated data.
- Financial data (expenses) is accessible only to admin role.

**Response contract:**
- `VERIFIED` — directly supported by retrieved institutional data
- `DERIVED` — calculated or logically derived from retrieved data
- `RECOMMENDATION` — AI-generated suggestion, clearly labelled
- `INSUFFICIENT_EVIDENCE` — data is not sufficient to answer

### Database Layer
- **MongoDB**: Primary operational datastore.
- **BaseRepository**: Abstract generic repository pattern over PyMongo.
- **Collections**: `users`, `clubs`, `events`, `venues`, `resources`, `registrations`, `attendance`, `feedback`, `expenses`.
- **Indexes**: Strategic compound and unique indexes for fast lookups and constraint enforcement.

### Security Boundaries
- **Route Level**: `RoleChecker` ensures only authorized roles hit the endpoint.
- **Service Level**: Business rules and object-level permissions (e.g., fetching from DB and verifying `created_by` matches current user if the user is an organizer).
- **AI Level**: `AIRetrievalService` enforces role-scoped evidence before any data reaches the LLM.
- **Frontend**: Navigation guards. Do NOT trust frontend for security.

### Testing
- Pytest with `pytest-asyncio`
- Comprehensive test suites validating RBAC, object ownership, validation, and business rules per domain.
- AI tests mock the LLM provider — no real API key required.
