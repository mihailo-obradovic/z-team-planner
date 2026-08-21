# app/ — Laravel application core

Reference sample for a fictional project — **Roster**, a community sports-club membership app on the laravel + nuxt pairing. Not a real project; illustrative only. A folder-scoped document is an orientation map (what lives where + pointers into `catalyst/`), never global rules or feature contracts.

The Laravel 13 (PHP 8.3) application namespace. The API is JSON-only — no Blade UI, no guest redirects; the Nuxt SPA in `web/` is the only consumer.

Entry points live outside this folder: routes in `routes/api.php` and `routes/web.php` (session-auth endpoints), framework wiring in `bootstrap/app.php` (JSON-only rendering, middleware aliases), config in `config/`. Tests live in `tests/` (Pest 5: `Feature/` with `RefreshDatabase`, `Unit/` plain).

Paths below are relative to the repo root. The `catalyst/` documents are normative for how this code is written; this file only says what lives where.

## Structure

- `Enums/Role.php` — persisted member roles (backed enum, `member`/`admin`); values are stored in the database.
- `Http/Controllers/` — thin controllers; `Auth/` holds the Breeze-style session controllers (register, login, logout, password reset, email verification).
- `Http/Middleware/EnsureUserIsAdmin.php` — the `admin` route alias.
- `Http/Requests/` — FormRequests own validation and authorization.
- `Http/Resources/UserResource.php` — API response shaping (the `{ data: ... }` envelope).
- `Models/User.php` — Eloquent model using PHP attribute casts.
- `Notifications/` — password-reset and email-verification notifications, queued.
- `Providers/AppServiceProvider.php` — app-level bindings.

## Governing documents

- Controllers, FormRequests, Resources, routes → `catalyst/stacks/backend/laravel/http-layer.md`
- Models, enums, migrations, persistence → `catalyst/stacks/backend/laravel/models.md`
- Session auth flow (Sanctum stateful SPA) → `catalyst/stacks/backend/laravel/auth/sanctum-session.md`
- Testing (Pest 5) → `catalyst/stacks/backend/laravel/testing.md`
- Module overview and runtime bindings → `catalyst/stacks/backend/laravel/laravel.md`

## Local invariants

- Validation and authorization live in FormRequests, not controllers; responses go through Resources.
- Async work (queued notifications) uses Laravel's built-in queue (database driver) — there is no separate worker deployable.
- The public API surface, the session/auth contract, and the DB schema are protected areas — declared in `catalyst/architecture.md` (Protected Areas); state impact and get explicit agreement before touching them.
