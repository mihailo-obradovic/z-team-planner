# Decision: Alert when a day passes without a scheduled backup

## Status

Accepted

## Type

infra

## Task Weight

Easy

## Context

`backup.yml` runs on GitHub's scheduler, and it can stop running without anyone being told. GitHub can skip a scheduled run when it is under load. It also disables scheduled workflows in a public repository after 60 days without activity, and they stay off until someone re-enables them. A run that never starts never fails, so neither case sends a notification.

The bucket then just stops growing. Pruning runs only inside a backup run, so the last dumps stay, age past the 30-day retention, and nothing replaces them. The guarantee in `operations.md` is one scheduled dump per day, and today nothing checks it.

## Decision

The backup becomes a dead-man's switch on healthchecks.io (free tier). It alerts when an expected ping does not arrive.

- Only a run whose `reason` is `scheduled` pings, as its last step after the prune. Manual and pre-migration runs never ping, so a hand-taken dump cannot hide a broken schedule.
- A scheduled run that fails pings `<url>/fail`, which alerts at once. That puts every backup alert in one channel, instead of the GitHub email that only reaches whoever last edited the cron.
- The check has a 1-day period and an 8-hour grace, so it alerts about 32 hours after the last scheduled dump. The observed 5–7-hour start delay never trips it, and a skipped day trips it the same day.
- A ping that cannot be delivered never fails the backup (five retries, then a run warning). The dump is already safe, and a missing ping turns into a false alert, which is the safe direction.
- The ping URL carries its own credential, so it is a repository secret, `HEALTHCHECKS_PING_URL`.

Rejected:

- A second scheduled workflow that reads the bucket. It shares the failing scheduler and gets skipped or disabled with it.
- A check in CI on push. It only runs while the maintainer is active, which is exactly when the 60-day disable cannot happen.
- A Vercel cron on the API. It would bring R2 credentials and an alert channel into the application.
- A Quirks line and the habit of reading `gh run list`. A habit lapses in the same quiet stretch in which the schedule lapses.

## Scope

`.github/workflows/backup.yml` (two ping steps) and `catalyst/operations.md` (Backups) cover setup, the missed-run alert, and re-enabling a disabled schedule. The new service is recorded in `architecture.md`. healthchecks.io receives an empty request carrying a timestamp and the runner's IP, and no personal data, so the privacy page is unchanged. There is no application code and no behavior contract.

## Consequences

Better: a schedule that has stopped, for whatever reason, becomes an email within about a day and a half.

Riskier: one more external account and one more secret. If healthchecks.io goes away, alerting goes silent rather than loud. Neither the backups nor this record's guarantee depend on it.

The check is set up by hand in healthchecks.io's UI. This departs from `architecture.md` Observability, which says alert rules are versioned files that are never built by hand. `operations.md` states the check's two settings, and that statement is the versioned source of truth. Provisioning one check through the management API would add a second secret and a script, all for a two-field configuration.

Maintainer console work: create the account and the check (period 1 day, grace 8 hours, email integration), then set the `HEALTHCHECKS_PING_URL` secret.

## Contracts Touched

- `catalyst/operations.md`: Backups (intro, Operate, Quirks).
- `catalyst/architecture.md`: Approved CI Actions, the note on `backup.yml`'s outbound calls.
- `project-summary.md`: the ADR index.

## Open Questions

## Verification

On 2026-10-02 the maintainer set the `HEALTHCHECKS_PING_URL` secret and checked by hand that the email alert works. healthchecks.io's test notification arrived. A `curl` to `<url>/fail` raised the failure alert, and a plain ping reset it, which also armed the check's 1-day clock.

Still to be seen: the first scheduled run after master is pushed checks in on the dashboard, and a dispatched run skips both ping steps. The record stays `Accepted` until the scheduled check-in is seen.
