# Folder-Scoped Documents

**Trigger:** a distinct subsystem (backend service, frontend app, worker) that has grown enough to need its own orientation map. Not for small folders.

**An invariant stated here is reconciled against the feature contracts before it is written** — "the auth store has one writer, and one documented exception" is right where the exception is a rule some contract already states, and wrong the moment it is a rule this document invented. A folder document describes what the contracts already decided; where the two disagree it is this one that is wrong.

Such a subsystem may carry its own `CLAUDE.md`/`AGENTS.md`: a 40–80 line orientation map — what the folder is and its stack, structure, local conventions, data flow, local invariants and protected areas, entry points. Never global rules, stack-wide policy, or feature contracts. Where a bundle document governs the folder (component naming, type placement, catalog hygiene, …), the folder document carries a pointer line into `catalyst/` rather than restating the rules — seeded at bootstrap or brownfield adoption (`workflows/bootstrap.md` step 5). Keep its entry points and protected areas in sync in the same change. Protections declared in a folder document are not indexed in `project-summary.md`; the document is in context whenever its folder is worked on.

The shape, for a backend folder:

```markdown
# app/ — Laravel application core

The application namespace. The API is JSON-only; the SPA in `web/` is the only consumer.
Entry points live outside this folder: routes in `routes/api.php`, wiring in `bootstrap/app.php`, tests in `tests/`.

## Structure

- `Http/Controllers/` — thin controllers; `Auth/` holds the session controllers.
- `Http/Requests/` — FormRequests own validation and authorization.
- `Models/User.php` — Eloquent model using attribute casts.

## Governing documents

- Controllers, FormRequests, Resources, routes → `catalyst/stacks/backend/laravel/http-layer.md`
- Session auth flow → `catalyst/stacks/backend/laravel/auth/sanctum-session.md`

## Local invariants

- Validation and authorization live in FormRequests, not controllers.
- The public API surface and the session contract are protected areas (`catalyst/architecture.md`).
```
