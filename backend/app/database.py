"""SQLAlchemy database configuration.

Provides the engine, session factory, declarative base and ``get_db``
dependency used throughout the application. Uses psycopg v3 (synchronous).
"""

from __future__ import annotations

from typing import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session

from .config import settings


def get_database_url() -> str:
    """Return a SQLAlchemy URL configured for psycopg v3."""
    url = settings.DATABASE_URL
    if url.startswith("postgresql://"):
        url = "postgresql+psycopg://" + url[len("postgresql://"):]
    elif url.startswith("postgres://"):
        url = "postgresql+psycopg://" + url[len("postgres://"):]
    return url


engine = create_engine(
    get_database_url(),
    pool_pre_ping=True,
    future=True,
)

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)

class Base(DeclarativeBase):
    """Declarative base for all SQLAlchemy models."""
    pass


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()