import type { MainConfig } from '../../types/nuxt-ui';

export default {
  // * Changes: the height chain (stacks/frontend/nuxt/page-layout.md) has
  // * already subtracted the header, and nothing below it redoes that
  // * arithmetic — no 100vh, no calc over --ui-header-height. main is the one
  // * scrolling region, so it owns those classes instead of every page.
  // * min-h-0 out-ranks rather than deletes the upstream calc: a vendored
  // * config extends the upstream theme, so an omitted class still applies.
  // * Default: 'min-h-[calc(100vh-var(--ui-header-height))]'
  base: 'min-h-0 flex flex-1 flex-col overflow-y-auto'
} satisfies MainConfig;
