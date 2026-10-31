import os
import json
import sqlite3
import logging
from pathlib import Path
from datetime import datetime, date
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# Load from backend/.env
env_path = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=env_path)

DB_URI = os.getenv("DATABASE_URL")
DATA_DIR = Path(__file__).resolve().parents[2] / "data"
SQLITE_PATH = DATA_DIR / "project_brain.db"

_db_mode = None  # "postgres" or "sqlite"

def get_connection():
    """Returns (conn, mode) where mode is 'postgres' or 'sqlite'."""
    global _db_mode
    if DB_URI and DB_URI.strip() and not DB_URI.startswith("postgresql://username:password"):
        try:
            import psycopg
            conn = psycopg.connect(DB_URI, connect_timeout=3)
            _db_mode = "postgres"
            return conn, "postgres"
        except Exception as e:
            logger.warning(f"Failed to connect to PostgreSQL ({e}). Falling back to local SQLite.")
    
    # SQLite fallback
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(SQLITE_PATH))
    conn.row_factory = sqlite3.Row
    _db_mode = "sqlite"
    return conn, "sqlite"

def init_db():
    """Initializes tables in either PostgreSQL or SQLite."""
    conn, mode = get_connection()
    try:
        if mode == "postgres":
            with conn.cursor() as cur:
                cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
                
                # Table: chunks
                cur.execute("""
                CREATE TABLE IF NOT EXISTS chunks (
                    id TEXT PRIMARY KEY,
                    project_id TEXT,
                    document_id TEXT,
                    type TEXT,
                    text TEXT,
                    source_url TEXT,
                    author TEXT,
                    date DATE,
                    linked_ids TEXT[],
                    files TEXT[],
                    embedding vector(384)
                );
                """)
                # Migration in case columns are missing
                cur.execute("ALTER TABLE chunks ADD COLUMN IF NOT EXISTS project_id TEXT;")
                cur.execute("ALTER TABLE chunks ADD COLUMN IF NOT EXISTS document_id TEXT;")
                
                # Index
                cur.execute("""
                CREATE INDEX IF NOT EXISTS chunks_embedding_hnsw_idx 
                ON chunks USING hnsw (embedding vector_cosine_ops);
                """)
                cur.execute("CREATE INDEX IF NOT EXISTS chunks_project_idx ON chunks (project_id);")
                
                # Table: documents
                cur.execute("""
                CREATE TABLE IF NOT EXISTS documents (
                    id TEXT PRIMARY KEY,
                    project_id TEXT,
                    filename TEXT,
                    file_type TEXT,
                    file_size INTEGER,
                    status TEXT,
                    chunk_count INTEGER DEFAULT 0,
                    error_message TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                """)
                
                # Table: conversations
                cur.execute("""
                CREATE TABLE IF NOT EXISTS conversations (
                    id TEXT PRIMARY KEY,
                    project_id TEXT,
                    title TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                """)
                
                # Table: messages
                cur.execute("""
                CREATE TABLE IF NOT EXISTS messages (
                    id TEXT PRIMARY KEY,
                    conversation_id TEXT,
                    role TEXT,
                    content TEXT,
                    sources JSONB,
                    confidence TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                """)
                conn.commit()
                print("PostgreSQL tables & vector index initialized.")
        else:
            cur = conn.cursor()
            # Table: chunks
            cur.execute("""
            CREATE TABLE IF NOT EXISTS chunks (
                id TEXT PRIMARY KEY,
                project_id TEXT,
                document_id TEXT,
                type TEXT,
                text TEXT,
                source_url TEXT,
                author TEXT,
                date TEXT,
                linked_ids TEXT,
                files TEXT,
                embedding TEXT
            );
            """)
            
            # Table: documents
            cur.execute("""
            CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                project_id TEXT,
                filename TEXT,
                file_type TEXT,
                file_size INTEGER,
                status TEXT,
                chunk_count INTEGER DEFAULT 0,
                error_message TEXT,
                created_at TEXT,
                updated_at TEXT
            );
            """)
            
            # Table: conversations
            cur.execute("""
            CREATE TABLE IF NOT EXISTS conversations (
                id TEXT PRIMARY KEY,
                project_id TEXT,
                title TEXT,
                created_at TEXT,
                updated_at TEXT
            );
            """)
            
            # Table: messages
            cur.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                conversation_id TEXT,
                role TEXT,
                content TEXT,
                sources TEXT,
                confidence TEXT,
                created_at TEXT
            );
            """)
            conn.commit()
            print("SQLite tables initialized successfully at", SQLITE_PATH)
    finally:
        conn.close()

def save_chunks_batch(chunks: List[Dict[str, Any]]):
    """Inserts or updates chunks in the active database."""
    if not chunks:
        return
    conn, mode = get_connection()
    try:
        if mode == "postgres":
            with conn.cursor() as cur:
                for c in chunks:
                    vec = "[" + ",".join(map(str, c["embedding"])) + "]"
                    d = c.get("date")
                    if isinstance(d, str) and d:
                        try:
                            d = datetime.strptime(d[:10], "%Y-%m-%d").date()
                        except Exception:
                            d = None
                    cur.execute("""
                    INSERT INTO chunks (id, project_id, document_id, type, text, source_url, author, date, linked_ids, files, embedding)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s::vector)
                    ON CONFLICT (id) DO UPDATE 
                    SET project_id = EXCLUDED.project_id,
                        document_id = EXCLUDED.document_id,
                        text = EXCLUDED.text,
                        source_url = EXCLUDED.source_url,
                        embedding = EXCLUDED.embedding;
                    """, (
                        c['id'], c.get('project_id'), c.get('document_id'),
                        c.get('type', 'document'), c['text'], c.get('source_url', ''),
                        c.get('author', 'System'), d,
                        c.get('linked_ids') or [], c.get('files') or [], vec
                    ))
                conn.commit()
        else:
            cur = conn.cursor()
            for c in chunks:
                vec_str = json.dumps(c["embedding"])
                cur.execute("""
                INSERT INTO chunks (id, project_id, document_id, type, text, source_url, author, date, linked_ids, files, embedding)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (id) DO UPDATE 
                SET project_id = excluded.project_id,
                    document_id = excluded.document_id,
                    text = excluded.text,
                    source_url = excluded.source_url,
                    embedding = excluded.embedding;
                """, (
                    c['id'], c.get('project_id'), c.get('document_id'),
                    c.get('type', 'document'), c['text'], c.get('source_url', ''),
                    c.get('author', 'System'), str(c.get('date', datetime.utcnow().strftime("%Y-%m-%d"))),
                    json.dumps(c.get('linked_ids') or []), json.dumps(c.get('files') or []), vec_str
                ))
            conn.commit()
    finally:
        conn.close()

def search_chunks(query_vec: List[float], k: int = 6, project_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Vector search with optional project_id filtering."""
    conn, mode = get_connection()
    try:
        if mode == "postgres":
            vec = "[" + ",".join(map(str, query_vec)) + "]"
            with conn.cursor() as cur:
                if project_id:
                    cur.execute("""
                    SELECT id, type, text, source_url, author, date, linked_ids, files, project_id, document_id,
                           1 - (embedding <=> %s::vector) AS score
                    FROM chunks
                    WHERE project_id = %s OR project_id IS NULL
                    ORDER BY embedding <=> %s::vector
                    LIMIT %s
                    """, (vec, project_id, vec, k))
                else:
                    cur.execute("""
                    SELECT id, type, text, source_url, author, date, linked_ids, files, project_id, document_id,
                           1 - (embedding <=> %s::vector) AS score
                    FROM chunks
                    ORDER BY embedding <=> %s::vector
                    LIMIT %s
                    """, (vec, vec, k))
                rows = cur.fetchall()
                results = []
                for r in rows:
                    results.append({
                        "id": r[0],
                        "type": r[1],
                        "text": r[2],
                        "source_url": r[3],
                        "author": r[4],
                        "date": str(r[5]),
                        "linked_ids": r[6] if isinstance(r[6], list) else [],
                        "files": r[7] if isinstance(r[7], list) else [],
                        "project_id": r[8],
                        "document_id": r[9],
                        "score": float(r[10])
                    })
                return results
        else:
            cur = conn.cursor()
            if project_id:
                cur.execute("""
                SELECT id, type, text, source_url, author, date, linked_ids, files, project_id, document_id, embedding
                FROM chunks
                WHERE project_id = ? OR project_id IS NULL OR project_id = ''
                """, (project_id,))
            else:
                cur.execute("""
                SELECT id, type, text, source_url, author, date, linked_ids, files, project_id, document_id, embedding
                FROM chunks
                """)
            rows = cur.fetchall()
            if not rows:
                return []

            # Cosine similarity calculation (query_vec and stored vectors are unit normalized)
            scored = []
            for r in rows:
                emb_raw = r["embedding"]
                if not emb_raw:
                    continue
                try:
                    vec = json.loads(emb_raw) if isinstance(emb_raw, str) else emb_raw
                    # Dot product of normalized vectors
                    score = sum(a * b for a, b in zip(query_vec, vec))
                    
                    linked = r["linked_ids"]
                    if isinstance(linked, str):
                        try: linked = json.loads(linked)
                        except Exception: linked = []
                        
                    files = r["files"]
                    if isinstance(files, str):
                        try: files = json.loads(files)
                        except Exception: files = []
                        
                    scored.append({
                        "id": r["id"],
                        "type": r["type"],
                        "text": r["text"],
                        "source_url": r["source_url"],
                        "author": r["author"],
                        "date": str(r["date"]),
                        "linked_ids": linked or [],
                        "files": files or [],
                        "project_id": r["project_id"],
                        "document_id": r["document_id"],
                        "score": float(score)
                    })
                except Exception as e:
                    continue
            
            scored.sort(key=lambda x: x["score"], reverse=True)
            return scored[:k]
    finally:
        conn.close()

