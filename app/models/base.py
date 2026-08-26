"""The declarative base every model inherits, and the metadata Alembic diffs against.

It lives in its own module rather than in the package `__init__`: the package imports each
model so Alembic sees them all, and a model importing `Base` back from the package would be
a circular import.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """The metadata Alembic autogenerates against."""
