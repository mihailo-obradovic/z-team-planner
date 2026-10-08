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
      `<meta property="og:image:width" content="1200">`,
      `<meta property="og:image:height" content="630">`,
      `<meta property="og:image:type" content="image/png">`,
      `<meta property="og:image:alt" content="Z-Team Planner card reading &quot;A Z-Team build, shared with you&quot; beside a masked hero">`
    );
  });
});
