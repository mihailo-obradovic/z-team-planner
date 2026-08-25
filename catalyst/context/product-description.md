# Product Description

A **context document** (`references/context-documents.md`): background depth behind the one-paragraph purpose in `project-summary.md`. It records product vision and intent — _not_ behavior. It is never a contract: when it disagrees with a feature document or `architecture.md`, the contract wins and this file is updated to catch up. Keep it scannable; trim to what shapes decisions and link out for the rest.

**Loads when:** product-shaping work — drafting or estimating a feature document, a product-motivated decision record, Init Design input-gathering, brownfield prioritization, an experiment's Success Bar or graduation, or any task touching product scope, phases, or priorities.

## Vision

Players of **Dispatch** (AdHoc Studio's superhero workplace comedy) level heroes, train powers, and pick synergy pairs across a playthrough with limited resources and story-driven roster changes. This tool lets them plan those choices ahead of time: a single-page calculator showing the whole Z-Team with per-hero controls, synergy effects, and team-wide totals, so a build can be theory-crafted, saved, and shared instead of discovered by trial and error in-game.

## Users

One user type: Dispatch players planning or comparing builds. Sub-cases, not separate groups:

- **Planners** — adjust levels, powers, and flight training for their own playthrough, matching the setup flags to their story choices.
- **Sharers/receivers** — exchange finished builds via URL; a receiver opens a link and sees the full build without any account.
- **Account holders** — sign in with Google so their builds follow them across devices and survive a cleared browser. The difference is just that builds can be saved on the server after logging in; nothing else changes.

## Scope And Non-Goals

In scope:

- Full-roster overview with per-hero stat leveling, power training, and flight capability controls.
- Synergy pair and team-composition effects reflected in computed totals.
- Setup flags mirroring story roster changes (episode 3 cut, episode 4 hire).
- Saving/loading builds locally (localStorage) and sharing them by URL — anonymous, at the user's own risk.
- Optional accounts (Google sign-in) with server-side saved builds and live share links.

Non-goals:

- Requiring an account — anonymous planning, local saves, and snapshot share links stay; an account is an offer, never a gate.
- Any login method that costs money to offer (Apple sign-in) or needs a mail pipeline to run (email + password).
- Simulating dispatch gameplay (calls, cooldowns, scoring) — the tool plans builds, it does not play shifts.
- Story/choice tracking beyond the roster-affecting flags.

## Phases And Priorities

| Phase             | Focus                                                                        | Priority |
| ----------------- | ---------------------------------------------------------------------------- | -------- |
| Core calculator   | Roster overview, hero controls, synergy pairs, team totals                   | must     |
| Build persistence | Save/load builds locally, share via URL                                      | must     |
| Accounts          | Google sign-in, server-side builds, live share links, import of local builds | should   |
| Polish            | Mobile layout, theming, visual refinement                                    | should   |

## Key Integrations

- Hero base data ships with the app as typed constants; it never leaves the frontend.
- **Neon** (serverless Postgres) holds accounts and account builds; **Firebase Authentication** issues the identity. Both on free tiers — the project is a hobby and must stay free or very low cost (decision 004).
- `context/game-mechanics.md`: the game-mechanics reference all hero data and rules are transcribed from; the game itself is the upstream source of truth.

## Success Signals

- A build for any roster configuration can be assembled without consulting the game.
- A shared URL reproduces the exact build on another device with no account or setup.
- A signed-in user finds their builds on a second device, and a live share link shows the owner's latest edits.
- Computed stats and synergy effects match observed in-game values.
