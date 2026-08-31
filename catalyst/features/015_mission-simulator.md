# Feature: Mission simulator tab

## Status

Approved

## Task Weight

Hard

## Purpose

Fill the planner's empty "Mission simulator" tab (the last feature 003 placeholder): the player composes a team of up to four heroes, tunes three editable mission templates, and reads an estimated success chance computed the way the game scores calls — radar coverage plus synergy — with every slot-dependent power derived from the actual team instead of the manual what-if chips. Desktop layout first; responsive adjustments are follow-up work.

## Inputs

| Input                  | Type     | Source                               | Constraints                                                       |
| ---------------------- | -------- | ------------------------------------ | ----------------------------------------------------------------- |
| template stat edits    | UI event | active template's REQ / threshold rows | REQ 0–10; thresholds 1–10 or unset; integers                     |
| active template select | UI event | template list                        | exactly one of the three active                                   |
| slot fill / replace    | UI event | empty-slot click or portrait click → hero picker dialog | roster filtered by episode setup; on-team heroes excluded |
| slot remove / move     | UI event | X and arrow buttons on a filled slot | arrows swap with the adjacent slot; slots are positional 1–4      |
| synergy level switch   | UI event | success-calculation panel            | 4 positions (0–3); enabled only while the team holds a synergy pair |
| `?tab=` URL param      | URL      | address bar / share link             | `synergy-pairs` \| `mission-simulator`; absent = overview; unknown value ignored and stripped |

## Outputs And Side Effects

| Output / Side Effect | Type           | Description                                                                 |
| -------------------- | -------------- | --------------------------------------------------------------------------- |
| simulator state      | `useState` refs | templates, team slots, synergy level, active template — serialized with the build (new optional v1 keys) |
| `?tab=` URL sync     | side effect    | active tab mirrored via `history.replaceState`; never part of the build document |
| requirements radar   | rendered       | `StatRadar` overlay: required shape vs team shape (max 10)                  |
| estimated success    | rendered       | the percentage plus a "math" breakdown: coverage, synergy, reattempt, fail check |
| 2×XP indicator       | rendered       | template #2 only: fulfilled / not fulfilled                                 |

## Scope And Non-Goals

In scope:

- The tab's three-column desktop layout (templates / requirements check + math / team), modelled on the Mission Simulator concept board but not 1:1 — no "guaranteed" label.
- The tab-in-URL behavior for all three tabs.
- The success model, the slot-derived power effects, and the new serialized keys with their server-side validation.

Non-goals:

