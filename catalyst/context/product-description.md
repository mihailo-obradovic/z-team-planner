# Product Description

A **context document** (`references/context-documents.md`): background depth behind the one-paragraph purpose in `project-summary.md`. It records product vision and intent — _not_ behavior. It is never a contract: when it disagrees with a feature document or `architecture.md`, the contract wins and this file is updated to catch up. Keep it scannable; trim to what shapes decisions and link out for the rest.

**Loads when:** product-shaping work — drafting or estimating a feature document, a product-motivated decision record, Init Design input-gathering, brownfield prioritization, an experiment's Success Bar or graduation, or any task touching product scope, phases, or priorities.

## Vision

Players of **Dispatch** (AdHoc Studio's superhero workplace comedy) level heroes, train powers, and pick synergy pairs across a playthrough with limited resources and story-driven roster changes. This tool lets them plan those choices ahead of time: a single-page calculator showing the whole Z-Team with per-hero controls, synergy effects, and team-wide totals, so a build can be theory-crafted, saved, and shared instead of discovered by trial and error in-game.

## Users

One user type: Dispatch players planning or comparing builds. Sub-cases, not separate groups:

- **Planners** — adjust levels, powers, and flight training for their own playthrough, matching the setup flags to their story choices.
- **Sharers/receivers** — exchange finished builds via URL; a receiver opens a link and sees the full build without any account.

## Scope And Non-Goals

In scope:

- Full-roster overview with per-hero stat leveling, power training, and flight capability controls.
- Synergy pair and team-composition effects reflected in computed totals.
- Setup flags mirroring story roster changes (episode 3 cut, episode 4 hire).
- Saving/loading builds locally (localStorage) and sharing them by URL.

Non-goals:

- User accounts or server-side build storage — persistence is deliberately client-only; sharing is the URL itself.
- Simulating dispatch gameplay (calls, cooldowns, scoring) — the tool plans builds, it does not play shifts.
- Story/choice tracking beyond the roster-affecting flags.

## Phases And Priorities

| Phase             | Focus                                                      | Priority |
| ----------------- | ---------------------------------------------------------- | -------- |
| Core calculator   | Roster overview, hero controls, synergy pairs, team totals | must     |
| Build persistence | Save/load builds locally, share via URL (in progress)      | must     |
| Polish            | Mobile layout, theming, visual refinement                  | should   |

## Key Integrations

- None at runtime — the app is self-contained; hero base data ships with the app (static Nitro endpoint).
- `context/game-mechanics.md`: the game-mechanics reference all hero data and rules are transcribed from; the game itself is the upstream source of truth.

## Success Signals

- A build for any roster configuration can be assembled without consulting the game.
- A shared URL reproduces the exact build on another device with no account or setup.
- Computed stats and synergy effects match observed in-game values.
