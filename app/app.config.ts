// ! Don't use aliases because .nuxt/ is not available during app.config.ts load in SSR mode
import button from './config/nuxt-ui/button';
import modal from './config/nuxt-ui/modal';

export default defineAppConfig({
  // https://ui.nuxt.com/getting-started/theme#design-system
  icon: { mode: 'svg', cssLayer: 'base' },
  ui: {
    colors: {
      primary: 'lavender',
      neutral: 'slate'
      // secondary: 'secondary',
      // info: 'info',
      // success: 'success',
      // warning: 'warning',
      // error: 'error',
      // accent: 'accent'
    },
    button,
    modal
  }
});
