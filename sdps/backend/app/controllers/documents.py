from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.documents import DocumentService
from app.schemas.documents import DocumentResponse

router = APIRouter(prefix="/api/documents", tags=["documents"])

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db)
):
    try:
        file_path = DocumentService.save_upload_file(file)
        
        # 2. Kreiraj zapis u bazi
        db_doc = DocumentService.create_document(db, file.filename, file_path)
        
        return db_doc
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))