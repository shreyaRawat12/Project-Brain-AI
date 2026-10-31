import os
from pathlib import Path
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from app.services import db

# Load from backend/.env
env_path = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=env_path)

MODEL_NAME = "BAAI/bge-small-en-v1.5"
QUERY_PREFIX = "Represent this sentence for searching relevant passages: "
DB_URI = os.getenv("DATABASE_URL")

_model = None

def get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer(MODEL_NAME)
    return _model

def embed_query(question: str) -> List[float]:
    """Adds the instruction prefix to the question before embedding."""
    model = get_model()
    return model.encode(QUERY_PREFIX + question, normalize_embeddings=True).tolist()

def embed_text(text: str) -> List[float]:
    """Encodes a text chunk without query prefix."""
    model = get_model()
    return model.encode(text, normalize_embeddings=True).tolist()

def retrieve(question: str, k: int = 6, project_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Performs semantic vector search across chunks in the active database."""
    q_vec = embed_query(question)
    return db.search_chunks(q_vec, k=k, project_id=project_id)

def fetch_by_ids(ids: List[str]) -> List[Dict[str, Any]]:
    """Fetches chunks by specific IDs (e.g. for linked issue/PR lookup)."""
    return db.fetch_by_ids(ids)

if __name__ == "__main__":
    test_q = "Why did users get 401 unauthorized errors during JWT refresh?"
    print(f"\nSearching for: '{test_q}'\n")
    for h in retrieve(test_q, k=2):
        print(f"Score: {h['score']:.3f} | ID: {h['id']} | Text: {h['text'][:80]}...")
