# Convention Annexes

**Trigger:** a repository that keeps deep, cross-cutting convention guides (styling system, framework rules, type conventions) that belong to no single folder. Most projects have none.

These are the project's own, written by it and never upgraded — distinct from Catalyst's `conventions/` (`architecture.md`, Conventions). They live as annexes owned and indexed by `architecture.md`, lazy-loaded like folder documents, with their load triggers listed in the entry document. A convention change updates the annex, not the index. On conflict: feature contracts and `architecture.md` win over annexes; annexes win over generic tool or skill guidance (`references/agent-skills.md`, Precedence). Annexes never carry workflow rules or behavior contracts.
