from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.controllers.documents import router as document_router
from app.db.database import engine, Base
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "static", "uploads"))

print(f"DEBUG: Serving files from: {UPLOAD_DIR}")

app = FastAPI(
    title="SmartDocs AI API",
    description="Backend for automatic document extraction and validation",
    version="1.0.0"
)
app.mount("/static", StaticFiles(directory=UPLOAD_DIR), name="static")

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(document_router)

@app.get(
    "/",
    summary="Root Endpoint",
    description="Basic health check endpoint for the API."
)
def read_root():
    return {
        "app": "SmartDocs AI",
        "status": "online",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)