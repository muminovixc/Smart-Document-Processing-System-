from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class DocumentBase(BaseModel):
    original_filename: str
    status: str

class DocumentCreate(DocumentBase):
    file_path: str
    file_type: str

class DocumentResponse(DocumentBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True