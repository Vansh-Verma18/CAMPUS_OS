"""
Step 7 — Document Ingestion + RAG / Institutional Memory Test Suite
"""
import pytest
import pytest_asyncio
from typing import Any
from unittest.mock import AsyncMock, patch, MagicMock
from httpx import AsyncClient, ASGITransport
import io
import os

from app.main import app
from app.db.mongodb import connect_to_mongo, close_mongo_connection, get_database
from app.db.indexes import setup_indexes
from app.security.password import get_password_hash
from app.repositories.base import BaseRepository
from app.schemas.users import UserInDB, UserCreate
from app.security.jwt import create_access_token
from app.services.documents import DocumentService, UPLOAD_DIR
from app.schemas.documents import DocumentInDB, DocumentCreate, DocumentAccessClassification

@pytest_asyncio.fixture(scope="function")
async def setup_db():
    """Set up test users and clean up afterwards."""
    await connect_to_mongo()
    db_conn = get_database()
    if db_conn is None:
        pytest.skip("MongoDB is not available.")
    await setup_indexes()

    user_repo = BaseRepository[UserInDB, UserCreate](db_conn["users"], UserInDB)
    doc_repo = BaseRepository[DocumentInDB, DocumentCreate](db_conn["documents"], DocumentInDB)
    hashed = get_password_hash("password")

    admin = await user_repo.create(
        UserCreate(email="admin_docs@campus.edu", username="admin_docs", role="admin",
                   display_name="Admin Docs", password="password"),
        password_hash=hashed
    )
    faculty = await user_repo.create(
        UserCreate(email="faculty_docs@campus.edu", username="faculty_docs", role="faculty",
                   display_name="Faculty Docs", password="password"),
        password_hash=hashed
    )
    organizer = await user_repo.create(
        UserCreate(email="org_docs@campus.edu", username="org_docs", role="organizer",
                   display_name="Organizer Docs", password="password"),
        password_hash=hashed
    )
    student = await user_repo.create(
        UserCreate(email="student_docs@campus.edu", username="student_docs", role="student",
                   display_name="Student Docs", password="password"),
        password_hash=hashed
    )

    yield {
        "db": db_conn,
        "admin": admin,
        "faculty": faculty,
        "organizer": organizer,
        "student": student,
        "admin_token": create_access_token(str(admin.id), "admin"),
        "faculty_token": create_access_token(str(faculty.id), "faculty"),
        "organizer_token": create_access_token(str(organizer.id), "organizer"),
        "student_token": create_access_token(str(student.id), "student"),
        "doc_repo": doc_repo,
    }

    # Teardown
    await db_conn["users"].delete_many({"email": {"$regex": "_docs@campus.edu"}})
    await db_conn["documents"].delete_many({})
    await close_mongo_connection()

@pytest.fixture
def mock_pdf_bytes():
    # Return minimal dummy bytes that will be patched out in extraction anyway
    return b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\ntrailer\n<<\n/Root 1 0 R\n>>\n%%EOF"

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_upload_document_success(setup_db: Any, mock_pdf_bytes: bytes):
    ctx = setup_db
    
    from app.services.ai_provider import get_ai_provider
    mock_provider = AsyncMock()
    mock_provider.embed_content = AsyncMock(return_value=[[0.1, 0.2, 0.3]])
    app.dependency_overrides[get_ai_provider] = lambda: mock_provider
    
    with patch("app.services.documents.extract_text_from_pdf") as mock_extract, \
         patch("app.services.documents.get_memory_collection") as mock_get_collection:
        
        mock_extract.return_value = "This is a valid test document."
        
        mock_collection = MagicMock()
        mock_get_collection.return_value = mock_collection

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            files = {'file': ('test.pdf', mock_pdf_bytes, 'application/pdf')}
            data = {
                "document_name": "Test PDF",
                "document_type": "pdf",
                "department": "CS",
                "year": "2024",
                "access_classification": "PUBLIC"
            }
            resp = await client.post(
                "/api/v1/documents/upload",
                files=files,
                data=data,
                headers={"Authorization": f"Bearer {ctx['admin_token']}"}
            )

    app.dependency_overrides.clear()

    assert resp.status_code == 201, resp.text
    resp_data = resp.json()
    assert resp_data["document_name"] == "Test PDF"
    assert resp_data["processing_status"] == "vectorized"
    assert resp_data["chunk_count"] > 0
    assert mock_collection.add.called
    
    # Check physical file exists
    docs = await ctx["doc_repo"].get_all()
    assert len(docs) == 1
    doc_path = docs[0].file_path
    assert os.path.exists(doc_path)
    os.remove(doc_path) # cleanup


