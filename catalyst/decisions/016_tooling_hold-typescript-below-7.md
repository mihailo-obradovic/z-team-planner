# Decision: Hold TypeScript below 7 until vue-tsc runs on it

## Status

Implemented

## Type

tooling

## Task Weight

Easy

## Context

TypeScript 7 is the Go-native compiler. Its package exports only `version` and `unstable/*`, not the JavaScript compiler API that `vue-tsc` builds on through `@volar/typescript`. vue-tsc fails on 7.0.2 (vuejs/language-tools #6124, #6156), and `nuxt typecheck` runs vue-tsc, so taking TypeScript 7 breaks the project's typecheck. Vue's support waits on TypeScript 7.1's content mappers (vuejs/language-tools #6167).

Renovate (decision 009) would keep opening that major as a PR, and the Maintenance module forbids a blanket ignore: a package that cannot move gets a stated reason and a revisit trigger in a decision record.

## Decision

A `packageRules` entry in `renovate.json` caps `typescript` at `<7`, with its reason in the rule's `description`. TypeScript 5.x and 6.x updates still arrive as usual.

## Scope

`renovate.json` only. No dependency, no application code, no behavior contract.

## Consequences

Renovate stops proposing TypeScript 7, and `pnpm outdated` keeps listing it, which is expected.

Revisit trigger: a vue-tsc release that supports TypeScript 7, the close of vuejs/language-tools #6167. Then remove the rule and take TypeScript 7 as an `upgrade` record of its own.

## Contracts Touched

- `project-summary.md` — ADR Index row.

## Open Questions

## Verification

`renovate.json` validates against its schema with `npx --yes --package renovate -- renovate-config-validator`. The rule is the only change to the file.
