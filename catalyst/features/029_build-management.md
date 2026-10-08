# Feature: Build management

## Status

Approved

## Task Weight

Hard

## Purpose

A player must never believe a build is safe in their account when it went only to this browser, and never lose work because the planner quietly moved to another build. This feature owns the one thing every save path shares: which build the planner is on, what its name is, where a new build goes, and how each of those is shown. Storage stays feature 001's (local) and 005's (account); the share page stays 007's. The terms are the glossary's (`context/glossary.md`): **open build**, **build name**, **shared-build mode**.

## Inputs

| Input         | Type          | Source        | Constraints                                                           |
| ------------- | ------------- | ------------- | --------------------------------------------------------------------- |
| open build    | localStorage  | past sessions | `{ kind, id }` or none; a cloud entry adds owner uid and document     |
| auth status   | store         | feature 006   | `unknown` → `signed-in` / `anonymous`; whether a sign-out was chosen  |
| build name    | form field    | name dialog   | trimmed; empty → the default name                                     |
| device class  | media queries | the device    | `(hover: none) and (pointer: coarse)`: under 31rem phone, else tablet |
| planner state | `useState`    | feature 003   | compared with the open build's document for unsaved changes           |

## Outputs And Side Effects

| Output / Side Effect | Type         | Description                                                  |
| -------------------- | ------------ | ------------------------------------------------------------ |
| build select         | UI           | fixed width, name truncated; location icon when signed in    |
| build menu           | UI           | local builds, account builds, actions; empty groups left out |
| discard confirmation | dialog       | **Discard changes to "X"?** — Discard / Cancel               |
| open-build record    | localStorage | written on open, save, delete; cleared on a chosen sign-out  |

## Scope And Non-Goals

In scope:

- The open build, build names, where a new build goes, the build select and menu, the location icon, Save's visibility, the discard confirmation, the toasts, and sign-out's effect on the planner.

Non-goals:

- Clean-up of duplicate local names stored before this feature: the app is unreleased, so only new duplicates are prevented.
- Moving a local build into the account automatically on sign-in — that stays an explicit **Save as new…** or feature 004's first-login offer.
- A choice of destination while signed in: a new build goes to the account, never to this browser.
- The share page (`/b/{id}`) and its **Save a copy** — feature 007; only how it leaves the planner is here.

## User / System Behavior

**The open build**

- Exactly one build is open, or none. Opening a build of either kind closes the other kind's; the header names the open build, and Save, Rename and Delete act on it alone.
- The open build survives a reload. A cloud build paints at once from its cached document, then the fetched build replaces it silently if it differs and the planner is untouched; after an edit, the edit stays and the next Save meets feature 008's conflict dialog.
- The cache belongs to the uid that wrote it. Another user signing in, a `404`, or being signed out at load ignores it and opens the last open local build instead, or none.
- Nothing is open in shared-build mode, before a first save, and after the open build is deleted.
- The share page sets the planner aside on entry and, left without a copy, restores it exactly — unsaved edits included. It never enters shared-build mode.

**Names**

- A build name is unique within its collection — this browser's local builds, or one account's cloud builds — compared after trimming, case-sensitively. A taken name becomes the next free `Name (n)` from 2, on create, save-as-new, copy and rename alike; a rename to the build's own name changes nothing.
- The one default name is **New build**. A copy keeps its source's name; a `?build=` snapshot has none, so it takes the default.
- Every message names the final name, suffix included.

**Where builds go**

- Signed in, **New build**, **Save as new…** and **Save a copy** create cloud builds. Signed out, they create local builds.
- An open local build keeps saving to this browser while signed in; it is not moved.
- **New build** opens a blank planner (defaults) under the default name. **Save as new…** saves the current planner under a typed name.
- **Rename…** and **Delete…** each appear once and act on the open build of either kind. A cloud rename is a `PATCH`. Delete's confirmation says where the build lives; for a cloud build, that its share link stops working.
- After a delete nothing is open and the planner keeps showing the deleted build as unsaved work; Save's name dialog is prefilled with the deleted name, now free. No minimum build count applies.

**Showing where a build lives**

- Signed in, the build select carries the open build's location icon: a cloud for a cloud build; for a local build a phone, a tablet or a monitor by device class.
- Save's tooltip names the destination — "Save to your account" or "Save to this browser". Signed in with a local build open, the menu says "This build is only in this browser" beside **Save as new…**.
- Save shows when the planner differs from the open build or nothing is open, and hides when the open build is clean — both kinds alike.

**Protecting work**

- Any action that replaces the planner while it holds unsaved changes — opening another build, **New build**, **Back to my build**, **Save a copy**, a chosen sign-out — first asks the discard confirmation. Cancel leaves everything as it was.
- A chosen sign-out (the profile menu, account deletion) closes an open cloud build, clears its cache, and opens the last open local build, or none with defaults.
- A sign-out the user did not choose (session ended, token refresh failed) keeps the cloud build and its edits on screen; Save becomes **Sign in to save**, and nothing is written to this browser meanwhile.
- While auth is `unknown`, Save, **New build**, **Save as new…** and **Save a copy** are disabled with a loading state.

**Toasts**

- `Saved "X"` (a save over an existing build), `Created "X"` (**New build**, **Save as new…**), `Saved a copy as "X"`, `Renamed to "X"`, `Deleted "X"` — each with the description "In your account" or "In this browser".

