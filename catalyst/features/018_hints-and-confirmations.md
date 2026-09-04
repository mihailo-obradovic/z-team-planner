# Feature: Hints and confirmations

## Status

Approved

## Task Weight

Medium

## Purpose

Every power chip on a hero card explains itself in a tooltip, and a tooltip opens on hover. A phone cannot hover, so on the device the planner is mostly used on the chips are unlabelled glyphs: the only way to learn that the swords icon is Comet is to open the hero detail dialog. The same gap exists wherever the app puts information behind hover.

This feature settles the rule rather than patching the sites. Hover is a property of the input device, not of the screen width, and the app detects it as such. A **hint** (glossary) is hover-only by definition: where hover exists it is shown, and where it does not the same information is read in the element's detail surface — nothing new is built for touch to replace it. What touch gets instead is a **confirmation**: a short line, anchored to the chip, naming what a tap just did — "Comet trained" — so the glyph explains itself the moment it is used. Icons whose meaning is assumed known are **common symbols** and carry neither.

The deliberate trade: no popovers, no tap-to-reveal, no second interaction model for touch. Discovery stays with the dialog; the confirmation is the one addition.

## Inputs

| Input           | Type                              | Source                                             | Constraints                                                                   |
| --------------- | --------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------- |
| input mode      | `'hover' \| 'no-hover'`           | `matchMedia('(hover: hover) and (pointer: fine)')` | reactive: re-evaluated when the query changes (a mouse plugged into a tablet) |
| chip action     | click / tap on a card chip        | `HeroPowerChips`, the flight chip                  | the existing toggle handlers; this feature adds nothing to what they do       |
| resulting state | the chip's state after the action | the planner store                                  | decides whether a line is shown and what it says (Business Rules)             |

## Outputs And Side Effects

| Output / Side Effect | Type     | Description                                                                                   |
| -------------------- | -------- | --------------------------------------------------------------------------------------------- |
| confirmation line    | rendered | tooltip-styled text anchored to the tapped chip, held for `--duration-linger`, then fades out |
| hint                 | rendered | the existing hover tooltip, unchanged, shown only in `hover` mode                             |

No persisted state, no store field, no route or API involvement. The store changes the chips already make are untouched.

## Scope And Non-Goals

In scope:

- One composable exposing the input mode as a reactive named union.
- Confirmations on every card chip that changes state: Sonar's form, the starting power, the two upgrade powers, the special powers (Supernova, En Pointe, Spread Thin), and flight.
- The wording table below, owned here.
- A new `--duration-linger` token in the design-system annex §11.
- Feature 012 amended where it describes the special chips' tooltips; feature 016 amended to name the Copy marker a common symbol; annex §13 and §14.2 noting the rule.

Non-goals:

- **Tap-to-reveal, popovers, or any inline rendering of a hint on no-hover devices.** Rejected: a second interaction model for touch only. The dialog is where a power is read.
- **Confirmations on hover-capable devices.** The hovered tooltip is already open over the chip and reflects the new state; a second line on the same chip would fight it.
- **Confirmations on deactivation.** Untraining, hiding the starting power, switching a special power off, or cycling back to off shows nothing; the chip going neutral is the feedback.
- **A line on a disabled chip.** A full training budget disables the upgrade chips and a tap does nothing; the budget is visible in the Story Setup drawer.
- **Common symbols.** The mission team's Copy marker, the radar threshold markers (their values are the user's own entries in the templates panel), and the header's icon-only build actions on a wide touch device keep their accessible labels and get no hint and no confirmation.
- **The hover tooltip's truncation of long descriptions.** Known, unrelated to input devices, and deliberately left.
- **Feature 016's width tiers.** They decide layout by room, not by input, and keep their behaviour; only the phrase "the tier with no hover" is corrected.

## User / System Behavior

- When the input mode is `hover`, every chip behaves exactly as today: hover shows the hint, click acts, no confirmation.
- When the input mode is `no-hover`, a tap acts immediately, and if the chip's resulting state is active or a new cycle position, a confirmation line appears anchored to the chip.
- The line is held for `--duration-linger`, then fades at `--duration-baseline`. A tap on any other chip replaces it; a repeat tap on the same chip re-arms it with the new text.
- When the input mode changes while the app is open, the next interaction follows the new mode; a line already showing finishes on its own.

## Roles And Access

Not role-specific.

## Examples

All in `no-hover` mode. Chip states are feature 012's.

