# Decision: Adopt the Maintenance layer — Renovate, with no automerge

## Status

Proposed

## Type

tooling

## Task Weight

Easy

## Context

Decision 001 deferred the Maintenance layer with a condition: "a committed lockfile exists, so the trigger technically fires; adopt via its own record when dependency currency becomes a real concern." Two lockfiles are committed (`pnpm-lock.yaml`, `uv.lock`), the app is deployed, and nothing has moved a pin on purpose since.

Meanwhile a `renovate.json` has sat at the repository root since the original Nuxt scaffold (`35105bf`), predating Catalyst adoption. It is **inert**: the Renovate GitHub App was never installed, so the bot has never run — no PRs, no branches, no dashboard issue. The repository therefore looks configured for a bot it does not have, while `architecture.md` says the layer is deferred. Adopting the layer resolves both halves at once.

The project also already runs two supply-chain measures the template does not yet document — `preinstall: npx only-allow pnpm` and pnpm's `minimumReleaseAge: 1440` — so a 24-hour cooldown already applies at install time, independent of the bot.

## Decision

Adopt Maintenance with Renovate, keeping the inherited `github>nuxt/renovate-config-nuxt` preset for grouping and schedule, and **no automerge at all**.

The module permits automerge for patch/minor updates touching the lockfile alone. This project takes the stricter line, because that permission rests on CI actually gating the merge and this repository's pipeline was red for weeks — four separate breakages, unseen, because the web job could not get past installing Node. Automerge is revisited once the pipeline has been green across a full month of ordinary work.

The settings that govern, all of them versioned in `renovate.json` rather than set in the bot's dashboard:

- **Grouping and schedule** — the preset's `group:allNonMajor` and `schedule: ["on Monday"]`; `:maintainLockFilesWeekly` keeps both lockfiles fresh.
- **Managers** — unrestricted, so `npm` covers `package.json`/`pnpm-lock.yaml` and `pep621` covers `pyproject.toml` with uv lock-file maintenance. Both halves of the repository are in scope.
- **Cooldown** — the preset's `minimumReleaseAge: "25 hours"` at PR time, beside pnpm's 1440 minutes at install time.
- **Node** — the preset disables `engines.node` updates, which is what keeps `mise.toml` the only Node pin rather than a second one appearing in a bot PR.
- **`rangeStrategy: "bump"`** — a bump moves the caret floor in `package.json` in the same reviewed PR as the lockfile. That is a pin moving in a commit, not a range being widened to quiet the bot.
- **`postUpdateOptions: ["pnpmDedupe"]`** — kept.
- The inert `matchDepTypes: ["resolutions"]` rule is **removed**: `package.json` declares no `resolutions` and no `overrides`, so it disabled nothing.

Enabling the GitHub App is a human step and the one thing this record cannot do for itself.

## Scope

`renovate.json` (the `resolutions` rule removed), `architecture.md` (the Maintenance row, and the CI-actions note that already anticipated this), `project-summary.md` (the ADR index), and `catalyst/stacks/maintenance/renovate.md` copied into the bundle from the template, unmodified, because the layer is adopted now and its rules have to load with it.

No application code, no dependency, no behavior contract.

## Consequences

Better: pins move deliberately and visibly, on a weekly cadence, with both lockfiles covered. A security advisory jumps the schedule rather than waiting for Monday. The repository stops advertising a bot it does not run.

Riskier or harder: a weekly PR is weekly review work, and a bot whose PRs are ignored is worse than no bot — the pins rot while the repository looks maintained. Every Renovate PR that only moves a pin on a green pipeline is `Minor` work; the moment a bump changes behavior it is ordinary work again, with its own document and branch. A PR that would _add_ a package is closed, not merged: the Dependency Change Rule is untouched.

Follow-up: automerge for patch/minor lockfile-only updates is revisited after a month of green CI. Until then every merge is a person's.

## Contracts Touched

- `architecture.md` — Technical Stack (Maintenance row), Approved CI Actions.
- `project-summary.md` — ADR index.
- `catalyst/stacks/maintenance/renovate.md` — the module's rules, joining the bundle with the layer.

## Open Questions

## Verification
