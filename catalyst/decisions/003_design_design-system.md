# Decision: Instantiate the design system — Dispatch-styled reskin

## Status

Accepted

## Type

design

## Task Weight

Hard

## Context

The UI is the Nuxt UI starter skin with ad-hoc edits: seven `@theme` ramps of which only `lavender` is used, a `--font-sans: 'Oxanium'` nothing loads, a `:root` block commented out entirely, and two component configs (`button`, `modal`) that are stripped, stale against Nuxt UI 4.4.0, and unannotated — while twelve other rendered components have no config at all. No convention annex exists, so `stacks/frontend/nuxt/design-system.md` has never been instantiated and `_vue/style-audit.md` has no tokens to check against.

A redesign was drafted and approved as mockups (`context/design-reference.md`): the game's own visual language — cream "paper" panels on a charcoal-green ground, deep-teal chrome, amber accents, hard edges — without the CRT/scanline treatment.

## Decision

Instantiate the template into a project-owned annex at `annexes/design-system.md`, then bring the UI onto it:

- **One fixed look, no colour modes.** The mockups define a single theme; `ui: { colorMode: false }` and the colour-mode button goes — a deliberate exception to the template's §1 "every color must flip" rule, recorded in the annex.
- **Seven ramps behind the seven semantic aliases** — `paper`→neutral, `ember`→primary, `lagoon`→secondary, `moss`→success, `gold`→warning, `brick`→error, `signal`→info; names avoid Tailwind's built-ins. Nuxt UI derives its `--ui-*` surface variables from `neutral`, so an unlayered `:root` block remaps them to paper; the ground is `secondary-900` on `body`. `--ui-text-inverted` becomes ink — right for the amber and gold solids the design leans on, at the cost of one annotated `text-neutral-100` on secondary solids.
- **Non-colour scales as CSS custom properties** — spacing, control heights, z-index, durations, radius 0 — plus two composite utilities (`panel`, `plate`) so the panel anatomy lives in one place.
- **Barlow + Barlow Condensed via `@nuxt/fonts`** (root `fonts:` key; the module ships with Nuxt UI), self-hosted from `/_fonts/`. Oxanium goes.
- **Lucide-only stat icons**, replacing the five `public/stat-icons/*.webp` rasters so glyphs inherit `currentColor`.
- **Every rendered component gets its vendored config** re-imported at 4.4.0 before restyling, each deviation annotated.

Screens keep their structure and placement — this record reskins what exists. The mockups' navigation change (story filters moving into a drawer) alters feature 003's contract and is left to its own feature document.

## Scope

The global stylesheet, `nuxt.config.ts`, `app.config.ts`, `app/types/nuxt-ui.d.ts`, all of `app/config/nuxt-ui/`, every component under `app/`, `app/CLAUDE.md`; the new `annexes/design-system.md` and `context/design-reference.md`. Removals: the six unused ramps, `app/utils/iconsMap.ts` (its import target does not exist), `public/stat-icons/`, `public/images/background.png`, the unused `simple-icons` dep. No behavior contract is touched.

## Consequences

Styling gains a single source of truth, so `_vue/style-audit.md` can flag off-scale values and colour comes from an alias, not a palette name. The vendored configs are pinned to Nuxt UI 4.4.0 and must be re-imported on an `@nuxt/ui` bump — the cost `customization.md` already names. Dropping colour modes makes a future light theme a new decision, not a toggle. `@nuxt/fonts` fetches the families at first build, so a network-isolated build needs the `local` provider with vendored `woff2`.

Two resolutions the annex carries: amber-deep, danger and busy fail AA as small text on paper, so each ramp gains a darker text-only step (`ember-800` #8f4f10, `brick-600` #9c3521, `signal-700` #245a8c) while the mockup values stay the fills; and the dialog steppers and power chips snap to the 32 and 28 control steps, not the mockups' 30 and 27.

Follow-ups: the Story Setup drawer feature, and the empty Synergy Pairs and Mission Simulator tabs.

## Contracts Touched

- `architecture.md` — convention-annex index entry.
- `project-summary.md` — ADR index row, context-document line.
- `prime-directive.md` — context-document load trigger.
- `app/CLAUDE.md` — config inventory, annex pointer, icon-registry line removed.

## Open Questions

## Verification

Per step: `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`, plus `python3 tools/validate.py .` on document changes. Visually: a Chrome DevTools walk at 1280×800 and 375×812 over every tab, the hero dialog, each build dialog, both toasts, and the header filters in both forms — verifying the height chain holds, fonts resolve from `/_fonts/` with no `fonts.gstatic.com` request, no hydration warnings, and focus rings survive.
