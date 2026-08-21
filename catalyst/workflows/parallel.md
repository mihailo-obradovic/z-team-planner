# Workflow: Parallel Feature Work

**Trigger:** two or more separately approved features (or decision records) to be implemented together. Drafting is always sequential — only implementation may be parallel.

The locked invariant is in the Flow Index (`prime-directive.md`).

## Steps

1. Draft documents one at a time, in a single session — each needs the user's answers and approval, and parallel drafting can reserve the same number.
2. Check independence first: no shared protected areas or files. On overlap, say so and implement sequentially.
3. One git worktree per branch; parallel flows never share a working tree. In one session, keep one feature in the main flow and hand the others to subagents — each in its own worktree, each given the approved document and a written plan, never an open-ended task. Review each subagent's diff before merging.
4. Only one flow owns the shared runtime (e.g. the docker compose stack); tests must run without it. The branch that merges second resolves DB migration ordering first.
5. In separate sessions, each session runs the same independence check itself: list unmerged branches of every class (`feature/*`, `decision/*`, `experiment/*`, `fix/*`), read their documents from the default branch, compare entry points and protected areas; on overlap, stop and tell the user — do not race the other session.
