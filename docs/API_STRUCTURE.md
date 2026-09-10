# API Structure Plan

*Note: This outlines the planned structure. Currently, only the health endpoint is implemented.*

## Base URL
`/api/v1`

## Health
- `GET /health` - Returns service and DB connection statuses.

## Authentication (Planned)
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/refresh`

## Institutions (Planned)
- `GET /institutions`
- `GET /institutions/{id}`
- `PUT /institutions/{id}`

## Events & Activities (Planned)
- `GET /events`
- `POST /events`
- `GET /events/{id}`
- `PUT /events/{id}`
- `DELETE /events/{id}`
- `POST /events/detect-conflict` - Validates time/venue conflicts before event creation.

## Venues & Resources (Planned)
- `GET /venues`
- `GET /venues/{id}/availability`

## AI Operations (Planned)
- `POST /ai/query` - Interface for natural language queries (RAG).
- `POST /ai/recommendations` - Request AI-backed recommendations based on historical data.

## Document Ingestion (Planned)
- `POST /documents/upload` - Processes PDFs via PyMuPDF and updates ChromaDB.
