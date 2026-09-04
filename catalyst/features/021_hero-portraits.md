# Feature: Hero portraits

## Status

Approved

## Task Weight

Medium

## Purpose

Every hero is pictured in five places, and the pictures were uneven: twelve files at six pixel sizes, one a PNG wearing a `.webp` name, Blonde Blazer on a bust the game never leads with, and every one requested from Vercel at 1536px and quality 100 because `@nuxt/image` was installed but unconfigured. This feature makes the portrait a contract: one master per hero on one canvas, and one declared width per usage site that Nuxt Image serves at exactly the pixels rendered.

The terms are the glossary's (`context/glossary.md`, Roster imagery): a **bust** is the game's unedited roster art, a **portrait** is the square the app shows. The rules are the `image` addon's (`stacks/frontend/nuxt/addons/image.md`).

## Inputs

| Input                                        | Type                     | Source                                   | Constraints                                                                                                                                                                                                         |
| -------------------------------------------- | ------------------------ | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| master                                       | lossless WebP            | `public/images/portraits/<hero-id>.webp` | the bust at its native size, 450–512 on a side, square (Sonar's monster bust is 450×452 as published); never upscaled, cropped, padded, or pre-encoded lossy                                                        |
| bust                                         | PNG                      | Fandom `dispatch` wiki, `<Name>.png`     | the fuller framing (horns, ears, collars visible), native 450–512px — wiki.gg's 960×1040 busts crop tighter. Waterboy is wiki.gg's 512 bust; Phenomaman's only source is the file the repo already carried          |
| Blonde Blazer                                | PNG                      | Fandom `Blonde_Blazer.png`, 2439×2054    | the Training render: a 2000px square at x=250 with 100px of transparent headroom above the hair, downscaled once to 512                                                                                             |
| canvas rule                                  | none                     | this document                            | no canvas normalisation: every usage fills its box edge to edge under `object-fit: cover`, so a transparent margin would show as background. Sizes that differ by a few percent are the browser's scaling to absorb |
| usage width                                  | `PORTRAIT_WIDTHS[usage]` | `web/config/portraits.ts`                | CSS px per usage site: header 24, ribbon 52, rail 90, card 108, tile 120, synergy 224, panel 256 (renders at 268; 256 so its 2x is exactly the master); applied only by `HeroPortrait`, densities x1 and x2         |
| `image.screens`                              | `portraitScreens()`      | `nuxt.config.ts`                         | derived: every width × density, plus `background: 2560` for the wash. Its first five keys are the module's own `sm`…`2xl`, whose defaults would otherwise survive the merge and widen Vercel's allowed sizes        |
| `image.quality`                              | `90`                     | `nuxt.config.ts`                         | one value for every portrait                                                                                                                                                                                        |
| `nitro.vercel.config.images.minimumCacheTTL` | `31536000`               | `nuxt.config.ts`                         | one year at the edge; the provider has no option of its own and writes 300s                                                                                                                                         |

## Outputs And Side Effects

| Output / Side Effect   | Type               | Description                                                                                                                                                                    |
| ---------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| served portrait        | AVIF               | on Vercel `/_vercel/image?url=…&w=<usage width × density>&q=90`, negotiated by `Accept`; in `nuxt dev` and tests, IPX with `f_avif` so local review sees production's encoding |
| `srcset`               | HTML               | x1 and x2 candidates per usage site, the largest exactly 512                                                                                                                   |
| edge cache             | Vercel image cache | one entry per (master, width, quality, format) for one year                                                                                                                    |
| Vercel `images` config | build output       | `sizes` from `image.screens`, AVIF + WebP, `minimumCacheTTL` — emitted at build, never a hand-written `vercel.json`                                                            |

## Scope And Non-Goals

In scope:

- The twelve masters, lossless at native size.
- `web/config/portraits.ts`, the `HeroPortrait` component, the `image` block, and the usage sites switched to the component.
- The reset procedure after a portrait changes, in `operations.md`.

Non-goals:

- More pixels. No source carries the fuller framing above 512; extracting textures from the game's files is out of scope.
- Vectors. Tracing was tested (vtracer, Coupe at 512px): 370–440 KB of SVG with posterised shading against 22 KB of AVIF.
- Lossy files at rest, or versioned filenames. `heroPortraitSrc` keeps building `<hero-id>.webp`; a changed master is reset by cache invalidation.
- The injured and mustache bust variants. One portrait per hero, Sonar's two forms excepted (feature 012).
- Presets. On `@nuxt/image` 2.0.0 a preset's width never reaches the density srcset (`getSizes` reads the element's own), so the declaration is the component. `sizes` strings are out too: layouts resize on container queries and content, not only on breakpoints; a refactor to breakpoint-only sizing would switch `HeroPortrait` to `sizes`, and owns that switch.
- The background wash's own sizing. It gets `width="2560"` here only so the tightened `screens` cannot snap it down; a fitting width per viewport is its own change.

## User / System Behavior

- Every hero renders from one master; a portrait looks the same in the card, the dialog, the roster rail, the synergy tab and the mission slot, only smaller or larger.
- Each usage site names its usage and gets that width's x1 and x2 candidates. Nothing requests more than twice what it renders, and nothing requests more than the master holds.
- A first request for a variant is a Vercel transformation; every later request for a year is a cache hit. Browsers revalidate each load (Vercel sends `max-age=0, must-revalidate`), so an edge reset reaches them on the next visit.
- In `nuxt dev` and the test environment IPX produces the same variants from the same widths and the same AVIF; IPX does not snap to `screens`, so width parity is the unit test's job, not the dev server's.

