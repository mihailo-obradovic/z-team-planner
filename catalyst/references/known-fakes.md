# Known Fakes Register

**Trigger:** a project carrying placeholder or synthetic data (Honest Inputs, `prime-directive.md`). A project with no fabricated data has no `KNOWN_FAKES.md` and skips this entirely.

Such a project carries `KNOWN_FAKES.md` — the register of every fabricated input still in the tree. One file per project, one table row per fake: **What** (the fake and where it lives, including where its loud runtime flag is emitted), **Why** (why real data was unavailable), **Removal** (how it is replaced and what unblocks that — a concrete condition, never "later").

- Introducing, changing, or removing a fake updates its row in the same change (Same-Change Rule); the flag is deleted together with the fake.
- Delete the file with the last row — an empty register misreads as attestation. Absence is the healthy state, and the validator errors on a register with no rows.
- Never a rules document: contracts stay in `architecture.md` and feature documents; this file only inventories what is currently fake.

Worked sample: `examples/KNOWN_FAKES.md`.
