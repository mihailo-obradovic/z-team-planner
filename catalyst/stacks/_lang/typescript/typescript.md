# Tier: Language — TypeScript/JavaScript

**Tier:** Language — TypeScript/JavaScript

Shared language-level conventions and performance rules for every stack that ships TypeScript or JavaScript — frontend or backend, framework-agnostic. This directory is never a spawn choice; it travels automatically with any module whose `**Requires:**` header names `_lang/typescript`.

Nothing here restates a Universal Rule or a framework rule: framework-specific guidance lives with the module that requires this tier (e.g. React conventions in `../../frontend/_react/`, Next.js conventions in the `nextjs` module).

## Module Documents

| Document              | What it holds                                                                       | Load                                                                        |
| --------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `typescript-types.md` | Where types live, `.d.ts` vs `.ts`, `interface` vs `type`, `import type` discipline | When defining or organizing types                                           |
| `toolchain.md`        | oxlint + oxfmt: config ownership, plugin rules, house format style, scripts         | When setting up or changing lint/format tooling, or wiring editor/CI checks |
| `performance.md`      | Router over `rules/` — 24 language-level performance rules                          | When optimizing, or reviewing for performance                               |
| `rules/*.md`          | One rule per file: rationale + incorrect/correct examples                           | Per rule, via `performance.md` — never wholesale                            |

The annotation convention for deliberate deviations, footguns, and to-dos is not language-level — it binds every project: [`conventions/code-annotations.md`](../../../conventions/code-annotations.md).

## Node Version

The Node major is pinned at the repository root: `mise.toml` holds it (`[tools]` / `node = "<major>"`), and `package.json` mirrors it as `"engines": { "node": ">=<major>" }` once one exists, so the version manager and CI read the same pin. A new project defaults to the latest LTS; the pin is the project's own from spawn onward. Keep `mise.toml` the only pin file — a repo migrating from `.nvmrc` or `.node-version` deletes it in the same change that adds `mise.toml`. Bumping the pin is a deliberate act, not routine maintenance: an update that drops a supported runtime belongs to the decision record that owns the choice (the maintenance module's rule, when adopted). Never float the pin (`lts/*`, `latest`) — a pin that moves on its own is not a pin.
