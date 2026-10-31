"""Initial Phase 1 schema.

Revision ID: 0001_initial_phase1
Revises:
Create Date: 2026-10-31
"""

from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0001_initial_phase1"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable pgvector (requires appropriate database permissions).
    op.execute("CREATE EXTENSION IF NOT EXISTS vector;")

    # --- users ---
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=True),
        sa.Column("role", sa.String(50), nullable=True, server_default="member"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # --- projects ---
    op.create_table(
        "projects",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("status", sa.String(50), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_projects_user_id", "projects", ["user_id"])

    # --- repositories ---
    op.create_table(
        "repositories",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=True),
        sa.Column("clone_url", sa.String(1024), nullable=True),
        sa.Column("default_branch", sa.String(100), nullable=True, server_default="main"),
        sa.Column("encrypted_access_credential_ref", sa.String(512), nullable=True),
        sa.Column("last_synced_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("sync_status", sa.String(50), nullable=True, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_repositories_project_id", "repositories", ["project_id"])

    # --- documents ---
    op.create_table(
        "documents",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(512), nullable=False),
        sa.Column("file_path", sa.String(1024), nullable=True),
        sa.Column("file_size", sa.BigInteger(), nullable=True),
        sa.Column("mime_type", sa.String(255), nullable=True),
        sa.Column("status", sa.String(50), nullable=True, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_documents_project_id", "documents", ["project_id"])
    # --- chunks (existing table handled safely) ---
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS chunks (
            id TEXT PRIMARY KEY,
            project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
            document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
            repository_id UUID REFERENCES repositories(id) ON DELETE SET NULL,
            type TEXT,
            text TEXT,
            source_url TEXT,
            author TEXT,
            date DATE,
            linked_ids TEXT[],
            files TEXT[],
            embedding vector(384)
        );
        """
    )
    op.execute("ALTER TABLE chunks ADD COLUMN IF NOT EXISTS project_id UUID;")
    op.execute("ALTER TABLE chunks ADD COLUMN IF NOT EXISTS document_id UUID;")
    op.execute("ALTER TABLE chunks ADD COLUMN IF NOT EXISTS repository_id UUID;")
    op.execute("ALTER TABLE chunks ADD COLUMN IF NOT EXISTS embedding vector(384);")

    op.execute(
        """
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chunks_project_id_fkey') THEN
            ALTER TABLE chunks ADD CONSTRAINT chunks_project_id_fkey
              FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chunks_document_id_fkey') THEN
            ALTER TABLE chunks ADD CONSTRAINT chunks_document_id_fkey
              FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chunks_repository_id_fkey') THEN
            ALTER TABLE chunks ADD CONSTRAINT chunks_repository_id_fkey
              FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE SET NULL;
          END IF;
        END $$;
        """
    )

    op.execute("CREATE INDEX IF NOT EXISTS ix_chunks_project_id ON chunks (project_id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_chunks_document_id ON chunks (document_id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_chunks_repository_id ON chunks (repository_id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_chunks_type ON chunks (type);")
    op.execute("CREATE INDEX IF NOT EXISTS chunks_embedding_hnsw_idx ON chunks USING hnsw (embedding vector_cosine_ops);")

    # --- graph_nodes ---
    op.create_table(
        "graph_nodes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=True),
        sa.Column("name", sa.String(255), nullable=True),
        sa.Column("label", sa.String(255), nullable=True),
        sa.Column("type", sa.String(100), nullable=True),
        sa.Column("properties", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_graph_nodes_project_id", "graph_nodes", ["project_id"])

    # --- graph_edges ---
    op.create_table(
        "graph_edges",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=True),
        sa.Column("source_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("graph_nodes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("target_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("graph_nodes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("relation_type", sa.String(100), nullable=True),
        sa.Column("properties", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_graph_edges_project_id", "graph_edges", ["project_id"])
    op.create_index("ix_graph_edges_source_id", "graph_edges", ["source_id"])
    # --- conversations ---
    op.create_table(
        "conversations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("projects.id", ondelete="SET NULL"), nullable=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("title", sa.String(512), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_conversations_project_id", "conversations", ["project_id"])

    # --- messages ---
    op.create_table(
        "messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("conversation_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role", sa.String(50), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("meta", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_messages_conversation_id", "messages", ["conversation_id"])


def downgrade() -> None:
    op.drop_index("ix_messages_conversation_id", table_name="messages")
    op.drop_table("messages")

    op.drop_index("ix_conversations_project_id", table_name="conversations")
    op.drop_table("conversations")

    op.drop_index("ix_graph_edges_target_id", table_name="graph_edges")
    op.drop_index("ix_graph_edges_source_id", table_name="graph_edges")
    op.drop_index("ix_graph_edges_project_id", table_name="graph_edges")
    op.drop_table("graph_edges")

    op.drop_index("ix_graph_nodes_project_id", table_name="graph_nodes")
    op.drop_table("graph_nodes")

    # Revert chunks additions (do not drop the chunks table itself).
    op.execute("DROP INDEX IF EXISTS chunks_embedding_hnsw_idx;")
    op.execute("DROP INDEX IF EXISTS ix_chunks_type;")
    op.execute("DROP INDEX IF EXISTS ix_chunks_repository_id;")
    op.execute("DROP INDEX IF EXISTS ix_chunks_document_id;")
    op.execute("DROP INDEX IF EXISTS ix_chunks_project_id;")
    op.execute("ALTER TABLE chunks DROP CONSTRAINT IF EXISTS chunks_repository_id_fkey;")
    op.execute("ALTER TABLE chunks DROP CONSTRAINT IF EXISTS chunks_document_id_fkey;")
    op.execute("ALTER TABLE chunks DROP CONSTRAINT IF EXISTS chunks_project_id_fkey;")
    op.execute("ALTER TABLE chunks DROP COLUMN IF EXISTS repository_id;")
    op.execute("ALTER TABLE chunks DROP COLUMN IF EXISTS document_id;")
    op.execute("ALTER TABLE chunks DROP COLUMN IF EXISTS project_id;")

    op.drop_index("ix_documents_project_id", table_name="documents")
    op.drop_table("documents")

    op.drop_index("ix_repositories_project_id", table_name="repositories")
    op.drop_table("repositories")

    op.drop_index("ix_projects_user_id", table_name="projects")
    op.drop_table("projects")

    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")