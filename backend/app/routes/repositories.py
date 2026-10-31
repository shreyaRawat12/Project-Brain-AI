"""Repository connection and metadata routes."""

from __future__ import annotations

from typing import Optional
from urllib.parse import urlparse
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies.auth import get_current_user
from ..dependencies.projects import get_owned_project
from ..models.repository import Repository
from ..models.user import User
from ..schemas.repository import RepositoryCreate, RepositoryResponse

router = APIRouter(prefix="/projects/{project_id}/repositories", tags=["repositories"])


def _repository_metadata(payload: RepositoryCreate) -> tuple[str, Optional[str], str]:
    parsed = urlparse(payload.clone_url.strip())
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid repository URL.")

    path = parsed.path.strip("/")
    if path.endswith(".git"):
        path = path[:-4]

    parts = [part for part in path.split("/") if part]
    if len(parts) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Repository URL must include owner and repository name.",
        )

    owner, repo = parts[0], parts[1]
    name = payload.name.strip() if payload.name else repo
    full_name = payload.full_name.strip() if payload.full_name else f"{owner}/{repo}"
    clone_url = payload.clone_url.strip()
    if not clone_url.endswith(".git"):
        clone_url = clone_url.rstrip("/") + ".git"

    return name, full_name, clone_url


@router.get("", response_model=list[RepositoryResponse])
def list_repositories(
    project: object = Depends(get_owned_project),
    db: Session = Depends(get_db),
) -> list[Repository]:
    return (
        db.query(Repository)
        .filter(Repository.project_id == project.id)
        .order_by(Repository.created_at.desc())
        .all()
    )


@router.post("", response_model=RepositoryResponse, status_code=status.HTTP_201_CREATED)
def connect_repository(
    payload: RepositoryCreate,
    project: object = Depends(get_owned_project),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Repository:
    name, full_name, clone_url = _repository_metadata(payload)
    repository = Repository(
        project_id=project.id,
        name=name,
        full_name=full_name,
        clone_url=clone_url,
        default_branch=payload.default_branch or "main",
        sync_status="pending",
    )
    db.add(repository)
    db.commit()
    db.refresh(repository)
    return repository


@router.delete("/{repository_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_repository(
    repository_id: UUID,
    project: object = Depends(get_owned_project),
    db: Session = Depends(get_db),
) -> None:
    repository = db.get(Repository, repository_id)
    if repository is None or repository.project_id != project.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Repository not found.")
    db.delete(repository)
    db.commit()