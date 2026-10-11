// * The share id's shape (feature 007): only a well-formed id earns a preload; anything else is the API's `404` to give, after the app asks.
const SHARE_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// * Feature 027: `/b/**` is `ssr: false`, so `useSeoMeta` never reaches the response and its share tags are injected here.
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html, { event }) => {
    if (!event.path.startsWith('/b/')) {
      return;
    }

    // * Decision 017: the shared read leaves with the HTML instead of after the entry bundle has run. `crossorigin="anonymous"` is the preload's same-origin credentials mode, which the read itself matches (`shared.api.ts`), so the browser serves the fetch from the preload rather than sending it twice. No preload where no API exists (decision 007, stage 1).
    const { apiBaseUrl } = useRuntimeConfig(event).public;
    const id = event.path.slice('/b/'.length).split(/[/?#]/)[0] ?? '';

    if (apiBaseUrl && SHARE_ID.test(id)) {
      html.head.push(
        `<link rel="preload" as="fetch" href="${apiBaseUrl}/shared/${id}" crossorigin="anonymous">`
      );
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
