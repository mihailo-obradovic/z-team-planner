"""SQLAlchemy models.

Importing this package registers every table on `Base.metadata`, which is what Alembic's
`env.py` diffs against — a model that is not imported here is invisible to autogenerate.
"""

from app.models.base import Base
from app.models.user import User

__all__ = ["Base", "User"]
