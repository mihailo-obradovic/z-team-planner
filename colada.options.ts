import type { PiniaColadaOptions } from '@pinia/colada';

// * Read by `@pinia/colada-nuxt` from the project root. Stated rather than inherited, so a Pinia Colada upgrade that moves a default cannot change the app silently.
export default {
  queryOptions: {
    staleTime: 5_000,
    // ! Pinia Colada's default is `true`. Off here: data refreshes on mount, on reconnect and on invalidation, never over what is on screen; a save over another device's edit is caught by the `412` dialog (feature 008).
    refetchOnWindowFocus: false
  }
} satisfies PiniaColadaOptions;
