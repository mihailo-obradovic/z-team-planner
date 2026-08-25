# Stack: Database — PostgreSQL

**Layer:** Database
**Tool:** PostgreSQL

The default database module. It only names the tool — the persistence rules (versioned forward-only migrations, transaction boundaries, database-enforced invariants, tested backups) are Universal Rules and are not restated here.

- PostgreSQL is the operational database.
- The migration _tool_ lives with the backend language, not here: the pairing table below names it per backend. A different backend module brings its own migration tool against the same PostgreSQL.
- Integration tests run against a real PostgreSQL, never a SQLite stand-in (Testing, Universal Rules); the backend module names the test harness.
- Time-series storage is still this PostgreSQL — Timescale is a PostgreSQL extension, not a separate engine.

## Backend Pairings

The engine stays language-neutral; the language-side pairing lives here so the chosen backend has a documented set. One row per backend module that exists — a new backend module adds its row when it lands.

| Backend          | Client                        | Migration tool | Test harness                |
| ---------------- | ----------------------------- | -------------- | --------------------------- |
| `python-fastapi` | SQLAlchemy (`psycopg` driver) | Alembic        | `pytest` + `testcontainers` |

## Approved Libraries

- PostgreSQL.
