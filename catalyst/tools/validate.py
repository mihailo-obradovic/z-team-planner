#!/usr/bin/env python3
"""Catalyst document validator.

Machine-checks document shape and cross-reference consistency, so drift does not depend on anyone remembering the rules:

  python3 tools/validate.py                      # validate the Catalyst repo itself
  python3 catalyst/tools/validate.py <project>   # validate a project spawned from it
  python3 catalyst/tools/validate.py .           # same, from inside the project
  ... --all                                      # template-check every document, not only the ones changed in the tree

Which mode runs is decided by `tools/new_project.py`: the scaffolder is never copied into a spawn, so its presence is what identifies the Catalyst repo. A project that opted into its own `VERSION` + `CHANGELOG.md` is still a project.

A spawn keeps its whole rule set in one bundle directory, `<project>/catalyst/`, so a project path is resolved to that bundle before anything is checked (`bundle_root`). Every project document lives inside it and refers to its siblings, which is why the checks below need no notion of the prefix — only `changed_docs`, which talks to git, has to translate.

Catalyst's own layout is the bundle layout with the bundle at the repository root, so the same checks read both.

Catalyst checks: `VERSION` matches the newest changelog entry (R1), `CLAUDE.md` imports `AGENTS.md` (R2), changelog shape (R3), examples follow the current templates (R4, feature/decision/experiment examples), the Flow Index in `prime-directive.md` points at exactly the `workflows/` shards that exist, every `workflows/`, `references/`, and `conventions/` shard carries its **Trigger:** header, and every `references/` and `conventions/` shard is reachable from an always-loaded document (R6), stack documents carry their contract headers — layer/tool for modules, category/tool for addon docs and payloads, `**Tier:**` for shared-tier docs, YAML `title:` frontmatter for `rules/` files (R7), the context-document catalog agrees across its four mirrors — the Catalog table, `CONTEXT_DOCS` in the scaffolder, the `templates/` stub, and the load-trigger bullet (R8), shared-tier wiring is closed both ways — every `**Requires:**` value resolves to an existing tier, every tier is required by some module (R9), the generated-skill registry (`SKILLS` in the scaffolder) points at existing documents and agrees with `references/agent-skills.md` in both directions (R10), the editor-extension registries (`EDITOR_EXTENSIONS` and `UNWANTED_EXTENSIONS`) do the same against `conventions/editor-setup.md` (R11), the template's markdown is oxfmt-canonical — `pnpm dlx oxfmt --check` tracking `oxfmt@latest` passes, skipped with a note when pnpm is absent (R12), every backticked document path in prose resolves to a document the template has (R13), the scaffolder's copy lists (`MANIFEST`, `EXPERIMENT_FILES`, `HOOKS_SUPPORT`) name files that exist and agree with the file/directory split the upgrader relies on (R14), `tools/hooks/README.md`'s table matches the hooks on disk and their `catalyst-requires:` headers (R15), and `sync_rules.py`'s hardcoded lists match the tree it syncs — every `rules/` payload known to the tool, every router carrying its `Upstream:` line, every deviation present and explained in its router's Provenance table (R16), `architecture.md`'s Stack Modules table links documents that exist and links every document a spawn can select (R17), its Shared tiers paragraph enumerates exactly the tier directories on disk (R18), and `COVERAGE.md`'s document and rule counts match the tree for every row naming one module (R19).

Project checks (features, decision records, and experiments alike): index <-> files (P1), statuses (P2), template sections for new/changed documents only (P3, diff-aware), unique numbering (P4), Protected Areas rows point to existing documents (P5), a soft Catalyst-version drift note when the project's stamp lags (P6, note only), the size budgets (P7, diff-aware — a hard error over a feature's maximum, a note over a target), a soft note when Open Questions are not empty past the drafting gate (P8, diff-aware note), a soft note when a project with features has no operations.md (P9, note), a soft note when numbered documents exist but their folder's _template.md is not in the bundle — an unadopted flow (P10, note), an error when a present `KNOWN_FAKES.md` holds no register rows — absence is the healthy state, an empty register is deleted, not kept (P11), and the generated `.claude/skills/` wrappers at the repository root point into documents the bundle has (P12).

Exit code is non-zero when any error is found. Notes never block.

Stdlib only — no dependencies.
"""

from __future__ import annotations

import argparse
import ast
import re
import shutil
import subprocess
import sys
from pathlib import Path

CATALYST_ROOT = Path(__file__).resolve().parent.parent

# The directory a spawn keeps its rule set in, below the project root. Kept in step with new_project.py's BUNDLE.
BUNDLE = "catalyst"

# Where the optional git hooks live, and how their table is headed. Kept in step with new_project.py's HOOKS_DIR.
HOOKS_DIR = "tools/hooks"

# What marks a `.claude/skills/` wrapper as Catalyst's to rewrite; a skill without it is the project's own. Kept in step with new_project.py's SKILL_MARK.
SKILL_MARK = "<!-- catalyst:generated skill wrapper"

# The oxfmt the template's markdown is formatted with (R12). Tracks latest: when a new oxfmt release changes the output and the check starts failing on untouched files, rerun `pnpm dlx oxfmt@latest .` and commit the reflow.
OXFMT_VERSION = "latest"

FEATURE_STATUSES = {"Draft", "Approved", "Active", "Changing", "Deprecated", "Removed"}
EXPERIMENT_STATUSES = {"Proposed", "Running", "Adopted", "Refuted"}
DECISION_STATUSES = {"Proposed", "Accepted", "Implemented", "Superseded by"}

# Size budgets in characters — line widths are not capped (prime-directive.md, Feature Documents / Architectural Decision Records; workflows/experiments.md for experiments). Only a feature carries a hard maximum, because it is a contract others build against. A decision record and an experiment are point-in-time records held to the same target, and going over is a note.
FEATURE_CHAR_MAX = 14_400
FEATURE_CHAR_TARGET = 9_600
RECORD_CHAR_TARGET = 4_800

# Statuses that mean "past the drafting gate" — Open Questions must be empty.
_DRAFTING_STATUS = {"features": "Draft", "decisions": "Proposed", "experiments": "Proposed"}

# `## [X.Y.Z] - YYYY-MM-DD`; the date is optional so a dateless entry is still ordered (and gets a note) instead of being silently skipped. `## [Unreleased]` does not match, which is exactly right — it carries no version to order.
_ENTRY_RE = re.compile(r"^## \[(\d+\.\d+\.\d+)\](?:\s*-\s*(\d{4}-\d{2}-\d{2}))?\s*$")
_STAMP_RE = re.compile(r"Catalyst version:\s*(\d+\.\d+\.\d+)")

errors: list[str] = []
notes: list[str] = []


def error(message: str) -> None:
    errors.append(message)