def fetch_by_ids(ids: List[str]) -> List[Dict[str, Any]]:
    if not ids:
        return []
    conn, mode = get_connection()
    try:
        if mode == "postgres":
            with conn.cursor() as cur:
                cur.execute("""
                SELECT id, type, text, source_url, author, date, linked_ids, files, project_id, document_id
                FROM chunks WHERE id = ANY(%s)
                """, (list(ids),))
                return [{
                    "id": r[0], "type": r[1], "text": r[2], "source_url": r[3],
                    "author": r[4], "date": str(r[5]), "linked_ids": r[6] or [],
                    "files": r[7] or [], "project_id": r[8], "document_id": r[9],
                    "score": None
                } for r in cur.fetchall()]
        else:
            cur = conn.cursor()
            placeholders = ",".join(["?"] * len(ids))
            cur.execute(f"""
            SELECT id, type, text, source_url, author, date, linked_ids, files, project_id, document_id
            FROM chunks WHERE id IN ({placeholders})
            """, list(ids))
            results = []
            for r in cur.fetchall():
                linked = r["linked_ids"]
                if isinstance(linked, str):
                    try: linked = json.loads(linked)
                    except Exception: linked = []
                files = r["files"]
                if isinstance(files, str):
                    try: files = json.loads(files)
                    except Exception: files = []
                results.append({
                    "id": r["id"], "type": r["type"], "text": r["text"], "source_url": r["source_url"],
                    "author": r["author"], "date": str(r["date"]), "linked_ids": linked or [],
                    "files": files or [], "project_id": r["project_id"], "document_id": r["document_id"],
                    "score": None
                })
            return results
    finally:
        conn.close()

