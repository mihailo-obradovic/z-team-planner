# Decision: Portraits went missing on the first Services deployment

## Status

Accepted

## Type

incident

## Task Weight

Easy

## Context

Decision 012 went live on 4 October 2026 with merge `2c0b738`. The deployment served every page, the API, sign-in config and the database, but no image: every portrait and the background wash request `/_vercel/image`, and each answered Nuxt's JSON 404 (`Page not found: /_vercel/image…`). The planner worked with blank picture frames. The probe behind 012 never requested an image, and the gap was caught only by the post-merge checks.

Stabilized the same day by promoting the previous production deployment (`ebnimfiff`), which still calls the old API project. That project was kept alive for exactly this, so nothing else had to change.

Root cause, read from the Vercel CLI's own build step (62.2.0): in a Services deployment the deployment-level `images` config is built from `vercel.json`'s top-level `images` and from build results that are not services. The block `@nuxt/image` and Nitro write into the web service's output is filtered out, so the optimizer is not enabled, and the catch-all rewrite hands `/_vercel/image` to Nuxt.

## Decision

`vercel.json` carries the top-level `images` block — the sizes, formats and TTL Nuxt emits, copied from a local Vercel-preset build. `nuxt.config.ts` stays the source; `test/unit/vercel-images.test.ts` loads it and fails when the two disagree, and it failed on the pre-fix tree.

Rejected: generating `vercel.json` at build time, a build step that exists only to work around the platform; returning to two projects, which undoes 012 for one config block.

## Scope

`vercel.json`, the new test, feature 021 (the Vercel `images` row and an Examples row), `operations.md` (portrait section and a Quirks entry). No behavior contract changes: the portraits are what they were before 012.

## Consequences

The image addon's rule that the host config is emitted, never hand-written, has one exception here, held safe by the test. A width or TTL change now edits two files, which the test enforces. If Vercel starts honouring the service's own block, the restated one becomes redundant, never wrong. Follow-ups: the finding goes into Catalyst's Vercel-module TODO and the image addon, upstream-first; report it to Vercel. No hotfix debt: the cause is confirmed and covered by a test.

## Contracts Touched

- `features/021_hero-portraits.md`: Outputs (Vercel `images` config), Examples.
- `operations.md`: Portrait images (intro, Quirks).
- `project-summary.md`: the ADR index row.

## Open Questions

## Verification