def note(message: str) -> None:
    notes.append(message)


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def read_required(path: Path, root: Path, why: str) -> str | None:
    """A file a rule cannot run without: its text, or None with the error already recorded.

    Only for paths named in the code rather than found on disk. An absent one used to end the run in a traceback, which reads as a broken validator rather than a broken repository.
    """
    if not path.is_file():
        error(f"{path.relative_to(root) if root in path.parents else path}: missing — {why}")
        return None
    return read(path)


def is_catalyst_repo(root: Path) -> bool:
    """The scaffolder never travels into a spawn, so it identifies Catalyst."""
    return (root / "tools" / "new_project.py").is_file()


def template_sections(template: Path) -> list[str]:
    return re.findall(r"^## (.+)$", read(template), flags=re.MULTILINE)


def doc_sections(path: Path) -> set[str]:
    return set(re.findall(r"^## (.+)$", read(path), flags=re.MULTILINE))


def doc_status(path: Path) -> str | None:
    """First non-empty line under `## Status`."""
    lines = read(path).splitlines()
    for index, line in enumerate(lines):
        if line.strip() == "## Status":
            for follower in lines[index + 1 :]:
                if follower.startswith("## "):
                    return None
                if follower.strip():
                    return follower.strip()
    return None


def section_body(text: str, heading: str) -> list[str]:
    """Non-blank lines under `## <heading>`, up to the next `## `."""
    out: list[str] = []
    capture = False
    for line in text.splitlines():
        if line.startswith("## "):
            capture = line[3:].strip() == heading
            continue
        if capture and line.strip():
            out.append(line.rstrip())
    return out


def open_question_bullets(text: str) -> list[str]:
    """Real open-question bullets — excludes the `- <placeholder>` form."""
    return [
        line for line in section_body(text, "Open Questions")
        if line.lstrip().startswith("- ")
        and not re.fullmatch(r"-\s*<[^>]*>", line.strip())
    ]


def check_sections(path: Path, template: Path, label: str) -> None:
    if not template.exists():
        return
    missing = [s for s in template_sections(template) if s not in doc_sections(path)]
    if missing:
        error(f"{path}: {label} document is missing sections: {', '.join(missing)}")


def scaffolder_literal(path: Path, name: str):
    """A top-level literal assignment (`CONTEXT_DOCS`, `SKILLS`) from tools/new_project.py.

    Read rather than imported: the scaffolder is a CLI script, and importing it to inspect one list would run its module body. `ast.literal_eval` on the assignment keeps this a pure read. None when the assignment is absent or not a literal.
    """
    if not path.is_file():
        return None
    try:
        tree = ast.parse(read(path))
    except SyntaxError:
        return None
    for node in tree.body:
        if not isinstance(node, ast.Assign):
            continue
        if not any(isinstance(t, ast.Name) and t.id == name for t in node.targets):
            continue
        try:
            return ast.literal_eval(node.value)
        except ValueError:
            return None
    return None


def scaffolder_context_docs(path: Path) -> dict[str, bool] | None:
    """`CONTEXT_DOCS` from tools/new_project.py as name -> scaffold default."""
    entries = scaffolder_literal(path, "CONTEXT_DOCS")
    if entries is None:
        return None
    try:
        return {entry["name"]: bool(entry["default"]) for entry in entries}
    except (TypeError, KeyError):
        return None


def catalog_defaults(text: str) -> dict[str, bool]:
    """The Catalog table of references/context-documents.md as name -> scaffold default (`on`/`off`)."""
    rows: dict[str, bool] = {}
    in_section = False
    for line in text.splitlines():
        if line.startswith("## "):
            in_section = line.strip() == "## Catalog"
            continue
        if not in_section or not line.strip().startswith("|"):
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) < 2:
            continue
        name = re.fullmatch(r"`([^`]+)`", cells[0])  # skips the header and separator rows
        if name and cells[1] in ("on", "off"):
            rows[name.group(1)] = cells[1] == "on"
    return rows


_FENCE_RE = re.compile(r"^```.*?^```", re.M | re.S)
# A backticked path pointing at a document. Only `.md`: a stack document names the source files a project will write (`core/config.py`, `@/utils/signupAction.ts`) as often as it names a document, and those are the project's to create.
_PATH_RE = re.compile(r"`([^`\s]+\.md)`")

# Documents a spawn writes for itself, so the template legitimately has no copy — naming one is a pointer to where it would live, not a broken link (references/known-fakes.md, references/operations-runbook.md).
PROJECT_AUTHORED = {"KNOWN_FAKES.md", "operations.md"}


def doc_paths(text: str) -> set[str]:
    """Backticked document paths in prose, with fenced blocks and placeholder forms left out."""
    body = _FENCE_RE.sub("", text)
    out = set()
    for raw in _PATH_RE.findall(body):
        if any(ch in raw for ch in "<>*?|,"):  # `features/<nnn>_<feature>.md` and friends
            continue
        out.add(raw)
    return out


def tier_dirs(stacks_root: Path) -> set[str]:
    """Shared-tier directories under stacks/, as `frontend/_react` — an `_`-prefixed path component and documents of their own.

    A grouping directory like `_lang/` holds tiers rather than documents, so it is not one itself.
    """
    out = set()
    for path in stacks_root.rglob("*"):
        if not path.is_dir():
            continue
        parts = path.relative_to(stacks_root).parts
        if not any(seg.startswith("_") for seg in parts):
            continue
        if any(child.is_file() and child.suffix == ".md" for child in path.iterdir()):
            out.add("/".join(parts))
    return out


def selectable_docs(stacks_root: Path) -> set[str]:
    """Every document a spawn can choose: modules, their nested choices, and their addons.

    The same shape `tools/new_project.py` walks to build the interview — a module is `<layer>/<tool>.md` or `<layer>/<tool>/<tool>.md`, a choice is the same one level deeper, and an addon is `<module>/addons/<name>.md`. A module's other documents are indexed by the module itself, not by `architecture.md`.
    """
    out: set[str] = set()

    def entries(directory: Path) -> list[Path]:
        return [p for p in sorted(directory.iterdir()) if p.suffix == ".md" or (p.is_dir() and not p.name.startswith("_"))]

    def contract(entry: Path) -> Path:
        return entry if entry.is_file() else entry / f"{entry.name}.md"

    for layer in sorted(p for p in stacks_root.iterdir() if p.is_dir() and not p.name.startswith("_")):
        for module in entries(layer):
            doc = contract(module)
            if doc.is_file():
                out.add(str(doc.relative_to(stacks_root.parent)))
            if not module.is_dir():
                continue
            for addon in sorted((module / "addons").glob("*.md")):
                out.add(str(addon.relative_to(stacks_root.parent)))
            for sub in sorted(p for p in module.iterdir() if p.is_dir() and p.name not in ("addons", "rules", "starter")):
                for choice in entries(sub):
                    choice_doc = contract(choice)
                    if choice_doc.is_file():
                        out.add(str(choice_doc.relative_to(stacks_root.parent)))
    return out


