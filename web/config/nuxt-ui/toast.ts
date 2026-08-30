import type { ToastConfig } from '../../types/nuxt-ui';

export default {
  slots: {
    // * Changes: a toast is a panel (annex §6). `border-s-4!` widens the panel's start edge into a colour bar, coloured per variant below — before it, the only thing telling an error from a success was the progress bar, 4px tall and gone the moment the toast finishes.
    // ! The `!` is load-bearing, for the reason the annex gives for `rounded-none!` (§5): `panel` sets `border: 2px solid` as plain CSS, so an unimportant `border-s-4` loses to it and the bar silently stays 2px ink. Measured: without the `!` every colour resolved to `2px rgb(36, 31, 20)`.
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
        // * Changes: colours the start edge `root` widens. `!` for the same reason as there.
        root: 'border-s-primary! focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
        icon: 'text-primary'
      },
      secondary: {
        // * Changes: colours the start edge `root` widens. `!` for the same reason as there.
        root: 'border-s-secondary! focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-secondary',
        icon: 'text-secondary'
      },
      success: {
        // * Changes: colours the start edge `root` widens. `!` for the same reason as there.
        root: 'border-s-success! focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-success',
        icon: 'text-success'
      },
      info: {
        // * Changes: colours the start edge `root` widens. `!` for the same reason as there.
        root: 'border-s-info! focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-info',
        icon: 'text-info'
      },
      warning: {
        // * Changes: colours the start edge `root` widens. `!` for the same reason as there.
        root: 'border-s-warning! focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-warning',
        icon: 'text-warning'
      },
      error: {
        // * Changes: colours the start edge `root` widens. `!` for the same reason as there.
        root: 'border-s-error! focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-error',
        icon: 'text-error'
      },
      neutral: {
        // * Neutral keeps the panel's own ink edge — `--ui-bg-inverted` is gold here (main.css), so `border-s-inverted` would read as a warning.
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
