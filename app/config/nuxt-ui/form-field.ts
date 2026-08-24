import type { FormFieldConfig } from '../../types/nuxt-ui';

export default {
  slots: {
    root: '',
    wrapper: '',
    labelWrapper: 'flex content-center items-center justify-between gap-1',
    // * Changes: a field label is the annex's label role — condensed,
    // * uppercase, tracked, and toned rather than full ink so the control it
    // * names stays the loudest thing in the group.
    // * Default: 'block font-medium text-default'
    label: 'block font-heading font-bold uppercase tracking-label text-toned',
    container: 'relative',
    description: 'text-muted',
    error: 'mt-2 text-error',
    hint: 'text-muted',
    help: 'mt-2 text-muted'
  },
  variants: {
    size: {
      xs: {
        root: 'text-xs'
      },
      sm: {
        root: 'text-xs'
      },
      md: {
        root: 'text-sm'
      },
      lg: {
        root: 'text-sm'
      },
      xl: {
        root: 'text-base'
      }
    },
    required: {
      true: {
        label: "after:content-['*'] after:ms-0.5 after:text-error"
      }
    },
    orientation: {
      vertical: {
        container: 'mt-1'
      },
      horizontal: {
        root: 'flex justify-between place-items-baseline gap-2'
      }
    }
  },
  defaultVariants: {
    size: 'md',
    orientation: 'vertical'
  }
} satisfies FormFieldConfig;
