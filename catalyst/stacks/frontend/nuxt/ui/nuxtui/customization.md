# Nuxt UI Customization

**Layer:** Frontend / UI
**Tool:** Nuxt UI 4 · Tailwind CSS 4 · Tailwind Variants

How a project on this module changes what a Nuxt UI component looks like. Component APIs (props, slots, events) are the library's own documentation — reach for the Nuxt UI MCP server; this document owns only the shape the project keeps its overrides in.

Paths below are written `<srcDir>/…` — Nuxt's default is `app/`, and a project on another substitutes its own. The placeholder is deliberate: a concrete default in a template-owned file invites a project to edit this document to make it true, which is a merge conflict on its next upgrade.

## The layout

Three files, and a component's theme touches all three:

| Path                                | Holds                                                                                     |
| ----------------------------------- | ----------------------------------------------------------------------------------------- |
| `<srcDir>/config/nuxt-ui/<name>.ts` | One component's theme object — `slots`, `variants`, `compoundVariants`, `defaultVariants` |
| `<srcDir>/app.config.ts`            | The `ui` block: the colour aliases, and one key per imported component                    |
| `<srcDir>/types/nuxt-ui.d.ts`       | One exported `TVConfig` type per component, so the config file is type-checked            |

A component's theme is only ever customized here. A one-off `:ui` prop at a call site is a local exception (see Avoid By Default) — the global config is the default home.

## Vendored defaults, not deltas

A config file holds the component's **complete upstream default theme**, then the project's edits on top — not only the lines that differ. Nuxt UI would merge a partial override natively, so this is a deliberate trade: the whole surface a change lands on is in front of the reviewer, at the cost of pinning that component to a snapshot of the version it was imported from.

**The config extends the upstream theme; it does not replace it.** Every component resolves its theme as `tv({ extend: tv(theme), … })` (`Button.vue`, verified on `@nuxt/ui` 4.4.0), so a class the vendored copy omits is still contributed by the default — **deleting a class from the config removes nothing.** A deviation is a class that _out-ranks_ the default by winning its tailwind-merge group, which is why an override often has to state a value the design never changed: `font-bold` next to upstream's `font-medium`, `min-h-0` against upstream's `min-h-[calc(…)]`. A shorthand is displaced only by another class in the same property group, so `flex-1` is not removed by `flex-none` on a different axis.

That narrows what vendoring buys. "Every class is greppable" means greppable for **what the project decided**, not for the complete set that applies at runtime — the effective classes are the union of the default and the config, resolved by tailwind-merge. To remove an upstream class outright, out-rank it; there is no deletion.

The cost is real and has to be paid deliberately: **upstream theme changes do not reach a vendored component.** When `@nuxt/ui` takes a minor or major bump, re-import the components whose defaults moved and re-apply the project's edits on top — the annotations below are what makes that a mechanical diff rather than an archaeology exercise. A bump that skips this leaves the app on stale defaults silently.

**Tailwind class sorting is off inside the config directory**, and on everywhere else. Sorting rewrites a class string into canonical order, which is the right default for the project's own markup and would destroy the property that makes vendoring work here: an imported config is only a diffable snapshot of upstream while its class strings are byte-identical to upstream's. The exemption is an `overrides` entry in `.oxfmtrc.json`, written by the scaffolder at spawn — the config directory is the only place in the repo where unsorted classes are correct.

The override is a **guard, not a live correction**: while `functions` is empty, sorting reaches markup attributes only and never touches a class string in a plain `.ts` object, so a sorting-enabled copy of a vendored config comes out byte-identical either way (verified on oxfmt). Keep it anyway — the day `functions` names a helper the configs use, it is the only thing standing between the vendored snapshots and a silent reflow.

A component is imported when the project first renders it, not when it first needs a change — the config directory is meant to mirror the component surface in use. Importing is the `/import-nuxt-ui-component` skill's job (Importing A Component, below); it also refuses to overwrite an existing config, so a re-import is a deliberate act.

## Importing A Component

The import lands a component's **complete, unmodified upstream defaults** — no customization in the same step. Changes come afterwards, each one annotated, so the diff that introduces them shows only what the project actually decided.

