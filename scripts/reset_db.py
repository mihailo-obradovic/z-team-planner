"""Drop the schema and migrate back up — the development reset.

    uv run python -m scripts.reset_db --yes

There are no volumes to clear on a managed database, so this is the equivalent of the
"services down, volumes cleared" reset the bootstrap flow asks for.
"""

import argparse
import logging
import sys

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, text

from app.core.config import Settings, get_settings
from app.core.logging import configure_logging

logger = logging.getLogger(__name__)


class RefusedError(RuntimeError):
    """Raised when the target environment is not a development one."""


def guard(settings: Settings) -> None:
    """Refuse anywhere but development.

    Two independent gates — this flag and `APP_ENV` — because the cost of being wrong is
    every row in the database.
    """
    if settings.app_env != "development":
        msg = (
            f"APP_ENV is {settings.app_env!r}. reset_db drops every table and runs only "
            "in development. Refusing."
        )
        raise RefusedError(msg)
    # ! The direct endpoint is the one with real DDL rights; make sure it is not pointed at something that merely looks local.
    if "-pooler." in settings.database_url_direct:
        msg = "DATABASE_URL_DIRECT points at the pooled endpoint. Refusing."
        raise RefusedError(msg)


def reset(settings: Settings) -> None:
    engine = create_engine(settings.database_url_direct)
    try:
        with engine.begin() as connection:
            logger.warning("Dropping schema public on %s", engine.url.host)
            connection.execute(text("DROP SCHEMA IF EXISTS public CASCADE"))
            connection.execute(text("CREATE SCHEMA public"))
    finally:
        engine.dispose()
    logger.info("Schema recreated; applying migrations")
    command.upgrade(Config("alembic.ini"), "head")
    logger.info("Reset complete")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Drop and rebuild the development schema."
    )
    parser.add_argument(
        "--yes",
        action="store_true",
        help="Confirm the drop. Without it the script does nothing.",
    )
    args = parser.parse_args(argv)

    settings = get_settings()
    configure_logging(settings)

    try:
        guard(settings)
    except RefusedError as exc:
        logger.error("%s", exc)
        return 2

    if not args.yes:
        logger.error("Refusing without --yes. This drops every table.")
        return 1

    reset(settings)
    return 0


if __name__ == "__main__":
    sys.exit(main())
