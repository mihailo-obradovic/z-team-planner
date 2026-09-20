# Design System — Template

**Tier:** Frontend — Common

This is a **template**, not a project convention. At Init Design (or when the design system firms up), instantiate it into a project-owned convention annex indexed by `architecture.md` (per `references/project-documents.md`), replacing every `<placeholder>` with measured, project-specific values. Leave the template file itself pristine. A section whose values are not yet decided stays out of the annex.

The pre-filled values — the semantic token names, the spacing scale, the transition tiers, the icon and elevation defaults — are **house defaults, not settled decisions**: confirm each against the project at instantiation and change what does not fit. Inheriting them silently is the failure mode. The accessibility floors in §14 are the exception — those are standards, not preferences.

One template for both frontend modules, written in the CSS custom property vocabulary every choice shares. Where the instantiated annex's **source of truth** for color lives depends on the `frontend/ui` choice:

| UI choice           | Color source of truth                                                                                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `shadcn`, `primeui` | The global stylesheet: the `@theme` map plus the `:root`/`.dark` token values, exposed as Tailwind utilities                                                                         |
| `headless`          | The global stylesheet's `:root`/`.dark` token definitions                                                                                                                            |
| `vuetify`           | The Vuetify theme file (`../nuxt/ui/vuetify/setup.md`, "the single source"), reachable in CSS as `rgb(var(--v-theme-<name>))`                                                        |
| `nuxtui`            | `@theme` ramps in the global stylesheet, mapped to the seven semantic aliases in `app.config.ts`'s `ui.colors` (`../nuxt/ui/nuxtui/customization.md`, Colour comes from the aliases) |

Under every choice the non-color scales — spacing, z-index, durations, radii — are CSS custom properties in the global stylesheet; the annex documents and constrains all of it. **On a Tailwind stack (`shadcn`, `primeui`, `nuxtui`) every token here is also a utility** — `--color-card` is `bg-card`, `--color-muted-foreground` is `text-muted-foreground`, `--space-4` is `gap-4`/`p-4`, `--radius-md` is `rounded-md`, `--duration-slow` is `duration-slow` — so a component written in utilities and one written in handwritten CSS draw from one scale; the token names it for the CSS, the utility for the markup.

Every property a component sets — size, weight, leading, color, margin, padding, width, height, shadow, radius, border width, opacity — comes from a scale in this document. §13 collects the resulting values per element; the sections before it define the scales those values are drawn from.

---

## 1. Tokens & Color

All color comes from **semantic tokens**. Use the semantic name, never a raw `#hex` or `oklch(...)` in a component (rare true one-offs excepted).

| Token                                                | Role                                                                   |
| ---------------------------------------------------- | ---------------------------------------------------------------------- |
| `--color-background` / `--color-foreground`          | Page base surface and default text                                     |
| `--color-card` / `--color-card-foreground`           | Card surface and its text                                              |
| `--color-popover` / `--color-popover-foreground`     | Floating surfaces (menus, popovers)                                    |
| `--color-primary` / `--color-primary-foreground`     | Primary actions, emphasis                                              |
| `--color-secondary` / `--color-secondary-foreground` | Secondary actions/surfaces                                             |
| `--color-muted` / `--color-muted-foreground`         | Muted surfaces; secondary/caption text                                 |
| `--color-accent` / `--color-accent-foreground`       | Hover/active surface accents                                           |
| `--color-destructive`                                | Errors, destructive actions                                            |
| `--color-border` / `--color-input` / `--color-ring`  | Borders, input borders, focus ring                                     |
| `--color-<domain>` / `--color-<domain>-foreground`   | Domain color-coding (e.g. per-category fills), if the product needs it |

Use as `var(--color-*)` in component styles (e.g. `background: var(--color-card); color: var(--color-card-foreground);`), or the matching utility on a Tailwind stack (`bg-card text-card-foreground`).

**Vuetify:** the color roles map onto theme keys in the plugin file (`primary`, `error`, project-added keys), reachable in CSS as `rgb(var(--v-theme-<name>))`; the annex records the role → key mapping so both vocabularies name the same palette.

### Dark mode

