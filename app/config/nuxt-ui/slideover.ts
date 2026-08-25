import type { SlideoverConfig } from '../../types/nuxt-ui';

export default {
  slots: {
    // * Changes: the scrim is dark (annex §7). bg-elevated is tan here, so upstream's default washes the page out instead of dimming it — the same correction header.ts makes for UHeader's own slideover.
    // * Default: 'fixed inset-0 bg-elevated/75'
    overlay: 'fixed inset-0 bg-secondary-900/75',
    // * Changes: the drawer is a panel like every other surface — 2px ink border, rust edge ring, drop shadow (annex §1, §6). Upstream's sm:ring/sm:shadow-lg are dropped rather than kept alongside, because `panel` already carries both and two rings stack visibly.
    // * Default: 'fixed bg-default divide-y divide-default sm:ring ring-default sm:shadow-lg flex flex-col focus:outline-none'
    content:
      'panel fixed bg-default divide-y divide-default flex flex-col focus:outline-none',
    // * Changes: the drawer's header is the titled plate band from the mockups. As in modal.ts, min-h-10 has to out-rank the upstream min-height (a min-height beats the plate utility's own height) and py-0 keeps the band exactly 40px rather than 40px plus upstream's padding.
    // * Default: 'flex items-center gap-1.5 p-4 sm:px-6 min-h-(--ui-header-height)'
    header: 'plate flex items-center gap-1.5 px-4 sm:px-6 py-0 min-h-10',
    wrapper: '',
    body: 'flex-1 overflow-y-auto p-4 sm:p-6',
    footer: 'flex items-center gap-1.5 p-4 sm:px-6',
    // * Changes: a plate's heading is the title role — condensed, uppercase, tracked (annex §2). font-semibold is dropped because text-title carries its own 800 weight.
    // * Default: 'text-highlighted font-semibold'
    title: 'text-highlighted font-heading text-title uppercase',
    description: 'mt-1 text-muted text-sm',
    close: 'absolute top-4 end-4'
  },
  variants: {
    side: {
      top: {
        content: ''
      },
      right: {
        // * Changes: the mockup's drawer is 462px, which is between Tailwind's md (28rem) and lg (32rem). max-w-lg is the nearer step and the two episode selects need the width; a raw 462px would be off-scale (annex §3).
        // * Default: 'max-w-md'
        content: 'max-w-lg'
      },
      bottom: {
        content: ''
      },
      left: {
        content: 'max-w-md'
      }
    },
    inset: {
      true: {
        // * Changes: every edge in this design is hard — radius 0 throughout (annex §6). The variant is kept so the prop still resolves, but it no longer rounds.
        // * Default: 'rounded-lg'
        content: ''
      }
    },
    transition: {
      true: {
        overlay:
          'data-[state=open]:animate-[fade-in_200ms_var(--ease-out)] data-[state=closed]:animate-[fade-out_200ms_var(--ease-out)]'
      }
    }
  },
  compoundVariants: [
    {
      side: 'top',
      inset: true,
      class: {
        content: 'max-h-[calc(100%-2rem)] inset-x-4 top-4'
      }
    },
    {
      side: 'top',
      inset: false,
      class: {
        content: 'max-h-full inset-x-0 top-0'
      }
    },
    {
      side: 'right',
      inset: true,
      class: {
        content: 'w-[calc(100%-2rem)] inset-y-4 right-4'
      }
    },
    {
      side: 'right',
      inset: false,
      class: {
        content: 'w-full inset-y-0 right-0'
      }
    },
    {
      side: 'bottom',
      inset: true,
      class: {
        content: 'max-h-[calc(100%-2rem)] inset-x-4 bottom-4'
      }
    },
    {
      side: 'bottom',
      inset: false,
      class: {
        content: 'max-h-full inset-x-0 bottom-0'
      }
    },
    {
      side: 'left',
      inset: true,
      class: {
        content: 'w-[calc(100%-2rem)] inset-y-4 left-4'
      }
    },
    {
      side: 'left',
      inset: false,
      class: {
        content: 'w-full inset-y-0 left-0'
      }
    },
    {
      transition: true,
      side: 'top',
      class: {
        content:
          'data-[state=open]:animate-[slide-in-from-top_200ms_var(--ease-out)] data-[state=closed]:animate-[slide-out-to-top_200ms_var(--ease-out)]'
      }
    },
    {
      transition: true,
      side: 'right',
      class: {
        content:
          'data-[state=open]:animate-[slide-in-from-right_200ms_var(--ease-out)] data-[state=closed]:animate-[slide-out-to-right_200ms_var(--ease-out)]'
      }
    },
    {
      transition: true,
      side: 'bottom',
      class: {
        content:
          'data-[state=open]:animate-[slide-in-from-bottom_200ms_var(--ease-out)] data-[state=closed]:animate-[slide-out-to-bottom_200ms_var(--ease-out)]'
      }
    },
    {
      transition: true,
      side: 'left',
      class: {
        content:
          'data-[state=open]:animate-[slide-in-from-left_200ms_var(--ease-out)] data-[state=closed]:animate-[slide-out-to-left_200ms_var(--ease-out)]'
      }
    }
  ]
} satisfies SlideoverConfig;
