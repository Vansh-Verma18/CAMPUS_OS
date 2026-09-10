# Development Rules

Strict adherence to these rules is mandatory.

## General
- Prefer simple, maintainable architecture over excessive abstraction.
- Do not create unnecessary features or random demo data.
- Add tests when new functionality is introduced.
- Do not modify unrelated parts of the project when implementing a feature.

## Frontend
- Keep frontend and backend strictly separated.
- Keep business logic out of UI components.
- Do not scatter fetch calls; use the centralized API services layer.
- Never hard-code production credentials or API keys.

## Backend
- Keep database access behind repository/service boundaries.
- Keep AI logic behind AI service boundaries.
- Keep RAG logic separate from general API CRUD routes.
- Validate all external inputs using Pydantic.
- Return clear, structured API errors.

## AI & Data Security
- Never expose unauthorized institutional data to AI models. Role-based access control (RBAC) must dictate context generation.
- Never present demo/fake data as real institutional data.
- AI must only generate evidence-backed recommendations based on actual stored institutional data.