def table_rows(text: str):
    """Every data row of every markdown table in `text`, as (headers, cells)."""
    headers: list[str] = []
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped.startswith("|"):
            headers = []
            continue
        cells = [c.strip() for c in stripped.strip("|").split("|")]
        if re.fullmatch(r"\|(?:\s*:?-+:?\s*\|)+", stripped):  # the separator under a header
            continue
        if not headers:
            headers = cells
            continue
        yield headers, cells


def module_path(stacks_root: Path, name: str) -> Path | None:
    """The one module, tier, choice, or addon payload named `name`, or None when it is not exactly one path."""
    if not stacks_root.is_dir():
        return None
    if "/" in name:
        dirs = [stacks_root / name] if (stacks_root / name).is_dir() else []
        files = [stacks_root / f"{name}.md"] if (stacks_root / f"{name}.md").is_file() else []
    else:
        dirs = [p for p in stacks_root.rglob(name) if p.is_dir() and p.name not in ("rules", "addons")]
        files = [p for p in stacks_root.rglob(f"{name}.md") if p.parent.name != "rules"]
    # A directory module carries its own contract document inside it, so both forms match; the directory is the module.
    candidates = dirs or files
    return candidates[0] if len(candidates) == 1 else None


def module_counts(path: Path) -> tuple[int, int]:
    """(own documents, rule files) for a module path.

    Own documents are the `.md` files directly in the directory — a nested choice, an addon, and a `rules/` payload each count for themselves, which is how COVERAGE.md's tables are built. A single-file module counts as the one document it is.
    """
    if path.is_file():
        return 1, 0
    return len(list(path.glob("*.md"))), len(list((path / "rules").glob("*.md")))


def table_row(text: str, heading: str, name: str, column: int) -> str:
    """One cell of the row whose first column is `name`, in the table under `## <heading>`."""
    in_section = False
    for line in text.splitlines():
        if line.startswith("## "):
            in_section = line.strip() == f"## {heading}"
            continue
        if not in_section or not line.strip().startswith("|"):
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) > column and cells[0] == f"`{name}`":
            return cells[column]
    return ""


def hook_requires(text: str) -> set[str]:
    """The `catalyst-requires:` tokens a hook script declares (tools/hooks/README.md, Requirements)."""
    m = re.search(r"^#\s*catalyst-requires:\s*(.+)$", text, re.M)
    return set(m.group(1).split()) if m else set()


def table_names(text: str, heading: str) -> set[str]:
    """Backticked first-column values of the table under `## <heading>` — a documented inventory."""
    names: set[str] = set()
    in_section = False
    for line in text.splitlines():
        if line.startswith("## "):
            in_section = line.strip() == f"## {heading}"
            continue
        if not in_section or not line.strip().startswith("|"):
            continue
        first = line.strip().strip("|").split("|")[0].strip()
        cell = re.fullmatch(r"`([^`]+)`", first)  # skips the header and separator rows
        if cell:
            names.add(cell.group(1))
    return names


def listed_names(text: str, marker: str) -> set[str]:
    """Backticked names after `marker` on the line carrying it — an inventory written as prose.

    references/agent-skills.md lists its wrappers in one sentence rather than a table, and the document is full of other backticked things; the marker is what makes the extraction exact.
    """
    for line in text.splitlines():
        head, sep, tail = line.partition(marker)
        if sep:
            return set(re.findall(r"`([^`]+)`", tail))
    return set()


# --- Catalyst checks ---------------------------------------------------------


