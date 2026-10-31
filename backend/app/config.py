"""Centralized application configuration.

Settings are loaded from environment variables (and ``backend/.env``).
Secrets are never hardcoded or logged.
"""

from __future__ import annotations

from pathlib import Path
from typing import Optional

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/ directory (this file lives in backend/app/)
BACKEND_DIR = Path(__file__).resolve().parents[1]
ENV_FILE = BACKEND_DIR / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # Required
    DATABASE_URL: str

    # Optional / future use
    GEMINI_API_KEY: Optional[str] = None
    JWT_SECRET: Optional[str] = None
    STORAGE_PATH: str = "storage"

    @field_validator("DATABASE_URL")
    @classmethod
    def _validate_database_url(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("DATABASE_URL must be set")
        # Normalize common aliases without exposing credentials.
        value = value.strip()
        if value.startswith("postgres://"):
            value = "postgresql://" + value[len("postgres://"):]
        return value

    @field_validator("GEMINI_API_KEY")
    @classmethod
    def _validate_gemini_key(cls, value: Optional[str]) -> Optional[str]:
        # Presence check only; never log or echo the value.
        if value is not None and not value.strip():
            return None
        return value

    @property
    def storage_path(self) -> Path:
        path = Path(self.STORAGE_PATH)
        if not path.is_absolute():
            path = BACKEND_DIR / path
        return path


settings = Settings()