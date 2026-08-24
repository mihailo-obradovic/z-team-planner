import type { HeaderConfig } from '../../types/nuxt-ui';

export default {
  slots: {
    // * Changes: the header is teal chrome, not translucent paper — a solid
    // * secondary-600 band with a 2px ink-dark rule and cream text. z comes
    // * from the §8 scale instead of a raw 50.
    // * Default: 'bg-default/75 backdrop-blur border-b border-default h-(--ui-header-height) sticky top-0 z-50'
    root: 'bg-secondary-600 backdrop-blur-none border-b-2 border-secondary-700 text-neutral-100 h-(--ui-header-height) sticky top-0 z-(--z-sticky)',
    container: 'flex items-center justify-between gap-3 h-full',
    left: 'lg:flex-1 flex items-center gap-1.5',
    center: 'hidden lg:flex',
    right: 'flex items-center justify-end lg:flex-1 gap-1.5',
    // * Changes: the wordmark is the display face — condensed, tracked, cream.
    // * text-highlighted is ink and would vanish against the teal band.
    // * Default: 'shrink-0 font-bold text-xl text-highlighted flex items-end gap-1.5'
    title:
      'shrink-0 font-heading font-extrabold uppercase tracking-label text-xl text-neutral-100 flex items-end gap-1.5',
    toggle: 'lg:hidden',
    content: 'lg:hidden',
    overlay: 'lg:hidden',
    header:
      'px-4 sm:px-6 h-(--ui-header-height) shrink-0 flex items-center justify-between gap-3',
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