def check_catalyst(root: Path) -> None:
    changelog = read_required(root / "CHANGELOG.md", root, "the template's history and R1's version source")
    entries = []
    for line in (changelog or "").splitlines():
        m = _ENTRY_RE.match(line)
        if m:
            entries.append((tuple(int(p) for p in m.group(1).split(".")), m.group(1), m.group(2)))

    # R1: VERSION == the newest changelog entry. The number lives in VERSION (versioning.md); releasing moves the two together.
    version_text = read_required(root / "VERSION", root, "the template's version (versioning.md)")
    declared = (version_text or "").strip()
    if version_text is None:
        pass
    elif not re.fullmatch(r"\d+\.\d+\.\d+", declared):
        error(f"VERSION: {declared!r} is not a MAJOR.MINOR.PATCH version")
    elif changelog is None:
        pass
    elif not entries:
        error("CHANGELOG.md: no version entries found")
    elif declared != entries[0][1]:
        error(
            f"version mismatch: VERSION says {declared}, newest CHANGELOG entry is {entries[0][1]}"
        )

    # R2: CLAUDE.md is an import of AGENTS.md, not a copy of it — one entry document, reachable under both names.
    claude = read_required(root / "CLAUDE.md", root, "the entry document under its second name")
    if claude is not None and "@AGENTS.md" not in claude:
        error("CLAUDE.md: does not import AGENTS.md (expected an `@AGENTS.md` line)")

    # R3: changelog entries strictly descending, each one dated.
    for newer, older in zip(entries, entries[1:]):
        if newer[0] <= older[0]:
            error(
                f"CHANGELOG.md: version {newer[1]} is not greater than the entry below it ({older[1]})"
            )
    for _, version, date in entries:
        if date is None:
            note(f"CHANGELOG.md: entry [{version}] has no `- YYYY-MM-DD` date")

    # R4: examples follow the current templates.
    for folder, template in (
        ("features", "features/_template.md"),
        ("decisions", "decisions/_template.md"),
        ("experiments", "experiments/_template.md"),
    ):
        for path in sorted((root / "examples" / folder).glob("[0-9]*.md")):
            check_sections(path, root / template, f"example {folder.rstrip('s')}")

    # R7: stack documents carry their contract headers, classified by path, most specific first. A file under a `rules/` dir is a vendored performance rule and carries YAML frontmatter with a `title:` (a missing `impact:` is a note — upstream omits it occasionally). A doc under an `addons/` dir — the addon itself or its payload dir — carries **Category:** (its grouping at spawn) + **Tool:**. A doc inside a shared tier (any `_`-prefixed path component, e.g. stacks/_lang/typescript/ or stacks/frontend/_react/) carries **Tier:** — tiers span layers, so Layer/Tool would say the wrong thing. Everything else is a module or choice doc and carries **Layer:** + **Tool:**.
    for path in sorted((root / "stacks").rglob("*.md")):
        text = read(path)
        parents = path.relative_to(root / "stacks").parts[:-1]
        if "rules" in parents:
            m = re.match(r"^---\n(.*?)\n---\n", text, re.DOTALL)
            if not m or not re.search(r"^title:", m.group(1), re.MULTILINE):
                error(f"{path}: rule file is missing YAML frontmatter with a `title:`")
            elif not re.search(r"^impact:", m.group(1), re.MULTILINE):
                note(f"{path}: rule frontmatter has no `impact:`")
            continue
        if "addons" in parents:
            labels = ("**Category:**", "**Tool:**")
        elif any(part.startswith("_") for part in parents):
            labels = ("**Tier:**",)
        else:
            labels = ("**Layer:**", "**Tool:**")
        for label in labels:
            if label not in text:
                error(f"{path}: stack document is missing {label}")

    # R9: shared-tier wiring parity, both directions. A `**Requires:**` header (same regex as REQUIRES_TIERS_RE in tools/new_project.py — keep them identical) must name existing tier directories, or a spawn would report a build-out gap; a tier directory holding documents that no module requires would never travel into any spawn, so it is dead weight the moment it drifts.
    stacks_root = root / "stacks"
    if stacks_root.is_dir():
        required: set[str] = set()
        for path in sorted(stacks_root.rglob("*.md")):
            for m in re.finditer(r"^\*\*Requires:\*\*\s*(.+)$", read(path), re.MULTILINE):
                for part in re.split(r"[·,]", m.group(1)):
                    tier = part.strip()
                    if not tier:
                        continue
                    required.add(tier)
                    if not (stacks_root / tier).is_dir():
                        error(f"{path}: **Requires:** names stacks/{tier}, which does not exist")
                    elif not any(seg.startswith("_") for seg in Path(tier).parts):
                        error(f"{path}: **Requires:** names stacks/{tier}, which is not a shared tier (no `_`-prefixed path component)")
        for rel in sorted(tier_dirs(stacks_root)):
            if not any(rel == r or rel.startswith(r + "/") for r in required):
                error(f"stacks/{rel}: shared-tier directory is required by no module's **Requires:** header — it would never travel into a spawn")

    # R6: the Flow Index in prime-directive.md points at exactly the workflows/ shards that exist (both directions), every workflows/ and references/ shard carries its **Trigger:** header, and every references/ shard is pointed at from an always-loaded document — the step detail lives in one place, reachable from the always-loaded core.
    for folder in ("workflows", "references", "conventions"):
        for path in sorted((root / folder).glob("*.md")):
            if "**Trigger:**" not in read(path):
                error(f"{path}: shard document is missing **Trigger:**")
    prime = read_required(root / "prime-directive.md", root, "the global rules every session loads") or ""
    workflows_built = (root / "workflows").is_dir()
    workflow_files = {p.name for p in (root / "workflows").glob("*.md")}
    linked = set(re.findall(r"\(workflows/([^)]+\.md)\)", prime))
    for orphan in sorted(workflow_files - linked):
        error(f"workflows/{orphan}: exists but no Flow Index row in prime-directive.md points to it")
    for dead in sorted(linked - workflow_files):
        # A Flow Index row pointing into a directory that does not exist at all is a known build-out gap (TODO.md), not drift — the same tolerance every other check gives an absent directory. Once workflows/ lands, a dead link means a real broken reference.
        report = error if workflows_built else note
        report(f"prime-directive.md: Flow Index points to missing file workflows/{dead}")
    # references/ and conventions/ shards are reachable the same way — pointed at from an always-loaded document, so "not preloaded" is still findable. A conventions/ document binds every project whatever its stack, which makes an unreachable one worse than a stray reference shard: it ships into every spawn and is read by nobody.
    always_loaded = "\n".join(
        read(root / name)
        for name in ("AGENTS.md", "prime-directive.md", "architecture.md", "project-summary.md")
        if (root / name).exists()
    )
    for folder in ("references", "conventions"):
        for path in sorted((root / folder).glob("*.md")):
            if f"{folder}/{path.name}" not in always_loaded:
                error(f"{folder}/{path.name}: exists but no always-loaded document points to it")

    # R8: the context-document catalog is mirrored in four places (references/context-documents.md, "Adding a context document") — the Catalog table, CONTEXT_DOCS in the scaffolder, a templates/<name>.md stub, and a load-trigger bullet in prime-directive.md. Drift is invisible otherwise: a default that disagrees silently changes what every spawn ships.
    catalog_path = root / "references" / "context-documents.md"
    if catalog_path.exists():
        catalog = catalog_defaults(read(catalog_path))
        scaffolder = scaffolder_context_docs(root / "tools" / "new_project.py")
        if scaffolder is None:
            error("tools/new_project.py: CONTEXT_DOCS not found or not a literal list — references/context-documents.md's Catalog cannot be checked for parity")
        else:
            for name in sorted(set(catalog) - set(scaffolder)):
                error(f"references/context-documents.md: Catalog lists `{name}` but CONTEXT_DOCS in tools/new_project.py does not — a spawn never offers it")
            for name in sorted(set(scaffolder) - set(catalog)):
                error(f"tools/new_project.py: CONTEXT_DOCS has `{name}` but the Catalog in references/context-documents.md has no row for it")
            for name in sorted(set(catalog) & set(scaffolder)):
                if catalog[name] != scaffolder[name]:
                    error(f"context document `{name}`: the Catalog says {'on' if catalog[name] else 'off'} but CONTEXT_DOCS says default={scaffolder[name]}")
            for name in sorted(set(catalog) | set(scaffolder)):
                if not (root / "templates" / f"{name}.md").is_file():
                    error(f"templates/{name}.md: context document `{name}` has no template stub — a spawn that opts into it would copy nothing")
                # Soft: a stale load trigger changes nothing a spawn ships, but the document is then loaded by no rule.
                if f"context/{name}.md" not in prime:
                    note(f"prime-directive.md: no Context Loading bullet for `context/{name}.md` — the document would be copied but never loaded")

    # R10: generated-skill parity. Every SKILLS entry in the scaffolder must point at documents the template actually has — a `needs` path that does not exist means the wrapper can never be generated, a `points_at` path that does not exist is a pointer into nothing — and every skill must be named in references/agent-skills.md, so the wrapper mechanism stays documented alongside its inventory.
    skills = scaffolder_literal(root / "tools" / "new_project.py", "SKILLS")
    skills_shard = root / "references" / "agent-skills.md"
    if skills is None:
        error("tools/new_project.py: SKILLS not found or not a literal list — generated skill wrappers cannot be checked (R10)")
    else:
        shard_text = read(skills_shard) if skills_shard.is_file() else ""
        if not skills_shard.is_file():
            error("references/agent-skills.md: missing, but the scaffolder defines SKILLS — the wrapper mechanism would be documented nowhere")
        for skill in skills:
            name = skill.get("name", "<unnamed>")
            for rel in list(skill.get("needs", ())) + list(skill.get("points_at", ())):
                if not (root / rel).exists():
                    error(f"tools/new_project.py: SKILLS `{name}` references {rel}, which does not exist in the template")
            if shard_text and f"`{name}`" not in shard_text:
                error(f"references/agent-skills.md: generated skill `{name}` is not mentioned — list every wrapper the scaffolder can generate")
        # The other direction: a wrapper the inventory sentence still lists after the scaffolder dropped it. Nothing generates it any more, so the document promises a skill no spawn has.
        for name in sorted(listed_names(shard_text, "Current wrappers:") - {s.get("name") for s in skills}):
            error(f"references/agent-skills.md: lists generated skill `{name}`, which is not in SKILLS — no spawn generates it")

    # R11: editor-extension parity, the same directions R10 checks for skills. A `needs` path that does not exist gates the entry off forever — the extension would silently never be recommended — an entry absent from conventions/editor-setup.md means the generated .vscode/extensions.json carries a recommendation the documents never explain, and a row in the document with no entry recommends something no spawn receives. All three drift silently: the spawn still succeeds and nothing points at the gap.
    extensions = scaffolder_literal(root / "tools" / "new_project.py", "EDITOR_EXTENSIONS")
    setup_shard = root / "conventions" / "editor-setup.md"
    if extensions is None:
        error("tools/new_project.py: EDITOR_EXTENSIONS not found or not a literal list — the generated .vscode/extensions.json cannot be checked (R11)")
    else:
        setup_text = read(setup_shard) if setup_shard.is_file() else ""
        if not setup_shard.is_file():
            error("conventions/editor-setup.md: missing, but the scaffolder defines EDITOR_EXTENSIONS — the extension set would be documented nowhere")
        for ext in extensions:
            ident = ext.get("id", "<unnamed>")
            for rel in ext.get("needs", ()):
                if not (root / rel).exists():
                    error(f"tools/new_project.py: EDITOR_EXTENSIONS `{ident}` needs {rel}, which does not exist in the template — the extension could never be recommended")
            if setup_text and f"`{ident}`" not in setup_text:
                error(f"conventions/editor-setup.md: recommended extension `{ident}` is not in the table — every generated recommendation is documented")
        # The other direction: a table row the scaffolder no longer carries. The document then recommends an extension no spawn ever receives.
        for ident in sorted(table_names(setup_text, "Recommended extensions") - {e.get("id") for e in extensions}):
            error(f"conventions/editor-setup.md: recommends `{ident}`, which is not in EDITOR_EXTENSIONS — no spawn is given it")

    # R11 again for the unwanted registry: same drift, opposite sign — an undocumented entry silently un-recommends an extension nothing explains, and a table row with no entry documents a rejection no spawn writes.
    unwanted = scaffolder_literal(root / "tools" / "new_project.py", "UNWANTED_EXTENSIONS")
    if unwanted is None:
        error("tools/new_project.py: UNWANTED_EXTENSIONS not found or not a literal list — the generated unwantedRecommendations block cannot be checked (R11)")
    elif setup_shard.is_file():
        setup_text = read(setup_shard)
        for ext in unwanted:
            ident = ext.get("id", "<unnamed>")
            for rel in ext.get("needs", ()):
                if not (root / rel).exists():
                    error(f"tools/new_project.py: UNWANTED_EXTENSIONS `{ident}` needs {rel}, which does not exist in the template — the rejection could never fire")
            if f"`{ident}`" not in setup_text:
                error(f"conventions/editor-setup.md: unwanted extension `{ident}` is not in the table — every generated rejection is documented")
        for ident in sorted(table_names(setup_text, "Unwanted extensions") - {e.get("id") for e in unwanted}):
            error(f"conventions/editor-setup.md: rejects `{ident}`, which is not in UNWANTED_EXTENSIONS — no spawn writes it")

    # R13: every backticked document path resolves. Pointing at a document is how the bundle routes work — a shard nobody can open is guidance that silently never loads, and a rename leaves the old name behind in prose no rule ever reads. A path resolves relative to the repository root or to the document naming it (both forms are in use), with a leading `catalyst/` stripped: root-facing documents address the bundle the way a project sees it.
    known = {p.name for p in root.rglob("*") if p.is_file()}
    for path in sorted(root.rglob("*.md")):
        # CHANGELOG.md and TODO.md are the two documents that legitimately name files the tree does not have: history keeps the old names, and a TODO describes what has not been written yet. `examples/` documents a fictional project's own features and decisions. `.claude/` is harness configuration, not bundle documents.
        if any(part in (".git", ".claude", "node_modules", "examples") for part in path.parts):
            continue
        if path.name in ("CHANGELOG.md", "TODO.md"):
            continue
        for ref in sorted(doc_paths(read(path))):
            target = ref[len(BUNDLE) + 1:] if ref.startswith(f"{BUNDLE}/") else ref
            # `context/` exists only in a spawn that opted in, and the project-authored documents are the project's to write (references/known-fakes.md, references/operations-runbook.md). A leading numbered segment is an upstream documentation tree, cited in a Provenance section rather than pointed at.
            if target.startswith("context/") or Path(target).name in PROJECT_AUTHORED:
                continue
            if re.match(r"^\d+-", target):
                continue
            # Resolved root-relative, relative to the document naming it, or — for the shorthand the bundle writes in prose — by a document of that name existing somewhere in the tree. All three answer the question the rule asks: can a reader open what this points at.
            if (root / target).exists() or (path.parent / target).exists() or Path(target).name in known:
                continue
            error(f"{path.relative_to(root)}: `{ref}` does not resolve to a document in the template (R13)")

    # R14: the scaffolder's copy lists name things that exist. MANIFEST is what a spawn receives — an entry that has been renamed away is reported at spawn time and nowhere else, so a project quietly ships without a document the rules assume it has. The directory heuristic matters too: upgrade_project.py splits MANIFEST on "has no extension" to decide what to walk, so a file entered without its suffix would be treated as a directory and never upgraded.
    scaffolder = root / "tools" / "new_project.py"
    for literal in ("MANIFEST", "EXPERIMENT_FILES", "HOOKS_SUPPORT"):
        entries = scaffolder_literal(scaffolder, literal)
        if entries is None:
            error(f"tools/new_project.py: {literal} not found or not a literal list — the spawn's copy list cannot be checked (R14)")
            continue
        for rel in entries:
            target = root / (f"{HOOKS_DIR}/{rel}" if literal == "HOOKS_SUPPORT" else rel)
            if not target.exists():
                error(f"tools/new_project.py: {literal} lists {rel}, which does not exist in the template — a spawn would be missing it (R14)")
            elif literal == "MANIFEST" and target.is_dir() != (Path(rel).suffix == ""):
                error(f"tools/new_project.py: MANIFEST entry {rel} is a {'directory' if target.is_dir() else 'file'} but reads as the other by its suffix — upgrade_project.py splits the list that way (R14)")

    # R15: the hooks table documents the hooks that exist. A hook is discovered from the directory (discover_hooks in the scaffolder: extensionless files under tools/hooks/), so a new one ships and is offered at spawn whether or not anyone wrote its row — and its `catalyst-requires:` header decides whether a project is even offered it, which is the one thing a reader needs the table to state correctly.
    hooks_dir = root / HOOKS_DIR
    hooks_readme = hooks_dir / "README.md"
    if hooks_dir.is_dir() and hooks_readme.is_file():
        on_disk = {p.name for p in hooks_dir.iterdir() if p.is_file() and not p.suffix and not p.name.startswith(".")}
        documented = table_names(read(hooks_readme), "The hooks")
        for name in sorted(on_disk - documented):
            error(f"{HOOKS_DIR}/README.md: hook `{name}` exists but has no row in the table — every hook a spawn is offered is documented (R15)")
        for name in sorted(documented - on_disk):
            error(f"{HOOKS_DIR}/README.md: table lists hook `{name}`, which is not in {HOOKS_DIR}/ — no spawn is ever offered it (R15)")
        for name in sorted(on_disk & documented):
            declared = set(re.findall(r"`([^`]+)`", table_row(read(hooks_readme), "The hooks", name, 1)))
            actual = set(hook_requires(read(hooks_dir / name)))
            if declared != actual:
                error(f"{HOOKS_DIR}/README.md: hook `{name}` requires {sorted(actual) or ['nothing']} but its Requires cell says {sorted(declared) or ['nothing']} (R15)")

    # R16: sync_rules.py's hardcoded lists against the tree it syncs. A rules/ payload the tool does not know about is never compared to upstream — it silently stops tracking — and a DEVIATIONS entry names a file that must exist and must be explained in its router's Provenance table, which is the only record of why a vendored rule diverges.
    sync = root / "tools" / "sync_rules.py"
    if sync.is_file():
        rule_dirs = scaffolder_literal(sync, "RULE_DIRS")
        routers = scaffolder_literal(sync, "ROUTERS")
        deviations = scaffolder_literal(sync, "DEVIATIONS")
        if rule_dirs is None or routers is None or deviations is None:
            error("tools/sync_rules.py: RULE_DIRS, ROUTERS, or DEVIATIONS not found or not a literal — the upstream sync cannot be checked (R16)")
        else:
            on_disk = {str(p.parent.relative_to(root)) for p in root.glob("stacks/**/rules/*.md")}
            for rel in sorted(on_disk - set(rule_dirs)):
                error(f"tools/sync_rules.py: RULE_DIRS does not list {rel}, which holds vendored rules — that payload is never compared to upstream (R16)")
            for rel in sorted(set(rule_dirs) - on_disk):
                error(f"tools/sync_rules.py: RULE_DIRS lists {rel}, which holds no rule files (R16)")
            for rel in routers:
                text = read(root / rel) if (root / rel).is_file() else None
                if text is None:
                    error(f"tools/sync_rules.py: ROUTERS lists {rel}, which does not exist (R16)")
                elif not re.search(r"^Upstream: ", text, re.M):
                    error(f"{rel}: no `Upstream:` line, but sync_rules.py rewrites one here on --apply (R16)")
            for rel in sorted(deviations):
                if not (root / rel).is_file():
                    error(f"tools/sync_rules.py: DEVIATIONS lists {rel}, which does not exist (R16)")
                    continue
                router = next((r for r in routers if Path(rel).parent.parent == Path(r).parent or Path(rel).parent == Path(r).parent / "rules"), None)
                if router and (root / router).is_file() and Path(rel).stem not in read(root / router):
                    error(f"{router}: deviation `{Path(rel).stem}` has no Provenance row, but sync_rules.py never overwrites it (R16)")

    # R17: architecture.md's Stack Modules table against the stacks/ tree, both directions. The table is what an Init Design reads to pick a stack, so a module missing from it is a module no project is ever offered — the failure is silence, not an error — and a row linking at a moved document sends the reader nowhere. Only the links are checked, not the Options cell's grammar: what matters is that each link lands and that nothing selectable is absent.
    architecture = root / "architecture.md"
    if stacks_root.is_dir() and architecture.is_file():
        section = re.search(r"^## Stack Modules$.*?(?=^## |\Z)", read(architecture), re.M | re.S)
        if section is None:
            error("architecture.md: no `## Stack Modules` section — the stack index (R17)")
        else:
            linked = set(re.findall(r"\]\((stacks/[^)]+\.md)\)", section.group(0)))
            for rel in sorted(linked):
                if not (root / rel).is_file():
                    error(f"architecture.md: Stack Modules links {rel}, which does not exist (R17)")
            for rel in sorted(selectable_docs(stacks_root) - linked):
                error(f"architecture.md: {rel} is selectable at spawn but no Stack Modules row links it — no project is offered it (R17)")

    # R18: the Shared tiers paragraph enumerates the tier directories in prose, and that enumeration has rotted before. Same set R9 walks, so the two cannot disagree: a tier missing from the paragraph is invisible to anyone reading how the stack composes, and one named there but absent on disk is a promise the scaffolder cannot keep.
    if stacks_root.is_dir() and architecture.is_file():
        para = re.search(r"^\*\*Shared tiers\.\*\*.*$", read(architecture), re.M)
        if para is None:
            error("architecture.md: no `**Shared tiers.**` paragraph — the tier enumeration (R18)")
        else:
            # The paragraph also names `stacks/` itself, as the directory the tiers live under; a tier is the paths with an `_`-prefixed segment.
            named = {
                p.rstrip("/")
                for p in re.findall(r"`([^`]+/)`", para.group(0))
                if any(seg.startswith("_") for seg in p.split("/"))
            }
            tiers = tier_dirs(stacks_root)
            roots = {t for t in tiers if not any(t.startswith(o + "/") for o in tiers)}
            for rel in sorted(roots - named):
                error(f"architecture.md: the Shared tiers paragraph does not name stacks/{rel}/ (R18)")
            for rel in sorted(named - roots):
                error(f"architecture.md: the Shared tiers paragraph names stacks/{rel}/, which is not a shared tier directory (R18)")

    # R19: COVERAGE.md's counts against the tree. They are hand-maintained and have rotted twice, and a wrong number is worse than none — the file exists to be believed when deciding what to build next. Only rows whose backticked name resolves to exactly one path are checked: the Addons table names addons two modules share, and the Other layers table does not backtick its first column, so both are left to the prose. The prose is not checkable at all and stays hand-maintained (one of the two rots was in it).
    coverage = root / "COVERAGE.md"
    if coverage.is_file() and stacks_root.is_dir():
        for headers, cells in table_rows(read(coverage)):
            name = re.fullmatch(r"`([^`]+)`(?:\s*\(default\))?", cells[0])
            if not name:
                continue
            path = module_path(stacks_root, name.group(1))
            if path is None:
                continue
            docs, rules = module_counts(path)
            cell = dict(zip(headers, cells)).get("Docs", "")
            # An addon's row counts the addon document itself first and its payload in the parenthetical, so the payload count is the one to read there; every other row leads with its own document count.
            payload = path.parent.name == "addons"
            claimed = re.search(r"\(\+(\d+)", cell) if payload else re.match(r"(\d+)", cell)
            if claimed and int(claimed.group(1)) != docs:
                error(f"COVERAGE.md: `{name.group(1)}` claims {claimed.group(1)} documents, the tree has {docs} (R19)")
            claimed_rules = re.search(r"(\d+)(?=\s*rules)", cell) or re.fullmatch(r"(\d+)", dict(zip(headers, cells)).get("Rules", ""))
            if claimed_rules and int(claimed_rules.group(1)) != rules:
                error(f"COVERAGE.md: `{name.group(1)}` claims {claimed_rules.group(1)} rules, the tree has {rules} (R19)")

    # R12: the template's markdown is oxfmt-canonical (stacks/_lang/typescript/toolchain.md) — spawns format their whole repository, so any drift here comes back as merge churn on every upgrade. The vendored rules/ payloads are covered too; sync_rules.py normalizes upstream through oxfmt before comparing. Template mode only: a spawn's own `format:check` script already owns this. pnpm is the one non-stdlib need, so its absence is a note, never an error.
    if shutil.which("pnpm") is None:
        note("oxfmt check skipped — pnpm is not on PATH (R12)")
    else:
        fmt = subprocess.run(
            ["pnpm", "dlx", f"oxfmt@{OXFMT_VERSION}", "--check", "."],
            cwd=root,
            capture_output=True,
            text=True,
        )
        if fmt.returncode != 0:
            detail = (fmt.stdout + fmt.stderr).strip()
            error(f"markdown is not oxfmt-formatted — run `pnpm dlx oxfmt@{OXFMT_VERSION} .` (R12)\n{detail}")


