# Workflow: Bootstrap

**Trigger:** one-time scaffolding of a new service or app — structure, config, health check, containerization, test setup. No product behavior. The moment scaffolding carries durable behavior others depend on, it becomes a feature with its own document.

The locked invariant is in the Flow Index (`prime-directive.md`).

## Steps

1. Confirm the weight (`Medium`, or `Hard` for several services at once).
2. Plan first; the approved plan is the decision record (type `bootstrap`), reviewed before scaffolding.
3. Scaffold strictly per `architecture.md`: structure, layering, build order, approved libraries. Add no product behavior and no feature rows in `project-summary.md` (the decision record gets its own index row).
4. Deliver the environment around the skeleton: a committed `.env.example` naming every variable with safe placeholders (real values never committed), a seed script for dev data, a reset script (services down, volumes cleared), and compose profiles when the stack carries services most tasks do not need.
5. Seed folder documents: every source directory the skeleton creates that a bundle document governs gets a folder `CLAUDE.md`/`AGENTS.md` orientation map with pointer lines into `catalyst/` — never restated rule text (`references/folder-documents.md`). Canonical pairs: `components/` → `stacks/frontend/_common/component-naming.md` + the framework tier's style guide (`stacks/frontend/_react/react-style.md` or `stacks/frontend/_vue/vue-style.md`); the routing dir → the framework module's routing doc (e.g. `stacks/frontend/nextjs/app-router.md`); `types/` → `stacks/_lang/typescript/typescript-types.md`; the UI-primitives dir → the `frontend/ui` choice's docs; i18n catalogs → the i18n addon's `catalog-hygiene.md`. Any future directory a bundle document governs follows the same rule.
6. For every stateful component the skeleton introduces (broker, database, cache, IdP), add its section to `operations.md` — Operate / Recovery / Quirks (`references/operations-runbook.md`).
7. Verify with a smoke check (app starts, health answers, empty suite runs) and report it.
