# Feature: Nuxt SEO

## Status

Approved

## Task Weight

Medium

## Purpose

The app has no explicit SEO surface today: no site name/URL declared to any module, no `robots.txt`, no `sitemap.xml`, no Schema.org markup, and no Open Graph image. `@nuxtjs/seo` (already added as a dependency, `nuxt.config.ts` module list) is configured to give `/`, `/privacy`, and `/b/{id}` correct share-preview meta tags and a canonical sitemap/robots policy, while keeping every page out of search indexes on non-production deployments and `/b/{id}` specifically out of the sitemap (it is real and shareable, but not a page anyone should land on from search).

## Inputs

| Input                  | Type     | Source                                | Constraints                                                                          |
| ----------------------- | -------- | -------------------------------------- | ------------------------------------------------------------------------------------ |
| `NUXT_SITE_URL`        | `string` | Deployment environment variable       | Required in production; absolute origin, no trailing slash.                          |
| `NUXT_SITE_ENV`        | `string` | Deployment environment variable       | `production` in production; otherwise any non-production value blocks indexing.      |
| `site.name`            | `string` | `nuxt.config.ts` (`site` object)      | Static literal — no longer inferred from `package.json` in `@nuxtjs/seo` v5.         |
| `site.description`     | `string` | `nuxt.config.ts` (`site` object)      | Static literal, one sentence, matches `project-summary.md`'s Project Purpose.        |

## Outputs And Side Effects

| Output / Side Effect | Type          | Description                                                                                       |
| --------------------- | ------------- | -------------------------------------------------------------------------------------------------- |
| `/robots.txt`          | HTTP response | Allows `/` and `/privacy`; disallows `/b/`; disallows everything when `NUXT_SITE_ENV` is not `production`. |
| `/sitemap.xml`         | HTTP response | Lists `/` and `/privacy` only.                                                                     |
| Page `<head>` tags     | HTML          | Title, description, canonical URL, and Open Graph/Twitter tags on `/`, `/privacy`, and `/b/{id}` (the last two are identical for every id — no build data in the tags). |
| Open Graph images      | Static assets | Two 1200×630 PNGs (256-colour palette, ~130KB each) in `public/images/og/`: `build-now.png` for `/` and `/privacy`, `view-build.png` for `/b/{id}`. Same design, only the title, description and call to action differ. No per-build dynamic image. |
| Schema.org JSON-LD     | HTML          | A `WebApplication` node on `/`.                                                                     |

## Scope And Non-Goals

In scope:

- `site` config (`url`, `name`, `description`) driven by `NUXT_SITE_URL`/`NUXT_SITE_ENV`.
- Robots policy: index `/` and `/privacy`; disallow `/b/**`; block all indexing outside production.
- Sitemap restricted to the two prerendered routes.
- Two static Open Graph/Twitter images (build-now, view-build), `ogImage` dynamic generation disabled. Design: https://claude.ai/code/artifact/0b4e8cb5-19c8-4d64-a0c1-fce49379a3cc, the paper-panel board.
- One `WebApplication` Schema.org node on `/`.
- Feature 007's `/b/**` route rule drops its `ssr: false` override so the SPA shell's static head tags (title, description, `view-build.png`) render server-side for unfurlers; the per-id build data fetch stays exactly as 007 documents it — triggered client-side only, never awaited during SSR.

Non-goals:

- Per-build or per-hero dynamic Open Graph images.
- i18n / multi-locale SEO (the app has one locale).
- `nuxt-link-checker` ESLint rule adoption (separate, tooling-only change if wanted later).
- Structured data for individual heroes or builds.

## User / System Behavior

- When a request in production hits `/robots.txt`, the response allows `/` and `/privacy` and disallows `/b/`.
- When a request in any non-production environment (`NUXT_SITE_ENV` unset or not `production`) hits `/robots.txt`, the response disallows everything.
- When `/sitemap.xml` is requested, it lists exactly `/` and `/privacy`.
- When `/` or `/privacy` is rendered, its `<head>` carries title, description, canonical URL (from `site.url`), Open Graph/Twitter tags, and the static share image.
- When `/` is rendered, a `WebApplication` Schema.org JSON-LD node is present.
- When `/b/{id}` is requested, the server-rendered response carries the same static `view-build.png` Open Graph/Twitter tags and title/description for every id, but `robots.txt` still disallows `/b/` and no sitemap entry exists for it — the tags exist for unfurlers, not for search indexing.
- When `/b/{id}`'s page component mounts, it fetches that id's build data client-side exactly as feature 007 documents; that fetch never runs during the server render, so no viewer's build data can appear in another viewer's cached response.

