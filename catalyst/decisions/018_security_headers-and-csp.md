# Decision: Security headers and an enforcing Content Security Policy

## Status

Accepted

## Type

security

## Task Weight

Medium

## Context

Lighthouse's best-practices checks report no CSP, no Cross-Origin-Opener-Policy, no clickjacking protection and an HSTS max-age too short, each at High severity. Neither `vercel.json` nor `nuxt.config.ts` sets a security header. The pages are hard to cover with a strict policy. `/` and `/privacy` are prerendered, and three inline scripts remain in them (the importmap, the site config and the runtime config), with hashes that change every build. `/b/**` is rendered per request by a function. Google sign-in runs in a popup that loads gapi and a firebaseapp.com iframe.

## Decision

Two owners, one header each:

- **Nuxt `routeRules` headers on every route** carry the static set: `X-Frame-Options: DENY` and `Content-Security-Policy: frame-ancestors 'none'`, `Cross-Origin-Opener-Policy: same-origin-allow-popups`, `Strict-Transport-Security: max-age=31536000; includeSubDomains`, `X-Content-Type-Options: nosniff` and `Referrer-Policy: strict-origin-when-cross-origin`. Plain `same-origin` breaks the sign-in popup. HSTS has no `preload`, because the site still lives on `vercel.app`.
- **`nuxt-security` owns only the CSP**, in production builds. Prerendered pages get sha256 hashes for their inline scripts and SRI hashes for their external ones. `/b/**` gets a fresh nonce per request. The policy uses `'strict-dynamic'`, so gapi, which Firebase's own trusted script inserts, loads without a host allowlist. Every other header and middleware the module ships is turned off. A small hook removes `integrity` from font preload links, because the module hashes `@nuxt/fonts`' files before they are written and would block the preloaded face.

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

Before merging, on a local production build with real Firebase settings:

- `/`, `/privacy` and `/b/{id}` hydrate with no CSP violation.
- Sign-in opens the Google popup.
- The headers are present and the fonts load.
- The budget script passes, and so does the CI set.

After deploying:

- The maintainer completes a real Google sign-in on production.
- The map's Lighthouse protocol on `/` and `/b/{id}` shows no High best-practices finding except Trusted Types.
