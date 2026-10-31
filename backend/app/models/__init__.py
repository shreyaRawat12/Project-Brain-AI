"""SQLAlchemy model registry.

Importing this package registers every model on ``Base.metadata`` so Alembic
and other tooling can discover the full schema.
"""

from ..database import Base
from .user import User
from .project import Project
from .repository import Repository
from .document import Document
from .chunk import Chunk
from .graph import GraphNode, GraphEdge
from .conversation import Conversation, Message

__all__ = [
    "Base",
    "User",
    "Project",
    "Repository",
    "Document",
    "Chunk",
    "GraphNode",
    "GraphEdge",
    "Conversation",
    "Message",
]