"""Chunk model.

Preserves compatibility with the existing ``chunks`` table used by the RAG
retrieval code. The primary key remains ``TEXT`` to avoid breaking existing
chunk ids. ``project_id`` is nullable to support a safe migration of legacy
rows that predate multi-project scoping.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime, timezone
from typing import Optional, List

from sqlalchemy import String, Text, Date, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from pgvector.sqlalchemy import Vector

from ..database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Chunk(Base):
    __tablename__ = "chunks"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    project_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    document_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    repository_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("repositories.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    type: Mapped[Optional[str]] = mapped_column(String, nullable=True, index=True)
    text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    source_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    author: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    linked_ids: Mapped[Optional[List[str]]] = mapped_column(ARRAY(String), nullable=True)
    files: Mapped[Optional[List[str]]] = mapped_column(ARRAY(String), nullable=True)
    embedding: Mapped[Optional[List[float]]] = mapped_column(Vector(384), nullable=True)

    project: Mapped[Optional["Project"]] = relationship("Project", back_populates="chunks")
    document: Mapped[Optional["Document"]] = relationship("Document", back_populates="chunks")
    repository: Mapped[Optional["Repository"]] = relationship(
        "Repository", back_populates="chunks"
    )

    __table_args__ = (
        Index("ix_chunks_project_id", "project_id"),
        Index("ix_chunks_document_id", "document_id"),
        Index("ix_chunks_repository_id", "repository_id"),
        Index("ix_chunks_type", "type"),
    )