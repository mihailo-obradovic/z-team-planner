---
paths:
  - '**/*'
---
# Vue Styling Guide

## Intro

This document outlines the preferred structure and style for Vue components in our projects. It is designed to ensure consistency, readability, and maintainability across the codebase. The following sections describe how to organize and write different parts of a Vue component.
We follow modern standards based on Vue 3 and Nuxt 4, with support for auto-imports of composables, stores, shared components, and utility modules. These conventions are designed to work well with IDE autocompletion, static analysis, and team collaboration.

> Note: This guide assumes flexibility in the choice of UI libraries. The focus is on general best practices and any specific conventions for libraries like NuxtUI, Shadcn, Vuetify and others will be documented separately.

## Template Structure

- Leave an empty line between neighboring HTML tags of the same hierarchy level.
- When applying classes, prefer utility classes if available (e.g., Tailwind, Vuetify) over custom CSS.
- Use **PascalCase** for custom components and **kebab-case** for library components.
- Avoid deep `v-if/v-else` nesting. Prefer `v-show`, `v-slot`, or `v-for` with pre-filtered data.
- Break down complex templates into smaller, logical subcomponents or use slots.

## Script Structure

- Always use `<script setup lang="ts">` for consistency and TypeScript support.
- Use the `@/` alias for imports; avoid `~/`.
- Assume auto-imports for project-level modules, stores, utils and shared components. Explicitly import only external packages or components not in `@/components/_shared`.

> Note: Section order is optimized for clarity, separation of concerns, and AI/autocomplete compatibility.

### 1. Dependency Imports

- If the file uses any libraries, import them at the top of the script section.
- Order these from those that are used in the core of the component to those that are used less frequently or are more specific.
- Always leave an empty line between different import categories.

### 2. Component Imports

- Import components based on their usage in the template; core components that are higher up in the hierarchy should be imported first; components that are completely separate such as dialogs should be imported last.
- Always use absolute paths.

### 3. Static asset imports

- Import static assets from `@/assets/constants` or `@/assets/images`.

### 4. Service Imports

- Group API imports coming from `@/api`, '`@/api/queries`, `@/services` or similar together.

### 5. Type Imports

- Use explicit `import type` for types from `@/types`, third-party packages, or local files.
- When importing enums, use `import type` if we're only using the type. If the value(s) are also used, use a regular import.

---

### 6. `definePageMeta`

- Nuxt-specific function for route metadata.
- Place immediately after imports.

### 7. `defineProps`, `defineModel`, `defineEmits`

- Recommended order: `defineProps`, then `defineModel`, then `defineEmits`.
- Use `const something = ...` only if the values need to be used in the script logic.
- Always define prop types explicitly, even if they are optional.

---

### 8. Template and other refs needed for composable inputs

- `ref()` variables linked to DOM or component instances. Use the `useTemplateRef` composable for better type inference.
- Any other refs required as input arguments to use built-in, external, store, service, project or component composables. In case any of these require data coming from the below sections, move them below but only as much as needed.

### 9. Built-in composables

- Destructure built-in Vue composables like `useRoute`, `useRouter`, `useAttrs`, `useSlots`, `resolveComponent`, etc.
- Keep related composables grouped together.

### 10. External composables

- Composables from packages like `@vueuse/core`, `pinia`, etc.
- Group by package if there are multiple.

### 11. Store usage

- For Pinia stores, always use `ref()` syntax for state, getters, and actions.
- Always use `ref()`-style access where applicable.
- When importing stores, prefer destructuring over defining a local wrapper property of the store.
- Import reactive variables first using `storeToRefs()`, then everything else.

### 12. Service destructuring

- Regularly destructure methods that make API calls.

### 13. Project composables

- Destructure properties/methods from composables defined in `@/composables`.

### 14. Component composables

- Destructure properties/methods from composables defined in the same file, at the bottom of the script section.

---

### 15. Status indicators

- Computed properties or refs that indicate statuses of component-wide significance. Other computed properties that are more specific to a feature should be grouped with that feature's logic.

### 16. Functions

- Methods of component-wide significance such as those that load data should be defined here. Other functions that are more specific to a feature should be grouped with that feature's logic.
- Group by type (e.g., event handlers, async operations, helpers).

### 17. Watchers

- Watchers that monitor states of component-wide significance should be defined here. Other watchers that are more specific to a feature should be grouped with that feature's logic.

### 18. Lifecycle hooks

- `onBeforeMount`, `onMounted`, `onUnmounted`, etc.
- Order them in the same order the lifecycle progresses.

### 19. Immediate executions

- Code that needs to run immediately on setup (previously in `created()`).
- Only use if it doesn’t belong in a lifecycle hook or computed/watcher.

### 20. `defineExpose`

- Properties or methods that need to be exposed to the parent.

### 21. Local composable definitions

- Composables that wrap a feature's logic together and are only used in this component.

---

## Style Structure

- Use `<style scoped>` by default.
- Only write custom CSS if built-in utility or framework classes (e.g., Vuetify, Tailwind) don't suffice.

---

## General Guidelines

- **Add empty lines between major blocks**: imports, props, composables, refs, functions, etc.
- **Prefer `if + return` over `if/else`**, especially at the end of a block.
- **Avoid deeply nested logic or large `if/else` blocks** — use early returns and guard clauses.
- **Group similar logic together**, e.g., refs/computed/watchers relating to one feature in one place.
- **Always use `function` syntax**, not arrow functions, for defining component methods. Arrow syntax is preferrable for inline functions or callbacks.
- **File section order**: `<template>` → `<script>` → `<style>`.
- **Use `@/` instead of `~/` for imports**.
- **Assume auto-imports are enabled** for composables, stores, utils, and shared components located in `@/components/_shared`.
- **Don't keep unused code unless instructed by a nearby comment**.
- **Keep async logic in hooks, `watch`, or `computed` — not top-level.**
- **Use `pnpm` for package management across the project.**
