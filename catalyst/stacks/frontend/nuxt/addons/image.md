# Frontend Addon: Images

**Category:** media
**Tool:** @nuxt/image

Adopt when the product serves raster images it owns — portraits, photography, product shots, a decorative wash — at more than one rendered size, or on a host with an image optimizer of its own (Vercel, Netlify, Cloudflare). A product whose only imagery is an icon set and a logo does not qualify: icons are the UI choice's icon pipeline, and one logo is a plain `<img>` with explicit dimensions.

Adopting the addon supersedes the design-system template's §10 opening ("plain `<img>` on this stack"): `NuxtImg` becomes the image component, and the project's design-system annex records the departure. Every other §10 rule stays — explicit dimensions or a sized box, aspect ratio over height, a placeholder that occupies the final geometry, alt text required. The addon adds a dependency (`@nuxt/image`) under the Dependency Change Rule; adopting it is the approval.

The addon ships a payload directory `image/` holding the audit procedure ([`image/audit-images.md`](image/audit-images.md)), copied into a project only when the addon is chosen.

## The shape

`@nuxt/image` is a configuration surface and a component, not an encoder. In production it delegates to the host's optimizer through an auto-detected provider (`vercel`, `netlify`, `cloudflare`, …), and in `nuxt dev` the bundled IPX produces the same variants from the same config. Everything an image needs — width per usage, densities, quality, formats, cache lifetime — is declared once in `nuxt.config.ts` under `image`, and the host's own image config (`vercel.json` `images`, and the like) is **emitted by the provider, never hand-written**. A project that finds itself editing the host's image settings by hand has a gap in the module config, not a reason to bypass it.

An unconfigured module is worse than none: `NuxtImg` without a width requests the largest configured screen at quality 100 from the optimizer, on every image, and the host meters every transformation.

## Masters

The files in `public/` are the **masters** the optimizer resizes from, and the master is the only copy of the image in the repository.

- **Lossless at rest.** A master is PNG or lossless WebP (lossless WebP is typically 40% smaller than PNG at identical pixels). Never pre-encode a master to a lossy format: the optimizer re-encodes on delivery, and a lossy master is encoded twice. AVIF and WebP are what the optimizer _serves_, negotiated by `Accept`; nothing lossy is committed.
- **Sized to the largest request, never above.** A master holds at most what the largest usage requests at its highest density (2× the largest rendered CSS size) — more is repo weight the browser never downloads — and is **never upscaled**: when no source carries more pixels, the usage caps at the master, and the document says so.
- **One canvas per family, by padding.** Images that render in the same slots (avatars, portraits, thumbnails) share one square or one aspect canvas. A smaller source reaches the canvas by centring on a transparent margin, never by cropping or resampling; the framing is the source's.
- **Named for the content, not the version.** A master's path is stable; a replaced master is reset at the edge (Cache) rather than renamed.

## One declaration per usage site

Every content image's width is declared **once per usage site** (`avatar-header`, `portrait-card`, `gallery-tile`) — in CSS px, with `densities: 'x1 x2'` — and the call sites name the usage, never the number. Inline `width` props on six components are six places that drift. The declaration is either an `image.presets` entry or a small project component that maps a `usage` prop onto a width table and renders `NuxtImg` itself; the component is the honest form on `@nuxt/image` 2.0.0, where a preset's `modifiers.width` never reaches the density srcset (`getSizes` reads the element's own width, so a preset-only width yields two identical candidates). Whichever form, the width table is one module that `nuxt.config.ts` imports too, so `screens` below is derived, not retyped.

- **`image.screens` is derived from the presets**: exactly the set of preset widths × densities, and nothing else. On a host provider this becomes the allowed `sizes` list, so a width no preset requests is a 400 from the optimizer, and a width no usage renders is a transformation the host bills for nothing. Do not paste Tailwind's breakpoints here — they are viewport widths, not image widths.
- **`sizes` strings are the exception**, for an image whose rendered width changes purely at viewport breakpoints. Every entry carries a breakpoint prefix (`sm:100vw md:50vw`); a bare `vw` value is a known module bug (`nuxt/image#1637`) that emits `0w`/`1w` srcset descriptors. `densities` and `sizes` are mutually exclusive on one image.
- **One quality per family**, chosen by a side-by-side at 2× on real art before it is written down; `80` is the default that flat-shaded and photographic images alike have survived. Quality 100 is not "lossless", only large.

## Cache

Optimized variants are cached at the edge for `minimumCacheTTL`; the module's default is minutes, which regenerates every variant under steady load. Assets that change only by deliberate replacement get **one year**. The reset path is then a procedure the project's `operations.md` records: replace the file, deploy, invalidate the source at the edge (`vercel cache invalidate --srcimg <path>` on Vercel; each host has its own). Browsers are not the problem — hosts send `max-age=0, must-revalidate` on optimized images, so an edge reset reaches them on the next load. Verify that header once after adopting, and again after changing the TTL.

## Alt, loading, focal point

These are per-usage decisions the audit checks and the design system already requires:

- `alt` on every image — the content, or `""` for decoration that is also out of the accessibility tree.
- `loading="lazy"` below the fold, in dialogs, and in scrollable lists; `loading="eager"` plus `fetchpriority="high"` on the one image that is the page's largest contentful paint; never `lazy` on that one.
- `object-position` when `object-fit: cover` meets a box whose aspect changes across tiers and the subject sits off-centre — the person who knows where the subject is decides, never the code.
