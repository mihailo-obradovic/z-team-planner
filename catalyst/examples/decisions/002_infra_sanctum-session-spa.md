# Decision: Sanctum session-cookie auth for the SPA pairing

Reference sample for a fictional project — **Roster**, a community sports-club membership app on the laravel + nuxt pairing, sharing the fictional project of the feature and context samples. Not a real project; illustrative only.

## Status

Implemented

## Type

infra

## Task Weight

Medium

## Context

The Nuxt SPA authenticates against the Laravel API, and Sanctum offers two independent modes: stateful cookie sessions and bearer tokens. One had to carry the SPA, and the rendering model (`ssr: false`) and the auth model constrain each other, so they were decided together.

## Decision

**Sanctum's stateful cookie mode, paired with a deliberate SPA (`ssr: false`).**

Session mode: the browser holds an HttpOnly session cookie; CSRF is double-submitted (`/sanctum/csrf-cookie` priming, `X-XSRF-TOKEN` header, one 419 retry); sessions live in the database; login/logout return `204` and rotate/invalidate the session server-side. Nothing client-side stores a credential.

Rejected: **token mode** (`sanctum-token`, the alternative module choice). It would put a bearer credential in browser storage (XSS-exfiltratable, unlike an HttpOnly cookie), require a token body from `POST /login`, and discard the session machinery — while its real payoff (a credential usable outside a browser cookie jar, e.g. an SSR/BFF server) buys nothing for a client-only SPA. The unused half ships as evidence: the `personal_access_tokens` migration exists and `HasApiTokens` is on the model, but no `createToken`/`Bearer` reference exists in PHP or the SPA.

Cookie auth works because everything runs in the browser where the cookie jar lives: the fetcher sends `credentials: 'include'` unconditionally and reads `XSRF-TOKEN` client-side. Under SSR the server render has no cookie jar and this flow silently breaks — SSR adoption (the `ssr` addon) would force revisiting this record, with server-held token mode as the documented path.

## Scope

Design only — records the standing choice. The mechanics it locks are the protected session/auth contract owned by `features/001_session-auth.md`. No behavior contract changes here.

## Consequences

- Frontend and backend must agree on cookie plumbing: `SANCTUM_STATEFUL_DOMAINS`, `SESSION_DOMAIN=localhost`, `SameSite=lax`, credentialed CORS fed by `FRONTEND_URL`. Works because both origins share `localhost`; a production split across apex domains needs `SameSite=None; Secure`, which nothing sets yet — deployment-layer debt, standing.
- CSRF handling is client code (priming + 419 retry) that token mode would not need.
- The dormant `personal_access_tokens` table stays (harmless; removing it is a schema change under the DB protection).
- `guard => ['web']`, `statefulApi()`, and database sessions become load-bearing config — captured in feature 001.

## Contracts Touched

- `project-summary.md` — ADR index row.
- `features/001_session-auth.md` — owns the resulting behavior contract; this record keeps only the why.

## Open Questions

## Verification

The auth test suite exercises session login/logout, session regeneration, and the 401-JSON posture. A repo-wide grep confirms zero token-mode usage; config and fetcher mechanics verified line-by-line.
