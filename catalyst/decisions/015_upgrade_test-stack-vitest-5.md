# Decision: Move the test stack to Vitest 5 and @nuxt/test-utils 4

## Status

Implemented

## Type

upgrade

## Task Weight

Easy

## Context

Three test-stack packages are a major behind: `vitest` and `@vitest/coverage-v8` (4 → 5) and `@nuxt/test-utils` (3 → 4). A major move on an existing project is a decision record (`architecture.md`, Versions).

They have to move together. `@vitest/coverage-v8` 5.0.3 pins `vitest` 5.0.3 exactly, and `@nuxt/test-utils` supports Vitest 5 only from 4.3. The current pair is already off-peer: test-utils 3.23.0 declares `vitest ^3.2`, and the repository has run it on Vitest 4 since the bump that landed it. Moving Vitest to 4.1 for Nuxt 4.6's Vite 8 made it louder: every run now prints two deprecation warnings 40 times each (`vitest/environments`, `transformMode`), both from test-utils 3.

## Decision

Take all three in one change: `vitest` and `@vitest/coverage-v8` at `^5.0.3`, and `@nuxt/test-utils` at `4.3.3`, still pinned exactly. Its 3.23.0 pin recorded no reason and came from the original install, but the exact pin is kept so a test-environment change stays a reviewed step.

One test changes. test-utils 4 starts Nuxt in its own `beforeAll` rather than at import, so module-level code now runs before Nuxt exists. `build-document.test.ts` replaced `window.location` with a bare `URL` at module level, which left the router unable to push state (`VUE_ROUTER_R0120`), so the suite failed in setup. The stub moves into a `beforeAll`, which runs after Nuxt is up. `active-tab.test.ts` stubs `location` with a getter and is unaffected.

The `nuxt` project's `testTimeout` goes from 5 to 15 seconds. The same lazy start moves Nuxt's warm-up into each file's first mount: the first dialog test went from about 0.25s to 1.3s under coverage, while every later test kept its time. That is test-utils 4 alone; it reproduces on Vitest 4.1. Under load, coverage runs crossed 5s in two suites. A per-file warm-up was the alternative, rejected as noise in every suite for a cost the config can absorb once.

## Scope

`package.json`, `pnpm-lock.yaml`, `.nuxtrc` (test-utils rewrites its own `setups` line), `test/nuxt/build-document.test.ts`, and the `nuxt` project's `testTimeout` in `vitest.config.ts`. No application code. Both projects otherwise stay as they were: inline projects now inherit the root config, and the root defines nothing but `projects`.

## Consequences

The deprecation noise goes, and the test stack is back inside its declared peer ranges. A test that really hangs now takes 15s to fail rather than 5s.

Vitest 5 defaults `clearMocks` to true. The suites already reset or clear their own mocks, and the one `beforeAll` that records calls (`build-cases.test.ts`) asserts none of them later, so nothing relied on calls leaking between tests. A future test that does will see a clean mock instead.

Vitest 5 also fails a test on an unawaited `.resolves`/`.rejects`, and fake timers now fake `Temporal`. The repository has no unawaited assertions. Its `Temporal` is the `temporal-polyfill` ponyfill, imported locally rather than installed as a global, and the one fake-timer suite fakes only `Date`, so the timer change does not reach it.

TypeScript 7 is out of scope and blocked: vue-tsc cannot run on it.

## Contracts Touched

- `project-summary.md` — ADR Index row.

## Open Questions

## Verification

`pnpm test` passes (56 files, 439 tests) with no deprecation warnings; `test:coverage`, `pnpm typecheck`, `pnpm lint` and `pnpm format:check` are clean. Without the test change, `build-document.test.ts` failed in setup and its 23 tests were skipped. Load check, a coverage run beside a plain run: before the timeout, two of two coverage runs timed out (`hero-detail-dialog`, `roster-follow`); after it, eight of eight runs passed. The pre-upgrade stack passed the same check three of three.
