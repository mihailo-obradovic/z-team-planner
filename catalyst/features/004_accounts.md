# Feature: Accounts

## Status

Active

## Task Weight

Hard

## Purpose

A build saved in one browser is lost to a cleared cache and invisible from another device. Signing in with Google gives a player an account their builds attach to — nothing else changes: anonymous planning, local saves and `?build=` snapshot links stay exactly as they are (feature 001). This feature is the identity, profile and deletion half of that; the builds themselves are feature 005.

## Inputs

| Input                     | Type                          | Source                             | Constraints                                                                           |
| ------------------------- | ----------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------- |
| Firebase ID token         | `Authorization: Bearer <jwt>` | browser, per request               | RS256; `iss` `https://securetoken.google.com/<project>`, `aud` `<project>`; ≤ 1 h old |
| Google sign-in            | popup                         | header **Sign in** button          | `signInWithPopup(GoogleAuthProvider)`; the only provider                              |
| delete confirmation       | UI event                      | profile menu → **Delete account**  | confirm dialog naming the build count                                                 |
| first-login import choice | UI event                      | one-time offer after first sign-in | which local builds to keep; at most 50 per import                                     |

## Outputs And Side Effects

| Output / Side Effect | Type            | Description                                                                                        |
| -------------------- | --------------- | -------------------------------------------------------------------------------------------------- |
| `users` row          | Postgres insert | upserted on the first authenticated request; the six fields under Business Rules                   |
| `GET /api/v1/me`     | JSON            | `{ display_name, email, created_at, build_count }`                                                 |
| `DELETE /api/v1/me`  | `204`           | deletes the row, every build (feature 005), and the Firebase user; immediate                       |
| auth state           | client store    | `unknown → anonymous \| signed-in`, driving the header and the build manager                       |
| local builds offer   | UI              | after the first sign-in on a browser holding local builds: import some, all, or none (feature 005) |

## Scope And Non-Goals

In scope:

- Google sign-in and sign-out; the tri-state auth store; the header's signed-out / signed-in presentation.
- The user record, its personal-data declaration, and self-service deletion across both systems.
- The profile endpoint and the one-time first-login offer to import local builds.

Non-goals:

- Any other sign-in method — Apple (cost), email + password (mail pipeline). Backlog items exist for both.
- Editable profile fields, avatars, display names other than Google's.
- Roles, admin surfaces, or any permission beyond "owns their own builds".
- Requiring an account for anything that works anonymously today.
- Import semantics — name collisions between a kept local build and an existing account build, renaming, per-item outcomes — are feature 005's; this feature only shows the offer.

## User / System Behavior

