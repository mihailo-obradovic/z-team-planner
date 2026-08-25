# Stack: Backend — Python / FastAPI

**Layer:** Backend
**Tool:** Python 3.11+ · FastAPI · SQLAlchemy · Pydantic
**Requires:** _lang/python

The default backend module. Names the tools and binds the Universal Rules to them; it never restates a Universal Rule. Swap it for another backend module by decision record — the Universal Rules bind the replacement unchanged.

## Runtime

- Python 3.11+ — the module's floor, stated as `requires-python` (`../_lang/python/toolchain.md`).
- Prefer `async def` for request handlers and I/O-bound code.
- Migrations are Alembic (the migration tool follows the backend language, not the database) — see the Persistence module for the database itself.

## Structure

```text
Request → routes → services → repositories → DB
                      ↕            ↕
                  schemas/      models/
```

```text
app/
  core/          config, database, dependencies
  auth/          router, service, schemas, security
  models/        SQLAlchemy models
  schemas/       Pydantic DTOs — never inlined in routes
  repositories/  DB operations only, no business logic
  services/      business logic and transaction boundaries
  routes/        transport only, no business logic
  middleware/    logging, CORS
  exceptions/    custom handlers
  utils/         shared helpers (pagination)
```

- DB session only through a `get_db` dependency.
- Scaffold order: `core` → `models` (+ Alembic init) → `schemas` → `repositories` → `services` → `routes` → `auth` → wire in `main.py`.

## Tool Bindings

| Universal Rule                 | Implemented by                                                                                                                                                             |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Validation                     | Pydantic DTOs                                                                                                                                                              |
| Contracts                      | FastAPI OpenAPI; version in path (`/api/v1`)                                                                                                                               |
| Pagination                     | `page` / `page_size` query params                                                                                                                                          |
| Error handling                 | `HTTPException` + central exception handlers                                                                                                                               |
| Configuration                  | one `Settings` class in `core/config.py`                                                                                                                                   |
| Persistence                    | SQLAlchemy + Alembic                                                                                                                                                       |
| Async work                     | Celery producer via `send_task`; backend never defines tasks                                                                                                               |
| Job family isolation           | one Celery queue per family, one worker service per queue                                                                                                                  |
| Dead letter                    | `<queue>.dlq` queue or dead-letter table after the retry budget                                                                                                            |
| Logging                        | `logging` module                                                                                                                                                           |
| Observability                  | `/healthz`, `/readyz`, `/metrics` (Prometheus) on the API                                                                                                                  |
| Metrics under multiple workers | `prometheus_client` multiprocess mode (`PROMETHEUS_MULTIPROC_DIR` + `MultiProcessCollector`) — per-worker registries silently under-report behind gunicorn/uvicorn workers |
| Auth seam                      | `get_current_user`-style dependency; token scheme decided per project                                                                                                      |
| Tests                          | `pytest`; integration tests against the real database engine (the Persistence module's choice) via `testcontainers`                                                        |

## Approved Libraries

- FastAPI, SQLAlchemy, Pydantic, Alembic.
- `pytest` + `testcontainers`.
- `prometheus-client`.
- `polars` — columnar/dataframe work (pandas is not approved).

## Avoid By Default

Permitted by the rules, rejected here:

- ORM `lazy="joined"` as a global default; be explicit per query.
- Accepting Alembic autogenerate without reading the produced migration.
- Global mutable state and hidden static helpers.
