"""The project-wide log line format and the request-id context."""

import logging
import logging.config
from contextvars import ContextVar
from datetime import UTC, datetime
from typing import Any

from app.core.config import Settings

# * Lives here rather than in the middleware so any module can read the current request id without importing transport code — dependencies point one way (architecture.md, Layering).
request_id_var: ContextVar[str | None] = ContextVar("request_id", default=None)

# * Records with no request context log `[req -]` (architecture.md, Logging Format And Request Tracing).
NO_REQUEST_ID = "-"


class CatalystFormatter(logging.Formatter):
    """Emits the one shared line format, e.g.

    `[2026-07-03T08:31:35.123Z] [INFO] [api] [orders.service] [req 59e3cc] message`
    """

    def __init__(self, service_name: str) -> None:
        super().__init__()
        self._service_name = service_name

    def format(self, record: logging.LogRecord) -> str:
        moment = datetime.fromtimestamp(record.created, UTC)
        stamp = f"{moment.strftime('%Y-%m-%dT%H:%M:%S')}.{int(record.msecs):03d}Z"
        request_id = request_id_var.get() or NO_REQUEST_ID
        line = (
            f"[{stamp}] [{record.levelname}] [{self._service_name}] "
            f"[{record.name}] [req {request_id}] {record.getMessage()}"
        )
        if record.exc_info:
            line = f"{line}\n{self.formatException(record.exc_info)}"
        return line


def configure_logging(settings: Settings) -> None:
    """Install the shared format on the root logger and on uvicorn's own loggers."""
    formatter: dict[str, Any] = {
        "()": CatalystFormatter,
        "service_name": settings.service_name,
    }
    logging.config.dictConfig(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {"catalyst": formatter},
            "handlers": {
                "stdout": {
                    "class": "logging.StreamHandler",
                    "formatter": "catalyst",
                    "stream": "ext://sys.stdout",
                }
            },
            "root": {"handlers": ["stdout"], "level": settings.log_level},
            "loggers": {
                # * Without explicit entries uvicorn keeps its own handlers and prints in its own format, so "one shared line format across all services" would hold for our lines only.
                "uvicorn": {
                    "handlers": ["stdout"],
                    "level": settings.log_level,
                    "propagate": False,
                },
                "uvicorn.error": {
                    "handlers": ["stdout"],
                    "level": settings.log_level,
                    "propagate": False,
                },
                # * uvicorn.access is silenced: it runs outside the request contextvar, so its line cannot carry [req ...]. RequestLoggingMiddleware emits the access line instead.
                "uvicorn.access": {
                    "handlers": ["stdout"],
                    "level": "WARNING",
                    "propagate": False,
                },
            },
        }
    )
