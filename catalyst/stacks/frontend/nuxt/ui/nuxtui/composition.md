# Nuxt UI Composition Patterns

**Layer:** Frontend / UI
**Tool:** Nuxt UI 4 · Reka UI

How a page is assembled from Nuxt UI components. Component APIs (props, slots, events) are the library's own documentation — reach for the Nuxt UI MCP server; what a component _looks_ like is `customization.md`; how a script is ordered is `../../../_vue/vue-style.md`. This document owns the shapes that recur when several components are put together, and each one is here because getting it wrong costs a rewrite rather than a tweak.

Paths below use Nuxt's default `app/` srcDir; a project with a different srcDir substitutes its own throughout.

## Where an overlay mounts

**An overlay with more than one opener mounts once at the shell root and reads its open state from a composable.** The state is `useState` (`../../client-state.md`), so identity is shared across every component that asks for it, and any opener anywhere in the tree opens the overlay without a prop chain down to it or an event bus back up.

**Exactly one nearby opener keeps `defineModel('open')` at the call site.** The composable is the answer to _several_ openers, not the default for all of them — a dialog raised by the one button beside it is simpler, more local, and needs nothing from the shell.

Overlays that share a domain share a file. One composable holding every build dialog's open flag reads as the set of things that can be open at once, which is what a reviewer needs to see; one file per dialog scatters that answer.

## One dialog skeleton

Every dialog in the app is the same shape, so a user learns it once:

- **The heading goes through the component's own title API**, never a hand-rolled element in the body. That is what ties the accessible name to the dialog.
- **The body slot holds the content**, and nothing else.
- **The footer is right-aligned, dismissive action first and quiet** (`variant="ghost" color="neutral"`), **committing action last**, carrying `:loading` and `:disabled`. Reading order matches weight: the eye lands on the commit.
- **A text field in a dialog focuses on open and submits on Enter.** A dialog that needs a click to reach its only field is a dialog that fights the keyboard.
- **Every dialog passes a `description`** — the reason is in `customization.md`, Every dialog carries a description.

**The documented exception is two equally-weighted choices.** Where neither action is the dismissive one, neither takes the ghost treatment, and on narrow screens they stack rather than sitting side by side.

## Selection is the open state

**A dialog that shows one selected thing is driven by the selection itself** — `:open="!!selectedId"` — and closing it is clearing the selection. Two sources of truth, an `open` boolean beside a `selectedId`, can disagree, and the bug that follows is a dialog showing the previous item for one frame.

Split it in two:

- **An outer shell** owns open and close and takes the id.
- **An inner component** is mounted only when there is a selection, so it takes a **non-null** value.

The alternative — one component taking a nullable payload — pushes the null into every derived value inside it. The evidence is unambiguous when it happens: a single dialog accumulated seven identical early returns and three non-null assertions, all of them guarding a case its own mounting condition had already ruled out.

## Breakpoint tiers

**Where one control takes genuinely different forms at different breakpoints, render it once per form and switch between them with a named union** — never branch inside a single instance.

```ts
// * Rendered at lg and up (labelled), md (icon), and sm and down (bare).
export type HeaderTier = 'labelled' | 'icon' | 'bare';

// * The classes that show a control at its tier and nowhere else.
export const HEADER_TIER_CLASS: Record<HeaderTier, string> = {
  labelled: 'hidden lg:inline-flex',
  icon: 'hidden md:inline-flex lg:hidden',
  bare: 'flex md:hidden'
};
```

- **The union maps to its visibility classes in exactly one place.** Spread that map across call sites and the tiers drift until two are visible at once at some width nobody tested.
- **State shared between the instances is keyed by the same union**, so only the visible one is live.
- **The cost is real and is the point of naming it**: every tier mounts. That is acceptable only while each instance is cheap and free of side effects — a tier that fetches, or writes, on mount is the wrong shape and needs a single instance with a responsive prop instead.

This is for genuinely different _forms_. A control that only changes size or padding is a class, not a tier.

## Reserved cells

**When a control's presence depends on state, the row keeps its sized wrapper unconditionally and the `v-if` sits on the control.** The wrapper holds the space whether or not anything is in it, so neighbours never move when the state flips. A control that mounts into a row and pushes its siblings sideways does it exactly when the user is reaching for one of them.

- **A numeric readout that changes width is width-pinned**, for the same reason: a counter going from 9 to 10 must not shift the control beside it.
- **Where the state is _unresolved_ rather than absent** — still loading, not yet known — the element stays in place and is `invisible`, `aria-hidden`, and `tabindex="-1"`. It holds its own space, and it is absent from both the screen reader and the tab order while it has nothing to say.

## Read-only regions

**A region the user may read but not change gets `inert` at its boundary**, with `pointer-events-none` and `aria-readonly`, and the components inside are untouched.

```vue
<!-- * Read-only at one boundary rather than a disabled prop on forty controls. -->
<div class="pointer-events-none select-none" inert aria-readonly="true">
  <!-- the ordinary components, unchanged -->
</div>
```

The alternative is a `disabled` prop threaded through every descendant, which fails the moment someone adds a control and forgets it. One attribute at the boundary cannot be missed by a control that did not exist when it was written.

**State the limit in the same breath: `inert` stops human input, not a scripted dispatch.** It is a UI affordance, not an authorisation boundary. The real guarantee has to be structural — the page has no write path at all — and the comment at the boundary says so, or the next reader will mistake the attribute for the protection.