1. **Stop if the config already exists.** An existing `<srcDir>/config/nuxt-ui/<name>.ts` carries the project's own customizations, and importing over it silently discards them. Continue only when the user asks for a re-import (an `@nuxt/ui` bump) — and then keep the annotated edits and re-apply them on top of the fresh defaults.
2. **Fetch the defaults from the MCP server**: read the component's `#theme` section and take the _inner_ theme object only — `slots`, `variants`, `compoundVariants`, `defaultVariants` — not the `export default defineAppConfig({ ui: { … } })` wrapper the docs show it inside.
3. **Land it per the Wiring rules below**: the config file verbatim from upstream, the type entry, the `app.config.ts` import and key. The header carries the `@nuxt/ui` version the defaults came from, and `no deviations yet` until the first edit lands.
4. **Verify**: the key matches the name Nuxt UI itself uses (a mismatch fails silently at runtime, not at build), and the project typechecks.

## Never overwrite a default

The point of vendoring is that a reader can tell what the project changed and what it used to be, without fetching upstream. Every deviation is annotated, using the markers and the `Default:` / `Changes:` forms in [`code-annotations.md`](../../../../../conventions/code-annotations.md) — that document is the single source of truth for the shapes; this one only says they are mandatory here.

Three deviations cover nearly everything:

- **Adding or out-ranking classes on a slot** — the `// * Changes:` / `// * Default:` pair, with the upstream string on the `Default` line. An array in a config is upstream's own tailwind-variants form carried through, not an annotation shape: `code-annotations.md` is the single source for those, and it defines no array form.
- **Changing a prop default** — the original goes on the same line as a `// * Default:` note.
- **Adding a variant** — mark it, since nothing upstream will explain why it exists.

An un-annotated line in a config file is read as an upstream default, so an unmarked edit is worse than no vendoring at all.

**Every config's header records the `@nuxt/ui` version it was imported at.** A bump is then triaged file by file — which components' defaults actually moved — instead of re-importing the whole directory on faith. Write "no deviations yet" out in full where that is the state, so a config nobody has needed to change is distinguishable from one nobody has looked at. `/import-nuxt-ui-component` writes the line.

## Wiring rules

- **File names are kebab-case** (`dropdown-menu.ts`), the `app.config.ts` key is the component's camelCase name (`dropdownMenu`). They must match the key Nuxt UI itself uses, or the override silently does nothing.
- **`app.config.ts` imports by relative path**, never the `@/` or `~/` alias — the file is loaded before the alias map exists, and an aliased import there fails the build.
- `switch` is a reserved word: import it as `switchConfig` and register it as `switch: switchConfig`.
- Imports and keys stay alphabetical; the list is long and only stays reviewable if it is ordered.
- Every config file ends with `satisfies <Name>Config` against its type from `<srcDir>/types/nuxt-ui.d.ts` (`export type <Name>Config = TVConfig<typeof theme>['<camelCaseName>'];`, created with its `#build/ui` and `#ui/types` imports on the first import). Without it a typo in a slot name is silently ignored at runtime.

## Colour comes from the aliases

Components take colour by semantic alias (`color="primary"`, `color="error"`), never a Tailwind palette name and never a hex value. The aliases are mapped once in `app.config.ts`'s `ui.colors`, over the ramps the project defines with `@theme` in its stylesheet — that mapping and the ramps behind it are the design system's ([`../../../_common/design-system.md`](../../../_common/design-system.md)), not this document's.

A component config that names a raw colour (`bg-purple-500`) is a missing alias, the same way a literal hex in a scoped style is a missing token.

## When the theme cannot express it

A theme config sets classes. It cannot change what a component renders, or when — so behaviour a design asks for that the component's own markup forbids has one supported route: a **same-named component in the app's shared-primitives directory** (`components/_shared/`), which shadows the library's and keeps every call site an ordinary `<u-form-field>`. It stays a thin wrapper around the real component, imported by path (`@nuxt/ui/components/<Name>.vue`), forwarding `$attrs` and every slot.

- **No `priority` or other config is needed.** Nuxt scans the app's component directories before any that resolve inside `node_modules`, and the first scan of a name wins unless a later one declares a strictly higher priority — which a module's directory does not. The app file wins on ordering alone.
- **The shadow is the whole mechanism**: renaming the file un-shadows it and silently restores the stock component everywhere. The file says so, at the top.
- **Adding the file mid-session is not enough to see it work.** Vite keeps the transformed output of every component that already resolved the library's version, so existing call sites go on importing it until Nuxt restarts. Check the module the dev server actually serves (`curl .../_nuxt/@fs/<path to a caller>.vue | grep <Name>`) before concluding the shadow failed — and note that `.nuxt/components.d.ts` points at the app file either way, so the type stub proves nothing.
- The bar is the same as for any wrapper (`nuxtui.md`, Avoid By Default): real behaviour the library does not offer, not consistency for its own sake — a field that must keep its cleared error on screen for exactly the length of an exit animation the library would otherwise cut short is the shape of a justified shadow.
- **The classes still belong to the config file.** A wrapper that reaches past the theme to style something is the deep-selector mistake in another costume: what it adds is _when_, not _what_. Classes it applies transiently are named in the component's config beside the ones the theme applies always, and imported from there, so a restyle finds both halves in the place it already looks. Write each class out in full there: Tailwind generates a utility only for a candidate it can read literally, so a class assembled from parts silently has no CSS behind it.

