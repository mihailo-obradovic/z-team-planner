# Vue & TypeScript Style Guide

**Tier:** Frontend — Vue

The authoritative style rules for Vue code in any Catalyst Vue frontend (Vue 3 + TypeScript, `<script setup>`). Framework modules (e.g. Nuxt) layer their own rules on top — framework carve-outs (routing, data fetching, middleware, SSR) live in the framework module's docs. Component file naming: [`../_common/component-naming.md`](../_common/component-naming.md) and its Vue additions in [`component-naming.md`](component-naming.md). Shared-type placement (`@/types/`), `.d.ts` vs `.ts`, `interface` vs `type`, `import type` discipline: [`../../_lang/typescript/typescript-types.md`](../../_lang/typescript/typescript-types.md). **Worked examples for the rules code disambiguates:** [`vue-style-examples.md`](vue-style-examples.md).

## Template

- **Custom components are PascalCase** (`<UserCard />`); **library components are kebab-case** (`<v-btn>`, `<u-button>`). The casing is how a reader tells project code from vendor code at a glance.
- Leave an empty line between neighboring elements at the same hierarchy level.
- Prefer the project's utility classes over custom CSS where the `frontend/ui` choice provides a utility system; where it does not, a `<style scoped>` block is the default and carries no stigma.
- Avoid deep `v-if` / `v-else` nesting. Reach for `v-show`, a named slot, or `v-for` over pre-filtered data before nesting a second level.
- **Never put `v-if` and `v-for` on the same element** — filter in a `computed` and iterate the result.
- **The app shell renders a `<main>` landmark, and a "Skip to main content" link is the first focusable element on the page.** Without it every keyboard user traverses the whole header before reaching content — six to nine controls, on every navigation. This is an authoring rule, not only an audit check: the author meets it here, where the shell is written.
- `v-for` always has a stable, unique `:key`. Never the array index unless the list is static and never reordered.
- Break complex trees into subcomponents; use slots for composition rather than passing render flags. A **named union selecting one of several forms is not a render flag** — it is one named shape per form, and the framework module's composition document has the pattern.
- **A binding names a value; it does not compute one.** An expression in a binding, an interpolation or a `v-if` may be a property path, an optional chain with a fallback, a call forwarding values the template holds, or a single two-branch ternary over such names and literals. Anything past that is given a name in the script — a computed for component-wide state, a function where the value depends on a `v-for` item — because a template is read for what is rendered, not for how a value was worked out. Five things always move out: a condition of three or more operands, a string built from more than one lookup, an object or array literal, a non-null assertion (the template is asserting what the script declined to narrow), and any expression the formatter wraps onto a second line. Two shapes are not computations and stay: Vue's own `:class` and `:style` array and object syntax, and a UI library's slot map prop, as long as each entry inside is itself a name or a single ternary. Listeners are governed by the rule above, wrapped arrow included.
- **Emit names** are the event, not the handler — naming rules in [Event and handler naming](#event-and-handler-naming).

## Script

Always `<script setup lang="ts">`. Use the **`@/` alias, never `~/`**.

**Auto-imports follow the framework's defaults** — under Nuxt that means Vue reactivity (`ref`, `computed`, `watch`, …), framework built-ins (`useRoute`, `useRouter`, `navigateTo`, …), `composables/`, `utils/`, and the component directories named in the framework config. Import explicitly: external packages, and components outside those directories. A project that narrows or widens the auto-import set records it in a convention annex (`references/project-documents.md`).

**Section order** — follow it strictly. Four logical groups, separated by blank lines: **imports** (1–5), **declarations** (6–7), **wiring** (8–14), **logic** (15–21).

1. **Dependency imports** — libraries first, ordered from core usage to incidental. Blank line between import categories.
2. **Component imports** — ordered by template usage; components higher in the hierarchy first, self-contained ones (dialogs, overlays) last. Always absolute paths.
3. **Static asset imports** — constants and images from `@/assets/`.
4. **Service imports** — the data layer (`@/services`, `@/services/queries`) grouped together.
5. **Type imports** — `import type` last. Any type used in more than one file belongs in `@/types/`, never inline; use a regular import for an enum whose members are read as values.
6. **Route metadata** — the framework's page-meta call, immediately after imports.
7. **`defineProps`, `defineModel`, `defineEmits`** — in that order. Assign to a `const` only when script logic reads the value. Always type props explicitly, optional ones included. **A prop with a default takes `withDefaults(defineProps<…>(), { … })`** — one form, so a reader knows where to look for a default; the type stays the single declaration of what the prop is, and the defaults object says only what it falls back to.
8. **Template refs and composable inputs** — `useTemplateRef` for DOM and component instances (better inference than a bare `ref`), plus any ref a composable below takes as an argument. If one needs data from a later section, move it down only as far as needed.
9. **Built-in composables** — `useRoute`, `useRouter`, `useAttrs`, `useSlots`, `resolveComponent`. Keep related ones grouped.
10. **External composables** — from packages (`@vueuse/core`, …), grouped by package.
11. **Store usage** — state _and getters_ via `storeToRefs()` first, then actions by plain destructuring. Prefer destructuring over a local wrapper property. Getters are computed refs: plain destructuring drops their reactivity, so they travel with state, not with actions. The split itself binds every file that touches a store — composable, plugin, or service, not only an SFC — and this section governs only where it sits in a script block.
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
- **camelCase declared, kebab-case listened** — `defineEmits<{ updateItem: [id: number] }>()` and `@update-item="…"`. The declaration is JavaScript, where camelCase is the convention; the listener is an HTML attribute, where kebab-case is. This is the split Vue's own tooling expects by default — `custom-event-name-casing` enforces camelCase on the declaration, `v-on-event-hyphenation` kebab-case in the template — and a namespaced name is checked segment by segment, so `update:myProp` is listened to as `@update:my-prop`. It costs one thing worth knowing: an event is no longer greppable in a single spelling, so finding every listener for `updateItem` means searching the kebab form too.
- **Child → parent goes through emits**, every one of them declared in `defineEmits`. A component does not take a callback prop for it.
- **The parent's handler is the matching `handle*`** — `@save` → `handleSave`, one handler per event.
- **`defineModel` over a hand-rolled pair** — never declare a `modelValue` prop and emit `update:modelValue` by hand. A named model emits `update:<name>`.
- **A handler with no matching emit is named for intent, not input device** — `handleSubmit`, not `handleButtonClick`. Add the subject only to separate two handlers of the same intent (`handleSearchInput`, `handleFilterInput`). The `handle*` prefix is what pairs a handler with its event, so where there is no event to pair with, a bare intent verb is equally correct: `openPicker`, `closeDialog`, `confirmDelete`, `step`. Prefix or verb, the name states the intent — and a set of such handlers reads better paired than prefixed (`closeDelete`/`confirmDelete` over `handleCloseDelete`/`handleConfirmDelete`). What is never allowed is the input device.
- **A listener binds a handler by name** — `@click="handleSave"`, never a call such as `@click="handleSelect(user.id)"` and never a statement. The one exception is a value only the template holds, a `v-for` item or a slot prop: the listener is then an arrow that passes it and nothing more, `@click="() => handleSelect(user)"` or `@change="(value) => handleChange(stat, value)"`. A value the script can already read, such as a prop or a literal, is not that exception, so it gets its own named handler. Any branch, fallback, or `await` belongs in the handler (section 16), never in the arrow.
- **The event parameter is `event`**, never `e`.

A call in a listener is worse than it looks: `@click="deleteAccount()"` needs its empty parentheses, because dropping them passes the click event as the mutation's input. Binding the handler by name removes the trap rather than documenting it.

## Style

- **`<style scoped>` by default.** An unscoped block needs a reason in a comment.
- Write custom CSS only where the project's utility classes cannot express it.
- No preprocessor unless the stack already ships one — adding one is a Dependency Change.

## SFC block order

`<template>` → `<script setup>` → `<style scoped>`. Keep the order identical in every file.

## Component size

Counted on the whole `.vue` file after formatting — template, script, and style together — so the number is what `wc -l` prints.

- **Over 300 lines is a soft limit.** The file is not wrong, but it is due for structure. First extract coherent template subtrees into child components. Then group each remaining feature group — the state, handlers, and watchers that change together — into a local composable at the bottom of the script (§21), destructured at §14. Single-member leftovers stay top-level.
- **Over 450 lines is a hard limit,** enforced by the lint run. Split until under, child components first.
- **A child must be a coherent subtree** with a self-describing name and a narrow prop boundary. A split done only to get under a number produces a child with no name and a wide prop list; a file that cannot be split that way stays over 300 with composables as its only remedy.
- **A `composables/` file** is created only when a second consumer exists or a template split alone cannot reach 450. One-use logic stays beside its template.

The hard limit is a project script, not an oxlint rule: oxlint's `max-lines` counts only a `.vue` file's script block (verified on 1.79.0), so it cannot see the whole-file number this section is written for. The project keeps `scripts/check-sfc-size.ts` and runs it after oxlint — `"lint": "oxlint && node scripts/check-sfc-size.ts"` — with `SOURCE_DIR` set to its srcDir:

```ts
// * Whole-file count, template and style included: oxlint's `max-lines` sees only a `.vue` file's script block (vue-style.md, Component size).
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const HARD_LIMIT = 450;
const SOURCE_DIR = 'app';

const oversized = sfcFiles(SOURCE_DIR)
  .map((file) => ({ file, lines: lineCount(file) }))
  .filter(({ lines }) => lines > HARD_LIMIT);

for (const { file, lines } of oversized) {
  console.error(`${file}: ${lines} lines, over the ${HARD_LIMIT}-line limit`);
}

process.exit(oversized.length > 0 ? 1 : 0);

function sfcFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      return entry.name === 'node_modules' || entry.name.startsWith('.')
        ? []
        : sfcFiles(path);
    }

    return entry.name.endsWith('.vue') ? [path] : [];
  });
}

function lineCount(file: string): number {
  const text = readFileSync(file, 'utf8');
  const newlines = text.split('\n').length - 1;

  return text.endsWith('\n') ? newlines : newlines + 1;
}
```

## General rules

- Empty lines between major blocks (imports, props, composables, refs, functions).
- Prefer `if + return` over `if/else`, especially at the end of a block.
- Avoid deeply nested logic and large `if/else` chains — early returns and guard clauses instead.
- Group related logic together (the refs, computed values, and watchers for one feature in one place).
- **`function` syntax** for component methods. Arrow syntax only for inline callbacks and array-method arguments.
- Don't keep unused code unless a nearby comment explains why.
- Keep async work in lifecycle hooks, `watch`, or the data layer — never a bare top-level `await` in setup, which suspends the component.
