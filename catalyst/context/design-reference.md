# Design Reference — Dispatch-styled redesign

A **context document** (`references/context-documents.md`), project-specific: the approved visual redesign this app's interface is built to. Background, never a contract — the measured values live in `annexes/design-system.md`, and where the two disagree the annex wins. This file explains the intent and points at the pictures.

**Loads when:** styling or restyling UI, drafting or reviewing a UI feature document, or judging whether an interface change fits the product's look.

## The mockups

The approved boards live on a design canvas: **https://claude.ai/code/artifact/51fc2111-3159-46e4-9fc1-708097ffaaad**

| Board              | Shows                                                                             | Status                                      |
| ------------------ | --------------------------------------------------------------------------------- | ------------------------------------------- |
| Overview           | Hero card grid in synergy-pair columns, top bar, tabs, Episode 8 recruits row     | Built — feature 003                         |
| Hero Detail        | Tabbed dialog: portrait panel beside a merged stats + radar panel, roster strip   | Built without the tabs — feature 011        |
| Story Setup drawer | Episode filters and the training budget moved out of the top bar into a slideover | Built — feature 003                         |
| Synergy Pairs      | The four pairs with combined stat bars                                            | Built — feature 014                         |
| Mission Simulator  | Three user-defined mission templates, required-vs-team radar, success calculation | Built — feature 015                         |
| Mobile Overview    | Phone-width hero cards, 52px top bar with two bare glyphs, bottom action bar      | Responsive reference — the base tier in §13 |
| Design System Seed | The token sheet the annex was measured from                                       | Superseded by the annex                     |

## Direction

The game's own visual language — a paper dossier read through the SDN terminal — **without** the game's CRT, scanline, or screen-warp treatment: those were tried and rejected as noise. Cream "paper" panels sit on a charcoal-green ground; chrome (top bar, inactive tabs) is deep teal; amber carries primary actions and trained values; gold marks selection and counters. Every edge is hard — radius 0 throughout. Panels carry a 2px ink border plus a thin red-orange outer ring and a soft drop shadow, and are titled by a gradient "plate" band.

Type is condensed and shouty for structure (uppercase, tracked labels and titles) and plain for reading. Stat icons stay in the app's existing stroke set — vector replicas of the in-game raster icons were tried and rejected (the combat glyph reads badly at UI sizes).

## Fixed decisions

- **One theme, no light/dark.** The mockups define a single look; the colour-mode toggle is dropped.
- **Icons: Lucide only**, inheriting `currentColor` — the `stat-icons` rasters are retired.
- **The dark background image stays, as a wash.** Structural depth comes from the panel treatment; the image is texture behind it at 20% (design-system annex §10), not a competing layer.

## Concept boards and game rules

The Mission Simulator board encodes rules taken from the game rather than invented: skill checks cap at 10, mission success is the shared radar area over the required area, one synergy pair contributes +5/10/15%, and a mission may carry a fail threshold that auto-fails when a team stat reaches it. Four hero slots is the maximum — Punch Up's _Squeeze In_ fills a missing slot on smaller calls, it never raises the cap. The board's values are sketches; feature 015 and `context/game-mechanics.md` are the contract, and the board's "guaranteed success" label was not adopted.
