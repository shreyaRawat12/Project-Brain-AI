import logging
from fastapi import APIRouter
from pydantic import BaseModel, Field
from app.services.answer import ask

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/assistant", tags=["assistant"])

class Question(BaseModel):
    question: str = Field(..., max_length=1000, description="The user question (up to 1,000 characters)")

@router.post("/ask")
def ask_endpoint(body: Question):
    q = body.question.strip()
    if not q:
        return {
            "found": False,
            "answer": "Please enter a question.",
            "sources": [],
            "confidence": "none"
        }
    try:
        return ask(q)
    except Exception as e:
        logger.error(f"Error processing question: {type(e).__name__}: {e}")
        return {
            "found": False,
            "answer": "Something went wrong. Please try again.",
            "sources": [],
            "confidence": "none"
        }
