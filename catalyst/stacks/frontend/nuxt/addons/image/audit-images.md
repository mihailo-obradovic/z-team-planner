# Procedure: Audit Images

**Category:** media
**Tool:** @nuxt/image

Audit an area of the codebase for how it loads images — the masters it references, the `NuxtImg` usages, and the `image` block in `nuxt.config.ts` — then apply fixes: name presets, derive `screens`, set loading and alt, and flag what only a person can decide.

**Authoritative rules:** [`../image.md`](../image.md) and the project's design-system annex, §10 Imagery.

**Target:** the directory or feature area given by the caller; if none is given, the files changed on the current branch.

## What to check

### 1. Inventory

- Every `<NuxtImg>`, `<NuxtPicture>`, and native `<img>` in the target, with the source path each references and the context it renders in (card, dialog, list, hero, header).
- Every referenced file: does it exist under `public/`, what are its pixel size, format, and whether it is lossless (`identify`, `webpinfo`, `file`).
- Skip icons — the UI choice's icon pipeline owns them — and note any raster used where an SVG belongs (logos, marks).

### 2. Component

- A native `<img>` on a content image becomes `<NuxtImg>`, attributes preserved. A single logo or a favicon-class image may stay plain with explicit `width`/`height`.
- `alt` on every image: the content, or `""` for decoration that is also out of the accessibility tree. When the right text is not derivable from context, ask: _"What alt text should `[path]` carry in `[component]`?"_
- File names: no spaces, kebab-case. Renames touch every reference in the codebase, content files included, and are confirmed with the user first.

### 3. Masters

- Lossless at rest (PNG or lossless WebP). A lossy file in `public/` served through the optimizer is flagged: it is encoded twice.
- Sized to the largest request — at most 2× the largest rendered CSS size — and never upscaled by a preset. A master smaller than a usage requests is flagged with the cap it forces, not silently upscaled.
- One aspect per family at native size: a master padded onto a shared canvas (a transparent margin that shows under `object-fit: cover`) is flagged, as is a cropped or resampled one.

### 4. Widths and screens

- Every content image's width is declared once per usage site — a preset under `image.presets`, or the project's image component keyed by usage — with `densities: 'x1 x2'`. An inline `width` at a call site is flagged; a preset-only width on `@nuxt/image` 2.0.0 is flagged too, since it never reaches the density srcset (`../image.md`, One declaration per usage site).
- `image.screens` equals the set of declared widths × densities, capped at the master's size — no more, no less. A Tailwind breakpoint list here is flagged.
- A `sizes` string appears only where rendered width changes purely at viewport breakpoints; every entry carries a breakpoint prefix (bare `vw` is `nuxt/image#1637`); never together with `densities`.
- When rendered size is not derivable from the classes and their containers, ask: _"What width does `[image]` render at, at the narrowest and the widest layout?"_

### 5. Config

- `image.quality` is one value per family, recorded with the side-by-side that chose it. Quality 100 is flagged.
- The provider is the host's, auto-detected; a hand-written host image config (`vercel.json` `images`, or the like) is flagged as a gap in the module config.
- `minimumCacheTTL` matches the assets' change cadence — one year for assets replaced only deliberately — and the reset procedure is in `operations.md`.

### 6. Loading and focal point

- `loading="lazy"` below the fold, in dialogs, and in scrollable lists; `loading="eager"` and `fetchpriority="high"` on the page's largest contentful paint image, and on nothing else.
- When fold position is not determinable from code (dynamic or conditional content), ask: _"Is `[image]` in the initial viewport on a 1440×900 screen?"_
- An `object-fit: cover` image in a box whose aspect changes across tiers, with a subject that may sit off-centre, needs an `object-position`. Ask where the subject is: _"`[path]` changes from `[aspect]` to `[aspect]` — where is the subject?"_ Never guess a focal point from code.

## Fix protocol

1. Apply every fix that needs no decision: component swaps, `alt=""` on evident decoration, preset extraction, `screens` derivation, `loading` where the fold is evident, TTL and quality in config.
2. Collect every decision into one round of questions (alt text, rendered widths, fold position, focal points, renames) — at most four per round, never re-asking one already answered — and apply the answers.
3. Convert or pad masters only with the user's approval, from a stated source, and record the source and the canvas in the owning feature document.
4. Run the project's checks (typecheck, tests, format) and, where the app is deployable, read the served variant's headers once: width, format, `x-vercel-cache` or the host's equivalent.

## Output

- **Images audited** — each with size, format, lossless or not, and the usages that reference it.
- **Changes made**, grouped: component, alt, presets and screens, config, loading, focal point, renames.
- **Masters to replace** — path, why (lossy, too small, off-canvas), the source to replace it from.
- **Questions** — asked, and each answer or "pending".
