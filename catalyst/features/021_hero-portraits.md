# Feature: Hero portraits

## Status

Approved

## Task Weight

Medium

## Purpose

Every hero is pictured in five places, and the pictures are uneven: twelve files at six pixel sizes, one a PNG wearing a `.webp` name, Blonde Blazer on a bust the game never leads with, and every one of them requested from Vercel at 1536px and quality 100 because `@nuxt/image` is installed but unconfigured. This feature makes the portrait a contract: one master per hero on one canvas, and a Nuxt Image configuration that serves each usage site exactly the pixels it renders.

The terms are the glossary's (`context/glossary.md`, Roster imagery): a **bust** is the game's unedited roster art, a **portrait** is the square the app shows.

## Inputs

| Input                          | Type                     | Source                                   | Constraints                                                                                                                                                                                                                                                                                                      |
| ------------------------------ | ------------------------ | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| master                         | lossless WebP, square    | `public/images/portraits/<hero-id>.webp` | 512×512; never upscaled, never cropped, never pre-encoded lossy                                                                                                                                                                                                                                                  |
| bust                           | PNG                      | Fandom `dispatch` wiki, `<Name>.png`     | the fuller framing (horns, ears, collars visible), native 450–512px; the only source of that framing — wiki.gg's 960×1040 busts crop tighter; Phenomaman and Waterboy match no Fandom upload — Waterboy is wiki.gg's 512 bust, Phenomaman's only source is the file the repo already carried (origin unrecorded) |
| Blonde Blazer                  | PNG                      | Fandom `Blonde_Blazer.png`, 2439×2054    | the Training render, cut square around the face and downscaled once to 512                                                                                                                                                                                                                                       |
| canvas rule                    | pad                      | this document                            | a bust smaller than 512 on a side is centred on a transparent 512 canvas; no pixel of the bust is resampled                                                                                                                                                                                                      |
| preset                         | `image.presets.<name>`   | `nuxt.config.ts`                         | one per usage site: `width` in CSS px, `densities: 'x1 x2'`, `fit: 'cover'`; every portrait `NuxtImg` names one                                                                                                                                                                                                  |
| `image.screens`                | `Record<string, number>` | `nuxt.config.ts`                         | exactly the preset widths × densities — the list Vercel will resize to                                                                                                                                                                                                                                           |
| `image.quality`                | `80`                     | `nuxt.config.ts`                         | one value for every portrait                                                                                                                                                                                                                                                                                     |
| `image.vercel.minimumCacheTTL` | `31536000`               | `nuxt.config.ts`                         | one year at the edge                                                                                                                                                                                                                                                                                             |

## Outputs And Side Effects

| Output / Side Effect   | Type                     | Description                                                                                                      |
| ---------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| served portrait        | AVIF or WebP by `Accept` | on Vercel `/_vercel/image?url=…&w=<preset width × density>&q=80`; in `nuxt dev` the same through the bundled IPX |
| `srcset`               | HTML                     | x1 and x2 candidates per usage site, from the preset's `densities`                                               |
| edge cache             | Vercel image cache       | one entry per (master, width, quality, format) for one year                                                      |
| Vercel `images` config | build output             | `sizes` from `image.screens`, AVIF + WebP, `minimumCacheTTL` — emitted by the provider, never hand-written       |

## Scope And Non-Goals

In scope:

- The twelve masters on one 512 canvas: Fandom's busts padded, Blonde Blazer re-cut from the Training render.
- The Nuxt Image configuration and a preset on every portrait `NuxtImg`.
- The reset procedure after a portrait changes, in `operations.md`.

Non-goals:

- More pixels. No source carries the fuller framing above 512: Fandom's uploads are the originals, and wiki.gg's larger busts are a tighter crop that loses Malevola's horns and Sonar's ears. Extracting textures from the game's files is out of scope.
- Vectors. Tracing was tested (vtracer, Coupe at 512px): 370–440 KB of SVG with posterised shading against 22 KB of AVIF for the same image.
- Lossy files at rest. The master is the served source; a lossy master would be encoded twice.
- Versioned filenames. `heroPortraitSrc` keeps building `<hero-id>.webp`; a changed master is reset by cache invalidation (Edge Cases).
- The injured and mustache bust variants. One portrait per hero, Sonar's two forms excepted (feature 012).
- `sizes` strings per component. Presets are width-fixed per usage site because layouts today resize on container queries and content, not only on Tailwind breakpoints. A layout refactor that moves every portrait size onto a breakpoint would switch presets to `sizes`; that refactor owns the switch.
- The background wash (`public/images/background.webp`). It goes through the same optimizer and deserves a width of its own, in a change of its own.

## User / System Behavior

