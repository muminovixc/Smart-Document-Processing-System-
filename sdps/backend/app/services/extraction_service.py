import os
import json
import re
from sqlalchemy.orm import Session
from google import genai
from app.models.documents import Document, LineItem
from google.genai import types
import traceback


class ExtractionService:

    @staticmethod
    def extract_data(file_path: str, db_doc: Document, db: Session) -> Document | None:

        if not file_path:
            return None

        api_key = os.environ.get("GEMINI_KEY")
        if not api_key:
            return None

        client = genai.Client(api_key=api_key)

        prompt = """
Extract data from this business document exactly as written. Do NOT correct or recalculate any numbers.

Return ONLY a valid JSON object with these keys:
{
  "doc_type": "invoice" or "purchase_order",
  "doc_number": "string or null",
  "supplier_name": "string or null",
  "issue_date": "YYYY-MM-DD or null",
  "due_date": "YYYY-MM-DD or null",
  "currency": "EUR/USD/BAM/etc or null",
  "subtotal": float or 0.0,
  "tax_amount": float or 0.0,
  "total_amount": float or 0.0,
  "line_items": [
    {
      "description": "string",
      "quantity": float,
      "unit_price": float,
      "line_total": float
    }
  ]
}

CRITICAL RULES:
- Extract subtotal, tax_amount, and total_amount EXACTLY as they appear on the document.
- Do NOT fix math errors — if the document says total is 800 but subtotal+tax=774, extract 800.
- If a field is not present, use null for strings and 0.0 for numbers.
- line_total per item must be extracted as written, not recalculated.
"""

        try:
            ext = file_path.lower().rsplit('.', 1)[-1] if '.' in file_path else ''
            contents = []

            if ext == 'csv':
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        csv_text = f.read()
                except UnicodeDecodeError:
                    with open(file_path, "r", encoding="latin-1") as f:
                        csv_text = f.read()
                contents = [f"{prompt}\n\nDocument contents (CSV):\n{csv_text}"]

            elif ext == 'txt':
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    txt_text = f.read()
                contents = [f"{prompt}\n\nDocument contents (TXT):\n{txt_text}"]

            else:
                with open(file_path, "rb") as f:
                    file_data = f.read()

                mime_map = {
                    "pdf":  "application/pdf",
                    "png":  "image/png",
                    "jpg":  "image/jpeg",
                    "jpeg": "image/jpeg",
                }
                mime_type = mime_map.get(ext, "application/octet-stream")
                contents = [
                    prompt,
                    types.Part.from_bytes(data=file_data, mime_type=mime_type),
                ]

            response = client.models.generate_content(
                model='gemini-flash-latest',
                contents=contents,
                config=types.GenerateContentConfig(
                    candidate_count=1,
                    response_mime_type='application/json',
                )
            )

            if not response or not response.text:
                return None

            try:
                data = json.loads(response.text)
            except json.JSONDecodeError:
                clean = re.sub(r'```json\s?|\s?```', '', response.text).strip()
                data = json.loads(clean)

            db_doc.raw_extracted_json = json.dumps(data)

            raw_type = str(data.get('doc_type', '')).lower()
            if 'invoice' in raw_type:
                db_doc.doc_type = "invoice"
            elif 'purchase' in raw_type:
                db_doc.doc_type = "purchase_order"
            else:
                db_doc.doc_type = "unknown"

            db_doc.doc_number    = data.get('doc_number')
            db_doc.supplier_name = data.get('supplier_name')
            db_doc.issue_date    = data.get('issue_date')
            db_doc.due_date      = data.get('due_date')
            db_doc.currency      = data.get('currency')

            def safe_float(val):
                try:
                    return float(val) if val is not None else 0.0
                except (ValueError, TypeError):
                    return 0.0

            db_doc.subtotal     = safe_float(data.get('subtotal'))
            db_doc.tax_amount   = safe_float(data.get('tax_amount'))
            db_doc.total_amount = safe_float(data.get('total_amount'))

            line_items_data = data.get('line_items') or []
            if isinstance(line_items_data, list):
                for item in line_items_data:
                    qty        = safe_float(item.get('quantity'))
                    price      = safe_float(item.get('unit_price'))
                    l_total    = safe_float(item.get('line_total'))
                    calc_total = round(qty * price, 2)

                    new_item = LineItem(
                        document_id=db_doc.id,
                        description=item.get('description') or 'No description',
                        quantity=qty,
                        unit_price=price,
                        line_total=l_total,
                        calculated_total=calc_total,
                        has_math_error=abs(calc_total - l_total) > 0.01,
                    )
                    db.add(new_item)

            db.commit()
            print(f"Extraction OK — doc ID: {db_doc.id}, total: {db_doc.total_amount}")
            return db_doc

        except Exception:
            db.rollback()
            traceback.print_exc()
            return None