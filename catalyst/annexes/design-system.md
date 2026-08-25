# Design System — z-team-planner

The project's own design system, instantiated from `stacks/frontend/nuxt/design-system.md` (decision 003) and owned by this repository. The template stays pristine; this file is the contract. Where a value here disagrees with the mockups in `context/design-reference.md`, this file wins.

**Loads when:** styling anything, adding or changing a token, picking a size, shadow, or spacing value, or building a new component.

Under `frontend/ui = nuxtui`, the source of truth splits: **colour ramps** are `@theme static` definitions in `app/assets/css/main.css`, mapped to the seven semantic aliases in `app.config.ts`'s `ui.colors`; **surface variables** (`--ui-*`) are remapped in an unlayered `:root` block in the same stylesheet; **every non-colour scale** is a CSS custom property there too. A component never names a ramp or a hex — it names an alias or a token.

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

**Steps carrying a designed value** — these came from the mockups and are not interpolation; changing one changes the product's look: `paper` 50/100/200/300/400/500/600/900, `ember` 500/600/700/800, `lagoon` 300/400/500/600/700/800/900, `moss` 500, `gold` 500, `brick` 500/600, `signal` 500/700. Every other step is a filler for completeness — no component may depend on one without promoting it here first.

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
    background-color: var(--ui-color-secondary-900);
  }
}
```

Surface values are written through the alias variables Nuxt UI injects (`--ui-color-neutral-100`, `--ui-color-secondary-900`, …) rather than the ramp names directly, so a ramp swapped behind an alias carries every surface with it.

Elements that sit directly on that ground (tab triggers, section headings) opt into `text-neutral-100` (cream) or `text-secondary-300` (steel); everything else lives on paper and inherits ink.

### Composite surfaces

The mockups' panel anatomy is one treatment used everywhere, so it lives once as a utility rather than as a class string repeated per component:

```css
@utility panel {
  border: 2px solid var(--ui-border-accented);
  box-shadow:
    0 0 0 1px var(--ui-color-primary-700),
    var(--shadow-panel);
}

@utility plate {
  height: var(--control-h-plate);
  background: linear-gradient(
    180deg,
    var(--ui-color-neutral-200),
    var(--ui-color-neutral-300)
  );
  border-bottom: 2px solid var(--ui-border-accented);
}
```

`panel` is the card, dialog, dropdown and toast surface; `plate` is the titled header band on top of one.

### Scrollbars

The app scrolls on two grounds, so there are two scrollbars and no third: the dark page ground (`main`, a tabs panel) and paper (a dialog or slideover body, a menu). Both use the standard properties only — `scrollbar-width: thin` plus `scrollbar-color`, no `::-webkit-scrollbar`. The consequence is accepted rather than worked around: Chromium rounds a `thin` thumb and the standard property cannot square it, so this is the one place `--ui-radius: 0` does not hold, and there is no hover state.

| Ground | Thumb        | Track        | Applied by          |
| ------ | ------------ | ------------ | ------------------- |
| Page   | `lagoon-300` | `lagoon-950` | `:root`, inherited  |
| Paper  | `paper-600`  | `paper-200`  | the `panel` utility |

```css
:root {
  --scrollbar-ground: var(--ui-color-secondary-300)
    var(--ui-color-secondary-950);
  --scrollbar-paper: var(--ui-color-neutral-600) var(--ui-color-neutral-200);
}

