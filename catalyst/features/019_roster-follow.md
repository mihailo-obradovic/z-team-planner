# Feature: Roster follow

## Status

Approved

## Task Weight

Easy

## Purpose

The hero detail dialog carries a roster control that switches hero without closing — a vertical rail from `lg`, a horizontal ribbon below it (feature 011). It holds eight to ten heroes and clips at every tier, and it is the only thing in the dialog that says _where you are_ in the roster. When the app moves the open hero somewhere the strip is not showing — the synergy partner control does exactly that — the mark moves off-screen and the control silently stops answering the question it exists to answer.

Feature 013 gave the same strips an edge rule saying content is hidden. This is the other half: when the app hides the marked tile, the strip goes and gets it.

Split from feature 011 rather than amended into it: 011 is at its size budget, and the triggers are their own contract with their own tests.

## Inputs

| Input          | Type             | Source                         | Constraints                                                   |
| -------------- | ---------------- | ------------------------------ | ------------------------------------------------------------- |
| open hero      | `HeroId \| null` | feature 011's `heroId` prop    | `null` closes the dialog; no strip exists and nothing scrolls |
| roster order   | `Hero[]`         | feature 011's `rosterOrder`    | the marked tile is the one whose id equals the open hero      |
| rendered strip | element          | the rail (`lg`+) or the ribbon | exactly one of the two is rendered at a given width           |
| tile click     | UI event         | a tile in the rendered strip   | follows only when that tile was itself partly clipped         |

## Outputs And Side Effects

| Output / Side Effect | Type  | Description                                                           |
| -------------------- | ----- | --------------------------------------------------------------------- |
| strip scroll offset  | write | the rendered strip's own `scrollLeft` / `scrollTop`, and nothing else |

No persisted state, no store, no route or API involvement. Nothing here is serialized, and closing the dialog loses nothing.

## Scope And Non-Goals

In scope:

- The three moments the strip follows the open hero, and what "follows" means at each.
- Which strip follows at which tier.

Non-goals:

- **The scroll itself.** Feature 013's `bringIntoView` owns the arithmetic, the gap clearance, the clamping and the reduced-motion branch. This document owns only _when_ it is called.
- **Changing the roster's order, contents, or marking.** All feature 011's, unchanged.
- **Following anything but the open hero.** Hovering a tile, focusing one with the keyboard, or scrolling by hand never triggers a follow.
- **A scroll on close.** The strip is unmounted; there is nothing to position.
- **Snapping.** The strip is free-scrolling and stays so; a tile may rest partly clipped after a manual scroll and the app does not correct it.

## User / System Behavior

- **The marked tile is fully visible after every change of the open hero.** Whichever strip is rendered scrolls it into view by the minimum needed, cleared past the edge by the strip's own gap (feature 013). A tile already fully visible does not move.
- Three moments trigger a follow, and only these three:
  - **The dialog opens.** The strip has no prior scroll position to preserve, and the hero was chosen somewhere else entirely — a card, a pair, a mission slot.
  - **The app changes the hero.** The synergy partner control is the case: the user names a hero, not a position, and the partner is commonly outside the visible window.
  - **A click on a partly clipped tile.** The user reached for a tile they could only half see; it becomes whole where they clicked it. A click on a fully visible tile scrolls nothing.
- The rail follows vertically from `lg`, the ribbon horizontally below it. Both are mounted at every width and one is `display: none`, so both are asked and the hidden one measures zero and does nothing — no tier detection anywhere.
- Under `prefers-reduced-motion: reduce` the follow still happens and lands in the same place, without the smooth curve (annex §14.4). It corrects what is visible; only its smoothness is decoration.

## Roles And Access

Not role-specific.

## Examples

| Input                                            | Expected Output                        | Notes                                  |
| ------------------------------------------------ | -------------------------------------- | -------------------------------------- |
| open a hero whose tile is off-screen in the rail | the rail scrolls it fully into view    | minimum scroll, cleared by the gap     |
| open a hero whose tile is already visible        | nothing scrolls                        | no motion without information          |
| select a partner outside the visible window      | the rendered strip scrolls to them     | rail at `lg`+, ribbon below            |
| select a partner already fully visible           | nothing scrolls                        |                                        |
| click a ribbon tile clipped at the edge          | the ribbon nudges until it is whole    | the tile you clicked, made readable    |
| click a fully visible ribbon tile                | nothing scrolls                        | the common case                        |
| a roster short enough not to overflow            | nothing scrolls at any tier            | visible by construction                |
| `prefers-reduced-motion: reduce`                 | the same final offset, no smooth curve | annex §14.4                            |
| the dialog's first frame                         | the tile is in view once laid out      | never scrolled from a zero measurement |

## Business Rules

- A follow scrolls the roster strip and nothing above it. The dialog's own scrolling column never moves as a side effect — this is why feature 013 rules out `Element.scrollIntoView`.
- A follow is never triggered by a scroll the user performed. Manual scrolling is not corrected, undone, or re-centred.
- The target is always the marked tile — the one whose hero equals the open hero — and never a neighbour, an index, or a remembered element.
- The follow reads state; it never writes any. No planner value, no build key, and nothing feature 011 owns changes because a strip scrolled.

## Edge Cases

- **The dialog's first frame.** The strip has not laid out when the open hero is first set, so the call is deferred until it has. Feature 013 makes a zero measurement a no-op, so a premature call is harmless rather than a wrong scroll.
- **The tier changes while the dialog is open** — a resize across `lg` swaps the rail for the ribbon. The newly rendered strip follows on its first layout; the unmounted one is not positioned.
- **The roster shrinks under the open hero** (an episode change removing recruits). Either the hero survives in the list and is followed as usual, or the dialog is showing a hero the roster no longer holds — feature 011's existing case, and no follow is attempted.
- **Episode-8 recruits appearing** lengthen the strip; the next follow measures the new geometry, and nothing is cached across it.
- **A double change in one tick** (a partner selection that also changes the roster). One follow runs, against the final state.

## Invariants

- After every change of the open hero, the marked tile is fully visible in the rendered strip.
- A follow changes the scroll offset of the rendered strip and of no other element.
- A tile that is already fully visible is never scrolled.
- Nothing in this feature is persisted, serialized, or observable to another feature.

## Error Handling

No failure mode reaches the user. A strip that has not laid out, a missing tile, or a roster the open hero has left all resolve to "no scroll" — the pre-feature behaviour, never an error state.

## Entry Points

- `web/components/HeroDetailDialog.vue`: the two strips, their tile refs, and the watcher that calls the follow.
- `web/components/_shared/ScrollRegion.vue`: `bringIntoView`, the mechanism (feature 013).

## Dependencies

- [011_hero-detail-dialog](011_hero-detail-dialog.md): the dialog, the two strips, the roster order and which tile is marked. This feature adds no control and changes no layout.
- [013_scroll-affordance](013_scroll-affordance.md): `bringIntoView` — the minimum self-scroll, the gap clearance and the reduced-motion branch. This document owns _when_; 013 owns _how_.
- `annexes/design-system.md` §11 _bring into view_ and §14.4: the duration, the clearance and the reduced-motion rule.

## Open Questions

_None._

## Tests

- `test/nuxt/roster-follow.test.ts`: opening the dialog asks the rendered strip to bring the marked tile into view; the synergy partner control does the same; a click on a clipped tile follows and a click on a visible one does not; the target passed is the marked tile and not another; nothing is asked when the roster does not overflow; the rail is asked at `lg`+ and the ribbon below.
- The scroll's arithmetic is not re-tested here — it is feature 013's, unit-tested there. These cases prove the dialog asks, with the right target, at the right three moments.
- Live browser walk of the Examples at `lg`+ (rail) and 320px (ribbon), plus a reduced-motion pass.

## Verification

`test/nuxt/roster-follow.test.ts` — 5 cases against a `ScrollRegion` stub that records what it was asked to bring into view: opening asks both strips with the marked tile; a hero change asks with the new tile and never the one it replaced; the synergy partner control follows; a click follows the clicked tile even when it is already the open hero; nothing is asked when no hero is open. `test/unit/scrollEdges.test.ts` covers the arithmetic (feature 013). Full suite 313 passed / 38 files; lint, format and typecheck clean.

Live in Chrome. **Rail at 1440×520** (8 heroes, 426 visible of 728): opening on the last hero scrolls `0 → 302`, its maximum, and the tile is whole — the clearance gave way at the end of the range, as specified. With the rail hand-scrolled to 0, the partner control moved to a hero off-screen and the rail followed `0 → 302`. A tile clipped by 25px scrolled to `34` — 25 to clear plus the 8px gap — leaving 9px below it; clicking an already-whole tile moved nothing. **Ribbon at 320×640@2×** (280 visible of 504): opening on the last hero scrolled to 224, its maximum; a tile clipped by 31px scrolled to `40`, leaving 9px. Throughout, the dialog's own scrolling column stayed at 0 and the page never scrolled sideways.

One bug found by the walk and fixed in this change: the open trigger was first written as an `immediate` watcher, which runs in setup — on the server, where there is no `requestAnimationFrame`. `/` is prerendered, so the page 500'd. It is an `onMounted` hook instead, which never runs server-side. No test could have caught it; the component tests run client-only.

Not covered: a `prefers-reduced-motion: reduce` machine — Chrome DevTools offers no media emulation for it, so the `behavior: 'auto'` branch is unexercised.

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
