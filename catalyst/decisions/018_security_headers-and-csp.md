# Decision: Security headers and an enforcing Content Security Policy

## Status

Implemented

## Type

security

## Task Weight

Medium

## Context

Lighthouse's best-practices checks report no CSP, no Cross-Origin-Opener-Policy, no clickjacking protection and an HSTS max-age too short, each at High severity. Neither `vercel.json` nor `nuxt.config.ts` sets a security header. The pages are hard to cover with a strict policy. `/` and `/privacy` are prerendered, and three inline scripts remain in them (the importmap, the site config and the runtime config), with hashes that change every build. `/b/**` is rendered per request by a function. Google sign-in runs in a popup that loads gapi and a firebaseapp.com iframe.

## Decision

Every header has one source of values:

- **Nuxt `routeRules` headers on every route** carry the static set: `X-Frame-Options: DENY` and `Content-Security-Policy: frame-ancestors 'none'`, `Cross-Origin-Opener-Policy: same-origin-allow-popups`, `Strict-Transport-Security: max-age=31536000; includeSubDomains`, `X-Content-Type-Options: nosniff` and `Referrer-Policy: strict-origin-when-cross-origin`. Plain `same-origin` breaks the sign-in popup. HSTS has no `preload`, because the site still lives on `vercel.app`.
- **`nuxt-security` owns the CSP**, in production builds. Prerendered pages get sha256 hashes for their inline scripts and SRI hashes for their external ones. `/b/**` gets a fresh nonce per request. The policy uses `'strict-dynamic'`, so gapi, which Firebase's own trusted script inserts, loads without a host allowlist. Its middleware is off. Its headers are either the `routeRules` values or off. On `/b/**`'s function response it sets headers itself, and a header turned off there strips the `routeRules` one. A `nitro:config` hook drops `/_fonts/` from its SRI hashes, because the module hashes `@nuxt/fonts`' files before they are written and would block the preloaded face.

Enforced from the first deploy. A `<meta>` CSP cannot be Report-Only, and there is no free report collector.

Rejected:

- **A hand-rolled CSP.** It needs `'unsafe-inline'`, which Lighthouse flags, or our own per-build hashing and nonces.
- **Trusted Types.** Enforcing it stops the app at boot.
- **CSP without SRI.** The entry script then runs only through a Chromium `modulepreload` quirk.

## Scope

`nuxt.config.ts` (`routeRules` headers, the `security` block, the font-preload hook), `package.json` and the lockfile (`nuxt-security`), and `scripts/check-bundle-budget.ts`, whose patterns must accept attributes before `src`/`href`, since SRI writes `integrity` first. No behavior contract changes: every page renders and behaves as before.

## Consequences

- Clears the CSP, COOP, clickjacking and HSTS findings. Trusted Types stays a known High finding.
- On Vercel, prerendered pages carry the CSP only as a `<meta>` tag: the module exports no header for them. `frame-ancestors` therefore lives in the `routeRules` header, where the browser enforces it.
- Any new third-party script or origin needs a policy change. The CSP is off in dev, so a violation first shows up on a local production build or in production.
- The entry budget is unchanged: the module ships no client code.
- Risk: sign-in breaking in production. The answer is reverting the merge.
- Follow-ups: the `nuxt-security` × `@nuxt/fonts` race is parked in Post-release as an unfiled upstream report. Delete the hook when it is fixed.

## Contracts Touched

- `architecture.md`: the `nuxt-security` row in the Frontend packages table.
- `project-summary.md`: an ADR Index row.

## Open Questions

## Verification

Local production build with real Firebase settings, headless Chromium:

- `/`, `/privacy` and `/b/{id}` hydrate with no CSP violation and no failed font.
- Sign-in opens Google's popup through Firebase's handler; gapi and the auth iframe load.
- All six headers arrive on all three pages, `/b/{id}`'s function response included. The Vercel build's `config.json` carries them on `/(.*)`.
- The budget is 226.4 KB, and the CI set passes.

Production (2deb7f7):

- The maintainer completed a real Google sign-in.
- All six headers arrive on `/` and `/b/{id}`, and there are no CSP violations.
- The map's Lighthouse protocol shows no High best-practices finding except Trusted Types; the only HSTS finding is the accepted Medium for no `preload`.
- Mobile LCP is 4.94 s on `/` and 5.07 s on `/b/{id}`, within their ceilings.
