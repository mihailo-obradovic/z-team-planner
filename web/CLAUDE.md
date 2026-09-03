# web/ — Nuxt application

The frontend of the Z-Team build calculator: a Nuxt 4 (Vue, TypeScript) SSR app using NuxtUI v4 + Tailwind 4, living in `web/` (`srcDir` in `nuxt.config.ts`) so the FastAPI application can take the root `app/` (decision 004). A folder-scoped document is an orientation map (what lives where + pointers into `catalyst/`), never global rules or feature contracts.

Paths below are relative to the repo root. The `catalyst/` documents are normative for how this code is written; this file only says what lives where.

## Structure

- `pages/index.vue` — the planner (`/` is prerendered via `routeRules`); `pages/b/[id].vue` — the read-only view of a shared account build (`/b/**` is `ssr: false`).
- `services/` — one pure `*.api.ts` per resource (no store, toast, or cache access) plus `services/queries/` for the Pinia Colada composables that wrap them, alongside `chainOnSettled.ts`, the helper that lets a caller's callbacks run after the query layer's own; imported explicitly, never auto-imported.
- `stores/` — `useAuthStore`, the only Pinia store: identity and the active account build id, never server data.
- `components/` — planner components (`HeroCard`, `HeroDetailDialog`); `_shared/` is the auto-import dir (`nuxt.config.ts` `components.dirs`) for generic pieces (`BuildManager`, `BuildDialogs`, `BuildAccountDialogs`, `BuildConflictDialog`, `AuthMenu`, `AccountDialogs`, `FirstLoginOffer`, `FirstRunBanners`, `BudgetCounters`, `StorySetupDrawer`, `IconButton`, `TooltipButton`, `StatRadar` — the hand-drawn stat radar, decision 008).
- `composables/` — auto-imported feature logic: `useAppQuery`/`useAppMutation`/`useApiErrorWatcher` (the query wrappers), `useHeroPlanner` (roster state), `useHeroLevelUp`, `useHeroPowerTraining`, `useHeroFlightTraining`, `useHeroEpisodeSetup` (ep3 cut / ep4 hire flags), `useMissionSimulator` (the mission team's positional slots with the spawned illusion and Golem-copy occupants, and the guarded template/setting writes — feature 015), `useActiveTab` (the `?tab=` URL sync; the tab never enters the build document), `usePlannerState` (the planner refs as one object), `useLocalBuilds` (local-build CRUD, and the save orchestration around it), `useBuildMode` (whether the planner holds the user's build or someone else's), `useBuildSharing` (the `?build=` link), `useUnsavedChanges` (dirty tracking + the leave-site prompt), `useInitialBuild` (which build the planner opens with) and `useLocalStorageRef`, `useBuildDialogs` (open state for the build dialogs, which mount once at the shell while their controls render in two places, plus which header tier's build selector is open), `useAccountDialogs` (the same, for the delete-account dialog), `useAuth` (Google sign-in and sign-out), the form trio `useBuildNameForm` / `useValidationErrors` / `useExternalErrors`, which turn a server `422` into an inline field error, and `useTweenedValues` (the radar's rAF tween, which honours `prefers-reduced-motion`).
- `types/` — `hero.ts` and `build.ts` domain types; `api.ts` the Zod response schemas and the types inferred from them; `auth.ts` the auth state union; `ui.ts` the header tier ladder as a value; `nuxt-ui.d.ts` theme-config helper types.
- `config/nuxt-ui/` — one vendored theme per NuxtUI component the app renders, loaded from `app.config.ts`. Each holds the complete upstream default with the project's deviations annotated on top; a config extends the upstream theme rather than replacing it, so a deviation has to out-rank the default, not omit it.
- `utils/` — `statIcons.ts` (the Lucide glyph per stat), `fetcher.ts` (the one path to the API, with its single 401 retry), `handleApiError.ts` (the central error policy), `parseResponse.ts`, `isSerializedBuild.ts` (the one gate both build-document paths run through), `buildDocument.ts` (the protected serialize/deserialize pair), `buildUrlCodec.ts` (the `?build=` base64), `missionTemplates.ts` (the simulator's random roll), `radarCoverage.ts` (the shared-area geometry behind the mission estimate), `formatTimestamp.ts` (the only module that parses a timestamp).
- `plugins/` — `firebase.client.ts`, which owns the `onAuthStateChanged` subscription named in the invariants below, and `hide-devtools-webcomponents.client.ts`.
- `assets/css/main.css` — the design tokens: colour ramps, the type scale, the `--ui-*` surface remap, and the `panel`/`plate` utilities.

Hero base data is the `HEROES` constant in `types/hero.ts`, transcribed from `catalyst/context/game-mechanics.md`. It shipped as a Nitro route until feature 006 retired it; there is no `server/` directory and the app makes no `useFetch`/`useAsyncData` call.

## Governing documents

- Vue component style → `catalyst/stacks/frontend/_vue/vue-style.md`
- Component file naming → `catalyst/stacks/frontend/_common/component-naming.md` and `catalyst/stacks/frontend/_vue/component-naming.md`
- Routing (`pages/`) → `catalyst/stacks/frontend/nuxt/routing.md`
- Page height and scrolling regions → `catalyst/stacks/frontend/nuxt/page-layout.md`
- Data fetching / server interaction → `catalyst/stacks/frontend/nuxt/data-layer.md`
- Client state (composables) → `catalyst/stacks/frontend/nuxt/client-state.md`
- Types (`types/`) → `catalyst/stacks/_lang/typescript/typescript-types.md`
- NuxtUI usage and theming (`config/nuxt-ui/`) → `catalyst/stacks/frontend/nuxt/ui/nuxtui/nuxtui.md` and `customization.md`
- Design tokens, type scale, spacing, control heights, colour roles → `catalyst/annexes/design-system.md` (the project's own design system; load it before styling anything)
- SSR behavior → `catalyst/stacks/frontend/nuxt/addons/ssr.md`

## Local invariants

- Builds persist client-side only (localStorage keys `z-team-builds`, `z-team-active-build`; `z-team-import-offer-seen` records that the first-login offer has been answered, and `z-team-spoiler-acknowledged` / `z-team-storage-notice-acknowledged` that each first-run banner has been confirmed) and share via the `build` URL parameter — the serialized-build format in `utils/buildDocument.ts`/`types/build.ts` is a protected area owned by `catalyst/features/001_build-persistence.md`; keep it backward-compatible.
- Hero ids (`types/hero.ts`) are referenced by saved/shared builds; renaming one breaks existing builds.
- Game data mirrors `catalyst/context/game-mechanics.md` — change data only against that reference, not from memory.
- Styling values come from `catalyst/annexes/design-system.md`, never a raw hex or an off-scale px. Colour is named through the seven semantic aliases, never a ramp name.
- `BuildManager`, `BuildDialogs`, `BuildAccountDialogs`, `BuildConflictDialog`, `FirstLoginOffer` and `FirstRunBanners` are wrapped in `ClientOnly` in `app.vue` because they render localStorage state; server-rendering them desynchronises hydration and every id below it. `AccountDialogs` sits outside that wrapper — it renders nothing until the profile menu opens it, so it has no local state to disagree about.
- No component calls the network, holds a loading `ref`, or wraps a query in try-catch — the query layer and `handleApiError` own that (feature 006).
- **The auth store has one writer, and one documented exception.** `onAuthStateChanged` in the Firebase plugin is the source of auth truth; `useAuth` calls the SDK and lets the subscription report the outcome, so sign-in and sign-out cannot leave the store disagreeing with it. The exception is a second `401`, where the central policy signs the user out _locally_ through `resetUser` (feature 004, "signs the user out locally"; feature 006's central policy) — a token the API has rejected twice must not leave the UI signed in, and a local reset cannot fail the way an SDK round-trip can. The SDK may still hold a `currentUser` afterwards; nothing fetches with it, because every user-scoped query is gated on `isSignedIn`.
- **The account control renders outside `ClientOnly`.** The store starts `unknown` on the server and on the first client render alike, so both draw the same reserved slot — that is what keeps the prerendered header from showing the wrong button.
- The shell's tier ladder (`app.vue`, annex §13) is CSS-only: the header renders the build cluster twice and the Story Setup and account controls three times each, hidden per breakpoint. Because all of them are mounted, one control opening another names the tier it belongs to (`useBuildDialogs`'s `buildMenuTier`) rather than flipping a shared boolean, which would open every copy at once. A JS breakpoint would have to resolve before first paint or the header flickers through the wrong tier on load.