- Responsive/mobile layout (follow-up adjustments).
- Adding, deleting, naming, or re-typing templates; changing the 4-slot call size.
- Waterboy's Eager (Super) Sponge, Invisigal's Wolf Pack, Squeeze In (never fires at 4 slots), and every streak/injury/heal/rest/time power (On Fire, Comet, Diamond in the Rough, Found Himself, Lone Wolf, Ear to the Ground, Life Trade family, Phenomaman's, Longe Range Illusion, Hard(er) Head, Bat Shit, Holy Water Spit, Radiant Light, flight).
- Rendering the simulator on the shared-build page `/b/{id}` (it has no tabs).
- Absolute XP numbers — the 2×XP indicator is a condition light, nothing more.

## User / System Behavior

**Templates.** Exactly three, unnamed ("Template #1/#2/#3"), always 4 slots. Each holds five editable REQ values. #2 additionally holds an optional per-stat `2×XP ≥` threshold, #3 an optional per-stat `FAIL ≥` threshold; #1 is REQ-only and the mechanic set per template is fixed. On a fresh planner state each template rolls REQs uniformly in 3–8, #2 rolls one random stat's XP threshold and #3 one random stat's fail threshold, each in 6–9; everything is editable afterwards and travels with the build. One template is active at a time and drives the middle column.

**Team.** Four positional slots, 0–4 filled. Empty-slot click opens a hero picker (current roster, minus heroes already on the team); portrait click opens the same picker to replace; X removes; left/right arrows swap with the neighbor slot. Team totals per stat = sum of occupants' effective stats (each hero clamped at 10 first), the sum clamped at 10.

**Slot-derived powers** — computed from the real team, ignoring (and never writing) the manual chips on other tabs:

- Coupé: +1 Combat in slot 1, +1 Mobility in slot 2 (+3 with À la Seconde trained), nothing in slots 3–4.
- Golem (Spread Thin trained): every stat gains `floor((starting + allocations) × 0.25 × empty)` where `empty = 4 − occupied slots` (illusion counts as occupied), clamped at 10.
- Prism: when placed into slot *k* with a hero in slot *k−1* and slot *k+1* free, an illusion of that left neighbor appears in slot *k+1* — stats at half, floored per stat (full with Perfect Copy trained), no power effects of its own. It is a real occupant: counts toward the 4 slots, removable and replaceable like a hero. Removal is sticky — it returns only when Prism is placed again; it vanishes when Prism or the copied hero moves or leaves.
- Supernova and Sonar's shared form flow in through effective stats exactly as elsewhere (they are assumptions, not slot facts).

**Success calculation**, shown as labelled rows in the math panel:

1. Coverage = area shared by the team's radar shape and the required shape ÷ the required shape's area (both drawn from the clamped totals and REQs on the five axes).
2. Synergy boost: switch level × 5%, one global bonus applied once regardless of how many pairs the team holds. The switch is disabled (contributing 0) while the team holds no derived synergy pair; its stored position survives and re-applies when a pair returns.
3. Reattempt: Pirouette (Coupé, trained) or Talk Shit (Sonar, trained, shared form Hybrid — monster toggle off) each grant a retry: `estimate = 1 − (1 − p)^(1+n)` for `n` reattempting heroes, with an explanatory note in the panel when applied.
4. Fail check: if any `FAIL ≥` stat's team total meets its value the mission fails — estimate 0%, reattempts do not rescue it.
5. The estimate caps at 100%.

The 2×XP indicator lights purely on its own per-stat check — team total for that stat ≥ threshold — independent of the estimate.

**Persistence.** Simulator state serializes as new optional `SerializedBuild` v1 keys — templates (`mt`), team slots (`mh`: hero id, illusion marker, or empty × 4), synergy level (`ml`), active template (`ma`) — written only when non-default, entering dirty tracking, local saves, cloud saves, and `?build=` links automatically. `?tab=` composes with `?build=` and rides into share links.

## Roles And Access

Not role-specific. (Cloud saves require the API schema to accept the new keys; no permission changes.)

## Examples

| Input | Expected Output | Notes |
| --- | --- | --- |
| team shape fully contains required shape, synergy 0 | 100% | coverage alone |
| all REQs 0 | 100% regardless of team | empty required area covers trivially |
| empty team, any REQ > 0 | 0% | nothing to cover with |
| coverage 92%, synergy switch at 1, pair on team | 97% | +5% |
| synergy switch at 3, no pair on team | switch disabled, +0% | stored level kept |
| `FAIL ≥ 8` on charisma, team charisma total 8 | 0%, FAILED | at-or-above trips |
| `2×XP ≥ 7` on combat, team combat total 7 | indicator fulfilled | independent of estimate |
| Coupé slot 1, À la Seconde trained | +3 Combat in team totals | slot 2 would give +3 Mobility |
| Golem (Spread Thin) + 2 heroes, no illusion | +25% tier (1 empty slot) | manual chip ignored here |
| Prism slot 2, hero slot 1, slot 3 free | illusion of slot-1 hero in slot 3, half stats floored | full stats with Perfect Copy |
| remove illusion, then free its slot again | stays gone | returns only on re-placing Prism |
| Pirouette trained, Coupé on team, coverage+synergy 60% | 84% with reattempt note | `1−0.4²` |
| ep3 cut removes a team hero | hero silently leaves the team | also on deserialization |
| open `/?tab=mission-simulator` | simulator tab active | unknown value → overview, param stripped |
| load an old v1 document without the new keys | simulator at defaults, fresh random templates | backward compatible |

## Business Rules

- The serialized-format change is **additive on v1**: new optional keys only, old documents load unchanged, unknown keys stay tolerated client-side. The client gate (`isSerializedBuild.ts`) and the strict server schema (`app/schemas/builds.py`, `extra="forbid"`) learn the keys in the same change; the 8KB document cap holds.
- Threshold checks (fail and 2×XP) compare the **clamped team total** of their stat, at-or-above. With several thresholds set on one template, *any* met `FAIL ≥` fails the mission, while the 2×XP light needs *every* set threshold met.
- Derived slot effects are local to the simulator's totals and math panel; `heroSpecialPowers` state is never read for En Pointe/Spread Thin here and never written.
- The illusion contributes stats only — it is nobody for power, synergy-pair, or roster purposes.
- Synergy pairs remain purely derived from episode setup; the switch selects a level, never a pair.
- Random rolls happen once per fresh planner state (new/reset build), not per visit.

## Edge Cases

- Prism in slot 1 (no left neighbor) or slot 4 (no right slot): no illusion. Moving her re-evaluates.
- The copied hero's stats change (allocations, form, Supernova): the illusion's stats recompute — it mirrors, it doesn't snapshot.
- A deserialized illusion marker whose context no longer holds (no Prism, wrong adjacency, source hero hidden) is dropped on load.
- Arrows on slot 1/4 have one direction only; moving Prism or her source recomputes the illusion per its lifecycle.
- Clearing a threshold (unset) removes that stat's check; a template may end with none.
- Required area zero with team present is still 100%; both zero is 100%.
- Loading a document saved before the simulator rolls fresh templates and so immediately counts as having unsaved changes — truthfully: saving would write the rolled keys. It happens once per old build.
- The template roll happens client-side only: `/` is prerendered, and a roll in shared state during prerender would bake one "random" set into the payload for every visitor.

## Invariants

- The active tab never enters the build document: switching tabs changes no serialized state and never marks the build dirty.
- Every serialized simulator value round-trips through save/load and the API validator; a document the client writes is never rejected by the server.
- Team slots hold at most 4 occupants; a hero appears at most once.
- The estimate is always in 0–100%; a tripped fail check is always exactly 0%.

## Error Handling

- Malformed simulator keys in a `?build=` payload fail the existing structural gate exactly like any other malformed key (param stripped, fallback to the active local build).
- An ineligible interaction (filling a fifth slot, picking an on-team hero) is not offered rather than erroring.

## Open Questions

_None — resolved in the grilling session of 2026-08-31._

## Entry Points

- `web/pages/index.vue`: tab wiring, `?tab=` sync.
- `web/components/mission/*` (new): template panel, requirements check + math panel, team column, hero picker dialog.
- `web/composables/useMissionSimulator.ts` (new): team, derived effects, success math; state joins `usePlannerState`.
- `web/utils/buildDocument.ts`, `web/types/build.ts`, `web/utils/isSerializedBuild.ts`: the new v1 keys (protected area).
- `app/schemas/builds.py`, `app/services/validation.py`: server acceptance of the new keys.
- `web/components/_shared/StatRadar.vue`: reused for required-vs-team (decision 008).

## Dependencies

- Feature 003 (planner mechanics): episode setup, roster visibility, budgets.
- Feature 012 (special powers): trained-power gating, effective stats, Sonar's shared form.
- Feature 001 (build persistence) and feature 005 (account builds): the serialized format and its server validation — both touched additively.
- Feature 014 (synergy pairs tab): the derived-pairs source; synergy levels leave "reserved" status.
- `context/game-mechanics.md`: the power texts the derivations transcribe.

## Tests

- `test/nuxt/mission-success.test.ts` (new): coverage geometry (full cover, zero-required, empty team), synergy gating and stacking with the switch, reattempt formula and gates (training, Hybrid form), fail-check precedence over reattempt, 2×XP independence.
- `test/nuxt/mission-team.test.ts` (new): slot fill/replace/remove/move, Coupé per-slot bonus, Golem empty-slot derivation with and without the illusion, the illusion lifecycle (creation, sticky removal, recompute, drop-on-load).
- Serialization round-trip incl. the new keys and old-document defaults; `shared/build-cases.json` fixtures for the new keys; backend validation tests for ranges and shapes.
- Live browser walk of the Examples table before `Active` (feature workflow).

## Verification

_Empty while draft._

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