def save_document_record(doc: Dict[str, Any]):
    conn, mode = get_connection()
    try:
        now_str = datetime.utcnow().isoformat()
        if mode == "postgres":
            with conn.cursor() as cur:
                cur.execute("""
                INSERT INTO documents (id, project_id, filename, file_type, file_size, status, chunk_count, error_message, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE 
                SET status = EXCLUDED.status,
                    chunk_count = EXCLUDED.chunk_count,
                    error_message = EXCLUDED.error_message,
                    updated_at = EXCLUDED.updated_at;
                """, (
                    doc["id"], doc.get("project_id"), doc["filename"], doc.get("file_type", ""),
                    doc.get("file_size", 0), doc.get("status", "uploading"),
                    doc.get("chunk_count", 0), doc.get("error_message"), now_str, now_str
                ))
                conn.commit()
        else:
            cur = conn.cursor()
            cur.execute("""
            INSERT INTO documents (id, project_id, filename, file_type, file_size, status, chunk_count, error_message, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (id) DO UPDATE 
            SET status = excluded.status,
                chunk_count = excluded.chunk_count,
                error_message = excluded.error_message,
                updated_at = excluded.updated_at;
            """, (
                doc["id"], doc.get("project_id"), doc["filename"], doc.get("file_type", ""),
                doc.get("file_size", 0), doc.get("status", "uploading"),
                doc.get("chunk_count", 0), doc.get("error_message"), now_str, now_str
            ))
            conn.commit()
    finally:
        conn.close()

