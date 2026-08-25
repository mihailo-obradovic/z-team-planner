import type { TooltipConfig } from '../../types/nuxt-ui';

export default {
  slots: {
    content:
      // * Changes: a tooltip is a small panel — 2px ink edge instead of a hairline ring, and the label treatment the rest of the UI uses.
      // * Default: leading 'flex items-center gap-1 bg-default text-highlighted shadow-sm rounded-sm ring ring-default h-6 px-2.5 py-1 text-xs'
      'flex items-center gap-1 bg-default text-highlighted shadow-sm rounded-sm ring-0 border-2 border-accented h-auto min-h-6 px-2.5 py-1 text-xs select-none data-[state=delayed-open]:animate-[scale-in_100ms_ease-out] data-[state=closed]:animate-[scale-out_100ms_ease-in] origin-(--reka-tooltip-content-transform-origin) pointer-events-auto',
    arrow: 'fill-default',
    text: 'truncate',
    kbds: "hidden lg:inline-flex items-center shrink-0 gap-0.5 not-first-of-type:before:content-['·'] not-first-of-type:before:me-0.5",
    kbdsSize: 'sm'
  }
} satisfies TooltipConfig;
