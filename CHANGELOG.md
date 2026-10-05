# Changelog

What changed in Z-Team Planner, newest release first, for the players who use it and for whoever operates it. Format: [Keep a Changelog](https://keepachangelog.com), versions follow [Semantic Versioning](https://semver.org).

Each release gives its version and date, a short **Overview**, then **Added**, **Changed** and **Fixed** as needed. A release that changes the database schema also carries a **Database** line that names the migration and what it changes. Only changes a player or the operator would notice get an entry. Dependency updates appear only when they change behavior or the schema.

## [Unreleased]

## [0.1.1] - 2026-10-05

### Overview

A fix for signed-in players who use more than one browser or device. Signing in on a new one no longer copies builds the account already holds.

### Fixed

- Signing in on another browser no longer copies builds your account already has. The offer to keep this browser's builds now lists only builds the account doesn't already hold under the same name with the same contents, and shows nothing when there are none. An import that still meets one reports it as already in your account instead of adding a "(2)" copy.

## [0.1.0] - 2026-10-04

### Overview

The first numbered release. It names the planner as it has been live since 21 September 2026; nothing here is new. The planner shows the whole Z-Team for the game Dispatch, with stat leveling, power training, flight training and the setup flags for the story's roster changes. It adds up synergy pairs and team totals, compares pairs on their own tab, and estimates mission success on the mission simulator tab. A hero's detail dialog holds their powers, their synergy partner and the player's notes. Builds save in the browser and travel as snapshot links, with no account needed. Signing in with Google also saves builds to the player's account, reachable from any device and shareable by a live link.
