# Implementation Plan: AI Response Streaming

## Goal Description
Implement Server-Sent Events (SSE) streaming for the CampusOS AI Agent so that responses type out character by character in real-time, significantly improving perceived performance and user experience. The system currently waits for the entire LLM generation to finish before sending a structured JSON response.

## User Review Required
> [!IMPORTANT]
> The AI currently returns a heavily structured output (Answer, Claims, Recommendations, Sources). Since streaming delivers raw text chunks, the backend will need to parse the stream *in-flight*, sending the answer chunks to the frontend in real-time, and buffering the rest of the metadata (Claims/Sources) to send at the very end of the stream.

## Proposed Changes

---

### Backend Components

#### [MODIFY] `backend/app/services/ai_provider.py`
- Add an asynchronous generator `query_stream(prompt, system_prompt)` that calls `self.model.generate_content(..., stream=True)` and yields text chunks.

#### [MODIFY] `backend/app/services/ai_agent.py`
- Add `process_query_stream(request, current_user)`:
  - Retrieve evidence using the existing `AIRetrievalService`.
  - Pass the prompt to `ai_provider.query_stream`.
  - Intercept the chunks in real-time. Yield `{"type": "chunk", "content": "..."}` while parsing the "ANSWER:" section.
  - Once it detects "CLAIMS:" or other structured metadata, buffer the remaining chunks.
  - At the end of the stream, parse the buffered metadata and yield `{"type": "complete", "data": {claims, recommendations, sources}}`.

#### [MODIFY] `backend/app/api/v1/ai.py`
- Expose a new route `POST /api/v1/ai/query/stream` that uses FastAPI's `StreamingResponse` (with `media_type="text/event-stream"`) returning the generator from `process_query_stream`.

---

### Frontend Components

#### [MODIFY] `frontend/src/api/ai.ts`
- Implement `queryAIStream(request, onChunk, onComplete)` using native `fetch()` and `response.body.getReader()`.
- Decode the `TextDecoderStream` into JSON lines (SSE format).

#### [MODIFY] `frontend/src/pages/AIAgent.tsx`
- Refactor `handleSubmit` to call `queryAIStream`.
- Update the `conversationHistory` and current answer dynamically as chunks arrive.
- Only show claims, sources, and recommendations once the `onComplete` callback fires.

## Verification Plan

### Automated Tests
- Run `pytest` to ensure existing `query_ai` endpoints are unaffected (streaming will be an opt-in endpoint or replace it entirely).

### Manual Verification
- Log in to the frontend, open the AI Agent, ask a complex question (e.g., "Summarize all events"), and verify that the text streams gracefully without breaking the markdown parser or the layout.
- Verify that once the stream finishes, the claims and sources appear correctly.
