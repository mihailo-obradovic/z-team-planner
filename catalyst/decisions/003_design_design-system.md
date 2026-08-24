# Decision: Instantiate the design system — Dispatch-styled reskin

## Status

Implemented

## Type

design

## Task Weight

Hard

## Context

The UI is the Nuxt UI starter skin with ad-hoc edits: seven `@theme` ramps of which only `lavender` is used, a `--font-sans: 'Oxanium'` nothing loads, a `:root` block commented out entirely, and two stale, unannotated component configs — while twelve other rendered components have no config at all. No convention annex exists, so `_vue/style-audit.md` has no tokens to check against.

A redesign was approved as mockups (`context/design-reference.md`): the game's own visual language — cream "paper" panels on a charcoal-green ground, deep-teal chrome, amber accents, hard edges — without the CRT treatment.

## Decision

Instantiate the template into a project-owned annex at `annexes/design-system.md`, then bring the UI onto it.

- **One fixed look, no colour modes.** `ui: { colorMode: false }` and the colour-mode button goes — a deliberate exception to the template's §1 "every color must flip" rule, recorded in the annex.
- **Seven ramps behind the seven semantic aliases** — `paper`→neutral, `ember`→primary, `lagoon`→secondary, `moss`→success, `gold`→warning, `brick`→error, `signal`→info; names avoid Tailwind's built-ins. Nuxt UI derives its `--ui-*` surfaces from `neutral`, so an unlayered `:root` block remaps them to paper; the ground is `secondary-900` on `body`. `--ui-text-inverted` becomes ink, at the cost of one annotated `text-neutral-100` on secondary solids.
- **Non-colour scales as CSS custom properties** — control heights, z-index, durations, radius 0 — plus two composite utilities (`panel`, `plate`) so the panel anatomy lives in one place.
- **Barlow + Barlow Condensed via `@nuxt/fonts`** (root `fonts:` key; it ships with Nuxt UI), self-hosted. Oxanium goes.
- **Lucide-only stat icons**, replacing the `stat-icons` rasters so glyphs inherit `currentColor`.
- **Every rendered component gets its vendored config** at 4.4.0 first, each deviation annotated.

Screens keep their structure and placement — this record reskins what exists. The mockups' navigation change (filters moving into a drawer) alters feature 003 and is left to its own feature document.

## Scope

The global stylesheet, `nuxt.config.ts`, `app.config.ts`, all of `app/config/nuxt-ui/`, every component under `app/`, `app/CLAUDE.md`; the new `annexes/design-system.md` and `context/design-reference.md`. Removals: the six unused ramps, `app/utils/iconsMap.ts` (its import target is missing), `public/stat-icons/`, `public/images/background.png`, the unused `simple-icons` dep. No behavior contract is touched.

## Consequences

Styling gains a single source of truth, so `_vue/style-audit.md` can flag off-scale values. Vendored configs are pinned to 4.4.0 and re-imported on an `@nuxt/ui` bump. Dropping colour modes makes a future light theme a new decision, not a toggle. `@nuxt/fonts` fetches the families at first build, so a network-isolated build needs the `local` provider with vendored `woff2`.

Two resolutions the annex carries: amber-deep, danger and busy fail AA as small text on paper, so each ramp gains a darker text-only step while the mockup values stay the fills; and steppers and chips snap to the 32 and 28 control steps.

Follow-ups: the Story Setup drawer feature, and the empty Synergy Pairs and Mission Simulator tabs.

The annex is indexed by `architecture.md` and load-triggered from the root entry document.

## Contracts Touched

- `architecture.md` — convention-annex index entry.
- `project-summary.md` — ADR index row, context-document line.
- `prime-directive.md` — context-document load trigger.
- `app/CLAUDE.md` — config inventory, annex pointer, icon-registry line removed.

## Open Questions

## Verification

Every step ran typecheck, lint, format, tests and the validator; `pnpm build` completes, which catches a dangling asset import after the removals.

Measured in a browser, not assumed: tokens resolve; both families serve from `/_fonts/` with zero `fonts.gstatic.com` requests; the height chain holds with `main` the only scrolling region; every control lands on the §4 scale; the switch's hit area reaches the 24px floor; and at 320px nothing in the main content exceeds the viewport. The §14 figures were computed from the tokens then checked against live elements, agreeing everywhere both existed.

Interactive surfaces — tooltip, toast, slideover, and the filters in vertical orientation — were walked by the user rather than an agent, and are verified on that basis.

One defect found in verification was fixed on its own branch and merged in, since it changed behaviour this record does not cover: `BuildManager` server-rendered localStorage state, desynchronising hydration and everything below it.
