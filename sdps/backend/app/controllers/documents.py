from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pathlib import Path
from app.db.database import get_db
from app.services.documents import DocumentService
from app.schemas.documents import DocumentResponse
from fastapi import BackgroundTasks
from app.services.extraction_service import ExtractionService
from app.services.validation_service import ValidationService
from app.models.documents import Document, DocumentStatus
from app.schemas.documents import DocumentOut

"""
Document Management API Router

This router provides endpoints for uploading, retrieving, and managing documents
with automatic data extraction and validation using AI-powered processing.

Endpoints:
- GET /documents/ : Retrieve all documents
- POST /documents/upload : Upload new document for processing
- GET /documents/list : List all documents (alias for /)
- GET /documents/{id} : Get specific document by ID
"""

router = APIRouter(
    prefix="/documents",
    tags=["documents"]
)


@router.get(
    "/",
    response_model=list[DocumentOut]
)
def get_all_documents(db: Session = Depends(get_db)):
    """
    Retrieve all documents ordered by creation date (newest first).
    
    This endpoint returns a complete list of all documents in the system,
    sorted by their creation timestamp in descending order. Each document
    includes all extracted data, validation status, and associated line items.
    
    Returns:
        list[DocumentOut]: List of all documents with full details
    """
    return (
        db.query(Document)
        .order_by(Document.created_at.desc())
        .all()
    )


def process_workflow(doc_id: int, db: Session):
    """
    Background task to process a document: extract data and validate it.
    """
    db_doc = db.query(Document).filter(Document.id == doc_id).first()
    if not db_doc:
        return

    ExtractionService.extract_data(db_doc.file_path, db_doc, db)
    ValidationService.validate_document(db_doc, db)


@router.post(
    "/upload",
    response_model=DocumentResponse
)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload a document file for processing.
    
    This endpoint accepts document files (PDF, images, CSV, TXT) and initiates
    automatic processing including data extraction using AI and validation.
    The processing happens asynchronously in the background.
    
    Supported file types:
    - PDF documents
    - Images (PNG, JPG, JPEG)
    - CSV files
    - Plain text files
    
    Parameters:
        background_tasks: FastAPI background tasks handler
        file: The uploaded file (UploadFile)
        db: Database session
    
    Returns:
        DocumentResponse: Initial document record (processing continues in background)
    
    Background Processing:
    - Data extraction using Gemini AI
    - Automatic validation of extracted data
    - Status updates to 'validated' or 'needs_review'
    """
    file_path = DocumentService.save_upload_file(file)
    db_doc = DocumentService.create_document(db, file.filename, file_path)

    background_tasks.add_task(process_workflow, db_doc.id, db)

    return db_doc


@router.get(
    "/{document_id}/file"
)
def get_document_file(document_id: int, db: Session = Depends(get_db)):
    doc = DocumentService.get_by_id(db, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    file_path = Path(doc.file_path)
    if not file_path.is_absolute():
        file_path = Path.cwd() / file_path

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(str(file_path), media_type="application/octet-stream")


@router.get(
    "/list",
    response_model=list[DocumentOut]
)
def list_documents(db: Session = Depends(get_db)):
    """
    Retrieve a list of all documents.
    
    This endpoint provides a complete list of all documents stored in the system.
    Each document includes metadata, extracted data, validation status, and
    associated line items. Documents are typically sorted by creation date.
    
    Returns:
        list[DocumentOut]: Complete list of all documents with full details
    """
    return DocumentService.get_all(db)


@router.get(
    "/{document_id}",
    response_model=DocumentOut
)
def get_document(document_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a specific document by its ID.
    
    This endpoint fetches detailed information about a single document,
    including all extracted data, validation results, and line items.
    Useful for displaying document details in the frontend.
    
    Parameters:
        document_id: Unique identifier of the document
        db: Database session
    
    Returns:
        DocumentOut: Complete document details including line items
    
    Raises:
        HTTPException: 404 if document with given ID is not found
    """
    doc = DocumentService.get_by_id(db, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc