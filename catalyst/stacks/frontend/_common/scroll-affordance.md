# Scroll Edge Affordance

**Tier:** Frontend — Common

A region that scrolls hides content, and nothing in the default rendering says so. A clipped edge looks exactly like an edge where the content simply ran out. The user is asked to guess, and the guess is silent — nobody reports the paragraph they never knew was there.

The scrollbar is not the answer. On a desktop pointer it usually shows, but every touch platform draws overlay scrollbars that stay hidden until a drag is already in progress — the affordance appears only to the user who did not need it. This directory is never a spawn choice; it travels automatically with any module whose `**Requires:**` header names `frontend/_common`, so the rule here holds whatever the framework is.

The rule is one sentence: **draw a 1px rule on each edge where content is currently hidden — per edge, not per region.**

## Per edge, not per region

The tempting shortcut is one boolean — does this region overflow at all — driving borders on both edges at once. It is wrong in the two states the user spends most of their time in. Scrolled to the top, the top border claims there is something above; there is not. Scrolled to the end, the bottom border claims there is more below; there is not. A line that is true in the middle and a lie at both ends is decoration, and the user learns to stop reading it.

Each edge answers its own question:

| Edge   | Hidden when                               |
| ------ | ----------------------------------------- |
| top    | `scrollTop > 0`                           |
| bottom | `scrollTop + clientHeight < scrollHeight` |
| left   | `scrollLeft > 0`                          |
| right  | `scrollLeft + clientWidth < scrollWidth`  |

Compare with a **1px tolerance**, not exact equality. On a fractional device pixel ratio the three values are rounded independently, so a region scrolled fully to the end lands a fraction short of its own `scrollHeight` and the bottom border never clears. The bug shows on a phone and never on the machine it was written on.

## What the borders are attached to

The scrolling element owns its padding, so the rules run the full width of the region and the content scrolls **under** them. A border inset from the container's edge, with a gap at each end, reads as a stray divider rather than an edge.

That has a consequence worth stating: **a scrolling element never carries a structural border of its own.** Where a bordered surface needs to scroll, split it — the surface stays a static shell with the border, and an inner element takes the padding and does the scrolling. Fusing a 1px affordance to a structural edge either doubles the border or hides the affordance inside it, and the design system's own "a border or a shadow, not both" rule already forbids the first.

Two regions the rule does not cover: one whose edges are already marked by adjacent chrome — a pinned header band, an action footer — where the clipping edge is visible without help, and one that is the page's own scroll, which the viewport bounds.

## The border is an indicator, not a divider

It carries information: it is the only thing telling the user content exists off-screen. That puts it under the non-text contrast rule (WCAG 1.4.11) at **3:1 against the surface behind it**, unlike the decorative dividers it will visually resemble. Reach for the divider **width** (1px) and check the **colour** against the contrast floor rather than picking the palette's faintest line by eye. If the quiet token fails, promote it — a hint nobody can see is not a quieter version of the affordance, it is its absence.

## Building it once

Every scroll region in a project wants the same behaviour, so it is a component that owns the scrolling, not a helper applied by hand at each site. The one prop is the axis, and it is a **named string union** (`vertical` / `horizontal` / `both`), never a boolean — same rule as any other two-state input.

Detecting a change needs three sources, and missing any one leaves the border stale:

- The **container** resizing — a window resize, a layout change around it.
- The **content** resizing — slot content growing or shrinking inside a container that never changed size. Observing only the container misses this entirely, and it is the common case in a dialog.
- **Scroll**, passively — the per-edge state changes on every scroll, which is the whole point.

Do not reach for `scroll-state()` container queries yet. They express exactly this (`container-type: scroll-state`, then `@container scroll-state(scrollable: top)`) with no script at all, and they are the right answer eventually — but they are Chromium-only, and the platform they are missing on is the touch platform where the affordance matters most.

## Checking it

Split the arithmetic from the wiring. The edge computation is a pure function of three numbers per axis — `scrollTop`, `clientHeight`, `scrollHeight` — and it is where the mistakes are: the both-edges shortcut, the missing tolerance, an off-by-one at the end. Unit-test it directly.

The wiring is not unit-testable and should not be faked into looking so. In a DOM stub `scrollHeight` and `clientHeight` are both `0`, so the region never reports overflow and a passing test proves nothing about the running component. That half goes on the live browser walk, at the project's narrowest supported width, scrolled to the top, the middle and the end — the three states, checked separately, on a real touch device where the scrollbar will not cover for a border that never appears.

**In the project:** this applies wherever a component scrolls a region inside the page — no separate opt-in. When a region gains `overflow` on either axis, the affordance ships in the same change, not as a follow-up.
