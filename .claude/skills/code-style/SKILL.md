---
name: code-style
description: Language-level shaping rules this project writes to — no boolean parameters (a two-state input is a named string union, with options-object keys and third-party signatures as the two boundaries), principal export first with its helpers below in call order, braces on every control-flow body, and wall-clock time as the server's (an ISO-8601 UTC string, never a client-stamped epoch number; `Date` banned outright in TypeScript). Use when writing or changing a function signature, deciding where a function belongs in a file, reviewing a call site that passes a bare `true` or `false`, placing a helper in a new module, writing a conditional or a loop, or reading, storing, or rendering a timestamp.
---

<!-- catalyst:generated skill wrapper — the substance lives in the catalyst/ documents below; edit those, never this file. Regenerated on spawn and on every upgrade apply. -->

Read and follow, in order:

- `catalyst/conventions/code-style.md`

Paths inside those documents are relative to `catalyst/`. Repo conventions there win over any generic guidance from similarly-named installed skills or plugins.
