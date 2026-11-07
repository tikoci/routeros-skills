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
$HOME/.hermes/skills
"

same_target() {
  actual=${1%/}
  expected=${2%/}
  [ "$actual" = "$expected" ]
}

# Physical path of $1; the last component may be missing (e.g. a removed skill).
phys_path() {
  p=${1%/}
  parent=$(CDPATH='' cd -- "$(dirname -- "$p")" 2>/dev/null && pwd -P) || {
    echo "$p"
    return 0
  }
  echo "${parent%/}/$(basename -- "$p")"
}

# Where symlink $1 points, resolving a relative target from the link's own dir.
link_target() {
  t=$(readlink "$1")
  case $t in
    /*) ;;
    *) t="$(dirname -- "$1")/$t" ;;
  esac
  phys_path "$t"
}

skill_names() {
  # POSIX glob (portable across BSD/macOS + GNU); trailing slash matches dirs only.
  for dir in "$repo"/routeros-*/; do
    [ -d "$dir" ] || continue   # no-match: the literal glob survives, -d skips it
    name=${dir%/}
    echo "${name##*/}"
  done | sort
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
    # Compare resolved paths so relative links into this checkout also match;
    # links into any other checkout still differ and are left alone.
    if same_target "$(link_target "$dst")" "$(phys_path "$src")"; then
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

  # Check -L before -e: a broken symlink (target missing) is a WRONG link, not
  # MISSING — -e follows the link and would hide it, losing the readlink target.
  if [ -L "$dst" ]; then
    actual=$(readlink "$dst")
    if ! same_target "$actual" "$src"; then
      echo "WRONG:    $dst -> $actual (expected $src)" >&2
      return 1
    fi
    return 0
  fi

  if [ ! -e "$dst" ]; then
    echo "MISSING:  $dst" >&2
    return 1
  fi

  echo "NOT LINK: $dst" >&2
  return 1
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
      # Retire only this checkout's old tool-skill links; leave unrelated installs.
      for old in routeros-centrs routeros-quickchr routeros-quickchr-cli; do
        unlink_one "$repo/$old" "$target/$old"
      done
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
