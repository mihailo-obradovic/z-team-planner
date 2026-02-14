# Audit Vue Style

Audit Vue files for conformance to the project's Vue Styling Guide and apply fixes.

**Target:** $ARGUMENTS

If the target is a directory, audit all `.vue` files in it recursively. If it's a single file, audit just that file.

## What to Check

For each `.vue` file, verify and fix:

### Template (`<template>`)

- Empty lines between neighboring HTML tags at the same hierarchy level
- PascalCase for custom components, kebab-case for library components
- No deep `v-if/v-else` nesting (suggest `v-show`, pre-filtered data, or subcomponents)
- Utility classes preferred over custom CSS

### Script (`<script setup lang="ts">`)

- Uses `<script setup lang="ts">` (not Options API or plain `<script>`)
- Uses `@/` alias, never `~/`
- Auto-imports used correctly (no explicit imports for composables, stores, utils, or components in `@/components/_shared`)
- **Section ordering** follows the 21-point order defined in CLAUDE.md:
  1. Dependency imports
  2. Component imports
  3. Static asset imports
  4. Service imports
  5. Type imports
  6. definePageMeta
  7. defineProps / defineModel / defineEmits
  8. Template refs and composable input refs
  9. Built-in composables
  10. External composables
  11. Store usage (storeToRefs first)
  12. Service destructuring
  13. Project composables
  14. Component composables
  15. Status indicators
  16. Functions
  17. Watchers
  18. Lifecycle hooks
  19. Immediate executions
  20. defineExpose
  21. Local composable definitions
- Empty lines between major blocks
- `function` syntax for component methods (not arrow functions); arrow syntax only for inline callbacks
- `if + return` preferred over `if/else`
- No unused code unless marked by a comment
- Prop types explicitly defined
- Feature-specific computed/functions/watchers grouped together rather than scattered across sections 15-17

### Style (`<style>`)

- Uses `scoped` attribute
- Custom CSS only when utility classes don't suffice

### File Structure

- Section order: `<template>` then `<script>` then `<style>`

## Output

For each file:

1. List all issues found with line references
2. Apply the fixes directly
3. If a fix is ambiguous or would change behavior, flag it and skip

At the end, provide a summary of all files audited and changes made.
