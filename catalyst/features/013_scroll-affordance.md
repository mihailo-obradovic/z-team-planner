# Feature: Scroll edge affordance

## Status

Active

## Task Weight

Medium

## Purpose

Six regions in the hero detail dialog scroll. A clipped edge looks exactly like one where the content ran out, so the rail's tenth hero and the ribbon's off-screen portraits are invisible to a user who does not think to try; on a phone the scrollbar is an overlay that appears only once a drag is under way.

This implements `stacks/frontend/_common/scroll-affordance.md` here: a shared `ScrollRegion` marking each edge where content is currently hidden, and feature 011's six containers converted onto it. It is narrower than "scrolling gets borders" — the affordance marks **hidden content**, not the act of scrolling.

## Inputs

| Input           | Type                                   | Source                     | Constraints                                                 |
| --------------- | -------------------------------------- | -------------------------- | ----------------------------------------------------------- |
| `axis`          | `'vertical' \| 'horizontal' \| 'both'` | the consuming component    | defaults to `'vertical'`; a named union, never a boolean    |
| `as`            | tag name                               | the consuming component    | defaults to `'div'`; keeps a region's own semantics (`nav`) |
| default slot    | markup                                 | the consuming component    | the scrolled content; the component supplies the scroll box |
| element size    | `ResizeObserver`                       | the region and its content | both observed — slot growth need not resize the container   |
| scroll position | passive `scroll` event                 | the region's own element   | per-edge state changes on every scroll                      |
| `bringIntoView` | exposed method                         | the consuming component    | takes a descendant of the region; a no-op otherwise         |

## Outputs And Side Effects

| Output / Side Effect | Type  | Description                                                                |
| -------------------- | ----- | -------------------------------------------------------------------------- |
| edge borders         | class | a 1px `border-default` rule on each edge whose content is currently hidden |
| scroll position      | write | `bringIntoView` moves the region's own `scrollLeft` / `scrollTop`          |

No persisted state, no store, no route or API. The component reads layout, writes classes, and scrolls itself when asked; nothing else observes it.

## Scope And Non-Goals

In scope:

- `ScrollRegion.vue` in `web/components/_shared/`, owning the scroll box, its padding, and the edge borders.
- A pure edge-computation function with its own unit tests.
- `bringIntoView`, scrolling a child to the minimum position that leaves it fully visible (annex §11).
- Feature 011's six scroll containers converted onto it, including the two panels that must be restructured to stop carrying a structural border on the scrolling element.
- The rule recorded in the design-system annex.

Non-goals:

- **The `UModal` and `USlideover` body slots.** Their clipping edges are already marked by the `plate` band above and the footer below; a second line would be the doubling the annex forbids.
- **The page's own scroll.** The viewport bounds it; there is no hidden edge to mark.
- **A fade or mask** on the horizontal ribbon — the edge rules read at 2× beside the tiles and suffice.
- **`Element.scrollIntoView`** — it walks the ancestor chain, so a ribbon tile could scroll the dialog body with it.
- **Deciding _when_.** The caller's; feature 019 owns the roster's triggers.
- **`scroll-state()` container queries** — native, but Chromium-only, and the platform they are missing on is the one this feature exists for.

## User / System Behavior

- When content is hidden past an edge, a 1px rule is drawn on that edge — top, bottom, and left/right on a horizontal axis.
- When nothing is hidden on an edge, that edge carries no rule — including a region that overflows and is scrolled fully to one end.
- When a region does not overflow at all, it carries no rules on any edge.
- Borders run the full width or height of the region and content scrolls **under** them; the component owns the padding so nothing is inset.
- The state re-evaluates when the region resizes, when its content resizes, and on every scroll.
- `bringIntoView(target)` scrolls the region by the **minimum** leaving `target` fully visible, on whichever axes it actually scrolls, clamped to its range. An already-visible target does not move.
- The target clears the edge by the region's own computed **gap**, so it does not land under an edge rule. Where the range is too short, the clearance gives up first — never the visibility.
- Annex §11 governs the rest: smooth at `--duration-slow`, jumping under reduced motion — where it still runs, because it corrects what is visible.

## Roles And Access

Not role-specific.

## Examples

For a vertical region 300px tall whose content is 900px:

| Input                          | Expected Output      | Notes                                      |
| ------------------------------ | -------------------- | ------------------------------------------ |
| `scrollTop: 0`                 | bottom rule only     | nothing above; the top rule would be a lie |
| `scrollTop: 300`               | top and bottom rules | hidden in both directions                  |
| `scrollTop: 600`               | top rule only        | scrolled to the end                        |
| `scrollTop: 599.6`             | top rule only        | within the 1px tolerance — still "the end" |
| content 200px (no overflow)    | no rules             | nothing hidden on either edge              |
| `overflow` not active at width | no rules             | see Business Rules                         |

For `bringIntoView`, a horizontal region 300px wide with `gap: 8px` (the leading edge mirrors):

| Input                                      | Expected Output     | Notes                       |
| ------------------------------------------ | ------------------- | --------------------------- |
| target fully visible                       | no scroll           | already satisfied           |
| clipped 20px past the right edge           | `scrollLeft` += 28  | 20 to clear, 8 for the gap  |
| the same, with 12px of range left          | `scrollLeft` += 12  | the clearance gives first   |
| axis not scrollable, or target not a child | no scroll, no error | never throws at a call site |

## Business Rules

