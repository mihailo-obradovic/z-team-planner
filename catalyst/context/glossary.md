# Glossary

**Trigger:** naming a type, function, or variable that handles a build; reading code where "build" appears; or writing a feature or decision document that discusses one.

The project's domain language. A glossary and nothing else — no implementation detail, no rules. Where a term maps onto a type, the type is named as a pointer, never as the definition.

## Builds

"Build" alone is ambiguous and is never used as a bare noun in code. Four distinct things carry the word, and each has its own term.

| Term               | What it is                                                                                                                                                                           | Named in code as  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------- |
| **build document** | The portable snapshot of a planner state — episode choices and every allocation, at their current values. Has no name, no owner, and no id; it is the payload the other three carry. | `SerializedBuild` |
| **local build**    | A named build document saved in this browser, belonging to whoever is using it. Exists whether or not anyone is signed in.                                                           | `LocalBuild`      |
| **cloud build**    | A named build document saved to the account of a signed-in user, reachable from any of their devices.                                                                                | `CloudBuild`      |
| **shared build**   | The read-only view of a cloud build that anyone holding its link can open, signed in or not.                                                                                         | `SharedBuild`     |

A **local build** and a **cloud build** are never the same object, even when they hold identical documents and the same name: they have separate ids, separate lifecycles, and separate delete semantics. Copying between them is always an explicit act by the user.

A **shared build** is not a fifth stored thing — it is a projection of one cloud build, and it disappears when that cloud build is deleted.

## Planner

**Planner state** — the live, in-memory roster the user is manipulating. Exactly one exists at a time. Every build above is planner state at a moment, written down; loading any of them replaces it.

**Episode setup** — the story-driven roster choices (who was cut in episode 3, who was hired in episode 4, whether episode 8 recruits are shown). Distinguished from allocations because it is upstream of them: changing episode setup can invalidate allocations that depended on a hero being present.

**Allocation** — any budgeted spend on a hero: a stat level-up, a bonus level, a power training, a flight training. Budgets are per category, never pooled.

**Trainable** — a hero who can receive power or flight training. Every hero present before episode 8 is trainable; arriving in episode 8 is exactly what removes training, so "episode 8 recruit" and "untrainable" name the same set of heroes — one by cause, one by consequence. Named in code around `ep8RecruitIds`.

## Synergy

**Synergy pair** — a fixed two-hero pairing the game grants a bonus to. Pairs are always derived from episode setup (four base pairs, plus at most one conditional pair determined by the episode 3 cut and episode 4 hire); a user never creates, removes, or toggles a pair directly.

**Effective stat** — a hero's displayed value for one stat: starting value plus allocations plus any special-power bonus, capped at the game's per-stat maximum. Named in code around `MAX_STAT_VALUE`.

**Pair total** — the per-stat sum of both heroes' effective stats in a synergy pair. May exceed the per-stat maximum, because it describes two heroes; only single-hero scales (like a radar axis) cap it.

## Modes

**Shared-build mode** — the planner is displaying a build document that did not come from the user's own saves, so it has nothing of theirs to lose and offers to save a copy rather than to save. Entered by opening a share link, left by saving a copy or returning to their own build.

Viewing one's own **cloud build** is not shared-build mode, even though both arrive over the network.

## Mission simulator

**Mission template** — one of the simulator's three fixed, unnamed call definitions: five required stat values, plus at most one optional per-stat condition column (a 2×XP threshold on template #2, a fail threshold on template #3). Always a 4-slot call.

**Mission team** — the up-to-four heroes placed into the simulator's slots. Distinct from the roster: it is a selection for one simulated call, not who exists.

**Slot** — one of the four ordered positions in a mission team. Position matters: some powers pay differently by slot, and an empty slot is itself a quantity powers consume.

**Illusion** — the stat-only occupant Prism's power places beside her: a copy of her left neighbor's stats in the slot to her right. It fills a slot but is nobody for power, synergy, or roster purposes.

**Estimated success** — the simulator's percentage for the active mission template: radar coverage plus the synergy boost, adjusted by reattempt powers, zeroed by a tripped fail threshold.

**Synergy level** — the 0–3 setting standing for how practiced a synergy pair is, worth +5% success per level. One global level, applied once; meaningful only while the mission team holds a synergy pair. Named in code around `SynergyLevel`.
