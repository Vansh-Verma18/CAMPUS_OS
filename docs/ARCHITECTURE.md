# Architecture Overview

## Frontend
The frontend is a single-page application (SPA) built with React and TypeScript, managed by Vite.
- **Routing**: `react-router-dom` handles client-side routing.
- **Styling**: Tailwind CSS is strictly used for styling with no inline styles.
- **Service Boundaries**: All API communication occurs within `src/services/`. Components should not have direct fetch logic.

## Backend
The backend is powered by FastAPI for its high performance and async capabilities.
- **Routing**: API endpoints are versioned (e.g., `/api/v1/...`).
- **Data Flow**: `API Route` -> `Service` -> `Repository` -> `MongoDB`.
  - **API Route**: Receives requests, calls services, returns Pydantic Response schemas.
  - **Service**: Handles business logic (e.g., event conflict detection, permission checks).
  - **Repository**: Handles direct database operations using the `BaseRepository` abstraction.
- **Validation**: Pydantic models in `app/schemas` enforce schema structure, valid types, and business rules (e.g., valid date ranges, non-negative amounts) before reaching the repository layer.

## Database (MongoDB)
MongoDB is the authoritative source for structured institutional records.
- **Connection**: Managed async using Motor.
- **Security**: Database should not be exposed externally. Access is limited through the backend API.
- **Design Philosophy**: We use referencing over embedding for major relationships to maintain scalable document sizes and ease of updates.

## Vector Database (ChromaDB)
ChromaDB handles vector embeddings for institutional documents.
- **Connection**: Managed via HTTP client.
- **Isolation**: RAG processes and vector searches will be separated from general CRUD API routes.

## Future Integrations
- **Gemini API**: Will power the AI Operations agent for analyzing institutional knowledge and conflict detection. Data passed to the LLM must be tightly controlled by Role-Based Access Control (RBAC).
- **RAG Flow**: Documents are ingested, processed via PyMuPDF, embedded, and stored in ChromaDB. When users query, the context will be retrieved from ChromaDB before sending it to Gemini.