- The border is `1px` at the divider tier, `border-default` (`--ui-border`, paper-500 `#8a7c5e`) — **3.13:1** against `bg-default` (paper-100 `#ece0c6`), clearing the 3:1 non-text floor that applies because it carries information rather than decorating. `border-muted` (paper-400) measures **1.47:1** and is disqualified.
- Edge comparisons carry a **1px tolerance**: fractional device pixel ratios round `scrollTop`, `clientHeight` and `scrollHeight` independently, so an exact comparison leaves the trailing border stuck on at the end of a scroll.
- A `ScrollRegion` never also carries a structural border. Where a bordered surface must scroll, the surface stays a static shell and the region sits inside it with the padding.
- `axis` is a named string union. A two-state input is never a boolean (`code-style`).
- **Reaching an edge never moves content.** Every edge is drawn at all times and only its colour changes, fading at the baseline duration (a colour fade needs no reduced-motion guard). Toggling the border itself would resize the content box by 1px and feed that pixel back into the measurement that drew it.
- **`bringIntoView` scrolls this region and nothing above it** — a dialog body scrolling because a ribbon tile moved is a second, unasked-for motion. The clearance is the region's own computed `gap`, not a constant; no gap, no clearance.
- Borders are drawn on pointer and touch alike; gating on `(pointer: fine)` would make the touch path the untested one.

## Edge Cases

- **A region that only scrolls at some widths.** Two dialog regions carry `lg:overflow-y-auto`, so below `lg` the element does not scroll — but `scrollHeight` still exceeds `clientHeight` when `overflow` is `visible`, which would paint a border on a region the user cannot scroll. The component must confirm the axis is actually scrollable (computed `overflow` of `auto` or `scroll`) before drawing anything.
- **Content shrinking while scrolled to the bottom.** The browser clamps `scrollTop`; the content observer fires and the rules re-evaluate against the clamped position.
- **Zero-height region** (a collapsed `lg:` branch, a closed dialog). Not scrollable, no borders, no error.
- **`axis: 'both'`** may draw all four rules at once. Legal; no call site needs it.
- **A region not laid out yet** — a dialog's first frame. Zeroes measured, the call a no-op; the caller retries after layout.
- **A target larger than the region.** Its leading edge comes into view.

## Invariants

- A rule is drawn on an edge **iff** content is hidden past that edge and the region is scrollable on that axis.
- The element carrying `overflow` never also carries a structural border.
- The edge computation stays a pure function of numbers — no DOM reads inside it.
- `bringIntoView` moves no element's scroll position but the region's own, and never moves an already-visible target.

## Error Handling

No failure mode reaches the user. A region whose observers never fire renders with no borders — the pre-feature behaviour, not a broken state.

## Entry Points

- `web/components/_shared/ScrollRegion.vue`: the component — scroll box, observers, scroll listener, border classes, exposed `bringIntoView`.
- `web/utils/scrollEdges.ts`: the pure edge computation, unit-tested directly.
- `web/components/HeroDetailDialog.vue`: the rail, ribbon and body call sites; `HeroStatsPanel.vue`, `HeroPowersPanel.vue` and `HeroNotesPanel.vue`: one each, the stats and powers panels being the two that restructure.
- `catalyst/annexes/design-system.md` §5: the edge rule; §11: the bring-into-view pattern.

## Dependencies

- `catalyst/stacks/frontend/_common/scroll-affordance.md` — the Catalyst rule this implements; the contract for per-edge gating, the tolerance and the contrast floor.
- `catalyst/annexes/design-system.md` — the border-width tier, the "a border or a shadow, not both" rule that forces the panel restructure, and §11's _bring into view_ pattern.
- [011_hero-detail-dialog](011_hero-detail-dialog.md) — owns every call site. Its layout is unchanged; only the elements carrying `overflow` and padding move.
- No runtime dependency: `ResizeObserver`, `MutationObserver` and `Element.scrollTo` directly; the project carries no `@vueuse/core`.

## Open Questions

## Tests

- `test/unit/scrollEdges.test.ts`: no overflow → no edges; at the top → trailing edge only; mid-scroll → both; at the end → leading edge only; within 1px of the end → still treated as the end; horizontal axis mirrors vertical; a non-scrollable axis reports no edges.
- `test/unit/scrollEdges.test.ts` also covers the bring-into-view offset as a pure computation: already visible, clipped past each edge, a short range, a non-scrollable axis.
- `test/nuxt/scroll-region.test.ts`: `scrollTo` is called on the region's own element and no ancestor; a non-descendant target is a no-op; reduced motion passes `behavior: 'auto'`.
- No component test asserts the borders: in jsdom `scrollHeight` and `clientHeight` are both `0`, so such a test would pass while proving nothing. The wiring is verified on the live walk.

## Verification

`test/unit/scrollEdges.test.ts` covers the edges and the bring-into-view offset; `pnpm typecheck`, `pnpm lint` and `pnpm format:check` clean.

Walked in Chromium from 320×640@2× to 1280×620, reading the computed border colours per region at the top, mid-scroll and the end: every region gave trailing-only, both, then leading-only, and at `end - 0.6px` still read as the end. The mobile ribbon mirrors it horizontally with portraits clipping under the rules. Regions that do not overflow, and regions below the width where their `overflow` applies, carry none; the `UModal` body keeps its own 2px accented border. The stats panel does not overflow at any width for any hero, so its path is covered by the unit suite rather than a live rule. `bringIntoView`'s live evidence is [feature 019](019_roster-follow.md)'s walk, its only caller. The iOS device check is outstanding — no local WebKit.

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
