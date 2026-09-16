# Decision: Adopt the Maintenance layer — Renovate, with no automerge

## Status

Implemented

## Type

tooling

## Task Weight

Easy

## Context

Decision 001 deferred the Maintenance layer until dependency currency became a real concern. Two lockfiles are committed (`pnpm-lock.yaml`, `uv.lock`), the app is deployed, and nothing had moved a pin on purpose since.

A `renovate.json` had sat at the root since the original Nuxt scaffold, predating Catalyst adoption, and it was **inert**: the GitHub App was never installed, so the bot had never run. The repository looked configured for a bot it did not have while `architecture.md` called the layer deferred; adopting it resolves both halves.

The project already runs `preinstall: npx only-allow pnpm` and pnpm's `minimumReleaseAge: 1440` in `pnpm-workspace.yaml` (pnpm 10 silently ignores it under `package.json`'s `pnpm` field), so a 24-hour cooldown applies at install time independent of any bot.

## Decision

Adopt Maintenance with Renovate, keeping the inherited `github>nuxt/renovate-config-nuxt` preset for grouping and schedule, and **no automerge at all**.

The module permits automerge for patch/minor updates touching the lockfile alone. This project takes the stricter line, because that permission rests on CI actually gating the merge and this repository's pipeline had been red for weeks — four separate breakages, unseen, because the web job could not get past installing Node. Automerge is revisited once the pipeline has been green across a full month of ordinary work.

Everything that governs is versioned in `renovate.json` rather than set in the bot's dashboard; the file is the contract. Two preset behaviours are kept on purpose: `engines.node` updates are disabled, which is what keeps `mise.toml` the only Node pin rather than a second one arriving in a bot PR; and `rangeStrategy: "bump"` moves the caret floor in `package.json` in the same reviewed PR as the lockfile — a pin moving in a commit, not a range widened to quiet the bot. Both halves of the repository are in scope (`npm` and `pep621` managers, weekly lock-file maintenance for both).

Enabling the GitHub App is a human step and the one thing this record cannot do for itself.

## Scope

`renovate.json`, `architecture.md` (the Maintenance row, and the CI-actions note that already anticipated this), `project-summary.md` (the ADR index), and `catalyst/stacks/maintenance/renovate.md` copied into the bundle from the template, unmodified, because the layer is adopted now and its rules have to load with it.

No application code, no dependency, no behavior contract.

## Consequences

Better: pins move deliberately and visibly, on a weekly cadence, with both lockfiles covered. A security advisory jumps the schedule rather than waiting for Monday — which holds only while GitHub's Dependabot alerts stay enabled, since that is what feeds Renovate's `vulnerabilityAlerts` on GitHub; `operations.md` carries the setting. The repository stops advertising a bot it does not run.

Riskier: a bot whose PRs are ignored is worse than no bot — the pins rot while the repository looks maintained.

Follow-up: automerge for patch/minor lockfile-only updates is revisited after a month of green CI. Until then every merge is a person's.

## Contracts Touched

- `architecture.md` — Technical Stack (Maintenance row), Approved CI Actions.
- `project-summary.md` — ADR index.
- `catalyst/stacks/maintenance/renovate.md` — the module's rules, joining the bundle with the layer.

## Open Questions

## Verification

`renovate.json` is valid against the schema it declares and formats clean; the copied module is byte-identical to the template's (`diff -q`). The pipeline this record leans on is green. The app is installed and the bot has run: the Dependency Dashboard issue exists and the first PR is open, waiting for a person as the Decision requires. Dependabot alerts, secret scanning and push protection are enabled on the repository, which is what makes the advisory path in Consequences true.
