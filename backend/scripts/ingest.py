import os
import sys
from pathlib import Path
from dotenv import load_dotenv

backend_dir = Path(__file__).resolve().parents[1]
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.services import db
from app.services.retrieve import embed_text

# 20 Historical Chunks for Project Brain AI memory engine
FAKE_CHUNKS = [
    {
        "id": "commit_a1b2c3",
        "project_id": "project-brain",
        "type": "commit",
        "text": "Refactored JWT token auth handler to fix race condition during token refresh under high load.",
        "source_url": "https://github.com/org/repo/commit/a1b2c3",
        "author": "Alice",
        "date": "2025-03-14",
        "linked_ids": ["issue_101", "pr_202"],
        "files": ["src/auth.py", "src/middleware.py"]
    },
    {
        "id": "issue_101",
        "project_id": "project-brain",
        "type": "issue",
        "text": "Bug: Users experiencing intermitten 401 Unauthorized during active sessions when renewing JWT.",
        "source_url": "https://github.com/org/repo/issues/101",
        "author": "Bob",
        "date": "2025-03-12",
        "linked_ids": ["commit_a1b2c3"],
        "files": ["src/auth.py"]
    },
    {
        "id": "commit_d4e5f6",
        "project_id": "project-brain",
        "type": "commit",
        "text": "Added Redis connection pooling and retry exponential backoff for database connection drops.",
        "source_url": "https://github.com/org/repo/commit/d4e5f6",
        "author": "Charlie",
        "date": "2025-03-15",
        "linked_ids": ["pr_203"],
        "files": ["src/db.py"]
    },
    {
        "id": "adr_001",
        "project_id": "project-brain",
        "type": "adr",
        "text": "ADR-001: Adopted PostgreSQL with pgvector for unified relational metadata and semantic search over developer artifacts.",
        "source_url": "docs/adr/001-pgvector.md",
        "author": "Architecture Team",
        "date": "2025-02-10",
        "linked_ids": [],
        "files": ["docs/adr/001-pgvector.md"]
    },
    {
        "id": "pr_202",
        "project_id": "project-brain",
        "type": "pr",
        "text": "PR #202: Resolve concurrency issues in token rotation by implementing mutex locks around refresh tokens.",
        "source_url": "https://github.com/org/repo/pull/202",
        "author": "Alice",
        "date": "2025-03-14",
        "linked_ids": ["commit_a1b2c3", "issue_101"],
        "files": ["src/auth.py"]
    }
]

def embed_and_store(chunks):
    db.init_db()
    to_store = []
    print(f"Generating embeddings for {len(chunks)} historical chunks...")
    for c in chunks:
        embed_input = f"[{c['type']}] {c['text']} (Author: {c.get('author')}, Date: {c.get('date')})"
        vec = embed_text(embed_input)
        chunk_data = dict(c)
        chunk_data["embedding"] = vec
        to_store.append(chunk_data)
        
    db.save_chunks_batch(to_store)
    print(f"Successfully embedded and inserted {len(to_store)} chunks into vector storage!")

if __name__ == "__main__":
    embed_and_store(FAKE_CHUNKS)
