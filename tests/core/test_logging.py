"""The shared log line format, asserted character by character."""

import logging

import pytest

from app.core.logging import NO_REQUEST_ID, CatalystFormatter, request_id_var


def _record(
    *, name: str = "orders.service", level: int = logging.INFO, msg: str = "message"
) -> logging.LogRecord:
    record = logging.LogRecord(name, level, "/x.py", 1, msg, None, None)
    # * Pinned instant: 2026-07-03T08:31:35.123Z, the example in architecture.md.
    record.created = 1783067495.123
    record.msecs = 123.0
    return record


@pytest.fixture(autouse=True)
def _reset_request_id():
    token = request_id_var.set(None)
    yield
    request_id_var.reset(token)


def test_matches_the_documented_line(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("TZ", "UTC")
    request_id_var.set("59e3cc")
    line = CatalystFormatter("api").format(_record())
    assert (
        line
        == "[2026-07-03T08:31:35.123Z] [INFO] [api] [orders.service] [req 59e3cc] message"
    )


def test_without_request_context_logs_a_dash() -> None:
    line = CatalystFormatter("api").format(_record())
    assert f"[req {NO_REQUEST_ID}]" in line
    assert line.endswith("[req -] message")


def test_milliseconds_are_zero_padded() -> None:
    record = _record()
    record.msecs = 7.0
    assert ".007Z]" in CatalystFormatter("api").format(record)


def test_level_and_service_name_are_fields() -> None:
    line = CatalystFormatter("worker").format(_record(level=logging.WARNING))
    assert "[WARNING] [worker]" in line


def test_exception_is_appended_not_inlined() -> None:
    try:
        raise ValueError("boom")
    except ValueError:
        import sys

        record = _record(level=logging.ERROR)
        record.exc_info = sys.exc_info()
    line = CatalystFormatter("api").format(record)
    assert line.splitlines()[0].endswith("message")
    assert "ValueError: boom" in line
