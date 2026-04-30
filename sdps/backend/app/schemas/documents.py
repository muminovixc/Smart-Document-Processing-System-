from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from datetime import date
import os

class LineItemOut(BaseModel):
    id: int
    description: Optional[str]
    quantity: Optional[float]
    unit_price: Optional[float]
    line_total: Optional[float]
    calculated_total: Optional[float]
    has_math_error: Optional[bool]
 
    class Config:
        from_attributes = True
 
 
class DocumentOut(BaseModel):
    id: int
    original_filename: str
    file_path: str
    file_type: str
    doc_type: Optional[str]
    doc_number: Optional[str]
    supplier_name: Optional[str]
    issue_date: Optional[date]
    due_date: Optional[date]
    currency: Optional[str]
    subtotal: Optional[float]
    tax_amount: Optional[float]
    total_amount: Optional[float]
    status: str
    validation_errors: Optional[str]
    is_duplicate: Optional[bool]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    line_items: list[LineItemOut] = []
 
    class Config:
        from_attributes = True
 

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