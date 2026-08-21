# Editor Setup

**Trigger:** setting up a workstation for the project, or changing what the repository asks of an editor — the `.editorconfig` at the root, or the recommended extension set.

Two files at the project root, neither of them a contract: they make the conventions the documents already state easier to follow, and nothing breaks for someone whose editor ignores them. Formatting that must hold is enforced by the formatter and by review, never by editor settings.

## `.editorconfig`

Every project keeps one at its repository root — outside the bundle, since that is the only place editors look. **The file is the source; this document only says why it reads the way it does.** The scaffolder writes it at spawn and never touches it again: it is the project's own from that moment, like `architecture.md`, and a project with a different language mix edits it freely. The one seatbelt: the scaffolder and upgrader resolve the effective values a project-owned file gives the stack-gated concerns (`EDITORCONFIG_GATED_SECTIONS` in `tools/new_project.py` — PHP, CSS, and JSON indentation today) against the template's, and report a missing section and a contradicting one alike with the template's lines to paste in — the brownfield spawn that kept its own file, and the module adopted after spawn, both stay honest. Reported, never written.

What its sections are doing, and what it deliberately does not do:

- **Two-space default, four for Python, CSS, and PHP.** Python formats at 4 (Ruff, `stacks/_lang/python/toolchain.md`), the TypeScript stack at 2, CSS at 4 matching the override in the generated `.oxfmtrc.json`, and PHP at 4 (Pint's `laravel` preset) — the `[*.php]` section is copied only into spawns carrying a PHP module. All stated, so none depends on an editor default.
- **JSON stays at the two-space default.** Tooling rewrites `package.json`, `components.json`, and `tsconfig.json` on its own schedule and writes them at 2 — setting anything else here buys a diff on every install.
- **Tabs in makefiles.** `make` requires them; a space-indented recipe is a syntax error.
- **No trimming in patches or markdown.** Trailing whitespace is meaningful in a diff's context lines, and two trailing spaces are markdown's hard line break — trimming them on save rewrites prose. In Catalyst's own repository it would also manufacture drift in the vendored rule files that `tools/sync_rules.py` diffs against upstream.
- **No `quote_type`.** It is not a core property — JetBrains IDEs honor it, VS Code and the formatters ignore it. Quote style belongs to the formatter, which is the only thing that can actually enforce it.
- **No `max_line_length`.** VS Code has no wrap-as-you-type for it to govern, and Prettier reads it as `printWidth` only when it is a number. Line width is the formatter's setting.

Where a formatter also reads this file, **the formatter's own config wins** and this file must not contradict it. Keep the two in agreement rather than ranking them. The precise interplay for the stack's own formatter, oxfmt (`stacks/_lang/typescript/toolchain.md` where the tier is adopted): it maps `indent_style` → `useTabs`, `indent_size` → `tabWidth`, `end_of_line` → `endOfLine`, `insert_final_newline` → `insertFinalNewline`, and `max_line_length` → `printWidth`, but **only for options `.oxfmtrc.json` leaves unset** — an explicit option always wins — and it reads only the nearest `.editorconfig`, ignoring `root = true` and never merging nested files. The generated `.oxfmtrc.json` sets its options explicitly, so in practice this file governs editors and oxfmt governs formatting, agreeing by construction.

## Recommended extensions

`.vscode/extensions.json` at the project root carries a **generated block**, not hand-maintained rows: the scaffolder writes the entries whose backing documents the project's bundle actually carries between `// catalyst:begin` / `// catalyst:end` markers at the end of the `recommendations` array, and the upgrader rewrites the block whenever the adopted stack changes. The registry is `EDITOR_EXTENSIONS` in `tools/new_project.py`; the table below is its documented mirror, kept in parity by validator R11.

| Extension                              | Included when                                              | What it gives                                                                              |
| -------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `EditorConfig.EditorConfig`            | always                                                     | applies the `.editorconfig` above                                                          |
| `aaron-bond.better-comments`           | always                                                     | colors the [`code-annotations.md`](code-annotations.md) markers                            |
| `oxc.oxc-vscode`                       | the `_lang/typescript` tier travels with the stack         | oxlint diagnostics and oxfmt formatting in-editor (`stacks/_lang/typescript/toolchain.md`) |
| `bradlc.vscode-tailwindcss`            | a module bringing Tailwind is adopted (currently `nextjs`) | class completion, hover previews, conflict detection                                       |
| `dsznajder.es7-react-js-snippets`      | the `frontend/_react` tier travels with the stack          | React component and hook snippets                                                          |
| `Vue.volar`                            | the `frontend/_vue` tier travels with the stack            | Vue SFC language support and template type-checking                                        |
| `lokalise.i18n-ally`                   | the i18n addon is adopted                                  | inline catalog previews, missing-key detection                                             |
| `laravel.vscode-laravel`               | the `laravel` backend module is adopted                    | completion and go-to-definition for routes, config, env, models, app bindings              |
| `bmewburn.vscode-intelephense-client`  | the `laravel` backend module is adopted                    | PHP language server — completion, diagnostics, go-to-definition                            |
| `mehedidracula.php-namespace-resolver` | the `laravel` backend module is adopted                    | imports and sorts `use` statements                                                         |
| `onecentlin.laravel5-snippets`         | the `laravel` backend module is adopted                    | Laravel class and facade snippets                                                          |
| `xdebug.php-debug`                     | the `laravel` backend module is adopted                    | step debugging against Xdebug                                                              |

Pint needs no extension: it is the formatter of record and runs from `vendor/bin/pint`, which is the rule at the top of this document rather than an omission.

Same marker rule as the generated root pointers: the block between the markers is Catalyst's to rewrite, everything outside it is the project's own, and deleting the markers is how a project takes the file over permanently. A pre-existing `.vscode/extensions.json` without the markers — the brownfield case — gets the block injected into its `recommendations` array, keeping every row the project wrote; an id already present outside the block (including in `unwantedRecommendations`, an explicit rejection) is left out of it.

Adding a row is two edits plus a validator run: the registry entry (with the bundle path that gates it) and this table. Anything else under `.vscode/` is the project's own business — Catalyst writes no `settings.json`.

## Unwanted extensions

The same file carries a second generated block in `unwantedRecommendations`, between `// catalyst:unwanted:begin` / `// catalyst:unwanted:end` markers: the extensions the adopted toolchain **supersedes**, so VS Code stops suggesting them to workstations that open the project. The registry is `UNWANTED_EXTENSIONS` in `tools/new_project.py`; the table below is its documented mirror, kept in parity by the same validator rule (R11) as the recommended set.

| Extension                | Unwanted when                                      | Why                                                                                                     |
| ------------------------ | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `dbaeumer.vscode-eslint` | the `_lang/typescript` tier travels with the stack | ESLint is superseded by oxlint — a second lint runner beside it only disagrees with the one that counts |
| `esbenp.prettier-vscode` | the `_lang/typescript` tier travels with the stack | Prettier is superseded by oxfmt — a second formatter fights the format-on-save the project relies on    |

One deliberate subtraction rides with this block, the only one in an otherwise additive adopt: a pre-existing `recommendations` row naming one of these ids — the brownfield case — is **removed**, not kept, because the row actively recommends what the adopted stack forbids (`stacks/_lang/typescript/toolchain.md`: oxlint owns linting, oxfmt owns formatting, ESLint and Prettier are never added). The scaffolder reports every removal. The superseded packages, scripts, and config files themselves are only detected and reported — removing them is the adoption's cleanup move (`workflows/brownfield.md`), never the scaffolder's write.

The block follows the same marker contract as the recommended one — rewritten on every spawn/upgrade apply, rows outside it the project's own, an id the project already lists outside the block left out of it — with distinct markers so the two managed blocks stay unambiguous.
