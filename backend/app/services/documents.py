import os
import uuid
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

from fastapi import UploadFile, HTTPException, status
from app.schemas.documents import DocumentCreate, DocumentInDB, DocumentAccessClassification
from app.schemas.users import UserInDB
from app.repositories.base import BaseRepository
from app.services.base import BaseService
from app.services.document_parser import extract_text_from_pdf, extract_text_from_docx, DocumentParserError
from app.services.document_chunker import chunk_text
from app.services.ai_provider import AIProvider, AIProviderError
from app.db.chroma import get_memory_collection

logger = logging.getLogger(__name__)

UPLOAD_DIR = "uploads/documents"
os.makedirs(UPLOAD_DIR, exist_ok=True)
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

class DocumentService(BaseService[DocumentInDB, DocumentCreate]):
    def __init__(self, repo: BaseRepository[DocumentInDB, DocumentCreate], ai_provider: AIProvider):
        super().__init__(repo)
        self.ai_provider = ai_provider

    async def process_and_store_document(
        self, 
        file: UploadFile, 
        metadata: DocumentCreate, 
        current_user: UserInDB
    ) -> DocumentInDB:
        # 1. Validation
        if not file.filename:
            raise HTTPException(status_code=400, detail="Filename missing")
            
        file_ext = file.filename.split(".")[-1].lower()
        if file_ext not in ["pdf", "docx"]:
            raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported")
            
        file_bytes = await file.read()
        file_size = len(file_bytes)
        
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail=f"File exceeds maximum size of 10MB")
            
        if file_size == 0:
            raise HTTPException(status_code=400, detail="File is empty")
            
        # 2. Extract Text
        try:
            if file_ext == "pdf":
                text = extract_text_from_pdf(file_bytes)
            else:
                text = extract_text_from_docx(file_bytes)
        except DocumentParserError as e:
            raise HTTPException(status_code=400, detail=f"Failed to extract text: {e}")
            
        if not text.strip():
            raise HTTPException(status_code=400, detail="No readable text found in document")
            
        # 3. Save to disk
        file_id = str(uuid.uuid4())
        safe_filename = f"{file_id}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, safe_filename)
        
        with open(file_path, "wb") as f:
            f.write(file_bytes)
            
        # 4. Create Document DB record
        doc_in_db = DocumentInDB(
            **metadata.model_dump(),
            file_path=file_path,
            file_size_bytes=file_size,
            uploaded_by=current_user.id,
            upload_timestamp=datetime.now(timezone.utc),
            processing_status="processing"
        )
        
        # Save to Mongo first to get the ID
        created_doc = await self.repository.create(doc_in_db)
        
        # 5. Chunking
        chunk_metadata = {
            "document_id": str(created_doc.id),
            "document_name": created_doc.document_name,
            "access_classification": created_doc.access_classification.value,
            "year": created_doc.year or 0,
            "department": created_doc.department or "unknown",
            "source": created_doc.source
        }
        
        chunks = chunk_text(text, chunk_metadata)
        
        # 6. Embeddings and ChromaDB insertion
        try:
            # We process embeddings in batches if necessary, but 10MB text usually chunked is manageable
            texts = [c.text for c in chunks]
            embeddings = await self.ai_provider.embed_content(texts)
            
            collection = get_memory_collection()
            if not collection:
                raise Exception("ChromaDB memory collection unavailable")
                
            ids = [f"{created_doc.id}_chunk_{i}" for i in range(len(chunks))]
            metadatas = [c.metadata for c in chunks]
            
            collection.add(
                ids=ids,
                embeddings=embeddings,
                metadatas=metadatas,
                documents=texts
            )
            
            # Update Mongo status
            created_doc.processing_status = "vectorized"
            created_doc.chunk_count = len(chunks)
            await self.repository.update(created_doc.id, created_doc.model_dump(by_alias=True, exclude={"id"}))
            
        except Exception as e:
            logger.error(f"Failed to vectorize document {created_doc.id}: {e}")
            created_doc.processing_status = "failed"
            await self.repository.update(created_doc.id, created_doc.model_dump(by_alias=True, exclude={"id"}))
            raise HTTPException(status_code=500, detail=f"Failed to process document embeddings: {e}")
            
        return created_doc

    async def delete_document(self, document_id: Any) -> None:
        # Get the document
        doc = await self.repository.get_by_id(document_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
            
        # Delete from disk
        try:
            if os.path.exists(doc.file_path):
                os.remove(doc.file_path)
        except Exception as e:
            logger.error(f"Failed to delete file {doc.file_path}: {e}")
            
        # Delete from ChromaDB
        try:
            collection = get_memory_collection()
            if collection:
                collection.delete(where={"document_id": str(document_id)})
        except Exception as e:
            logger.error(f"Failed to delete vectors for {document_id}: {e}")
            
        # Delete from Mongo
        await self.repository.delete(document_id)
