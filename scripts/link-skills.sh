#!/bin/sh
set -eu

usage() {
  echo "usage: $0 {link|check|unlink|targets}" >&2
}

cmd="${1:-}"
if [ -z "$cmd" ]; then
  usage
  exit 2
fi

script_dir=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
repo=$(CDPATH='' cd -- "$script_dir/.." && pwd)

targets="
$HOME/.copilot/skills
$HOME/.claude/skills
$HOME/.agents/skills
"

same_target() {
  actual=${1%/}
  expected=${2%/}
  [ "$actual" = "$expected" ]
}

skill_names() {
  find "$repo" -mindepth 1 -maxdepth 1 -type d -name 'routeros-*' -exec basename {} \; | sort
}

link_one() {
  src=$1
  dst=$2

  if [ -L "$dst" ]; then
    actual=$(readlink "$dst")
    if same_target "$actual" "$src"; then
      return 0
    fi
    rm "$dst"
  elif [ -e "$dst" ]; then
    echo "CONFLICT: $dst exists and is not a symlink" >&2
    return 1
  fi

  ln -s "$src" "$dst"
  echo "linked  $dst"
}

unlink_one() {
  src=$1
  dst=$2

  if [ -L "$dst" ]; then
    actual=$(readlink "$dst")
    if same_target "$actual" "$src"; then
      rm "$dst"
      echo "removed $dst"
    fi
  fi
}

check_one() {
  src=$1
  dst=$2

  if [ ! -e "$src/SKILL.md" ]; then
    echo "NO SKILL.md: $src" >&2
    return 1
  fi

  if [ ! -e "$dst" ]; then
    echo "MISSING:  $dst" >&2
    return 1
  fi

  if [ ! -L "$dst" ]; then
    echo "NOT LINK: $dst" >&2
    return 1
  fi

  actual=$(readlink "$dst")
  if ! same_target "$actual" "$src"; then
    echo "WRONG:    $dst -> $actual (expected $src)" >&2
    return 1
  fi

  return 0
}

case "$cmd" in
  targets)
    for target in $targets; do
      echo "$target"
    done
    ;;
  link)
    rc=0
    for target in $targets; do
      mkdir -p "$target"
      for skill in $(skill_names); do
        link_one "$repo/$skill" "$target/$skill" || rc=1
      done
    done
    echo "link: done"
    exit "$rc"
    ;;
  unlink)
    for target in $targets; do
      for skill in $(skill_names); do
        unlink_one "$repo/$skill" "$target/$skill"
      done
    done
    echo "unlink: done"
    ;;
  check)
    rc=0
    count=0
    for skill in $(skill_names); do
      count=$((count + 1))
      for target in $targets; do
        check_one "$repo/$skill" "$target/$skill" || rc=1
      done
    done
    if [ "$rc" -eq 0 ]; then
      echo "check: all $count skills linked into all target dirs"
    fi
    exit "$rc"
    ;;
  *)
    usage
    exit 2
    ;;
esac
