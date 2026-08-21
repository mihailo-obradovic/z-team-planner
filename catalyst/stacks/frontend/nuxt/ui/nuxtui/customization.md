# Nuxt UI Customization

**Layer:** Frontend / UI
**Tool:** Nuxt UI 4 · Tailwind CSS 4 · Tailwind Variants

How a project on this module changes what a Nuxt UI component looks like. Component APIs (props, slots, events) are the library's own documentation — reach for the Nuxt UI MCP server; this document owns only the shape the project keeps its overrides in.

Paths below use Nuxt's default `app/` srcDir; a project with a different srcDir substitutes its own throughout.

## The layout

Three files, and a component's theme touches all three:

| Path                           | Holds                                                                                     |
| ------------------------------ | ----------------------------------------------------------------------------------------- |
| `app/config/nuxt-ui/<name>.ts` | One component's theme object — `slots`, `variants`, `compoundVariants`, `defaultVariants` |
| `app/app.config.ts`            | The `ui` block: the colour aliases, and one key per imported component                    |
| `app/types/nuxt-ui.d.ts`       | One exported `TVConfig` type per component, so the config file is type-checked            |

A component's theme is only ever customized here. A one-off `:ui` prop at a call site is a local exception (see Avoid By Default) — the global config is the default home.

## Vendored defaults, not deltas

A config file holds the component's **complete upstream default theme**, then the project's edits on top — not only the lines that differ. Nuxt UI would merge a partial override natively, so this is a deliberate trade: every class the component resolves is greppable in the repo and a reviewer sees the whole surface a change lands on, at the cost of pinning that component to a snapshot of the version it was imported from.

The cost is real and has to be paid deliberately: **upstream theme changes do not reach a vendored component.** When `@nuxt/ui` takes a minor or major bump, re-import the components whose defaults moved and re-apply the project's edits on top — the annotations below are what makes that a mechanical diff rather than an archaeology exercise. A bump that skips this leaves the app on stale defaults silently.

**Tailwind class sorting is off inside the config directory**, and on everywhere else. Sorting rewrites a class string into canonical order, which is the right default for the project's own markup and destroys the property that makes vendoring work here: an imported config is only a diffable snapshot of upstream while its class strings are byte-identical to upstream's. The exemption is an `overrides` entry in `.oxfmtrc.json`, written by the scaffolder at spawn — the config directory is the only place in the repo where unsorted classes are correct.

A component is imported when the project first renders it, not when it first needs a change — the config directory is meant to mirror the component surface in use. Importing is the `/import-nuxt-ui-component` skill's job (Importing A Component, below); it also refuses to overwrite an existing config, so a re-import is a deliberate act.

## Importing A Component

The import lands a component's **complete, unmodified upstream defaults** — no customization in the same step. Changes come afterwards, each one annotated, so the diff that introduces them shows only what the project actually decided.

1. **Stop if the config already exists.** An existing `app/config/nuxt-ui/<name>.ts` carries the project's own customizations, and importing over it silently discards them. Continue only when the user asks for a re-import (an `@nuxt/ui` bump) — and then keep the annotated edits and re-apply them on top of the fresh defaults.
2. **Fetch the defaults from the MCP server**: read the component's `#theme` section and take the _inner_ theme object only — `slots`, `variants`, `compoundVariants`, `defaultVariants` — not the `export default defineAppConfig({ ui: { … } })` wrapper the docs show it inside.
3. **Land it per the Wiring rules below**: the config file verbatim from upstream, the type entry, the `app.config.ts` import and key.
4. **Verify**: the key matches the name Nuxt UI itself uses (a mismatch fails silently at runtime, not at build), and the project typechecks.

## Never overwrite a default

The point of vendoring is that a reader can tell what the project changed and what it used to be, without fetching upstream. Every deviation is annotated, using the markers and the `Default:` / `Changes:` forms in [`code-annotations.md`](../../../../../conventions/code-annotations.md) — that document is the single source of truth for the shapes; this one only says they are mandatory here.

Three deviations cover nearly everything:

- **Adding classes to a slot** — turn the class string into an array and keep the upstream string as the first element, so the addition reads as an addition.
- **Changing a prop default** — the original goes on the same line as a `// * Default:` note.
- **Adding a variant** — mark it, since nothing upstream will explain why it exists.

