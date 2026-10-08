# Changelog

What changed in Z-Team Planner, newest release first, for the players who use it and for whoever operates it. Format: [Keep a Changelog](https://keepachangelog.com), versions follow [Semantic Versioning](https://semver.org).

Each release gives its version and date, a short **Overview**, then **Added**, **Changed** and **Fixed** as needed. A release that changes the database schema also carries a **Database** line that names the migration and what it changes. Only changes a player or the operator would notice get an entry. Dependency updates appear only when they change behavior or the schema.

## [Unreleased]

### Changed

- Every message about a build now names it and says where it lives: "Saved", "Created", "Saved a copy as", "Renamed to" or "Deleted", followed by "In your account" or "In this browser".
- Your account builds no longer reload every time you switch back to the planner's tab. They refresh when the page opens, after you save or delete one, and when your connection comes back.
- Two builds saved in this browser can no longer share a name: saving or renaming one to a name already taken gives it the next free "Name (2)", "Name (3)" and so on, as account builds already did, and the confirmation names it. A build saved without a name is called "New build", wherever it is saved.
- The build menu is simpler. **New build** starts a blank planner, saved at once as "New build". **Save as new…** keeps the current planner under a new name and replaces "Save to account…". There is one **Rename…** and one **Delete…**, both for the build you have open, wherever it lives. Any build can be deleted, the last one included. Afterwards nothing is open, the planner keeps what was on screen, and Save offers the deleted name back. Signed in, new builds go to your account.
- Save appears only when there is something to save. Its tooltip says where it writes: "Save to your account" or "Save to this browser". While signed in, the build select shows where the open build lives: a cloud for your account, or a phone, tablet or monitor for this browser. The build select keeps one width however long the name, and the menu no longer shows an empty section between separators.
- Opening another build, starting a new one, or going back to your own build while you have unsaved changes now asks first: **Discard changes to "X"?** Cancel leaves everything as it was. Before, the planner was replaced without a word.
- A power, flight or synergy-level control that is on but locked now keeps most of its colour instead of fading almost to the card. Locked controls that are off fade as before, so the two states no longer look alike.

### Fixed

- Reloading with one of your account builds open shows it straight away and keeps it open, instead of dropping back to a build in this browser. Edits you make before your account answers are kept. Signing out on purpose returns you to the last build saved in this browser. If your session simply expires, your account build and its edits stay on screen, and Save becomes **Sign in to save**. Save and creating builds wait until the page knows whether you are signed in.
- A build opened from a snapshot link is protected once you edit it: leaving the page warns you, and the copy button turns into an unsaved-changes reminder. **Save as mine** is now **Save a copy**. It saves in one click, without asking for a name, to your account when signed in. **Back to my build** appears only when a build was open before, and now works for account builds too. On phones the bottom bar says "Shared build".
- A shared build's page no longer offers Save, the build menu, Share or Story setup, which acted on a build that was not open. Its **Save a copy** now takes you to the planner with the copy open; it saves once however often it is clicked, stays on the page if saving fails, and asks first when you have unsaved changes. Leaving the page without a copy gives you back your planner exactly as you left it, unsaved changes included.
- Opening a build saved in this browser while one of your account builds was open no longer leaves the account build in charge: Save used to overwrite the account build with the browser build's contents. Now only one build is open at a time, and Save, the menu's tick and the header all name that one.
- A shared build's page now reads to screen readers: every hero card is there with its name, level, stats and powers, and nothing on it is a control. Before, the whole build was hidden from assistive technology.
- Text that was hard to read now meets the contrast floor: the Story Setup drawer's budget counters and "Training budget" label, the error page's status code, the power cards' state badges in the hero dialog, the mission simulator's small labels, and the red Delete buttons.
- Screen readers now hear which build is loaded in the build menu, and after renaming, deleting or saving a build from that menu the keyboard focus returns to the menu button instead of the top of the page.
- The planner page has a proper page heading, the error page a main landmark, and the stat buttons read "Remove one combat point" rather than "Remove a combat point".

## [0.1.1] - 2026-10-05

### Overview

A fix for signed-in players who use more than one browser or device. Signing in on a new one no longer copies builds the account already holds.

### Fixed

- Signing in on another browser no longer copies builds your account already has. The offer to keep this browser's builds now lists only builds the account doesn't already hold under the same name with the same contents, and shows nothing when there are none. An import that still meets one reports it as already in your account instead of adding a "(2)" copy.

## [0.1.0] - 2026-10-04

### Overview

The first numbered release. It names the planner as it has been live since 21 September 2026; nothing here is new. The planner shows the whole Z-Team for the game Dispatch, with stat leveling, power training, flight training and the setup flags for the story's roster changes. It adds up synergy pairs and team totals, compares pairs on their own tab, and estimates mission success on the mission simulator tab. A hero's detail dialog holds their powers, their synergy partner and the player's notes. Builds save in the browser and travel as snapshot links, with no account needed. Signing in with Google also saves builds to the player's account, reachable from any device and shareable by a live link.
