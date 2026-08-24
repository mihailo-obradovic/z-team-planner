import type { BadgeConfig } from '../../types/nuxt-ui';

export default {
  slots: {
    // * Changes: badges are the annex's tag role — condensed, uppercase,
    // * heavily tracked. font-bold is explicit because a vendored config
    // * extends the upstream theme rather than replacing it — a deviation must
    // * out-rank the default, not omit it. Size stays upstream's.
    // * Default: 'font-medium inline-flex items-center'
    base: 'font-heading font-bold uppercase tracking-tag inline-flex items-center',
    label: 'truncate',
    leadingIcon: 'shrink-0',
    leadingAvatar: 'shrink-0',
    leadingAvatarSize: '',
    trailingIcon: 'shrink-0'
  },
  variants: {
    fieldGroup: {
      horizontal:
        'not-only:first:rounded-e-none not-only:last:rounded-s-none not-last:not-first:rounded-none focus-visible:z-[1]',
      vertical:
        'not-only:first:rounded-b-none not-only:last:rounded-t-none not-last:not-first:rounded-none focus-visible:z-[1]'
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
    variant: {
      solid: '',
      outline: '',
      soft: '',
      subtle: ''
    },
    size: {
      xs: {
        base: 'text-[8px]/3 px-1 py-0.5 gap-1 rounded-sm',
        leadingIcon: 'size-3',
        leadingAvatarSize: '3xs',
        trailingIcon: 'size-3'
      },
      sm: {
        base: 'text-[10px]/3 px-1.5 py-1 gap-1 rounded-sm',
        leadingIcon: 'size-3',
        leadingAvatarSize: '3xs',
        trailingIcon: 'size-3'
      },
      // * Changes: md is the badge the app actually uses — it sits in rows
      // * beside 32px controls, so it takes the 28px step (§4).
      // * Default: 'text-xs px-2 py-1 gap-1 rounded-md'
      md: {
        base: 'py-0 h-(--control-h-sm) px-2 gap-1 rounded-md',
        leadingIcon: 'size-4',
        leadingAvatarSize: '3xs',
        trailingIcon: 'size-4'
      },
      lg: {
        base: 'text-sm px-2 py-1 gap-1.5 rounded-md',
        leadingIcon: 'size-5',
        leadingAvatarSize: '2xs',
        trailingIcon: 'size-5'
      },
      xl: {
        base: 'text-base px-2.5 py-1 gap-1.5 rounded-md',
        leadingIcon: 'size-6',
        leadingAvatarSize: '2xs',
        trailingIcon: 'size-6'
      }
    },
    square: {
      true: ''
    }
  },
  compoundVariants: [
    {
      color: 'primary',
      variant: 'solid',
      class: 'bg-primary text-inverted'
    },
    {
      color: 'secondary',
      variant: 'solid',
      // * Changes: ink on teal is unreadable — cream, as on the button (§1).
      // * Default: 'bg-secondary text-inverted'
      class: 'bg-secondary text-neutral-100'
    },
    {
      color: 'success',
      variant: 'solid',
      class: 'bg-success text-inverted'
    },
    {
      color: 'info',
      variant: 'solid',
      class: 'bg-info text-inverted'
    },
    {
      color: 'warning',
      variant: 'solid',
      class: 'bg-warning text-inverted'
    },
    {
      color: 'error',
      variant: 'solid',
      class: 'bg-error text-inverted'
    },
    {
      color: 'primary',
      variant: 'outline',
      class: 'text-primary ring ring-inset ring-primary/50'
    },
    {
      color: 'secondary',
      variant: 'outline',
      class: 'text-secondary ring ring-inset ring-secondary/50'
    },
    {
      color: 'success',
      variant: 'outline',
      class: 'text-success ring ring-inset ring-success/50'
    },
    {
      color: 'info',
      variant: 'outline',
      class: 'text-info ring ring-inset ring-info/50'
    },
    {
      color: 'warning',
      variant: 'outline',
      class: 'text-warning ring ring-inset ring-warning/50'
    },
    {
      color: 'error',
      variant: 'outline',
      class: 'text-error ring ring-inset ring-error/50'
    },
    {
      color: 'primary',
      variant: 'soft',
      class: 'bg-primary/10 text-primary'
    },
    {
      color: 'secondary',
      variant: 'soft',
      class: 'bg-secondary/10 text-secondary'
    },
    {
      color: 'success',
      variant: 'soft',
      class: 'bg-success/10 text-success'
    },
    {
      color: 'info',
      variant: 'soft',
      class: 'bg-info/10 text-info'
    },
    {
      color: 'warning',
      variant: 'soft',
      class: 'bg-warning/10 text-warning'
    },
    {
      color: 'error',
      variant: 'soft',
      class: 'bg-error/10 text-error'
    },
    {
      color: 'primary',
      variant: 'subtle',
      class: 'bg-primary/10 text-primary ring ring-inset ring-primary/25'
    },
    {
      color: 'secondary',
      variant: 'subtle',
      class: 'bg-secondary/10 text-secondary ring ring-inset ring-secondary/25'
    },
    {
      color: 'success',
      variant: 'subtle',
      class: 'bg-success/10 text-success ring ring-inset ring-success/25'
    },
    {
      color: 'info',
      variant: 'subtle',
      class: 'bg-info/10 text-info ring ring-inset ring-info/25'
    },
    {
      color: 'warning',
      variant: 'subtle',
      class: 'bg-warning/10 text-warning ring ring-inset ring-warning/25'
    },
    {
      color: 'error',
      variant: 'subtle',
      class: 'bg-error/10 text-error ring ring-inset ring-error/25'
    },
    {
      color: 'neutral',
      variant: 'solid',
      class: 'text-inverted bg-inverted'
    },
    {
      color: 'neutral',
      variant: 'outline',
      class: 'ring ring-inset ring-accented text-default bg-default'
    },
    {
      color: 'neutral',
      variant: 'soft',
      class: 'text-default bg-elevated'
    },
    {
      color: 'neutral',
      variant: 'subtle',
      class: 'ring ring-inset ring-accented text-default bg-elevated'
    },
    {
      size: 'xs',
      square: true,
      class: 'p-0.5'
    },
    {
      size: 'sm',
      square: true,
      class: 'p-1'
    },
    {
      size: 'md',
      square: true,
      class: 'p-1'
    },
    {
      size: 'lg',
      square: true,
      class: 'p-1'
    },
    {
      size: 'xl',
      square: true,
      class: 'p-1'
    }
  ],
  defaultVariants: {
    color: 'primary',
    variant: 'solid',
    size: 'md'
  }
} satisfies BadgeConfig;
