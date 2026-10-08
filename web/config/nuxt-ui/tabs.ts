import type { TabsConfig } from '../../types/nuxt-ui';

// * Imported from @nuxt/ui 4.11.3.
// * Changes: focus stays on the @nuxt/ui 4.4.0 treatment. 4.9 replaced every focus ring with a 3px outline at 25% of the component colour, which the annex's focus rule (2px, contrast-driven, never amber) rules out. Lines marked "4.4 focus (header)" keep the 4.4.0 classes, out-ranking what 4.11.3 adds; their Default is the 4.11.3 string.
// TODO the held 4.4.0 rings are still the component colour (amber on primary), not the annex's ink and cream — a separate fix.
export default {
  slots: {
    // * Changes: `u-tabs` renders once, as the planner page's column — the list keeps its height and the panel is the scrolling region. `gap-0` out-ranks upstream's gap rather than omitting it. Default root: 'flex items-center gap-2'; list: 'relative flex p-1 group'; content: 'w-full rounded-md focus-visible:outline-3'
    root: 'flex items-center gap-0',
    list: 'relative flex shrink-0 p-1 group',
    indicator:
      'absolute transition-[translate,width] duration-200 ease-out motion-reduce:transition-none',
    trigger: [
      'group relative inline-flex items-center min-w-0 data-[state=inactive]:text-muted hover:data-[state=inactive]:not-disabled:text-default font-medium rounded-md disabled:cursor-not-allowed disabled:opacity-75',
      'transition-colors',
      // * Added: a tab is a control, and a double-click meant to switch tabs was selecting its label instead (annex §12).
      'select-none'
    ],
    leadingIcon: 'shrink-0',
    leadingAvatar: 'shrink-0',
    leadingAvatarSize: '',
    label: 'truncate',
    trailingBadge: 'shrink-0',
    trailingBadgeSize: 'sm',
    // * Changes: 4.4 focus (header) — the panel takes no focus outline.
    content: 'focus:outline-none w-full min-h-0 flex-1 overflow-y-auto'
  },
  variants: {
    color: {
      primary: {
        content: 'outline-primary/25'
      },
      secondary: {
        content: 'outline-secondary/25'
      },
      success: {
        content: 'outline-success/25'
      },
      info: {
        content: 'outline-info/25'
      },
      warning: {
        content: 'outline-warning/25'
      },
      error: {
        content: 'outline-error/25'
      },
      neutral: {
        content: 'outline-inverted/25'
      }
    },
    variant: {
      pill: {
        list: 'bg-elevated rounded-lg',
        trigger: [
          'grow',
          "in-[[data-slot=list]:not(:has([data-slot=indicator]))]:data-[state=active]:before:content-[''] in-[[data-slot=list]:not(:has([data-slot=indicator]))]:data-[state=active]:before:absolute in-[[data-slot=list]:not(:has([data-slot=indicator]))]:data-[state=active]:before:inset-0 in-[[data-slot=list]:not(:has([data-slot=indicator]))]:data-[state=active]:before:rounded-md in-[[data-slot=list]:not(:has([data-slot=indicator]))]:data-[state=active]:before:shadow-xs in-[[data-slot=list]:not(:has([data-slot=indicator]))]:data-[state=active]:before:-z-10 in-[[data-slot=list]:not(:has([data-slot=indicator]))]:data-[state=active]:isolate"
        ],
        indicator: 'rounded-md shadow-xs'
      },
      // * Changes: the design's tabs are free-standing bordered buttons on the dark ground, not an underlined rail — so the sliding indicator is hidden here and the rail's bottom rule is dropped in the compound variant below, which is the level that re-adds it. Colours too.
      // * Below sm the three tabs are equal thirds of the width — a 3-track grid, each trigger `w-full` — because at phone widths a content-width row left three short labels huddled against one edge, and at 320 it overflowed (353 into 320) and had to scroll. Equal thirds removes the overflow rather than scrolling it. From sm the row goes back to content width, `shrink-0` so it cannot compress, and keeps `overflow-x-auto` as the safety net. Inline padding follows the page container (p-4, then 6 from md) rather than sitting at 6 everywhere (annex §3, §13).
      // * Default: { list: 'border-default', indicator: 'rounded-full', trigger: "in-[[data-slot=list]:not(:has([data-slot=indicator]))]:data-[state=active]:after:content-[''] in-[[data-slot=list]:not(:has([data-slot=indicator]))]:data-[state=active]:after:absolute in-[[data-slot=list]:not(:has([data-slot=indicator]))]:data-[state=active]:after:rounded-full" }
      link: {
        list: 'border-default grid grid-cols-3 gap-2 px-4 py-2.5 sm:flex sm:overflow-x-auto md:px-6',
        indicator: 'rounded-full hidden',
        // * Changes: `after:content-none` out-ranks upstream's server-render stand-in for the indicator. The stand-in draws an underline under the active tab while the list has no indicator element, which is the case before hydration; this design hides the indicator, so the stand-in would flash an underline the client never shows.
        trigger: [
          'w-full focus:outline-none sm:w-auto sm:shrink-0',
          'in-[[data-slot=list]:not(:has([data-slot=indicator]))]:data-[state=active]:after:content-none'
        ]
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
        indicator: '-bottom-px h-px',
        trigger:
          'in-[[data-slot=list]:not(:has([data-slot=indicator]))]:data-[state=active]:after:inset-x-0 in-[[data-slot=list]:not(:has([data-slot=indicator]))]:data-[state=active]:after:-bottom-[calc(var(--spacing)+1px)] in-[[data-slot=list]:not(:has([data-slot=indicator]))]:data-[state=active]:after:h-px'
      }
    },
    {
      orientation: 'vertical',
      variant: 'pill',
      class: {
        indicator: 'inset-x-1',
        list: 'items-center',
        trigger: 'w-full justify-center'
      }
    },
    {
      orientation: 'vertical',
      variant: 'link',
      class: {
        list: 'border-s -ms-px',
        indicator: '-start-px w-px',
        trigger:
          'in-[[data-slot=list]:not(:has([data-slot=indicator]))]:data-[state=active]:after:inset-y-0 in-[[data-slot=list]:not(:has([data-slot=indicator]))]:data-[state=active]:after:-start-[calc(var(--spacing)+1px)] in-[[data-slot=list]:not(:has([data-slot=indicator]))]:data-[state=active]:after:w-px'
      }
    },
    {
      color: 'primary',
      variant: 'pill',
      class: {
        indicator: 'bg-primary',
        trigger: [
          // * Changes: 4.4 focus (header).
          // * Default: 'data-[state=active]:text-inverted outline-primary/25 focus-visible:outline-3'
          'data-[state=active]:text-inverted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
          'in-[[data-slot=list]:not(:has([data-slot=indicator]))]:data-[state=active]:before:bg-primary'
        ]
      }
    },
    {
      color: 'secondary',
      variant: 'pill',
      class: {
        indicator: 'bg-secondary',
        trigger: [
          // * Changes: 4.4 focus (header).
          // * Default: 'data-[state=active]:text-inverted outline-secondary/25 focus-visible:outline-3'
          'data-[state=active]:text-inverted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary',
          'in-[[data-slot=list]:not(:has([data-slot=indicator]))]:data-[state=active]:before:bg-secondary'
        ]
      }
    },
    {
      color: 'success',
      variant: 'pill',
      class: {
        indicator: 'bg-success',
        trigger: [
          // * Changes: 4.4 focus (header).
          // * Default: 'data-[state=active]:text-inverted outline-success/25 focus-visible:outline-3'
          'data-[state=active]:text-inverted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-success',
          'in-[[data-slot=list]:not(:has([data-slot=indicator]))]:data-[state=active]:before:bg-success'
        ]
      }
    },
    {
      color: 'info',
      variant: 'pill',
      class: {
        indicator: 'bg-info',
        trigger: [
          // * Changes: 4.4 focus (header).
          // * Default: 'data-[state=active]:text-inverted outline-info/25 focus-visible:outline-3'
          'data-[state=active]:text-inverted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-info',
          'in-[[data-slot=list]:not(:has([data-slot=indicator]))]:data-[state=active]:before:bg-info'
        ]
      }
    },
    {
      color: 'warning',
      variant: 'pill',
      class: {
        indicator: 'bg-warning',
        trigger: [
          // * Changes: 4.4 focus (header).
          // * Default: 'data-[state=active]:text-inverted outline-warning/25 focus-visible:outline-3'
          'data-[state=active]:text-inverted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warning',
          'in-[[data-slot=list]:not(:has([data-slot=indicator]))]:data-[state=active]:before:bg-warning'
        ]
      }
    },
    {
      color: 'error',
      variant: 'pill',
      class: {
        indicator: 'bg-error',
        trigger: [
          // * Changes: 4.4 focus (header).
          // * Default: 'data-[state=active]:text-inverted outline-error/25 focus-visible:outline-3'
          'data-[state=active]:text-inverted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error',
          'in-[[data-slot=list]:not(:has([data-slot=indicator]))]:data-[state=active]:before:bg-error'
        ]
      }
    },
    {
      color: 'neutral',
      variant: 'pill',
      class: {
        indicator: 'bg-inverted',
        trigger: [
          // * Changes: 4.4 focus (header).
          // * Default: 'data-[state=active]:text-inverted outline-inverted/25 focus-visible:outline-3'
          'data-[state=active]:text-inverted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-inverted',
          'in-[[data-slot=list]:not(:has([data-slot=indicator]))]:data-[state=active]:before:bg-inverted'
        ]
      }
    },
    // * Changes: an inactive tab is a teal chrome button with cream label; the active one flips to paper with ink text, an inset amber underline and a gold ring. Every rule here out-ranks an upstream one it cannot remove: font-bold beats font-medium, and the state colours beat text-muted and data-[state=active]:text-primary. Focus is cream, since amber fails 3:1 against paper (annex §5). Default trigger: ['data-[state=active]:text-primary outline-primary/25 focus-visible:outline-3', 'in-[[data-slot=list]:not(:has([data-slot=indicator]))]:data-[state=active]:after:bg-primary']
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
        trigger: [
          // * Changes: 4.4 focus (header).
          // * Default: 'data-[state=active]:text-secondary outline-secondary/25 focus-visible:outline-3'
          'data-[state=active]:text-secondary focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-secondary',
          'in-[[data-slot=list]:not(:has([data-slot=indicator]))]:data-[state=active]:after:bg-secondary'
        ]
      }
    },
    {
      color: 'success',
      variant: 'link',
      class: {
        indicator: 'bg-success',
        trigger: [
          // * Changes: 4.4 focus (header).
          // * Default: 'data-[state=active]:text-success outline-success/25 focus-visible:outline-3'
          'data-[state=active]:text-success focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-success',
          'in-[[data-slot=list]:not(:has([data-slot=indicator]))]:data-[state=active]:after:bg-success'
        ]
      }
    },
    {
      color: 'info',
      variant: 'link',
      class: {
        indicator: 'bg-info',
        trigger: [
          // * Changes: 4.4 focus (header).
          // * Default: 'data-[state=active]:text-info outline-info/25 focus-visible:outline-3'
          'data-[state=active]:text-info focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-info',
          'in-[[data-slot=list]:not(:has([data-slot=indicator]))]:data-[state=active]:after:bg-info'
        ]
      }
    },
    {
      color: 'warning',
      variant: 'link',
      class: {
        indicator: 'bg-warning',
        trigger: [
          // * Changes: 4.4 focus (header).
          // * Default: 'data-[state=active]:text-warning outline-warning/25 focus-visible:outline-3'
          'data-[state=active]:text-warning focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-warning',
          'in-[[data-slot=list]:not(:has([data-slot=indicator]))]:data-[state=active]:after:bg-warning'
        ]
      }
    },
    {
      color: 'error',
      variant: 'link',
      class: {
        indicator: 'bg-error',
        trigger: [
          // * Changes: 4.4 focus (header).
          // * Default: 'data-[state=active]:text-error outline-error/25 focus-visible:outline-3'
          'data-[state=active]:text-error focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-error',
          'in-[[data-slot=list]:not(:has([data-slot=indicator]))]:data-[state=active]:after:bg-error'
        ]
      }
    },
    {
      color: 'neutral',
      variant: 'link',
      class: {
        indicator: 'bg-inverted',
        trigger: [
          // * Changes: 4.4 focus (header).
          // * Default: 'data-[state=active]:text-highlighted outline-inverted/25 focus-visible:outline-3'
          'data-[state=active]:text-highlighted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-inverted',
          'in-[[data-slot=list]:not(:has([data-slot=indicator]))]:data-[state=active]:after:bg-inverted'
        ]
      }
    }
  ],
  defaultVariants: {
    color: 'primary',
    // * Changes: the one instance is the link variant. Default: 'pill'
    variant: 'link',
    size: 'md'
  }
} satisfies TabsConfig;
