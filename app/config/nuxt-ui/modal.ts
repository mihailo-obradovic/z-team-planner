import type { ModalConfig } from '../../types/nuxt-ui';

export default {
  slots: {
    overlay: 'fixed inset-0',
    // * Changes: a dialog is a panel — 2px ink border, rust edge ring, drop shadow (annex §1, §6). The ring/shadow the fullscreen variant adds is out-ranked there, not here.
    // * Default: 'bg-default divide-y divide-default flex flex-col focus:outline-none'
    content:
      'panel bg-default divide-y divide-default flex flex-col focus:outline-none',
    // * Changes: the dialog's header is the titled plate band from the mockups. min-h-16 has to be out-ranked with min-h-10, because a min-height beats the plate utility's own height — and py-0 lets the band be exactly 40px rather than 40px plus the upstream padding.
    // * Default: 'flex items-center gap-1.5 p-4 sm:px-6 min-h-16'
    header: 'plate flex items-center gap-1.5 px-4 sm:px-6 py-0 min-h-10',
    wrapper: '',
    body: 'flex-1 p-4 sm:p-6',
    footer: 'flex items-center gap-1.5 p-4 sm:px-6',
    // * Changes: the plate's title is the annex's title role — condensed, uppercase, tracked.
    // * Default: 'text-highlighted font-semibold'
    title:
      'text-highlighted font-heading font-extrabold uppercase tracking-label text-title',
    description: 'mt-1 text-muted text-sm',
    // * Changes: the close button is a flex child of the plate band, not an overlay. Upstream pins it `absolute top-4 end-4`, which was written against upstream's taller band — against the 40px `min-h-10` band here it sits 12px low, and `end-4` overhangs the title's `sm:px-6` rail. `static` returns it to the flow (and with it, `top`/`end` stop applying at all — the app.config string is merged onto the default, not swapped for it), so the band's own `items-center` centres it and the band's own inline padding places it, at any band height.
    // * Default: 'absolute top-4 end-4'
    close: 'static ms-auto'
  },
  variants: {
    transition: {
      true: {
        overlay:
          'data-[state=open]:animate-[fade-in_200ms_ease-out] data-[state=closed]:animate-[fade-out_200ms_ease-in]',
        content:
          'data-[state=open]:animate-[scale-in_200ms_ease-out] data-[state=closed]:animate-[scale-out_200ms_ease-in]'
      }
    },
    fullscreen: {
      true: {
        content: 'inset-0'
      },
      false: {
        content:
          'w-[calc(100vw-2rem)] max-w-lg rounded-lg shadow-lg ring ring-default'
      }
    },
    overlay: {
      true: {
        // * Changes: the scrim is dark (annex §7). bg-elevated/75 is tan, which over a dark page washes the content out instead of dimming it.
        // * Default: 'bg-elevated/75'
        overlay: 'bg-secondary-900/75'
      }
    },
    scrollable: {
      true: {
        overlay: 'overflow-y-auto',
        content: 'relative'
      },
      false: {
        content: 'fixed',
        body: 'overflow-y-auto'
      }
    }
  },
  compoundVariants: [
    {
      scrollable: true,
      fullscreen: false,
      class: {
        overlay: 'grid place-items-center p-4 sm:py-8'
      }
    },
    {
      scrollable: false,
      fullscreen: false,
      class: {
        content:
          'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-4rem)] overflow-hidden'
      }
    }
  ]
} satisfies ModalConfig;
