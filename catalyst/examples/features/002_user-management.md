# Feature: User Management (Admin CRUD + RBAC)

Reference sample for a fictional project — **Roster**, a community sports-club membership app on the laravel + nuxt pairing. Not a real project; illustrative only.

## Status

Active

## Task Weight

Medium

## Purpose

Give admins full member lifecycle control — list, inspect, create (including minting admins), update, delete — behind a single role gate, while public registration and self-service stay role-blind. This is the only role-gated surface in the system.

## Inputs

| Input                         | Type        | Source                               | Constraints                                                                                          |
| ----------------------------- | ----------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `name`                        | string      | `POST/PUT/PATCH /api/users[/{user}]` | required on create, `sometimes` on update; max 255                                                   |
| `email`                       | string      | body                                 | required on create, `sometimes` on update; lowercase, valid, max 255, unique ignoring the bound user |
| `password` (+`_confirmation`) | string      | body                                 | required on create, optional on update; `confirmed`, min 8; omit key to keep current                 |
| `role`                        | string      | body                                 | `sometimes`; enum `member`/`admin`; create default `member`, update omission keeps current           |
| `{user}`                      | route param | URL                                  | implicit model binding → 404 JSON on unknown id                                                      |

## Outputs And Side Effects

| Output / Side Effect                                    | Type              | Description                                                                                                               |
| ------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/users` → `{ data: UserResource[], total: n }` | 200               | full table, `latest()` order (created_at DESC); no pagination/filtering/search; `total` = full count                      |
| `show`/`store`/`update` → `{ data: UserResource }`      | 200 / 201 (store) | fields: `id, name, email, role (string), email_verified_at, created_at, updated_at`                                       |
| `DELETE /api/users/{user}`                              | 204               | hard delete (no SoftDeletes); orphaned `sessions` rows are not cleaned up                                                 |
| Email change side effects                               | DB + queued mail  | shared `User::changeEmail()`: verification nulled + `VerifyEmailNotification` sent only when the address actually changed |

## Scope And Non-Goals

In scope: the `apiResource('users')` surface behind `auth:sanctum` + `admin`, the `Role` enum and its enforcement points, the admin SPA page `/users`.

Non-goals: self-service editing (feature 003 — separate contract with `current_password` and no `role`); auth endpoints (feature 001); permissions beyond the two-role enum (no policies exist); pagination (recorded gap, not implied behavior).

## User / System Behavior

- All five resource routes sit behind `auth:sanctum` (guests → 401 JSON) then `admin` (non-admins → 403 JSON `{"message":"Forbidden. Admin access required."}`); `UserRequest::authorize()` re-checks `isAdmin()` as a second gate.
- Create assigns name/email/password then `role = $data['role'] ?? Role::Member` by property assignment (deliberately bypassing the fillable list, which excludes `role`).
- Update is a true partial update: only present keys apply; email goes through `changeEmail()` (same-email resubmission is a no-op — no verification reset, no mail); role changes only when the key is present. No `current_password` challenge — an admin changes any password, including their own, with just a session (deliberate asymmetry vs feature 003).
- Delete: self-deletion is blocked with 422 `"You cannot delete your own account."`; deleting other members (including other admins) is permitted and hard.
- SPA (`web/pages/users.vue`, self-contained page): table of all members with role/verification badges; create/edit modal (one form, password optional in edit — key omitted when blank); delete confirmation dialog; per-row in-flight state; success toasts; 422s inline via Regle external errors. Query invalidation runs in `onSettled` on the `users` keys.
- Frontend access control is backend-driven: the nav link is hidden for non-admins (cosmetic), but the route has no admin middleware — a logged-in non-admin who navigates to `/users` mounts the page, gets 403 from the API, is toasted and bounced to `/home` by the central error handler.

## Roles And Access

| Resource/action                                                                        | Guest | Member | Admin                           |
| -------------------------------------------------------------------------------------- | ----- | ------ | ------------------------------- |
| `GET /api/users`, `GET /api/users/{id}`                                                | 401   | 403    | ✔                               |
| `POST /api/users` (incl. `role: admin`)                                                | 401   | 403    | ✔                               |
| `PUT/PATCH /api/users/{id}` (incl. role changes, passwords without `current_password`) | 401   | 403    | ✔                               |
| `DELETE /api/users/{id}`                                                               | 401   | 403    | ✔ (404 unknown id; 422 on self) |

Walkthroughs — Admin: sees the Members nav entry, full table, all actions; may edit their own row (including demoting themselves — see Edge Cases). Member: no nav entry; direct navigation to `/users` renders briefly, then 403 → toast + `/home`. Guest: `/users` → `/login` via default-deny route middleware (feature 001).

## Examples

| Input                                     | Expected Output               | Notes               |
| ----------------------------------------- | ----------------------------- | ------------------- |
| `POST /api/users` with `role: "admin"`    | 201, `data.role = "admin"`    | admins mint admins  |
| `POST /api/users` without `role`          | 201, `data.role = "member"`   | controller default  |
| `PUT /api/users/{id}` `{name, role}` only | 200, email/password untouched | partial update      |
| `DELETE /api/users/{own-id}`              | 422, row intact               | the only self-guard |
| `GET /api/users` as non-admin             | 403                           | member forbidden    |

## Business Rules

- Role storage: plain string column, DB default `'member'`, cast to `App\Enums\Role` (`member`/`admin` — the only two values). The backing values are persisted data: renaming one orphans stored rows and breaks `UserResource`, the SPA's `z.enum(['member','admin'])`, and role-badge rendering.
- Admin creation paths: only this endpoint (plus the seeder's factory `admin()` state for bootstrapping). Registration and profile cannot touch `role`.
- The SPA only ever sends PUT (never PATCH, though both are registered).

## Edge Cases

- Self-demotion is unguarded: `PUT /api/users/{own-id}` with `role: "member"` succeeds and immediately locks the caller out of this surface; nothing prevents demoting the last admin. Recorded as a real gap, not documented-as-intended.
- Sending `password: ""` fails min-length rather than clearing; the UI avoids it by omitting the key.
- `useFetchUser`/`GET /api/users/{id}` exist but no page consumes them.

## Invariants

- Every route in this surface stays behind `auth:sanctum` + `admin`; guests 401, non-admins 403.
- `role` never enters mass assignment — it is assigned explicitly and validated against the enum.
- Email changes here and in feature 003 share `changeEmail()` semantics: changed address ⇒ verification reset + one queued mail; same address ⇒ no-op.
- Responses stay in the `{ data: ... }` envelope (list adds `total`); the SPA parses with `UsersResponseSchema`/`UserEnvelopeSchema` and breaks loudly on shape drift.

**Protected area (declared here, indexed in `project-summary.md`):** the `apiResource('users')` surface — paths, methods, status codes, and the envelope/`total` response shapes above. The persisted `Role` enum values are covered by the DB-schema protection in `architecture.md`.

## Error Handling

- 401/403/404/422 as tabled above; validation errors are standard Laravel 422 `{errors:{...}}`, rendered inline in the modal; non-422 errors toast via the central handler.

## Entry Points

- `routes/api.php` (`apiResource` behind `['auth:sanctum','admin']`), `app/Http/Controllers/UserController.php`, `app/Http/Requests/UserRequest.php`, `app/Http/Middleware/EnsureUserIsAdmin.php`, `app/Enums/Role.php`, `app/Http/Resources/UserResource.php`.
- SPA: `web/pages/users.vue`, `web/services/user.api.ts`, `web/services/queries/useUserQueries.ts`, `web/layouts/Default.vue` (nav gating), `web/types/user.ts`.

## Dependencies

- Feature 001: session, 401-JSON posture, central 401/403 handling, `isAdmin` store getter.
- Feature 003: shares `changeEmail()` and `UserResource`; the two update contracts must not drift silently.
- Queued notifications (verification mail on admin-initiated email change).

## Open Questions

## Tests

- `tests/Feature/UserManagementTest.php` — list (count + `total`), non-admin 403, guest 401, create admin, create default role, partial update with role promotion, hard delete, self-delete 422. Plus 2 in `ProfileTest.php`: admin email change resets verification + sends mail; name-only edit doesn't.
- Known gaps (recorded): `show` wholly untested (incl. 404s); non-GET verbs untested for 401/403; the 403 body string unasserted; zero `UserRequest` validation-failure tests; password-change-without-`current_password` asymmetry unasserted; self-demotion & last-admin scenarios untested; `latest()` ordering unasserted; PATCH unexercised; post-delete orphan cleanup untested; frontend page/services/queries have no tests.

## Verification

Backend suite green: `php artisan test` passes including all user-management tests. Endpoint behavior, validation pivot, and role semantics verified line-by-line against controller/request/middleware source; SPA flow traced through `users.vue` and the query layer.

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
