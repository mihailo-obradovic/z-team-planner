import type { HeaderConfig } from '../../types/nuxt-ui';

export default {
  slots: {
    // * Changes: the header is teal chrome, not translucent paper — a solid secondary-600 band with a 2px ink-dark rule and cream text. z comes from the §8 scale instead of a raw 50.
    // * Default: 'bg-default/75 backdrop-blur border-b border-default h-(--ui-header-height) sticky top-0 z-50'
    root: 'bg-secondary-600 backdrop-blur-none border-b-2 border-secondary-700 text-neutral-100 h-(--ui-header-height) sticky top-0 z-(--z-sticky)',
    // * Changes: the header is full-bleed with the annex §13 inline padding (px-4 / sm:px-6). Upstream wraps the content in UContainer, whose max-w-(--ui-container) capped it at 1280px — so on a 1600px viewport the header sat inset 300px on each side while the tabs and the roster grid, which are page-width, ran to the edge. lg:px-8 goes with it: the annex names two padding steps here, not three.
    // * Default: 'w-full max-w-(--ui-container) mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 h-full'
    container:
      'w-full max-w-full mx-auto px-4 sm:px-6 flex items-center justify-between gap-3 h-full',
    // * Changes: shrink-0 so the wordmark keeps its width against the actions beside it. It takes lg:flex-none rather than a shrink utility: flex-1 is a shorthand that re-sets flex-shrink, so only another class in the same group reliably replaces it — tailwind-merge then keeps the later one, which is this file's.
    // * Default: 'lg:flex-1 flex items-center gap-1.5'
    left: 'lg:flex-1 lg:flex-none flex items-center gap-1.5',
    center: 'hidden lg:flex',
    right: 'flex items-center justify-end lg:flex-1 gap-1.5',
    // * Changes: the wordmark is the display face — condensed, tracked, cream. text-highlighted is ink and would vanish against the teal band. It truncates below lg rather than holding its width: at 320px the header also carries the Story Setup glyph, and an unshrinkable wordmark runs underneath it.
    // * Default: 'shrink-0 font-bold text-xl text-highlighted flex items-end gap-1.5'
    title:
      'min-w-0 shrink truncate lg:shrink-0 font-heading font-extrabold uppercase tracking-label text-xl text-neutral-100 flex items-end gap-1.5',
    // * Changes: the header's own slideover is retired. Episode setup opens the Story Setup drawer (its own USlideover, reachable at every width) and the three primary build actions move to the mobile action bar below md — which leaves the toggle with nothing to open. The slots below stay themed rather than deleted: they are what the component renders if a future `mode`/`#body` ever puts them back, and an unthemed slideover here is the tan-scrim bug header.ts was written to fix.
    // * Default: 'lg:hidden'
    toggle: 'hidden',
    content: 'lg:hidden',
    // * Changes: the scrim is dark (annex §7). The slideover theme's default bg-elevated/75 is tan, which over a dark page washes it out instead of dimming it — and it cannot be removed, only out-ranked.
    // * Default: 'lg:hidden'
    overlay: 'lg:hidden bg-secondary-900/75',
    // * Changes: the slideover's own header strip has no background upstream, so the scrim showed straight through it. It is paper with the same 2px rule as every other panel edge.
    // * Default: 'px-4 sm:px-6 h-(--ui-header-height) shrink-0 flex items-center justify-between gap-3'
    header:
      'px-4 sm:px-6 h-(--ui-header-height) shrink-0 flex items-center justify-between gap-3 bg-default text-default border-b-2 border-accented',
    // * Changes: the slideover panel is paper, like every other surface.
    // * Default: 'p-4 sm:p-6 overflow-y-auto'
    body: 'p-4 sm:p-6 overflow-y-auto bg-default text-default'
  },
  variants: {
    toggleSide: {
      left: {
        toggle: '-ms-1.5'
      },
      right: {
        toggle: '-me-1.5'
      }
    }
  }
} satisfies HeaderConfig;
