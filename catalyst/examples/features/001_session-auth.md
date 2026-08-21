# Feature: Session Auth Flow

Reference sample for a fictional project — **Roster**, a community sports-club membership app on the laravel + nuxt pairing. Not a real project; illustrative only.

## Status

Active

## Task Weight

Hard

## Purpose

Authenticate the Nuxt SPA against the Laravel API with Sanctum's stateful cookie mode: session cookies instead of stored tokens, CSRF-protected, JSON-only. Covers registration, login/logout, email verification, and password reset — everything in front of the session.

## Inputs

| Input                                          | Type       | Source                          | Constraints                                                             |
| ---------------------------------------------- | ---------- | ------------------------------- | ----------------------------------------------------------------------- |
| `name`, `email`, `password`(+`_confirmation`)  | strings    | `POST /register`                | name max 255; email lowercase/unique/max 255; password confirmed, min 8 |
| `email`, `password`                            | strings    | `POST /login`                   | required; 5 attempts per email+IP, then throttled                       |
| `email`                                        | string     | `POST /forgot-password`         | required, valid email                                                   |
| `token`, `email`, `password`(+`_confirmation`) | strings    | `POST /reset-password`          | token required; password confirmed, min 8                               |
| `id`, `hash` + signature                       | URL params | `GET /verify-email/{id}/{hash}` | signed URL (60 min), `throttle:6,1`, hash = sha1 of member email        |

## Outputs And Side Effects

| Output / Side Effect             | Type         | Description                                                                                                       |
| -------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------- |
| `204 No Content`                 | HTTP         | register, login, logout — no body; session rotation per Invariants                                                |
| `200 {"status": ...}`            | JSON         | forgot/reset password, resend verification (`verification-link-sent` / `already-verified`)                        |
| `GET /api/user` → `UserResource` | JSON         | `{ "data": ... }` envelope — `id, name, email, role, email_verified_at, created_at, updated_at` (password hidden) |
| Verify redirect                  | 302          | signed mail link hits the API, then bounces to `FRONTEND_URL/profile?verified=1`                                  |
| Queued mail                      | notification | `VerifyEmailNotification` (register + resend); `ResetPasswordNotification` — link points at the SPA               |

## Scope And Non-Goals

In scope: the endpoints above (all in `routes/web.php` except `GET /api/user`), Sanctum stateful mechanics, CSRF flow, the SPA's auth store/middleware/fetcher, verification and reset round-trips.

Non-goals: role gating (feature 002 owns the only `admin` gate); profile editing (feature 003); token-mode auth (dormant — see decision 003); "remember me" (accepted by `LoginRequest` but never sent by the SPA).

## User / System Behavior

- Registration creates the member, fires `Registered` (→ queued verification mail), and logs the member in.
- Login validates via the web guard; the SPA follows success with `GET /api/user` into the store (two-request flow). Failure is a 422 on `email`; the 6th failure in the window 422s with the throttle message. On logout the SPA resets the store.
- SPA boot (`auth-loader` plugin, awaited): `GET /sanctum/csrf-cookie` first, then `GET /api/user` into the store (failure → guest). Route middleware runs only after this settles.
- Route decisions (`authRedirectLogic`, default-deny): `/` → `/home` always; guests on any page not in the guest-only/shared lists → `/login`; logged-in members on guest-only pages (`/login`, `/register`, `/forgot-password`, `/password-reset/*`) → `/home`. No return-URL preservation.
- Fetcher: every request `credentials: 'include'` + JSON Accept; `X-XSRF-TOKEN` on state-changing methods; on 419 it re-primes the CSRF cookie and retries exactly once.
- Email verification: signed mail link hits the API, marks verified, bounces to `/profile?verified=1`; the profile page refetches and toasts. Password reset: SPA seeds email from the query, posts token+password, `/login` on success; a bad token 422s on `email`.

## Roles And Access

Not role-specific — no auth endpoint is role-gated; registration cannot set a role (DB default `member`). The `role` cast, `isAdmin()`, and the SPA's `isAdmin` getter are consumed by feature 002.

## Examples

| Input                                               | Expected Output                      | Notes                                                 |
| --------------------------------------------------- | ------------------------------------ | ----------------------------------------------------- |
| `POST /login` valid creds                           | 204, session regenerated             | SPA follows with `GET /api/user`                      |
| `POST /login` wrong password ×6                     | 422 ×5 on `email`, then throttle 422 | limiter clears on success                             |
| `GET /api/user` as guest (even without JSON Accept) | 401 JSON, never a redirect           | `redirectGuestsTo(null)` + forced JSON for `api/*`    |
| `GET /verify-email/{id}/{bad-hash}`                 | 403, still unverified                | signature/hash mismatch                               |
| `POST /forgot-password` unknown email               | 422 on `email`                       | leaks account existence — recorded, not smoothed over |