Both themes are defined: `:root` (light) and `.dark` (dark) — under vuetify, the paired `light`/`dark` theme definitions; under nuxtui, the per-mode alias values beside the `@theme` ramps. **Every color must be able to flip** — components reference semantic tokens, so they adapt automatically. The only exception is a fill that is deliberately theme-independent because it is an object in the scene rather than paper — say so in a comment, and keep any text on it legible against that fixed fill.

---

## 2. Typography

| Token            | Font             | Use                                                 |
| ---------------- | ---------------- | --------------------------------------------------- |
| `--font-sans`    | `<body font>`    | Default body font                                   |
| `--font-heading` | `<display font>` | Headings, display numbers (may equal `--font-sans`) |
| `--font-mono`    | `<mono font>`    | Code, technical content                             |

Fonts are self-hosted — `@font-face` in the global stylesheet, or `next/font` on Next.js, which self-hosts the same way — loaded only at the weights the type scale uses. **Verify glyph coverage for every script the product must render** (e.g. Cyrillic, extended Latin) before committing to a font.

### Type scale

Size, weight, and line height are decided together — a size without its leading is half a decision.

| Role        | Mobile   | ≥ md     | Weight  | Line height | Font             |
| ----------- | -------- | -------- | ------- | ----------- | ---------------- |
| **h1**      | `<?rem>` | `<?rem>` | `<?>`   | `<tight>`   | `--font-heading` |
| **h2**      | `<?rem>` | `<?rem>` | `<?>`   | `<tight>`   | `--font-heading` |
| **h3**      | `<?rem>` | `<?rem>` | `<?>`   | `<tight>`   | `--font-heading` |
| **body**    | `<?rem>` | —        | 400     | `<relaxed>` | `--font-sans`    |
| **small**   | `<?rem>` | —        | 400     | `<normal>`  | `--font-sans`    |
| **caption** | `<?rem>` | —        | `<?>`   | `<normal>`  | `--font-sans`    |
| **code**    | `<?rem>` | —        | 400     | `<normal>`  | `--font-mono`    |
| **figure**  | `<?rem>` | `<?rem>` | `<700>` | `<tight>`   | `<see below>`    |

Line height by role: **tight** (`<?>`) for headings and display numbers, **normal** (`<?>`) for UI labels and controls, **relaxed** (`<?>`) for running body text — never leave a heading at body leading.

A **figure** is a number the UI is read for — a stat, a level, a budget, an estimate. It is not the body or label role beside it: it is bold and takes a step of its own, because a number the eye goes to is doing a different job from the words around it. A product with figures at several scales names each step (`figure-sm`, `figure`, `figure-lg`) rather than reaching for the nearest body size. **The family follows the row the figure sits in** — a figure inside a condensed uppercase label stays condensed, while a figure in a stat row of its own takes the body face, whose wider digits compare down a column. Naming the steps is what makes them auditable; an unnamed figure size cannot be checked against anything.

Weights come from this table only, and only weights the font is actually loaded at. Emphasis inside body text is a weight step (`<500/600>`), never a size change. Pick heading levels by document hierarchy (one `h1` per page), not by desired size.

---

## 3. Spacing

`gap`, `padding`, and `margin` use values from an explicit allowed scale of `--space-*` tokens:

| Token               | Pixels    | Primary use                         |
| ------------------- | --------- | ----------------------------------- |
| `--space-0`         | 0         | Reset / collapse spacing            |
| `--space-1`         | 4px       | Icon-to-text inline spacing         |
| `--space-2`         | 8px       | Compact internal spacing            |
| `--space-3`         | 12px      | Between related items in a group    |
| `--space-4`         | 16px      | Standard spacing (most common)      |
| `--space-6`         | 24px      | Between groups of related items     |
| `--space-8`         | 32px      | Between sections within a container |
| `--space-12`        | 48px      | Between major content sections      |
| `<--space-16/20/…>` | `<64px+>` | Page-level blocks and hero rhythm   |

Avoid off-scale raw values (`gap: 20px`, `padding: 47px`, …); migrate stragglers to the nearest allowed token. Responsive overrides are fine when both base and override come from the scale.

**Gap categories:** inline (`--space-1`) · tight (`--space-2`) · compact (`--space-3`) · standard (`--space-4`, use when unsure) · comfortable (`--space-6`) · spacious (`--space-8`) · section (`--space-12`) · page (`<--space-16+>`).

