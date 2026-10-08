# Feature: Build persistence and sharing

## Status

Active

## Task Weight

Medium

## Purpose

A build is worthless if it evaporates on refresh or cannot be shown to another player. This feature keeps builds across sessions on the same browser (localStorage, no account needed) and makes any build shareable as a URL that reproduces it exactly on another device.

## Inputs

| Input               | Type                 | Source                     | Constraints                                                             |
| ------------------- | -------------------- | -------------------------- | ----------------------------------------------------------------------- |
| planner state       | `useState` refs      | planner composables        | episode setup, level-ups, bonus levels, powers, special powers, flights |
| `?build=`           | base64url string     | shared URL query parameter | decodes to a `SerializedBuild` with `v: 1`; anything else is ignored    |
| `z-team-builds`     | JSON in localStorage | previous sessions          | `SavedBuild[]`; corrupt JSON is ignored (defaults win)                  |
| `z-team-open-build` | JSON in localStorage | previous sessions          | the open build record (feature 029), or `null`                          |
| build name          | string               | BuildManager dialogs       | trimmed; empty → the default name; unique among local builds (029)      |

## Outputs And Side Effects

| Output / Side Effect | Type               | Description                                                                     |
| -------------------- | ------------------ | ------------------------------------------------------------------------------- |
| saved builds         | localStorage write | `z-team-builds` and `z-team-open-build`, rewritten on every change (deep watch) |
| share URL            | string → clipboard | current page URL with `?build=<base64url(JSON SerializedBuild)>`                |
| restored state       | planner `useState` | deserialization overwrites all planner state refs                               |
| history rewrite      | `replaceState`     | the `build` param is stripped whenever a local build is saved/loaded            |
| unload guard         | `beforeunload`     | the browser prompts when unsaved changes exist                                  |

## Scope And Non-Goals

In scope:

- Serialization of the full planner state into the compact `SerializedBuild` v1 format (`web/types/build.ts`), defaults omitted.
- Local builds as stored objects: save, create, load, rename, delete, and dirty ("unsaved changes") tracking. Which build is open, the name rule, and where a new build goes are feature 029's.
- Shared-build mode: opening a `?build=` link, viewing and editing it without touching local builds, **Save a copy**, returning to the build open before it.

Non-goals:

- Server-side storage and accounts — features 004 and 005. This document owns the browser's copy of a build, and every behavior in it works with no account.
- Cross-browser/device sync other than by sharing a URL; signing in adds that (feature 008) without changing anything here.

## User / System Behavior

- On app start with no `?build=` param — or an undecodable one, which is stripped from the URL — the open build (feature 029) is restored; with none, defaults apply.
- On app start with a valid `?build=` param, the decoded build is shown in **shared-build mode** and nothing is open: a banner replaces the build controls, offering **Save a copy** and, when a build was open before, **Back to my build**, which reopens exactly that one. The banner says "Viewing shared build" at every width — in the mobile bottom bar as a compact "Shared build" label. Local builds are not modified by viewing.
- **Save a copy** is one click, no dialog: it creates a build under the default name (a snapshot carries none), in the destination feature 029 picks by sign-in, and opens it.
- Before any edit the snapshot is someone else's build with nothing to lose. After the first edit, the difference from the snapshot as loaded is unsaved work: the leave-site prompt arms and **Save a copy** takes Save's unsaved-changes treatment.
- Saving (any variant) exits shared mode, strips the `build` param from the URL, and resets dirty tracking.
- Share copies the URL for the **current** state (not the last-saved state) to the clipboard, with a success/failure toast.

## Roles And Access

Not role-specific.

## Examples

