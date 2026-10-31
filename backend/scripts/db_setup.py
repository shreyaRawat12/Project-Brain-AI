import os
from pathlib import Path
from dotenv import load_dotenv
import psycopg

# Load from backend/.env
env_path = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(dotenv_path=env_path)

DB_URI = os.getenv("DATABASE_URL")

def init_db():
    with psycopg.connect(DB_URI) as conn:
        with conn.cursor() as cur:
            # Enable vector extension
            cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
            
            # Create table matching the agreed chunk structure
            cur.execute("""
            CREATE TABLE IF NOT EXISTS chunks (
                id TEXT PRIMARY KEY,
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
            
            # Create HNSW index for fast vector search
            cur.execute("""
            CREATE INDEX IF NOT EXISTS chunks_embedding_hnsw_idx 
            ON chunks USING hnsw (embedding vector_cosine_ops);
            """)
            conn.commit()
            print("Database & vector index initialized successfully!")

if __name__ == "__main__":
    init_db()