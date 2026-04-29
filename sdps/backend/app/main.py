# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.controllers.documents import router as document_router
from app.db.database import engine, Base 

try:
    Base.metadata.create_all(bind=engine)
    print("Baza podataka i tabele su uspješno inicijalizovane.")
except Exception as e:
    print(f"Greška pri inicijalizaciji baze: {e}")

app = FastAPI(
    title="SmartDocs AI API",
    description="Backend za automatsku ekstrakciju i validaciju dokumenata",
    version="1.0.0"
)

# --- CORS KONFIGURACIJA ---
# Bez ovoga će ti browser blokirati upload fajlova sa frontenda
origins = [
    "http://localhost:3000",  # React/Next.js default port
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Dozvoljava GET, POST, OPTIONS itd.
    allow_headers=["*"],  # Dozvoljava sve headere
)

# --- REGISTRACIJA KONTROLERA (RUTERA) ---
app.include_router(document_router)

# --- TEST ENDPOINT ---
@app.get("/")
def read_root():
    return {
        "app": "SmartDocs AI",
        "status": "online",
        "docs": "/docs"  # Putanja do Swagger dokumentacije
    }

if __name__ == "__main__":
    import uvicorn
    # Pokretanje servera direktno preko Python fajla (opciono)
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)