| Input                                         | Expected Output          | Notes                                                            |
| --------------------------------------------- | ------------------------ | ---------------------------------------------------------------- |
| tap the starting power chip, was hidden       | "On Fire revealed"       | hero's starting power name                                       |
| tap an upgrade chip, was untrained            | "Comet trained"          |                                                                  |
| tap the flight chip, was untrained            | "Wingsuit trained"       | falls back to "Flight trained" when the flight power has no name |
| tap Supernova, was off                        | "Supernova on"           |                                                                  |
| tap Sonar's form chip, was hybrid             | "Mega Bat Form"          | the state's own name; "Hybrid Form" on the way back              |
| tap En Pointe, was off                        | "En Pointe: Combat +1"   | resulting cycle position; +3 when Coupé is upgraded              |
| tap En Pointe, was Combat                     | "En Pointe: Mobility +1" |                                                                  |
| tap Spread Thin, was 1 slot                   | "Spread Thin: +2 slots"  | slot count only, as feature 012's chip label                     |
| tap any chip and it deactivates               | nothing                  | chip turns neutral, no line                                      |
| tap an upgrade chip disabled by a full budget | nothing                  | the tap does not fire                                            |
| same taps in `hover` mode                     | nothing beyond today     | the hovered tooltip already shows the new state                  |
| tap chip A, then chip B within the linger     | B's line only            | A's is replaced, not stacked                                     |

## Business Rules

- Input mode is decided by `(hover: hover) and (pointer: fine)` and nothing else — never a width tier, never a user-agent string. An iPad with a trackpad is `hover`; a touch laptop in a wide window is `no-hover` while it is being touched, per the browser's own report.
- The mode is a named string union, never a boolean (`code-style`).
- Wording: binary chips say "<Name> <past participle>" — revealed, trained — or "<Name> on" for Supernova; Sonar's form says the resulting form's name. Cycling chips say "<Name>: <resulting state>". No exclamation marks; the annex's plain reading voice.
- A line is shown **iff** the chip's resulting state is active (binary) or a non-off cycle position (cycling). Never on deactivation.
- The line is rendered with the tooltip's styling and placement so nothing new is designed; the confirmation and the hint are never on screen together, because they belong to different modes.
- `--duration-linger` is 1500ms, added to annex §11 as a named token. The hold is not motion and needs no reduced-motion guard; the fade is an opacity change at the baseline, which needs none either (§14.4).

## Edge Cases

- **Mode flips mid-linger.** The line finishes on its own; nothing is cut short.
- **Flight power with no name.** Some heroes' flight has only a description; the line says "Flight trained".
- **Golem's fourth chip.** Spread Thin appears only once his trainable-1 is trained; its first tap goes to "+1 slot" and reads "Spread Thin: +1 slot", singular.
- **The synergy pairs tab.** It reuses the card's chip strip (feature 014), so confirmations appear there under the same rules with no separate wiring.
- **`matchMedia` unavailable** (a test environment). Mode defaults to `hover`, the pre-feature behaviour.

## Invariants

- A hint is never shown in `no-hover` mode, and a confirmation is never shown in `hover` mode.
- A confirmation never changes what a tap does; the store transition is identical in both modes.
- Deactivation never produces a line.
- Common symbols carry an accessible label and nothing else.

## Error Handling

No failure mode reaches the user. A confirmation that fails to render leaves the tap's effect intact, which is the pre-feature behaviour.

## Entry Points

- `web/composables/useInputMode.ts`: the reactive mode.
- `web/components/_shared/TooltipButton.vue`: the single wrapper under every card chip; gains the mode switch and the confirmation rendering.
- `web/components/HeroPowerChips.vue`, `web/components/HeroCard.vue` (flight): supply the confirmation text per chip from the resulting state.
- `web/utils/confirmationText.ts`: the pure wording function, unit-tested.
- `catalyst/annexes/design-system.md` §11 (`--duration-linger`), §13 and §14.2 (the hint / confirmation / common-symbol rule).

## Dependencies

- [012_special-powers](012_special-powers.md): the chip states and cycle order the wording is derived from; amended for its tooltip mentions.
- [016_mission-simulator-responsive](016_mission-simulator-responsive.md): the Copy marker, named a common symbol; its "no hover" phrasing corrected.
- [014_synergy-pairs-tab](014_synergy-pairs-tab.md): reuses the chip strip; no change, inherits the behaviour.
- `catalyst/context/glossary.md`: hint, confirmation, common symbol.

## Open Questions

_None._

## Tests

- `test/unit/confirmationText.test.ts`: every row of the Examples table as a pure function of chip kind, previous and resulting state, including the flight fallback, the singular slot, and `null` for every deactivation.
- `test/nuxt/tooltip-button.test.ts`: in `no-hover` mode a click emits and renders the given confirmation; in `hover` mode a click emits and renders none; a disabled chip emits nothing; a second click replaces the text; the mode composable defaults to `hover` without `matchMedia`.
- The linger timing and the fade are verified on the live walk, not asserted in jsdom.

## Verification

`test/unit/confirmationText.test.ts` (7 cases), `test/nuxt/tooltip-button.test.ts` (5 cases) and `test/nuxt/input-mode.test.ts` (1 case) pass, alongside the whole suite (40 files, 310 tests), `pnpm typecheck`, `pnpm lint` and `pnpm format:check`.

The live walk (Chromium, no-hover emulation, every Examples row) did not run: the chrome-devtools MCP browser instance was held by a concurrent session throughout this work and could not be reached. This is a remaining risk, not a claim of working UI — retry once the browser is free. The iOS device check stays the user's, as it is for every feature here (no local WebKit).

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
