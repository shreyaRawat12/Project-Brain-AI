import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# NOTE: This file is owned by the team leader.
load_dotenv()

app = FastAPI(title="Project Brain AI")

# Configurable CORS origins for local dev and production
cors_origins_env = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174,http://localhost:3000",
)
allow_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]
for dev_origin in ["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"]:
    if dev_origin not in allow_origins:
        allow_origins.append(dev_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

from app.routes import assistant, auth, documents, projects, repositories
app.include_router(assistant.router)
app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(projects.router)
app.include_router(repositories.router)
