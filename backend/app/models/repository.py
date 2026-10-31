"""Repository model."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import String, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Repository(Base):
    __tablename__ = "repositories"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    clone_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    default_branch: Mapped[Optional[str]] = mapped_column(
        String(100), nullable=True, default="main"
    )
    # Secure credential metadata / reference only. Never store raw secrets.
    encrypted_access_credential_ref: Mapped[Optional[str]] = mapped_column(
        String(512), nullable=True
    )
    last_synced_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    sync_status: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True, default="pending"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow
    )

    project: Mapped["Project"] = relationship("Project", back_populates="repositories")
    chunks: Mapped[list["Chunk"]] = relationship("Chunk", back_populates="repository")