| Input                                                     | Expected Output                                                | Notes                                       |
| --------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------- |
| default state, serialize                                  | `{"v":1}`                                                      | all defaults omitted                        |
| ep3Cut=coupe, serialize                                   | `{"v":1,"ec":"coupe"}`                                         | `sonar` is the default and would be omitted |
| open `?build=` of `{"v":1,"fl":["flambae"],"ec":"coupe"}` | shared mode: Flambae flight active, Coupé cut, Sonar on roster | local builds untouched                      |
| `?build=` decoding to `{"v":2}`                           | param stripped; the open build loads                           | unknown version is rejected                 |
| `?build=` with malformed base64/JSON                      | param stripped; the open build loads                           | never an error surface                      |
| `?build=` decoding to `{"v":1,"fl":"flambae"}`            | param stripped; the open build loads                           | v1 but not a `SerializedBuild`              |
| save, change a stat, reload page without saving           | browser unload prompt; after reload, last-saved state          | dirty tracking + beforeunload               |
| open `?build=`, close the tab untouched                   | no unload prompt                                               | nothing of theirs to lose                   |
| open `?build=`, change a stat, close the tab              | browser unload prompt                                          | an edit is the user's work                  |
| open `?build=` with nothing open before, **Save a copy**  | local "New build" created and opened, param stripped           | signed out; signed in → cloud (029)         |
| open `?build=` with local "B" open before                 | **Back to my build** shown; it reopens "B"                     | hidden when nothing was open                |
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
- A serialized build referencing an unknown hero id — or a valid id where the field does not apply (e.g. flight for a non-flying hero) — deserializes without validation; the extra entries are carried in state but render nothing.
- Clipboard write failure (permissions, insecure context) → error toast, no crash.

## Invariants

- **The `SerializedBuild` v1 format is a protected area**: its keys, their meanings, the `STAT_NAMES` order, and hero ids (`web/types/hero.ts`) change only deliberately, together with the client gate and the server schema. Until the first public release a change needs no new `v` and earlier shapes are not decoded (Domain Decisions, `project-summary.md`).
- serialize → deserialize round-trips to identical planner state.
- Deserializing `{"v":1}` resets every hero to defaults (empty maps overwrite, never merge).
- All persistence is client-only; the server renders nothing build-specific.

## Error Handling

- Every decode/storage failure degrades to defaults or a no-op; the feature has no error states a user must resolve.
- Share failure is reported via toast and is retryable.

## Entry Points

- `web/utils/buildDocument.ts`: the format and its omission rules — the protected part. `buildUrlCodec.ts` does `?build=`; `useLocalBuilds`/`useBuildMode`/`useInitialBuild` drive it.
- `web/types/build.ts`: the serialization contract (`SerializedBuild`, `SavedBuild`).
- `web/components/build/BuildManager.vue` and its `BuildMenu.vue`: all user-facing controls and dialogs.
- `web/app.vue`: calls `initialize()` and `setupBeforeUnload()` on mount.

## Dependencies

- Planner state composables (`useHeroPlanner` and sub-composables): the `useState` keys serialized here are their contract.
- `web/types/hero.ts` (`STAT_NAMES`, hero ids): the vocabulary of the format.
- Feature 029: the open build, the name rule and the default name, where a new build goes, and the discard confirmation every planner-replacing action here asks.

## Open Questions

## Tests

- `test/nuxt/build-persistence.test.ts`: `initialize()` falls back to the open build on a garbage or unknown-version `?build=` param; a valid param enters shared mode without touching local builds.
- `test/nuxt/build-document.test.ts`: what the format omits, how each group is shaped, the round trip, and the URL codec's alphabet and padding. `test/unit/isSerializedBuild.test.ts`: the client gate.
- Build CRUD and shared-mode behavior are covered by the live browser walk per the stack's testing rule.

## Verification

The Examples table walked live in Chrome: shared-mode open restored flight and episode cut with localStorage untouched; "Save as mine" persisted byte-identical data, stripped the URL param and exited shared mode; reload restored the active build; a stat edit raised the unsaved-changes badge and the beforeunload prompt; garbage and `v:2` params were rejected without error. Format omission, shaping, round trip and the URL codec are pinned by test. oxlint, vue-tsc and vitest pass.
