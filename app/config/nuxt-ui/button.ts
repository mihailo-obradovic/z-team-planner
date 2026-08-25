import type { ButtonConfig } from '../../types/nuxt-ui';

export default {
  slots: {
    // * Changes: a button is the annex's label role — condensed, uppercase and tracked. Disabled drops to 40% (§7). font-bold is explicit because a vendored config EXTENDS the upstream theme rather than replacing it — an omitted class is still contributed by the default, so a deviation has to out-rank it. Type size stays upstream's per-size mapping (md is already the design's 14px); only tracking is a decision here.
    // * Default: 'rounded-md font-medium inline-flex items-center disabled:cursor-not-allowed aria-disabled:cursor-not-allowed disabled:opacity-75 aria-disabled:opacity-75'
    base: [
      'rounded-md font-heading font-bold uppercase tracking-label inline-flex items-center disabled:cursor-not-allowed aria-disabled:cursor-not-allowed disabled:opacity-40 aria-disabled:opacity-40',
      'transition-colors'
    ],
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
      subtle: '',
      ghost: '',
      link: ''
    },
    // * Changes: heights come from the annex §4 control scale instead of padding, so a row of mixed controls aligns without per-case fixes. Icon sizes follow §9 (16 beside a label, 20 standalone). py-0 lets the height token decide the box rather than the upstream padding. Default (xs..xl base): 'px-2 py-1 text-xs gap-1', 'px-2.5 py-1.5 text-xs gap-1.5', 'px-2.5 py-1.5 text-sm gap-1.5', 'px-3 py-2 text-sm gap-2', 'px-3 py-2 text-base gap-2'
    size: {
      xs: {
        base: 'py-0 h-(--control-h-xs) px-2 gap-1',
        leadingIcon: 'size-4',
        leadingAvatarSize: '3xs',
        trailingIcon: 'size-4'
      },
      sm: {
        base: 'py-0 h-(--control-h-sm) px-2.5 gap-1.5',
        leadingIcon: 'size-4',
        leadingAvatarSize: '3xs',
        trailingIcon: 'size-4'
      },
      md: {
        base: 'py-0 h-(--control-h-default) px-3 gap-2',
        leadingIcon: 'size-4',
        leadingAvatarSize: '2xs',
        trailingIcon: 'size-4'
      },
      lg: {
        base: 'py-0 h-(--control-h-lg) px-4 gap-2',
        leadingIcon: 'size-5',
        leadingAvatarSize: '2xs',
        trailingIcon: 'size-5'
      },
      // * xl shares the lg step: the scale has four heights, not five.
      xl: {
        base: 'py-0 h-(--control-h-lg) px-5 gap-2',
        leadingIcon: 'size-5',
        leadingAvatarSize: 'xs',
        trailingIcon: 'size-5'
      }
    },
    block: {
      true: {
        base: 'w-full justify-center',
        trailingIcon: 'ms-auto'
      }
    },
    square: {
      true: ''
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
    // * Changes: the gold halo half of the on state — `.chip.on` and `.tab.active` both carry it, and tabs.ts already spends the same shadow for the active tab. The other half is the fill, and it cannot live here: tailwind-variants appends compound classes after variant ones, so a bg set on this variant would lose to the colour compounds below. It is a pair of compound entries at the end of that array instead. Default: both states empty.
    active: {
      true: {
        base: 'shadow-[0_0_0_1px_var(--ui-color-warning-500)]'
      },
      false: {
        base: ''
      }
    }
  },
  compoundVariants: [
    {
      color: 'primary',
      variant: 'solid',
      class:
        'text-inverted bg-primary hover:bg-primary/75 active:bg-primary/75 disabled:bg-primary aria-disabled:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
    },
    {
      color: 'secondary',
      variant: 'solid',
      // * Changes: text-inverted is ink (annex §1), which is right on the amber and gold solids but unreadable on teal — cream instead.
      // * Default: 'text-inverted bg-secondary …'
      class:
        'text-neutral-100 bg-secondary hover:bg-secondary/75 active:bg-secondary/75 disabled:bg-secondary aria-disabled:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary'
    },
    {
      color: 'success',
      variant: 'solid',
      class:
        'text-inverted bg-success hover:bg-success/75 active:bg-success/75 disabled:bg-success aria-disabled:bg-success focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-success'
    },
    {
      color: 'info',
      variant: 'solid',
      class:
        'text-inverted bg-info hover:bg-info/75 active:bg-info/75 disabled:bg-info aria-disabled:bg-info focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-info'
    },
    {
      color: 'warning',
      variant: 'solid',
      class:
        'text-inverted bg-warning hover:bg-warning/75 active:bg-warning/75 disabled:bg-warning aria-disabled:bg-warning focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warning'
    },
    {
      color: 'error',
      variant: 'solid',
      class:
        'text-inverted bg-error hover:bg-error/75 active:bg-error/75 disabled:bg-error aria-disabled:bg-error focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error'
    },
    {
      color: 'primary',
      variant: 'outline',
      class:
        'ring ring-inset ring-primary/50 text-primary hover:bg-primary/10 active:bg-primary/10 disabled:bg-transparent aria-disabled:bg-transparent dark:disabled:bg-transparent dark:aria-disabled:bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-primary'
    },
    {
      color: 'secondary',
      variant: 'outline',
      class:
        'ring ring-inset ring-secondary/50 text-secondary hover:bg-secondary/10 active:bg-secondary/10 disabled:bg-transparent aria-disabled:bg-transparent dark:disabled:bg-transparent dark:aria-disabled:bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary'
    },
    {
      color: 'success',
      variant: 'outline',
      class:
        'ring ring-inset ring-success/50 text-success hover:bg-success/10 active:bg-success/10 disabled:bg-transparent aria-disabled:bg-transparent dark:disabled:bg-transparent dark:aria-disabled:bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-success'
    },
    {
      color: 'info',
      variant: 'outline',
      class:
        'ring ring-inset ring-info/50 text-info hover:bg-info/10 active:bg-info/10 disabled:bg-transparent aria-disabled:bg-transparent dark:disabled:bg-transparent dark:aria-disabled:bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-info'
    },
    {
      color: 'warning',
      variant: 'outline',
      class:
        'ring ring-inset ring-warning/50 text-warning hover:bg-warning/10 active:bg-warning/10 disabled:bg-transparent aria-disabled:bg-transparent dark:disabled:bg-transparent dark:aria-disabled:bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-warning'
    },
    {
      color: 'error',
      variant: 'outline',
      class:
        'ring ring-inset ring-error/50 text-error hover:bg-error/10 active:bg-error/10 disabled:bg-transparent aria-disabled:bg-transparent dark:disabled:bg-transparent dark:aria-disabled:bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-error'
    },
    {
      color: 'primary',
      variant: 'soft',
      class:
        'text-primary bg-primary/10 hover:bg-primary/15 active:bg-primary/15 focus:outline-none focus-visible:bg-primary/15 disabled:bg-primary/10 aria-disabled:bg-primary/10'
    },
    {
      color: 'secondary',
      variant: 'soft',
      class:
        'text-secondary bg-secondary/10 hover:bg-secondary/15 active:bg-secondary/15 focus:outline-none focus-visible:bg-secondary/15 disabled:bg-secondary/10 aria-disabled:bg-secondary/10'
    },
    {
      color: 'success',
      variant: 'soft',
      class:
        'text-success bg-success/10 hover:bg-success/15 active:bg-success/15 focus:outline-none focus-visible:bg-success/15 disabled:bg-success/10 aria-disabled:bg-success/10'
    },
    {
      color: 'info',
      variant: 'soft',
      class:
        'text-info bg-info/10 hover:bg-info/15 active:bg-info/15 focus:outline-none focus-visible:bg-info/15 disabled:bg-info/10 aria-disabled:bg-info/10'
    },
    {
      color: 'warning',
      variant: 'soft',
      class:
        'text-warning bg-warning/10 hover:bg-warning/15 active:bg-warning/15 focus:outline-none focus-visible:bg-warning/15 disabled:bg-warning/10 aria-disabled:bg-warning/10'
    },
    {
      color: 'error',
      variant: 'soft',
      class:
        'text-error bg-error/10 hover:bg-error/15 active:bg-error/15 focus:outline-none focus-visible:bg-error/15 disabled:bg-error/10 aria-disabled:bg-error/10'
    },
    {
      color: 'primary',
      variant: 'subtle',
      class:
        'text-primary ring ring-inset ring-primary/25 bg-primary/10 hover:bg-primary/15 active:bg-primary/15 disabled:bg-primary/10 aria-disabled:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary'
    },
    {
      color: 'secondary',
      variant: 'subtle',
      class:
        'text-secondary ring ring-inset ring-secondary/25 bg-secondary/10 hover:bg-secondary/15 active:bg-secondary/15 disabled:bg-secondary/10 aria-disabled:bg-secondary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary'
    },
    {
      color: 'success',
      variant: 'subtle',
      class:
        'text-success ring ring-inset ring-success/25 bg-success/10 hover:bg-success/15 active:bg-success/15 disabled:bg-success/10 aria-disabled:bg-success/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-success'
    },
    {
      color: 'info',
      variant: 'subtle',
      class:
        'text-info ring ring-inset ring-info/25 bg-info/10 hover:bg-info/15 active:bg-info/15 disabled:bg-info/10 aria-disabled:bg-info/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-info'
    },
    {
      color: 'warning',
      variant: 'subtle',
      class:
        'text-warning ring ring-inset ring-warning/25 bg-warning/10 hover:bg-warning/15 active:bg-warning/15 disabled:bg-warning/10 aria-disabled:bg-warning/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-warning'
    },
    {
      color: 'error',
      variant: 'subtle',
      class:
        'text-error ring ring-inset ring-error/25 bg-error/10 hover:bg-error/15 active:bg-error/15 disabled:bg-error/10 aria-disabled:bg-error/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-error'
    },
    {
      color: 'primary',
      variant: 'ghost',
      class:
        'text-primary hover:bg-primary/10 active:bg-primary/10 focus:outline-none focus-visible:bg-primary/10 disabled:bg-transparent aria-disabled:bg-transparent dark:disabled:bg-transparent dark:aria-disabled:bg-transparent'
    },
    {
      color: 'secondary',
      variant: 'ghost',
      class:
        'text-secondary hover:bg-secondary/10 active:bg-secondary/10 focus:outline-none focus-visible:bg-secondary/10 disabled:bg-transparent aria-disabled:bg-transparent dark:disabled:bg-transparent dark:aria-disabled:bg-transparent'
    },
    {
      color: 'success',
      variant: 'ghost',
      class:
        'text-success hover:bg-success/10 active:bg-success/10 focus:outline-none focus-visible:bg-success/10 disabled:bg-transparent aria-disabled:bg-transparent dark:disabled:bg-transparent dark:aria-disabled:bg-transparent'
    },
    {
      color: 'info',
      variant: 'ghost',
      class:
        'text-info hover:bg-info/10 active:bg-info/10 focus:outline-none focus-visible:bg-info/10 disabled:bg-transparent aria-disabled:bg-transparent dark:disabled:bg-transparent dark:aria-disabled:bg-transparent'
    },
    {
      color: 'warning',
      variant: 'ghost',
      class:
        'text-warning hover:bg-warning/10 active:bg-warning/10 focus:outline-none focus-visible:bg-warning/10 disabled:bg-transparent aria-disabled:bg-transparent dark:disabled:bg-transparent dark:aria-disabled:bg-transparent'
    },
    {
      color: 'error',
      variant: 'ghost',
      class:
        'text-error hover:bg-error/10 active:bg-error/10 focus:outline-none focus-visible:bg-error/10 disabled:bg-transparent aria-disabled:bg-transparent dark:disabled:bg-transparent dark:aria-disabled:bg-transparent'
    },
    {
      color: 'primary',
      variant: 'link',
      class:
        'text-primary hover:text-primary/75 active:text-primary/75 disabled:text-primary aria-disabled:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary'
    },
    {
      color: 'secondary',
      variant: 'link',
      class:
        'text-secondary hover:text-secondary/75 active:text-secondary/75 disabled:text-secondary aria-disabled:text-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-secondary'
    },
    {
      color: 'success',
      variant: 'link',
      class:
        'text-success hover:text-success/75 active:text-success/75 disabled:text-success aria-disabled:text-success focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-success'
    },
    {
      color: 'info',
      variant: 'link',
      class:
        'text-info hover:text-info/75 active:text-info/75 disabled:text-info aria-disabled:text-info focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-info'
    },
    {
      color: 'warning',
      variant: 'link',
      class:
        'text-warning hover:text-warning/75 active:text-warning/75 disabled:text-warning aria-disabled:text-warning focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-warning'
    },
    {
      color: 'error',
      variant: 'link',
      class:
        'text-error hover:text-error/75 active:text-error/75 disabled:text-error aria-disabled:text-error focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-error'
    },
    {
      color: 'neutral',
      variant: 'solid',
      class:
        'text-inverted bg-inverted hover:bg-inverted/90 active:bg-inverted/90 disabled:bg-inverted aria-disabled:bg-inverted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-inverted'
    },
    {
      color: 'neutral',
      variant: 'outline',
      class:
        'ring ring-inset ring-accented text-default bg-default hover:bg-elevated active:bg-elevated disabled:bg-default aria-disabled:bg-default focus:outline-none focus-visible:ring-2 focus-visible:ring-inverted'
    },
    {
      color: 'neutral',
      variant: 'soft',
      class:
        'text-default bg-elevated hover:bg-accented/75 active:bg-accented/75 focus:outline-none focus-visible:bg-accented/75 disabled:bg-elevated aria-disabled:bg-elevated'
    },
    {
      color: 'neutral',
      variant: 'subtle',
      class:
        'ring ring-inset ring-accented text-default bg-elevated hover:bg-accented/75 active:bg-accented/75 disabled:bg-elevated aria-disabled:bg-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-inverted'
    },
    {
      color: 'neutral',
      variant: 'ghost',
      class:
        'text-default hover:bg-elevated active:bg-elevated focus:outline-none focus-visible:bg-elevated hover:disabled:bg-transparent dark:hover:disabled:bg-transparent hover:aria-disabled:bg-transparent dark:hover:aria-disabled:bg-transparent'
    },
    {
      color: 'neutral',
      variant: 'link',
      class:
        'text-muted hover:text-default active:text-default disabled:text-muted aria-disabled:text-muted focus:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-inverted'
    },
    // * Changes: a square button is square at its control height (§4), not a padded rectangle, so padding is dropped for aspect-square + centring. Default (xs..xl): 'p-1', 'p-1.5', 'p-1.5', 'p-2', 'p-2'
    {
      size: 'xs',
      square: true,
      class: 'aspect-square justify-center p-0'
    },
    {
      size: 'sm',
      square: true,
      class: 'aspect-square justify-center p-0'
    },
    {
      size: 'md',
      square: true,
      class: 'aspect-square justify-center p-0'
    },
    {
      size: 'lg',
      square: true,
      class: 'aspect-square justify-center p-0'
    },
    {
      size: 'xl',
      square: true,
      class: 'aspect-square justify-center p-0'
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
    // * Changes: the fill half of the on state, and the reason it is down here rather than on the `active` variant — tailwind-variants appends compound classes in source order, so these have to sit after the colour compounds to out-rank them. The boards draw an on control as a solid of its own colour with ink on it and an ink edge (`.chip.on`: #df8a20 on #241f14, against the off chip's tan `.chip`), so `active` flips the fill rather than tinting it — a `subtle` control reads as `solid` while it is on, which is the whole point of the state. Upstream has no active treatment at all.
    {
      active: true,
      color: 'primary',
      class:
        'text-inverted bg-primary hover:bg-primary/75 ring ring-inset ring-inverted'
    },
    {
      active: true,
      color: 'secondary',
      // * Cream, not ink, for the same reason the secondary solid above carries it: ink on teal is unreadable (annex §1).
      class:
        'text-neutral-100 bg-secondary hover:bg-secondary/75 ring ring-inset ring-inverted'
    },
    {
      active: true,
      color: 'success',
      class:
        'text-inverted bg-success hover:bg-success/75 ring ring-inset ring-inverted'
    },
    {
      active: true,
      color: 'info',
      class:
        'text-inverted bg-info hover:bg-info/75 ring ring-inset ring-inverted'
    },
    {
      active: true,
      color: 'warning',
      class:
        'text-inverted bg-warning hover:bg-warning/75 ring ring-inset ring-inverted'
    },
    {
      active: true,
      color: 'error',
      class:
        'text-inverted bg-error hover:bg-error/75 ring ring-inset ring-inverted'
    },
    {
      active: true,
      color: 'neutral',
      class:
        'text-inverted bg-inverted hover:bg-inverted/90 ring ring-inset ring-inverted'
    }
  ],
  defaultVariants: {
    color: 'primary',
    variant: 'solid',
    size: 'md'
  }
} satisfies ButtonConfig;