Use `flex`/`grid` with `gap` on the container. **Padding is a component's own business; margin is its parent's** — prefer container `gap` over margins on children, and never set a margin on a component's outermost element to position it in a layout it does not own. Per-element padding values are in §13.

---

## 4. Sizing

### Control heights

One height scale for every interactive control (button, input, select trigger, icon button), so a row of mixed controls aligns without per-case fixes. These are the values §14.2 measures its touch-target floors against.

| Token                 | Height  | Standalone use                      |
| --------------------- | ------- | ----------------------------------- |
| `--control-h-sm`      | `<?px>` | `<inline / dense toolbars>`         |
| `--control-h-default` | `<?px>` | `<inline forms, secondary actions>` |
| `--control-h-lg`      | `<?px>` | `<desktop CTAs>`                    |

An icon button is square at its size (`width` = `height` = the control height), not a padded rectangle. Under `vuetify`, the `size`/`density` props resolve to these same heights; the annex records which prop values map to which tier.

### Widths

| Token           | Value            | Use                                                                        |
| --------------- | ---------------- | -------------------------------------------------------------------------- |
| Page container  | `<?px>`          | Outer page wrapper, centered `margin-inline: auto` with §13's page padding |
| Content measure | `<?ch, ≈65ch>`   | Running text — long lines are a readability bug                            |
| Dialog          | `<?px>` per size | Modal/sheet widths                                                         |
| Sidebar         | `<?px>`          | Fixed navigation rail                                                      |
| Form field      | full width       | Fields fill their container; never a fixed px width                        |

### Heights

Avoid fixed heights on anything holding content — use `min-height` and let content set the box. Fixed heights are for controls (above), media boxes (aspect ratio, §10), and skeletons that must match the content they stand in for.

**Viewport height is not this document's to give.** A page's height comes from the chain the shell establishes (`../nuxt/page-layout.md`; the Next.js sibling is not written yet), which has already subtracted the header and the footer — so nothing here, and nothing in a page, restates it with `100vh`, `100dvh`, or a `calc()` over a header token. The one exception is a surface rendered outside the layout entirely, such as a pre-mount splash or a standalone error page: it has no chain to inherit and sizes itself with `100dvh`, never `100vh`, so mobile browser chrome does not clip it.

---

## 5. Borders & Radius

### Radius

Radii derive from a single `--radius` token (`<0.5–0.75rem>`); the derived steps (`--radius-sm` … `--radius-xl`) are computed from it. Prefer scale values over arbitrary radii. Per-element radii are in §13; nested elements step **down** one level from their container, never up.

### Border width

| Width    | Use                                                             |
| -------- | --------------------------------------------------------------- |
| 1px      | Default — cards, inputs, dividers, table rules                  |
| `<2px>`  | Deliberate emphasis — selected state, active tab marker         |
| `<4px+>` | Decorative only, never a state a user must distinguish by width |

Separation is a border or a shadow, not both. Focus is a `:focus-visible` ring drawn from `--color-ring` at `<2px>` with `<2px offset>` — `outline: none` is only ever allowed alongside a replacement ring (§14). On the headless choice this is load-bearing: no library supplies a focus style, so a control without the ring is a keyboard dead spot.

**Scroll edges.** A region that scrolls carries a 1px rule on each edge where content is currently hidden — the rule, its per-edge arithmetic and its contrast floor are in `../_common/scroll-affordance.md`. A scrolling element must not also carry a structural border, which usually means a bordered surface becomes a static shell with the scroll region and its padding inside it. The update mechanics follow the framework:

- **Vue:** one component owns the scrolling — `useResizeObserver` over **both** the container and its content, plus a passive `scroll` listener, toggling classes through a reactive ref. Vue's reactivity confines the update to that component, so no scheduling wrapper is needed.
- **React:** the per-scroll update is the hazard — setting state on every `scroll` event re-renders the subtree at scroll frequency, so the update goes through `startTransition` (`../_react/rules/rerender-transitions.md`), or writes the class imperatively through a ref and skips render entirely. Where many regions share one page, attach the listener once and fan out rather than per component (`../_react/rules/client-event-listeners.md`).

---

