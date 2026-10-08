import type { CheckboxConfig } from '../../types/nuxt-ui';

// * Imported from @nuxt/ui 4.11.3. The `rounded-*` classes stay: they resolve flat on their own, because Nuxt UI derives Tailwind's radius steps from `--ui-radius`, which the design system pins at 0 (annex §5).
// * Changes: focus stays on the @nuxt/ui 4.4.0 treatment. 4.9 replaced every focus ring with a 3px outline at 25% of the component colour, which the annex's focus rule (2px, contrast-driven, never amber) rules out. Lines marked "4.4 focus (header)" keep the 4.4.0 classes, out-ranking what 4.11.3 adds; their Default is the 4.11.3 string.
// TODO the held 4.4.0 rings are still the component colour (amber on primary), not the annex's ink and cream — a separate fix.
export default {
  slots: {
    root: 'relative flex items-start',
    container: 'flex items-center',
    // * Changes: a 2px inset ring, the width the annex gives an input or a select (§5); upstream's `ring` is 1px, which is the decorative-rule width here. Same deviation, same reason, as select.ts. 4.4 focus (header): `outline-solid` out-ranks upstream's `outline-none`, since 4.11 moved the visible focus into the list compounds below.
    // * Changes: 4.4 focus (header).
    // * Default: 'rounded-sm ring ring-inset ring-accented overflow-hidden focus-visible:outline-none'
    // * Default: 'rounded-sm ring ring-inset ring-accented overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2'
    base: 'rounded-sm ring-2 ring-inset ring-accented overflow-hidden focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2',
    indicator: 'flex items-center justify-center size-full text-inverted',
    icon: 'shrink-0',
    wrapper: 'w-full',
    label: 'block font-medium text-default',
    description: 'text-muted'
  },
  variants: {
    color: {
      primary: {
        indicator: 'bg-primary'
      },
      secondary: {
        indicator: 'bg-secondary'
      },
      success: {
        indicator: 'bg-success'
      },
      info: {
        indicator: 'bg-info'
      },
      warning: {
        indicator: 'bg-warning'
      },
      error: {
        indicator: 'bg-error'
      },
      neutral: {
        indicator: 'bg-inverted'
      }
    },
    variant: {
      list: {
        root: ''
      },
      card: {
        root: [
          'border border-default rounded-lg hover:not-has-disabled:not-has-focus-visible:not-has-data-[state=checked]:bg-elevated/50',
          'transition-colors'
        ]
      }
    },
    indicator: {
      start: {
        root: 'flex-row',
        wrapper: 'ms-2'
      },
      end: {
        root: 'flex-row-reverse',
        wrapper: 'me-2'
      },
      hidden: {
        base: 'sr-only',
        wrapper: 'flex flex-col items-center gap-1 text-center'
      }
    },
    size: {
      xs: {
        base: 'size-3',
        icon: 'size-2.5',
        container: 'h-4',
        wrapper: 'text-xs'
      },
      sm: {
        base: 'size-3.5',
        icon: 'size-3',
        container: 'h-4',
        wrapper: 'text-xs'
      },
      md: {
        base: 'size-4',
        icon: 'size-3.5',
        container: 'h-5',
        wrapper: 'text-sm'
      },
      lg: {
        base: 'size-4.5',
        icon: 'size-4',
        container: 'h-5',
        wrapper: 'text-sm'
      },
      xl: {
        base: 'size-5',
        icon: 'size-4.5',
        container: 'h-6',
        wrapper: 'text-base'
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
    },
    highlight: {
      true: '',
      false: ''
    },
    checked: {
      true: ''
    }
  },
  compoundVariants: [
    {
      indicator: 'hidden',
      class: {
        container: 'h-auto'
      }
    },
    {
      variant: 'card',
      highlight: false,
      class: {
        root: 'hover:not-has-disabled:not-has-focus-visible:not-has-data-[state=checked]:border-accented'
      }
    },
    {
      size: 'xs',
      indicator: 'hidden',
      class: {
        icon: 'size-3'
      }
    },
    {
      size: 'sm',
      indicator: 'hidden',
      class: {
        icon: 'size-3.5'
      }
    },
    {
      size: 'md',
      indicator: 'hidden',
      class: {
        icon: 'size-4'
      }
    },
    {
      size: 'lg',
      indicator: 'hidden',
      class: {
        icon: 'size-4.5'
      }
    },
    {
      size: 'xl',
      indicator: 'hidden',
      class: {
        icon: 'size-5'
      }
    },
    {
      size: 'xs',
      variant: 'card',
      class: {
        root: 'p-2.5'
      }
    },
    {
      size: 'sm',
      variant: 'card',
      class: {
        root: 'p-3'
      }
    },
    {
      size: 'md',
      variant: 'card',
      class: {
        root: 'p-3.5'
      }
    },
    {
      size: 'lg',
      variant: 'card',
      class: {
        root: 'p-4'
      }
    },
    {
      size: 'xl',
      variant: 'card',
      class: {
        root: 'p-4.5'
      }
    },
    {
      color: 'primary',
      variant: 'list',
      indicator: ['start', 'end'],
      class: {
        // * Changes: 4.4 focus (header) — a 2px outline in the colour, offset 2, and the ink ring kept on focus rather than recoloured.
        // * Default: 'outline-primary/25 focus-visible:outline-solid focus-visible:outline-3 focus-visible:ring-primary'
        base: 'focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary focus-visible:ring-accented'
      }
    },
    {
      color: 'secondary',
      variant: 'list',
      indicator: ['start', 'end'],
      class: {
        // * Changes: 4.4 focus (header) — a 2px outline in the colour, offset 2, and the ink ring kept on focus rather than recoloured.
        // * Default: 'outline-secondary/25 focus-visible:outline-solid focus-visible:outline-3 focus-visible:ring-secondary'
        base: 'focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary focus-visible:ring-accented'
      }
    },
    {
      color: 'success',
      variant: 'list',
      indicator: ['start', 'end'],
      class: {
        // * Changes: 4.4 focus (header) — a 2px outline in the colour, offset 2, and the ink ring kept on focus rather than recoloured.
        // * Default: 'outline-success/25 focus-visible:outline-solid focus-visible:outline-3 focus-visible:ring-success'
        base: 'focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-success focus-visible:ring-accented'
      }
    },
    {
      color: 'info',
      variant: 'list',
      indicator: ['start', 'end'],
      class: {
        // * Changes: 4.4 focus (header) — a 2px outline in the colour, offset 2, and the ink ring kept on focus rather than recoloured.
        // * Default: 'outline-info/25 focus-visible:outline-solid focus-visible:outline-3 focus-visible:ring-info'
        base: 'focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-info focus-visible:ring-accented'
      }
    },
    {
      color: 'warning',
      variant: 'list',
      indicator: ['start', 'end'],
      class: {
        // * Changes: 4.4 focus (header) — a 2px outline in the colour, offset 2, and the ink ring kept on focus rather than recoloured.
        // * Default: 'outline-warning/25 focus-visible:outline-solid focus-visible:outline-3 focus-visible:ring-warning'
        base: 'focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warning focus-visible:ring-accented'
      }
    },
    {
      color: 'error',
      variant: 'list',
      indicator: ['start', 'end'],
      class: {
        // * Changes: 4.4 focus (header) — a 2px outline in the colour, offset 2, and the ink ring kept on focus rather than recoloured.
        // * Default: 'outline-error/25 focus-visible:outline-solid focus-visible:outline-3 focus-visible:ring-error'
        base: 'focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error focus-visible:ring-accented'
      }
    },
    {
      color: 'neutral',
      variant: 'list',
      indicator: ['start', 'end'],
      class: {
        // * Changes: 4.4 focus (header) — a 2px outline in the colour, offset 2, and the ink ring kept on focus rather than recoloured.
        // * Default: 'outline-inverted/25 focus-visible:outline-solid focus-visible:outline-3 focus-visible:ring-inverted'
        base: 'focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-inverted focus-visible:ring-accented'
      }
    },
    {
      color: 'primary',
      variant: 'card',
      class: {
        root: 'outline-primary/25 has-focus-visible:outline-3 not-has-disabled:has-focus-visible:border-primary has-focus-visible:z-[1]'
      }
    },
    {
      color: 'secondary',
      variant: 'card',
      class: {
        root: 'outline-secondary/25 has-focus-visible:outline-3 not-has-disabled:has-focus-visible:border-secondary has-focus-visible:z-[1]'
      }
    },
    {
      color: 'success',
      variant: 'card',
      class: {
        root: 'outline-success/25 has-focus-visible:outline-3 not-has-disabled:has-focus-visible:border-success has-focus-visible:z-[1]'
      }
    },
    {
      color: 'info',
      variant: 'card',
      class: {
        root: 'outline-info/25 has-focus-visible:outline-3 not-has-disabled:has-focus-visible:border-info has-focus-visible:z-[1]'
      }
    },
    {
      color: 'warning',
      variant: 'card',
      class: {
        root: 'outline-warning/25 has-focus-visible:outline-3 not-has-disabled:has-focus-visible:border-warning has-focus-visible:z-[1]'
      }
    },
    {
      color: 'error',
      variant: 'card',
      class: {
        root: 'outline-error/25 has-focus-visible:outline-3 not-has-disabled:has-focus-visible:border-error has-focus-visible:z-[1]'
      }
    },
    {
      color: 'neutral',
      variant: 'card',
      class: {
        root: 'outline-inverted/25 has-focus-visible:outline-3 not-has-disabled:has-focus-visible:border-inverted has-focus-visible:z-[1]'
      }
    },
    {
      color: 'primary',
      variant: 'list',
      indicator: 'hidden',
      class: {
        root: 'outline-primary/25 has-focus-visible:outline-3 not-has-disabled:has-focus-visible:border-primary has-focus-visible:z-[1]'
      }
    },
    {
      color: 'secondary',
      variant: 'list',
      indicator: 'hidden',
      class: {
        root: 'outline-secondary/25 has-focus-visible:outline-3 not-has-disabled:has-focus-visible:border-secondary has-focus-visible:z-[1]'
      }
    },
    {
      color: 'success',
      variant: 'list',
      indicator: 'hidden',
      class: {
        root: 'outline-success/25 has-focus-visible:outline-3 not-has-disabled:has-focus-visible:border-success has-focus-visible:z-[1]'
      }
    },
    {
      color: 'info',
      variant: 'list',
      indicator: 'hidden',
      class: {
        root: 'outline-info/25 has-focus-visible:outline-3 not-has-disabled:has-focus-visible:border-info has-focus-visible:z-[1]'
      }
    },
    {
      color: 'warning',
      variant: 'list',
      indicator: 'hidden',
      class: {
        root: 'outline-warning/25 has-focus-visible:outline-3 not-has-disabled:has-focus-visible:border-warning has-focus-visible:z-[1]'
      }
    },
    {
      color: 'error',
      variant: 'list',
      indicator: 'hidden',
      class: {
        root: 'outline-error/25 has-focus-visible:outline-3 not-has-disabled:has-focus-visible:border-error has-focus-visible:z-[1]'
      }
    },
    {
      color: 'neutral',
      variant: 'list',
      indicator: 'hidden',
      class: {
        root: 'outline-inverted/25 has-focus-visible:outline-3 not-has-disabled:has-focus-visible:border-inverted has-focus-visible:z-[1]'
      }
    },
    {
      color: 'primary',
      variant: 'card',
      class: {
        root: 'has-data-[state=checked]:border-primary/50 has-data-[state=checked]:bg-primary/10'
      }
    },
    {
      color: 'secondary',
      variant: 'card',
      class: {
        root: 'has-data-[state=checked]:border-secondary/50 has-data-[state=checked]:bg-secondary/10'
      }
    },
    {
      color: 'success',
      variant: 'card',
      class: {
        root: 'has-data-[state=checked]:border-success/50 has-data-[state=checked]:bg-success/10'
      }
    },
    {
      color: 'info',
      variant: 'card',
      class: {
        root: 'has-data-[state=checked]:border-info/50 has-data-[state=checked]:bg-info/10'
      }
    },
    {
      color: 'warning',
      variant: 'card',
      class: {
        root: 'has-data-[state=checked]:border-warning/50 has-data-[state=checked]:bg-warning/10'
      }
    },
    {
      color: 'error',
      variant: 'card',
      class: {
        root: 'has-data-[state=checked]:border-error/50 has-data-[state=checked]:bg-error/10'
      }
    },
    {
      color: 'neutral',
      variant: 'card',
      class: {
        root: 'has-data-[state=checked]:border-inverted/50 has-data-[state=checked]:bg-elevated'
      }
    },
    {
      variant: 'card',
      disabled: true,
      class: {
        root: 'cursor-not-allowed'
      }
    },
    {
      color: 'primary',
      indicator: 'hidden',
      highlight: true,
      class: {
        root: 'not-has-disabled:border-primary not-has-disabled:has-data-[state=checked]:border-primary'
      }
    },
    {
      color: 'secondary',
      indicator: 'hidden',
      highlight: true,
      class: {
        root: 'not-has-disabled:border-secondary not-has-disabled:has-data-[state=checked]:border-secondary'
      }
    },
    {
      color: 'success',
      indicator: 'hidden',
      highlight: true,
      class: {
        root: 'not-has-disabled:border-success not-has-disabled:has-data-[state=checked]:border-success'
      }
    },
    {
      color: 'info',
      indicator: 'hidden',
      highlight: true,
      class: {
        root: 'not-has-disabled:border-info not-has-disabled:has-data-[state=checked]:border-info'
      }
    },
    {
      color: 'warning',
      indicator: 'hidden',
      highlight: true,
      class: {
        root: 'not-has-disabled:border-warning not-has-disabled:has-data-[state=checked]:border-warning'
      }
    },
    {
      color: 'error',
      indicator: 'hidden',
      highlight: true,
      class: {
        root: 'not-has-disabled:border-error not-has-disabled:has-data-[state=checked]:border-error'
      }
    },
    {
      color: 'neutral',
      indicator: 'hidden',
      highlight: true,
      class: {
        root: 'not-has-disabled:border-inverted not-has-disabled:has-data-[state=checked]:border-inverted'
      }
    },
    {
      color: 'primary',
      highlight: true,
      class: {
        base: 'ring-primary'
      }
    },
    {
      color: 'secondary',
      highlight: true,
      class: {
        base: 'ring-secondary'
      }
    },
    {
      color: 'success',
      highlight: true,
      class: {
        base: 'ring-success'
      }
    },
    {
      color: 'info',
      highlight: true,
      class: {
        base: 'ring-info'
      }
    },
    {
      color: 'warning',
      highlight: true,
      class: {
        base: 'ring-warning'
      }
    },
    {
      color: 'error',
      highlight: true,
      class: {
        base: 'ring-error'
      }
    },
    {
      color: 'neutral',
      highlight: true,
      class: {
        base: 'ring-inverted'
      }
    }
  ],
  defaultVariants: {
    highlight: false,
    // * Changes: the one checkbox list is the first-login offer, at the drawer's control size. Default: 'md'
    size: 'xl',
    color: 'primary',
    variant: 'list',
    indicator: 'start'
  }
} satisfies CheckboxConfig;
