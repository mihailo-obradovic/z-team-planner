# Feature: Privacy page

## Status

Draft

## Task Weight

Easy

## Purpose

Feature 004 declares personal data — six `users` fields, a lawful basis, a retention window — in a repository document no player can read. This feature is the reader-facing half: a `/privacy` page stating what the app stores, why, for how long, and how to erase it, reachable without signing in.

It is also a release gate. Publishing the Firebase OAuth consent screen requires a privacy-policy URL, so stage 2 (decision 007 — deploy the API and enable sign-in) cannot happen until this page is live.

## Inputs

The page takes no user input; it renders a fixed document. Its content is derived, and every statement traces to a source.

| Input                    | Type            | Source                              | Constraints                                                          |
| ------------------------ | --------------- | ----------------------------------- | -------------------------------------------------------------------- |
| account data facts       | prose           | `features/004_accounts.md`          | the six fields, basis, retention, deletion — restated, not new       |
| browser storage facts    | prose           | `features/001_build-persistence.md` | the three localStorage keys and the `?build=` snapshot               |
| share-link facts         | prose           | `features/007_share-links.md`       | account builds readable by anyone holding the link                   |
| processor list           | prose           | `operations.md`, `decisions/007`    | the named parties and their regions                                  |
| controller name, contact | literal strings | the maintainer                      | a real name and a monitored address; never invented (Open Questions) |

## Outputs And Side Effects

| Output / Side Effect | Type      | Description                                                                             |
| -------------------- | --------- | --------------------------------------------------------------------------------------- |
| `/privacy`           | HTML page | prerendered; the policy text, headed and sectioned, with a last-updated date            |
| footer link          | UI        | a `<footer>` in the app shell with a **Privacy** link, on every route, signed in or not |
| consent-screen URL   | external  | the deployed page's URL, entered in the Google Auth Platform consent configuration      |

No cookies, no analytics, no network calls, no state. The page is inert.

## Scope And Non-Goals

In scope:

- The `/privacy` route and its content contract — which facts it must state and where each comes from.
- A footer in the app shell holding the link, reachable anonymously.
- The last-updated date and the rule for changing it.

Non-goals:

- A cookie banner or consent management — the app sets no cookies and runs no analytics, so there is nothing to consent to.
- Terms of service, an imprint, or an accessibility statement — separate documents if ever wanted.
- A privacy item in the profile menu — the footer is the contract; a second entry point is optional later.
- Markdown rendering or a CMS. No markdown dependency is installed and adding one would be its own decision.
- Changing what data the app collects. This feature only describes; feature 004 decides.

## User / System Behavior

- A visitor on any route sees a footer with a single **Privacy** link. It is present signed in and signed out, on the prerendered page and after hydration, at every breakpoint.
- Following it renders `/privacy`: a headed document, styled as a panel like the rest of the app, scrolling inside the page rather than growing it.
- The page states, in the app's plain register: who is responsible and how to reach them; that anonymous use stores nothing on a server; what the three localStorage keys hold; that a `?build=` link carries build data inside the URL; that signing in with Google stores the six `users` fields, on the basis of the account the user asked for; that builds saved to the account are stored until deleted; that an account build's share link is readable by anyone holding it; the processors and their regions; that backups hold a deleted row for at most 30 days; and how to delete everything — the profile menu's **Delete account**, which is immediate and total.
- **Back to the planner** returns the visitor to `/`, matching the error page's single-way-back shape.
- The page never claims a protection the app does not have. If a fact changes in its source feature, this page changes in the same change.

## Roles And Access

Not role-specific. The page is public and identical for every visitor — anonymously reachable by design, because the consent screen links to it before anyone has signed in.

## Examples

| Input                                       | Expected Output                                                       | Notes                                    |
| ------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------- |
| load `/` signed out or in                   | footer visible with a **Privacy** link                                | not gated on auth state                  |
| follow the link                             | `/privacy` renders the policy with a last-updated date                | prerendered, no API call                 |
| request `/privacy` with the API unreachable | page renders in full                                                  | no runtime dependency                    |
| view `/privacy` at 320px                    | text wraps, nothing exceeds the viewport, the page scrolls internally | annex §13 base tier                      |
| a fact changes in feature 004               | this page and 004 change in the same commit                           | Same-Change Rule                         |
| deleted account, backup still holds the row | the page states the 30-day window explicitly                          | never described as "deleted immediately" |

## Business Rules

- Every statement on the page is true of the deployed system at the time it is written, and traces to a source document. A claim with no source is a defect.
- The page is a description, never a grant: it does not permit collection that feature 004 does not already declare.
- The controller name and contact are real and monitored. A placeholder must never ship (Honest Inputs, prime directive).
- The page states the retention window honestly, including that encrypted backups hold a deleted row for up to 30 days.
- It carries a last-updated date, changed whenever the text changes and at no other time.
- It is prerendered — served without the API, so it is reachable when the backend is down or, as in stage 1, does not exist.
- The footer link is present on every route and never behind auth.

## Edge Cases

- Stage 1 (today): sign-in is unavailable, so no account data exists yet. The page describes the account behaviour in the present tense anyway — it must be live and accurate _before_ the consent screen is published and sign-in switched on.
- A visitor who never signs in still has localStorage builds; the page covers those, since they are the only data most visitors ever have.
- JavaScript disabled: the page is prerendered HTML and reads correctly without hydration.

## Invariants

- `/privacy` is reachable anonymously, from every route, without JavaScript.
- The page never states a protection or a deletion guarantee the system does not implement.
- No fact appears here that contradicts its owning feature document; on a conflict, the owning document wins and this page is corrected.
- The page introduces no data collection of its own.

## Error Handling

- The page has no failure mode of its own — no fetch, no state. A routing miss falls through to the app's error page (feature 009).
- A missing footer link is a defect, not a degraded state: the consent-screen URL depends on the page staying reachable.

## Entry Points

- `web/pages/privacy.vue` — the route and its content.
- `web/app.vue` — the `<footer>` holding the link, a sibling of `<u-main>`.
- `nuxt.config.ts` — the `routeRules` prerender entry for `/privacy`, beside `/`.

## Dependencies

- `features/004_accounts.md` — the personal-data declaration this page reports; the single source for the fields, basis, retention and deletion path.
- `features/001_build-persistence.md` — the localStorage keys and the `?build=` snapshot format.
- `features/007_share-links.md` — the unlisted-by-id share semantics.
- `operations.md`, `decisions/007_infra_hosting-vercel.md` — the processors, their regions, and the backup retention window.
- `annexes/design-system.md` — panel, type scale and spacing for the page and the footer.
- Decision 007 named this page as a section of feature 004. It is a separate document because 004 sits 102 characters from the 14,400 hard maximum, and because the page states facts owned by 001, 007 and the hosting record rather than by 004. Decision 007 stays as written — history, not edited.

## Open Questions

- The controller name and the contact address are not yet supplied. The user has chosen a dedicated alias over a personal inbox; the literal name and address are still needed, and must be filled in before this document is approved. Nothing may be invented in their place.

## Tests

- `test/nuxt/privacy-page.test.ts`: the route renders; the footer link is present on `/` in both auth states and points at `/privacy`; the page contains the retention window, the deletion path and the contact address.
- `test/unit/panel-surface.test.ts` (existing): any `panel` this feature adds carries `bg-default`.
- Live browser walk at 320px and desktop, per the Examples table; the deployed URL confirmed reachable before it is entered in the consent screen.

## Verification

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