An un-annotated line in a config file is read as an upstream default, so an unmarked edit is worse than no vendoring at all.

## Wiring rules

- **File names are kebab-case** (`dropdown-menu.ts`), the `app.config.ts` key is the component's camelCase name (`dropdownMenu`). They must match the key Nuxt UI itself uses, or the override silently does nothing.
- **`app.config.ts` imports by relative path**, never the `@/` or `~/` alias — the file is loaded before the alias map exists, and an aliased import there fails the build.
- `switch` is a reserved word: import it as `switchConfig` and register it as `switch: switchConfig`.
- Imports and keys stay alphabetical; the list is long and only stays reviewable if it is ordered.
- Every config file ends with `satisfies <Name>Config` against its type from `app/types/nuxt-ui.d.ts` (`export type <Name>Config = TVConfig<typeof theme>['<camelCaseName>'];`, created with its `#build/ui` and `#ui/types` imports on the first import). Without it a typo in a slot name is silently ignored at runtime.

## Colour comes from the aliases

Components take colour by semantic alias (`color="primary"`, `color="error"`), never a Tailwind palette name and never a hex value. The aliases are mapped once in `app.config.ts`'s `ui.colors`, over the ramps the project defines with `@theme` in its stylesheet — that mapping and the ramps behind it are the design system's ([`../../design-system.md`](../../design-system.md)), not this document's.

A component config that names a raw colour (`bg-purple-500`) is a missing alias, the same way a literal hex in a scoped style is a missing token.

## When the theme cannot express it

A theme config sets classes. It cannot change what a component renders, or when — so behaviour a design asks for that the component's own markup forbids has one supported route: a **same-named component in the app's shared-primitives directory** (`components/_shared/`), which shadows the library's and keeps every call site an ordinary `<u-form-field>`. It stays a thin wrapper around the real component, imported by path (`@nuxt/ui/components/<Name>.vue`), forwarding `$attrs` and every slot.

- **No `priority` or other config is needed.** Nuxt scans the app's component directories before any that resolve inside `node_modules`, and the first scan of a name wins unless a later one declares a strictly higher priority — which a module's directory does not. The app file wins on ordering alone.
- **The shadow is the whole mechanism**: renaming the file un-shadows it and silently restores the stock component everywhere. The file says so, at the top.
- **Adding the file mid-session is not enough to see it work.** Vite keeps the transformed output of every component that already resolved the library's version, so existing call sites go on importing it until Nuxt restarts. Check the module the dev server actually serves (`curl .../_nuxt/@fs/<path to a caller>.vue | grep <Name>`) before concluding the shadow failed — and note that `.nuxt/components.d.ts` points at the app file either way, so the type stub proves nothing.
- The bar is the same as for any wrapper (`nuxtui.md`, Avoid By Default): real behaviour the library does not offer, not consistency for its own sake — a field that must keep its cleared error on screen for exactly the length of an exit animation the library would otherwise cut short is the shape of a justified shadow.
- **The classes still belong to the config file.** A wrapper that reaches past the theme to style something is the deep-selector mistake in another costume: what it adds is _when_, not _what_. Classes it applies transiently are named in the component's config beside the ones the theme applies always, and imported from there, so a restyle finds both halves in the place it already looks. Write each class out in full there: Tailwind generates a utility only for a candidate it can read literally, so a class assembled from parts silently has no CSS behind it.

## Avoid By Default

- **Using a component without importing its config.** Every Nuxt UI component the project renders has a config file, whether or not it is customized yet — the set of files is the inventory of what the project actually uses, and a component with nowhere to put an override invites a one-off `:ui` prop instead. Components with no theme section at all (`App`, `ColorModeButton`) are the exception: there is nothing to configure, and `ColorModeButton` takes `Button`'s theme.
- **A `:ui` prop where a global change belongs.** If the same override appears at a second call site, it was a theme change; move it. The prop is for the genuinely one-off case.
- **Deep selectors into Nuxt UI internals** (`:deep(.some-generated-class)`). Slot classes, variants, and the `class` prop are the supported surface; a deep override breaks on a patch bump.
- **Editing a config to match a design instead of fixing the token.** If `primary` is wrong everywhere, the alias or the ramp is wrong — not thirty component configs.
