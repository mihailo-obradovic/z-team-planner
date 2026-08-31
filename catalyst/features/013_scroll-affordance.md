# Feature: Scroll edge affordance

## Status

Approved

## Task Weight

Medium

## Purpose

Six regions in the hero detail dialog scroll, and none of them says so. A clipped edge looks exactly like one where the content ran out, so the rail's tenth hero and the ribbon's off-screen portraits are invisible to a user who does not think to try. The desktop scrollbar covers for it; on a phone it is an overlay that appears only once a drag is under way — and the phone is where the planner is mostly used.

This implements Catalyst 1.11.0's `stacks/frontend/_common/scroll-affordance.md` here: a shared `ScrollRegion` marking each edge where content is currently hidden, and feature 011's six containers converted onto it. It is narrower than "scrolling gets borders" — the affordance marks **hidden content**, not the act of scrolling.

## Inputs

| Input           | Type                                   | Source                     | Constraints                                                 |
| --------------- | -------------------------------------- | -------------------------- | ----------------------------------------------------------- |
| `axis`          | `'vertical' \| 'horizontal' \| 'both'` | the consuming component    | defaults to `'vertical'`; a named union, never a boolean    |
| `as`            | tag name                               | the consuming component    | defaults to `'div'`; keeps a region's own semantics (`nav`) |
| default slot    | markup                                 | the consuming component    | the scrolled content; the component supplies the scroll box |
| element size    | `ResizeObserver`                       | the region and its content | both observed — slot growth need not resize the container   |
| scroll position | passive `scroll` event                 | the region's own element   | per-edge state changes on every scroll                      |

## Outputs And Side Effects

| Output / Side Effect | Type  | Description                                                                |
| -------------------- | ----- | -------------------------------------------------------------------------- |
| edge borders         | class | a 1px `border-default` rule on each edge whose content is currently hidden |

No persisted state, no store, no route or API involvement. The component reads layout and writes classes; nothing else observes it.

## Scope And Non-Goals

In scope:

- `ScrollRegion.vue` in `web/components/_shared/`, owning the scroll box, its padding, and the edge borders.
- A pure edge-computation function with its own unit tests.
- Feature 011's six scroll containers converted onto it, including the two panels that must be restructured to stop carrying a structural border on the scrolling element.
- The rule recorded in the design-system annex.

Non-goals:

- **The `UModal` and `USlideover` body slots.** Their clipping edges are already marked — a filled `plate` band above, a footer below — and a second line under the plate's 2px border is the doubling `design-system.md` forbids.
- **The page's own scroll.** The viewport bounds it; there is no hidden edge to mark.
- **A fade or mask** on the horizontal ribbon — deferred to the on-device check (Verification).
- **`scroll-state()` container queries** — native, but Chromium-only, and the platform they are missing on is the one this feature exists for.
- **Retiring `divide-y` from the modal and slideover configs** — upstream residue with its own decision to make.

## User / System Behavior

- When content is hidden past an edge, a 1px rule is drawn on that edge — top, bottom, and left/right on a horizontal axis.
- When nothing is hidden on an edge, that edge carries no rule — including a region that overflows and is scrolled fully to one end.
- When a region does not overflow at all, it carries no rules on any edge.
- Borders run the full width or height of the region and content scrolls **under** them; the component owns the padding so nothing is inset.
- The state re-evaluates when the region resizes, when its content resizes, and on every scroll.

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

## Business Rules

- The border is `1px` at the divider tier, `border-default` (`--ui-border`, paper-500 `#8a7c5e`) — **3.13:1** against `bg-default` (paper-100 `#ece0c6`), clearing the 3:1 non-text floor that applies because it carries information rather than decorating. `border-muted` (paper-400) measures **1.47:1** and is disqualified.
- Edge comparisons carry a **1px tolerance**. Fractional device pixel ratios round `scrollTop`, `clientHeight` and `scrollHeight` independently, so an exact comparison leaves the trailing border stuck on at the end of a scroll — visible on a phone, never on the machine it was written on.
- A `ScrollRegion` never also carries a structural border. Where a bordered surface must scroll, the surface stays a static shell and the region sits inside it with the padding.
- `axis` is a named string union. A two-state input is never a boolean (`code-style`).
- **Reaching an edge never moves content.** Every edge is drawn at all times and only its colour changes, fading at the baseline duration (annex §11 — a colour fade needs no reduced-motion guard). Toggling the border itself would resize the content box by 1px whenever an edge was reached, and feed that pixel straight back into the measurement that drew it.
- Borders are drawn on pointer and touch alike. The desktop redundancy against a visible scrollbar is accepted; gating on `(pointer: fine)` would make the touch path the untested one, and iOS is not reproducible on this machine.

## Edge Cases

- **A region that only scrolls at some widths.** `:89` and `:237` carry `lg:overflow-y-auto`, so below `lg` the element does not scroll — but `scrollHeight` still exceeds `clientHeight` when `overflow` is `visible`, which would paint a border on a region the user cannot scroll. The component must confirm the axis is actually scrollable (computed `overflow` of `auto` or `scroll`) before drawing anything.
- **Content shrinking while scrolled to the bottom.** The browser clamps `scrollTop`; the content observer fires and the rules re-evaluate against the clamped position.
- **Zero-height region** (a collapsed `lg:` branch, a closed dialog). Not scrollable, no borders, no error.
- **`axis: 'both'`** may draw all four rules at once. Legal; no call site needs it.

## Invariants

- A rule is drawn on an edge **iff** content is hidden past that edge and the region is scrollable on that axis.
- The element carrying `overflow` never also carries a structural border.
- The edge computation stays a pure function of numbers — no DOM reads inside it.

## Error Handling

No failure mode reaches the user. A region whose observers never fire renders with no borders — the pre-feature behaviour, not a broken state.

## Entry Points

- `web/components/_shared/ScrollRegion.vue`: the component — scroll box, observers, scroll listener, border classes.
- `web/utils/scrollEdges.ts`: the pure edge computation, unit-tested directly.
- `web/components/HeroDetailDialog.vue`: the six call sites (`:19`, `:44`, `:47`, `:89`, `:237`, `:398` at time of writing), two of which restructure.
- `catalyst/annexes/design-system.md` §5: the rule as this project states it.

## Dependencies

- `catalyst/stacks/frontend/_common/scroll-affordance.md` — the Catalyst rule this implements; the contract for per-edge gating, the tolerance and the contrast floor.
- `catalyst/annexes/design-system.md` — the border-width tier and the "a border or a shadow, not both" rule that forces the panel restructure.
- [011_hero-detail-dialog](011_hero-detail-dialog.md) — owns every call site. Its layout is unchanged; only the elements carrying `overflow` and padding move.
- `@vueuse/core` `useResizeObserver` — already a project dependency.

## Open Questions

_None._

## Tests

- `test/unit/scrollEdges.test.ts`: no overflow → no edges; at the top → trailing edge only; mid-scroll → both; at the end → leading edge only; within 1px of the end → still treated as the end; horizontal axis mirrors vertical; a non-scrollable axis reports no edges.
- No component test asserts the borders. In jsdom `scrollHeight` and `clientHeight` are both `0`, so the region never reports overflow and such a test would pass while proving nothing — the rule's own guidance. The wiring is verified on the live walk.

## Verification

_Empty while this document is a draft._

Planned evidence: the unit suite; and a device walk at 320px and on the iOS device covering each region at the top, the middle and the end — the mobile ribbon included, where a 1px vertical rule beside `size-14` tiles may not read and would send the treatment back to a fade.

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