## 6. Elevation

One shadow per surface role; shadows say "this floats above", nothing else.

| Role               | Shadow          | Notes                                               |
| ------------------ | --------------- | --------------------------------------------------- |
| Page / section     | none            | Borders and surface color carry separation          |
| Card               | `<--shadow-sm>` | Raise on hover only if the card is itself a control |
| Dropdown / popover | `<--shadow-md>` | Paired with the popover surface token               |
| Dialog / modal     | `<--shadow-lg>` | Plus a scrim (§7)                                   |
| Toast              | `<--shadow-lg>` |                                                     |

No ad-hoc one-off shadow values. **In dark mode, elevation is surface color, not shadow** — a shadow on a dark ground is invisible, so a raised surface gets a lighter `card`/`popover` value instead.

---

## 7. Opacity

| Value     | Use                                                                                                      |
| --------- | -------------------------------------------------------------------------------------------------------- |
| `0` / `1` | Enter and exit transitions (§11)                                                                         |
| `<0.5>`   | Disabled controls, via `:disabled` — always with the control inert                                       |
| `<?>`     | De-emphasis — an item that is not the selected one and is still fully interactive                        |
| `<?>`     | Decorative overlays, watermarks, placeholder imagery                                                     |
| `<scrim>` | Scrims — a token with alpha (`color-mix(in srgb, var(--color-background) 80%, transparent)`), not a gray |

The de-emphasis step is **distinct from the disabled step, on purpose**: a control the user can still press must not read as one they cannot. Two steps, two meanings — reusing the disabled value for de-emphasis tells the user the control is dead.

**Never dim text with opacity to make it secondary** — use `--color-muted-foreground`, whose contrast is measured (§14.1). Opacity on text produces an unmeasurable effective color that changes with whatever sits behind it. Disabled controls are exempt from the contrast minimums but must still be identifiable without color alone.

---

## 8. Z-index

Stacking is a named scale, and every layer is on it:

| Token          | Value | Layer                                  |
| -------------- | ----- | -------------------------------------- |
| `--z-base`     | `0`   | In-flow content                        |
| `--z-raised`   | `1`   | Lifted within its own card             |
| `--z-dropdown` | `10`  | Menus, comboboxes, tooltips            |
| `--z-sticky`   | `20`  | Sticky headers, toolbars               |
| `--z-overlay`  | `30`  | Modal scrim                            |
| `--z-modal`    | `40`  | Dialogs, sheets                        |
| `--z-popover`  | `50`  | Floating layers raised _from_ a dialog |
| `--z-toast`    | `60`  | Toasts — always on top                 |

`--z-raised` is the one step that is not a layer of the page: it orders two things inside one card, where a positioned control would otherwise fall under a sibling that paints later — an image dimmed with `opacity` makes its own stacking context and does exactly that. Without the step the honest options are a raw literal or a dropdown token used for something that is not a dropdown.

No raw z-index literals and no `9999`. A new layer is **added to the scale** with its own name, never wedged between two existing values. Teleported or portalled content (`<Teleport to="body">`, React portals, Vuetify overlays) obeys the same scale; if two layers fight, the fix is the scale, not a local bump.

---

## 9. Iconography

**One icon set for the whole product** — mixing sets is visible immediately in stroke weight and optical size. The UI choice in use names its own set and how that set binds (**shadcn**: `lucide-react`, `../nextjs/ui/shadcn/vendoring.md`; **vuetify**: `@mdi/js` SVG paths, `../nuxt/ui/vuetify/setup.md`; **nuxtui**: Lucide, bundled locally from `@iconify-json/lucide`, `../nuxt/ui/nuxtui/nuxtui.md`, Icons); a choice that names none leaves the set entirely to the project, chosen and recorded at instantiation — **headless** ships no icon tooling at all, so the package, the wiring, and the choice are the project's. A default is a default: swapping the set is a project decision, not a rule change. Either way the package is a Dependency Change.

