# Design System — z-team-planner

The project's own design system, instantiated from `stacks/frontend/nuxt/design-system.md` (decision 003) and owned by this repository. The template stays pristine; this file is the contract. Where a value here disagrees with the mockups in `context/design-reference.md`, this file wins.

**Loads when:** styling anything, adding or changing a token, picking a size, shadow, or spacing value, or building a new component.

Under `frontend/ui = nuxtui`, the source of truth splits: **colour ramps** are `@theme static` definitions in `app/assets/css/main.css`, mapped to the seven semantic aliases in `app.config.ts`'s `ui.colors`; **surface variables** (`--ui-*`) are remapped in an unlayered `:root` block in the same stylesheet; **every non-colour scale** is a CSS custom property there too. A component never names a ramp or a hex — it names an alias or a token.

Sections 13 (element specs) and 14 (accessibility constraints) are deliberately absent: their values are measured from the built UI and land at the end of decision 003.

---

## 1. Tokens & Color

### Ramps

Seven ramps, one per semantic alias. Names avoid Tailwind's built-ins (`amber`, `teal`, `sky`) so nothing silently shadows a default.

| Alias       | Ramp     | Role                                                            |
| ----------- | -------- | --------------------------------------------------------------- |
| `neutral`   | `paper`  | Every surface and every text colour — cream paper to ink        |
| `primary`   | `ember`  | Primary actions, trained values, the panel edge                 |
| `secondary` | `lagoon` | Chrome (top bar, inactive tabs) and the page ground             |
| `success`   | `moss`   | Met requirements, confirmations                                 |
| `warning`   | `gold`   | Selection, counters, the unsaved-changes state                  |
| `error`     | `brick`  | Destructive actions, failed checks                              |
| `info`      | `signal` | Neutral status (a hero busy or returning), shared-build notices |

```
paper   50 #f0e2bd  100 #ece0c6  200 #e6d6b4  300 #d5c096  400 #cdb98d  500 #8a7c5e
        600 #57503f  700 #464031  800 #352f22  900 #241f14  950 #16130c
ember   50 #fdf3e3  100 #fae3c2  200 #f5cd94  300 #eeb15f  400 #e79a3a  500 #df8a20
        600 #b96a15  700 #b14f2a  800 #8f4f10  900 #6b3a0c  950 #3e1f06
lagoon  50 #eef4f4  100 #d9e8e8  200 #b5d0d2  300 #8fb0b4  400 #4d8288  500 #1d5049
        600 #143e38  700 #0d2b26  800 #202622  900 #171c19  950 #0d100e
moss    50 #eff5f0  100 #dcebde  200 #bcd7c0  300 #8fb896  400 #5d9166  500 #3c6e42
        600 #2f5734  700 #27462b  800 #203823  900 #1a2e1d  950 #0d1a10
gold    50 #fdf9ee  100 #fbf1d4  200 #f6e3a9  300 #f0d383  400 #edc86f  500 #e9be62
        600 #c79a3f  700 #a37a2e  800 #7d5d25  900 #5c441c  950 #33250e
brick   50 #fdf2f0  100 #fadfda  200 #f3bdb2  300 #e79582  400 #d66b53  500 #b3402a
        600 #9c3521  700 #802b1b  800 #672418  900 #521e15  950 #2c0e09
signal  50 #eff6fc  100 #dbeaf8  200 #b9d5f0  300 #8ab8e4  400 #5c9bd6  500 #3d85c8
        600 #2f6ea8  700 #245a8c  800 #1e4a72  900 #1a3d5d  950 #102538
```

**Steps carrying a designed value** — these came from the mockups and are not interpolation; changing one changes the product's look: `paper` 50/100/200/300/400/500/600/900, `ember` 500/600/700/800, `lagoon` 300/500/600/700/800/900, `moss` 500, `gold` 500, `brick` 500/600, `signal` 500/700. Every other step is a filler for completeness — no component may depend on one without promoting it here first.

Two steps deliberately leave their ramp's hue line, and both are intentional: `ember-700` is the rust panel edge, not a darker amber, and is used only by the `panel` utility; `lagoon-800`/`900` leave the teal for the charcoal-green ground the whole app sits on.

**Text-only steps.** `ember-600`, `brick-500` and `signal-500` are the designed fills but fail AA as small text on paper. Small text in those roles uses `ember-800`, `brick-600` and `signal-700` instead. The fills are never changed to compensate.

### Surface variables

