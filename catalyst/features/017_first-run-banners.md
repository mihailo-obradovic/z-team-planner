# Feature: First-run banners

## Status

Active

## Task Weight

Easy

## Purpose

The planner shows the whole roster and every power at once, including heroes who arrive in episode 8 and upgrades a player may not have unlocked. A visitor who opens it mid-playthrough is spoiled before they have read a word. This feature gives them a warning first, acknowledged once.

The same first run is the honest moment to say where a build is kept, since the app writes to the visitor's browser without asking. Neither banner is consent — the app sets no cookies and runs no analytics (feature 010), and nothing is withheld while a banner is up. They are notices: read, acknowledge, gone.

## Inputs

| Input                                | Type     | Source                | Constraints                                                      |
| ------------------------------------ | -------- | --------------------- | ---------------------------------------------------------------- |
| `z-team-spoiler-acknowledged`        | `'1'`    | `localStorage`        | absent or unreadable → the banner shows; any value → it does not |
| `z-team-storage-notice-acknowledged` | `'1'`    | `localStorage`        | absent or unreadable → the banner shows; any value → it does not |
| confirm click                        | UI event | one button per banner | acknowledges that banner alone                                   |

## Outputs And Side Effects

| Output / Side Effect                 | Type           | Description                                                       |
| ------------------------------------ | -------------- | ----------------------------------------------------------------- |
| banner region                        | UI             | a column of unacknowledged banners at the bottom of the app shell |
| `z-team-spoiler-acknowledged`        | `localStorage` | written `'1'` when the spoiler banner is confirmed                |
| `z-team-storage-notice-acknowledged` | `localStorage` | written `'1'` when the storage notice is confirmed                |

No cookies. No network calls. No build state: neither key is part of a build document and neither is serialized or synced to an account.

## Scope And Non-Goals

In scope:

- The spoiler warning and its copy contract.
- The browser-storage notice and its copy contract.
- The stacked banner region, its placement in the app shell, and each banner's independent acknowledgement.
- How a banner arrives and leaves, and where focus goes when one is dismissed.

Non-goals:

- Consent, or anything gated on acknowledgement. Both banners are informational; the planner is fully usable behind them.
- Cookies of any kind. Acknowledgement lives in `localStorage`, which keeps feature 010's "the app sets no cookies" true.
- Per-episode or per-hero spoiler gating. `showEp8Recruits` already defaults off; this feature neither extends nor replaces that.
- Re-prompting when the app later gains content for newer episodes. Acknowledgement is unversioned.
- Translation. The app has no i18n layer and this feature does not add one.

## User / System Behavior

- On a first visit, both banners are present, in one column at the bottom of the app shell: the spoiler warning above, the storage notice below it. They sit in the layout rather than over it — nothing is covered, and the page's scroll area shrinks by their height.
- **They arrive by sliding up** from below the shell's edge and fading in, the region's height expanding over the same `--duration-slow` and `ease-out`, so the scrolling main is squeezed in one motion rather than jumping first and being decorated after. A returning visitor with both keys set has no region at all and nothing animates.
- Each banner carries its copy and one confirm button. Confirming removes that banner and persists its key; the other banner stays. When one remains, it takes the bottom of the shell on its own.
- **They leave by sliding down** and fading, the height collapsing over the same duration and `ease-in`. Sharing one duration is deliberate: the region is anchored to the bottom of a viewport-height column, and a height that snapped shut would jolt the remaining banner — the jolt this exists to remove.
- **A leaving banner is sealed while it leaves**: `inert` and `aria-hidden` for its exit, so neither keyboard nor assistive technology reaches a notice just dismissed. Focus moves to the remaining banner's confirm button, or is released when none is left.
- A returning visitor with both keys set sees no banner, and no banner markup renders on the way to that state — nothing flashes on the first frame.
- The spoiler banner's copy names roster changes first — that heroes are cut, hired, and joined later than the visitor may have played — then powers and upgrades. It warns; it never names which hero.
- The storage notice states that builds are saved in this browser, and that signing in saves them to the account instead, and ends with a **Privacy** link to feature 010's page — the only link in either banner.
- Below `md` the banners sit above the mobile build bar, which stays reachable while they are up.

## Roles And Access

Not role-specific. Both banners are identical signed in and signed out, and neither reads auth state.

## Examples

| Input                                             | Expected Output                                        | Notes                                |
| ------------------------------------------------- | ------------------------------------------------------ | ------------------------------------ |
| first load, empty `localStorage`                  | both slide up, spoiler above, the region growing       | one confirm button each; 250ms       |
| confirm the spoiler banner                        | it slides down, its key written, the notice not jolted | focus lands on the notice's button   |
| confirm the last banner                           | it leaves, the region collapses, focus released        | nothing left to focus                |
| tab to a banner mid-exit                          | it is not reachable                                    | `inert` and `aria-hidden`            |
| confirm the same banner twice                     | the key is written once                                | a leaving banner is never live       |
| reload with only the notice key set               | the spoiler banner alone, at the bottom                | the column collapses                 |
| reload with both keys set                         | no banners, no flash, nothing animates                 | returning visitor                    |
| `localStorage` unreadable (private mode, blocked) | both banners show                                      | a warning fails visible, not silent  |
| `localStorage` unwritable                         | it goes for this session; it returns next load         | the write is lost, never the session |
| `prefers-reduced-motion: reduce`                  | banners appear and disappear instantly                 | annex §14.4; focus unchanged         |
| 320px viewport                                    | copy wraps, the button stays reachable                 | annex §13; the build bar is clear    |

## Business Rules

