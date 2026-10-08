import type { InputConfig } from '../../types/nuxt-ui';

// * Imported from @nuxt/ui 4.11.3.
// * Changes: focus stays on the @nuxt/ui 4.4.0 treatment. 4.9 replaced every focus ring with a 3px outline at 25% of the component colour, which the annex's focus rule (2px, contrast-driven, never amber) rules out. Lines marked "4.4 focus (header)" keep the 4.4.0 classes, out-ranking what 4.11.3 adds; their Default is the 4.11.3 string.
// TODO the held 4.4.0 rings are still the component colour (amber on primary), not the annex's ink and cream — a separate fix.
export default {
  slots: {
    root: 'relative inline-flex items-center',
    base: [
      // * Changes: 4.4 focus (header).
      // * Default: 'w-full rounded-md border-0 appearance-none placeholder:text-dimmed disabled:cursor-not-allowed disabled:opacity-75'
      'w-full rounded-md border-0 appearance-none placeholder:text-dimmed disabled:cursor-not-allowed disabled:opacity-75 focus:outline-none',
      'transition-colors'
    ],
    leading: 'absolute inset-y-0 start-0 flex items-center',
    leadingIcon: 'shrink-0 text-dimmed',
    leadingAvatar: 'shrink-0',
    leadingAvatarSize: '',
    trailing: 'absolute inset-y-0 end-0 flex items-center',
    trailingIcon: 'shrink-0 text-dimmed'
  },
  variants: {
    fieldGroup: {
      horizontal: {
        root: 'group has-focus-visible:z-[1]',
        base: 'group-not-only:group-first:rounded-e-none group-not-only:group-last:rounded-s-none group-not-last:group-not-first:rounded-none'
      },
      vertical: {
        root: 'group has-focus-visible:z-[1]',
        base: 'group-not-only:group-first:rounded-b-none group-not-only:group-last:rounded-t-none group-not-last:group-not-first:rounded-none'
      }
    },
    size: {
      xs: {
        base: 'px-2 py-1 text-sm/4 gap-1',
        leading: 'ps-2',
        trailing: 'pe-2',
        leadingIcon: 'size-4',
        leadingAvatarSize: '3xs',
        trailingIcon: 'size-4'
      },
      sm: {
        base: 'px-2.5 py-1.5 text-sm/4 gap-1.5',
        leading: 'ps-2.5',
        trailing: 'pe-2.5',
        leadingIcon: 'size-4',
        leadingAvatarSize: '3xs',
        trailingIcon: 'size-4'
      },
      // * Changes: the control's height comes from the §4 scale rather than padding, so a select lines up with the buttons beside it. py-0 stops the upstream padding adding to the token height.
      md: {
        // * Changes: text-base/5 is upstream's iOS no-zoom size, kept; md:text-sm comes back through upstream's `fixed` compound variant.
        // * Default: 'px-2.5 py-1.5 text-base/5 gap-1.5'
        base: 'h-(--control-h-default) py-0 px-2.5 py-1.5 text-base/5 gap-1.5',
        leading: 'ps-2.5',
        trailing: 'pe-2.5',
        leadingIcon: 'size-5',
        leadingAvatarSize: '2xs',
        trailingIcon: 'size-5'
      },
      lg: {
        base: 'px-3 py-2 text-base/5 gap-2',
        leading: 'ps-3',
        trailing: 'pe-3',
        leadingIcon: 'size-5',
        leadingAvatarSize: '2xs',
        trailingIcon: 'size-5'
      },
      xl: {
        base: 'px-3 py-2 text-base gap-2',
        leading: 'ps-3',
        trailing: 'pe-3',
        leadingIcon: 'size-6',
        leadingAvatarSize: 'xs',
        trailingIcon: 'size-6'
      }
    },
    variant: {
      // * Changes: 2px ink ring (annex §5) — inputs are bordered like every other panel edge, not hairlined.
      // * Default: 'text-highlighted bg-default ring ring-inset ring-accented'
      outline: 'text-highlighted bg-default ring-2 ring-inset ring-accented',
      soft: 'text-highlighted bg-elevated/50 hover:bg-elevated focus:bg-elevated disabled:bg-elevated/50',
      // * Changes: as outline — 2px ink (annex §5).
      // * Default: 'text-highlighted bg-elevated ring ring-inset ring-accented'
      subtle: 'text-highlighted bg-elevated ring-2 ring-inset ring-accented',
      ghost:
        'text-highlighted bg-transparent hover:bg-elevated focus:bg-elevated disabled:bg-transparent dark:disabled:bg-transparent',
      // * Changes: 4.4 focus (header).
      // * Default: 'text-highlighted bg-transparent focus:outline-none'
      none: 'text-highlighted bg-transparent'
    },
    color: {
      primary: '',
      secondary: '',
      success: '',
      info: '',
      warning: '',
      error: '',
      neutral: ''
    },
    leading: {
      true: ''
    },
    trailing: {
      true: ''
    },
    loading: {
      true: ''
    },
    highlight: {
      true: ''
    },
    fixed: {
      false: ''
    },
    type: {
      file: 'file:me-1.5 file:font-medium file:text-muted file:outline-none'
    }
  },
  compoundVariants: [
    {
      color: 'primary',
      variant: ['outline', 'subtle'],
      // * Changes: 4.4 focus (header).
      // * Default: 'outline-primary/25 focus-visible:outline-3 focus-visible:ring-primary'
      class:
        'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary'
    },
    {
      color: 'secondary',
      variant: ['outline', 'subtle'],
      // * Changes: 4.4 focus (header).
      // * Default: 'outline-secondary/25 focus-visible:outline-3 focus-visible:ring-secondary'
      class:
        'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-secondary'
    },
    {
      color: 'success',
      variant: ['outline', 'subtle'],
      // * Changes: 4.4 focus (header).
      // * Default: 'outline-success/25 focus-visible:outline-3 focus-visible:ring-success'
      class:
        'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-success'
    },
    {
      color: 'info',
      variant: ['outline', 'subtle'],
      // * Changes: 4.4 focus (header).
      // * Default: 'outline-info/25 focus-visible:outline-3 focus-visible:ring-info'
      class:
        'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-info'
    },
    {
      color: 'warning',
      variant: ['outline', 'subtle'],
      // * Changes: 4.4 focus (header).
      // * Default: 'outline-warning/25 focus-visible:outline-3 focus-visible:ring-warning'
      class:
        'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-warning'
    },
    {
      color: 'error',
      variant: ['outline', 'subtle'],
      // * Changes: 4.4 focus (header).
      // * Default: 'outline-error/25 focus-visible:outline-3 focus-visible:ring-error'
      class:
        'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-error'
    },
    {
      color: 'primary',
      variant: ['soft', 'ghost'],
      class: 'outline-primary/25 focus-visible:outline-3'
    },
    {
      color: 'secondary',
      variant: ['soft', 'ghost'],
      class: 'outline-secondary/25 focus-visible:outline-3'
    },
    {
      color: 'success',
      variant: ['soft', 'ghost'],
      class: 'outline-success/25 focus-visible:outline-3'
    },
    {
      color: 'info',
      variant: ['soft', 'ghost'],
      class: 'outline-info/25 focus-visible:outline-3'
    },
    {
      color: 'warning',
      variant: ['soft', 'ghost'],
      class: 'outline-warning/25 focus-visible:outline-3'
    },
    {
      color: 'error',
      variant: ['soft', 'ghost'],
      class: 'outline-error/25 focus-visible:outline-3'
    },
    {
      color: 'primary',
      highlight: true,
      class: 'ring ring-inset ring-primary'
    },
    {
      color: 'secondary',
      highlight: true,
      class: 'ring ring-inset ring-secondary'
    },
    {
      color: 'success',
      highlight: true,
      class: 'ring ring-inset ring-success'
    },
    {
      color: 'info',
      highlight: true,
      class: 'ring ring-inset ring-info'
    },
    {
      color: 'warning',
      highlight: true,
      class: 'ring ring-inset ring-warning'
    },
    {
      color: 'error',
      highlight: true,
      class: 'ring ring-inset ring-error'
    },
    {
      color: 'neutral',
      variant: ['outline', 'subtle'],
      // * Changes: 4.4 focus (header).
      // * Default: 'outline-inverted/25 focus-visible:outline-3 focus-visible:ring-inverted'
      class:
        'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-inverted'
    },
    {
      color: 'neutral',
      variant: ['soft', 'ghost'],
      class: 'outline-inverted/25 focus-visible:outline-3'
    },
    {
      color: 'neutral',
      highlight: true,
      class: 'ring ring-inset ring-inverted'
    },
    {
      leading: true,
      size: 'xs',
      class: 'ps-7'
    },
    {
      leading: true,
      size: 'sm',
      class: 'ps-8'
    },
    {
      leading: true,
      size: 'md',
      class: 'ps-9'
    },
    {
      leading: true,
      size: 'lg',
      class: 'ps-10'
    },
    {
      leading: true,
      size: 'xl',
      class: 'ps-11'
    },
    {
      trailing: true,
      size: 'xs',
      class: 'pe-7'
    },
    {
      trailing: true,
      size: 'sm',
      class: 'pe-8'
    },
    {
      trailing: true,
      size: 'md',
      class: 'pe-9'
    },
    {
      trailing: true,
      size: 'lg',
      class: 'pe-10'
    },
    {
      trailing: true,
      size: 'xl',
      class: 'pe-11'
    },
    {
      loading: true,
      leading: true,
      class: {
        leadingIcon: 'animate-spin'
      }
    },
    {
      loading: true,
      leading: false,
      trailing: true,
      class: {
        trailingIcon: 'animate-spin'
      }
    },
    {
      fixed: false,
      size: 'xs',
      class: 'md:text-xs'
    },
    {
      fixed: false,
      size: 'sm',
      class: 'md:text-xs'
    },
    {
      fixed: false,
      size: 'md',
      class: 'md:text-sm'
    },
    {
      fixed: false,
      size: 'lg',
      class: 'md:text-sm'
    }
  ],
  defaultVariants: {
    size: 'md',
    color: 'primary',
    variant: 'outline'
  }
} satisfies InputConfig;