# --- project checks ----------------------------------------------------------


def index_rows(summary: str, heading: str, folder: str, status_col: int) -> dict[str, str]:
    """Links -> status from the table under `heading` (repo-relative link)."""
    rows: dict[str, str] = {}
    in_section = False
    for line in summary.splitlines():
        if line.startswith("## "):
            in_section = line.strip() == f"## {heading}"
            continue
        if not in_section or not line.strip().startswith("|"):
            continue
        link = re.search(rf"\]\(({folder}/[^)]+\.md)\)", line)
        if not link:
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        status = cells[status_col] if len(cells) > status_col else ""
        rows[link.group(1)] = status
    return rows


def changed_docs(project: Path) -> set[str] | None:
    """Bundle-relative paths of new/changed .md docs; None when git is absent.

    `git status --porcelain` always reports paths from the repository root, while every caller compares against paths relative to the bundle. In a spawn those differ by the `catalyst/` prefix, so it is stripped here — without that, the diff-aware checks (P3, P7, P8) would match nothing and silently pass everything.
    """
    try:
        result = subprocess.run(
            ["git", "-C", str(project), "status", "--porcelain"],
            capture_output=True,
            text=True,
            check=True,
        )
        top = subprocess.run(
            ["git", "-C", str(project), "rev-parse", "--show-toplevel"],
            capture_output=True,
            text=True,
            check=True,
        ).stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        return None
    try:
        prefix = project.resolve().relative_to(Path(top).resolve())
    except ValueError:
        prefix = Path(".")
    changed: set[str] = set()
    for line in result.stdout.splitlines():
        path = line[3:].split(" -> ")[-1].strip().strip('"')
        if not path.endswith(".md"):
            continue
        try:  # outside the bundle (the project's own code and docs) — not ours to check
            changed.add(Path(path).relative_to(prefix).as_posix())
        except ValueError:
            continue
    return changed


