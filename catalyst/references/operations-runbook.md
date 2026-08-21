# Operations Runbook

**Trigger:** a project with stateful infrastructure (broker, database, cache, IdP). A purely stateless project skips this entirely.

Such a project carries `operations.md` — the operator's document: how to run what is already built. One file per project, one section per component, three parts each: **Operate** (inspection commands, ready to paste), **Recovery** (the drill, step by step, with the date it was last actually performed), **Quirks** (traps that already bit someone).

- Infra work that introduces or changes a stateful component updates its runbook section in the same change (Same-Change Rule). The decision record keeps the why and the verification evidence; the commands live here.
- The tested-restore rule (`architecture.md`, Persistence) reports here: the restore procedure's home is the component's Recovery part.
- Never rules or contracts — those live in `architecture.md` and feature documents. Commands, procedures, and quirks only.

Worked sample: `examples/operations.md`.