## Business Rules

- Stateful domains: `SANCTUM_STATEFUL_DOMAINS=localhost:3000,localhost:3001`; Sanctum guard `web`; sessions in the database (`SESSION_DRIVER=database`, lifetime 120 min, `SameSite=lax`, `SESSION_DOMAIN=localhost`).
- CORS (`config/cors.php`): credentialed, origins = `FRONTEND_URL` (+ `localhost:3001` in local/testing), fails closed when `FRONTEND_URL` unset; `verify-email/*` deliberately absent (browser navigation, not XHR).
- Same-site-lax works only because both origins share `localhost`; a cross-domain production split would need `SameSite=None; Secure`.

## Edge Cases

- An authenticated `POST /login` hits the `guest` middleware → 302 to `/`, which 404s (no welcome route). Untested.
- Resend-verification toast in the SPA is unconditional — an already-verified member is still told "Verification email sent" (server said `already-verified`; the status is discarded client-side).
- The `auth-loader` plugin catches only the user-fetch failure; an unreachable API at boot rejects the CSRF call uncaught.

## Invariants

- Auth state lives in the session cookie; the SPA store is memory-only and rehydrated from `GET /api/user` on every boot.
- Register/login/logout return `204 No Content` — no body for the SPA to parse.
- Every member-returning endpoint, `GET /api/user` included, wraps in `UserResource` — one `{ data: ... }` envelope for the whole API; the SPA parses payloads with `UserEnvelopeSchema`.
- Unauthenticated API requests always get 401 JSON, never a login redirect.
- Session ID rotates on login/register; session invalidates on logout.

**Protected area (declared here, indexed in `project-summary.md`):** the endpoint set and response contracts above (`routes/web.php` auth routes + `GET /api/user`), and the session/auth mechanics (cookie + CSRF flow, stateful domains, database sessions, JSON-only/no-redirect posture in `bootstrap/app.php`). The SPA's fetcher, store, and middleware all assume them.

## Error Handling

- 401 → JSON `{"message":"Unauthenticated."}`; SPA resets store + `/login`. 403 → SPA navigates `/home`. 419 → fetcher retries once after re-priming CSRF. 422 → inline in opted-in forms, toast otherwise.
- Login throttle: 422 with `auth.throttle` message; limiter clears on success.

## Entry Points

- Backend: `routes/web.php` (guest + auth groups), `routes/api.php` (`GET /api/user` via `AuthenticatedUserController`), `app/Http/Controllers/Auth/*`, `app/Http/Requests/Auth/LoginRequest.php` (rate limiting), `bootstrap/app.php` (statefulApi, no guest redirects, JSON rendering), `config/{sanctum,session,cors}.php`, `app/Notifications/*` (queued), `app/Providers/AppServiceProvider.php` (SPA reset-URL builder).
- SPA: `web/plugins/auth-loader.ts`, `web/middleware/auth.global.ts` + `web/utils/authRedirectLogic.ts`, `web/utils/{fetcher,handleApiError}.ts`, `web/stores/useAuthStore.ts`, `web/services/auth.api.ts` + `web/services/queries/useAuthQueries.ts`, pages `login`, `register`, `forgot-password`, `password-reset/[token]`.

## Dependencies

- Notifications implement `ShouldQueue`; `sync` (local default) sends inline, the `database` driver needs a running worker (`operations.md`).
- `FRONTEND_URL` drives CORS origins, the reset-link URL, and the verify bounce.
- Features 002/003 sit behind `auth:sanctum` and the store/fetcher established here.

## Open Questions

## Tests

- Backend: `tests/Feature/Auth/` — authentication (login happy/invalid/throttle, current-user envelope shape, guest 401, logout), registration (incl. default role), email verification, password reset happy paths.
- Frontend: `web/utils/authRedirectLogic.spec.ts` (guest redirects, reset-prefix match, authed on `/login`, default-deny, root alias).
- Known gaps (recorded): CSRF/419 path (Laravel skips CSRF in tests), `auth-loader`, session rotation beyond auth state, authed `POST /login` 302, verification throttle, reset negative paths, forgot-password enumeration, `remember` flag; frontend store/fetcher/error-handling/query composables have no specs.

## Verification

Backend suite green: `php artisan test` passes including all auth tests; frontend redirect-logic specs pass. Endpoint table, config values, and redirect rules verified line-by-line against the source. `route:cache` succeeds.

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
