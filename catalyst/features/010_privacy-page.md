# Feature: Privacy page

## Status

Active

## Task Weight

Easy

## Purpose

Feature 004 declares personal data — six `users` fields, a lawful basis, a retention window — in a repository document no player can read. This feature is the reader-facing half: a `/privacy` page stating what the app stores, why, for how long, and how to erase it, reachable without signing in.

It is also a release gate. Publishing the Firebase OAuth consent screen requires a privacy-policy URL, so stage 2 (decision 007 — deploy the API and enable sign-in) cannot happen until this page is live.

## Inputs

The page takes no user input; it renders a fixed document. Its content is derived, and every statement traces to a source.

| Input                 | Type            | Source                              | Constraints                                                                                                                                    |
| --------------------- | --------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| account data facts    | prose           | `features/004_accounts.md`          | the six fields, basis, retention, deletion — restated, not new                                                                                 |
| browser storage facts | prose           | `features/001_build-persistence.md` | the three localStorage keys and the `?build=` snapshot                                                                                         |
| share-link facts      | prose           | `features/007_share-links.md`       | account builds readable by anyone holding the link                                                                                             |
| processor list        | prose           | `operations.md`, `decisions/007`    | the named parties — no regions, by the maintainer's choice                                                                                     |
| controller, contact   | literal strings | the maintainer                      | "a single maintainer", unnamed, and the repository's GitHub issues page as the only contact — no name and no email, by the maintainer's choice |
| attribution           | prose           | the maintainer                      | a non-profit fan project made in free time; all in-game assets are AdHoc Studio's property, all rights reserved                                |

## Outputs And Side Effects

| Output / Side Effect | Type      | Description                                                                              |
| -------------------- | --------- | ---------------------------------------------------------------------------------------- |
| `/privacy`           | HTML page | prerendered; the policy text, headed and sectioned, with a last-updated date             |
| page-end link        | UI        | one muted **Privacy** text line at the end of the scrolling content on `/` and `/b/{id}` |
| notice link          | UI        | a **Privacy** link added to feature 017's browser-storage notice                         |
| consent-screen URL   | external  | the deployed page's URL, entered in the Google Auth Platform consent configuration       |

No cookies, no analytics, no network calls, no state. The page is inert.

## Scope And Non-Goals

In scope:

- The `/privacy` route and its content contract — which facts it must state and where each comes from.
- The page-end link on the planner and the shared-build page, reachable anonymously and present in the prerendered `/`.
- The last-updated date and the rule for changing it.

Non-goals:

- A cookie banner or consent management — the app sets no cookies and runs no analytics, so there is nothing to consent to. The first-run notices that do exist, including the browser-storage notice, are feature 017's; this feature adds only the **Privacy** link into that notice once this page is live.
- Terms of service, an imprint, or an accessibility statement — separate documents if ever wanted.
- A footer bar, a header link, or a privacy item in the profile menu. The shell has no spare row at any tier, and the page exists for legal reach, not discovery — the page-end line and the notice link are the contract. An entry on the error page is likewise out: it keeps its single way back (feature 009).
- Markdown rendering or a CMS. No markdown dependency is installed and adding one would be its own decision.
- Changing what data the app collects. This feature only describes; feature 004 decides.

## User / System Behavior

- The planner and the shared-build page each end with a single muted **Privacy** text line below their content — the last thing reached by scrolling, present signed in and signed out, on the prerendered `/` and after hydration, at every breakpoint. While the content is shorter than its scroll region the line sits at the bottom of that region rather than directly under the content. It costs the shell no height.
- Following it renders `/privacy`: a headed document, styled as a panel like the rest of the app, scrolling inside the page rather than growing it.
- The page states, in the app's plain register: first, that it is a non-profit fan project made in free time by a single maintainer, that every in-game asset is AdHoc Studio's property, and that the GitHub issues page is where to ask; that without signing in nothing leaves the browser and no data is shared; what the localStorage keys hold — the two build keys, the first-login offer flag, and feature 017's two acknowledgement flags; that a `?build=` link carries build data inside the URL; how signing in works — optional, Google through Firebase Authentication — and that the app then holds the six `users` fields and nothing else from the Google account; that builds saved to the account are stored until deleted; that an account build's share link is readable by anyone holding it; the processors, named without regions; that backups hold a deleted row for at most 30 days; how to delete everything — the profile menu's **Delete account**, which is immediate and total;.
- **Back to the planner** returns the visitor to `/`, matching the error page's single-way-back shape.
- The page never claims a protection the app does not have. If a fact changes in its source feature, this page changes in the same change.

## Roles And Access

Not role-specific. The page is public and identical for every visitor — anonymously reachable by design, because the consent screen links to it before anyone has signed in.

## Examples

| Input                                       | Expected Output                                                       | Notes                                    |
| ------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------- |
| load `/` signed out or in                   | a **Privacy** line after the last content, in the prerendered HTML    | not gated on auth state                  |
| open a share link `/b/{id}`                 | the same **Privacy** line after the build                             | client-rendered page, same line          |
| open an unknown route                       | error page, no **Privacy** line                                       | feature 009 keeps one way back           |
| follow the link                             | `/privacy` renders the policy with a last-updated date                | prerendered, no API call                 |
| request `/privacy` with the API unreachable | page renders in full                                                  | no runtime dependency                    |
| view `/privacy` at 320px                    | text wraps, nothing exceeds the viewport, the page scrolls internally | annex §13 base tier                      |
| a fact changes in feature 004               | this page and 004 change in the same commit                           | Same-Change Rule                         |
| deleted account, backup still holds the row | the page states the 30-day window explicitly                          | never described as "deleted immediately" |

