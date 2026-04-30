import json
from sqlalchemy.orm import Session
from app.models.documents import Document, DocumentStatus

class ValidationService:
    @staticmethod
    def validate_document(db_doc: Document, db: Session):
        errors = []

        # 1. Validacija Totala (Subtotal + Tax)
        # Za invoice_1.pdf: 645 + 129 = 774 (na dokumentu piše 800)
        expected_total = (db_doc.subtotal or 0) + (db_doc.tax_amount or 0)
        if abs(expected_total - (db_doc.total_amount or 0)) > 0.01:
            errors.append(f"Total mismatch: Document says {db_doc.total_amount}, but subtotal + tax is {expected_total}")

        # 2. Provjera duplikata (prema doc_number u bazi)
        duplicate = db.query(Document).filter(
            Document.doc_number == db_doc.doc_number,
            Document.id != db_doc.id
        ).first()
        if duplicate:
            db_doc.is_duplicate = True
            errors.append(f"Duplicate document number detected: {db_doc.doc_number}")

        # 3. Provjera matematičkih grešaka u stavkama
        math_errors = [item.description for item in db_doc.items if item.has_math_error]
        if math_errors:
            errors.append(f"Math error in items: {', '.join(math_errors)}")

        # Ažuriranje statusa
        if errors:
            db_doc.status = DocumentStatus.needs_review
            db_doc.validation_errors = json.dumps(errors)
        else:
            db_doc.status = DocumentStatus.validated
            db_doc.validation_errors = None

        db.commit()
        return db_doc