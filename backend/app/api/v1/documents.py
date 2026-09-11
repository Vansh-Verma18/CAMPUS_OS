from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status

from app.api.deps import get_current_active_user, get_document_service, RoleChecker
from app.schemas.users import UserInDB
from app.schemas.documents import DocumentResponse, DocumentCreate, DocumentAccessClassification
from app.services.documents import DocumentService

router = APIRouter()

# Only specific roles can upload documents
upload_role_checker = RoleChecker(["admin", "faculty", "organizer"])

@router.post(
    "/upload", 
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload an institutional document"
)
async def upload_document(
    file: UploadFile = File(...),
    document_name: str = Form(...),
    document_type: str = Form(...),
    department: str = Form(None),
    year: int = Form(None),
    access_classification: DocumentAccessClassification = Form(DocumentAccessClassification.PUBLIC),
    current_user: UserInDB = Depends(upload_role_checker),
    document_service: DocumentService = Depends(get_document_service)
):
    metadata = DocumentCreate(
        document_name=document_name,
        document_type=document_type,
        department=department,
        year=year,
        access_classification=access_classification
    )
    
    doc = await document_service.process_and_store_document(file, metadata, current_user)
    return doc

@router.get(
    "", 
    response_model=List[DocumentResponse],
    summary="List institutional documents"
)
async def get_documents(
    skip: int = 0,
    limit: int = 100,
    current_user: UserInDB = Depends(get_current_active_user),
    document_service: DocumentService = Depends(get_document_service)
):
    # Depending on role, limit which documents they can see in the list
    role = current_user.role
    if role == "student":
        query = {"access_classification": "PUBLIC"}
    elif role == "faculty":
        query = {"access_classification": {"$in": ["PUBLIC", "DEPARTMENT"]}}
    elif role == "organizer":
        query = {"access_classification": {"$in": ["PUBLIC", "CLUB"]}}
    else:
        query = {}
        
    return await document_service.get_all(query=query, skip=skip, limit=limit)

@router.get(
    "/{document_id}", 
    response_model=DocumentResponse,
    summary="Get document details"
)
async def get_document(
    document_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    document_service: DocumentService = Depends(get_document_service)
):
    doc = await document_service.get_by_id(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Check permissions
    role = current_user.role
    allowed = False
    if role == "admin":
        allowed = True
    elif role == "faculty" and doc.access_classification in [DocumentAccessClassification.PUBLIC, DocumentAccessClassification.DEPARTMENT]:
        allowed = True
    elif role == "organizer" and doc.access_classification in [DocumentAccessClassification.PUBLIC, DocumentAccessClassification.CLUB]:
        allowed = True
    elif role == "student" and doc.access_classification == DocumentAccessClassification.PUBLIC:
        allowed = True
        
    if not allowed:
        raise HTTPException(status_code=403, detail="Not authorized to view this document")
        
    return doc

@router.delete(
    "/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a document"
)
async def delete_document(
    document_id: str,
    current_user: UserInDB = Depends(upload_role_checker),
    document_service: DocumentService = Depends(get_document_service)
):
    # Only uploader or admin can delete
    doc = await document_service.get_by_id(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if current_user.role != "admin" and str(doc.uploaded_by) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Only the uploader or an admin can delete this document")
        
    await document_service.delete_document(document_id)
