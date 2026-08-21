# Vue Component Naming

**Tier:** Frontend — Vue

The Vue-side additions to [`../_common/component-naming.md`](../_common/component-naming.md), which owns the framework-agnostic rules — PascalCase files, no `*Section` suffix or brand prefix, self-describing basenames, kebab-case folder segments. Those hold here unchanged; this document adds what only Vue has: a component's file path decides the tag it resolves to.

## Where shared components live

**`@/components/_shared/`** is the auto-registered directory: its components are usable in any template with no import. Everything else under `@/components/` is imported explicitly.

The underscore is deliberate — it sorts the directory to the top and marks it as infrastructure rather than a feature folder. It holds shared components generally, `UI*` primitives among them.

```ts
✅ @/components/_shared/UIField.vue        auto-registered, no import
✅ @/components/users/UserFormDialog.vue   imported explicitly where used
```

Registering a second directory, or turning auto-registration off, is a project decision recorded in a convention annex — not something to do file by file.

## Auto-import name resolution

A component's tag name is built from **its path relative to the registered directory**, not from its filename alone. A file nested one level deeper answers to a different tag.

```ts
@/components/_shared/UserCard.vue        → <UserCard />
@/components/_shared/users/UserCard.vue  → <UsersUserCard />
```

The second one is the stutter that `../_common/component-naming.md`'s self-describing-basename rule already forbids: the folder is repeating itself into the tag. Keep the registered directory flat, or name files so the generated tag reads naturally.

## Tag casing at the call site

- **PascalCase** for project components — `<UserCard />`, `<UIField />`.
- **kebab-case** for library components — `<v-btn>`, `<u-button>`.

Both are valid Vue for either kind; the split is a convention (`vue-style.md`, Template). The `frontend/ui` choice's docs name the library prefix in play.

## File extension

Every component is a `.vue` single-file component. A component defined in a `.ts` file (render function, functional component) is a deliberate exception and needs a comment saying why.
