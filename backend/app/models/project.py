"""Project model."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import String, Text, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="active")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow
    )

    user: Mapped[Optional["User"]] = relationship("User", back_populates="projects")
    repositories: Mapped[list["Repository"]] = relationship(
        "Repository", back_populates="project", cascade="all, delete-orphan"
    )
    documents: Mapped[list["Document"]] = relationship(
        "Document", back_populates="project", cascade="all, delete-orphan"
    )
    chunks: Mapped[list["Chunk"]] = relationship("Chunk", back_populates="project")
    conversations: Mapped[list["Conversation"]] = relationship(
        "Conversation", back_populates="project", cascade="all, delete-orphan"
    )
    graph_nodes: Mapped[list["GraphNode"]] = relationship(
        "GraphNode", back_populates="project", cascade="all, delete-orphan"
    )
    graph_edges: Mapped[list["GraphEdge"]] = relationship(
        "GraphEdge", back_populates="project", cascade="all, delete-orphan"
    )