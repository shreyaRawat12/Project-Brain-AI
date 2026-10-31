import os
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parents[1]
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.services import db

def init_database():
    print("Initializing Project Brain AI database...")
    db.init_db()
    print("Database initialization complete.")

if __name__ == "__main__":
    init_database()
