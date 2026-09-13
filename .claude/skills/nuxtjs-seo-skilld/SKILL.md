---
name: nuxtjs-seo-skilld
description: "ALWAYS use when writing code importing \"@nuxtjs/seo\". Consult for debugging, best practices, or modifying @nuxtjs/seo, nuxtjs/seo, nuxtjs seo, nuxt-seo, nuxt seo."
metadata:
  version: 5.3.16
  generated_by: Anthropic · Opus 5
  generated_at: 2026-09-13
---

# harlan-zw/nuxt-seo `@nuxtjs/seo@5.3.16`
**Tags:** latest: 5.3.16

**References:** [package.json](./.skilld/pkg/package.json) • [Docs](./.skilld/docs/_INDEX.md) • [Issues](./.skilld/issues/_INDEX.md) • [Discussions](./.skilld/discussions/_INDEX.md) • [Releases](./.skilld/releases/_INDEX.md)

## Search

Use `skilld search "query" -p @nuxtjs/seo` instead of grepping `.skilld/` directories. Run `skilld search --guide -p @nuxtjs/seo` for full syntax, filters, and operators.

<!-- skilld:api-changes -->
## API Changes

This section documents version-specific API changes — prioritize recent major/minor releases.

- BREAKING: `site.name` — no longer inferred from `package.json` or the directory name since v5 (Site Config v4); set `site: { name }` explicitly in `nuxt.config` or the name is empty [source](./.skilld/docs/content/6.migration-guide/5.v4-to-v5.md:L36:46)

- BREAKING: `runtimeConfig.public.siteUrl` / `siteName` / `siteDescription` — legacy keys no longer read in v5; move them to the top-level `site: { url, name, description }` object [source](./.skilld/docs/content/6.migration-guide/5.v4-to-v5.md:L48:65)

- BREAKING: `useSiteConfig()` in server code — replaced by `getSiteConfig(event)` in v5; `useSiteConfig()` stays for components and composables [source](./.skilld/docs/content/6.migration-guide/5.v4-to-v5.md:L67:72)

- BREAKING: `getSiteIndexable()` — removed in v5, read `getSiteConfig(event).indexable` instead [source](./.skilld/docs/content/6.migration-guide/5.v4-to-v5.md:L70)

- BREAKING: `SiteConfig` type — renamed to `SiteConfigResolved`; `#internal/nuxt-site-config` imports replaced by named imports from `nuxt-site-config` [source](./.skilld/docs/content/6.migration-guide/5.v4-to-v5.md:L71:72)

- DEPRECATED: `asSeoCollection()` from `@nuxtjs/seo/content` — compose `defineRobotsSchema()`, `defineSitemapSchema()`, `defineOgImageSchema()`, `defineSchemaOrgSchema()` inside `schema: z.object({...})` instead; all four import from `@nuxtjs/seo/content` [source](./.skilld/docs/content/6.migration-guide/5.v4-to-v5.md:L78:118)

- DEPRECATED: `asRobotsCollection()` / `asSitemapCollection()` / `asOgImageCollection()` / `asSchemaOrgCollection()` — renamed to `defineRobotsSchema()` / `defineSitemapSchema()` / `defineOgImageSchema()` / `defineSchemaOrgSchema()`, used as schema fields rather than collection wrappers [source](./.skilld/docs/content/6.migration-guide/5.v4-to-v5.md:L142:152)

- BREAKING: module order — `@nuxtjs/seo` must come before `@nuxt/content` in `modules`; wrong order silently drops SEO frontmatter from Content v3 collections [source](./.skilld/docs/content/2.guides/2.nuxt-content.md:L118:128)

- NEW: `definePageMeta({ sitemap: { changefreq, priority } })` — per-page sitemap options in Sitemap v8, replacing route-rule workarounds [source](./.skilld/docs/content/7.releases/1.v5.md:L134:147)

- BREAKING: i18n multi-sitemap — custom sitemaps with `includeAppSources: true` are auto-expanded per locale in v5 (`pages` becomes `en-pages`, `fr-pages`); drop manually defined per-locale sitemaps [source](./.skilld/docs/content/7.releases/1.v5.md:L149:164)

- NEW: `useShareLinks({ title, twitter, utm })` — SEO Utils v8 composable returning share URLs (`twitter`, `facebook`, `linkedin`, `whatsapp`, `telegram`, `reddit`, `pinterest`, `email`) for the current canonical URL with UTM params; `utm: false` disables tracking [source](./.skilld/docs/content/7.releases/1.v5.md:L61:83)

- BREAKING: `useHead` inline `script`/`style` `innerHTML` — minified automatically by SEO Utils v8, so comments and whitespace are stripped from rendered output [source](./.skilld/docs/content/7.releases/1.v5.md:L95:132)

- NEW: `npx nuxt-seo-utils icons --source logo.svg` — CLI that generates `favicon.ico`, `apple-touch-icon.png` and 16/32/192/512px PNGs into `public/`; needs `sharp` as a dev dependency [source](./.skilld/docs/content/7.releases/1.v5.md:L85:93)

- NEW: `nuxt-link-checker/eslint` — ESLint rules `link-checker/valid-route` (error) and `link-checker/valid-sitemap-link` (warn), auto-registered with `@nuxt/eslint` [source](./.skilld/docs/content/7.releases/1.v5.md:L37:59)

- NEW: comark-content support — `@harlan-zw/comark-content` detected as a content provider in v5.3.13; needs no schema opt-in, frontmatter keys `robots`, `sitemap`, `schemaOrg` work directly [source](./.skilld/docs/content/2.guides/2.nuxt-content.md:L127:160)

