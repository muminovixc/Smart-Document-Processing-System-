import json
from sqlalchemy.orm import Session
from app.models.documents import Document, DocumentStatus


class ValidationService:

    @staticmethod
    def validate_document(db_doc: Document, db: Session) -> Document:
        errors = []

        # ── 1. Subtotal + Tax = Total ─────────────────────────────────────────
        subtotal    = db_doc.subtotal     or 0.0
        tax         = db_doc.tax_amount   or 0.0
        total       = db_doc.total_amount or 0.0

        expected_total = round(subtotal + tax, 2)
        actual_total   = round(total, 2)

        if actual_total != 0.0 and abs(expected_total - actual_total) > 0.01:
            errors.append(
                f"Total mismatch: subtotal ({subtotal}) + tax ({tax}) = {expected_total}, "
                f"but document total is {actual_total}"
            )

        # ── 2. Duplicate doc_number ───────────────────────────────────────────
        if db_doc.doc_number:
            duplicate = db.query(Document).filter(
                Document.doc_number == db_doc.doc_number,
                Document.id != db_doc.id
            ).first()
            if duplicate:
                db_doc.is_duplicate = True
                errors.append(f"Duplicate document number: {db_doc.doc_number}")

        # ── 3. Line item math errors ──────────────────────────────────────────
        # BUG FIX: bio je db_doc.items — treba db_doc.line_items
        if db_doc.line_items:
            bad_items = [
                item.description or f"Item #{i+1}"
                for i, item in enumerate(db_doc.line_items)
                if item.has_math_error
            ]
            if bad_items:
                errors.append(f"Line item math error in: {', '.join(bad_items)}")

        # ── 4. Missing required fields ────────────────────────────────────────
        if not db_doc.supplier_name:
            errors.append("Missing supplier name")

        if not db_doc.doc_number:
            errors.append("Missing document number")

        if not db_doc.issue_date:
            errors.append("Missing issue date")

        # ── 5. Date logic: due_date must be after issue_date ──────────────────
        if db_doc.issue_date and db_doc.due_date:
            if db_doc.due_date < db_doc.issue_date:
                errors.append(
                    f"Due date ({db_doc.due_date}) is before issue date ({db_doc.issue_date})"
                )

        # ── 6. Line items sum vs subtotal ─────────────────────────────────────
        if db_doc.line_items and subtotal > 0:
            items_sum = round(sum(item.line_total or 0.0 for item in db_doc.line_items), 2)
            if abs(items_sum - round(subtotal, 2)) > 0.01:
                errors.append(
                    f"Line items sum ({items_sum}) does not match subtotal ({subtotal})"
                )

        # ── Set status ────────────────────────────────────────────────────────
        if errors:
            db_doc.status = DocumentStatus.needs_review
            db_doc.validation_errors = json.dumps(errors)
        else:
            db_doc.status = DocumentStatus.validated
            db_doc.validation_errors = None

        db.commit()
        return db_doc