## Roles And Access

Not role-specific.

## Examples

| Input                                            | Expected Output                                              | Notes                                                              |
| ------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------ |
| `identify public/images/portraits/*.webp`        | twelve lossless WebPs, 450–512 a side, square within 2px     | one per hero id, plus Sonar's second form                          |
| Malevola's master beside Fandom's `Malevola.png` | identical pixels, 496×496                                    | never resampled, never padded                                      |
| `HeroPortrait` with `usage="card"`               | `srcset` with `w=108 1x` and `w=216 2x`, `q=90`              | IPX spells it `w_108`, `q_90`, `f_avif`                            |
| `usage="panel"`                                  | `w=256 1x`, `w=512 2x`                                       | the 2x is the largest master; a smaller master answers with itself |
| card on a 2x screen, production                  | `…&w=216&q=90`, `content-type: image/avif`                   | AVIF for a browser that accepts it                                 |
| the same without AVIF in `Accept`                | `image/webp`, same width                                     | Vercel negotiates; the `format` modifier is its provider's no-op   |
| a portrait `NuxtImg` outside `HeroPortrait`      | test failure                                                 | the component is the one declaration                               |
| a width × density above 512 in `PORTRAIT_WIDTHS` | test failure                                                 | Vercel's `sizes` list stays the app's, and never an upscale        |
| a master replaced under the same name, deployed  | old variants until `vercel cache invalidate --srcimg …` runs | then fresh on the next request                                     |
| second request for a served variant              | `x-vercel-cache: HIT`                                        | one transformation per variant per year                            |

## Business Rules

- A master is lossless and is the only copy of the portrait in the repository; it is never upscaled, cropped, or padded. A request above a master's own size returns the master: neither Vercel nor IPX enlarges.
- A usage site names its usage; the number lives in `web/config/portraits.ts` and nowhere else. `image.screens` is derived from it, never typed.
- One quality and one format for all portraits, both compared at the card's size against a reference downscale before approval: AVIF q90 measures 43.5 dB PSNR against q80's 41.9 and WebP q100's 41.7, for about 1.3 KB more per variant.

## Edge Cases

- Sonar has two masters, selected by form (feature 012); the monster bust is 450×452 as published, and `object-fit: cover` absorbs the two rows.
- Replacing a master under its existing name: replace, deploy, `vercel cache invalidate --srcimg /images/portraits/<hero-id>.webp` (`operations.md`). Skipping it leaves the old portrait at the edge for up to a year.
- A game update that adds a hero adds a master under the new hero id (feature 002 owns the id); no config changes.
- A hero with no master falls to the browser's broken-image state; the roster is closed, so a missing file is a build defect, not a runtime case.
- A new usage site at a new size adds a key to `PORTRAIT_WIDTHS`; the screens list follows, and the five module keys keep absorbing the module's defaults however many widths there are. A width whose 2x would pass 512 declares 256 instead and accepts the 1x stretch, as the panel does.

## Invariants

- One master per portrait, lossless, at the bust's native size.
- Every portrait renders through `HeroPortrait`; every width × density it can request is in `image.screens`, at most 512, and nothing else is.
- Nothing is delivered larger than twice its rendered CSS size.
- `heroPortraitSrc` and the `<hero-id>.webp` path contract are unchanged.

## Error Handling

- A width outside `image.screens` is snapped up by the Vercel provider, silently overfetching; deriving the list prevents it. Vercel rejects a width outside the list with a 400, so the list being right is what keeps every rendered variant reachable.
- A `usage` outside the union is a type error, not a runtime state.

## Entry Points

- `web/config/portraits.ts` — the widths, the master size, `portraitScreens()`.
- `web/components/HeroPortrait.vue` — the one `NuxtImg` for portraits.
- `nuxt.config.ts` — the `image` block and the Vercel cache TTL under `nitro`.
- `public/images/portraits/` — the masters; `web/utils/heroPortraitSrc.ts` — the path contract, untouched.
- `operations.md` — the cache reset step.

## Dependencies

- `features/002_hero-data.md` — hero ids name the master files.
- `features/012_special-powers.md` — Sonar's form selects between two masters.
- `annexes/design-system.md` §10 — records `NuxtImg` and points at the widths.
- `stacks/frontend/nuxt/addons/image.md` — the addon whose rules this feature applies.
- `context/glossary.md` — portrait and bust.

## Open Questions

## Tests

- `test/unit/portrait-masters.test.ts`: every hero id and both Sonar forms have a master; each is a lossless WebP, 450–512 a side, square within 2px.
- `test/unit/portrait-sizes.test.ts`: no width × density above 512; `portraitScreens()` is exactly widths × densities; no `NuxtImg` outside `HeroPortrait.vue` references a portrait source.
- `test/nuxt/hero-portrait.test.ts`: the card usage yields `w_108 1x` and `w_216 2x` at `q_90` and `f_avif`; the panel's 2x is `w_512`; class and listeners pass through.
- Live walk, production, per the Examples table: headers and `x-vercel-cache` on first and second hit, AVIF and WebP negotiation, the browser cache header after the TTL change, and the Hobby image quota read into `operations.md`.

## Verification

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
