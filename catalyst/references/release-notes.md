# Release Notes

**Trigger:** a deployable that ships to people who do not read this repo's history (operators, another team, a client). A project nobody deploys to skips them entirely. Optional, adopted per project.

Such a deployable keeps `release-notes.md` — per release: version, date, a short Overview, then Added / Changed / Fixed. Any release that changes the database schema carries an explicit **Database** line naming the migration and the change; shipping a schema change without it is unfinished work. Release notes describe the release for its consumers; they never replace feature documents or decision records.
