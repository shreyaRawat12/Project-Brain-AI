import io
import sys
from pathlib import Path

backend_path = Path(__file__).resolve().parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.services.ingestion import extract_text_from_file, chunk_text, process_document, sanitize_filename
from app.services.answer import ask
from app.services.retrieve import retrieve
from app.services import db

def test_pipeline():
    print("--- Running Project Brain AI RAG Pipeline Tests ---")
    
    # 1. Filename sanitization
    safe = sanitize_filename("../../../secret/notes.txt")
    assert ".." not in safe, f"Path traversal not stripped: {safe}"
    print("PASS | Filename sanitization")

    # 2. Unsupported extension rejection
    try:
        extract_text_from_file("evil.exe", b"binary content")
        assert False, "Should have rejected .exe"
    except ValueError:
        print("PASS | Unsupported extension rejection")

    # 3. Empty file rejection
    try:
        extract_text_from_file("empty.txt", b"")
        assert False, "Should have rejected empty file"
    except ValueError:
        print("PASS | Empty file rejection")

    # 4. Text and Markdown extraction
    md_content = b"# Architecture Overview\nThis project uses event-driven CQRS pattern.\n\n# Security\nAuthentication uses RS256 JWT tokens with 15min expiry."
    segments = extract_text_from_file("arch.md", md_content)
    assert len(segments) == 2, f"Expected 2 sections, got {len(segments)}"
    print("PASS | Markdown section extraction")

    # 5. Chunking & metadata preservation
    chunks = chunk_text(segments, chunk_size=100, overlap=20)
    assert len(chunks) >= 2, "Expected multiple chunks"
    for c in chunks:
        assert "section" in c and "text" in c
    print("PASS | Chunking & metadata preservation")

    # 6. Ingestion of real technical document into project-brain
    doc_text = """
    PROJECT BRAIN AI ARCHITECTURE AND DECISION RECORD
    
    Executive Summary:
    Project Brain AI solves the institutional amnesia problem in engineering teams.
    The memory engine continuously captures architectural decisions, PR rationale, and commit contexts.
    
    Module Responsibilities:
    The auth module at src/auth.py handles RS256 token rotation and Redis lock synchronizations.
    The vector retrieval engine connects to pgvector or local high-performance SQLite embeddings.
    Maximum token lifespan is strictly configured to 900 seconds.
    """.encode("utf-8")

    ingest_res = process_document(
        filename="project_brain_architecture.txt",
        content=doc_text,
        project_id="project-brain"
    )
    doc_id = ingest_res["document_id"]
    assert ingest_res["status"] == "ready"
    assert ingest_res["chunk_count"] > 0
    print(f"PASS | Real document ingestion: {doc_id} with {ingest_res['chunk_count']} chunks")

    # 7. Document status checking
    doc_record = db.get_document(doc_id)
    assert doc_record["status"] == "ready"
    assert doc_record["chunk_count"] == ingest_res["chunk_count"]
    print("PASS | Document status verification")

    # 8. Grounded Retrieval from uploaded document
    hits = retrieve("What does the architecture document say about maximum token lifespan?", k=6, project_id="project-brain")
    assert len(hits) > 0, "No hits retrieved"
    found_uploaded = any("900 seconds" in h["text"] for h in hits)
    assert found_uploaded, f"Uploaded document chunk not found among top hits: {[h['id'] for h in hits]}"
    print(f"PASS | Grounded retrieval: found document chunk among top hits ({[h['id'] for h in hits]})")

    # 9. Project isolation: project 'atlas-web' must not see project-brain's uploaded document
    isolated_hits = retrieve("What does the architecture document say about maximum token lifespan?", k=6, project_id="atlas-web")
    isolated_ids = [h["id"] for h in isolated_hits if h.get("document_id") == doc_id]
    assert len(isolated_ids) == 0, "Knowledge leaked across projects!"
    print("PASS | Strict project knowledge isolation")

    # 10. End-to-end question answering with citations
    answer_res = ask("What does the architecture document specify about maximum token lifespan?", project_id="project-brain")
    assert answer_res["found"] is True
    assert len(answer_res["sources"]) > 0
    assert any(s["id"].startswith(doc_id) for s in answer_res["sources"])
    print("PASS | Grounded question answer with real citation:", answer_res["sources"][0]["id"])

    # 11. Off-topic rejection for unknown knowledge
    off_res = ask("What is the capital city of France?", project_id="project-brain")
    assert off_res["found"] is False
    assert off_res["confidence"] == "none"
    print("PASS | Strict off-topic rejection")

    print("\nALL RAG PIPELINE TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_pipeline()
