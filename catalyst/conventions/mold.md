# Mold

**Trigger:** running `/mold` on agent-generated or freshly changed code, and writing any new component or module — molded is the standard code is written to, not only cleaned back to.

**Molded** code has one primary function per component or module, names that carry the explanation, and comments that are rare and warranted. Agent-generated code drifts verbose — narration comments, one-use helpers, defensive wrapping. This document defines the molded standard and the `/mold` procedure that reshapes code back to it.

Scope boundary: mold owns **what a file carries** — whether a comment, a helper, or an abstraction earns its place. Language-level style rules — how a parameter is typed, where a function sits in the file — are [`code-style.md`](code-style.md)'s. The two never overlap; a rule that belongs to one is never restated in the other.

---

## Comments

A comment earns its line only by stating a _why_ the code cannot express — a constraint, a non-obvious decision, a footgun. When a comment explains _what_ the code does, the fix is a better name or a simpler shape, and then the comment goes.

A comment that survives that test is then written short: **one sentence states the fact, and a second is allowed only when it names a consequence the reader would otherwise discover by breaking something.** Length is not a budget to spend — a fact that fits in eight words is finished in eight words.

Markers, mandatory keeps, and formatting are owned by [`code-annotations.md`](code-annotations.md); in particular these always survive a mold:

- `// !` alerts
- deviation records in vendored or generated code (`// * Default:`, `// * Changes:`, `// * New variant`, removal notes) — they are the only recoverable upstream base
- documentation blocks (JSDoc, PHPDoc, and their kin)
- `// TODO` and `// ?` — work-tracking, not narration
- the single-line rule: comments stay unwrapped however long

## Naming

Names are concise and descriptive enough that the code reads without narration. Renames stay file-local: internal variables, private functions, local bindings. Everything another file consumes — exported symbols, props, emits, slots, route paths — is frozen; a badly named export goes on the flag list instead. Vue naming specifics: [`../stacks/frontend/_vue/vue-style.md`](../stacks/frontend/_vue/vue-style.md) and the component-naming documents beside it.

## Structure

Two tiers:

- **Within-file — applied directly:** inline one-use helpers, flatten needless nesting, dissolve dead abstractions and redundant guards, remove unused code.
- **File-graph — gated:** splitting a bloated component into children, or dissolving a pointless one. Proposed mid-run and applied only on the user's yes. Splits create, never mutate: new files and rewiring of the immediate parent are fine; every pre-existing outward contract stays frozen.

The invariant for both tiers: **nothing outside the molded area can tell anything happened** — rendered output, behavior, and public contracts are identical before and after.

## Untouchable

- Protected areas (`architecture.md`, Protected Areas)
- generated `.claude/skills/` wrappers and any other generated file
- vendored theme configs beyond what their annotation rules allow — deviations stay recorded, never "cleaned"

---

## The /mold run

1. **Target.** The paths passed as arguments; with none, the files changed since the branch point (`git diff --name-only $(git merge-base HEAD <default-branch>)`) plus uncommitted changes. List the targets before touching anything.
2. **Dispatch.** One agent for the whole target set — a single agent with the cross-file view split decisions need, never a per-file fan-out. A dedicated code-simplification agent is the recommendation where the toolchain has one; any capable general agent does the job. Its instructions: read this document and [`code-annotations.md`](code-annotations.md), apply the within-file tier directly, and _return_ (not apply) the file-graph proposals and the flag list.
3. **Gate.** Present each file-graph proposal to the user — what, why, resulting file layout — and send the approved ones back to the same agent to apply. No proposals → skip.
4. **Verify.** Run the lint, typecheck, and test commands the stack modules covering the touched files name as their own (`project-summary.md`, Technical Stack → the module's document). A failure is fixed or its causing change reverted before the run reports done.
5. **Report.** What changed per file; the flag list — wanted to change, out of bounds: badly named exports, comments of uncertain load-bearing, cross-cutting smells; verification results. Changes stay uncommitted — the user reviews and commits.

Done means: every targeted file is either molded or on the flag list with a reason, and every verification gate passes.
