# Vue & TypeScript Style Guide

**Tier:** Frontend — Vue

The authoritative style rules for Vue code in any Catalyst Vue frontend (Vue 3 + TypeScript, `<script setup>`). Framework modules (e.g. Nuxt) layer their own rules on top — framework carve-outs (routing, data fetching, middleware, SSR) live in the framework module's docs. Component file naming: [`../_common/component-naming.md`](../_common/component-naming.md) and its Vue additions in [`component-naming.md`](component-naming.md). Shared-type placement (`@/types/`), `.d.ts` vs `.ts`, `interface` vs `type`, `import type` discipline: [`../../_lang/typescript/typescript-types.md`](../../_lang/typescript/typescript-types.md). **Worked examples for the rules code disambiguates:** [`vue-style-examples.md`](vue-style-examples.md).

## Template

- **Custom components are PascalCase** (`<UserCard />`); **library components are kebab-case** (`<v-btn>`, `<u-button>`). The casing is how a reader tells project code from vendor code at a glance.
- Leave an empty line between neighboring elements at the same hierarchy level.
- Prefer the project's utility classes over custom CSS where the `frontend/ui` choice provides a utility system; where it does not, a `<style scoped>` block is the default and carries no stigma.
- Avoid deep `v-if` / `v-else` nesting. Reach for `v-show`, a named slot, or `v-for` over pre-filtered data before nesting a second level.
- **Never put `v-if` and `v-for` on the same element** — filter in a `computed` and iterate the result.
- `v-for` always has a stable, unique `:key`. Never the array index unless the list is static and never reordered.
- Break complex trees into subcomponents; use slots for composition rather than passing render flags.
- **Emit names** are the event, not the handler — naming rules in [Event and handler naming](#event-and-handler-naming).

## Script

Always `<script setup lang="ts">`. Use the **`@/` alias, never `~/`**.

**Auto-imports follow the framework's defaults** — under Nuxt that means Vue reactivity (`ref`, `computed`, `watch`, …), framework built-ins (`useRoute`, `useRouter`, `navigateTo`, …), `composables/`, `utils/`, and the component directories named in the framework config. Import explicitly: external packages, and components outside those directories. A project that narrows or widens the auto-import set records it in a convention annex (`references/convention-annexes.md`).

**Section order** — follow it strictly. Four logical groups, separated by blank lines: **imports** (1–5), **declarations** (6–7), **wiring** (8–14), **logic** (15–21).

1. **Dependency imports** — libraries first, ordered from core usage to incidental. Blank line between import categories.
2. **Component imports** — ordered by template usage; components higher in the hierarchy first, self-contained ones (dialogs, overlays) last. Always absolute paths.
3. **Static asset imports** — constants and images from `@/assets/`.
4. **Service imports** — the data layer (`@/services`, `@/services/queries`) grouped together.
5. **Type imports** — `import type` last. Any type used in more than one file belongs in `@/types/`, never inline; use a regular import for an enum whose members are read as values.
6. **Route metadata** — the framework's page-meta call, immediately after imports.
7. **`defineProps`, `defineModel`, `defineEmits`** — in that order. Assign to a `const` only when script logic reads the value. Always type props explicitly, optional ones included.
8. **Template refs and composable inputs** — `useTemplateRef` for DOM and component instances (better inference than a bare `ref`), plus any ref a composable below takes as an argument. If one needs data from a later section, move it down only as far as needed.
9. **Built-in composables** — `useRoute`, `useRouter`, `useAttrs`, `useSlots`, `resolveComponent`. Keep related ones grouped.
10. **External composables** — from packages (`@vueuse/core`, …), grouped by package.
11. **Store usage** — reactive state via `storeToRefs()` first, then actions and getters. Prefer destructuring over a local wrapper property.
12. **Service destructuring** — the methods that make API calls.
13. **Project composables** — from `@/composables`.
14. **Component composables** — destructured from composables defined in this same file (see 21).
15. **Status indicators** — computed values or refs of component-wide significance. Feature-specific ones belong with their feature's logic.
16. **Functions** — component-wide methods (data loading, handlers, async work, helpers), grouped by kind.
17. **Watchers** — those watching component-wide state.
18. **Lifecycle hooks** — in lifecycle order (`onBeforeMount`, `onMounted`, `onUnmounted`, …).
19. **Immediate executions** — setup-time code that fits neither a lifecycle hook nor a computed/watcher.
20. **`defineExpose`** — what the parent may reach.
21. **Local composable definitions** — composables wrapping one feature's logic, used only in this component, at the bottom.

**Grouping rule:** a feature's computed values, functions, and watchers stay together with that feature rather than scattering across sections 15–17. Only genuinely component-wide concerns belong in those sections.

## Event and handler naming

- **Emit names are imperative** — `save`, `select`, `updateItem`. The event names the action the child asks for, not the outcome. Past tense (`uploaded`) is reserved for a notification the parent cannot refuse.
- **camelCase declared, camelCase listened** — `defineEmits<{ updateItem: [id: number] }>()` and `@updateItem="…"`. One spelling in both places; never kebab-case at the call site.
- **Child → parent goes through emits**, every one of them declared in `defineEmits`. A component does not take a callback prop for it.
- **The parent's handler is the matching `handle*`** — `@save` → `handleSave`, one handler per event.
- **`defineModel` over a hand-rolled pair** — never declare a `modelValue` prop and emit `update:modelValue` by hand. A named model emits `update:<name>`.
- **A handler with no matching emit is named for intent, not input device** — `handleSubmit`, not `handleButtonClick`. Add the subject only to separate two handlers of the same intent (`handleSearchInput`, `handleFilterInput`).
- **An inline template expression only forwards or binds** — `@click="handleSelect(user.id)"`. A statement, a branch, or an `await` moves into a named `handle*` (section 16).
- **The event parameter is `event`**, never `e`.

## Style

- **`<style scoped>` by default.** An unscoped block needs a reason in a comment.
- Write custom CSS only where the project's utility classes cannot express it.
- No preprocessor unless the stack already ships one — adding one is a Dependency Change.

## SFC block order

`<template>` → `<script setup>` → `<style scoped>`. Keep the order identical in every file.

## General rules

- Empty lines between major blocks (imports, props, composables, refs, functions).
- Prefer `if + return` over `if/else`, especially at the end of a block.
- Avoid deeply nested logic and large `if/else` chains — early returns and guard clauses instead.
- Group related logic together (the refs, computed values, and watchers for one feature in one place).
- **`function` syntax** for component methods. Arrow syntax only for inline callbacks and array-method arguments.
- Don't keep unused code unless a nearby comment explains why.
- Keep async work in lifecycle hooks, `watch`, or the data layer — never a bare top-level `await` in setup, which suspends the component.
