# Decision: Images and icons went missing on the first Services deployment

## Status

Implemented

## Type

incident

## Task Weight

Easy

## Context

Decision 012 went live on 4 October 2026 with merge `2c0b738`. The deployment served every page, the API, sign-in config and the database, but no image: every portrait and the background wash request `/_vercel/image`, and each answered Nuxt's JSON 404 (`Page not found: /_vercel/image…`). The planner worked with blank picture frames. The probe behind 012 never requested an image, and the gap was caught only by the post-merge checks. Once images were fixed (`b2e604a`), the maintainer saw icons missing too: Nuxt Icon fetches icons the page did not bundle from its own server route, `/api/_nuxt_icon/…`, and 012's `/api/(.*)` rewrite sent that to FastAPI, which answered its 404. Routing into a service never falls back.

Stabilized the same day by promoting the previous production deployment (`ebnimfiff`), which still calls the old API project. That project was kept alive for exactly this, so nothing else had to change.

Root cause, read from the Vercel CLI's own build step (62.2.0): in a Services deployment the deployment-level `images` config is built from `vercel.json`'s top-level `images` and from build results that are not services. The block `@nuxt/image` and Nitro write into the web service's output is filtered out, so the optimizer is not enabled, and the catch-all rewrite hands `/_vercel/image` to Nuxt.

## Decision

`vercel.json` carries the top-level `images` block — the sizes, formats and TTL Nuxt emits, copied from a local Vercel-preset build. `nuxt.config.ts` stays the source; `test/unit/vercel-images.test.ts` loads it and fails when the two disagree, and it failed on the pre-fix tree.

The API rewrite narrows to `/api/v1/(.*)`, the only prefix FastAPI serves, beside the two health checks; Nuxt keeps the rest of `/api/`. `test/unit/vercel-routes.test.ts` runs the table against real paths and failed on the icon route before the change.

Rejected: bundling every icon into the client, which treats one module's symptom and leaves the next module's `/api/` route to break the same way; generating `vercel.json` at build time, a build step that exists only to work around the platform; returning to two projects, which undoes 012 for one config block.

## Scope

`vercel.json`, the two new tests, decision 012's routing sentence, feature 021 (the Vercel `images` row and an Examples row), `operations.md` (portrait section, the Vercel routing quirk). No behavior contract changes: portraits and icons are what they were before 012.

## Consequences

The image addon's rule that the host config is emitted, never hand-written, has one exception here, held safe by the test. A width or TTL change now edits two files, which the test enforces. If Vercel starts honouring the service's own block, the restated one becomes redundant, never wrong. Follow-ups: the finding goes into Catalyst's Vercel-module TODO and the image addon, upstream-first; report it to Vercel. No hotfix debt: both causes are confirmed and covered by tests.

## Contracts Touched

- `features/021_hero-portraits.md`: Outputs (Vercel `images` config), Examples.
- `operations.md`: Portrait images (intro, Quirks); Vercel hosting (intro, the never-falls-back quirk).
- `decisions/012_infra_vercel-services.md`: the routing sentence.
- `project-summary.md`: the ADR index row.

## Open Questions

## Verification

Both regression tests watched failing on the pre-fix tree — the images test 4 of 4, the routing test on its icon row — and passing after. Live after `7ec7200`: portraits AVIF at widths 108, 216 and 512 with `x-vercel-cache: HIT`, the background AVIF, WebP when `Accept` lacks AVIF, and a width off the list 400; `/api/_nuxt_icon/lucide.json` 200 from Nuxt and an unknown `/api/v2/x` Nuxt's 404. The maintainer confirmed the icons back.
