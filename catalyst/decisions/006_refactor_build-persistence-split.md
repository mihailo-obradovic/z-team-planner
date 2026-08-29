# Decision: Split build persistence, and settle what "build" means

## Status

Accepted

## Type

refactor

## Task Weight

Medium

## Context

`web/composables/useBuildPersistence.ts` is 584 lines, but length is the symptom. Three defects sit under it.

**Eight refs are threaded as a positional argument list.** `serializeCurrentState(a,…,h)` appears five times and `deserializeIntoState(build,a,…,h)` four. Adding a ninth piece of planner state means editing eleven call sites, and a transposed pair of same-typed refs type-checks.

**The protected format has almost no direct test coverage.** `SerializedBuild` and its serialiser are a protected area under feature 001 with a backward-compatibility contract, yet `test/nuxt/build-persistence.test.ts` covers three cases, all `initialize()`. The serialiser, the URL codec, the CRUD and the dirty tracking have none — because none can be called without first constructing eight refs.

**"Build" names four things:** the portable snapshot (`SerializedBuild`), the localStorage record (`SavedBuild`), the server record (`Build`), its public read (`PublicBuild`). `BuildManager.vue` imports a `deleteBuild` from the composable and a `useDeleteBuild` from the query layer; `saveSharedAsMyBuild` exists only as an alias for `saveAsNewBuild`, because the vocabulary was too thin to say what the call site meant.

`savedAt` is also dead — written in three places, read nowhere — and holds the file's last `Date.now()`, which the code-style convention now bans.

## Decision

Characterisation tests first, then extract in dependency order, keeping the public surface unchanged.

Tests go in before any code moves, asserting current serialiser and URL-codec behaviour — round-trip stability, default omission, unknown-key tolerance, version rejection — so the extraction is provably behaviour-preserving rather than assumed to be.

The extraction: `usePlannerState()` returns the eight refs as one object (the keystone — it collapses every nine-parameter signature to two); `utils/buildDocument.ts` and `utils/buildUrlCodec.ts` take the pure functions, now callable and testable; `composables/useLocalStorageRef.ts` takes the generic helper; `useLocalBuilds()`, `useBuildSharing()` and `useUnsavedChanges()` take the three concerns; `useBuildPersistence()` remains a thin facade composing them and owning `initialize()`.

**The facade stays.** `useHeroPlanner` spreads `...persistence` and six components destructure from it, so keeping it makes the split invisible above `useHeroPlanner` and no component changes. Dropping it is a mechanical follow-up, deliberately not bundled: a structural refactor and a six-component rewrite in one diff means neither can be reviewed.

Vocabulary is settled in `catalyst/context/glossary.md`, then applied: **build document** (`SerializedBuild`, unchanged), **local build** (`SavedBuild` → `LocalBuild`), **cloud build** (`Build` → `CloudBuild`, `BuildList`/`BuildSummary` following), **shared build** (`PublicBuild` → `SharedBuild`). `deleteBuild` becomes `deleteLocalBuild`; `saveSharedAsMyBuild` goes, since `saveAsNewLocalBuild` already says it.

## Scope

`web/composables/useBuildPersistence.ts` and the seven modules split out of it; `web/types/build.ts` and `web/types/api.ts` for the renames and the `savedAt` deletion; `web/services/builds.api.ts`, `web/services/shared.api.ts` and the two query modules for the renamed types; two test files for the `savedAt` fixture field.

The serialized-build format itself is untouched — same keys, same omission rules, same `v: 1`. Only where the code lives and what the types are called changes. `savedAt` is a field of `SavedBuild`, not of `SerializedBuild`, so no share link or stored document changes shape.

## Consequences

The protected format gains its first direct tests and a boundary that makes it visible as one. Signatures stop being transposable. The four meanings of "build" become four words.

Riskier: eight modules where there was one, and a reader now follows a facade to find behaviour.

Follow-up created, deliberately not done here: dropping the facade so the six components name the concern they reach into.

## Contracts Touched

`catalyst/context/glossary.md` (new), `web/CLAUDE.md` (the `composables/`, `utils/` and `types/` entries, and the invariant naming the protected format's location), `catalyst/features/001_build-persistence.md` (its protected-area pointer moves with the code).

## Open Questions

None.

## Verification

`pnpm lint`, `format:check`, `typecheck` and `test` green, with the characterisation tests written before the extraction and passing unchanged after it. `no-restricted-globals` for `Date` switched on in the same change — the `savedAt` deletion is what makes that possible.
