# Development Rules

## Core Principles
1. **Security First**: The backend authorization is the absolute security boundary. Object-level authorization is mandatory for all mutable resources. Never trust frontend permissions.
2. **Schema Separation**: Do not return raw MongoDB dictionaries. Always use Pydantic Response schemas to filter sensitive fields (like password_hash) and standardize formats.
3. **Dependency Injection**: Use FastAPI Depends() for services and current user.
4. **Repository Pattern**: Business logic stays in `app/services/`. Database access stays in `app/repositories/`. No DB driver specific code in routes.
5. **Types**: Use strict type hints. Fix all Pyright/Pylance errors cleanly; do not use blanket # type: ignore.

## Constraints & Rules (Step 6)
- **Students**: Cannot create/modify clubs, events, venues, resources, or expenses. Can only access their own registrations and attendance. AI queries are scoped to public events and their own registrations.
- **Organizers**: Can create events/clubs. Can only modify their own events/clubs. Can access registrations, attendance, feedback, and expenses ONLY for their own events. AI queries include venue and resource context.
- **Admins**: Have global access. AI queries include financial summaries and institution-wide analytics.
- **Registration**: Enforce idempotency (no duplicate registrations).
- **Feedback**: Limit to one feedback per user per event.

## AI Operations Agent Rules (Step 6)
1. **Role from JWT only**: The AI endpoint (`POST /ai/query`) MUST NOT accept a role field from the request body. The user's role is always sourced from the authenticated JWT via `get_current_active_user`.
2. **Evidence scoping**: `AIRetrievalService.get_evidence()` must use the `current_user.role` from the `UserInDB` object — never from client-supplied data.
3. **No hallucination**: The LLM must not receive more data than what `AIRetrievalService` returns. If evidence is insufficient, the response must include an `INSUFFICIENT_EVIDENCE` claim.
4. **Financial data**: Expense data is accessible only to `admin` role. Never include expense details in student or organizer evidence.
5. **Deterministic first**: For scheduling/conflict questions, always run the deterministic `EventConflictService` or reference existing conflict data. The LLM may explain conflicts but never replace deterministic detection.
6. **Provider abstraction**: Never hard-code API keys. Never import a specific LLM SDK directly in routes or services — use the `AIProvider` abstraction and `get_ai_provider()` factory.
7. **Provider failure safety**: If the LLM provider raises an error, return a structured `AIQueryResponse` with `INSUFFICIENT_EVIDENCE` claim and an informative message. Never propagate internal errors to the client.
8. **Test isolation**: AI tests must mock the LLM provider (`get_ai_provider`). Tests must not require a real API key to pass.
9. **Secrets**: GEMINI_API_KEY and AI_PROVIDER values come from environment variables only. Never hard-code in source files.
10. **Response contract**: Every AI response must use the typed claim system: `VERIFIED | DERIVED | RECOMMENDATION | INSUFFICIENT_EVIDENCE`. Do not return unstructured text as facts.

## Code Quality
- No unused imports.
- Format with PEP8 guidelines.
- Maintain at least 0 Pyright errors and full test coverage for core flows.
- Use `import type` for type-only imports in TypeScript when `verbatimModuleSyntax` is enabled.
