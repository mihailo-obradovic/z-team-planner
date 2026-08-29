# Feature: Build persistence and sharing

Retro-documented (brownfield): written from the shipped code and observed behavior, not from a plan.

## Status

Active

## Task Weight

Medium

## Purpose

A build is worthless if it evaporates on refresh or cannot be shown to another player. This feature keeps builds across sessions on the same browser (localStorage, no accounts by design) and makes any build shareable as a URL that reproduces it exactly on another device.

## Inputs

| Input                 | Type                 | Source                     | Constraints                                                             |
| --------------------- | -------------------- | -------------------------- | ----------------------------------------------------------------------- |
| planner state         | `useState` refs      | planner composables        | episode setup, level-ups, bonus levels, powers, special powers, flights |
| `?build=`             | base64url string     | shared URL query parameter | decodes to a `SerializedBuild` with `v: 1`; anything else is ignored    |
| `z-team-builds`       | JSON in localStorage | previous sessions          | `SavedBuild[]`; corrupt JSON is ignored (defaults win)                  |
| `z-team-active-build` | JSON in localStorage | previous sessions          | active build id or `null`                                               |
| build name            | string               | BuildManager dialogs       | trimmed; empty falls back to a generated default                        |

## Outputs And Side Effects

| Output / Side Effect | Type               | Description                                                                       |
| -------------------- | ------------------ | --------------------------------------------------------------------------------- |
| saved builds         | localStorage write | `z-team-builds` and `z-team-active-build`, rewritten on every change (deep watch) |
| share URL            | string → clipboard | current page URL with `?build=<base64url(JSON SerializedBuild)>`                  |
| restored state       | planner `useState` | deserialization overwrites all planner state refs                                 |
| history rewrite      | `replaceState`     | the `build` param is stripped whenever a local build is saved/loaded              |
| unload guard         | `beforeunload`     | the browser prompts when unsaved changes exist                                    |

## Scope And Non-Goals

In scope:

- Serialization of the full planner state into the compact `SerializedBuild` v1 format (`web/types/build.ts`), defaults omitted.
- Named builds: save, save-as-new, load, rename, delete, active-build tracking, dirty ("unsaved changes") tracking.
- Shared-build mode: opening a `?build=` link, viewing it without touching local builds, saving it as one's own, returning to the active local build.

Non-goals:

- Server-side storage and accounts — features 004 and 005. This document owns the browser's copy of a build, and every behavior in it works with no account.
- Cross-browser/device sync other than by sharing a URL; signing in adds that (feature 008) without changing anything here.
- Migration of hypothetical future format versions; `v: 1` is the only version, and an unknown version is ignored, not migrated.

## User / System Behavior

- On app start with no `?build=` param — or an undecodable one, which is stripped from the URL — the active saved build (if any) is deserialized into the planner; otherwise defaults apply.
- On app start with a valid `?build=` param, the decoded build is shown in **shared-build mode**: a banner replaces the build controls, offering "Save as mine" and (when local builds exist) "Back to my build". Local builds are not modified by viewing.
- Saving (any variant) exits shared mode, strips the `build` param from the URL, and resets dirty tracking.
- Deleting the active build promotes the first remaining build to active; the last build cannot be deleted (the delete control needs ≥2 builds).
- Share copies the URL for the **current** state (not the last-saved state) to the clipboard, with a success/failure toast.

## Roles And Access

Not role-specific.

## Examples

| Input                                                     | Expected Output                                                | Notes                                       |
| --------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------- |
| default state, serialize                                  | `{"v":1}`                                                      | all defaults omitted                        |
| ep3Cut=coupe, serialize                                   | `{"v":1,"ec":"coupe"}`                                         | `sonar` is the default and would be omitted |
| open `?build=` of `{"v":1,"fl":["flambae"],"ec":"coupe"}` | shared mode: Flambae flight active, Coupé cut, Sonar on roster | local builds untouched                      |
| `?build=` decoding to `{"v":2}`                           | param stripped; active local build loads                       | unknown version is rejected                 |
| `?build=` with malformed base64/JSON                      | param stripped; active local build loads                       | never an error surface                      |
| `?build=` decoding to `{"v":1,"fl":"flambae"}`            | param stripped; active local build loads                       | v1 but not a `SerializedBuild`              |
| save, change a stat, reload page without saving           | browser unload prompt; after reload, last-saved state          | dirty tracking + beforeunload               |
| serialize → encode → decode → deserialize                 | identical planner state                                        | round-trip is lossless                      |

