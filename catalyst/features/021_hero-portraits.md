# Feature: Hero portraits

## Status

Draft

## Task Weight

Medium

## Purpose

Every hero is pictured in five places, and the pictures are uneven: twelve files at six different pixel sizes, one a PNG wearing a `.webp` name, Blonde Blazer on a bust the game never leads with, and every one of them requested from Vercel at 1536px and quality 100 because `@nuxt/image` is installed but unconfigured. This feature makes the portrait a contract: one master per hero at one canonical size, framed the same way, and a Nuxt Image configuration that serves each usage site exactly the pixels it renders.

The terms are the glossary's (`context/glossary.md`, Roster imagery): a **bust** is the game's unedited roster art, a **portrait** is the square crop the app shows.

## Inputs

| Input                          | Type                     | Source                                   | Constraints                                                                                                                                        |
| ------------------------------ | ------------------------ | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| master                         | lossless WebP, square    | `public/images/portraits/<hero-id>.webp` | 960×960; 512×512 only where no larger bust exists (Phenomaman, Waterboy); never upscaled, never pre-encoded lossy                                  |
| bust                           | PNG                      | dispatch.wiki.gg `Hero_Busts_<Name>.png` | 960×1040 for nine heroes; Blonde Blazer's master is cut from the Training render (`Blonde_Blazer_Training.png`, 2653×2134) instead of her 512 bust |
| framing rule                   | crop                     | this document                            | full master width; vertical offset per hero so the head top sits near the top edge and the eye line falls in the upper 35–40%; shoulders visible   |
| preset                         | `image.presets.<name>`   | `nuxt.config.ts`                         | one per usage site: `width` in CSS px, `densities: 'x1 x2'`, `fit: 'cover'`; every `NuxtImg` of a portrait names one                               |
| `image.screens`                | `Record<string, number>` | `nuxt.config.ts`                         | exactly the preset widths × densities, nothing else — this is the list Vercel will resize to                                                       |
| `image.quality`                | `80`                     | `nuxt.config.ts`                         | one value for every portrait                                                                                                                       |
| `image.vercel.minimumCacheTTL` | `31536000`               | `nuxt.config.ts`                         | one year at the edge                                                                                                                               |

## Outputs And Side Effects

| Output / Side Effect   | Type                     | Description                                                                                                                  |
| ---------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| served portrait        | AVIF or WebP by `Accept` | on Vercel, `/_vercel/image?url=…&w=<preset width × density>&q=80`; in `nuxt dev`, the same through the bundled IPX           |
| `srcset`               | HTML                     | x1 and x2 candidates per usage site, from the preset's `densities`                                                           |
| edge cache             | Vercel image cache       | one entry per (master, width, quality, format) for one year                                                                  |
| Vercel `images` config | build output             | `sizes` derived from `image.screens`, `formats` AVIF + WebP, `minimumCacheTTL` — emitted by the provider, never hand-written |

## Scope And Non-Goals

In scope:

- The twelve masters, re-cut from the largest bust available under the framing rule; Blonde Blazer's from the Training render.
- The Nuxt Image configuration and a preset on every portrait `NuxtImg`.
- The reset procedure after a portrait changes, recorded in `operations.md`.

Non-goals:

- Vectors. Tracing was tested (vtracer, Coupe at 512px): 370–440 KB of SVG with posterised shading against 22 KB of AVIF for the same crop.
- Lossy files at rest. The master is the served source; a lossy master would be encoded twice.
- Versioned filenames. `heroPortraitSrc` keeps building `<hero-id>.webp`; a changed master is reset by cache invalidation (Edge Cases).
- The injured, happy and mustache bust variants the wiki carries. One portrait per hero, Sonar's two forms excepted (feature 012).
- `sizes` strings per component. Presets are width-fixed per usage site because layouts today resize on container queries and content, not only on Tailwind breakpoints. A layout refactor that moves every portrait size onto a breakpoint would switch presets to `sizes`; that refactor owns the switch.
- The background wash (`public/images/background.webp`). It goes through the same optimizer and is worth a width of its own, in a change of its own.

## User / System Behavior

