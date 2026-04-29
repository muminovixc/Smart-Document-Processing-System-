from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.database import Base

class DocumentStatus(str, enum.Enum):
    uploaded = "uploaded"
    needs_review = "needs_review"
    validated = "validated"
    rejected = "rejected"

class DocumentType(str, enum.Enum):
    invoice = "invoice"
    purchase_order = "purchase_order"
    unknown = "unknown"

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(10), nullable=False)
    
    doc_type = Column(Enum(DocumentType), default=DocumentType.unknown)
    doc_number = Column(String(100), index=True)
    supplier_name = Column(String(255))
    issue_date = Column(DateTime)
    due_date = Column(DateTime)
    currency = Column(String(10))

    subtotal = Column(Float)
    tax_amount = Column(Float)
    total_amount = Column(Float)

    status = Column(Enum(DocumentStatus), default=DocumentStatus.uploaded)
    validation_errors = Column(Text) # Čuvamo kao JSON string
    is_duplicate = Column(Boolean, default=False)
    raw_extracted_json = Column(Text)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    items = relationship("LineItem", back_populates="document", cascade="all, delete-orphan")

class LineItem(Base):
    __tablename__ = "line_items"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"))
    
    description = Column(String(500))
    quantity = Column(Float)
    unit_price = Column(Float)
    line_total = Column(Float)
    calculated_total = Column(Float)
    has_math_error = Column(Boolean, default=False)

    document = relationship("Document", back_populates="items")