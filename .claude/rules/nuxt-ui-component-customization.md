# NuxtUI Component Customization

## Overview

NuxtUI component configurations are stored in `@/config/nuxt-ui`. By default, these files contain the exact values copied from the NuxtUI documentation. These are then loaded in `@/app.config.ts`. Since the app is in SSR mode, we also need the type helper in `@/types/nuxt-ui.d.ts`.

## Process

1. If the component does not exist, copy its default configuration from the NuxtUI documentation -> component in question -> #theme. Only take the contents of the component object, since the wrappers are already included in `@/app.config.ts`. Make sure to include the type helper in `@/types/nuxt-ui.d.ts` accordingly and that the component is loaded in `@/app.config.ts`.

2. If a change is requested, do NOT overwrite the default value.

    a) If we are just adding classes, change the classlist string to an array of strings, e.g.:

    ```ts
    base: [
        'rounded-md font-medium inline-flex items-center disabled:cursor-not-allowed aria-disabled:cursor-not-allowed disabled:opacity-75 aria-disabled:opacity-75',
        'transition-colors',
        // * Changes:
        'justify-center'
    ],
    ```

    where `base` is the slot name, the first array element is the default classlist string, and the second array element are the changes.

    b) If we are changing the default value of a prop, add an inline comment with the default value, e.g.:

    ```ts
    color: 'secondary', // * Default: 'neutral'
    ```

    where `color` is the prop name, `secondary` is the new value, and `neutral` is the default value.

    c) If we are adding a new variant, add a comment mentioning that, e.g.:

    ```ts
      // * New type
      faded: {
        border: 'border-solid',
        root: 'mask-[linear-gradient(to_right,transparent_0px,white_120px,white_calc(100%-120px),transparent_100%)]'
      }
    ```
