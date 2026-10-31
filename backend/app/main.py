import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

# Initialize database tables on startup
try:
    from app.services import db
    db.init_db()
except Exception as e:
    print(f"Database initialization notice: {e}")

app = FastAPI(title="Project Brain AI")

# Configurable CORS origins for local dev and production
cors_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000")
allow_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok", "service": "Project Brain AI"}

from app.routes import assistant

# Include assistant router at both /assistant and /api/assistant for flexible client compatibility
app.include_router(assistant.router)
app.include_router(assistant.router, prefix="/api")