def check_project(project: Path, check_all: bool, repo_root: Path | None = None) -> None:
    summary_path = project / "project-summary.md"
    if not summary_path.exists():
        error(f"{project}: project-summary.md not found — is this a project root?")
        return
    summary = read(summary_path)

    # Templates resolve against the project's own bundle, not CATALYST_ROOT — run from the Catalyst repo against a project path, the repo's always-present templates would mask an unadopted flow (P10) and check documents against a template the project does not carry (P3).
    plans = [
        ("Feature Index", "features", 2, FEATURE_STATUSES,
         project / "features" / "_template.md"),
        ("Architecture Decision Record (ADR) Index", "decisions", 2,
         DECISION_STATUSES, project / "decisions" / "_template.md"),
        ("Experiment Index", "experiments", 3, EXPERIMENT_STATUSES,
         project / "experiments" / "_template.md"),
    ]
    changed = changed_docs(project)
    if changed is None and not check_all:
        note(f"{project}: not a git repo — diff-aware checks (P3, P7, P8) skipped")

    for heading, folder, status_col, allowed, template in plans:
        indexed = index_rows(summary, heading, folder, status_col)
        on_disk = {
            f"{folder}/{path.name}"
            for path in (project / folder).glob("[0-9]*.md")
        }

        # P10: documents without their template in the bundle — an unadopted flow (experiments are opt-in at spawn).
        if on_disk and not template.exists():
            note(f"{project}/{folder}: documents exist but the bundle has no {folder}/_template.md — from the Catalyst repo, tools/upgrade_project.py --apply offers adopting the flow")

        # P1: index <-> files, both directions.
        for missing_row in sorted(on_disk - set(indexed)):
            error(f"{project}/{missing_row}: exists but has no row in {heading}")
        for dead_link in sorted(set(indexed) - on_disk):
            error(f"{project}/project-summary.md: {heading} links missing file {dead_link}")

        # P4: unique numbering.
        seen: dict[str, str] = {}
        for rel in sorted(on_disk):
            number = Path(rel).name.split("_")[0]
            if number in seen:
                error(f"{project}/{folder}: number {number} used by both {seen[number]} and {Path(rel).name}")
            seen[number] = Path(rel).name

        for rel in sorted(on_disk & set(indexed)):
            path = project / rel
            # P2: status in the document == status in the index.
            status = doc_status(path)
            if status is None:
                error(f"{path}: no `## Status` section with a value")
            else:
                # "Superseded by <nnn>" is a valid decision status prefix.
                token = ("Superseded by" if status.startswith("Superseded by")
                         else status)
                if allowed and token not in allowed:
                    error(f"{path}: status '{status}' is not one of {sorted(allowed)}")
                if indexed[rel] and status != indexed[rel]:
                    error(f"{path}: status '{status}' but the index row says '{indexed[rel]}'")
            # Diff-aware checks — new/changed docs only (or --all), so older documents are aligned on their next substantive edit, never retroactively (same rule as P3).
            if check_all or (changed is not None and rel in changed):
                # P3: template sections.
                check_sections(path, template, folder.rstrip("s"))
                text = read(path)
                # P7: size budgets, in characters (line widths are not capped).
                if folder == "features":
                    n = len(text)
                    if n > FEATURE_CHAR_MAX:
                        error(f"{path}: {n} characters, over the {FEATURE_CHAR_MAX} hard maximum — split the feature or move exhaustive examples into tests")
                    elif n > FEATURE_CHAR_TARGET:
                        note(f"{path}: {n} characters, over the {FEATURE_CHAR_TARGET} target — consider summarizing implementation detail")
                elif folder in ("decisions", "experiments"):
                    n = len(text)
                    if n > RECORD_CHAR_TARGET:
                        hint = ("a record keeps the why, not the rules it points at" if folder == "decisions"
                                else "an experiment is a probe, not a report")
                        note(f"{path}: {n} characters, over the {RECORD_CHAR_TARGET} target — {hint}")
                # P8 (soft): Open Questions must be empty past the drafting gate. The resolution target differs by document type (features have Non-Goals; decisions fold into Consequences; experiments have neither), so the hint is folder-aware.
                if status and status != _DRAFTING_STATUS.get(folder):
                    if open_question_bullets(text):
                        hint = {
                            "features": "resolve each or move it to Non-Goals",
                            "decisions": "resolve each or fold it into Consequences",
                            "experiments": "resolve each before the run",
                        }.get(folder, "resolve each")
                        note(f"{path}: status '{status}' but Open Questions still has entries — {hint} (brownfield may keep them deliberately)")

    # P5: pointer indexes (Protected Areas) point at existing documents. They hold pointers only (owning docs keep the rules); completeness is the Same-Change Rule's job, link validity is checked here.
    pointer_sections = ("Protected Areas",)
    current = None
    for line in summary.splitlines():
        if line.startswith("## "):
            heading = line.removeprefix("## ").strip()
            current = heading if heading in pointer_sections else None
            continue
        if current is None:
            continue
        for target in re.findall(
            r"`?((?:features|decisions)/[^)`|]+\.md)`?", line
        ):
            if not (project / target).exists():
                error(
                    f"{project}/project-summary.md: {current} points to missing file {target}"
                )

    # P6 (soft): the project's Catalyst version stamp vs the current Catalyst version. This tracks document-shape drift only — always a note, never an error (Spawning Projects, prime-directive.md). Gated on actually running from Catalyst: a project that versions itself has its own VERSION, and comparing that product version against the stamp would be meaningless.
    if is_catalyst_repo(CATALYST_ROOT) and (CATALYST_ROOT / "VERSION").exists():
        current_version = read(CATALYST_ROOT / "VERSION").strip()
        stamp = _STAMP_RE.search(summary)
        if not re.fullmatch(r"\d+\.\d+\.\d+", current_version):
            pass
        elif not stamp:
            note(f"{project}: project-summary.md has no 'Catalyst version: X.Y.Z' stamp — add one to track alignment with Catalyst")
        else:
            cat_v = tuple(int(p) for p in current_version.split("."))
            st_v = tuple(int(p) for p in stamp.group(1).split("."))
            if st_v < cat_v:
                note(f"{project}: aligned to Catalyst {stamp.group(1)}, current is {current_version} — review CHANGELOG entries newer than {stamp.group(1)} and adopt what applies")

    # P9 (soft): a project with real features but no operator runbook. A project with stateful infrastructure keeps `operations.md` (Operations Runbook); this reminds, never blocks — a purely stateless project can ignore it.
    has_features = any((project / "features").glob("[0-9]*.md"))
    if has_features and not (project / "operations.md").exists():
        note(f"{project}: no operations.md — a project with stateful infrastructure keeps an operator runbook (Operations Runbook)")

    # P11: a present KNOWN_FAKES.md holds at least one register row. Absence is the healthy state (Honest Inputs), so nothing is said when the file is missing — but present-and-empty misreads as attestation, and the rule is to delete the file with the last fake, so that is an error.
    fakes = project / "KNOWN_FAKES.md"
    if fakes.exists():
        pipe_lines = [ln.strip() for ln in read(fakes).splitlines() if ln.strip().startswith("|")]
        rows = [ln for ln in pipe_lines if not re.fullmatch(r"\|(?:\s*:?-+:?\s*\|)+", ln)]
        if len(rows) < 2:  # header only, or no table at all
            error(f"{project}/KNOWN_FAKES.md: register has no entries — delete the file when the last fake is removed (Known Fakes Register)")

    # P12: the generated skill wrappers point into documents the bundle actually has. A wrapper is the harness's way in — a pointer that no longer resolves means the skill fires and routes the agent at nothing, silently, which is worse than having no wrapper at all. Only wrappers carrying the catalyst marker are checked; a same-named skill without it belongs to the project (references/agent-skills.md). Skills are discovered at the repository root only, so nothing is said when there is no .claude/skills there — in a monorepo adoption the wrappers sit at a root this run may not have been pointed at.
    skills_dir = (repo_root or project.parent) / ".claude" / "skills"
    if skills_dir.is_dir():
        for wrapper in sorted(skills_dir.glob("*/SKILL.md")):
            text = read(wrapper)
            if SKILL_MARK not in text:
                continue
            for ref in sorted(re.findall(rf"`({BUNDLE}/[^`\s]+\.md)`", text)):
                if not (skills_dir.parent.parent / ref).is_file():
                    error(f".claude/skills/{wrapper.parent.name}/SKILL.md: points at `{ref}`, which is not in the bundle — the skill routes to nothing (P12)")