def update_document_status(doc_id: str, status: str, chunk_count: Optional[int] = None, error_message: Optional[str] = None):
    conn, mode = get_connection()
    try:
        now_str = datetime.utcnow().isoformat()
        if mode == "postgres":
            with conn.cursor() as cur:
                if chunk_count is not None:
                    cur.execute("""
                    UPDATE documents SET status = %s, chunk_count = %s, error_message = %s, updated_at = %s WHERE id = %s
                    """, (status, chunk_count, error_message, now_str, doc_id))
                else:
                    cur.execute("""
                    UPDATE documents SET status = %s, error_message = %s, updated_at = %s WHERE id = %s
                    """, (status, error_message, now_str, doc_id))
                conn.commit()
        else:
            cur = conn.cursor()
            if chunk_count is not None:
                cur.execute("""
                UPDATE documents SET status = ?, chunk_count = ?, error_message = ?, updated_at = ? WHERE id = ?
                """, (status, chunk_count, error_message, now_str, doc_id))
            else:
                cur.execute("""
                UPDATE documents SET status = ?, error_message = ?, updated_at = ? WHERE id = ?
                """, (status, error_message, now_str, doc_id))
            conn.commit()
    finally:
        conn.close()

def get_document(doc_id: str) -> Optional[Dict[str, Any]]:
    conn, mode = get_connection()
    try:
        if mode == "postgres":
            with conn.cursor() as cur:
                cur.execute("SELECT id, project_id, filename, file_type, file_size, status, chunk_count, error_message, created_at, updated_at FROM documents WHERE id = %s", (doc_id,))
                row = cur.fetchone()
                if not row: return None
                return {
                    "id": row[0], "project_id": row[1], "filename": row[2], "file_type": row[3],
                    "file_size": row[4], "status": row[5], "chunk_count": row[6], "error_message": row[7],
                    "created_at": str(row[8]), "updated_at": str(row[9])
                }
        else:
            cur = conn.cursor()
            cur.execute("SELECT id, project_id, filename, file_type, file_size, status, chunk_count, error_message, created_at, updated_at FROM documents WHERE id = ?", (doc_id,))
            row = cur.fetchone()
            if not row: return None
            return dict(row)
    finally:
        conn.close()

def get_documents(project_id: Optional[str] = None) -> List[Dict[str, Any]]:
    conn, mode = get_connection()
    try:
        if mode == "postgres":
            with conn.cursor() as cur:
                if project_id:
                    cur.execute("SELECT id, project_id, filename, file_type, file_size, status, chunk_count, error_message, created_at, updated_at FROM documents WHERE project_id = %s ORDER BY created_at DESC", (project_id,))
                else:
                    cur.execute("SELECT id, project_id, filename, file_type, file_size, status, chunk_count, error_message, created_at, updated_at FROM documents ORDER BY created_at DESC")
                return [{
                    "id": r[0], "project_id": r[1], "filename": r[2], "file_type": r[3],
                    "file_size": r[4], "status": r[5], "chunk_count": r[6], "error_message": r[7],
                    "created_at": str(r[8]), "updated_at": str(r[9])
                } for r in cur.fetchall()]
        else:
            cur = conn.cursor()
            if project_id:
                cur.execute("SELECT id, project_id, filename, file_type, file_size, status, chunk_count, error_message, created_at, updated_at FROM documents WHERE project_id = ? ORDER BY created_at DESC", (project_id,))
            else:
                cur.execute("SELECT id, project_id, filename, file_type, file_size, status, chunk_count, error_message, created_at, updated_at FROM documents ORDER BY created_at DESC")
            return [dict(r) for r in cur.fetchall()]
    finally:
        conn.close()

def get_chunk_by_id(chunk_id: str) -> Optional[Dict[str, Any]]:
    items = fetch_by_ids([chunk_id])
    return items[0] if items else None
