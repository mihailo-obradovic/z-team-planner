# Operations Runbook (Example)

Worked example of `operations.md` for the fictional QA automation platform. Per the Operations Runbook rule, a project with stateful infrastructure keeps one — a section per component, three parts each: **Operate** (paste-ready inspection commands), **Recovery** (the drill, with the date it was last actually performed), **Quirks** (traps that already bit someone). Rules and contracts never live here — only how to run what is already built.

## PostgreSQL

### Operate

```bash
docker compose exec postgres pg_isready -U qa
docker compose exec postgres psql -U qa -d qa      # interactive psql
docker compose exec api alembic current            # migration revision
```

### Recovery

Nightly `pg_dump` to object storage; restore rehearsed on a scratch instance **2026-05-30** (12 min, row counts matched). Repeat after any material schema change.

### Quirks

- Migrations run manually, never on container start: a fresh stack answers health but serves an empty schema until `alembic upgrade head` runs.

## Broker + worker pool

### Operate

```bash
docker compose exec broker redis-cli ping          # PONG
docker compose exec broker redis-cli llen jobs     # backlog depth
docker compose logs -f worker                      # live job execution
```

### Recovery

AOF enabled, so a broker restart keeps queued jobs; tasks are idempotent, so a worker crash mid-run is re-executed safely. Formal drill not yet run.

### Quirks

- A stuck browser session pins a worker at `--concurrency=1`; a job past its soft time limit is killed and redriven, not left hanging.