## Business Rules

- `SerializedBuild` keys and meanings are fixed by `web/types/build.ts` (`v`, `ec`, `eh`, `e8`, `lu`, `bl`, `pw`, `sp`, `fl`); stats arrays are ordered by `STAT_NAMES`.
- Only non-default values are serialized — URLs stay short and defaults stay implicit.
- URL encoding is base64url (`+`→`-`, `/`→`_`, padding stripped) of the JSON.
- Episode choices deserialize first and dependent state after `nextTick()`, so episode watchers cannot clobber restored hero state.
- Viewing a shared build never mutates localStorage; only an explicit save does.

## Edge Cases

- Corrupt localStorage JSON → silently ignored, defaults used (never a crash).
- localStorage quota errors on write → silently ignored (state lives on in memory).
- A serialized build referencing an unknown hero id — or a valid id where the field does not apply (e.g. flight for a non-flying hero) — deserializes without validation; the extra entries are carried in state but render nothing (verified live with `fl:["golem"]`).
- Clipboard write failure (permissions, insecure context) → error toast, no crash.

## Invariants

- **The `SerializedBuild` v1 format is a protected area**: shared URLs and saved builds in the wild depend on it. Fields may be added optionally; existing keys, their meanings, the `STAT_NAMES` order, and hero ids (`web/types/hero.ts`) never change incompatibly. A breaking change requires a new `v` plus decode support for v1.
- serialize → deserialize round-trips to identical planner state.
- Deserializing `{"v":1}` resets every hero to defaults (empty maps overwrite, never merge).
- All persistence is client-only; the server renders nothing build-specific.

## Error Handling

- Every decode/storage failure degrades to defaults or a no-op; the feature has no error states a user must resolve.
- Share failure is reported via toast and is retryable.

## Entry Points

- `web/utils/buildDocument.ts`: the format and its omission rules — the protected part. `buildUrlCodec.ts` does `?build=`; `useLocalBuilds`/`useBuildMode`/`useInitialBuild` drive it (decision 006).
- `web/types/build.ts`: the serialization contract (`SerializedBuild`, `SavedBuild`).
- `web/components/_shared/BuildManager.vue`: all user-facing controls and dialogs.
- `web/app.vue`: calls `initialize()` and `setupBeforeUnload()` on mount.

## Dependencies

- Planner state composables (`useHeroPlanner` and sub-composables): the `useState` keys serialized here are their contract.
- `web/types/hero.ts` (`STAT_NAMES`, hero ids): the vocabulary of the format.

## Open Questions

Deliberate long-horizon items kept past approval (brownfield exception, `workflows/brownfield.md`):

- No format versioning/migration story beyond "reject non-v1" — acceptable until a breaking change is actually wanted.

## Tests

- `test/nuxt/build-persistence.test.ts`: `initialize()` falls back to the active build on a garbage or unknown-version `?build=` param (regression for the invalid-param fallback fix); a valid param enters shared mode without touching local builds.

Honest gap — wanted but not yet written:

- `test/unit/` serialization round-trip: default state → `{"v":1}`; each field family serializes and round-trips; unknown version and malformed input return `null`.
- `test/unit/` URL codec: base64url encode/decode round-trip, padding/charset edge cases.
- Build CRUD and shared-mode behavior are covered by the live browser walk per the stack's testing rule until component tests exist.

## Verification

Retro-documented from code review of the entry points above, then the Examples table walked live in Chrome (dev server, 2026-08-21): shared-mode open of `{"v":1,"fl":["flambae"],"ec":"coupe"}` restored flight + episode cut with localStorage untouched; "Save as mine" persisted byte-identical data (round-trip proven), stripped the URL param, and exited shared mode; reload restored the active build; a stat edit raised the "Unsaved changes" badge and the beforeunload prompt fired on navigation away; garbage and `v:2` params were rejected without error — surfacing the fallback bug fixed the same day (`initialize()` now falls back to the active build and strips the dead param; regression tests in `test/nuxt/build-persistence.test.ts` fail on the old code and pass on the fix). oxlint, vue-tsc, and vitest pass; the remaining coverage gap is listed under Tests.

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
