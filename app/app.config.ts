// ! Don't use aliases because .nuxt/ is not available during app.config.ts load in SSR mode
import badge from './config/nuxt-ui/badge';
import button from './config/nuxt-ui/button';
import dropdownMenu from './config/nuxt-ui/dropdown-menu';
import formField from './config/nuxt-ui/form-field';
import header from './config/nuxt-ui/header';
import input from './config/nuxt-ui/input';
import main from './config/nuxt-ui/main';
import modal from './config/nuxt-ui/modal';
import select from './config/nuxt-ui/select';
import switchConfig from './config/nuxt-ui/switch';
import tabs from './config/nuxt-ui/tabs';
import toast from './config/nuxt-ui/toast';
import toaster from './config/nuxt-ui/toaster';
import tooltip from './config/nuxt-ui/tooltip';

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
    badge,
    button,
    dropdownMenu,
    formField,
    header,
    input,
    main,
    modal,
    select,
    switch: switchConfig,
    tabs,
    toast,
    toaster,
    tooltip
  }
});
