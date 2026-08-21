# Workflow: Incident Response

**Trigger:** a live system users depend on is down or materially broken — also data corruption or a security incident (not dev/staging). Stabilizing it outranks all other work.

The locked invariant is in the Flow Index (`prime-directive.md`).

## Steps

1. **Stabilize first, no diagnosis required.** Roll back to the last good version or switch the feature off. That is not a fix — it is a return to a known-good state — so it needs no root cause and no document beforehand; do it immediately and tell the user what was done.
2. **Then fix by the normal rules.** After stabilization the Bug Fixes rule (`prime-directive.md`) applies in full.
3. **Hotfix only with explicit approval.** Shipping a patch before the full root-cause analysis requires the user's explicit approval; it is recorded as debt (`Hotfix — root cause pending`) and the debt closes only when the real cause is confirmed and covered by a test. An open hotfix debt is treated as an open question on the project.
4. **Every incident leaves a trail:** a decision record of type `incident` — what broke, when, what was done (rollback / switch-off / approved hotfix), and what debt remains.