Nuxt UI derives its `--ui-*` set from the `neutral` alias, assuming a white page. This project inverts that: the page is dark and every surface is paper. The remap is an unlayered `:root` block in `app/assets/css/main.css` (unlayered so it beats the values Nuxt UI injects into `@layer theme`).

| Variable                | Value       | Reads as                                          |
| ----------------------- | ----------- | ------------------------------------------------- |
| `--ui-bg`               | `paper-100` | Panels, dialogs, dropdowns, inputs — the paper    |
| `--ui-bg-muted`         | `paper-50`  | Highlight bands inside a panel                    |
| `--ui-bg-elevated`      | `paper-300` | Tan: subtle buttons, stepper fill, hover surfaces |
| `--ui-bg-accented`      | `paper-400` | Tan-deep: pressed and active surfaces             |
| `--ui-bg-inverted`      | `gold-500`  | Neutral solids — the header counters              |
| `--ui-text`             | `paper-900` | Ink, the default text colour                      |
| `--ui-text-highlighted` | `paper-900` | Ink — emphasis is weight, not colour              |
| `--ui-text-toned`       | `paper-600` | Ink-soft                                          |
| `--ui-text-muted`       | `paper-600` | Ink-soft — secondary copy, measured, not dimmed   |
| `--ui-text-dimmed`      | `paper-500` | Muted — labels and non-text only, never body copy |
| `--ui-text-inverted`    | `paper-900` | Ink on amber and gold solids                      |
| `--ui-border`           | `paper-500` | Dividers, stat-row rules                          |
| `--ui-border-muted`     | `paper-400` | Quiet separators                                  |
| `--ui-border-accented`  | `paper-900` | Ink: panel borders, input and select rings        |
| `--ui-border-inverted`  | `paper-900` | Ink                                               |
| `--ui-radius`           | `0`         | See §5                                            |

`--ui-text-inverted` resolving to ink is the consequential one: it is right for the amber and gold solids the design leans on, and wrong for `secondary` solids (ink on teal is unreadable), which therefore carry an annotated `text-neutral-100` in their component configs.

The page ground is not a `--ui-*` variable — Nuxt UI paints `body` with `--ui-bg`. The project overrides it in `@layer base`:

```css
@layer base {
  body {
    background-color: var(--color-lagoon-900);
  }
}
```

Elements that sit directly on that ground (tab triggers, section headings) opt into `text-neutral-100` (cream) or `text-secondary-300` (steel); everything else lives on paper and inherits ink.

### Composite surfaces

The mockups' panel anatomy is one treatment used everywhere, so it lives once as a utility rather than as a class string repeated per component:

```css
@utility panel {
  border: 2px solid var(--ui-border-accented);
  box-shadow:
    0 0 0 1px var(--color-ember-700),
    var(--shadow-panel);
}

@utility plate {
  height: var(--control-h-plate);
  background: linear-gradient(
    180deg,
    var(--color-paper-200),
    var(--color-paper-300)
  );
  border-bottom: 2px solid var(--ui-border-accented);
}
```

`panel` is the card, dialog, dropdown and toast surface; `plate` is the titled header band on top of one.

### Dark mode — a recorded exception

The template requires both themes and that every colour can flip. **This project defines one fixed theme and no colour modes** (`ui: { colorMode: false }`), because the design is a single artefact modelled on the game's own interface rather than a neutral document surface; there is no `.dark` block and no `.light` block, and the colour-mode button does not exist. A light theme would be a new decision record, not a toggle. The rule this replaces still binds in one direction: no component may hardcode a colour that assumes the ground is dark — it names an alias, and the alias is what a future theme would change.

---

## 2. Typography

| Token            | Font                                       | Use                              |
| ---------------- | ------------------------------------------ | -------------------------------- |
| `--font-sans`    | `'Barlow', ui-sans-serif, system-ui`       | Body, descriptions, helper copy  |
| `--font-heading` | `'Barlow Condensed', 'Barlow', sans-serif` | Titles, labels, buttons, numbers |

No `--font-mono`: the product renders no code or technical strings, so the role has no value yet and stays out.

Both families are self-hosted by `@nuxt/fonts` (registered by Nuxt UI; configured through the root `fonts:` key in `nuxt.config.ts`, never in `modules`) and served from `/_fonts/`. Weights are loaded only where the scale below uses them — **Barlow 400/500/600/700, Barlow Condensed 600/700/800**; adding a weight to markup without adding it there renders a synthesised face. Glyph coverage is Latin and Latin-Extended; the product is English-only, and a language needing Cyrillic or Greek would need the subset added first.

### Type scale

