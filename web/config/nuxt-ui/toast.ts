import type { ToastConfig } from '../../types/nuxt-ui';

// * Imported from @nuxt/ui 4.11.3.
// * Changes: focus stays on the @nuxt/ui 4.4.0 treatment. 4.9 replaced every focus ring with a 3px outline at 25% of the component colour, which the annex's focus rule (2px, contrast-driven, never amber) rules out. Lines marked "4.4 focus (header)" keep the 4.4.0 classes, out-ranking what 4.11.3 adds; their Default is the 4.11.3 string.
// TODO the held 4.4.0 rings are still the component colour (amber on primary), not the annex's ink and cream — a separate fix.
export default {
  slots: {
    // * Changes: a toast is a panel (annex §6). `border-s-4!` widens the panel's start edge into a colour bar, coloured per variant below — before it, the only thing telling an error from a success was the progress bar, 4px tall and gone the moment the toast finishes. 4.4 focus (header): `focus:outline-none` keeps upstream's new outline off.
    // ! The `!` is load-bearing, for the reason the annex gives for `rounded-none!` (§5): `panel` sets `border: 2px solid` as plain CSS, so an unimportant `border-s-4` loses to it and the bar silently stays 2px ink. Measured: without the `!` every colour resolved to `2px rgb(36, 31, 20)`.
    // * Changes: 4.4 focus (header).
    // * Default: 'relative group overflow-hidden bg-default shadow-lg rounded-lg ring ring-default p-4 flex gap-2.5'
    // * Default: 'relative group overflow-hidden bg-default shadow-lg rounded-lg ring ring-default p-4 flex gap-2.5 focus:outline-none'
    root: 'relative group overflow-hidden panel bg-default shadow-none ring-0 rounded-lg border-s-4! p-4 flex gap-2.5 focus:outline-none',
    wrapper: 'w-0 flex-1 flex flex-col',
    // * Changes: the annex's label role, as on every other titled surface.
    // * Default: 'text-sm font-medium text-highlighted'
    title:
      'text-sm font-heading font-bold uppercase tracking-label text-highlighted',
    description: 'text-sm text-muted',
    icon: 'shrink-0 size-5',
    avatar: 'shrink-0',
    avatarSize: '2xl',
    actions: 'flex gap-1.5 shrink-0',
    progress: 'absolute inset-x-0 bottom-0',
    close: 'p-0'
  },
  variants: {
    color: {
      primary: {
        // * Changes: 4.4 focus (header).
        // * Default: 'outline-primary/25 focus-visible:outline-3 focus-visible:ring-primary'
        // * Changes: colours the start edge `root` widens. `!` for the same reason as there. 4.4 focus (header). Default: 'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary'
        root: 'border-s-primary! focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
        icon: 'text-primary'
      },
      secondary: {
        // * Changes: 4.4 focus (header).
        // * Default: 'outline-secondary/25 focus-visible:outline-3 focus-visible:ring-secondary'
        // * Changes: colours the start edge `root` widens. `!` for the same reason as there. 4.4 focus (header). Default: 'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-secondary'
        root: 'border-s-secondary! focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-secondary',
        icon: 'text-secondary'
      },
      success: {
        // * Changes: 4.4 focus (header).
        // * Default: 'outline-success/25 focus-visible:outline-3 focus-visible:ring-success'
        // * Changes: colours the start edge `root` widens. `!` for the same reason as there. 4.4 focus (header). Default: 'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-success'
        root: 'border-s-success! focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-success',
        icon: 'text-success'
      },
      info: {
        // * Changes: 4.4 focus (header).
        // * Default: 'outline-info/25 focus-visible:outline-3 focus-visible:ring-info'
        // * Changes: colours the start edge `root` widens. `!` for the same reason as there. 4.4 focus (header). Default: 'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-info'
        root: 'border-s-info! focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-info',
        icon: 'text-info'
      },
      warning: {
        // * Changes: 4.4 focus (header).
        // * Default: 'outline-warning/25 focus-visible:outline-3 focus-visible:ring-warning'
        // * Changes: colours the start edge `root` widens. `!` for the same reason as there. 4.4 focus (header). Default: 'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-warning'
        root: 'border-s-warning! focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-warning',
        icon: 'text-warning'
      },
      error: {
        // * Changes: 4.4 focus (header).
        // * Default: 'outline-error/25 focus-visible:outline-3 focus-visible:ring-error'
        // * Changes: colours the start edge `root` widens. `!` for the same reason as there. 4.4 focus (header). Default: 'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-error'
        root: 'border-s-error! focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-error',
        icon: 'text-error'
      },
      neutral: {
        // * Changes: 4.4 focus (header).
        // * Default: 'outline-inverted/25 focus-visible:outline-3 focus-visible:ring-inverted'
        // * Neutral keeps the panel's own ink edge — `--ui-bg-inverted` is gold here (main.css), so `border-s-inverted` would read as a warning. 4.4 focus (header). Default: 'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-inverted'
        root: 'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-inverted',
        icon: 'text-highlighted'
      }
    },
    orientation: {
      horizontal: {
        root: 'items-center',
        actions: 'items-center'
      },
      vertical: {
        root: 'items-start',
        actions: 'items-start mt-2.5'
      }
    },
    title: {
      true: {
        description: 'mt-1'
      }
    }
  },
  defaultVariants: {
    color: 'primary'
  }
} satisfies ToastConfig;