**Also changed:** sub-modules bumped to `nuxt-site-config` v4 · `nuxt-seo-utils` v8 · `@nuxtjs/sitemap` v8 · `@nuxtjs/robots` v6 · `nuxt-schema-org` v6 · `nuxt-link-checker` v5 (OG Image stays v6) · `useServerSeoMeta` now takes precedence over site defaults v5 · robots `skipSiteIndexable` now skips `Disallow: /` v5 · Schema.org `@id` URLs respect `app.baseURL` v5 · devtools layer installed on demand v5.3.0 · Nitro 3 runtime compatibility v5.3.7 · `nuxt-i18n-micro` localized routes supported v5.3.8 · i18n routes resolved per request domain v5.3.15
<!-- /skilld:api-changes -->

<!-- skilld:best-practices -->
## Best Practices

- Always set `site.url` and `site.name` explicitly in `nuxt.config` — since v5 Site Config no longer infers the name from `package.json` or the directory, and the legacy `runtimeConfig.public.siteUrl` / `siteName` / `siteDescription` keys are ignored, so SEO output silently loses the site name [source](./.skilld/docs/content/2.guides/0.using-the-modules.md:L109:125) [source](./.skilld/docs/content/6.migration-guide/5.v4-to-v5.md:L48:65)

- Drive per-deployment values through `NUXT_SITE_URL` and `NUXT_SITE_ENV` rather than hardcoding — non-production environments are automatically blocked from indexing, so staging needs no manual `noindex`; any environment other than development/production also needs the robots `env` option configured [source](./.skilld/docs/content/2.guides/6.site-config.md:L43:62) [source](./.skilld/docs/content/2.guides/0.using-the-modules.md:L49)

- In server routes use `getSiteConfig(event)` (and `getSiteConfig(event).indexable`) instead of `useSiteConfig()` / `getSiteIndexable()`, type against `SiteConfigResolved`, and import from `nuxt-site-config` rather than `#internal/nuxt-site-config` — the old server APIs were removed in Site Config v4 [source](./.skilld/docs/content/6.migration-guide/5.v4-to-v5.md:L67:72)

- Serve several hostnames from one app with `site.multiTenancy` (a `hosts` array plus `config` per tenant) — the matching config is resolved from the request hostname, so every module emits the right canonical URL and name without per-module wiring [source](./.skilld/docs/content/2.guides/6.site-config.md:L78:99)

- Rely on `site.url` for www vs apex handling — SEO Utils emits canonical URLs from it; add `seo.redirectToCanonicalSiteUrl` only when you also need analytics and security policies served from a single origin (maintainer answer) [source](./.skilld/discussions/discussion-585.md:L18:24)

- For Nuxt Content v3, compose `defineRobotsSchema()`, `defineSitemapSchema()`, `defineOgImageSchema()` and `defineSchemaOrgSchema()` into the collection's zod schema (only the ones you use) — `asSeoCollection()` and the `asXxxCollection()` wrappers are deprecated; with the meta-module, import all four from `@nuxtjs/seo/content` so the sub-modules need not be direct dependencies, and list `@nuxtjs/seo` before `@nuxt/content` in `modules` [source](./.skilld/docs/content/2.guides/2.nuxt-content.md:L35:125)

```ts
import { defineOgImageSchema, defineRobotsSchema, defineSchemaOrgSchema, defineSitemapSchema } from '@nuxtjs/seo/content'
// schema: z.object({ robots: defineRobotsSchema(), sitemap: defineSitemapSchema(), ... })
```

- Frontmatter schema fields do not render on their own — the catch-all content page must still pass `page.value.schemaOrg` to `useSchemaOrg()`, the SEO fields to `useSeoMeta()`, and `page.value.ogImage` to `defineOgImage()` [source](./.skilld/docs/content/2.guides/2.nuxt-content.md:L97:112)

- Translate the site name and description through a `nuxtSiteConfig` key in each i18n locale file rather than computing them per page — the values override `site.name` / `site.description` and flow into meta tags, Schema.org and OG images automatically [source](./.skilld/docs/content/2.guides/3.i18n.md:L42:68)

- Set per-page `sitemap` options (`changefreq`, `priority`) in `definePageMeta()` instead of route rules — supported since Sitemap v8 and keeps the config beside the page [source](./.skilld/docs/content/7.releases/1.v5.md:L134:147)

- With i18n, define a single custom sitemap with `includeAppSources: true` instead of one per locale — it is auto-expanded to `en-pages`, `fr-pages` and so on, while sitemaps without `includeAppSources` stay as-is [source](./.skilld/docs/content/7.releases/1.v5.md:L149:164)

- Disable `ogImage` (`ogImage: { enabled: false }`) when you do not generate dynamic images — it is opt-in yet contributes the most server bundle size; on sub-1MB serverless workers either disable it or use Zero Runtime build-time generation [source](./.skilld/docs/content/1.getting-started/3.troubleshooting.md:L42:57) [source](./.skilld/docs/content/2.guides/0.using-the-modules.md:L62:65)

- Catch broken internal links at lint time with the Link Checker ESLint rules (`link-checker/valid-route`, `link-checker/valid-sitemap-link`) — registered automatically with `@nuxt/eslint`, otherwise add `nuxt-link-checker/eslint` to the flat config; it also scans `navigateTo` / `router.push` calls and Markdown links [source](./.skilld/docs/content/7.releases/1.v5.md:L37:59)

- Verify production behaviour from dev through the debug endpoints `/__robots__/debug-production.json`, `/__sitemap__/debug-production.json` and `/__nuxt-seo-utils` rather than deploying to check robots and sitemap output [source](./.skilld/docs/content/6.migration-guide/5.v4-to-v5.md:L199:205)
<!-- /skilld:best-practices -->
