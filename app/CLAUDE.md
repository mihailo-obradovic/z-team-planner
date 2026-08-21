# app/ — Nuxt application

The frontend of the Z-Team build calculator: a Nuxt 4 (Vue, TypeScript) SSR app using NuxtUI v4 + Tailwind 4. A folder-scoped document is an orientation map (what lives where + pointers into `catalyst/`), never global rules or feature contracts.

Paths below are relative to the repo root. The `catalyst/` documents are normative for how this code is written; this file only says what lives where.

## Structure

- `pages/index.vue` — the single route; the whole planner lives on it (`/` is prerendered via `routeRules`).
- `components/` — planner components (`HeroCard`, `HeroDetailDialog`); `_shared/` is the auto-import dir (`nuxt.config.ts` `components.dirs`) for generic pieces (`BuildManager`, `PlannerFilters`, `IconButton`, `TooltipButton`).
- `composables/` — auto-imported feature logic: `useHeroPlanner` (roster state), `useHeroLevelUp`, `useHeroPowerTraining`, `useHeroFlightTraining`, `useHeroEpisodeSetup` (ep3 cut / ep4 hire flags), `useBuildPersistence` (localStorage + URL-param serialization).
- `types/` — `hero.ts` and `build.ts` domain types; `nuxt-ui.d.ts` theme-config helper types.
- `config/nuxt-ui/` — global NuxtUI theme customizations, loaded from `app.config.ts`.
- `utils/iconsMap.ts` — Lucide + custom icon registry.
- `assets/` — CSS (`main.css`), custom icons.

Hero base data is served by `server/api/heroes.get.ts` (Nitro, outside this folder) — a static dataset transcribed from `catalyst/context/game-mechanics.md`.

## Governing documents

- Vue component style → `catalyst/stacks/frontend/_vue/vue-style.md`
- Component file naming → `catalyst/stacks/frontend/_common/component-naming.md` and `catalyst/stacks/frontend/_vue/component-naming.md`
- Routing (`pages/`) → `catalyst/stacks/frontend/nuxt/routing.md`
- Data fetching / server interaction → `catalyst/stacks/frontend/nuxt/data-layer.md`
- Client state (composables) → `catalyst/stacks/frontend/nuxt/client-state.md`
- Types (`types/`) → `catalyst/stacks/_lang/typescript/typescript-types.md`
- NuxtUI usage and theming (`config/nuxt-ui/`) → `catalyst/stacks/frontend/nuxt/ui/nuxtui/nuxtui.md` and `customization.md`
- SSR behavior → `catalyst/stacks/frontend/nuxt/addons/ssr.md`

## Local invariants

- Builds persist client-side only (localStorage keys `z-team-builds`, `z-team-active-build`) and share via the `build` URL parameter — the serialized-build format in `useBuildPersistence.ts`/`types/build.ts` is what shared links depend on; treat it as a protected area and keep it backward-compatible.
- Hero ids (`types/hero.ts`, `server/api/heroes.get.ts`) are referenced by saved/shared builds; renaming one breaks existing builds.
- Game data mirrors `catalyst/context/game-mechanics.md` — change data only against that reference, not from memory.