@pytest.mark.asyncio
async def test_unauthorized_roles_cannot_upload(setup_db: Any, mock_pdf_bytes: bytes):
    ctx = setup_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        files = {'file': ('test.pdf', mock_pdf_bytes, 'application/pdf')}
        data = {
            "document_name": "Test PDF",
            "document_type": "pdf",
            "access_classification": "PUBLIC"
        }
        # Student cannot upload
        resp = await client.post(
            "/api/v1/documents/upload",
            files=files,
            data=data,
            headers={"Authorization": f"Bearer {ctx['student_token']}"}
        )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_upload_invalid_file_extension(setup_db: Any):
    ctx = setup_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        files = {'file': ('test.txt', b"Hello World", 'text/plain')}
        data = {
            "document_name": "Test TXT",
            "document_type": "txt",
            "access_classification": "PUBLIC"
        }
        resp = await client.post(
            "/api/v1/documents/upload",
            files=files,
            data=data,
            headers={"Authorization": f"Bearer {ctx['admin_token']}"}
        )
    assert resp.status_code == 400
    assert "Only PDF and DOCX files are supported" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_empty_document_upload(setup_db: Any):
    ctx = setup_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        files = {'file': ('empty.pdf', b"", 'application/pdf')}
        data = {
            "document_name": "Empty PDF",
            "document_type": "pdf",
            "access_classification": "PUBLIC"
        }
        resp = await client.post(
            "/api/v1/documents/upload",
            files=files,
            data=data,
            headers={"Authorization": f"Bearer {ctx['admin_token']}"}
        )
    assert resp.status_code == 400
    assert "File is empty" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_list_documents_rbac(setup_db: Any, mock_pdf_bytes: bytes):
    ctx = setup_db
    doc_repo = ctx["doc_repo"]
    
    # Create 3 documents with different access levels directly via repo
    await doc_repo.create(DocumentInDB(
        document_name="Public Doc", document_type="pdf", access_classification=DocumentAccessClassification.PUBLIC,
        file_path="mock/path", file_size_bytes=100, chunk_count=1, uploaded_by=ctx["admin"].id, processing_status="vectorized",
    ))
    await doc_repo.create(DocumentInDB(
        document_name="Club Doc", document_type="pdf", access_classification=DocumentAccessClassification.CLUB,
        file_path="mock/path", file_size_bytes=100, chunk_count=1, uploaded_by=ctx["admin"].id, processing_status="vectorized",
    ))
    await doc_repo.create(DocumentInDB(
        document_name="Dept Doc", document_type="pdf", access_classification=DocumentAccessClassification.DEPARTMENT,
        file_path="mock/path", file_size_bytes=100, chunk_count=1, uploaded_by=ctx["admin"].id, processing_status="vectorized",
    ))
    admin_doc = await doc_repo.create(DocumentInDB(
        document_name="Admin Doc", document_type="pdf", access_classification=DocumentAccessClassification.ADMIN,
        file_path="mock/path", file_size_bytes=100, chunk_count=1, uploaded_by=ctx["admin"].id, processing_status="vectorized",
    ))

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Admin gets all 4
        resp = await client.get("/api/v1/documents", headers={"Authorization": f"Bearer {ctx['admin_token']}"})
        assert len(resp.json()) == 4
        
        # Student gets only PUBLIC (1)
        resp = await client.get("/api/v1/documents", headers={"Authorization": f"Bearer {ctx['student_token']}"})
        assert len(resp.json()) == 1
        assert resp.json()[0]["access_classification"] == "PUBLIC"
        
        # Faculty gets PUBLIC + DEPARTMENT (2)
        resp = await client.get("/api/v1/documents", headers={"Authorization": f"Bearer {ctx['faculty_token']}"})
        assert len(resp.json()) == 2
        
        # Organizer gets PUBLIC + CLUB (2)
        resp = await client.get("/api/v1/documents", headers={"Authorization": f"Bearer {ctx['organizer_token']}"})
        assert len(resp.json()) == 2
        
        # Unauthorized access to specific document returns 403
        resp = await client.get(f"/api/v1/documents/{admin_doc.id}", headers={"Authorization": f"Bearer {ctx['student_token']}"})
        assert resp.status_code == 403