Two bounds on this section, one on each side:

- **A repeated multi-property composite with a name in the design** — a `panel`, a `plate` — is one `@utility` in the stylesheet, declared once and used by name. Never a class string copied into each component's config, and never hidden in a scoped block: the design names it, so the stylesheet names it too.
- **A property that cannot be local at all** goes in the stylesheet with a comment saying why it could not be a config — scrollbar styling, or a reduced-motion override on the `data-state` classes a vendored theme generates. The comment is what stops the next reader moving it back.

The deep-selector ban is about the **themed** library. A third-party widget with no theme surface at all — an SVG charting library, say — leaves `:deep()` inside a scoped block as the sanctioned exception, with the reason in a comment. There is no supported surface to prefer in that case, which is exactly what makes it different from reaching into Nuxt UI's internals.

## Every dialog carries a description

A dialog's accessible description is not optional under the hood. reka-ui points `DialogContent`'s `aria-describedby` at a description element **whether or not one renders**, then warns in development when nothing answers it — `Warning: Missing \`Description\` or \`aria-describedby="undefined"\` for DialogContent` (`Dialog/utils.ts`, verified on reka-ui 2.7.0). Nuxt UI renders that element only when a `description` prop or slot is given (`Modal.vue`, `@nuxt/ui` 4.4.0). A dialog opened without one is therefore pointing assistive technology at an id that does not exist, and saying so in the console every time it opens.

So: **every `UModal` and `USlideover` passes a `description`.** It is a sentence about what the dialog is for, not a restatement of its title.

Where the body already explains itself and the description would be visual noise, hide it from sight rather than dropping it — and hide it in the **vendored `modal` / `slideover` config**, not with a `:ui` prop at each call site. Hiding the description is a decision about every dialog in the app, which is exactly the global-change test above: a rule that would otherwise be repeated at nine call sites belongs in the config once.

## Avoid By Default

- **Using a component without importing its config.** Every Nuxt UI component the project renders has a config file, whether or not it is customized yet — the set of files is the inventory of what the project actually uses, and a component with nowhere to put an override invites a one-off `:ui` prop instead. Components with no theme section at all (`App`, `ColorModeButton`) are the exception: there is nothing to configure, and `ColorModeButton` takes `Button`'s theme.
- **A `:ui` prop where a global change belongs.** If the same override appears at a second call site, it was a theme change; move it. The prop is for the genuinely one-off case — and **a component rendered at exactly one call site has no one-off case**, which is the next rule.

- **Deep selectors into Nuxt UI internals** (`:deep(.some-generated-class)`). Slot classes, variants, and the `class` prop are the supported surface; a deep override breaks on a patch bump.
- **Editing a config to match a design instead of fixing the token.** If `primary` is wrong everywhere, the alias or the ramp is wrong — not thirty component configs.

### One call site, no theme props

**A component rendered at exactly one place takes nothing at that call site that its theme config can express.** No `:ui` prop, and no `variant`, `color` or `size` — those are `defaultVariants`. With one usage there is no difference between "how this component looks here" and "how this component looks", so the config is the only honest home and the call site stops carrying styling at all.

A general-purpose component used in several places works the other way: usage-specific overrides and variant props stay at each usage, and the config holds only what is true app-wide. The rule is therefore reversible — **when a single-use component gains a second call site, the first usage's overrides move back out of the config**, because they have just become one usage's opinion rather than the component's.

Two things stay at the call site either way: **behavioural props**, which no theme can express, and the call site's own layout `class`, which describes the element's place in _its parent_ rather than the component's appearance. A page root that is a themed library component puts its layout-role classes in the config through the slots, and keeps only its own outer `class` at the usage.

Mind the extends trap while moving classes in (Vendored defaults, not deltas): omitting an upstream class from a slot does not remove it, so a dropped `gap-2` has to become an explicit `gap-0`.
