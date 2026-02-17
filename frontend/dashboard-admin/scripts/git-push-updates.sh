#!/usr/bin/env bash
set -euo pipefail

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Not inside a git repository." >&2
  exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  :
else
  echo "No changes to commit." >&2
  exit 1
fi

branch="$(git rev-parse --abbrev-ref HEAD)"

if [ -n "${1-}" ]; then
  msg="$1"
else
  printf "Commit message: "
  read -r msg
fi

if [ -z "$msg" ]; then
  echo "Commit message cannot be empty." >&2
  exit 1
fi

git add -A
git commit -m "$msg"

git push -u origin "$branch"
