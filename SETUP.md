# Local Setup Guide

This document describes how the skill directories are organized locally. It is **not** needed for normal installation — only relevant if you are maintaining this repo directly.

## Directory roles

| Location | Role |
|----------|------|
| `~/GitHub/routeros-skills/` | **Source of truth** for all `routeros-*` skills. This is the tikoci/routeros-skills Git repo. |
| `~/.copilot/skills/routeros-*` | Symlinks → `~/GitHub/routeros-skills/routeros-*` |
| `~/.claude/skills/routeros-*` | Symlinks → `~/GitHub/routeros-skills/routeros-*` |
| `~/.copilot/skills/<non-routeros>` | Real dirs or symlinks to `~/.claude/skills/` — local-only, not in this repo |
| `~/.claude/skills/<non-routeros>` | Real dirs — local-only, not in this repo |

## Rule: what belongs in this repo

**Only `routeros-*` named skills.** Anything else (`tikoci-*`, `screenshot`, `sql-as-rag`, `markdownlint-setup`, etc.) is personal/project-scoped and stays in the local `~/.*/skills/` directories only.

## Setting up the symlinks (fresh machine)

```sh
git clone https://github.com/tikoci/routeros-skills.git ~/GitHub/routeros-skills

mkdir -p ~/.copilot/skills ~/.claude/skills

# Symlink all routeros-* skills for Copilot
for skill in ~/GitHub/routeros-skills/routeros-*/; do
  ln -sf "$skill" ~/.copilot/skills/"$(basename $skill)"
done

# Symlink all routeros-* skills for Claude
for skill in ~/GitHub/routeros-skills/routeros-*/; do
  ln -sf "$skill" ~/.claude/skills/"$(basename $skill)"
done
```

## Updating

```sh
cd ~/GitHub/routeros-skills && git pull
```

Because the AI tools follow symlinks to the real files, `git pull` immediately takes effect — no re-linking needed.

## Adding a new routeros-* skill

1. Create `~/GitHub/routeros-skills/routeros-<name>/SKILL.md` (and optionally `references/`)
2. Symlink it into the AI tool directories:

```sh
skill=routeros-<name>
ln -s ~/GitHub/routeros-skills/$skill ~/.copilot/skills/$skill
ln -s ~/GitHub/routeros-skills/$skill ~/.claude/skills/$skill
```

3. Commit and push to GitHub.

## Current symlink state (reference)

After setup, `ls -la ~/.copilot/skills/` should show all `routeros-*` entries as symlinks pointing to `~/GitHub/routeros-skills/routeros-*`, for example:

```
lrwxr-xr-x  routeros-fundamentals -> /Users/<you>/GitHub/routeros-skills/routeros-fundamentals
lrwxr-xr-x  routeros-container    -> /Users/<you>/GitHub/routeros-skills/routeros-container
...
```