- Every hero renders from one master, and a portrait looks the same in the card, the dialog, the roster rail, the synergy tab and the mission slot, only smaller or larger.
- Each usage site requests its own width: dialog header 24px, mission slot 88px, card 108px, synergy tab 224px, dialog panel 272px, plus the roster rail and ribbon tiles at their rendered size. A 2x screen gets the x2 candidate; nothing requests more than twice what it renders, and nothing requests more than the master holds.
- A first request for a variant is a Vercel transformation; every later request for a year is a cache hit. Browsers revalidate on each load (Vercel sends `max-age=0, must-revalidate` on optimized images), so an edge reset reaches them on the next visit.
- In `nuxt dev`, IPX produces the same variants from the same config, so what is checked locally is what ships.

## Roles And Access

Not role-specific.

## Examples

| Input                                            | Expected Output                                             | Notes                                             |
| ------------------------------------------------ | ----------------------------------------------------------- | ------------------------------------------------- |
| `identify public/images/portraits/*.webp`        | twelve files, all 512×512 lossless WebP                     | one per hero id, plus Sonar's second form         |
| Malevola's master beside Fandom's `Malevola.png` | identical pixels, centred, 8px transparent margin each side | padded, never resampled                           |
| card portrait on a 2x screen, production         | `…&w=216&q=80`, `content-type: image/avif`                  | AVIF for a browser that accepts it                |
| the same in a browser without AVIF               | `image/webp`, same width                                    | negotiated by the provider                        |
| dialog panel at `md`, 2x                         | `…&w=512&q=80`                                              | capped at the master; 544 would upscale           |
| any portrait `NuxtImg` without a `preset`        | test failure                                                | the preset is how a usage site declares its width |
| `image.screens` holds a width no preset produces | test failure                                                | Vercel's `sizes` list stays exactly the app's     |
| a master replaced under the same name, deployed  | old variants until `vercel cache invalidate --srcimg …`     | then fresh on the next request                    |
| second request for a served variant              | `x-vercel-cache: HIT`                                       | one transformation per variant per year           |

## Business Rules

- A master is lossless and is the only copy of the portrait in the repository.
- Masters are never upscaled and never cropped: a bust reaches 512 by padding, and a preset never requests more than 512.
- One quality value for all portraits; the art is flat-shaded and 80 was compared against 100 at 2x before approval (24 KB against 102 KB, no visible difference).
- `image.screens` is derived from the presets, not from Tailwind's breakpoints. A width appears there because a preset requests it.

## Edge Cases

- Sonar has two masters (`sonar-hybrid`, `sonar-monster`), selected by form (feature 012); the monster bust is 450×452 and pads asymmetrically to 512.
- Replacing a master under its existing name: replace the file, deploy, then `vercel cache invalidate --srcimg /images/portraits/<hero-id>.webp`. The step is in `operations.md`; skipping it leaves the old portrait at the edge for up to a year.
- A game update that adds a hero adds a master under the new hero id (feature 002 owns the id); nothing in the config changes.
- A hero with no master falls to the browser's broken-image state; there is no placeholder art, because the roster is closed and a missing file is a build defect.

## Invariants

- One master per portrait, lossless, 512×512.
- Every portrait `NuxtImg` names a preset; every preset width × density is in `image.screens`, capped at 512; nothing else is.
- Nothing is delivered larger than twice its rendered CSS size.
- `heroPortraitSrc` and the `<hero-id>.webp` path contract are unchanged.

## Error Handling

- A `preset` that does not exist is a Nuxt Image runtime warning and an unmodified URL; the test above catches it first.
- A request outside `image.screens` is a 400 from Vercel's image API; the same test prevents it.

## Entry Points

- `nuxt.config.ts` — the `image` block: presets, screens, quality, Vercel cache TTL.
- `public/images/portraits/` — the masters.
- `web/utils/heroPortraitSrc.ts` — the path contract, untouched.
- `web/components/HeroCard.vue`, `SynergyHeroPortrait.vue`, `HeroDetailDialog.vue`, `mission/MissionTeamPanel.vue` — the usage sites, each gaining a `preset`.
- `operations.md` — the cache reset step.

## Dependencies

- `features/002_hero-data.md` — hero ids name the master files.
- `features/012_special-powers.md` — Sonar's form selects between two masters.
- `annexes/design-system.md` §10 — records that the project uses `NuxtImg`; its sizes are the preset widths.
- `stacks/frontend/nuxt/addons/image.md` — the Nuxt Image addon (Catalyst, arriving by upgrade before implementation): masters lossless, a preset per usage site, screens derived from presets, a long edge TTL with invalidation as the reset.
- `context/glossary.md` — portrait and bust.

## Open Questions

## Tests

- `test/unit/portrait-masters.test.ts`: every hero id (and both Sonar forms) has a master; each is 512×512 lossless WebP.
- `test/unit/image-config.test.ts`: the set of preset widths × densities equals the set of `image.screens` values and none exceeds 512; every portrait `NuxtImg` in the usage-site components carries a `preset` that exists.
- Live walk, production, per the Examples table: request headers and `x-vercel-cache` on first and second hit, AVIF and WebP negotiation, the browser cache header re-read after the TTL change, and the Vercel Hobby image quota read from the dashboard into `operations.md`.

## Verification

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
