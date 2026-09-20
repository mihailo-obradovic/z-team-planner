# Toolchain: Lint & Format — oxlint + oxfmt

**Tier:** Language — TypeScript/JavaScript

Every TypeScript/JavaScript stack lints with **oxlint** and formats with **oxfmt** — the OXC toolchain, one Rust binary each, no ESLint/Prettier config sprawl. Format with `oxfmt`; do not hand-format. oxlint is stable (1.x); oxfmt is beta but formats everything the stacks ship (JS/TS/JSX, Vue SFCs, JSON, YAML, CSS, Markdown).

Both configs live at the repository root and are **the project's own from spawn onward** — no upgrade ever regenerates them.

## `.oxlintrc.json`

- **An explicit `plugins` array replaces oxlint's default set** (`eslint`, `oxc`, `typescript`, `unicorn`) — it does not extend it. Never trim the list without knowing this; dropping `eslint` silently disables the core ESLint rules. The scaffolder assembles the list from the adopted stack: the base plugins plus `react`/`nextjs` (or the Vue-side equivalents) only when those modules travel.
- `categories.correctness = "error"` is the floor — definitely-wrong code fails the lint. Stricter categories (`suspicious`, `pedantic`, `perf`) are the project's own opt-in, rule by rule or category by category.
- **A project rule oxlint has no native equivalent for is kept, not deleted** — `jsPlugins` loads ESLint-compatible plugins (top level, or inside an `overrides` entry; `{ "name": …, "specifier": … }` where the name collides with a native plugin). The plugin API is alpha and outside semver, so every entry is a deliberate, visible cost: pin it, and drop it the day oxlint ships the rule natively.
- **A rule a convention document says to enforce has a named home here.** A convention stated only in prose is enforced by whoever remembers it. The config carries the rules that back the conventions — `curly: "all"` and a `no-restricted-globals` entry on `Date` among them — and the scaffolder emits them, so a spawn starts with them rather than deriving them from a document nobody re-reads.
- **A restriction rule carries a `message`** naming the convention document and the sanctioned alternative, written generically rather than about one call site. The failure is where the reader is; a rule that only says "restricted" teaches nothing, while one that says what to use instead teaches the convention at the moment it is being broken.
- **Enabling a rule is fix-then-enable in one change**, or the rule is deferred with a stated reason. Enabling a rule that a codebase already violates leaves a red lint everyone learns to ignore. The enabling change also proves the rule fires — a rule that silently matches nothing is worse than no rule, because it reads as coverage.
- Type-aware rules (via `oxlint-tsgolint`) are **opt-in, not default**: they need the tsgolint sidecar and a real type-check pass, so adopt them deliberately when the project wants `typescript-eslint`-grade analysis — not as a reflex.

## `.oxfmtrc.json`

House style, set explicitly on purpose while oxfmt is beta — an option named here cannot shift under the project when an upstream default moves:

- `singleQuote: true`, `semi: true`, `trailingComma: "none"`, `printWidth: 80`, `tabWidth: 2`
- CSS at `tabWidth: 4` via an override — in agreement with the `.editorconfig` CSS section, as [`conventions/editor-setup.md`](../../../conventions/editor-setup.md) requires.
- **`sortTailwindcss`** — off in oxfmt by default, and switched on for a stack that carries Tailwind, the UI libraries built on it (shadcn) included. It takes the path to the global stylesheet: without it the project's own `@theme` utilities are unknown classes and sort to the front of every class list. `functions` names the class-composition helpers whose arguments are sorted as well (`cn`, `clsx`) — extend it when the project adopts another (`cva`, `tw`).

  **It follows whether the stack carries Tailwind, not which framework it is.** A Vue-side stack with a UI choice built on Tailwind gets it too; only a choice that replaces Tailwind gets nothing.

  **Sorting reaches `class`, `className` and `:class` and nothing else by default.** A UI library that takes class strings in another prop needs that prop named, or those strings are never ordered and the rule quietly applies to half the markup:

  ```json
  "sortTailwindcss": { "stylesheet": "…", "attributes": [":ui", "ui"] }
  ```

  Verified on oxfmt: without it `:ui="{ base: 'p-2 flex' }"` is left alone; with it the value sorts to `'flex p-2'`.

- **`sortImports` stays off.** The frontend style guide owns import order (`stacks/frontend/_react/react-style.md` or `_vue/vue-style.md`), and its sub-order — `react` before other framework packages, internal `components → hooks → utils → assets` — is not expressible in oxfmt's group selectors. A formatter that reorders imports into a shape the guide does not ask for is worse than one that leaves the rule to the style audit.
- No ignore patterns for the bundle: every bundle document, the vendored `rules/` payloads included, is oxfmt-canonical in the template itself, so formatting the repository never diverges the bundle from the template. The template's sync tooling normalizes upstream through the same oxfmt before comparing, so the formatted payloads still diff cleanly against their source.

- **A spawn does ignore what the other adopted tiers own.** Every tier brings manifests, lockfiles, and generated artefacts that this formatter has no business rewriting — a Python manifest, a lockfile, a generated data file. The `ignorePatterns` entries follow from the tiers the project adopted, and the scaffolder derives them at spawn. The bundle is never among them.

## Scripts

`package.json` carries **five** verbs so humans, agents, and CI run the same thing — a CI job calls these, never the tools directly (`../../ci/github-actions.md`): `lint` (`oxlint`), `lint:fix` (`oxlint --fix`), `format` (`oxfmt`), `format:check` (`oxfmt --check`), and **`typecheck`, through the framework's own wrapper** (`nuxt typecheck`). Typechecking is the one gate a linter and a formatter cannot stand in for — neither reads types — so it runs beside the other four in every Verification, not only in CI. A tier or module that ships a check oxlint cannot express appends it to `lint` after `oxlint` (the Vue tier's whole-file SFC size check, `stacks/frontend/_vue/vue-style.md`, Component size) — one verb still runs everything.

ESLint and Prettier are never added: oxlint owns linting, oxfmt owns formatting — a plugin loaded through `jsPlugins` is a rule oxlint runs, not a second runner.