- Every hero renders from one master; a portrait looks the same in the card, the dialog, the roster rail, the synergy tab and the mission slot, only smaller or larger.
- Each usage site requests its own width: dialog header 24px, mission slot 88px, card 108px, synergy tab 224px, dialog panel 272px, plus the roster rail and ribbon tiles at their rendered size. A 2x screen gets the x2 candidate; nothing requests more than twice what it renders.
- A first request for a variant is a Vercel transformation; every later request for a year is a cache hit. Browsers revalidate on each load (Vercel sends `max-age=0, must-revalidate` on optimized images), so a reset at the edge reaches them on the next visit.
- In `nuxt dev`, IPX produces the same variants from the same config, so what is checked locally is what ships.

## Roles And Access

Not role-specific.

## Examples

| Input                                            | Expected Output                                                       | Notes                                             |
| ------------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------- |
| `identify public/images/portraits/*.webp`        | ten at 960×960, Phenomaman and Waterboy at 512×512, all lossless WebP | one master per hero id, plus Sonar's second form  |
| card portrait on a 2x screen, production         | `…&w=216&q=80`, `content-type: image/avif`                            | AVIF for a browser that accepts it                |
| the same in a browser without AVIF               | `image/webp`, same width                                              | negotiated by the provider                        |
| dialog panel at `md`, 2x                         | `…&w=544&q=80`                                                        | the largest variant the app requests              |
| any portrait `NuxtImg` without a `preset`        | test failure                                                          | the preset is how a usage site declares its width |
| `image.screens` holds a width no preset produces | test failure                                                          | Vercel's `sizes` list stays exactly the app's     |
| a master replaced under the same name, deployed  | old variants until `vercel cache invalidate --srcimg …` runs          | then fresh on the next request                    |
| second request for a served variant              | `x-vercel-cache: HIT`                                                 | one transformation per variant per year           |

## Business Rules

- A master is lossless and is the only copy of the portrait in the repository.
- Masters are never upscaled: a hero whose largest bust is 512 stays 512 until a larger one exists.
- The framing rule is judged on a contact sheet of all twelve crops, approved before any master is written to `public/`.
- One quality value for all portraits; the art is flat-shaded and 80 was compared against 100 at 2x before approval.
- `image.screens` is derived from the presets, not from Tailwind's breakpoints. A width appears there because a preset requests it.

## Edge Cases

- Sonar has two masters (`sonar-hybrid`, `sonar-monster`), selected by form (feature 012); both follow the framing rule.
- Replacing a master under its existing name: replace the file, deploy, then `vercel cache invalidate --srcimg /images/portraits/<hero-id>.webp`. The step is in `operations.md`; skipping it leaves the old portrait at the edge for up to a year.
- A game update that adds a hero adds a master under the new hero id (feature 002 owns the id); nothing in the config changes.
- A hero with no master falls to the browser's broken-image state; there is no placeholder art, because the roster is closed and a missing file is a build defect.

## Invariants

- One master per portrait, lossless, at most 960 on a side, square.
- Every portrait `NuxtImg` names a preset; every preset width × density is in `image.screens`; nothing else is.
- Nothing is delivered larger than twice its rendered CSS size.
- `heroPortraitSrc` and the `<hero-id>.webp` path contract are unchanged.

## Error Handling

- A `preset` that does not exist is a Nuxt Image runtime warning and an unmodified URL; the test above catches it before that.
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
- `annexes/design-system.md` §10 — records that the project uses `NuxtImg`; its sizes (108 card, aspect ratios, top-anchored crops) are the preset widths.
- `stacks/frontend/nuxt/addons/image.md` — the Nuxt Image addon (Catalyst, arriving by upgrade before implementation): masters lossless, a preset per usage site, screens derived from presets, a long edge TTL with invalidation as the reset.
- `context/glossary.md` — portrait and bust.

## Open Questions

- Quality: 80 is the draft value; the 80-vs-100 side-by-side at 2x is produced with this draft for the user to confirm.
- Framing: the twelve-crop contact sheet is produced with this draft; the offsets it settles are recorded in Verification, not here.
- Vercel Hobby image quota: the number is read from the project dashboard and recorded in `operations.md` at implementation.

## Tests

- `test/unit/portrait-masters.test.ts`: every hero id (and both Sonar forms) has a master; each is square, lossless WebP, at most 960, and at least 512.
- `test/unit/image-config.test.ts`: the set of preset widths × densities equals the set of `image.screens` values; every portrait `NuxtImg` in the usage-site components carries a `preset` that exists.
- Live walk, production, per the Examples table: request headers and `x-vercel-cache` on first and second hit, AVIF and WebP negotiation, and the browser cache header re-read after the TTL change.

## Verification

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
