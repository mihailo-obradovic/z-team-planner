# Component Naming

**Tier:** Frontend — Common

Rules for files under `@/components/`, framework-agnostic — they hold for `.tsx`, `.vue`, or whatever extension the project's framework uses. **PascalCase** for component files; **kebab-case** for multi-word folder segments. This directory is never a spawn choice; it travels automatically with any module whose `**Requires:**` header names `frontend/_common`. Page and route naming (lowercase special files, kebab-case URL segments) belongs to the framework module's docs, and headless-primitive internals to the frontend/ui choice's docs when the project has one. The framework tier adds what is specific to it — how a component resolves to a tag, and where shared primitives live. Only one framework tier travels into a project (`_react/` or `_vue/`), so these rules never link across to the other one.

**In the project:** when the components directory is created (bootstrap, or the first UI feature), its folder `CLAUDE.md`/`AGENTS.md` gets a pointer line to this document (and to the framework tier's style guide) per `references/folder-documents.md` — so these rules are in context wherever components are made, while the rule text stays here, single-sourced and upgradeable. Never restate the rules in the folder document.

## File names

**PascalCase.** Name must describe **visual role or content**, never implementation details.

```ts
✅ Challenge.tsx, HiringProcess.vue, ContactCard.tsx
❌ ChallengeSection.tsx (no Section suffix), OurHiringProcess.vue (no brand prefix), Card.tsx inside contact/ (not self-describing)
```

`Section` is allowed only when it is the noun the component _is_ (`SectionWrapper`, `SectionHeader`) - never as a suffix on a content block.

**Generated files keep their generator's naming.** Where the `frontend/ui` choice vendors components through a CLI that also updates them, the CLI owns those filenames — renaming them breaks the update path, so they are out of scope for this rule and for the style audit. The ui choice's document says which directory that covers and what the convention is there (e.g. shadcn's lowercase `button.tsx` under `@/components/ui/`). Everything hand-written, including primitives added alongside the generated ones, follows the rules here.

## `UI*` prefix

Reserved for **headless primitives**: animation wrappers, layout chrome, visual utilities - components with no domain content.

```
✅ UIAppear.tsx, UISeparator.vue
❌ UIBlogCard.tsx (has domain content - drop the prefix)
```

Where shared primitives live is the framework tier's call - `@/components/ui/` under React, `@/components/_shared/` under Vue/Nuxt. Follow the one the project's stack ships.

## Self-describing basenames - no duplicates across folders

Never reuse a basename in different folders. Each filename must be unambiguous without its folder path.

```ts
✅ contact/ContactCard.tsx, services/ServiceCard.tsx, layout/SiteLogo.vue
❌ contact/Card.tsx + services/Card.tsx, layout/Logo.vue + layout/home/Logo.vue
```

## Folder segment casing

**kebab-case** for multi-word segments inside `@/components/`.

```ts
✅ @/components/og-image/OgImage.tsx, @/components/job-application/JobForm.vue
❌ @/components/ogImage/OgImage.tsx, @/components/jobApplication/JobForm.vue
```
