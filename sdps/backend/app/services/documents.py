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
    



# Konfiguracija API ključa (stavi svoj ključ ovdje ili u .env)
api_key = os.environ.get("GEMINI_KEY") 
client = genai.Client(api_key=api_key)

class ExtractionService:
    @staticmethod
    def extract_data(file_path: str, db_doc: Document, db: Session):
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Prompt koji striktno traži JSON format prema tvojoj bazi
        prompt = """
        Extract data from this document. Return ONLY a JSON object with these keys:
        doc_type (invoice or purchase_order), doc_number, supplier_name, 
        issue_date (YYYY-MM-DD), due_date (YYYY-MM-DD), currency, 
        subtotal (float), tax_amount (float), total_amount (float),
        line_items (list of objects with: description, quantity, unit_price, line_total).
        """

        # Učitavanje fajla (Gemini podržava PDF i slike direktno)
        sample_file = genai.upload_file(path=file_path)
        response = model.generate_content([prompt, sample_file])
        
        # Čišćenje i parsiranje JSON-a
        raw_json = response.text.replace("```json", "").replace("```", "").strip()
        data = json.loads(raw_json)
        
        # Čuvanje sirovog rezultata radi debugginga
        db_doc.raw_extracted_json = raw_json
        
        # Mapiranje headera na model
        db_doc.doc_type = DocumentType[data.get('doc_type', 'unknown')]
        db_doc.doc_number = data.get('doc_number')
        db_doc.supplier_name = data.get('supplier_name')
        db_doc.issue_date = data.get('issue_date')
        db_doc.due_date = data.get('due_date')
        db_doc.currency = data.get('currency')
        db_doc.subtotal = data.get('subtotal')
        db_doc.tax_amount = data.get('tax_amount')
        db_doc.total_amount = data.get('total_amount')

        # Dodavanje stavki (Line Items)
        for item in data.get('line_items', []):
            calc_total = item.get('quantity', 0) * item.get('unit_price', 0)
            new_item = LineItem(
                document_id=db_doc.id,
                description=item.get('description'),
                quantity=item.get('quantity'),
                unit_price=item.get('unit_price'),
                line_total=item.get('line_total'),
                calculated_total=calc_total,
                has_math_error=abs(calc_total - item.get('line_total', 0)) > 0.01
            )
            db.add(new_item)
        
        db.commit()
        return db_doc