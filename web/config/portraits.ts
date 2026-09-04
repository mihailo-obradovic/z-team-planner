// * Feature 021: the one place a portrait's rendered width is declared. `HeroPortrait` reads it per usage site and `nuxt.config.ts` derives `image.screens` from it, so the widths the app requests and the widths Vercel is allowed to produce cannot drift apart.

// * The largest master's edge in px (test/unit/portrait-masters.test.ts). No width × density may exceed it, and test/unit/portrait-sizes.test.ts holds that line; a smaller master answers a request above its own size with itself, since neither Vercel nor IPX enlarges.
export const PORTRAIT_MASTER = 512;

export const PORTRAIT_DENSITIES = [1, 2];

export type PortraitUsage =
  | 'header'
  | 'ribbon'
  | 'rail'
  | 'card'
  | 'tile'
  | 'synergy'
  | 'panel';

// * CSS px, from the class each usage site renders at (feature 021, the widths table): `size-6`, the `size-14` ribbon tile inside its border, the `w-24` rail inside two borders, `w-27`, the mission slot at its widest fluid tier, and `lg:w-56`. The dialog panel renders at 268 but declares 256, so its 2x candidate is exactly the master rather than an upscale; the 1x is stretched 4%, which is the smaller loss.
export const PORTRAIT_WIDTHS: Record<PortraitUsage, number> = {
  header: 24,
  ribbon: 52,
  rail: 90,
  card: 108,
  tile: 120,
  synergy: 224,
  panel: 256
};

// * Every width × density the component can request, keyed for `image.screens`. On Vercel this list is also the optimizer's allowed sizes, and a width missing from it is snapped up to the next one present.
export function portraitScreens(): Record<string, number> {
  const widths = Object.values(PORTRAIT_WIDTHS).flatMap((width) =>
    PORTRAIT_DENSITIES.map((density) => width * density)
  );
  const unique = [...new Set(widths)].sort((a, b) => a - b);

  return Object.fromEntries(
    unique.map((width) => [`portrait-${width}`, width])
  );
}
