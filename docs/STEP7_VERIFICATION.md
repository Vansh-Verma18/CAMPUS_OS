# Step 7 Verification — Institutional Memory (RAG)

## Overview
Step 7 introduced **Institutional Memory**, enabling authorized administrative documents (PDF, DOCX) to be ingested, vectorized, and selectively retrieved by the AI Operations Agent based on strict Role-Based Access Control (RBAC).

## Verification Checklist
- **Document Upload API**: `POST /api/v1/documents/upload` successfully accepts PDF and DOCX files. Files exceeding 10MB are rejected.
- **Text Extraction**: PyMuPDF handles PDFs, and `python-docx` handles Word documents.
- **Chunking**: Deterministic chunking strategy splits documents efficiently while retaining metadata (year, department, source) for trace-ability.
- **Vector Storage**: Employs the configured AI Provider to generate embeddings. Embeddings are stored in ChromaDB, mapped 1:1 to their parent documents in MongoDB.
- **Permission-Aware RAG**: 
  - Students only retrieve `PUBLIC` documents.
  - Faculty/Organizers retrieve `PUBLIC` + `DEPARTMENT`/`CLUB` documents.
  - Admins bypass filters and access all documents.
  - **Result**: The LLM *never* receives evidence it shouldn't.
- **Document Deletion**: `DELETE /api/v1/documents/{id}` cascadingly removes the physical file, ChromaDB chunks, and MongoDB document record.

## Architecture Highlights
- `app.services.documents.DocumentService`: Orchestrates validation, extraction, chunking, and database synchronization.
- `app.services.ai_retrieval.AIRetrievalService`: Now dynamically performs vector search across ChromaDB's `institutional_memory` collection *before* querying the LLM, securely filtering results using a metadata `where` clause corresponding to `current_user.role`.

## Testing
- **Test Suite**: `tests/test_documents.py` executes 7 distinct integration cases covering uploads, RBAC enumeration, deletion flows, and vector filtering. 
- **Results**: `35 passed, 5 warnings in 13.80s` (0 regressions).
- **Frontend Build**: `npm run build` succeeds perfectly with 0 TypeScript compilation errors.
