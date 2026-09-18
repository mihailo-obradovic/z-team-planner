// * Rendered at lg and up (labelled), md (icon), and sm and down (bare).
export type HeaderTier = 'labelled' | 'icon' | 'bare';

// * The classes that show a control at its tier and nowhere else; every tier of one control is mounted (app.vue).
export const HEADER_TIER_CLASS: Record<HeaderTier, string> = {
  labelled: 'hidden lg:inline-flex',
  icon: 'hidden md:inline-flex lg:hidden',
  bare: 'flex md:hidden'
};

// * The shell's main landmark, named here so the skip link and the landmark itself cannot drift apart.
export const MAIN_CONTENT_ID = 'main-content';
