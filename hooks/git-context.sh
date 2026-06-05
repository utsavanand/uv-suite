#!/bin/bash
# UV Suite helper: resolve git worktree context for a directory, as a JSON object.
# Used to stamp session metadata so the Watchtower can tell apart sessions running
# in different worktrees of the same repo (e.g. a feature worktree vs the main checkout).
#
# Usage: git-context.sh [dir]   (defaults to current directory)
# Prints: {} if not a git repo, else:
#   {
#     "git_worktree":          "/abs/path/to/worktree-root",
#     "git_branch":            "feature-x",
#     "git_main_repo":         "/abs/path/to/main/checkout",
#     "git_is_linked_worktree": true|false
#   }

DIR="${1:-.}"
cd "$DIR" 2>/dev/null || { echo '{}'; exit 0; }
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo '{}'; exit 0; }

WT=$(git rev-parse --show-toplevel 2>/dev/null)
BR=$(git branch --show-current 2>/dev/null)
GITDIR=$(git rev-parse --absolute-git-dir 2>/dev/null)

# A linked worktree's git dir lives under <main>/.git/worktrees/<name>.
case "$GITDIR" in
  */worktrees/*) LINKED=true ;;
  *)             LINKED=false ;;
esac

# Common dir points at the shared .git; its parent is the main checkout.
COMMON=$(git rev-parse --git-common-dir 2>/dev/null)
case "$COMMON" in /*) ;; *) COMMON="$WT/$COMMON" ;; esac
MAIN_REPO=$(cd "$(dirname "$COMMON")" 2>/dev/null && pwd)
[ -z "$MAIN_REPO" ] && MAIN_REPO="$WT"

if command -v jq >/dev/null 2>&1; then
  jq -n --arg wt "$WT" --arg br "$BR" --arg main "$MAIN_REPO" --argjson linked "$LINKED" \
    '{git_worktree: $wt, git_branch: $br, git_main_repo: $main, git_is_linked_worktree: $linked}'
else
  printf '{"git_worktree":"%s","git_branch":"%s","git_main_repo":"%s","git_is_linked_worktree":%s}\n' \
    "$WT" "$BR" "$MAIN_REPO" "$LINKED"
fi
