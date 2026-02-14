# Z-Team Planner

## Project Overview

This is a build calculator for heroes, synergy pairs and overall team compositions in the game **Dispatch**. It provides an interface that displays an overview of the whole team with controls to adjust each hero. Additional setup flags define who was cut in episode 3 and who was added in episode 4. Users can save, load and share their builds. Full game mechanics reference is in `.claude/docs/dispatch.md`.

## Tech Stack

- **Framework:** Nuxt 4 with TypeScript. Auto imports are available for everything that would be manually imported in a regular Vue project.
- **UI:** NuxtUI v4. Global customizations are preferred over local prop overrides unless the use case is unique. Global modifications live in `app/config/nuxt-ui/`. The official NuxtUI MCP is available — use it to look up component APIs and theme defaults.
- **Images:** Nuxt Image for optimization.
- **Icons:** Lucide icon set + custom icons in `app/assets/icons/`, imported via `iconsMap` from `app/utils/iconsMap`.
- **Utilities:** VueUse for utility composables.
- **Linting/Formatting:** ESLint + Prettier. `.editorconfig` for less common file types.
- **Backend:** Nuxt Nitro, code in `server/`.
- **Package manager:** pnpm.

## Vue Styling Guide

### Template

- Leave an empty line between neighboring HTML tags at the same hierarchy level.
- When applying classes, prefer utility classes (Tailwind) over custom CSS.
- **PascalCase** for custom components, **kebab-case** for library components.
- Avoid deep `v-if/v-else` nesting. Prefer `v-show`, `v-slot`, or `v-for` with pre-filtered data.
- Break complex templates into subcomponents or use slots.

### Script

Always use `<script setup lang="ts">`. Use `@/` alias for imports, never `~/`. Assume auto-imports are enabled for project-level composables, stores, utils, and shared components in `@/components/_shared`. Explicitly import only external packages or components not in `@/components/_shared`.

**Section order** (follow strictly — sections are separated by `---` to mark logical groups):

1. **Dependency imports** — If the file uses any libraries, import them first. Order from core usage to less frequent. Always leave an empty line between different import categories.
2. **Component imports** — Import based on template usage; core components higher in hierarchy first, completely separate ones like dialogs last. Always use absolute paths.
3. **Static asset imports** — from `@/assets/constants` or `@/assets/images`
4. **Service imports** — Group API imports from `@/api`, `@/api/queries`, `@/services` together.
5. **Type imports** — explicit `import type` from `@/types`, packages, or local files. When importing enums, use `import type` if only the type is needed; use regular import if the value(s) are also used.
6. **`definePageMeta`** — Nuxt route metadata, placed immediately after imports.
7. **`defineProps`, `defineModel`, `defineEmits`** — in that order. Use `const something = ...` only if the values need to be used in script logic. Always define prop types explicitly, even if optional.
8. **Template refs and composable input refs** — `ref()` variables linked to DOM or component instances. Use `useTemplateRef` for better type inference. Also any other refs required as input arguments to composables below. If any of these require data from later sections, move them down but only as far as needed.
9. **Built-in composables** — Destructure `useRoute`, `useRouter`, `useAttrs`, `useSlots`, `resolveComponent`, etc. Keep related composables grouped.
10. **External composables** — From packages like `@vueuse/core`, `pinia`, etc. Group by package if there are multiple.
11. **Store usage** — Pinia stores with `ref()` syntax for state, getters, and actions. Always prefer destructuring over defining a local wrapper property of the store. Import reactive variables first using `storeToRefs()`, then everything else.
12. **Service destructuring** — Destructure methods that make API calls.
13. **Project composables** — Destructure properties/methods from composables in `@/composables`.
14. **Component composables** — Destructure properties/methods from composables defined in the same file, at the bottom of the script section (see section 21).
15. **Status indicators** — Computed properties or refs that indicate statuses of component-wide significance. Other computed properties more specific to a feature should be grouped with that feature's logic.
16. **Functions** — Methods of component-wide significance (data loading, event handlers, async operations, helpers). Group by type. Functions more specific to a feature should be grouped with that feature's logic.
17. **Watchers** — Watchers monitoring states of component-wide significance. Feature-specific watchers should be grouped with that feature's logic.
18. **Lifecycle hooks** — `onBeforeMount`, `onMounted`, `onUnmounted`, etc. Order them in the same order the lifecycle progresses.
19. **Immediate executions** — Code that needs to run immediately on setup (previously in `created()`). Only use if it doesn't belong in a lifecycle hook or computed/watcher.
20. **`defineExpose`** — Properties or methods exposed to the parent.
21. **Local composable definitions** — Composables that wrap a feature's logic together and are only used in this component.

**Grouping rule:** Feature-specific computed, functions, and watchers should be grouped together with their feature rather than scattered across sections 15-17. Only component-wide concerns belong in those sections.

### Style

- `<style scoped>` by default.
- Only write custom CSS when utility/framework classes don't suffice.

### File Section Order

`<template>` → `<script>` → `<style>`

### General Rules

- Add empty lines between major blocks (imports, props, composables, refs, functions).
- Prefer `if + return` over `if/else`, especially at block end.
- Avoid deeply nested logic or large `if/else` blocks — use early returns and guard clauses.
- Group similar logic together (e.g., refs/computed/watchers relating to one feature in one place).
- **Use `function` syntax** for defining component methods. Arrow syntax is preferable for inline functions or callbacks.
- Don't keep unused code unless instructed by a nearby comment.
- Keep async logic in hooks, `watch`, or `computed` — not top-level.

## NuxtUI Component Customization

Config files live in `app/config/nuxt-ui/`, loaded in `app.config.ts`, with type helpers in `types/nuxt-ui.d.ts`.

When customizing a component's theme config, **never overwrite defaults**. Use these patterns:

**(a) Adding classes** — convert the classlist string to an array, keep the default as the first element:

```ts
base: [
    'rounded-md font-medium inline-flex items-center',
    // * Changes:
    'justify-center'
],
```

**(b) Changing a prop default** — add inline comment with original value:

```ts
color: 'secondary', // * Default: 'neutral'
```

**(c) Adding a new variant** — add a comment marking it:

```ts
  // * New type
  faded: {
    border: 'border-solid',
    root: 'mask-[linear-gradient(to_right,transparent_0px,white_120px,white_calc(100%-120px),transparent_100%)]'
  }
```

## Reference Documents

- `.claude/docs/dispatch.md` — Full game mechanics: story, Z-Team roster, hero stats, powers, synergy pairs, dispatching system, scoring
