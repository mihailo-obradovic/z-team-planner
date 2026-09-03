# Feature: First-run banners

## Status

Draft

## Task Weight

Easy

## Purpose

The planner shows the whole roster and every power at once, including heroes who arrive in episode 8 and upgrades a player may not have unlocked. A visitor who opens it mid-playthrough is spoiled before they have read a word. This feature gives them a warning first, acknowledged once.

The same first run is the honest moment to say where a build is kept, since the app writes to the visitor's browser without asking. Neither banner is consent — the app sets no cookies and runs no analytics (feature 010), and nothing is withheld while a banner is up. They are notices: read, acknowledge, gone.

## Inputs

| Input                                | Type      | Source                        | Constraints                                                        |
| ------------------------------------ | --------- | ----------------------------- | ------------------------------------------------------------------ |
| `z-team-spoiler-acknowledged`        | `'1'`     | `localStorage`                | absent or unreadable → the banner shows; any value → it does not   |
| `z-team-storage-notice-acknowledged` | `'1'`     | `localStorage`                | absent or unreadable → the banner shows; any value → it does not   |
| confirm click                        | UI event  | one button per banner         | acknowledges that banner alone                                     |

## Outputs And Side Effects

| Output / Side Effect                 | Type          | Description                                                       |
| ------------------------------------ | ------------- | ----------------------------------------------------------------- |
| banner region                        | UI            | a column of unacknowledged banners at the bottom of the app shell  |
| `z-team-spoiler-acknowledged`        | `localStorage` | written `'1'` when the spoiler banner is confirmed                |
| `z-team-storage-notice-acknowledged` | `localStorage` | written `'1'` when the storage notice is confirmed                |

No cookies. No network calls. No build state: neither key is part of a build document and neither is serialized or synced to an account.

## Scope And Non-Goals

In scope:

- The spoiler warning and its copy contract.
- The browser-storage notice and its copy contract.
- The stacked banner region, its placement in the app shell, and each banner's independent acknowledgement.

Non-goals:

- Consent, or anything gated on acknowledgement. Both banners are informational; the planner is fully usable behind them.
- Cookies of any kind. Acknowledgement lives in `localStorage`, which keeps feature 010's "the app sets no cookies" true.
- Per-episode or per-hero spoiler gating. `showEp8Recruits` already defaults off; this feature neither extends nor replaces that.
- Re-prompting when the app later gains content for newer episodes. Acknowledgement is unversioned.
- A link to `/privacy` from the storage notice — added by feature 010 when that page exists, in that feature's change.
- Translation. The app has no i18n layer and this feature does not add one.

## User / System Behavior

- On a first visit, both banners are present, in one column at the bottom of the app shell: the spoiler warning above, the storage notice below it. They sit in the layout rather than over it — nothing is covered, and the page's scroll area shrinks by their height.
- Each banner carries its copy and one confirm button. Confirming removes that banner and persists its key; the other banner stays. When one remains, it takes the bottom of the shell on its own.
- A returning visitor with both keys set sees no banner, and no banner markup renders on the way to that state — nothing flashes on the first frame.
- The spoiler banner's copy names roster changes first — that heroes are cut, hired, and joined later than the visitor may have played — then powers and upgrades. It warns; it never names which hero.
- The storage notice states that builds are saved in this browser, and that signing in saves them to the account instead.
- Below `md` the banners sit above the mobile build bar, which stays reachable while they are up.

## Roles And Access

Not role-specific. Both banners are identical signed in and signed out, and neither reads auth state.

## Examples

| Input                                             | Expected Output                                                | Notes                                  |
| ------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------- |
| first load, empty `localStorage`                  | both banners, spoiler above the notice                         | one confirm button each                |
| confirm the spoiler banner                        | it goes, its key is written, the notice stays at the bottom     | independent acknowledgement            |
| reload with only the notice key set               | the spoiler banner alone, at the bottom                        | the column collapses                   |
| reload with both keys set                         | no banners, no flash                                           | returning visitor                      |
| `localStorage` unreadable (private mode, blocked) | both banners show                                              | a warning fails visible, not silent    |
| `localStorage` unwritable                         | confirming removes the banner for this session; it returns next load | the write is lost, never the session |
| 320px viewport                                    | copy wraps, the button stays reachable, the build bar is not covered | annex §13 base tier               |

## Business Rules

- Neither banner blocks anything. No route, control, or build operation waits on an acknowledgement.
- Acknowledgement is per banner. One key is never read as standing for the other.
- The spoiler warning never spoils: no hero name, no episode outcome, no power name in its copy.
- The storage notice states only what the app actually does, and stays consistent with features 001 and 004; on a conflict those documents win and this copy is corrected.
- No cookie is set for either banner, now or later. A future need for one is a decision record, not an edit here.
- Both keys are UI flags, not personal data, and are excluded from build serialization.

## Edge Cases

- Prerender: `/` is prerendered and `localStorage` does not exist at build time, so the region is client-only and the prerendered HTML carries no banner.
- A visitor who acknowledges on one device or browser is warned again on another. Per-browser is the contract; there is no server-side record and signing in does not create one.
- Clearing site data restores both banners, along with the local builds they describe.

## Invariants

- The planner is fully usable while either banner is shown.
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
- `features/010_privacy-page.md` — owns the `/privacy` page and will add the link from the notice; its non-goal is amended to point here for the notices themselves.
- `context/game-mechanics.md` — the story events that make the app spoiler-heavy, and the source for what the warning must cover without naming.
- `annexes/design-system.md` — the bottom-chrome treatment the region borrows from the mobile build bar, and the base responsive tier.

## Open Questions

## Tests

- `test/nuxt/first-run-banners.test.ts`: both banners render with empty storage, spoiler first; confirming one writes its key and leaves the other; neither renders when both keys are set; unreadable storage renders both; the spoiler copy contains no hero name from `HEROES`.
- Live browser walk at 320px and desktop, per the Examples table: both banners, one acknowledged, both acknowledged, and the mobile build bar reachable throughout.

## Verification

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
