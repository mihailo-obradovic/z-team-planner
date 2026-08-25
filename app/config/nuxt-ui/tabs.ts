import type { TabsConfig } from '../../types/nuxt-ui';

export default {
  slots: {
    root: 'flex items-center gap-2',
    list: 'relative flex p-1 group',
    indicator: 'absolute transition-[translate,width] duration-200',
    trigger: [
      'group relative inline-flex items-center min-w-0 data-[state=inactive]:text-muted hover:data-[state=inactive]:not-disabled:text-default font-medium rounded-md disabled:cursor-not-allowed disabled:opacity-75',
      'transition-colors'
    ],
    leadingIcon: 'shrink-0',
    leadingAvatar: 'shrink-0',
    leadingAvatarSize: '',
    label: 'truncate',
    trailingBadge: 'shrink-0',
    trailingBadgeSize: 'sm',
    content: 'focus:outline-none w-full'
  },
  variants: {
    color: {
      primary: '',
      secondary: '',
      success: '',
      info: '',
      warning: '',
      error: '',
      neutral: ''
    },
    variant: {
      pill: {
        list: 'bg-elevated rounded-lg',
        trigger: 'grow',
        indicator: 'rounded-md shadow-xs'
      },
      // * Changes: the design's tabs are free-standing bordered buttons on the dark ground, not an underlined rail — so the sliding indicator is hidden here and the rail's bottom rule is dropped in the compound variant below, which is the level that re-adds it. Colours too.
      // * Below sm the three tabs are equal thirds of the width — a 3-track grid, each trigger `w-full` — because at phone widths a content-width row left three short labels huddled against one edge, and at 320 it overflowed (353 into 320) and had to scroll. Equal thirds removes the overflow rather than scrolling it. From sm the row goes back to content width, `shrink-0` so it cannot compress, and keeps `overflow-x-auto` as the safety net. Inline padding follows the page container (p-4, then 6 from md) rather than sitting at 6 everywhere (annex §3, §13).
      // * Default: { list: 'border-default', indicator: 'rounded-full', trigger: 'focus:outline-none' }
      link: {
        list: 'border-default grid grid-cols-3 gap-2 px-4 py-2.5 sm:flex sm:overflow-x-auto md:px-6',
        indicator: 'rounded-full hidden',
        trigger: 'w-full focus:outline-none sm:w-auto sm:shrink-0'
      }
    },
    orientation: {
      horizontal: {
        root: 'flex-col',
        list: 'w-full',
        indicator:
          'left-0 w-(--reka-tabs-indicator-size) translate-x-(--reka-tabs-indicator-position)',
        trigger: 'justify-center'
      },
      vertical: {
        list: 'flex-col',
        indicator:
          'top-0 h-(--reka-tabs-indicator-size) translate-y-(--reka-tabs-indicator-position)'
      }
    },
    size: {
      xs: {
        trigger: 'px-2 py-1 text-xs gap-1',
        leadingIcon: 'size-4',
        leadingAvatarSize: '3xs'
      },
      sm: {
        trigger: 'px-2.5 py-1.5 text-xs gap-1.5',
        leadingIcon: 'size-4',
        leadingAvatarSize: '3xs'
      },
      md: {
        trigger: 'px-3 py-1.5 text-sm gap-1.5',
        leadingIcon: 'size-5',
        leadingAvatarSize: '2xs'
      },
      lg: {
        trigger: 'px-3 py-2 text-sm gap-2',
        leadingIcon: 'size-5',
        leadingAvatarSize: '2xs'
      },
      xl: {
        trigger: 'px-3 py-2 text-base gap-2',
        leadingIcon: 'size-6',
        leadingAvatarSize: 'xs'
      }
    }
  },
  compoundVariants: [
    {
      orientation: 'horizontal',
      variant: 'pill',
      class: {
        indicator: 'inset-y-1'
      }
    },
    {
      orientation: 'horizontal',
      variant: 'link',
      class: {
        list: 'border-b -mb-px',
        indicator: '-bottom-px h-px'
      }
    },
    {
      orientation: 'vertical',
      variant: 'pill',
      class: {
        indicator: 'inset-x-1',
        list: 'items-center'
      }
    },
    {
      orientation: 'vertical',
      variant: 'link',
      class: {
        list: 'border-s -ms-px',
        indicator: '-start-px w-px'
      }
    },
    {
      color: 'primary',
      variant: 'pill',
      class: {
        indicator: 'bg-primary',
        trigger:
          'data-[state=active]:text-inverted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
      }
    },
    {
      color: 'secondary',
      variant: 'pill',
      class: {
        indicator: 'bg-secondary',
        trigger:
          'data-[state=active]:text-inverted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary'
      }
    },
    {
      color: 'success',
      variant: 'pill',
      class: {
        indicator: 'bg-success',
        trigger:
          'data-[state=active]:text-inverted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-success'
      }
    },
    {
      color: 'info',
      variant: 'pill',
      class: {
        indicator: 'bg-info',
        trigger:
          'data-[state=active]:text-inverted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-info'
      }
    },
    {
      color: 'warning',
      variant: 'pill',
      class: {
        indicator: 'bg-warning',
        trigger:
          'data-[state=active]:text-inverted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warning'
      }
    },
    {
      color: 'error',
      variant: 'pill',
      class: {
        indicator: 'bg-error',
        trigger:
          'data-[state=active]:text-inverted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error'
      }
    },
    {
      color: 'neutral',
      variant: 'pill',
      class: {
        indicator: 'bg-inverted',
        trigger:
          'data-[state=active]:text-inverted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-inverted'
      }
    },
    // * Changes: an inactive tab is a teal chrome button with cream label; the active one flips to paper with ink text, an inset amber underline and a gold ring. Every rule here out-ranks an upstream one it cannot remove: font-bold beats font-medium, and the state colours beat text-muted and data-[state=active]:text-primary. Focus is cream, since amber fails 3:1 against paper (annex §5). Default trigger: 'data-[state=active]:text-primary focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary'
    {
      color: 'primary',
      variant: 'link',
      class: {
        indicator: 'bg-primary',
        // * The orientation+link compound above re-adds the rail's bottom rule after the variant, so it has to be out-ranked at compound level too.
        // * The rail comes back as a 1px secondary rule — the separator's own style (annex §13, Ruled band). The board has no rule here; this is for scrolling, so the edge the content passes under is visible rather than guessed.
        list: 'border-b border-secondary mb-0',
        trigger: [
          'h-9 px-2 py-0 border-2 border-secondary-700 bg-secondary sm:px-5',
          'font-heading font-bold uppercase tracking-label',
          'data-[state=inactive]:text-neutral-100 hover:data-[state=inactive]:not-disabled:text-neutral-100 hover:data-[state=inactive]:not-disabled:bg-secondary/80',
          'data-[state=active]:bg-default data-[state=active]:text-highlighted data-[state=active]:border-accented',
          'data-[state=active]:shadow-[inset_0_-3px_0_0_var(--ui-primary),0_0_0_1px_var(--ui-color-warning-500)]',
          'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neutral-100'
        ]
      }
    },
    {
      color: 'secondary',
      variant: 'link',
      class: {
        indicator: 'bg-secondary',
        trigger:
          'data-[state=active]:text-secondary focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-secondary'
      }
    },
    {
      color: 'success',
      variant: 'link',
      class: {
        indicator: 'bg-success',
        trigger:
          'data-[state=active]:text-success focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-success'
      }
    },
    {
      color: 'info',
      variant: 'link',
      class: {
        indicator: 'bg-info',
        trigger:
          'data-[state=active]:text-info focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-info'
      }
    },
    {
      color: 'warning',
      variant: 'link',
      class: {
        indicator: 'bg-warning',
        trigger:
          'data-[state=active]:text-warning focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-warning'
      }
    },
    {
      color: 'error',
      variant: 'link',
      class: {
        indicator: 'bg-error',
        trigger:
          'data-[state=active]:text-error focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-error'
      }
    },
    {
      color: 'neutral',
      variant: 'link',
      class: {
        indicator: 'bg-inverted',
        trigger:
          'data-[state=active]:text-highlighted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-inverted'
      }
    }
  ],
  defaultVariants: {
    color: 'primary',
    variant: 'pill',
    size: 'md'
  }
} satisfies TabsConfig;
