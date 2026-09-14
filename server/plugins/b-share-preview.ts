// * Feature 027: `/b/**` is `ssr: false`, so `useSeoMeta` never reaches the response and its share tags are injected here.
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

    // ! No `og:type`: nuxt-seo-utils already emits one for every route, and unhead does not dedupe raw head strings.
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