def bundle_root(path: Path) -> Path:
    """The directory holding a project's rule set: <path>/catalyst/, or <path> itself.

    A project's repository root and its bundle are both natural ways to name the project, so both are accepted.
    """
    nested = path / BUNDLE
    return nested if nested.is_dir() else path


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate the Catalyst template, or a project spawned from it.",
        epilog="With no PROJECT, validates the repository this script sits in.",
    )
    parser.add_argument(
        "project",
        nargs="?",
        metavar="PROJECT",
        help="path to a spawned project — its repository root or its catalyst/ bundle",
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="template-check every document, not only the ones changed in the tree",
    )
    args = parser.parse_args()
    check_all = args.all
    if args.project:
        # The bundle is what every project rule reads; the repository root above it is needed only by P12, since the skill wrappers live outside the bundle.
        given = Path(args.project).expanduser().resolve()
        bundle = bundle_root(given)
        check_project(bundle, check_all, repo_root=given if bundle != given else given.parent)
    elif is_catalyst_repo(CATALYST_ROOT):
        check_catalyst(CATALYST_ROOT)
    else:
        # Run with no args outside Catalyst — a spawned project carrying the validator. `tools/new_project.py` never travels into a spawn, so its absence is what tells the two apart. Say what to do instead of running Catalyst's own checks against a project.
        error("this is not the Catalyst repo (it has no tools/new_project.py); pass a project path (e.g. `validate.py .`) to validate a project")

    for line in notes:
        print(f"note: {line}")
    for line in errors:
        print(f"ERROR: {line}")
    print(f"validate: {len(errors)} error(s), {len(notes)} note(s)")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
