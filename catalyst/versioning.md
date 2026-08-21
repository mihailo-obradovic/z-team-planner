# versioning.md

How the **Catalyst template** is versioned. The current number lives in `VERSION`; each project's `project-summary.md` carries a `Catalyst version` stamp — the Catalyst version its document shapes were last aligned to, written at spawn by `tools/new_project.py` and required by `tools/upgrade_project.py`. A spawn's own `VERSION`/`CHANGELOG.md` (`--versioning`, off by default) version the product being built and are unrelated to the stamp; the `post-commit` hook's `catalyst-requires: versioning` means _this_, not the stamp.

## The number

SemVer (`MAJOR.MINOR.PATCH`):

- **MAJOR** — a rule changed in a way that could break existing projects.
- **MINOR** — something new was added (a doc, workflow, stack).
- **PATCH** — fixes and wording, no rule change.

`1.0.0` is cut, so a rule change that could break an existing project is a MAJOR bump from here. The changelog stays in Catalyst — it never travels into spawns.

## Upgrading a project

From the Catalyst repo: `python3 tools/upgrade_project.py <project-path>` — dry-run by default, `--apply` writes. It prints the changelog between the project's stamp and the current version, three-way merges the copied rule files in the project's `catalyst/` (project-local edits preserved; real conflicts get markers), reports — but never touches — project-owned documents, offers opt-in adoptions the project lacks (new hooks, the experiments flow — whose acceptance is the one insert-only write to `project-summary.md`), refreshes the generated root pointers, and bumps the stamp only after confirmation. An opt-in the project turns down is recorded in `catalyst/.catalyst-declined` and never offered again — every one of them is presence-detected, so without that record "no" would be re-asked on every upgrade forever; each run lists what is on it, and deleting a line reopens the offer. The merge base comes from the release tags below; without the project's base tag it degrades to `.catalyst-new` sidecar files instead of overwriting.

## Releasing

Releasing the **template**, in the Catalyst repository — every file named here is template meta that never travels into spawns.

1. Prune `TODO.md`: remove what the release finished, correct what it moved.
2. Dry-run `python3 tools/sync_rules.py` against upstream; if rules drifted, apply and fold the sync into the release. Offline → skip and note it.
3. Move `CHANGELOG.md`'s `Unreleased` items under a new `## [X.Y.Z] - <date>` heading.
4. Set `VERSION` to `X.Y.Z`.
5. Commit, then tag `vX.Y.Z` — the tag is load-bearing: the upgrader reads spawn-time file contents from it. The optional `post-commit`/`post-merge` hooks tag automatically (`sh tools/hooks/install.sh`); pushing tags (`git push --tags`) stays deliberate.

Template build-out runs on `enhancement/<topic>-<date>` branches, merged into `master` when the topic is done; the changelog entry is the record. The branch classes in `prime-directive.md` (Feature Branches) govern projects built with Catalyst, not Catalyst itself.
