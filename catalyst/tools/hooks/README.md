# tools/hooks

Optional git hooks. The scaffolder asks which ones to copy (none by default), and **activation is a separate opt-in** — a file here does nothing until it is linked into `.git/hooks/`. This tracked directory is the versioned source of truth; `.git/hooks/` is not version-controlled and is only the per-clone activation point.

## Activating

```sh
sh catalyst/tools/hooks/install.sh              # all hooks in this directory
sh catalyst/tools/hooks/install.sh post-commit  # just one
```

In the Catalyst repository the path is `tools/hooks/install.sh`; the script locates itself either way. Hooks are symlinked, so edits take effect without reinstalling — where symlinks are unavailable they are copied instead, and a copy stays on the old version after an upgrade until `install.sh` is re-run. An existing hook of the same name is never overwritten. Activation is per clone: every developer runs `install.sh` once themselves. Agents never install or configure hooks — that is the user's call (`prime-directive.md`, Document Validation).

## The hooks

| Hook          | Requires     | What it does                                                                                                                                                                                                                                                                                   |
| ------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pre-commit`  | —            | Runs the validator (found in the Catalyst repo, a project's `catalyst/tools/`, or an older spawn's `tools/`) and blocks the commit on errors — never on notes. Validates the working tree as it sits on disk, not the staged index; skips gracefully where the validator or python3 is absent. |
| `post-commit` | `versioning` | When a commit on the default branch changes `VERSION`, tags it `v<VERSION>` — locally only; pushing the tag (`git push --tags`) stays deliberate.                                                                                                                                              |
| `post-merge`  | `versioning` | The same tag for releases that arrive by merge or pull, which no commit hook ever sees — untagged releases break the upgrader's merge base.                                                                                                                                                    |

Both tag hooks resolve the default branch themselves: `git config catalyst.defaultbranch` (the explicit override) wins, then the remote's `origin/HEAD`, then whichever of `master`/`main` exists locally. A fresh spawn is `master`; an adopted repository on `main` needs no configuration.

## Requirements

A hook declares what the project must have with a `# catalyst-requires: <token>` line in its header; it is only offered — at spawn or on upgrade — when the project meets it, and `install.sh` checks the same tokens itself, skipping a hook whose requirement the project does not provide. `versioning` means the project versions itself with its own `VERSION` file, not the `Catalyst version` stamp (`versioning.md`).

Upgrades: run from the Catalyst repo, `tools/upgrade_project.py` updates the hooks a project carries, never re-adds a declined one, and offers new ones under `--apply`. A hook turned down — at spawn or at that offer — is written to `catalyst/.catalyst-declined` and not offered again; delete its `hook:<name>` line to be asked on the next upgrade. A hook held back by its `catalyst-requires:` is not a refusal and is offered as soon as the project qualifies.

## Adding a hook

Name the file exactly as git names the hook (`pre-commit`, `post-commit`, …) — extensionless, since any file with a suffix is treated as support material rather than a hook. Make it executable, declare its `catalyst-requires:` tokens, and add a row to the table above.