- **Sizes:** `<16 / 20 / 24>` px only, keyed to the adjacent text role — 16 with `small`, 20 with `body`, 24 standalone. Icon-only buttons keep the control height from §4.
- **Color:** `currentColor` (inherit from the text color). Never a hardcoded fill.
- **Semantics:** decorative icons get `aria-hidden="true"`; an icon that _is_ the control's label needs an accessible name on the control (the style audit checks both).
- **Import from the package root** on a Node stack — `../../_lang/typescript/rules/bundle-barrel-imports.md` owns the barrel handling.
- **Brand marks are the one exception** to the single-set rule: vendor logos have no house stroke weight to match, so a dedicated logo set beside the UI set breaks nothing the rule exists to protect. Scope it to logos — anything that is a UI icon comes from the one set. Needed only when the chosen set carries no marks of its own.

---

## 10. Imagery

The image component follows the module. **Next.js:** `next/image` always, never a bare `<img>` — it enforces intrinsic sizing and prevents layout shift, and its loader is constrained under the client-rendered baseline (`../nextjs/nextjs.md`, Static Export Constraints). **Nuxt:** plain `<img>` unless the `image` addon is adopted (`../nuxt/addons/image.md`), which makes `NuxtImg` the component and keeps every rule below. Either way every image ships either explicit `width`/`height` attributes or a sized box, so nothing reflows when it loads.

- **Aspect ratio, not height:** media boxes use `aspect-ratio` from a small named set (`<16/9 · 4/3 · 1/1>`) with `object-fit: cover`, so the box is stable before the image loads.
- **Radius** comes from §5, matching the container it sits in; edge-to-edge media inside a card keeps the card's radius via `overflow: hidden`.
- **Placeholder:** a `--color-muted` block at the same aspect ratio while loading — the skeleton occupies the final geometry, so nothing reflows.
- **Alt text is required.** Describe the content; `alt=""` only for imagery that is purely decorative and already `aria-hidden` in effect.

---

## 11. Transitions

| Token                 | Use                                                                      |
| --------------------- | ------------------------------------------------------------------------ |
| `--duration-baseline` | **Baseline.** Hover, color, opacity, small movements, micro-interactions |
| `--duration-slow`     | Larger content shifts: accordion, panel slides, layout changes           |
| `--duration-slowest`  | Dramatic reveals (sparingly)                                             |

Start at the baseline; step up only when the element's size/complexity justifies it. Vue `<Transition>` classes and Tailwind `duration-*` utilities draw their durations from the same tokens — a duration hardcoded in a transition class has bypassed the scale.

- **Easing:** `ease-in-out` default; `ease-out` for enter, `ease-in` for exit. Custom cubic-bezier only for signature animations — document why in a comment.
- **Properties:** prefer specific `transition: color/opacity/transform` lists over `transition: all`.
- **Reduced motion:** any animation longer than the baseline, or any transform-based motion, must short-circuit under `prefers-reduced-motion: reduce` (see §14.4).

---

## 12. User-select & pointer-events

Apply `user-select: none` to decorative elements, interactive controls, animated counters, and drag handles — **never** to body text, headings, code blocks, form labels, or meaningful links. Use `pointer-events: none` on overlay/decoration layers sitting above interactive content so they don't block clicks beneath.

---

## 13. Element & layout specs

The scales above, resolved per element. This table is what a component is checked against; a value that is not here is not a decision yet.

| Element                | Height / size    | Padding       | Radius         | Border       | Shadow     |
| ---------------------- | ---------------- | ------------- | -------------- | ------------ | ---------- |
| Button (sm/default/lg) | §4 heights       | `<--space-?>` | `<--radius-?>` | `<none/1px>` | none       |
| Icon button            | square, §4       | `<--space-?>` | `<--radius-?>` | `<none/1px>` | none       |
| Input / select         | §4 default       | `<--space-?>` | `<--radius-?>` | 1px          | none       |
| Textarea               | `min-height <?>` | `<--space-?>` | `<--radius-?>` | 1px          | none       |
| Card                   | auto             | `<--space-?>` | `<--radius-?>` | 1px          | §6 card    |
| Dialog / sheet         | §4 widths        | `<--space-?>` | `<--radius-?>` | `<none>`     | §6 dialog  |
| Dropdown / popover     | auto             | `<--space-?>` | `<--radius-?>` | 1px          | §6 popover |
| Toast                  | auto             | `<--space-?>` | `<--radius-?>` | 1px          | §6 toast   |
| Badge / chip           | `<?px>`          | `<--space-?>` | `<--radius-?>` | `<none>`     | none       |
| Table row              | `<?px>`          | `<--space-?>` | —              | 1px bottom   | none       |