## Business Rules

- Every statement on the page is true of the deployed system at the time it is written, and traces to a source document. A claim with no source is a defect.
- The page is a description, never a grant: it does not permit collection that feature 004 does not already declare.
- The contact link is real and monitored; the page names no person, by the maintainer's choice. A placeholder must never ship (Honest Inputs, prime directive).
- The page states the retention window honestly, including that encrypted backups hold a deleted row for up to 30 days.
- It carries a last-updated date, changed whenever the text changes and at no other time.
- It is prerendered — served without the API, so it is reachable when the backend is down or, as in stage 1, does not exist.
- The page-end link is present on `/` and `/b/{id}` and never behind auth. Google's consent-screen policy requires the production home page to link to the policy, so the `/` line is in the prerendered HTML, not client-only.

## Edge Cases

- Stage 1 (today): sign-in is unavailable, so no account data exists yet. The page describes the account behaviour in the present tense anyway — it must be live and accurate _before_ the consent screen is published and sign-in switched on.
- A visitor who never signs in still has localStorage builds; the page covers those, since they are the only data most visitors ever have.
- JavaScript disabled: the page is prerendered HTML and reads correctly without hydration.

## Invariants

- `/privacy` is reachable anonymously, from the prerendered `/`, without JavaScript.
- The page never states a protection or a deletion guarantee the system does not implement.
- No fact appears here that contradicts its owning feature document; on a conflict, the owning document wins and this page is corrected.
- The page introduces no data collection of its own.

## Error Handling

- The page has no failure mode of its own — no fetch, no state. A routing miss falls through to the app's error page (feature 009).
- A missing page-end link on `/` is a defect, not a degraded state: the consent-screen approval depends on the home page linking to the policy.

## Entry Points

- `web/pages/privacy.vue` — the route and its content.
- `web/pages/index.vue`, `web/pages/b/[id].vue` — the page-end **Privacy** line, last in each page's column.
- `nuxt.config.ts` — the `routeRules` prerender entry for `/privacy`, beside `/`.

## Dependencies

- `features/004_accounts.md` — the personal-data declaration this page reports; the single source for the fields, basis, retention and deletion path.
- `features/001_build-persistence.md` — the localStorage keys and the `?build=` snapshot format.
- `features/007_share-links.md` — the unlisted-by-id share semantics.
- `features/017_first-run-banners.md` — the browser-storage notice this page links from, and the two acknowledgement keys the page must list alongside the build keys.
- `operations.md`, `decisions/007_infra_hosting-vercel.md` — the processors and the backup retention window.
- `annexes/design-system.md` — panel, type scale and spacing for the page and the page-end line.
- Decision 007 named this page as a section of feature 004. It is a separate document because 004 sits 102 characters from the 14,400 hard maximum, and because the page states facts owned by 001, 007 and the hosting record rather than by 004. Decision 007 stays as written — history, not edited.

## Open Questions

## Tests

- `test/nuxt/privacy-page.test.ts`: the route renders; the **Privacy** line is present on `/` and `/b/{id}` in both auth states and points at `/privacy`; the page contains the retention window, the deletion path and the issues link.
- `test/unit/panel-surface.test.ts` (existing): any `panel` this feature adds carries `bg-default`.
- Live browser walk at 320px and desktop, per the Examples table; `curl` of the prerendered `/` shows the link without JavaScript; the deployed URL confirmed reachable before it is entered in the consent screen.

## Verification

By test (`privacy-page`, `privacy-link`, `first-run-banners`): the unnamed-maintainer line and the issues link, every localStorage key, the 30-day window and **Delete account**, the AdHoc Studio credit, the date, the single way back; the page-end component is one link to `/privacy`; the storage notice alone links there. Suite green; oxlint, `nuxt typecheck` and `validate.py` clean. A production build prerendered `/privacy` with the date and the credit in its static HTML.

Live in Chrome on 2026-09-04, signed out: the **Privacy** line is the last element of all three tab panels and the server-rendered `/` carries three `href="/privacy"` — the home page links to the policy before hydration. On the production build at 1600 × 1000, where every tab fits its panel, the line sits 18px above the panel's bottom edge; at 1280 × 800 the overview overflows and the line follows the content to the scroll end. Clicking it navigates in place to `/privacy`, which made zero API calls and rendered the date, both contact links and a 44px **Back to the planner**. At 320 (mobile, touch) nothing crosses the viewport and nothing scrolls sideways. The storage notice's link wraps onto its own line at 320 without covering the build bar. `/b/{id}` against the API on the Neon dev branch resolved with **Save a copy** and the line last. An unknown route rendered "Page not found" with no privacy link.

Not yet done: the deployed URL is confirmed only once this merges and Vercel builds it; entering it in the consent screen is stage 2's external step (decision 007).

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
