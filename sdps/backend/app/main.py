# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.controllers.documents import router as document_router
from app.db.database import engine, Base
import os 

# 1. Definisanje putanje do foldera gde su slike
# Koristimo apsolutnu putanju da izbegnemo probleme sa lokacijom terminala
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "static", "uploads"))


#
print(f"DEBUG: Serviram fajlove iz: {UPLOAD_DIR}")
app = FastAPI(
    title="SmartDocs AI API",
    description="Backend za automatsku ekstrakciju i validaciju dokumenata",
    version="1.0.0"
)
app.mount("/static", StaticFiles(directory=UPLOAD_DIR), name="static")
 


# --- CORS KONFIGURACIJA ---
# Bez ovoga će ti browser blokirati upload fajlova sa frontenda
origins = [
    "http://localhost:3000",  # React/Next.js default port
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Dozvoli svom frontendu
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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