| Role        | Size             | Weight | Line height | Font      | Treatment           |
| ----------- | ---------------- | ------ | ----------- | --------- | ------------------- |
| **display** | 2.125rem (34px)  | 800    | 1.05        | `heading` | uppercase, `0.04em` |
| **title**   | 1.1875rem (19px) | 800    | 1.15        | `heading` | uppercase, `0.06em` |
| **label**   | 0.8125rem (13px) | 700    | 1.2         | `heading` | uppercase, `0.09em` |
| **body**    | 0.875rem (14px)  | 400    | 1.5         | `sans`    | —                   |
| **small**   | 0.75rem (12px)   | 400    | 1.4         | `sans`    | —                   |
| **tag**     | 0.6875rem (11px) | 700    | 1.3         | `heading` | uppercase, `0.14em` |

Line height by role: **tight** (1.05–1.15) for display and title and for any standalone number, **normal** (1.2–1.4) for labels, tags and controls, **relaxed** (1.5) for running body text.

`display` is the hero name in the detail dialog; `title` is a panel's plate heading and a hero card's name; `label` is every stat name, field label and button; `tag` is the small bordered status chips. Emphasis inside body text is a weight step to 600, never a size change. Heading levels follow document hierarchy — one `h1` per page — and take their look from these roles, not the reverse.

The scale is registered as Tailwind text tokens (`--text-display`, `--text-title`, `--text-label`, `--text-tag`, each with its `--*--line-height`, `--*--font-weight` and `--*--letter-spacing`), so `text-title` carries size, weight and leading together and no component sets the three separately. `body` and `small` are Tailwind's `text-sm` and `text-xs` with `--text-sm--line-height: 1.5` decided here.

---

## 3. Spacing

| Token        | Pixels | Primary use                                         |
| ------------ | ------ | --------------------------------------------------- |
| `--space-0`  | 0      | Reset / collapse                                    |
| `--space-1`  | 4px    | Icon-to-text, stepper-to-value                      |
| `--space-2`  | 8px    | Compact internal spacing — power chip rows          |
| `--space-3`  | 12px   | Hero card padding, portrait-to-stats gap            |
| `--space-4`  | 16px   | Standard spacing; page inline padding on mobile     |
| `--space-6`  | 24px   | Between cards in the roster grid; page padding ≥ md |
| `--space-8`  | 32px   | Between a section heading and its content           |
| `--space-12` | 48px   | Between major sections of a page                    |

Off-scale values (`gap: 20px`, `padding: 22px`) are a defect; the nearest token wins. Responsive overrides are fine when both base and override come from the scale.

**Gap categories:** inline `--space-1` · tight `--space-2` · compact `--space-3` · standard `--space-4` (use when unsure) · comfortable `--space-6` · section `--space-8` · page `--space-12`.

Layout is `flex`/`grid` with `gap` on the container. **Padding is a component's own business; margin is its parent's** — a component never sets a margin on its own outermost element to place itself in a layout it does not own.

---

## 4. Sizing

### Control heights

Four steps, every one clearing the 24px touch floor. A row of mixed controls aligns because they all come from here.

| Token                 | Height | Used by                                                                   |
| --------------------- | ------ | ------------------------------------------------------------------------- |
| `--control-h-xs`      | 24px   | Stat steppers in a hero card, inline reset buttons                        |
| `--control-h-sm`      | 28px   | Power and flight chips                                                    |
| `--control-h-default` | 32px   | Buttons, inputs, selects, dropdown triggers, stepper in the detail dialog |
| `--control-h-lg`      | 44px   | Primary actions on touch layouts, the mobile action bar                   |

`--control-h-plate` (40px) is the titled header band on a panel — a surface, not a control, but sized here so nothing re-measures it.

An icon-only button is **square at its step** (`width` = `height`), never a padded rectangle. The mockups' 30px dialog steppers and 27px chips were snapped to 32 and 28 (decision 003) so the scale stays four values wide.

### Widths

| Thing           | Value                         | Note                                                        |
| --------------- | ----------------------------- | ----------------------------------------------------------- |
| Page container  | full width                    | The roster grid centres itself; there is no fixed page rail |
| Page padding    | `--space-4`, ≥ md `--space-6` | Inline padding on the page frame                            |
| Content measure | 65ch                          | Running prose — descriptions, empty states                  |
| Form field      | fills its container           | Never a fixed px width                                      |

Dialog widths are per-dialog and land in §13 once measured.

### Heights