@pytest.mark.asyncio
async def test_document_deletion(setup_db: Any):
    ctx = setup_db
    doc_repo = ctx["doc_repo"]
    
    # Create fake file on disk
    file_path = os.path.join(UPLOAD_DIR, "fake_test_doc_delete.pdf")
    with open(file_path, "wb") as f:
        f.write(b"test")
        
    doc = await doc_repo.create(DocumentInDB(
        document_name="To Delete", document_type="pdf", access_classification=DocumentAccessClassification.PUBLIC,
        file_path=file_path, file_size_bytes=4, chunk_count=1, uploaded_by=ctx["faculty"].id, processing_status="vectorized",
    ))
    
    with patch("app.services.documents.get_memory_collection") as mock_get_collection:
        mock_collection = MagicMock()
        mock_get_collection.return_value = mock_collection
        
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            # Student cannot delete
            resp = await client.delete(f"/api/v1/documents/{doc.id}", headers={"Authorization": f"Bearer {ctx['student_token']}"})
            assert resp.status_code == 403
            
            # Faculty (uploader) can delete
            resp = await client.delete(f"/api/v1/documents/{doc.id}", headers={"Authorization": f"Bearer {ctx['faculty_token']}"})
            assert resp.status_code == 204
            
            # Verify deletion
            assert mock_collection.delete.called
            assert not os.path.exists(file_path)
            deleted_doc = await doc_repo.get_by_id(doc.id)
            assert deleted_doc is None

@pytest.mark.asyncio
async def test_rag_retrieval_respects_rbac(setup_db: Any):
    """
    Test that AIRetrievalService queries ChromaDB and correctly scopes
    the results based on the user's role.
    """
    from app.services.ai_retrieval import AIRetrievalService
    
    ctx = setup_db
    retrieval = AIRetrievalService(
        event_repo=AsyncMock(), club_repo=AsyncMock(), venue_repo=AsyncMock(),
        resource_repo=AsyncMock(), registration_repo=AsyncMock(), expense_repo=AsyncMock(),
        attendance_repo=AsyncMock(), feedback_repo=AsyncMock(),
        ai_provider=AsyncMock()
    )
    
    with patch("app.db.chroma.get_memory_collection") as mock_get_collection:
        mock_collection = MagicMock()
        
        # When querying, the where filter should vary by role
        mock_collection.query.return_value = {
            "documents": [["Test Doc content"]],
            "metadatas": [[{"document_name": "Test Doc", "year": 2024, "department": "IT"}]]
        }
        mock_get_collection.return_value = mock_collection
        
        retrieval.ai_provider.embed_content.return_value = [[0.1, 0.2]]
        
        # 1. Student
        await retrieval.get_evidence(ctx["student"], question="What is in the doc?")
        # Should filter by PUBLIC
        _, kwargs = mock_collection.query.call_args
        assert kwargs["where"] == {"access_classification": "PUBLIC"}
        
        # 2. Organizer
        await retrieval.get_evidence(ctx["organizer"], question="What is in the doc?")
        _, kwargs = mock_collection.query.call_args
        assert kwargs["where"] == {"access_classification": {"$in": ["PUBLIC", "CLUB"]}}
        
        # 3. Admin
        await retrieval.get_evidence(ctx["admin"], question="What is in the doc?")
        _, kwargs = mock_collection.query.call_args
        assert kwargs["where"] is None  # Admin gets everything
