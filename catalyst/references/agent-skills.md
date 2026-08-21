# Agent Skills

**Trigger:** working with the generated `.claude/skills/` wrappers at a project root — regenerating, debugging, or extending them — or authoring a new skill for a project.

## Generated wrappers

Agent harnesses discover skills at `.claude/skills/<name>/SKILL.md`, outside the bundle. Catalyst keeps the substance in the bundle anyway and generates **thin wrappers** at that path: frontmatter (name + trigger description) plus pointers into `catalyst/` documents. The scaffolder writes them at spawn and the upgrader regenerates them on every apply, from what the bundle actually carries.

Rules of the mechanism:

- **Edit the bundle documents, never a wrapper.** A wrapper is identified by its `<!-- catalyst:generated skill wrapper` marker and is wholly rewritten on regeneration. A same-named skill _without_ the marker belongs to the project and is never touched; stripping the marker is how a project deliberately takes a wrapper over.
- The inventory lives in `SKILLS` in the scaffolder (`tools/new_project.py` in the Catalyst repo — not copied into spawns). Current wrappers: `react-best-practices`, `audit-react-style`, and `audit-react-performance` (any React frontend), `import-shadcn-component` and `update-shadcn-component` (shadcn UI choice), `audit-i18n` (i18n addon), `vue-style` and `audit-vue-style` (any Vue frontend), `nuxt-data-layer`, `nuxt-client-state`, `nuxt-forms`, `nuxt-routing`, and `nuxt-design-system` (the nuxt module), `nextjs-routing`, `nextjs-data-layer`, `nextjs-forms`, `nextjs-client-state`, and `nextjs-design-system` (the nextjs module), `vuetify-setup` and `vuetify-components` (the vuetify UI choice), `nuxtui-setup`, `nuxtui-customization`, and `import-nuxt-ui-component` (the nuxtui UI choice), `laravel-http-layer`, `laravel-models`, and `laravel-testing` (the laravel module), `laravel-auth-session` and `laravel-auth-token` (the matching backend auth choice), and `code-annotations` (every project — the conventions ship in every bundle). Validator R10 keeps that list, this document, and the backing docs in parity.
- **Two kinds of wrapper, and the difference is the `arg_hint`.** A _procedure_ wrapper runs on something the caller names — an audit, an import, an update — and its `arg_hint` describes that target. A _knowledge_ wrapper has an empty `arg_hint`: it is never invoked deliberately, it exists so the harness surfaces the right architecture document at the moment the work starts. Write its description in terms of the task ("when adding an API endpoint", "when a redirect loops"), never in terms of running it.
- **A stack document with no wrapper and no folder-document pointer is only weakly discoverable** — it loads when someone thinks to load it. That is fine for a document read once at Init Design (a module contract) and wrong for one the work needs in hand (a data-layer contract, a validation path, a design-system — instantiated once, then consulted on every styling change). When adding a stack document, decide which it is; if it is the second, it ships with a wrapper in the same change.
- `.claude/settings.local.json` is machine-local and gitignored by the scaffolder; nothing else under `.claude/` is Catalyst's business.
- Skills are discovered at the repository root only. If the bundle sits deeper (monorepo adoption), the wrappers still land at the root the scaffolder was pointed at — the pointers inside them stay correct because they are root-relative.

**Precedence:** bundle documents and the project's convention annexes win over generic guidance from installed plugins or similarly-named third-party skills. A wrapper says so in its body; when a project installs an upstream skill with the same name (e.g. Vercel's `react-best-practices`), the repo's own tiered copy is the one its conventions bind to.

## Authoring skills

For a skill a project writes itself (procedure docs in the bundle + a hand-written or generated wrapper), these patterns have earned their keep:

- **Clarification gating.** A skill that produces an artifact from an underspecified request must collect material parameters before producing anything: at most 3 question rounds of at most 4 questions each, never re-asking anything already answered, and — when running unattended — writing a structured questions file for the caller instead of guessing. Fabricated parameters are Honest Inputs violations.
- **`disable-model-invocation: true`** in the frontmatter for side-effect-heavy skills (publishing, deploying, deleting, creating external resources): the model then never triggers it on its own — the user invokes it deliberately.
- **Route, don't inline.** A skill body stays a router: trigger description in frontmatter, pointers to the owning documents, an output contract. Substance lives in documents that are readable without the skill.
- **Per-rule files.** Large rule sets ship as one file per rule with YAML frontmatter (`title`, `impact`, `tags`) and an incorrect/correct example pair, indexed by a router doc that says "read only the relevant rules" — never loaded wholesale. The `rules/` dirs under `stacks/` follow this shape.
- **A "when to load deeper guidance" table** in the entry document beats scattering triggers across files: one row per document — when it applies, what it owns.
