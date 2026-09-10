# CampusOS

CampusOS is an AI-powered institutional intelligence platform for colleges and universities. It connects campus activities, events, clubs, departments, students, faculty, venues, resources, registrations, attendance, expenses, feedback, and institutional documents.

**Note:** This repository currently contains only the core technical foundation. Full features (AI Operations Agent, complete UI, event conflict detection, RAG over documents) are not yet implemented.

## Technology Stack
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, React Router, Lucide React
- **Backend**: Python, FastAPI, Pydantic, Uvicorn
- **Database**: MongoDB (structured institutional data)
- **Vector Database**: ChromaDB (document/vector storage for RAG)

## Project Structure
- `frontend/`: The React web application.
- `backend/`: The FastAPI Python application.
- `docs/`: Architecture and development documentation.
- `docker-compose.yml`: Local setup for MongoDB and ChromaDB.

## Prerequisites
- Node.js (18+)
- Python 3.10+
- Docker and Docker Compose

## Environment Variables
Before running, you must set up the `.env` files:

**Backend:**
Copy `backend/.env.example` to `backend/.env` and update values if necessary.
```sh
cd backend
cp .env.example .env
```

**Frontend:**
Copy `frontend/.env.example` to `frontend/.env.local`.
```sh
cd frontend
cp .env.example .env.local
```

## How to Start Local Infrastructure
Start MongoDB and ChromaDB using Docker Compose from the root directory:
```sh
docker-compose up -d
```
*(Volumes are persistent in Docker)*

## How to Start the Backend
```sh
cd backend
python -m venv venv
# On Windows: venv\Scripts\activate
# On Unix/macOS: source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
The API will be available at `http://localhost:8000`.

## How to Start the Frontend
```sh
cd frontend
npm install
npm run dev
```
The frontend will be available at `http://localhost:5173`.

## Verify Health
Open the frontend URL in your browser. It will automatically ping the backend health endpoint `http://localhost:8000/api/v1/health` and display the status of the API, MongoDB, and ChromaDB.

## Current Implementation Status
- Clean technical monorepo structure is established.
- FastAPI backend connects to MongoDB and ChromaDB.
- Health endpoints are active.
- Frontend React application connects to backend API abstraction.
- Tailwind CSS styling is configured.

## What is NOT Implemented Yet
- The AI Operations Agent and Gemini API integration.
- RAG over institutional documents.
- User interface features, dashboards, and authentication.
- Full business logic, entities, and event conflict detection.
