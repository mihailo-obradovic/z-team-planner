#!/usr/bin/env sh
# Activates the optional git hooks in this directory (behavior: README.md here).
#
#   sh catalyst/tools/hooks/install.sh              # activate every hook here
#   sh catalyst/tools/hooks/install.sh post-commit  # activate just one

set -eu

root=$(git rev-parse --show-toplevel 2>/dev/null) || {
    echo "install.sh: not inside a git repository" >&2
    exit 1
}
root=$(CDPATH= cd -P -- "$root" && pwd -P)

# Located from the script rather than a fixed path: a project keeps the rule set in catalyst/, the Catalyst repo keeps it at the root, and this is the same file in both. Physical paths throughout — a logical path with a symlinked segment strips wrong and yields dangling links.
src_dir=$(CDPATH= cd -P -- "$(dirname -- "$0")" && pwd -P)
rel_src=${src_dir#"$root"/}

# Asked of git rather than assumed at $root/.git/hooks: in a worktree or submodule .git is a file and the hooks live under the real git dir elsewhere.
hooks_dir=$(git rev-parse --git-path hooks)
case $hooks_dir in /*) ;; *) hooks_dir=$PWD/$hooks_dir ;; esac
hooks_dir=$(CDPATH= cd -P -- "$hooks_dir" && pwd -P) || {
    echo "install.sh: hooks directory not found at $hooks_dir" >&2
    exit 1
}

# What this project provides, for the catalyst-requires gate (README.md, Requirements): `versioning` means the project's own VERSION file at the root.
provided=''
if [ -f "$root/VERSION" ]; then provided=versioning; fi

# Relative link target computed from the physical paths (mirrors install_hooks() in tools/new_project.py): walk up from the hooks dir to the common ancestor, then down to this directory — correct however deep the rule set sits and wherever the hooks dir lives.
common=$hooks_dir
up=''
while [ "${src_dir#"$common"/}" = "$src_dir" ]; do
    common=${common%/*}
    up="../$up"
done
rel_dir="$up${src_dir#"$common"/}"

if [ "$#" -gt 0 ]; then
    names=$*
else
    names=$(find "$src_dir" -maxdepth 1 -type f ! -name '*.*' -exec basename {} \; | sort)
fi

[ -n "$names" ] || { echo "install.sh: no hooks found in $rel_src/"; exit 0; }

for name in $names; do
    src="$src_dir/$name"
    if [ ! -f "$src" ]; then
        echo "  $name: no such hook in $rel_src/, skipped" >&2
        continue
    fi
    missing=''
    for tok in $(sed -n 's/^# catalyst-requires:[[:space:]]*//p' "$src" | tr ',' ' '); do
        case " $provided " in
            *" $tok "*) ;;
            *) missing="$missing $tok" ;;
        esac
    done
    if [ -n "$missing" ]; then
        echo "  $name: requires$missing — this project does not provide it, skipped (README.md, Requirements)"
        continue
    fi
    chmod +x "$src"
    if [ -e "$hooks_dir/$name" ] || [ -L "$hooks_dir/$name" ]; then
        echo "  $name: already present in .git/hooks, left alone"
        continue
    fi
    if ln -s "$rel_dir/$name" "$hooks_dir/$name" 2>/dev/null; then
        echo "  $name: symlinked"
    else
        cp "$src" "$hooks_dir/$name"
        chmod +x "$hooks_dir/$name"
        echo "  $name: copied (symlink unavailable)"
    fi
done
