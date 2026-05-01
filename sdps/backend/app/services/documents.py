import os
import shutil
from sqlalchemy.orm import Session
from app.models.documents import Document
from fastapi import UploadFile
import json
from google import genai
from app.models.documents import Document, LineItem, DocumentStatus, DocumentType

UPLOAD_DIR = "static/uploads"

class DocumentService:
    @staticmethod
    def save_upload_file(upload_file: UploadFile) -> str:
        if not os.path.exists(UPLOAD_DIR):
            os.makedirs(UPLOAD_DIR)
        
        file_path = os.path.join(UPLOAD_DIR, upload_file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
        return file_path

    @staticmethod
    def create_document(db: Session, filename: str, file_path: str):
        ext = filename.split('.')[-1].lower()
        new_doc = Document(
            original_filename=filename,
            file_path=file_path,
            file_type=ext,
            status="uploaded"
        )
        db.add(new_doc)
        db.commit()
        db.refresh(new_doc)
        return new_doc
    
    @staticmethod
    def get_all(db: Session) -> list[Document]:
        return (
                db.query(Document)
                .order_by(Document.created_at.desc())
                .all()
            )
    
    @staticmethod
    def get_by_id(db: Session, document_id: int) -> Document | None:
        return db.query(Document).filter(Document.id == document_id).first()
