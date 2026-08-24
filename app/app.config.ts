// ! Don't use aliases because .nuxt/ is not available during app.config.ts load in SSR mode
import button from './config/nuxt-ui/button';
import modal from './config/nuxt-ui/modal';

export default defineAppConfig({
  // https://ui.nuxt.com/getting-started/theme#design-system
  icon: { mode: 'svg', cssLayer: 'base' },
  ui: {
    // * Ramps and roles: catalyst/annexes/design-system.md §1
    colors: {
      primary: 'ember',
      secondary: 'lagoon',
      success: 'moss',
      info: 'signal',
      warning: 'gold',
      error: 'brick',
      neutral: 'paper'
    },
    button,
    modal
  }
});
