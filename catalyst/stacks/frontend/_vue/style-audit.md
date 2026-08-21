# Vue Style Audit

**Tier:** Frontend — Vue

Audit Vue SFCs (and composable/util `.ts` files) for conformance to the style guide, then apply fixes. Invoked via the generated `audit-vue-style` skill wrapper or directly.

**Authoritative rules:** [`vue-style.md`](vue-style.md) (with worked examples in [`vue-style-examples.md`](vue-style-examples.md)), [`component-naming.md`](component-naming.md), and [`../_common/component-naming.md`](../_common/component-naming.md).

**Target:** the target files/directory given by the caller. If the target is a directory, audit all `.vue` files in it recursively (and `.ts` files for composables/utils/stores). If it is a single file, audit just that file.

## What to Check

For each file, verify and fix:

### SFC block order

- `<template>` → `<script setup>` → `<style scoped>`. Flag any other order.
- `<script setup lang="ts">` — flag Options API, a bare `<script>`, or a missing `lang="ts"`.

### Template

- Audit against `vue-style.md` → **Template** (tag casing, sibling blank lines, `:key` discipline, `v-if`/`v-for` separation, shallow conditionals, utility-first CSS).
- Icon-only interactive elements have an accessible name on the control and `aria-hidden` on the icon. Decorative SVGs are `aria-hidden`.

### Script — imports and the auto-import boundary

- **`@/` alias everywhere; flag every `~/`.**
- Flag explicit imports of auto-imported symbols: Vue reactivity, framework built-ins, `composables/`, `utils/`, and components in the auto-registered directories.
- Flag missing explicit imports: external packages, and components outside the auto-registered directories.
- Check the project's actual auto-import configuration before flagging either direction — a project that narrowed the defaults records it in a convention annex, and the annex wins.
- Type-only imports use `import type` and come last. Shared types live in `@/types/`, never redefined inline (`../../_lang/typescript/typescript-types.md`).

### Script — section order

Verify the twenty-one sections in `vue-style.md` appear in order, and that the four groups (imports 1–5, declarations 6–7, wiring 8–14, logic 15–21) are separated by blank lines.

**Do NOT auto-fix a section reordering.** Moving declarations past each other can change evaluation order and break a file that currently works. Report each ordering violation with its `file:line` and the move it wants, and leave the code alone unless the caller asks for the move specifically.

Everything else in this document is safe to fix directly.

### Script — declarations and structure

- `defineProps` → `defineModel` → `defineEmits`, in that order.
- Props typed explicitly, optional props included. Flag untyped or inferred-only props.
- Flag an `interface` declaring props or any other object shape — `interface` is reserved for declaration merging (`../../_lang/typescript/typescript-types.md`, §4).
- `defineProps` bound to a `const` **only** when script logic reads it — flag an unused `const props`.
- `useTemplateRef` for template refs rather than a bare `ref()`.
- Store access destructures `storeToRefs()` for state, plain destructuring for actions. Flag a local wrapper property that only re-exposes a store value.
- Local composables (section 21) sit at the bottom of the script block, not interleaved.
- **Feature grouping:** a feature's refs, computed values, functions, and watchers stay together. Flag logic scattered across sections 15–17 that belongs to one feature.

### Style block

- Audit against `vue-style.md` → **Style** (`<style scoped>` default with a commented reason for exceptions; no preprocessor the stack does not already ship).
- When the project has an instantiated design-system annex, styling values — colors, spacing, radii, shadows, z-index, durations — come from its tokens (`var(--*)` / Vuetify theme keys). Flag raw hex/px one-offs and off-scale values.

### General rules

- Audit against `vue-style.md` → **General rules** (block spacing, guard clauses, `function` syntax for methods, unused code, no bare top-level `await` in setup).

### Naming

- File names per `../_common/component-naming.md` — PascalCase, no `*Section` suffix or brand prefix, self-describing basenames, kebab-case folders.
- Auto-import tag resolution per `component-naming.md`: flag a nested file under the registered directory whose generated tag stutters (`_shared/users/UserCard.vue` → `<UsersUserCard>`).
- Events and handlers per `vue-style.md` → **Event and handler naming**: imperative emit names, camelCase in `defineEmits` and at the call site (flag kebab-case listeners), every emit declared, `handle*` matched one-to-one against the event, `defineModel` rather than a hand-rolled `modelValue` prop plus `update:modelValue` emit, a callback prop where an emit belongs, handlers named for intent rather than input device, inline expressions confined to forwarding and binding, and an `event` parameter (flag `e`).
- The registered shared-components directory is `@/components/_shared/` per `component-naming.md`: cross-check the framework's registration config (e.g. `components.dirs` in `nuxt.config.ts`) and flag a registered directory named anything else (`shared/`, `ui/`, `common/`) unless a convention annex records the deviation.

### Accessibility

- Every interactive element is keyboard-reachable and has an accessible name.
- A non-native control carrying `role="button"` activates on **both** Enter and Space.
- The app shell or page renders a `<main>` landmark with a "Skip to main content" link as the first focusable element when absent.

## Output

The audit's success criterion is the re-check against the baseline — conformance counts standing in for measurements:

1. **Baseline.** Scan every target file and record the violations found, with `file:line` references, counted per check section above (block order, template, imports, section order, declarations, style, general, naming, accessibility). The counts are fixed before any fix is applied.
2. **Fix.** Apply the fixes directly, except section reordering, which is reported and left alone. If any other fix is ambiguous or would change behavior, flag it and skip — a flagged item is not a failure, but it must be listed with its reason.
3. **Re-check.** Re-scan the audited files: remaining violations must be zero, flagged, or reported-not-fixed section orderings. A fix that did not survive the re-scan is reported, never silently dropped.
4. **Gate.** The project's typecheck and lint pass after the fixes. A fix that breaks either is reverted and flagged.

End with the summary: files audited, violations found vs fixed vs flagged vs reported-only per category, and the gate result.