## Roles And Access

Not role-specific. Signed-in and signed-out visitors differ only in where a new build goes and whether the location icon shows.

## Examples

| Input                                   | Expected Output                         | Notes                |
| --------------------------------------- | --------------------------------------- | -------------------- |
| open cloud A, then local B, Save        | B updated locally; no API request       | data-loss regression |
| open cloud A, then local B              | header says B; only B ticked            |                      |
| reload with cloud A open                | A painted from cache, then fetched      |                      |
| same, A changed elsewhere, untouched    | fetched A replaces it                   |                      |
| reload as another user                  | cache ignored; last local opens         |                      |
| Save as new "Main", local "Main" exists | `Created "Main (2)"`, "In this browser" | signed out           |
| rename B to taken "Main"                | `Renamed to "Main (2)"`                 |                      |
| same name, other collection             | no suffix                               | local ≠ cloud        |
| **New build** signed in                 | blank planner; cloud "New build"        |                      |
| delete the open cloud build             | nothing open; Save prefilled            | link stops           |
| delete the last local build             | allowed; nothing open                   | no minimum           |
| unsaved edits, open another             | discard confirmation                    | Cancel keeps         |
| signed in, local open, desktop          | monitor icon; "only in this browser"    | phone, tablet        |
| session ends, cloud A edited            | A kept; **Sign in to save**             | no local write       |
| chosen sign-out, cloud A open           | cache cleared; last local opens         |                      |
| auth `unknown`                          | save and create disabled                |                      |
| signed in, no local builds              | no empty group in the menu              |                      |
| a 40-character name                     | select keeps `w-40`; truncates          |                      |

## Business Rules

- The open-build record is the single source of what Save, Rename, Delete and the header refer to. No component keeps a second "active" pointer.
- The name rule mirrors feature 005's server rule exactly, so a name means the same thing in both collections; the server stays authoritative for cloud names.
- The cloud cache holds one build document and its owner's uid, nothing else from the account; feature 010 lists it.
- Device class is read from input capability and width, never from the user agent; a touch laptop that can hover is a monitor.

## Edge Cases

- A cached cloud build whose fetch fails for a reason other than `404` stays painted; Save then meets the failure through feature 006's policy.
- Opening the build that is already open with unsaved changes asks the discard confirmation, then reloads its stored document.
- A cloud build opened on one device and deleted on another: the next fetch's `404` leaves nothing open and the planner as it was.
- The account at its 20-build limit: a create toasts the server's message and nothing is opened.

## Invariants

- At most one build is open, and the header, the tick in the menu, Save, Rename and Delete all name the same one.
- A save never writes to a build that is not open.
- While signed in, nothing new is written to this browser; while signed out by a session ending, nothing at all is.
- No two builds in one collection share a name after any action this feature runs.
- The planner is never replaced over unsaved changes without the user confirming.

## Error Handling

- Every request failure goes through feature 006's central policy unchanged; a failed save leaves the build open and unsaved, and the leave-site prompt armed.
- A corrupt or foreign open-build record is ignored, never an error surface.

## Entry Points

- `web/composables/build/useOpenBuild.ts` (new): the open build, its record and the cloud cache.
- `web/composables/build/useLocalBuilds.ts`, `useBuildMode.ts`, `useUnsavedChanges.ts`, `useInitialBuild.ts`.
- `web/components/build/BuildManager.vue`, `BuildMenu.vue`, `LocalBuildDialogs.vue`, `CloudBuildDialogs.vue`, `BuildNameDialog.vue`, a discard-confirmation dialog.
- `web/stores/useAuthStore.ts`: `activeAccountBuildId` folds into the open build; the chosen/unchosen sign-out distinction.
- `web/utils/buildName.ts` (new): the suffix rule.

## Dependencies

- Feature 001: local storage of builds, shared-build mode on `/`, dirty tracking and the leave-site prompt.
- Feature 005: the server's name rule this mirrors, the cap, rename by `PATCH`.
- Feature 007: **Save a copy** opens its copy through this feature's open build.
- Feature 008: the account list, the conflict dialog, the mutations.
- Feature 004: sign-in, sign-out, account deletion; the first-login offer as the bulk path.
- Feature 006: auth status, the central error policy.
- Feature 010: the privacy page lists the cloud cache.
- Feature 018: hints exist only where the device can hover; Save's tooltip is a hint.

## Open Questions

## Tests

- `test/nuxt/open-build.test.ts`: one open build across kinds; Save after switching from cloud to local writes locally (regression, watched failing first); restore from cache, replacement when untouched, foreign uid and `404` fallbacks; chosen vs unchosen sign-out.
- `test/unit/buildName.test.ts`: suffix from 2, smallest free `n`, trim, case-sensitivity, rename to own name.
- `test/nuxt/local-build-names.test.ts`: create, save with nothing open, and rename keep local names unique and report the final name.
- `test/nuxt/build-manager.test.ts`: menu groups without empties, one Rename/Delete per open build, Save visibility, destination tooltip, disabled while auth is `unknown`, discard confirmation.
- Live browser walk of the Examples against the real API, the Neon dev branch and the Auth emulator, at desktop and phone widths.

## Verification
