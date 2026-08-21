# Tier: Frontend — Vue

**Tier:** Frontend — Vue

Shared Vue-general conventions for any Vue-based frontend module — SFC style, script section order, component structure, and the auto-import boundary, framework-agnostic within Vue. This directory is never a spawn choice; it travels automatically with any module whose `**Requires:**` header names `frontend/_vue` (e.g. the nuxt module). Language-level rules live in `../../_lang/typescript/`; framework-agnostic component file naming lives in [`../_common/component-naming.md`](../_common/component-naming.md); framework-specific rules (routing, data layer, SSR) live with the framework module that requires this tier.

## Module Documents

| Document                | What it holds                                                                                                                                         | Load                                                                    |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `vue-style.md`          | The authoritative Vue & TypeScript style rules — template, the 21-point script section order, event and handler naming, style blocks, SFC block order | When writing or reviewing Vue code                                      |
| `vue-style-examples.md` | Worked SFC examples for the rules that code disambiguates                                                                                             | When a rule's application is unclear                                    |
| `component-naming.md`   | The Vue-side additions to `../_common/component-naming.md` — auto-import name resolution, tag casing, where shared components live                    | When creating or renaming component files                               |
| `style-audit.md`        | The audit procedure — count violations against the style guide, fix, re-check against the baseline                                                    | When auditing Vue files (via the `audit-vue-style` wrapper or directly) |

Performance work leans on the language-level rules in `../../_lang/typescript/performance.md`; there is no Vue-specific rule set.