- Neither banner blocks anything, the exit animation included: the key is written and the banner leaves state the moment it is confirmed, and what remains on screen is only the exit being drawn.
- A leaving banner is never interactive: its confirm button cannot be pressed again, and the write it made is not repeated.
- Acknowledgement is per banner; one key never stands for the other.
- The spoiler warning never spoils: no hero name, no episode outcome, no power name in its copy.
- The storage notice states only what the app actually does, and stays consistent with features 001 and 004; on a conflict those documents win and this copy is corrected.
- No cookie is set for either banner, now or later. A future need for one is a decision record, not an edit here.
- Both keys are UI flags, not personal data, and never serialized.

## Edge Cases

- Prerender: `/` is prerendered and `localStorage` does not exist at build time, so the region is client-only and the prerendered HTML carries none.
- A visitor who acknowledges on one device or browser is warned again on another. Per-browser is the contract; there is no server-side record and signing in does not create one.
- Clearing site data restores both banners, along with the local builds they describe.
- **Both confirmed in quick succession**, the second while the first is still leaving: both exits run, and the region collapses to zero once rather than in two steps.
- **A failed write** still animates the exit; the animation follows the state, which already returns the banner next load.
- **Reduced motion** drops the travel and the height transition. The seal and the focus move are behaviour, not decoration, and unaffected.

## Invariants

- The planner is fully usable while either banner is shown, and while either is leaving.
- A confirmed banner is never focusable or readable by assistive technology again.
- Dismissing one never leaves focus on the document while another banner is up.
- Neither key ever appears in a serialized build, a share link, or an account payload.
- The spoiler banner's copy contains no hero name and no episode outcome.
- The app sets no cookies (feature 010's promise stays true).
- The banner region never overlaps app chrome: shown or hidden, the header, the mobile build bar, and the page's own scroll area stay intact.

## Error Handling

- Unreadable storage is not an error state: the banner shows, and the visitor can still acknowledge it for the session.
- A failed write is swallowed, matching `useLocalStorageRef`. The banner returns on the next load, which is the safe direction for a warning.
- Neither banner has a network path, so neither has a failure mode that needs a toast.

## Entry Points

- `web/components/_shared/FirstRunBanners.vue` — the region and both banners.
- `web/app.vue` — where the region mounts, inside `<ClientOnly>`, below `<u-main>` and above the mobile build bar.

## Dependencies

- `features/001_build-persistence.md` — the localStorage facts the storage notice restates.
- `features/004_accounts.md` — what signing in changes about where a build is stored.
- `features/010_privacy-page.md` — owns the `/privacy` page the storage notice links to; its non-goal points here for the notices themselves.
- `context/game-mechanics.md` — the story events that make the app spoiler-heavy, and the source for what the warning must cover without naming.
- `annexes/design-system.md` — the bottom-chrome treatment the region borrows from the mobile build bar, the base responsive tier, and §11/§14.4 for the enter/exit motion and its guard.

## Open Questions

## Tests

- `test/nuxt/first-run-banners.test.ts`: both banners render with empty storage, spoiler first; the storage notice alone links to `/privacy`; confirming one writes its key and leaves the other; neither renders when both keys are set; unreadable storage renders both; the spoiler copy contains no hero name from `HEROES`. Added: focus moves to the remaining banner's confirm button, and is released when none remains; confirming twice writes the key once. The `inert`/`aria-hidden` seal is **not** asserted in a component test — happy-dom runs no CSS transition, so the leaving element is gone by the next tick and the assertion would iterate an empty list and pass while proving nothing (the limit feature 013 records for its borders). It is verified on the live walk.
- Live browser walk at 320px and desktop, per the Examples table: both banners, one acknowledged, both acknowledged, and the mobile build bar reachable throughout; plus the enter and exit at both widths, and a reduced-motion pass.

## Verification

`test/nuxt/first-run-banners.test.ts` — 9 cases: spoiler-first order, one acknowledged leaving the other, only the missing key's banner, nothing once both are set, both shown when `getItem` throws, no `HEROES` name in the spoiler copy, the key written once on a double confirm, focus handed on and released. Full suite 300 passed / 37 files; lint, format and typecheck clean.

Live walk at 1280 and 320 (mobile, touch): both stacked and in-flow, spoiler above notice; confirming one writes its key and leaves the other; a reload with both keys renders no banner and no flash. At 320 the copy wraps, the buttons are full-width, `scrollWidth === innerWidth === 320`, and a hit test at the build bar's Save centre lands inside that 44px button with both banners up.

**Motion, measured in Chrome (2026-09-04).** Enter, from a pre-navigation rAF probe: the row opens `0 → 68px` as the body runs `translateY(68px) → none` and `opacity 0 → 1`, settling together over 250ms. Exit sampled 110ms in: the banner is still in the DOM carrying `inert` and `aria-hidden="true"`, unreachable by tab, row `41.25px`, body `translateY(15px)`/`opacity 0.78`, `<main>` at `702` of `687 → 755` — height and travel as one. Focus lands on the remaining confirm button, the key reads `'1'`, the element is gone after. At 320 the shell is header 64 / main 206 / region 300 / bar 70, and across the exit (region `300 → 269 → 129`) the bar's top stays at 570: nothing below the leaving banner moves.

Not covered: a `prefers-reduced-motion: reduce` machine — the guard is confirmed present in the shipped CSSOM, but Chrome DevTools has no media emulation to exercise the branch. The `inert` seal is browser-only evidence for the reason a component test cannot see it: happy-dom runs no CSS transition, so the leaving element is gone by the next tick.

Remaining risk: at 320 the two banners occupy roughly half the viewport on a first run, leaving about one hero card visible until one is acknowledged. Acceptable for a one-time notice; shortening the copy is the lever if it annoys.

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
