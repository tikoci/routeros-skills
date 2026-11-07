# Local Setup Guide

This document describes how the skill directories are organized locally. It is **not** needed for normal installation — only relevant if you are maintaining this repo directly.

## Directory roles

| Location | Role |
|----------|------|
| `~/GitHub/routeros-skills/` | **Source of truth** for all `routeros-*` skills. This is the tikoci/routeros-skills Git repo. |
| `~/.copilot/skills/routeros-*` | Symlinks → `~/GitHub/routeros-skills/routeros-*` |
| `~/.claude/skills/routeros-*` | Symlinks → `~/GitHub/routeros-skills/routeros-*` |
| `~/.agents/skills/routeros-*` | Symlinks → `~/GitHub/routeros-skills/routeros-*` for Codex |
| `~/.hermes/skills/routeros-*` | Symlinks → `~/GitHub/routeros-skills/routeros-*` for Hermes |
| `~/.copilot/skills/<non-routeros>` | Real dirs or symlinks to `~/.claude/skills/` — local-only, not in this repo |
| `~/.claude/skills/<non-routeros>` | Real dirs — local-only, not in this repo |
| `~/.agents/skills/<non-routeros>` | Real dirs or symlinks — local-only, not in this repo |

Codex reads user-authored skills from `~/.agents/skills`. `~/.codex/skills`
contains Codex-managed/system skills and is not the right target for these
repo-owned `routeros-*` symlinks.

## Rule: what belongs in this repo

**Only `routeros-*` named skills.** Anything else (`tikoci-*`, `screenshot`, `sql-as-rag`, `markdownlint-setup`, etc.) is personal/project-scoped and stays in the local `~/.*/skills/` directories only.

Within the public family, use `routeros-tikoci-<tool>` for skills about tikoci
tools, with a suffix when needed (for example, `routeros-tikoci-quickchr-cli`).
Use the ordinary `routeros-<topic>` form for RouterOS features, protocols, and
platform knowledge. Both follow the same public-content and grounding rules.

## Setting up the symlinks (fresh machine)

```sh
git clone https://github.com/tikoci/routeros-skills.git ~/GitHub/routeros-skills

cd ~/GitHub/routeros-skills
make link   # symlink every routeros-* into Copilot, Claude, Codex, and Hermes dirs
make check  # verify every repo skill is a symlink in all four dirs
```

## Updating

```sh
cd ~/GitHub/routeros-skills && git pull
```

Because the AI tools follow symlinks to the real files, `git pull` immediately takes effect — no re-linking needed.

Renamed or newly added skill directories also need `make link` and a fresh
assistant session.

## Renamed tikoci tool skills

| Previous name | Current name |
|---------------|--------------|
| `routeros-centrs` | `routeros-tikoci-centrs` |
| `routeros-quickchr` | `routeros-tikoci-quickchr` |
| `routeros-quickchr-cli` | `routeros-tikoci-quickchr-cli` |

After pulling this rename, run `make link` followed by `make check`.
`make link` removes the three obsolete symlinks in the four supported assistant
directories only when they point to the old paths in this checkout, then creates
the current links. Real directories and links to other checkouts are preserved.
For installations made by copying folders or another installer, remove the old
skills and install the new names using that method.

Update explicit skill invocations, saved prompts, and links to the old skill
directories. The old names are retired without alias skills; start a fresh
assistant session to discover the new names. The `centrs` and `quickchr` CLI
commands and `@tikoci/centrs` / `@tikoci/quickchr` package names are unchanged.

## Linting locally

CI gates every PR on markdownlint + cspell + a `SKILL.md` validator (and an offline link check). Run the same gate before pushing:

```sh
cd ~/GitHub/routeros-skills
bun install        # one-time: cspell + markdownlint-cli2 (devDeps)
make lint          # markdownlint + cspell + skill validator
make lint-links    # offline relative-link + #anchor check (needs `lychee`)
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for what each check does and the spelling-dictionary policy.

## Adding a new routeros-* skill

1. Create `~/GitHub/routeros-skills/routeros-<name>/SKILL.md` (and optionally `references/`)
2. Symlink it into the AI tool directories:

```sh
skill=routeros-<name>
ln -s ~/GitHub/routeros-skills/$skill ~/.copilot/skills/$skill
ln -s ~/GitHub/routeros-skills/$skill ~/.claude/skills/$skill
ln -s ~/GitHub/routeros-skills/$skill ~/.agents/skills/$skill
ln -s ~/GitHub/routeros-skills/$skill ~/.hermes/skills/$skill
```

   Or, idempotently link **all** skills into all target dirs (preferred — avoids the
   "committed but never symlinked" drift):

```sh
make link    # symlink every routeros-* into ~/.copilot/skills, ~/.claude/skills,
             #   ~/.agents/skills (Codex), and ~/.hermes/skills
make check   # verify every repo skill is linked into all four dirs (non-zero exit if not)
```

   Note: a symlinked skill is only picked up on a **fresh** assistant session — quit and restart Hermes to see any new skills.

1. Commit and push to GitHub.

## Current symlink state (reference)

After setup, `ls -la ~/.copilot/skills/`, `ls -la ~/.claude/skills/`,
`ls -la ~/.agents/skills/`, and `ls -la ~/.hermes/skills/` should show all `routeros-*` entries as symlinks
pointing to `~/GitHub/routeros-skills/routeros-*`, for example:

```text
lrwxr-xr-x  routeros-fundamentals -> /Users/<you>/GitHub/routeros-skills/routeros-fundamentals
lrwxr-xr-x  routeros-container    -> /Users/<you>/GitHub/routeros-skills/routeros-container
...
```
