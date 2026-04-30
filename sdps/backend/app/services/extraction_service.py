import os
import json
import re
from sqlalchemy.orm import Session
from google import genai
from app.models.documents import Document, LineItem, DocumentType
from google.genai import types
import traceback

def clean_ai_json(text: str):
    """Čisti markdown tagove koje Gemini često dodaje u odgovor."""
    if not text:
        return ""
    # Uklanja ```json i ``` blokove
    text = re.sub(r'```json\s?|\s?```', '', text)
    return text.strip()

class ExtractionService:
    @staticmethod
    def extract_data(file_path: str, db_doc: any, db: Session):
        """
        Ekstraktuje podatke iz PDF, slika ili CSV fajlova koristeći Gemini AI.
        """
        # 1. OSIGURANJE: Provjera ulaznih parametara
        if file_path is None:
            print("ERROR: extract_data je pozvan sa file_path = None")
            return None

        api_key = os.environ.get("GEMINI_KEY")
        if not api_key:
            print("ERROR: GEMINI_KEY nije konfigurisan u environment varijablama.")
            return None

        client = genai.Client(api_key=api_key)
        
        # Prompt koji forsira čisti JSON
        prompt = """
        Extract data from this document. Return ONLY a JSON object with these keys:
        doc_type (invoice or purchase_order), doc_number, supplier_name, 
        issue_date (YYYY-MM-DD), due_date (YYYY-MM-DD), currency, 
        subtotal (float), tax_amount (float), total_amount (float),
        line_items (list of objects with: description, quantity, unit_price, line_total).
        """

        try:
            # Sigurno izvlačenje ekstenzije (fiks za 'NoneType' error)
            ext = file_path.lower().split('.')[-1] if '.' in file_path else ''
            contents = []

            # --- LOGIKA ZA CSV (Šalje se kao tekst) ---
            if ext == 'csv':
                print(f"DEBUG: Procesiranje CSV fajla: {file_path}")
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        csv_text = f.read()
                except UnicodeDecodeError:
                    with open(file_path, "r", encoding="latin-1") as f:
                        csv_text = f.read()
                
                # CSV ide direktno u prompt kao tekst
                contents = [f"{prompt}\n\nOvo su podaci iz CSV fajla:\n{csv_text}"]

            # --- LOGIKA ZA SLIKE I PDF (Šalje se kao binarni podaci) ---
            else:
                print(f"DEBUG: Procesiranje binarnog fajla ({ext}): {file_path}")
                with open(file_path, "rb") as doc_file:
                    file_data = doc_file.read()
                
                mime_type = "application/pdf" if ext == "pdf" else "image/png"
                if ext in ["jpg", "jpeg"]:
                    mime_type = "image/jpeg"

                contents = [
                    prompt,
                    types.Part.from_bytes(data=file_data, mime_type=mime_type)
                ]

            # 2. POZIV GEMINI API-ja
            response = client.models.generate_content(
                model='gemini-flash-latest',
                contents=contents,
                config=types.GenerateContentConfig(
                    candidate_count=1,
                    response_mime_type='application/json' # Forsira JSON format
                )
            )

            if not response or not response.text:
                print("DEBUG: AI nije vratio sadržaj.")
                return None

            # 3. PARSIRANJE I ČIŠĆENJE
            # Ako imaš funkciju clean_ai_json koristi je, ako ne, json.loads je dovoljan zbog response_mime_type
            try:
                data = json.loads(response.text)
            except json.JSONDecodeError:
                # Fallback u slučaju da AI ipak ubaci markdown blockove ```json
                clean_text = response.text.replace("```json", "").replace("```", "").strip()
                data = json.loads(clean_text)

            # Spremanje sirovog JSON-a radi debugovanja
            db_doc.raw_extracted_json = json.dumps(data)
            
            # 4. MAPIRANJE U BAZU (Safety First)
            raw_val = data.get('doc_type')
            raw_type = str(raw_val).lower() if raw_val else 'unknown'
            
            # Pretpostavka: DocumentType je Enum u tvom modelu
            if 'invoice' in raw_type:
                db_doc.doc_type = "invoice" # ili DocumentType.invoice
            elif 'purchase' in raw_type:
                db_doc.doc_type = "purchase_order" # ili DocumentType.purchase_order
            else:
                db_doc.doc_type = "unknown"

            db_doc.doc_number = data.get('doc_number')
            db_doc.supplier_name = data.get('supplier_name')
            db_doc.issue_date = data.get('issue_date')
            db_doc.due_date = data.get('due_date')
            db_doc.currency = data.get('currency')
            
            # Konverzija brojeva (osiguranje od None ili stringova)
            def safe_float(val):
                try: return float(val) if val is not None else 0.0
                except: return 0.0

            db_doc.subtotal = safe_float(data.get('subtotal'))
            db_doc.tax_amount = safe_float(data.get('tax_amount'))
            db_doc.total_amount = safe_float(data.get('total_amount'))

            # 5. MAPIRANJE STAVKI (Line Items)
            if 'line_items' in data and isinstance(data['line_items'], list):
                # Očisti stare stavke ako postoje (opcionalno)
                # db.query(LineItem).filter(LineItem.document_id == db_doc.id).delete()
                
                for item in data['line_items']:
                    qty = safe_float(item.get('quantity'))
                    price = safe_float(item.get('unit_price'))
                    l_total = safe_float(item.get('line_total'))
                    calc_total = qty * price
                    
                    # Ovdje koristiš svoj LineItem model
                    new_item = LineItem(
                        document_id=db_doc.id,
                        description=item.get('description', 'No description'),
                        quantity=qty,
                        unit_price=price,
                        line_total=l_total,
                        calculated_total=calc_total,
                        has_math_error=abs(calc_total - l_total) > 0.01
                    )
                    db.add(new_item)

            db.commit()
            print(f"DEBUG: Ekstrakcija uspješna za dokument ID: {db_doc.id}")
            return db_doc

        except Exception as e:
            db.rollback()
            print("\n" + "="*50)
            print("KRITIČNA GREŠKA U EXTRACTION SERVISU:")
            traceback.print_exc()
            print("="*50 + "\n")
            return None