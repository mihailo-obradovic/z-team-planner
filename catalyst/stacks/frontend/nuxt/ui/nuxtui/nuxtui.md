# Stack: Frontend UI — Nuxt UI

**Layer:** Frontend / UI
**Tool:** Nuxt UI 4 · Tailwind CSS 4 · Reka UI

Vue's first-party-adjacent component library for the Nuxt module, built on Reka UI for behaviour and Tailwind Variants for theming.

- Components are used **kebab-case** in templates (`<u-button>`, `<u-modal>`), per the tag-casing rule in `../../../_vue/vue-style.md`; project components stay PascalCase, so a library tag and a project component never read alike.
- **Tailwind utility classes** are the project's utility system — Nuxt UI brings Tailwind CSS 4, so the style guide's "prefer utilities over custom CSS" rule is satisfied without a `<style scoped>` block in most components.
- **Colour comes from the seven semantic aliases** (`primary`, `secondary`, `success`, `info`, `warning`, `error`, `neutral`), never a palette name and never a hex. The ramps behind them, and the per-mode token set, live in the project's stylesheet.
- Nuxt UI **registers `@nuxt/icon`, `@nuxt/fonts` and `@nuxtjs/color-mode` itself** — none of them belongs in the `modules` array, and none needs a direct dependency entry. They are configured through root-level keys in `nuxt.config.ts`.

## Icons

Nuxt UI resolves every icon name — its own defaults included, like the `:loading` spinner's `lucide:loader-circle` — through `@nuxt/icon`. Without a matching collection package installed, that resolution goes over the Iconify HTTP API at runtime, so icons silently fail to render offline and cost a request when they do work.

The project therefore installs **`@iconify-json/lucide`** as a dev dependency, which `@nuxt/icon` bundles locally. Lucide because it is Nuxt UI's own default prefix: the roughly forty stock component icons resolve through the `ui.icons` map in `app.config.ts`, and leaving them on their default prefix means every one keeps working with no per-icon aliasing.

This is not a contradiction of the "never add `@nuxt/icon` yourself" rule below. The **module** is Nuxt UI's to own; the **collection data** it resolves against is the project's choice, and is exactly the `<icon set>` the design system's Iconography section asks each project to record. One icon set, product-wide — a second collection is a Dependency Change and a design-system violation both, with a single carve-out: Lucide ships no logos, so brand marks may come from `@iconify-json/simple-icons` under the Iconography section's brand-mark exception.

## Module Documents

| Document                               | What it holds                                    | Load                                                                                            |
| -------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| [`customization.md`](customization.md) | How a component's theme is overridden, and where | When changing what a component looks like, importing a component's defaults, or adding a colour |

## AI Tooling

This module expects two things the library publishes for agents:

- The **Nuxt UI MCP server** (`.mcp.json`, project scope, `https://ui.nuxt.com/mcp`) — the authority on component APIs: props, slots, events, and the default theme an import copies. Component API questions go there rather than to a bundle document, which is why no document here restates them. The scaffolder writes the entry at spawn; a project adopting this module later adds it by hand.
- The **vendored `nuxt-ui` skill** (`.claude/skills/nuxt-ui/`) — upstream's own guidance on component selection, layouts, and recipes. It is not part of the bundle; the project vendors it from upstream on day zero (below).

## Vendoring The Upstream Skill

Nuxt UI maintains its own agent skill in the library repository: https://github.com/nuxt/ui — `skills/nuxt-ui/` (branch `v4`). Vendoring it is a **day-zero step** for a project on this module: do it before the first UI task, and record the pin here.

It lands at `.claude/skills/nuxt-ui/` rather than inside this bundle: upstream ships `SKILL.md` and its `references/` as one unit with relative links between them, so splitting the substance into the bundle would mean rewriting every internal link and maintaining that as a permanent deviation.

The copy is oxfmt-canonical like every other document here, per the no-ignore-patterns rule in `../../../../_lang/typescript/toolchain.md`; a re-sync normalizes upstream through the same oxfmt before diffing, so formatting never reads as drift.

The vendor step, and every later re-sync: clone `skills/nuxt-ui/` at the `v4` branch tip, normalize it through oxfmt with this repo's config, diff against `.claude/skills/nuxt-ui/` (first vendor: land it wholesale), and apply upstream's changes while re-applying the one prescribed deviation — a note above `SKILL.md`'s intro that points at this section and subordinates upstream guidance to the `catalyst/` documents. Record the pin in this document in the same change:

Upstream: https://github.com/nuxt/ui — `skills/nuxt-ui/` (branch `v4`) · commit: `<sha>` · synced: `<date>`

Local deviations from upstream:

| File       | Deviation                                                                                                                    |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `SKILL.md` | Note added above the intro: points at this Vendoring section and subordinates upstream guidance to the `catalyst/` documents |

## Components Not Used

A handful of the library's components are declined on purpose, because another module in the stack already owns the job they do. They are listed here so a reader who reaches for one — or an agent that finds it in the MCP server — meets the reason rather than the silence.

- **`<u-form>`** — it is a validation component, not a layout one: it takes a `schema` or a `validate` function, holds the error state, gates `@submit` on validity, and injects each field's errors into the `<u-form-field>` matching its `name`. Regle owns all four here (`../../validation.md`), so the two would contend for the same state, and a `:schema` would put Zod on the request side, which that document forbids in both directions. Forms are a native `<form novalidate @submit.prevent>` around ordinary `<u-form-field>`s, each bound to its own `$errors` — which is also what lets a submit button rendered outside the element reach it by `form="…"`. The field and input components are unaffected and remain mandatory; only the form wrapper is declined.

## Avoid By Default

- Restating a component's API — props, slots, events — in a bundle document. The MCP server is the source, and a copied API list is stale the next release.
- Wrapping every Nuxt UI component in a project component "for consistency". Wrap only where the project adds real behaviour or a genuinely repeated composition.
- Reaching past the theme with deep selectors into generated classes. Slot classes, variants, and the `class` prop are the supported surface.
- Adding `@nuxt/icon`, `@nuxt/fonts`, or `@nuxtjs/color-mode` to `modules` or to dependencies — Nuxt UI already owns them, and a duplicate registration is a silent double-install. The icon _collection_ is the exception and is deliberate (Icons).
- Reaching for an icon outside the installed collection. A name from another prefix resolves over the network at runtime rather than failing the build, so it looks like it works locally and breaks offline.
