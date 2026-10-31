"""Document upload and metadata routes."""

from __future__ import annotations

import shutil
import uuid
from pathlib import Path
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..dependencies.auth import get_current_user
from ..dependencies.projects import get_owned_project
from ..models.document import Document
from ..models.user import User
from ..schemas.document import DocumentResponse

router = APIRouter(prefix="/projects/{project_id}/documents", tags=["documents"])

MAX_UPLOAD_BYTES = 25 * 1024 * 1024


def _safe_filename(filename: str | None) -> str:
    if not filename:
        return "upload"
    name = Path(filename).name.strip()
    if not name or name in {".", ".."}:
        return "upload"
    return name[:255]


@router.get("", response_model=list[DocumentResponse])
def list_documents(
    project: object = Depends(get_owned_project),
    db: Session = Depends(get_db),
) -> list[Document]:
    return (
        db.query(Document)
        .filter(Document.project_id == project.id)
        .order_by(Document.created_at.desc())
        .all()
    )


@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    project: object = Depends(get_owned_project),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Document:
    original_name = _safe_filename(file.filename)
    destination_dir = settings.storage_path / "projects" / str(project.id) / "documents"
    destination_dir.mkdir(parents=True, exist_ok=True)
    destination = destination_dir / f"{uuid.uuid4().hex}_{original_name}"

    size = 0
    try:
        with destination.open("wb") as output:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                if size + len(chunk) > MAX_UPLOAD_BYTES:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="File exceeds the 25MB upload limit.",
                    )
                output.write(chunk)
                size += len(chunk)
    except HTTPException:
        destination.unlink(missing_ok=True)
        raise
    except Exception as exc:
        destination.unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to store uploaded file.",
        ) from exc
    finally:
        await file.close()

    document = Document(
        project_id=project.id,
        name=original_name,
        file_path=str(destination),
        file_size=size,
        mime_type=file.content_type,
        status="uploaded",
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: UUID,
    project: object = Depends(get_owned_project),
    db: Session = Depends(get_db),
) -> None:
    document = db.get(Document, document_id)
    if document is None or document.project_id != project.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    db.delete(document)
    db.commit()