## Roles And Access

Not role-specific.

## Examples

| Input                                        | Expected Output                                  | Notes                                        |
| ---------------------------------------------- | --------------------------------------------------- | ----------------------------------------------- |
| `GET /robots.txt` in production                | `Allow: /`, `Allow: /privacy`, `Disallow: /b/` (unfurlers ignore this; search crawlers honour it) | Verified via `/__robots__/debug-production.json` |
| `GET /robots.txt` on a preview deployment       | `Disallow: /`                                       | `NUXT_SITE_ENV` not `production`                |
| `GET /sitemap.xml`                              | Contains `/` and `/privacy`, nothing else           | Verified via `/__sitemap__/debug-production.json` |
| View source of `/`                              | `<meta property="og:title">`, `<link rel="canonical">`, `WebApplication` JSON-LD present | |
| View source of `/b/{id}` (curl, no JS)           | Static `<meta property="og:image" content=".../view-build.png">`, no build data anywhere in the response | Confirms the SSR pass never touches the per-id fetch |

## Business Rules

- `ogImage` dynamic (per-request) generation stays disabled — one static image only; the module's dynamic path is opt-in and the project has no per-page image worth generating server-side.
- `site.url` and `site.name` are always explicit config values, never left to inference (v5 no longer infers them).
- `/b/{id}`'s server render emits only static, id-independent meta tags — it must never fetch, await, or embed that id's build data during SSR, regardless of the `ssr: false` override being removed.

## Edge Cases

- Preview/staging deployments (any `NUXT_SITE_ENV` other than `production`): entire site disallowed, no exceptions for `/` or `/privacy`.
- `/b/{id}` is never listed in the sitemap and never allowed in `robots.txt`, even though it is a real, linkable page and now server-renders static meta tags — it carries per-user data and must not be crawled or indexed (mirrors feature 007's token-less-but-unguessable access model).
- `/b/{id}` is now server-rendered (no longer `ssr: false`), but only for the static shell and its head tags; a request for a non-existent id still 404s exactly as feature 007 documents, driven entirely by the client-side fetch after mount.

## Invariants

- `/b/**` is always disallowed in `robots.txt` and always absent from `/sitemap.xml`, regardless of other SEO changes.
- `site.name` and `site.url` are always set explicitly in `nuxt.config.ts` — never restored to inference.
- No viewer's build data ever appears in another viewer's `/b/{id}` response — feature 007's core invariant, preserved here by keeping the build fetch client-only even though the route is no longer `ssr: false`.

## Error Handling

- Missing `NUXT_SITE_URL` in production: the existing build-guard hook (`nuxt.config.ts` `ready` hook, feature derived from decision 007) already fails the build on a missing required public runtime config; this feature adds `NUXT_SITE_URL`/`NUXT_SITE_ENV` to that same required-key mechanism rather than introducing a second check.

## Entry Points

- `nuxt.config.ts`: `site`, `sitemap`, `robots`, `ogImage`, `schemaOrg` config blocks.
- `nuxt.config.ts`: the `/b/**` route rule loses its `ssr: false` override (feature 007's entry point, updated in this same change).
- `web/app.vue` or the relevant page component: `useSchemaOrg()` call for the `WebApplication` node on `/`.
- `web/pages/b/[id].vue`: static `useSeoMeta()`/`defineOgImage()` call that does not depend on the fetched build.

## Dependencies

- `@nuxtjs/seo@5.3.16` — already declared in `package.json`/`nuxt.config.ts` modules; needs an `Approved Dependencies Beyond The Modules` row in `architecture.md` in this same change (Dependency Change Rule).
- Feature 007 (share links) — this feature changes 007's documented `ssr: false` mechanism for `/b/**` (its stated invariant — no cross-viewer data leakage — is preserved, only the rendering mechanism changes); `007_share-links.md` gets its own entry-point update in this same change (Same-Change Rule / Existing Feature Change).
- Feature 010 (privacy page) — the second indexable route.

## Open Questions

_(none)_

## Tests

- `/__robots__/debug-production.json` and `/__sitemap__/debug-production.json` checked manually in production mode per the Examples table.
- A characterization check (Vitest or a manual curl against `nuxt preview`) that `/b/` is disallowed and absent from the sitemap.
- A manual curl (no JS) of `/b/{id}` for two different ids, confirming both responses carry identical static `view-build.png` tags and neither contains the other id's (or any) build data.

## Verification

_(empty — filled at implementation)_

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