- On load the header renders a reserved slot; the store starts `unknown` and resolves to `anonymous` or `signed-in` once the Firebase SDK reports, so the prerendered page never shows a wrong button (Safari's redirect fallback included). With no API base URL configured it never resolves at all, so the control is not rendered rather than holding a slot forever.
- Anonymous: the slot shows **Sign in**; the build manager keeps a hint — "Sign in to keep your builds stored securely" — beside its local controls. Nothing is gated.
- Signing in opens Google's popup; on success the store flips to `signed-in`, the first request carrying the token upserts the `users` row, and the header shows the display name with a menu: **My builds**, **Sign out**, **Delete account**.
- First sign-in on a browser holding local builds: the offer lists them with checkboxes (all selected), **Keep selected** / **Not now**. Kept builds are sent to feature 005's import endpoint; local copies are untouched either way. The offer is **answered** once per browser (a localStorage flag), never again — answered meaning dismissed, or kept with the import accepted. An import that fails leaves the offer open and unspent, so a moment offline does not cost the player the one chance this browser gets to make it.
- Sign-out clears the store and the token; local builds remain and the page stays usable.
- Delete account: the confirm dialog says how many account builds go with it; on confirm the API deletes everything, the client signs out, and a toast confirms. Share links to those builds answer 404 from then on.
- A request that answers `401` is retried once after a forced token refresh; a second `401` signs the user out locally with a toast.

## Roles And Access

One role, **user** — plus the anonymous visitor.

| Resource / action                    | Anonymous | User (own) | User (other's) |
| ------------------------------------ | --------- | ---------- | -------------- |
| plan, save locally, `?build=` links  | ✓         | ✓          | —              |
| read a build by id (feature 007)     | ✓         | ✓          | ✓              |
| list / create / edit / delete builds | —         | ✓          | 404            |
| import local builds                  | —         | ✓          | —              |
| `GET /me`, `DELETE /me`              | —         | ✓          | —              |

Walkthrough — anonymous sees today's app plus a Sign in button and the hint. A user sees the same app, their name in the header, the profile menu, and build controls that save to the account. There is no admin.

## Examples

| Input                                                   | Expected Output                                                      | Notes                                   |
| ------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------- |
| load `/` signed out                                     | header slot empty until the SDK reports, then **Sign in**            | no layout shift                         |
| sign in with a Google account never seen before         | `users` row created; header shows the name                           | upsert on first request                 |
| sign in again from another device                       | same row, `last_seen_at` updated, builds listed                      | keyed on `firebase_uid`                 |
| request with no `Authorization` header to `GET /me`     | `401`, `WWW-Authenticate: Bearer`                                    |                                         |
| request with an expired token                           | `401`; client refreshes and retries once → `200`                     |                                         |
| token minted for another Firebase project               | `401`                                                                | audience check                          |
| `DELETE /me` with 3 account builds                      | `204`; builds gone; their share links `404`; Firebase user deleted   | then the client signs out               |
| sign in after deleting the account                      | a fresh row, zero builds                                             | Firebase user was deleted too           |
| first sign-in with 4 local builds, keep 2               | 2 account builds created; 4 local builds still present               | offer never shown again on this browser |
| **Keep selected**, the import fails                     | dialog stays open; offer returns on the next sign-in                 | answered, not merely attempted          |
| first sign-in with 0 local builds                       | no offer                                                             |                                         |
| `FIREBASE_AUTH_EMULATOR_HOST` set, `APP_ENV=production` | API refuses to start                                                 | emulator tokens are unsigned            |
| Firebase unreachable, valid token in hand               | API keeps validating offline until `exp`; sign-in fails with a toast | no outage-time data loss                |

## Business Rules

- Identity is Firebase Authentication (Spark plan, Google only — decision 004). The backend validates every token for signature, time bounds, issuer **and** audience through `firebase-admin`; `check_revoked` stays off.
- The `users` row: `firebase_uid` (key), `google_sub` (captured from `firebase.identities` at first sight), `email`, `display_name`, `created_at`, `last_seen_at`. Copied, not read per request.
- **Personal data declaration** — fields: the six above. Lawful basis: the user's request for an account (contract). Classification: personal. Retention: until the user deletes the account; a deleted row persists only in the encrypted nightly backups, which are pruned after **30 days**. Non-production environments hold no real user rows — the Firebase emulator and fixture users only.
- `403` never leaks ownership: a build the caller does not own answers `404`.
- `display_name` mirrors Google and is not editable; no avatar is stored.
- The first-login offer caps at 50 builds and sends an `Idempotency-Key`; the endpoint's contract is feature 005's.
- CORS allowlist from configuration, deny-by-default, no credentials.

## Edge Cases

- Google account with no display name → `display_name` falls back to the email's local part.
- A user's Google email changes → the row updates on the next sign-in (the key is the uid, not the email).
- Deletion while a share link is open in another tab → that tab's next request answers 404; the viewer sees "this build no longer exists".
- Sign-in popup blocked by the browser → toast explaining it, no redirect fallback.
- Apple's Hide-My-Email relays do not apply (no Apple sign-in).

## Invariants

- No action that works anonymously today ever requires an account.
- The Firebase uid is the only join key between the two systems; the stored `google_sub` keeps the user table portable to another provider.
- Deletion is total across both systems in one request; there is no soft-delete state.
- The API never starts with the emulator variable set outside development.

## Error Handling

- `401` — missing, malformed, expired, wrong-issuer, wrong-audience or badly signed token. `403` — valid token, disallowed action. `404` — a build the caller does not own, or a deleted one.
- Firebase Admin unreachable during `DELETE /me` → `503`, nothing deleted (the Firebase deletion runs first; the row and builds go only after it succeeds).
- All errors through the central handlers; shapes per feature 005's error schema.

## Entry Points

- `app/auth/` — `get_current_user` dependency, `CurrentUser`, the emulator guard in `core/config.py`.
- `app/routes/me.py`, `app/services/users.py`, `app/models/user.py` — the profile and deletion path.
- `web/plugins/firebase.client.ts`, `web/stores/useAuthStore.ts` — SDK init and the tri-state store.
- `web/components/_shared/` — the header slot, profile menu, delete dialog, first-login offer.

## Dependencies

- Feature 005 (account builds): the import endpoint, the deletion cascade, `build_count`.
- Feature 001: its Non-goals line "server-side storage or accounts" is retired in the same change as this feature's implementation.
- `operations.md`, Firebase section: export/import commands, the outage and exit notes.
- Firebase project provisioned (map task): web config in public runtime config, service-account JSON in the API's environment.

## Open Questions

## Tests

- `tests/auth/test_get_current_user.py`: the six `401` cases, a valid token, the emulator guard at startup.
- `tests/routes/test_me.py`: upsert on first request, `GET /me` shape, `DELETE /me` cascade and Firebase-first ordering, `503` when Firebase is unreachable — against a real Postgres (testcontainers) and the Firebase emulator.
- `test/nuxt/auth.test.ts`: tri-state store transitions, the 401-refresh-retry-then-sign-out path, the first-login offer answered once, and a failed import leaving it unspent.

## Verification

By test: the six `401` cases and the emulator guard; `/me`'s shape and scoped `build_count`; `DELETE /me`'s cascade, its `503` with nothing deleted, and Firebase-before-row ordering; the popup outcomes; the store and the `401` refresh-retry.

In a browser on 2026-08-26 against the API, the Neon dev branch and the Auth emulator: the signed-out header resolved to **Sign in** with no reflow; a never-seen account created its row with `google_sub` captured; the offer kept 2 of 4 local builds, left all 4 local, and never returned; **Delete account** named the count, answered `204`, took both builds and the Firebase user, and turned a live share link into a `404`; signing in again gave a fresh row, no builds, and the email's local part as the name. At 320px the header fits the viewport and the sign-in glyph is 44 × 44.

Answered-once, in a browser on 2026-08-29: offline, the import failed and the dialog stayed open with the flag unspent; back online the retry succeeded and spent it. Sign-out cleared the previous account's builds, and a second account saw only its own.

Two defects older than this feature were fixed first: emulator mode reached for Application Default Credentials, and `FIREBASE_AUTH_EMULATOR_HOST` never left `Settings`. Not walked live: a Firebase outage, or a real Google consent screen.

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