**Layouts:**

| Layout         | Spec                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------- |
| Page container | §4 max width, centered, `<--space-4 / md: --space-6 / lg: --space-8>` inline padding        |
| Page rhythm    | `<--space-12/16>` between major sections, `<--space-?>` at the page's top and bottom        |
| Section        | `<--space-6/8>` between groups inside it                                                    |
| Form           | `--space-4` between fields, `--space-2` between a label, its control, and its error message |
| Card grid      | `<--space-4/6>` gap, one column → `<sm: 2, lg: 3>`                                          |
| Sidebar + main | §4 sidebar width, main fills the rest; collapses below `<md>`                               |

---

## 14. Accessibility Constraints

Token-level accessibility — the parts that live in colors, sizes, and breakpoints. Behavioral accessibility (keyboard, named controls, ARIA, focus) is a review concern (`../_vue/style-audit.md`, `../_react/style-audit.md`), not a token concern.

### 14.1 Color contrast

WCAG AA targets: body text **4.5:1**; large text (18pt+ / 14pt+ bold) and non-text UI **3:1**. **Measure the ratios from the actual token values** — never estimate — and record the worst case across both themes:

| Foreground                   | On background                          | Worst     | Passes  |
| ---------------------------- | -------------------------------------- | --------- | ------- |
| `--color-foreground`         | `--color-background` / `--color-card`  | `<ratio>` | `<AA?>` |
| `--color-muted-foreground`   | `--color-background` / `--color-muted` | `<ratio>` | `<AA?>` |
| `--color-destructive`        | `--color-background` / `--color-card`  | `<ratio>` | `<AA?>` |
| `--color-primary-foreground` | `--color-primary`                      | `<ratio>` | `<AA?>` |

Re-measure after any token change. If a brand color fails as text (bright fills often do), constrain it to a fill-only role and document that here. Keep meaning off color alone.

### 14.2 Touch-target size

WCAG 2.5.8 (AA) floor: **24×24** CSS px for any standalone interactive element; **44×44** recommended for primary CTAs on touch surfaces. The control heights in §4 must clear the floor — where a visual control is smaller, pad the hit area rather than shrinking the target. Inline links inside paragraphs are exempt (paragraph line-height).

### 14.3 Breakpoints & reflow

Breakpoints: `<sm 640 · md 768 · lg 1024 · xl 1280>` px house defaults unless the project overrides them; the annex records the chosen set, and every media query uses it. **Reflow (WCAG 1.4.10):** usable without horizontal scrolling at **320px** — mobile-first base styles must work there, no hardcoded widths above 320px on outer wrappers, and tables/code blocks/long strings need `overflow-x: auto` / `overflow-wrap: break-word`.

### 14.4 Motion & reduced motion

Guard transform-based or longer-than-baseline animation with a CSS `@media (prefers-reduced-motion: reduce)` rule or a `useMediaQuery` / `window.matchMedia` check rendering a static fallback. Purely decorative color/opacity fades at the baseline duration don't need the guard.

---

## 15. Token reach

Tokens are defined in the global stylesheet on `:root` (and `.dark`), never inside a component's scoped styles or CSS module — a scoped block cannot define tokens for other components. Teleported or portalled content (`<Teleport to="body">`, React portals, Vuetify overlays) renders outside the app subtree, so tokens hung on an app wrapper element instead of `:root` never reach it — a dialog that loses its theme is almost always this. Under `vuetify`, `'vuetify/styles'` precedes the project stylesheet in `css:` so project overrides win (`../nuxt/ui/vuetify/setup.md`).

**Tailwind v4 declares tokens but does not emit them.** `@theme inline` compiles utilities to the underlying `var(--primary)`, not `var(--color-primary)`, and theme variables no rule references by name are **tree-shaken out of the production build** — dev and production tree-shake differently, so a dev-server check is not evidence. Before relying on any `var(--color-*)` in handwritten CSS, verify the token against the **production** build: build, then grep the emitted CSS for the token name. A name that does not resolve silently renders its fallback (or nothing), which is a bug, not a design choice.
