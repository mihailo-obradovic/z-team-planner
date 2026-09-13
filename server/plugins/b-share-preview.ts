// * Feature 027 (amendment). `/b/{id}` is `ssr: false` (feature 007) — no Vue component ever
// * renders server-side for it, so `useSeoMeta` in `web/pages/b/[id].vue` never reaches the
// * response and a component-level fix does not exist. `render:html` is Nitro's own hook,
// * called for every response including the SPA-fallback path, so this reaches the route
// * without touching feature 007's `ssr:false` or its data fetch. Spiked first as a `routeRules`
// * declaration (nuxt.config.ts) and a global `app.head` default — neither gave `/b/{id}` its own
// * distinct card; this hook is the only mechanism that is both per-route and reaches SPA-fallback
// * responses (`catalyst/features/027_nuxt-seo.md`, Verification).
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html, { event }) => {
    if (!event.path.startsWith('/b/')) {
      return;
    }

    const site = getSiteConfig(event);
    const image = `${site.url}/images/og/view-build.png`;
    const title = 'A Z-Team build, shared with you';
    const description =
      "Open it to see every hero's levels, trained powers and flight, the synergy pairs, and the team totals. No account needed.";

    // ! No `og:type` here — `app.head` (nuxt.config.ts) already pushes `og:type: website` unconditionally for every route, this hook runs after it, and unhead does not dedupe raw head strings the way it dedupes reactive entries.
    html.head.push(
      `<title>${title} — ${site.name}</title>`,
      `<meta property="og:title" content="${title}">`,
      `<meta property="og:description" content="${description}">`,
      `<meta property="og:image" content="${image}">`,
      `<meta name="twitter:card" content="summary_large_image">`,
      `<meta name="twitter:title" content="${title}">`,
      `<meta name="twitter:description" content="${description}">`,
      `<meta name="twitter:image" content="${image}">`
    );
  });
});
