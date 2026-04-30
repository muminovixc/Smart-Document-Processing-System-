from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.documents import DocumentService
from app.schemas.documents import DocumentResponse
from fastapi import BackgroundTasks
from app.services.extraction_service import ExtractionService
from app.services.validation_service import ValidationService
from app.models.documents import Document, DocumentStatus
from app.schemas.documents import DocumentOut 

router = APIRouter(prefix="/documents", tags=["documents"])

#route to get all documents ordered by newest first
@router.get("/", response_model=list[DocumentOut], tags=["documents"])
def get_all_documents(db: Session = Depends(get_db)):
    return (
        db.query(Document)
        .order_by(Document.created_at.desc())
        .all()
    )
 

 

#########################################################


# Background function: extraction + validation
def process_workflow(doc_id: int, db: Session):
    db_doc = db.query(Document).filter(Document.id == doc_id).first()
    if not db_doc: return

    # Korak 1: Ekstrakcija podataka
    ExtractionService.extract_data(db_doc.file_path, db_doc, db)
    
    # Korak 2: Validacija podataka
    ValidationService.validate_document(db_doc, db)

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    background_tasks: BackgroundTasks, # FastAPI alat za pozadinske zadatke
    file: UploadFile = File(...), 
    db: Session = Depends(get_db)
):
    file_path = DocumentService.save_upload_file(file)
    db_doc = DocumentService.create_document(db, file.filename, file_path)
    
    # Pokreni workflow u pozadini
    background_tasks.add_task(process_workflow, db_doc.id, db)
    
    return db_doc