Nothing holding content takes a fixed height — `min-height` and let content size the box. Fixed heights are for controls, for media boxes with an aspect ratio (§10), and for skeletons standing in for known content.

**Viewport height is not this document's to give.** The page's height comes from the chain in `stacks/frontend/nuxt/page-layout.md`, which has already subtracted the header. Nothing here or in a page restates it: no `100vh`, no `100dvh`, no `calc()` over `--ui-header-height`. This binds Nuxt UI's own themes too — `main`'s upstream `min-h-[calc(100vh-var(--ui-header-height))]` is overridden in its vendored config for exactly this reason.

---

## 5. Borders & Radius

### Radius

`--radius: 0`, and `--ui-radius: 0` with it — every derived step is 0 and every `rounded-*` utility resolves flat. Hard edges are the design, not a default left unset.

Two things do not follow `--ui-radius` and must be overridden explicitly in the component config that uses them: `rounded-full` is a literal in Nuxt UI's themes (the switch track and thumb, the tabs indicator) and becomes `rounded-none`; anything drawn as an SVG circle is geometry, not radius, and stays round where the design shows a disc.

### Border width

| Width | Use                                                                                              |
| ----- | ------------------------------------------------------------------------------------------------ |
| 1px   | Dividers, stat-row rules, the panel's outer edge ring, quiet separators inside a panel           |
| 2px   | Structure and emphasis — panel borders, plate bottoms, input and select rings, tab borders       |
| 3px   | The active tab's inset underline only — a state marker paired with a surface change, never alone |

Separation is a border **or** a shadow, not both — except the `panel` treatment, where the 2px border, the 1px edge ring and the drop shadow are one designed object rather than three decisions.

**Focus** is a `:focus-visible` ring, 2px with a 2px offset, and `outline: none` is only ever allowed alongside a replacement ring. The ring colour is contrast-driven, not brand-driven: **ink (`--ui-border-accented`) on paper surfaces**, and **cream (`paper-100`) on the teal chrome** — amber fails 3:1 against paper and must never be the ring. Components rendering on chrome (the header, inactive tabs) carry the cream override in their config, annotated.

---

## 6. Elevation

| Role               | Treatment            | Notes                                                      |
| ------------------ | -------------------- | ---------------------------------------------------------- |
| Page / section     | none                 | The ground carries separation                              |
| Card / panel       | `panel` (§1)         | Raise nothing on hover unless the card is itself a control |
| Dropdown / popover | `panel`              | Same treatment — a floating panel is still a panel         |
| Dialog / modal     | `panel` + scrim (§7) |                                                            |
| Toast              | `panel`              |                                                            |

One shadow value, `--shadow-panel: 0 10px 24px rgb(0 0 0 / 0.5)`, and no ad-hoc one-offs.

The template's "in dark mode, elevation is surface colour, not shadow" does not apply here and is not a deviation: the surfaces are light and the ground is dark, so a dark shadow under a cream panel reads exactly as intended. It would apply to any surface drawn _on_ the paper, which instead separates with a border.

---

## 7. Opacity

| Value                                                          | Use                                                                |
| -------------------------------------------------------------- | ------------------------------------------------------------------ |
| `0` / `1`                                                      | Enter and exit transitions (§11)                                   |
| `0.4`                                                          | Disabled controls, via `:disabled` — always with the control inert |
| `color-mix(in srgb, var(--color-lagoon-900) 75%, transparent)` | The dialog scrim                                                   |

**Never dim text with opacity to make it secondary** — `--ui-text-muted` is a measured colour; an opacity produces an effective colour that changes with whatever sits behind it. Disabled controls are exempt from the contrast minimums but must stay identifiable without relying on colour alone.

---

## 8. Z-index

| Token          | Value | Layer                                |
| -------------- | ----- | ------------------------------------ |
| `--z-base`     | 0     | In-flow content                      |
| `--z-dropdown` | 10    | Menus, comboboxes, tooltips          |
| `--z-sticky`   | 20    | The top bar, sticky section headings |
| `--z-overlay`  | 30    | Modal scrim                          |
| `--z-modal`    | 40    | Dialogs, the mobile slideover        |
| `--z-popover`  | 50    | Floating layers raised from a dialog |
| `--z-toast`    | 60    | Toasts — always on top               |

No raw literals, and no `9999`. A new layer is **added to this scale** with a name, never wedged between two values. Teleported content (`UModal`, `UDropdownMenu`, `UTooltip`, `UToast` all render to `body`) obeys the same scale; when two layers fight, the scale is what changes.

---

## 9. Iconography

