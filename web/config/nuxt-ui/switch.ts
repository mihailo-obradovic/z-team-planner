import type { SwitchConfig } from '../../types/nuxt-ui';

export default {
  slots: {
    root: 'relative flex items-start',
    base: [
      // * Changes: rounded-full is a literal in the upstream theme, so the radius token cannot flatten it (annex §5). Two conflicting radius utilities in one string are resolved by stylesheet order rather than by their order here, which is why the track sometimes still painted round — `!` decides it. The unchecked track is tan with an ink edge, like a control. The ::after box pads the hit area to the 24px touch floor (§14.2) for the sizes whose track is shorter than that.
      // * Default: 'inline-flex items-center shrink-0 rounded-full border-2 border-transparent focus-visible:outline-2 focus-visible:outline-offset-2 data-[state=unchecked]:bg-accented'
      'relative inline-flex items-center shrink-0 rounded-none! border-2 border-accented focus-visible:outline-2 focus-visible:outline-offset-2 data-[state=unchecked]:bg-elevated after:absolute after:inset-x-0 after:top-1/2 after:h-6 after:-translate-y-1/2 after:content-[""]',
      'transition-[background] duration-200'
    ],
    container: 'flex items-center',
    // * Changes: the thumb is square too, and carries the same ink edge — `!` for the same reason as the track above.
    // * Default: 'group pointer-events-none rounded-full bg-default shadow-lg …'
    thumb:
      'group pointer-events-none rounded-none! border border-accented bg-default shadow-lg ring-0 transition-transform duration-200 data-[state=unchecked]:translate-x-0 data-[state=unchecked]:rtl:-translate-x-0 flex items-center justify-center',
    icon: [
      'absolute shrink-0 group-data-[state=unchecked]:text-dimmed opacity-0 size-10/12',
      'transition-[color,opacity] duration-200'
    ],
    wrapper: 'ms-2',
    // * Changes: as the form-field label — the annex's label role.
    // * Default: 'block font-medium text-default'
    label: 'block font-heading font-bold uppercase tracking-label text-toned',
    description: 'text-muted'
  },
  variants: {
    color: {
      primary: {
        base: 'data-[state=checked]:bg-primary focus-visible:outline-primary',
        icon: 'group-data-[state=checked]:text-primary'
      },
      secondary: {
        base: 'data-[state=checked]:bg-secondary focus-visible:outline-secondary',
        icon: 'group-data-[state=checked]:text-secondary'
      },
      success: {
        base: 'data-[state=checked]:bg-success focus-visible:outline-success',
        icon: 'group-data-[state=checked]:text-success'
      },
      info: {
        base: 'data-[state=checked]:bg-info focus-visible:outline-info',
        icon: 'group-data-[state=checked]:text-info'
      },
      warning: {
        base: 'data-[state=checked]:bg-warning focus-visible:outline-warning',
        icon: 'group-data-[state=checked]:text-warning'
      },
      error: {
        base: 'data-[state=checked]:bg-error focus-visible:outline-error',
        icon: 'group-data-[state=checked]:text-error'
      },
      neutral: {
        base: 'data-[state=checked]:bg-inverted focus-visible:outline-inverted',
        icon: 'group-data-[state=checked]:text-highlighted'
      }
    },
    size: {
      xs: {
        base: 'w-7',
        container: 'h-4',
        thumb:
          'size-3 data-[state=checked]:translate-x-3 data-[state=checked]:rtl:-translate-x-3',
        wrapper: 'text-xs'
      },
      sm: {
        base: 'w-8',
        container: 'h-4',
        thumb:
          'size-3.5 data-[state=checked]:translate-x-3.5 data-[state=checked]:rtl:-translate-x-3.5',
        wrapper: 'text-xs'
      },
      md: {
        base: 'w-9',
        container: 'h-5',
        thumb:
          'size-4 data-[state=checked]:translate-x-4 data-[state=checked]:rtl:-translate-x-4',
        wrapper: 'text-sm'
      },
      lg: {
        base: 'w-10',
        container: 'h-5',
        thumb:
          'size-4.5 data-[state=checked]:translate-x-4.5 data-[state=checked]:rtl:-translate-x-4.5',
        wrapper: 'text-sm'
      },
      // * Changes: the thumb is inset rather than flush, so the track needs its own padding. Upstream has no track height at all — the track is as tall as its thumb plus the border, which is how a flush size-5 thumb makes the 24px track. Shrinking the thumb to the mockup's proportion therefore shrinks the track with it unless the 2px it gave up comes back as `p-0.5`, and that is also what puts the surround on the ends: the travel is what the padded content box leaves (44 - 4 border - 4 padding - 16 thumb = 20).
      // * Default: base 'w-11', thumb 'size-5 data-[state=checked]:translate-x-5 data-[state=checked]:rtl:-translate-x-5'
      xl: {
        base: 'w-11 p-0.5',
        container: 'h-6',
        thumb:
          'size-4 data-[state=checked]:translate-x-5 data-[state=checked]:rtl:-translate-x-5',
        wrapper: 'text-base'
      }
    },
    checked: {
      true: {
        icon: 'group-data-[state=checked]:opacity-100'
      }
    },
    unchecked: {
      true: {
        icon: 'group-data-[state=unchecked]:opacity-100'
      }
    },
    loading: {
      true: {
        icon: 'animate-spin'
      }
    },
    required: {
      true: {
        label: "after:content-['*'] after:ms-0.5 after:text-error"
      }
    },
    disabled: {
      true: {
        root: 'opacity-75',
        base: 'cursor-not-allowed',
        label: 'cursor-not-allowed',
        description: 'cursor-not-allowed'
      }
    }
  },
  defaultVariants: {
    color: 'primary',
    size: 'md'
  }
} satisfies SwitchConfig;
