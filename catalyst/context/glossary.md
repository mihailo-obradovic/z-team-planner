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

## Modes

**Shared-build mode** — the planner is displaying a build document that did not come from the user's own saves, so it has nothing of theirs to lose and offers to save a copy rather than to save. Entered by opening a share link, left by saving a copy or returning to their own build.

Viewing one's own **cloud build** is not shared-build mode, even though both arrive over the network.
