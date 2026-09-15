# Feature: Nuxt SEO

## Status

Active

## Task Weight

Medium

## Purpose

`@nuxtjs/seo` gives `/`, `/privacy`, and `/b/{id}` correct share-preview meta tags and a canonical sitemap/robots policy, while keeping every page out of search indexes on non-production deployments and `/b/{id}` out of both robots.txt and the sitemap. `/b/{id}`'s tags come from a Nitro server hook, not `@nuxtjs/seo` or Vue rendering.

## Inputs

| Input              | Type     | Source                           | Constraints                                                                     |
| ------------------ | -------- | -------------------------------- | ------------------------------------------------------------------------------- |
| `NUXT_SITE_URL`    | `string` | Deployment environment variable  | Required in production; absolute origin, no trailing slash.                     |
| `NUXT_SITE_ENV`    | `string` | Deployment environment variable  | `production` in production; otherwise any non-production value blocks indexing. |
| `site.name`        | `string` | `nuxt.config.ts` (`site` object) | Static literal, never inferred from `package.json`.                             |
| `site.description` | `string` | `nuxt.config.ts` (`site` object) | Static literal, one sentence, matches `project-summary.md`'s Project Purpose.   |

## Outputs And Side Effects

| Output / Side Effect | Type          | Description                                                                                                                                                                                                                                    |
| -------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/robots.txt`        | HTTP response | Allows `/` and `/privacy`; disallows `/b/`; disallows everything when `NUXT_SITE_ENV` is not `production`.                                                                                                                                     |
| `/sitemap.xml`       | HTTP response | Lists `/` and `/privacy` only.                                                                                                                                                                                                                 |
| Page `<head>` tags   | HTML          | Title, description, canonical URL, and Open Graph/Twitter tags on `/` and `/privacy` (via `useSeoMeta`, per-request). `/b/{id}` gets a fixed, id-independent title/description/image (via a Nitro `render:html` hook, not Vue — Entry Points). |
| Open Graph images    | Static assets | Two 1200×630 PNGs in `public/images/og/`: `build-now.png` (`/`, `/privacy`), `view-build.png` (`/b/{id}`). Same design, different copy; identical for every request to their route.                                                            |
| Schema.org JSON-LD   | HTML          | A `WebApplication` node on `/`.                                                                                                                                                                                                                |

## Scope And Non-Goals

In scope:

- `site` config (`url`, `name`, `description`) driven by `NUXT_SITE_URL`/`NUXT_SITE_ENV`.
- Robots policy: index `/` and `/privacy`; disallow `/b/**`; block all indexing outside production.
- Sitemap restricted to the two prerendered routes.
- Two static Open Graph/Twitter images (build-now for `/`/`/privacy`, view-build for `/b/{id}`), `ogImage` dynamic generation disabled. Design: https://claude.ai/code/artifact/0b4e8cb5-19c8-4d64-a0c1-fce49379a3cc, the paper-panel board.
- One `WebApplication` Schema.org node on `/`.
- `/b/{id}`'s share-preview tags via a Nitro `render:html` hook (`server/plugins/b-share-preview.ts`) — the only mechanism found that is both per-route and reaches the `ssr:false` SPA-fallback response (Entry Points, Edge Cases).

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
- When `/b/{id}` is requested, `robots.txt` disallows `/b/` and no sitemap entry exists for it, but the response still carries a fixed title, description, `og:image` (`view-build.png`) and matching Twitter tags — identical for every `id`, injected by a Nitro hook rather than the page itself. The page's own rendering is otherwise unchanged from feature 007 (`ssr: false`; the build data fetch stays client-only).

## Roles And Access

Not role-specific.

## Examples

| Input                                          | Expected Output                                                                                   | Notes                                                           |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `GET /robots.txt` in production                | `Allow: /`, `Allow: /privacy`, `Disallow: /b/` (unfurlers ignore this; search crawlers honour it) | Verified via curl against a real production build               |
| `GET /robots.txt` on a preview deployment      | `Disallow: /`                                                                                     | `NUXT_SITE_ENV` not `production`                                |
| `GET /sitemap.xml`                             | Contains `/` and `/privacy`, nothing else                                                         | Verified via curl against a real production build               |
| View source of `/`                             | `<meta property="og:title">`, `<link rel="canonical">`, `WebApplication` JSON-LD present          |                                                                 |
| View source of `/b/{id}` for two different ids | Identical `og:image` (`view-build.png`), `og:title`, `og:description`, Twitter tags for both      | No build data in either — Nitro hook, not per-request rendering |

## Business Rules

- `ogImage` dynamic (per-request) generation stays disabled — one static image only; the module's dynamic path is opt-in and the project has no per-page image worth generating server-side.
- `site.url` and `site.name` are always explicit config values, never left to inference.
- The `/b/{id}` share-preview hook injects only fixed literal strings — it must never read the request's `id`, fetch, or embed build data; doing so would reintroduce the cross-viewer leak risk feature 007's `ssr: false` exists to prevent, just via a different path.

## Edge Cases

- Preview/staging deployments (any `NUXT_SITE_ENV` other than `production`): entire site disallowed, no exceptions for `/` or `/privacy`.
- `/b/{id}` is never listed in the sitemap and never allowed in `robots.txt`, even though it carries share-preview tags — it carries per-user data once opened (feature 007's access model). Most social unfurlers ignore `robots.txt` for card fetches, which is why the preview works despite the disallow.
- Rejected alternatives to the Nitro hook: a `routeRules`-declared static `ogImage`/`title` for `/b/**` does nothing, since `ssr:false` routes serve one static SPA shell with no per-route head injection; adopting SSR for the route works but is its own decision record and a data-layer rework, disproportionate to two static tags.
- The global `app.head` default (`og:type: website`) still reaches `/b/{id}` unconditionally — the hook must not repeat it, since raw head strings pushed via `render:html` are not deduplicated the way reactive `useHead` entries are.

## Invariants

- `/b/**` is always disallowed in `robots.txt` and always absent from `/sitemap.xml`, regardless of other SEO changes.
- `site.name` and `site.url` are always set explicitly in `nuxt.config.ts` — never restored to inference.
- No viewer's build data ever appears in `/b/{id}`'s share-preview tags, or anywhere in that route's server-rendered response — the Nitro hook injects fixed strings only, and the page's own data fetch stays client-only exactly as feature 007 built it.

## Error Handling

- Missing `NUXT_SITE_URL` in production: the build-guard hook (`nuxt.config.ts` `ready` hook, decision 007) fails the build on a missing required public runtime config; `NUXT_SITE_URL`/`NUXT_SITE_ENV` are in that same required-key list rather than a second check.

## Entry Points

- `nuxt.config.ts`: `site`, `sitemap`, `robots`, `ogImage` config blocks, and the `ready` hook (build guard extended to require `NUXT_SITE_URL`/`NUXT_SITE_ENV`).
- `web/app.vue`: `useHead`'s `titleTemplate: '%s'` (overrides SEO Utils' site-name suffix, which duplicates every title) and `useSeoMeta`'s site-wide `ogImage`/`twitterImage`/`twitterCard`.
- `web/pages/index.vue`: `useSchemaOrg([defineSoftwareApp({ '@type': 'WebApplication', ... })])`.
- `server/plugins/b-share-preview.ts` — the project's one piece of Nitro server code. Hooks `render:html`, path-gated to `/b/`, pushes fixed title/`og:*`/`twitter:*` tag strings. Reads `site.url`/`site.name` via `getSiteConfig(event)` (the server-side counterpart to `useSiteConfig()`, auto-imported by `nuxt-site-config`).

## Dependencies

- `@nuxtjs/seo` — recorded in `architecture.md`'s `Approved Dependencies Beyond The Modules` (Dependency Change Rule).
- Feature 007 (share links) — its `ssr: false`/data-fetch design is untouched; its access model is why `/b/{id}` is excluded from indexing and why its share-preview needs a mechanism outside the Vue render tree.
- Feature 010 (privacy page) — the second indexable route.

## Open Questions

## Tests

- Manual curl of `/robots.txt` and `/sitemap.xml` against a real production build (`nuxt build` + `node .output/server/index.mjs`), per the Examples table; the module's debug endpoints need `debug: true`, not set here.
- The same, with `NUXT_SITE_ENV` set to a non-`production` value, confirming the whole site is disallowed.
- Manual curl of `/b/{id}` for two different ids against a real production build, confirming identical share-preview tags and no build data in either response.

## Verification

Verified against real production builds (`nuxt build` + `node .output/server/index.mjs`), not just `nuxt dev`:

- `robots.txt`: `production` → `Disallow: /b/` only; any non-`production` `NUXT_SITE_ENV` (tested `development` and an arbitrary `preview` value) → `Disallow: /`. No extra `env` option is needed beyond `NUXT_SITE_ENV` itself, whatever the module's docs suggest.
- `sitemap.xml`: exactly `/` and `/privacy`.
- `/`, `/privacy`: `og:title`, `og:description`, `og:image` (absolute URL), `twitter:card: summary_large_image`, `twitter:image`, canonical link, and an unduplicated `<title>` all present.
- `/`: Schema.org JSON-LD present, `@type` includes `"WebApplication"`.
- `/b/{id}`: `X-Robots-Tag: noindex, nofollow` present (feature 007). The Nitro hook verified against two different ids: identical `og:image`/`og:title`/`og:description`/`twitter:*`/`<title>` on both, `/` and `/privacy` unaffected, no duplicate `og:type`.
- Remaining risk: `@nuxt/fonts@0.12.1` is below `nuxt-og-image`'s stated `0.13.0+` requirement for font extraction — inert here since `ogImage` generation is fully disabled, but would need bumping if dynamic OG images are ever adopted.

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
