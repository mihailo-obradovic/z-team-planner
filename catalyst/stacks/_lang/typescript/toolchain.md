# Toolchain: Lint & Format — oxlint + oxfmt

**Tier:** Language — TypeScript/JavaScript

Every TypeScript/JavaScript stack lints with **oxlint** and formats with **oxfmt** — the OXC toolchain, one Rust binary each, no ESLint/Prettier config sprawl. Format with `oxfmt`; do not hand-format. oxlint is stable (1.x); oxfmt is beta but formats everything the stacks ship (JS/TS/JSX, Vue SFCs, JSON, YAML, CSS, Markdown).

Both configs live at the repository root and are **the project's own from spawn onward** — no upgrade ever regenerates them.

## `.oxlintrc.json`

- **An explicit `plugins` array replaces oxlint's default set** (`eslint`, `oxc`, `typescript`, `unicorn`) — it does not extend it. Never trim the list without knowing this; dropping `eslint` silently disables the core ESLint rules. The scaffolder assembles the list from the adopted stack: the base plugins plus `react`/`nextjs` (or the Vue-side equivalents) only when those modules travel.
- `categories.correctness = "error"` is the floor — definitely-wrong code fails the lint. Stricter categories (`suspicious`, `pedantic`, `perf`) are the project's own opt-in, rule by rule or category by category.
- **A project rule oxlint has no native equivalent for is kept, not deleted** — `jsPlugins` loads ESLint-compatible plugins (top level, or inside an `overrides` entry; `{ "name": …, "specifier": … }` where the name collides with a native plugin). The plugin API is alpha and outside semver, so every entry is a deliberate, visible cost: pin it, and drop it the day oxlint ships the rule natively.
- Type-aware rules (via `oxlint-tsgolint`) are **opt-in, not default**: they need the tsgolint sidecar and a real type-check pass, so adopt them deliberately when the project wants `typescript-eslint`-grade analysis — not as a reflex.

## `.oxfmtrc.json`

House style, set explicitly on purpose while oxfmt is beta — an option named here cannot shift under the project when an upstream default moves:

- `singleQuote: true`, `semi: true`, `trailingComma: "none"`, `printWidth: 80`, `tabWidth: 2`
- CSS at `tabWidth: 4` via an override — in agreement with the `.editorconfig` CSS section, as [`conventions/editor-setup.md`](../../../conventions/editor-setup.md) requires.
- **`sortTailwindcss`** — off in oxfmt by default, and switched on for a stack that carries Tailwind, the UI libraries built on it (shadcn) included. It takes the path to the global stylesheet: without it the project's own `@theme` utilities are unknown classes and sort to the front of every class list. `functions` names the class-composition helpers whose arguments are sorted as well (`cn`, `clsx`) — extend it when the project adopts another (`cva`, `tw`). A Vue-side stack gets nothing: its UI choices replace Tailwind rather than build on it.
- **`sortImports` stays off.** The frontend style guide owns import order (`stacks/frontend/_react/react-style.md` or `_vue/vue-style.md`), and its sub-order — `react` before other framework packages, internal `components → hooks → utils → assets` — is not expressible in oxfmt's group selectors. A formatter that reorders imports into a shape the guide does not ask for is worse than one that leaves the rule to the style audit.
- No ignore patterns for the bundle: every bundle document, the vendored `rules/` payloads included, is oxfmt-canonical in the template itself, so formatting the repository never diverges the bundle from the template. The template's sync tooling normalizes upstream through the same oxfmt before comparing, so the formatted payloads still diff cleanly against their source.

## Scripts

`package.json` carries the four verbs so humans, agents, and CI run the same thing: `lint` (`oxlint`), `lint:fix` (`oxlint --fix`), `format` (`oxfmt`), `format:check` (`oxfmt --check`).

ESLint and Prettier are never added: oxlint owns linting, oxfmt owns formatting — a plugin loaded through `jsPlugins` is a rule oxlint runs, not a second runner.
