"""SQLAlchemy models.

Holds the declarative base only. The tables arrive with the features that own them:
`users` with feature 004, `builds` with feature 005.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """The metadata Alembic autogenerates against."""


__all__ = ["Base"]
