"""Document model."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import String, BigInteger, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(512), nullable=False)
    file_path: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    file_size: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    mime_type: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True, default="pending"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_utcnow
    )

    project: Mapped["Project"] = relationship("Project", back_populates="documents")
    chunks: Mapped[list["Chunk"]] = relationship("Chunk", back_populates="document")