@utility scroll-paper {
  scrollbar-color: var(--scrollbar-paper);
}
```

Two mechanics decide where each is declared. `scrollbar-color` **inherits**, so the page value is set once on `:root` and the paper value once on `panel` — every paper scroll region inside a dialog, slideover, dropdown or card is covered without naming it. A paper surface that is **not** a panel does not inherit it and must name `scroll-paper`; today that is the select menu's content and the mobile slideover's body, both annotated in their configs. `scrollbar-width` does **not** inherit — it applies to whichever element actually scrolls — so it is declared once universally in `@layer base` rather than chased per component.

The thumb is `paper-600` (ink-soft) rather than the muted `paper-500` the eye first reaches for: `paper-500` on a `paper-200` track is 2.86:1 and misses the 3:1 non-text floor (§14.1). The track is not load-bearing — it is a groove, and carries no information the thumb does not.

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

`display` is the hero name in the detail dialog; `title` is a panel's plate heading and a hero card's name; `label` is every stat name, field label and button — and a control that is a button in all but name: a select trigger, its options, and a dropdown menu item, all of which the mockups draw in the same condensed bold as the buttons beside them. The role's uppercase stops at the words the UI itself supplies: a select holding a hero's name keeps the name's own casing, because a name is not a label. `tag` is the small bordered status chips. Emphasis inside body text is a weight step to 600, never a size change. Heading levels follow document hierarchy — one `h1` per page — and take their look from these roles, not the reverse.

The scale is registered as Tailwind text tokens (`--text-display`, `--text-title`, `--text-label`, `--text-tag`, each with its `--*--line-height`, `--*--font-weight` and `--*--letter-spacing`), so `text-title` carries size, weight and leading together and no component sets the three separately. `body` and `small` are Tailwind's `text-sm` and `text-xs` with `--text-sm--line-height: 1.5` decided here.

---

## 3. Spacing

Tailwind's numeric spacing scale already lands on exactly the steps this design needs, so spacing has **no parallel `--space-*` tokens** — a second scale would only drift from the first. The allowed steps are these and no others:

| Step | Pixels | Primary use                                         |
| ---- | ------ | --------------------------------------------------- |
| `0`  | 0      | Reset / collapse                                    |
| `1`  | 4px    | Icon-to-text, stepper-to-value                      |
| `2`  | 8px    | Compact internal spacing — power chip rows          |
| `3`  | 12px   | Hero card padding, portrait-to-stats gap            |
| `4`  | 16px   | Standard spacing; page inline padding on mobile     |
| `6`  | 24px   | Between cards in the roster grid; page padding ≥ md |
| `8`  | 32px   | Between a section heading and its content           |
| `12` | 48px   | Between major sections of a page                    |

Used as the utilities themselves (`gap-3`, `p-4`, `px-6`). A step outside this table (`gap-5`, `p-7`) is off-scale and a defect, as is a raw value (`gap: 20px`); the nearest allowed step wins. Responsive overrides are fine when both base and override come from the scale.

**Gap categories:** inline `1` · tight `2` · compact `3` · standard `4` (use when unsure) · comfortable `6` · section `8` · page `12`.

Layout is `flex`/`grid` with `gap` on the container. **Padding is a component's own business; margin is its parent's** — a component never sets a margin on its own outermost element to place itself in a layout it does not own.

---

## 4. Sizing

### Control heights

Four steps, every one clearing the 24px touch floor. A row of mixed controls aligns because they all come from here.

| Token                 | Height | Used by                                                                   |
| --------------------- | ------ | ------------------------------------------------------------------------- |
| `--control-h-xs`      | 24px   | Stat steppers, power chips and per-hero glyphs in a hero card             |
| `--control-h-sm`      | 28px   | The Story Setup drawer's per-budget reset glyphs                          |
| `--control-h-default` | 32px   | Buttons, inputs, selects, dropdown triggers, stepper in the detail dialog |
| `--control-h-lg`      | 44px   | Primary actions on touch layouts, the mobile action bar                   |

`--control-h-plate` (40px) is the titled header band on a panel — a surface, not a control, but sized here so nothing re-measures it.

An icon-only button is **square at its step** (`width` = `height`), never a padded rectangle. The mockups' 30px dialog steppers and 27px chips were snapped to 32 and 28 (decision 003) so the scale stays four values wide.

The power chips started at 28 and are 24: four of them plus their gaps is 108 at the smaller step and 124 at the larger. 24 is the floor in §14.2, so this is the last step down available to them — and the card portrait is 108 rather than 112 so that a full row of four lines up with the image edge to edge (§13, Card body). The 108 is derived from the chips, not chosen: no gap on the scale takes four 24s to 112, since `gap-1` lands on 108 and `gap-1.5` overshoots to 114.

### Widths

| Thing           | Value               | Note                                                        |
| --------------- | ------------------- | ----------------------------------------------------------- |
| Page container  | full width          | The roster grid centres itself; there is no fixed page rail |
| Page padding    | `p-4`, ≥ md `p-6`   | Inline padding on the page frame                            |
| Content measure | 65ch                | Running prose — descriptions, empty states                  |
| Form field      | fills its container | Never a fixed px width                                      |

Dialog widths are per-dialog and land in §13 once measured.

### Heights

Nothing holding content takes a fixed height — `min-height` and let content size the box. Fixed heights are for controls, for media boxes with an aspect ratio (§10), and for skeletons standing in for known content.

**Viewport height is not this document's to give.** The page's height comes from the chain in `stacks/frontend/nuxt/page-layout.md`, which has already subtracted the header. Nothing here or in a page restates it: no `100vh`, no `100dvh`, no `calc()` over `--ui-header-height`. This binds Nuxt UI's own themes too — `main`'s upstream `min-h-[calc(100vh-var(--ui-header-height))]` is overridden in its vendored config for exactly this reason.

---

## 5. Borders & Radius

### Radius

`--ui-radius: 0` is the whole story — Nuxt UI derives Tailwind's `--radius-*` steps from it, so every `rounded-*` utility resolves flat and there is no second radius token to keep in sync. Hard edges are the design, not a default left unset.

Two things do not follow `--ui-radius` and must be overridden explicitly in the component config that uses them: `rounded-full` is a literal in Nuxt UI's themes (the switch track and thumb, the tabs indicator) and becomes `rounded-none!`; anything drawn as an SVG circle is geometry, not radius, and stays round where the design shows a disc.

The `!` on that override is load-bearing. A config extends the upstream theme rather than replacing it, so both radius utilities reach the class list, and which one paints is decided by their order in the stylesheet — not by their order in the string. Without it the flat track holds most of the time and reverts to a pill whenever the build orders the two the other way.

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

One shadow value for elevation, `--shadow-panel: 0 10px 24px rgb(0 0 0 / 0.5)`, and no ad-hoc one-offs.

**Selection is not elevation.** A control that is _on_ — a toggled power chip, the active tab — is marked with a 1px gold halo drawn as a shadow, `0 0 0 1px var(--ui-color-warning-500)`, and never by raising it. This is the second and last shadow the system spends, and it is a state marker rather than a depth cue: it sits flush against the control's edge and reads as the gold that §1 gives selection. The halo is only half the state: an on control also **flips to the solid treatment of its own colour**, ink on the fill and an ink edge, rather than tinting the variant it wears when off. That is the difference the mockups draw between `.chip` (tan, a subtle control) and `.chip.on` (amber with ink on it), and it is why `active` is a variant change and not a colour change — a `subtle` control reads as `solid` for as long as it is on. A control that is on **and** disabled keeps the whole on treatment and only takes the disabled dim on top of it — locked is not off, and a chip that shows a permanent ability (Blonde Blazer's flight) has to read as on even though nothing can toggle it. Larger selected objects — a hero portrait, a mission template panel — take the same gold at 2px instead, as a ring rather than a halo.

| Selected thing     | Marker                                                       |
| ------------------ | ------------------------------------------------------------ |
| Button / chip (on) | 1px gold halo + its colour's solid fill, ink on it, ink edge |
| Tab (active)       | 1px gold halo + paper fill + 3px inset `primary` underline   |
| Portrait / panel   | 2px gold ring                                                |

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
- **Card portrait: 108 × 108** (`size-27`). The value comes from the power-chip row beneath it (§4) — four 24px chips and their gaps — not from the imagery scale, so it moves only if that row does.
- **Radius** is 0 like everything else; a portrait's separation is its 2px ink border.
- **Placeholder:** a `--ui-bg-elevated` block at the same aspect ratio while loading, occupying the final geometry.
- **Alt text is required** — the hero's name for a portrait. `alt=""` only for imagery that is decorative and already `aria-hidden` in effect.

**The page ground carries one decorative image**, and it is the only one in the product that is not a hero portrait: `public/images/background.webp`, fixed and full-bleed behind the whole app at **20% opacity** over the `secondary-900` ground of §1. Structural depth still comes from the panel treatment — the wash sits under it and adds texture, never separation, which is why nothing above it is restyled to account for it.

- **Opacity is 20%** (§7). Higher and it starts competing with the panel edges for the eye; the ground colour, not the image, is what the paper panels are read against.
- **`pointer-events-none` and `alt=""`** — it is decoration in the §10 sense, outside the accessibility tree and out of the way of every control.
- The page needs `relative z-10` on `<u-main>` to sit above the fixed layer.
- **Ships as WebP at 2560px wide** (~300 KB). The original 6668 × 3024 PNG was 13 MB, which `/` being prerendered would have put in front of every first paint; at 20% opacity the detail it carried is not visible.
- **The highlighted block is neutralised.** The source art marks one downtown building in saturated orange — a call-site highlight from the concept board that means nothing here, and the one spot where a decorative wash would have read as a pointer. The shipped asset paints it as ordinary masonry, with its courtyard tree green and its two window walls blue, so it sits in the skyline like any other building. The source PNG is not in the repo; it is in git history at `c0a045c^`.

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

## 13. Element & layout specs

The scales above, resolved per element. Every value here was measured from the built UI, not intended — a component is checked against this table, and a value that is not here is not a decision yet.

| Element            | Height / size             | Padding          | Radius | Border          | Shadow        |
| ------------------ | ------------------------- | ---------------- | ------ | --------------- | ------------- |
| Button xs / sm     | 24 / 28                   | `px-2`/`px-2.5`  | 0      | none            | none          |
| Button md / lg     | 32 / 44                   | `px-3`/`px-4`    | 0      | none            | none          |
| Icon button        | square at its step        | none             | 0      | none            | none          |
| Button / chip (on) | its step                  | its step's       | 0      | 1px ink ring    | 1px gold halo |
| Input / select     | 32 (40 in Story Setup)    | `px-2.5`/`px-3`  | 0      | 2px inset ring  | none          |
| Switch             | 44 × 24 track, 16 thumb   | `p-0.5`          | 0      | 2px             | none          |
| Badge / chip (md)  | 28                        | `px-2`           | 0      | none (solid)    | none          |
| Tab trigger        | 36                        | `px-2`/`sm:px-5` | 0      | 2px             | none          |
| Header             | 64 (`--ui-header-height`) | `px-4`/`sm:px-6` | 0      | 2px bottom      | none          |
| Mobile action bar  | 70 (44 buttons + `p-3`)   | `p-3`            | 0      | 2px top         | none          |
| Card / panel       | auto, max 368 (`w-92`)    | `p-3`            | 0      | `panel`         | `panel`       |
| Ruled band         | its content's height      | —                | 0      | 1px `secondary` | none          |
| Plate band         | 40 (`--control-h-plate`)  | `px-3`/`px-4`    | 0      | 2px bottom      | none          |
| Dialog / slideover | `panel`, plate header     | `p-4`/`sm:p-6`   | 0      | `panel`         | `panel`       |
| Dropdown / popover | auto                      | —                | 0      | `panel`         | `panel`       |
| Toast              | auto                      | `p-4`            | 0      | `panel`         | `panel`       |
| Scrollbar          | `thin` (~8, UA-decided)   | —                | UA     | none            | none          |

**Layouts:**

| Layout            | Spec                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page container    | full width; inline padding `p-4`, `md:p-6`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Roster grid       | `gap-x-6 gap-y-12`; one column, `md` two, `2xl` four. Each column is a synergy pair, capped at the card's `max-w-92`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Synergy pair      | the pair's two cards `gap-2` apart around a ruled band carrying a `warning` outline badge — 44px end to end. The grid's `gap-y-12` (48) is measured against that: at one column wide the columns are gone, so unpaired neighbours must sit further apart than the band's own span, not merely further than a bare gap.                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Recruit row       | a ruled band carrying the section heading (`label` role, `text-secondary-300`), `gap-4` to a centred `gap-x-6 gap-y-12` grid — one column, two from `md`. There are always exactly two recruits, so a third track would never fill. From `md` the block is `w-fit` so the band spans the cards rather than the frame; below it the cards are fluid and the band spans with them.                                                                                                                                                                                                                                                                                                                                                                                                       |
| Card body         | portrait column pinned to the portrait's own 108px (`w-27 shrink-0`) beside the stat rows, `gap-3`. Under the portrait sits a fixed 108 × 24 box holding the hero's power chips — one row, centred, `gap-1`, never wrapping. Sized for **four** 24px chips, which fill it exactly and align with the image's edges; a shorter row still centres under it. A fifth chip would widen the column and break every card's stat alignment, which is why flight lives in the card's header row instead. Each stat row reserves its two 24px stepper slots whether or not the hero can level up, or a fixed-level recruit's stat column measures 116 against everyone else's 172 and its card comes out narrower. A stat's value is bold and its label regular, so the number carries the row. |
| Tab row           | below `sm` a 3-track grid, each trigger `w-full` — three equal thirds spanning the frame's width; from `sm` a content-width row, `shrink-0`, with `overflow-x-auto` as the safety net Carries a 1px `secondary` bottom rule — the ruled band's own style — so the edge the content scrolls under is visible.                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Header            | wordmark · budget readout · build actions, single row; see the tier ladder below. A 1px × 28 `secondary-400` divider separates the readout from the actions, `mx-2` clear of both — lighter than the chrome so it reads as a divider rather than a seam, and dimmer than the labels either side so it does not compete with them.                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Mobile action bar | below `md` only, pinned under the scrolling content: three equal-width 44px buttons on chrome                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Form              | `gap-4` between fields, label above or beside its control per orientation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

A card is fluid below its maximum (`w-full max-w-92`) and its column is capped with it. A fixed width there is what breaks the reflow floor in §14.3, since 368px cannot fit a 320px viewport.

**Header tier ladder.** Every header action is a 32px button (`md`, the button step — `xs` is the stepper step and was never a button height); the bare glyphs below `md` are 44. The 32px step also costs horizontal room: `md`'s `px-3` is 8px per labelled button more than `xs`'s `px-2`, so the labelled row is ~24px wider than the ~1120px it was measured at. It still cannot hold one shape across the range. What gives way, in order:

| From | Wordmark             | Budget readout   | Actions                                                                                                                                                      |
| ---- | -------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `xl` | + `BUILD CALCULATOR` | three, labelled  | Story Setup · Save · build ▾ · Share, all labelled                                                                                                           |
| `lg` | wordmark only        | three, labelled  | as above                                                                                                                                                     |
| `md` | wordmark only        | three, labelled  | icon-only with tooltips; build ▾ keeps a truncated name                                                                                                      |
| base | wordmark only        | none — see below | bare Story Setup and menu glyphs; Save · Builds ▾ · Share move to the mobile action bar — Save icon-only at its own square, the other two splitting the rest |

Two rules this ladder encodes. **Labels go before information**: an unlabelled floppy disk is still recognisably Save, whereas a hidden `2/7` is simply gone — so button labels drop a tier before the readout does. And the readout's disappearance below `md` is **safe only because the same three budgets are always present in the Story Setup drawer**; if that ever stops being true, this row has to change with it.

**Build state is carried by the control that acts on it, not by a badge beside it.** The unsaved-changes state marks the Save button itself — Save renders only when the build is dirty, and when it does it takes the on-treatment of §6, solid in the gold §1 assigns to that state, rather than its resting `subtle` neutral. This is what lets the state survive the whole ladder: a badge is a second object competing for the width the ladder is already rationing, has no step on the scale matching a 32px button, and the one that used to sit here hid itself below `lg` — losing the signal exactly where the header is tightest. The state also lands in the button's accessible name (`Save — unsaved changes`), since a fill colour alone is not a readout. In the action bar Save is the one control that is **not** `block`: `block` is `w-full`, and grouped with the build selector it takes the whole group and starves the selector to its chevron — measured 132/32 at 375, the build name gone. Save is icon-only there and sizes to its own 44px square; the build selector and Share then split what is left evenly (44/146/146 at 375, 44/118/118 at 320, and 172/172 when the build is clean and Save is absent). The two shares are `flex-1 basis-0`, never bare `flex-1` — see the note on the component's root. The `info` "Viewing shared build" badge stays a badge: it describes the session rather than any one control, and its branch has no control that owns it.

---

## 14. Accessibility Constraints

### 14.1 Colour contrast

WCAG AA: body text 4.5:1, large text (18.66px+ bold) and non-text UI 3:1. A 1px rule that only decorates is exempt, and there are three: the band under a section heading, the tab row's bottom edge (`secondary-500` on the ground, 1.98:1) and the header's divider (`secondary-400` on the chrome, 2.74:1 — 500 was tried first and is invisible there at 1.29:1). None carries information the labels either side do not, and none is a target. **Measured from the token values, then confirmed in the rendered DOM** — the two agreed everywhere they were both checked.

| Foreground              | On          | Ratio | Verdict                         |
| ----------------------- | ----------- | ----- | ------------------------------- |
| ink                     | paper       | 12.52 | AA                              |
| ink                     | highlight   | 12.74 | AA                              |
| ink                     | tan         | 9.22  | AA                              |
| ink-soft (`text-muted`) | paper       | 6.11  | AA                              |
| ink-soft                | tan         | 4.50  | AA, exactly at the floor        |
| muted (`text-dimmed`)   | paper       | 3.13  | **labels and non-text only**    |
| ink                     | amber solid | 6.08  | AA                              |
| `paper-600`             | paper-200   | 5.58  | non-text — scrollbar on paper   |
| `lagoon-300`            | lagoon-950  | 8.27  | non-text — scrollbar on ground  |
| ink                     | gold solid  | 9.37  | AA — the Story Setup button     |
| amber-deep              | paper       | 3.12  | **large text only** (19px/800)  |
| `ember-800`             | paper       | 4.87  | AA — the small-text amber       |
| `brick-600`             | paper       | 5.45  | AA — error text                 |
| brick-500               | paper       | 4.36  | fill only                       |
| moss-500                | paper       | 4.58  | AA                              |
| signal-500              | paper       | 2.98  | **fill only, never text**       |
| `signal-700`            | paper       | 5.50  | AA — status text                |
| cream                   | signal-700  | 5.50  | AA — the info solid             |
| gold-500                | ground      | 11.20 | AA — the pair marker            |
| `secondary-300`         | ground      | 7.68  | AA — headings on the ground     |
| gold-500 at 50%         | ground      | 3.59  | non-text — the marker's ring    |
| cream                   | chrome      | 9.03  | AA                              |
| steel                   | chrome      | 5.09  | AA — header labels              |
| gold                    | chrome      | 6.76  | AA — counters, Story Setup      |
| `secondary-400`         | chrome      | 2.74  | non-text — the header divider   |
| secondary solid         | chrome      | 1.29  | **fails — no control, no rule** |
| neutral subtle          | chrome      | 6.65  | AA — Story Setup and Save       |
| cream                   | teal solid  | 6.99  | AA                              |
| cream                   | ground      | 13.19 | AA                              |
| gold                    | ground      | 9.87  | AA                              |
| edge ring               | ground      | 3.31  | non-text, meets 3:1             |

Four findings this table produced, all fixed rather than accepted: ink on **signal-500** is 4.21:1 and fails for badge text, so the info solid uses `signal-700` with cream; `--ui-text-dimmed` is below the body floor and is restricted to labels; the three fill colours that fail as small text each have a darker text-only step beside them (§1); and the **secondary solid is 1.29:1 against the chrome** — a teal button on a teal bar, which is not a contrast that can be nudged into passing. The Story Setup trigger takes Save's neutral subtle instead, a tan fill at 6.65:1 carrying ink at 9.22:1. The lesson repeats §14.1's rule: measure the pair that actually renders, not the one the eye assumes, and a solid on chrome is a pair like any other.

Re-measure after any token change. A brand colour that fails as text is constrained to a fill role and recorded here rather than nudged until it passes.

### 14.2 Touch-target size

The 24 × 24 floor (WCAG 2.5.8) is the reason `--control-h-xs` is 24 and not smaller. Measured: steppers 24 × 24, power chips and the per-hero header glyphs 24 × 24, the drawer's budget-reset glyphs 28 × 28, buttons and selects 32 (the Story Setup drawer's selects 40), the switch track 44 × 24, primary touch actions 44.

The hero card's chips and glyphs sit **exactly on** the floor rather than above it, a deliberate trade against §13's 108px box — there is no step below them, so any future control in that row is 24 or it does not go there.

The two bare glyph triggers in the mobile header — Story Setup and the menu — paint at 20-22px and pad their hit area to 44, not merely to the 24 floor: they are the only route to episode setup and to build management at that width, which makes them primary touch actions.

The switch used to be the one control whose paint was under the floor. It is drawn at the mockup's size now — a 44 × 24 track — so the paint is the target, and the `::after` box that padded it to 24 stays in the theme only for the smaller size variants, which the app does not currently render.

### 14.3 Breakpoints & reflow

`sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536` — Tailwind's defaults, unchanged. Every media query uses them.

The header does not hold one shape across this range — see the tier ladder in §13, which names what is dropped at `lg`, `md`, and base. Below `md` the three primary build actions leave the header entirely for the mobile action bar, so the vertical chrome budget changes there too: the header stays 64 (`--ui-header-height` does not vary by breakpoint — the mockup's 52 was not worth a responsive token) and the action bar adds 70, both `shrink-0`, with the scrolling region between them still owned by the chain in `stacks/frontend/nuxt/page-layout.md`. Measured at 320: no horizontal scroll and no element wider than the viewport.

**Reflow (WCAG 1.4.10): verified at 320px** — no horizontal scrolling, and no element in the main content wider than the viewport. The tab list used to be the one region that scrolled inside itself — at 320 the three short-label triggers measured 353px, and the shared `label` slot's `truncate` turned that into clipped names. It is now three equal thirds of the frame below `sm`, which removes the overflow rather than scrolling it: measured 91px per trigger at 320, nothing clipped, `scrollWidth === clientWidth`. `overflow-x-auto` and `shrink-0` stay on the `sm`-and-up row, where the labels are full-length, as the safety net. `overflow-x-auto` on the list with `shrink-0` on the trigger is the pair that matters — without the second the triggers compress and there is nothing to scroll. Getting there took two fixes worth remembering: a card with a fixed `w-92` is 368px and clips, and `w-full` inside an **auto-width** flex column resolves against an indefinite width and falls back to content width, so the column has to be capped too, not just the card.

### 14.4 Motion & reduced motion

Transitions are colour and opacity at the baseline duration, which needs no guard. Anything transform-based or longer than the baseline — the slideover, dialog enter/exit — must short-circuit under `@media (prefers-reduced-motion: reduce)`. The tab indicator's slide is moot here: the design hides it.

---

## 15. Scoped styles and token reach

Tokens live in `app/assets/css/main.css` on `:root` (and in `@theme` for the ramps and the type scale) — **never inside a `<style scoped>` block**, which cannot define a token for anything but itself.

This matters concretely here: `UModal`, `UDropdownMenu`, `UTooltip` and `UToast` teleport to `body`, outside the app subtree. Tokens hung on an app wrapper element would never reach them — a dialog that loses its palette is almost always that mistake. `:root` is the only correct home.

Component styling is utility-first in the template; a `<style scoped>` block is for what utilities cannot express. When one is needed, its values are `var(--*)` reads from this document, never raw hex or off-scale px. The one sanctioned `:deep()` is into `vue-data-ui`'s radar SVG, which is a third-party chart rather than a Nuxt UI internal; its colours are read from the token variables at runtime rather than hardcoded.