**Lucide, product-wide**, bundled locally from `@iconify-json/lucide` and resolved through `@nuxt/icon` (registered by Nuxt UI). Reaching for an icon outside the collection resolves over the network at runtime instead of failing the build — so it must not happen. A second collection is a Dependency Change and a violation of this section both; the brand-mark carve-out the stack allows is currently unused, and `@iconify-json/simple-icons` was removed as dead weight.

- **Sizes:** 16 / 20 / 24 px only, keyed to the adjacent text role — 16 with `small` and `label`, 20 with `body`, 24 standalone. Icon-only buttons take a control height from §4, and the glyph inside stays on this scale.
- **Colour:** `currentColor`, always. This is why the stat glyphs became icons: the retired `public/stat-icons/*.webp` rasters could not follow a text colour.
- **Semantics:** decorative icons carry `aria-hidden="true"`; an icon that _is_ the control's label needs an accessible name on the control.

**Stat glyphs** — one map, shared by every surface that renders a stat, so the roster and the dialog can never drift:

| Stat        | Icon                      |
| ----------- | ------------------------- |
| `combat`    | `i-lucide-swords`         |
| `intellect` | `i-lucide-graduation-cap` |
| `vigor`     | `i-lucide-heart`          |
| `charisma`  | `i-lucide-message-circle` |
| `mobility`  | `i-lucide-chevrons-right` |

---

## 10. Imagery

**This project uses `NuxtImg` (`@nuxt/image`), not a plain `<img>`** — a deliberate departure from the template's default, recorded here: every image in the product is a bundled hero portrait, and the module's sizing and format handling is what serves them. The rule the default protects still holds: every image ships explicit dimensions or a sized box, so nothing reflows when it loads.

- **Aspect ratio, not height:** portraits are `1/1` in a hero card and `4/3` in a roster strip, with `object-fit: cover` and `object-position: top` on the strips so faces survive the crop.
- **Radius** is 0 like everything else; a portrait's separation is its 2px ink border.
- **Placeholder:** a `--ui-bg-elevated` block at the same aspect ratio while loading, occupying the final geometry.
- **Alt text is required** — the hero's name for a portrait. `alt=""` only for imagery that is decorative and already `aria-hidden` in effect.

There is no decorative background image. The ground is a flat colour and depth comes from the panel treatment; the retired `public/images/background.png` is not to be reintroduced without a new decision.

---

## 11. Transitions

| Token                 | Value | Use                                                       |
| --------------------- | ----- | --------------------------------------------------------- |
| `--duration-baseline` | 150ms | **Baseline** — hover, colour, opacity, micro-interactions |
| `--duration-slow`     | 250ms | Panel slides, the mobile slideover, dialog enter/exit     |
| `--duration-slowest`  | 400ms | Reserved; nothing uses it today                           |

Start at the baseline and step up only when the element's size justifies it. Vue `<Transition>` classes draw from the same tokens — a duration hardcoded in a transition class has bypassed the scale.

- **Easing:** `ease-in-out` default, `ease-out` for enter, `ease-in` for exit. A custom cubic-bezier needs a comment saying why.
- **Properties:** name them (`transition: color, background-color, box-shadow`), never `transition: all`.
- **Reduced motion:** anything longer than the baseline, and anything transform-based, short-circuits under `@media (prefers-reduced-motion: reduce)`. Colour and opacity fades at the baseline do not need the guard.

---

## 12. User-select & pointer-events

`user-select: none` on decorative elements, interactive controls, stat values that sit inside a stepper group, and drag handles — **never** on body text, headings, form labels, hero names, or anything a user might reasonably copy. `pointer-events: none` on any decorative layer drawn above interactive content.

---

## 15. Scoped styles and token reach

Tokens live in `app/assets/css/main.css` on `:root` (and in `@theme` for the ramps and the type scale) — **never inside a `<style scoped>` block**, which cannot define a token for anything but itself.

This matters concretely here: `UModal`, `UDropdownMenu`, `UTooltip` and `UToast` teleport to `body`, outside the app subtree. Tokens hung on an app wrapper element would never reach them — a dialog that loses its palette is almost always that mistake. `:root` is the only correct home.

Component styling is utility-first in the template; a `<style scoped>` block is for what utilities cannot express. When one is needed, its values are `var(--*)` reads from this document, never raw hex or off-scale px. The one sanctioned `:deep()` is into `vue-data-ui`'s radar SVG, which is a third-party chart rather than a Nuxt UI internal; its colours are read from the token variables at runtime rather than hardcoded.
