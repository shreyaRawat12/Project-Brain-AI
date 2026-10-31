import os
import uuid
import logging
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query, status
from pydantic import BaseModel, Field
from app.services.answer import ask
from app.services.ingestion import process_document, SUPPORTED_EXTENSIONS
from app.services import db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/assistant", tags=["assistant"])

MAX_UPLOAD_SIZE_BYTES = int(os.getenv("MAX_UPLOAD_SIZE_MB", "25")) * 1024 * 1024

class Question(BaseModel):
    question: str = Field(..., max_length=1000, description="The user question (up to 1,000 characters)")
    project_id: Optional[str] = Field(None, description="Optional project ID to scope the knowledge retrieval")
    conversation_id: Optional[str] = Field(None, description="Optional conversation ID for context continuity")

class SourceResponse(BaseModel):
    id: str
    type: str
    url: Optional[str] = None
    snippet: str
    score: Optional[float] = None
    author: Optional[str] = None
    date: Optional[str] = None
    project_id: Optional[str] = None

class AskResponse(BaseModel):
    found: bool
    answer: str
    sources: List[SourceResponse]
    confidence: str
    conversation_id: Optional[str] = None

@router.post("/ask", response_model=AskResponse)
@router.post("/chat", response_model=AskResponse)
def ask_endpoint(body: Question):
    q = body.question.strip()
    conv_id = body.conversation_id or f"conv_{uuid.uuid4().hex[:8]}"

    if not q:
        return AskResponse(
            found=False,
            answer="Please enter a question.",
            sources=[],
            confidence="none",
            conversation_id=conv_id
        )

    try:
        res = ask(q, project_id=body.project_id)
        return AskResponse(
            found=res["found"],
            answer=res["answer"],
            sources=[SourceResponse(**s) for s in res.get("sources", [])],
            confidence=res["confidence"],
            conversation_id=conv_id
        )
    except Exception as e:
        logger.error(f"Error processing question: {type(e).__name__}: {e}")
        return AskResponse(
            found=False,
            answer="Something went wrong while retrieving project knowledge. Please try again.",
            sources=[],
            confidence="none",
            conversation_id=conv_id
        )

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    project_id: Optional[str] = Form(None)
):
    """
    Accepts PDF, DOCX, TXT, or MD documents, extracts text, generates vector embeddings,
    and indexes them into the knowledge base for semantic retrieval.
    """
    filename = file.filename or "unknown"
    ext = os.path.splitext(filename)[1].lower()

    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '{ext}'. Allowed formats: PDF, DOCX, TXT, MD."
        )

    content = await file.read()
    if len(content) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)}MB."
        )

    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes)."
        )

    try:
        result = process_document(
            filename=filename,
            content=content,
            project_id=project_id
        )
        return result
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"Upload and indexing failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process and index document: {str(e)}"
        )

@router.get("/documents")
def list_documents(project_id: Optional[str] = Query(None)):
    """Returns list of indexed documents, optionally scoped by project."""
    return db.get_documents(project_id=project_id)

@router.get("/documents/{document_id}/status")
def get_document_status(document_id: str):
    """Returns current indexing status of a specific document."""
    doc = db.get_document(document_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return doc

@router.get("/sources/{source_id}")
def get_source_details(source_id: str):
    """Returns the source chunk details and text snippet."""
    chunk = db.get_chunk_by_id(source_id)
    if not chunk:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source not found")
    return chunk
