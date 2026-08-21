# TypeScript Type Conventions

**Tier:** Language — TypeScript/JavaScript

Rules for where to define and how to organize types across the codebase. Paths assume the conventional `@/` import alias for the source root; a project using a different alias substitutes its own.

---

## 1. Placement Rule

**If a type is used in more than one file, it must live in `@/types/`.** Never redefine or re-export a type from a consuming file.

If a type is only used within the file where it's defined (e.g., a local helper shape, an internal function parameter), define it inline in that file. The moment it's needed elsewhere, move it to `@/types/` before importing it.

Import shared types as `@/types/...`.

---

## 2. File Extension

Use `.d.ts` when the file contains **only** type-level declarations: `type`, `interface`, `declare module`, `declare global`. TypeScript enforces this - no runtime code can appear in a `.d.ts` file.

Use `.ts` when the file contains **runtime values** alongside types: `enum` members used as values, typed constants, factory functions.

---

## 3. File Organization

One file per concern. Name the file after the domain, not after a structure keyword.

| File              | Owns                                                                     |
| ----------------- | ------------------------------------------------------------------------ |
| `global.d.ts`     | `declare global {}` - third-party script augmentations (e.g. `Window`)   |
| `components.d.ts` | Shared prop contracts used across two or more components                 |
| `<domain>.ts`     | A domain's Zod schemas and the types inferred from them (e.g. `user.ts`) |

A domain whose shapes are validated at the boundary owns a `.ts` file: the schema is a runtime value, and the type is inferred from it beside the schema rather than hand-written elsewhere - the frontend module's `validation.md` owns that rule. Only shapes with no runtime schema behind them stay in a `.d.ts`.

When adding a type that doesn't belong to any existing file, create a new file named after the new concern (e.g., `payments.ts`, `notifications.d.ts`).

Framework-generated types (in a Next.js project: `next-env.d.ts`, `.next/types/**`) live where the framework puts them and are managed by it - do not edit or colocate them under `@/types/`.

---

## 4. `interface` vs `type`

- **`type`** everywhere by default - component props, data models, response shapes, unions, intersections, aliases, utility types, and every `z.infer` result.
- **`interface`** only where declaration merging is the mechanism: augmenting a library's or the framework's own types (`declare module`, `declare global`). Merging is the reason to reach for it, not extensibility in general - a shape that grows is a `type` plus an intersection.

---

## 5. Ambient vs Module Files

A `.d.ts` file is either an **ambient file** (no imports/exports → everything is global) or a **module file** (has at least one `import` or `export` → scoped).

- If a file declares both local exported types and a `declare global {}` block, add `export {}` at the bottom to force it into module mode. Without it, `declare global` behaves unexpectedly.
- Prefer module files. Only use ambient globals for `Window` augmentation or third-party script stubs.

---

## 6. Importing Types

Always use `import type` when the import is type-only:

```ts
import type { UserResult } from '@/types/api';
```

Use a regular import only when the value itself is used at runtime (e.g., an enum whose members appear in expressions).

When the same module supplies **both** a runtime value and types (typical for `react`, `next`), use a regular `import { ... } from 'react'` and a **separate trailing** `import type { ... } from 'react'` - do not use inline `import { useState, type ChangeEvent }`. The frontend tier's style guide owns the full import-order rules — `stacks/frontend/_react/react-style.md` or `stacks/frontend/_vue/vue-style.md`, whichever the project's stack ships. Only one of them travels into a project, so this document names them rather than linking.

---

## 7. JSDoc Comments

Omit JSDoc on types whose purpose is obvious from the name and shape. Add a single-line comment only when a field has a non-obvious constraint, a workaround, or behavior that would surprise a reader.
