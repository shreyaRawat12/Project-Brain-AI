"""Graph node and edge models."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional, Any

from sqlalchemy import String, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class GraphNode(Base):
    __tablename__ = "graph_nodes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    label: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    properties: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_utcnow
    )

    project: Mapped[Optional["Project"]] = relationship(
        "Project", back_populates="graph_nodes"
    )
    outgoing_edges: Mapped[list["GraphEdge"]] = relationship(
        "GraphEdge",
        foreign_keys="GraphEdge.source_id",
        back_populates="source",
        cascade="all, delete-orphan",
    )
    incoming_edges: Mapped[list["GraphEdge"]] = relationship(
        "GraphEdge",
        foreign_keys="GraphEdge.target_id",
        back_populates="target",
        cascade="all, delete-orphan",
    )

    __table_args__ = (Index("ix_graph_nodes_project_id", "project_id"),)


class GraphEdge(Base):
    __tablename__ = "graph_edges"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    source_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("graph_nodes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    target_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("graph_nodes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    relation_type: Mapped[Optional[str]] = mapped_column(
        String(100), nullable=True, index=True
    )
    properties: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_utcnow
    )

    project: Mapped[Optional["Project"]] = relationship(
        "Project", back_populates="graph_edges"
    )
    source: Mapped["GraphNode"] = relationship(
        "GraphNode", foreign_keys=[source_id], back_populates="outgoing_edges"
    )
    target: Mapped["GraphNode"] = relationship(
        "GraphNode", foreign_keys=[target_id], back_populates="incoming_edges"
    )

    __table_args__ = (
        Index("ix_graph_edges_project_id", "project_id"),
        Index("ix_graph_edges_source_id", "source_id"),
        Index("ix_graph_edges_target_id", "target_id"),
    )