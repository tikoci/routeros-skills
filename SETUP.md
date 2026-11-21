# Local Setup Guide

How to install the skills from a clone of this repo and keep them current. The
clone can live anywhere; the commands below run from its root.

## Skill directories

Assistants discover user-level skills in their own directories:

| Directory | Read by |
|-----------|---------|
| `~/.agents/skills` | Codex, and other harnesses that share it |
| `~/.claude/skills` | Claude Code |
| `~/.copilot/skills` | GitHub Copilot |
| `~/.hermes/skills` | Hermes |

Codex reads user-authored skills from `~/.agents/skills`. `~/.codex/skills`
holds Codex-managed system skills and is not a target for these links.

`make link` symlinks every `routeros-*` folder of this checkout into
`~/.agents/skills` and into the skills directory of each harness above whose
home (`~/.claude`, `~/.copilot`, `~/.hermes`) exists. To choose the
directories yourself, set `SKILL_DIRS` to a space-separated list (paths
without spaces):

```sh
make link SKILL_DIRS="$HOME/.agents/skills $HOME/.claude/skills"
```

`make targets` prints the directories in use. Each whitespace-separated word
is one literal path: no wildcards, and no spaces inside a path (the default
targets do handle a home directory with spaces). An override that names no
directory is an error.

A `SKILL_DIRS=...` argument applies to that one `make` run only. Pass the same
value to `make check` and `make unlink`, or export it in your shell profile.
The git hooks from `make install-hooks` see only the environment of the
process that runs git, so with custom targets export `SKILL_DIRS` there too,
including for a GUI git client. The hooks relink only from the main checkout,
never from a linked worktree (`git worktree add`), so an agent's review
worktree does not repoint the installed skills at itself. Use the environment form
(`SKILL_DIRS=... make link`) for a path containing `$`, which make would
expand in an argument.

## What belongs in this repo

Only `routeros-*` skills. They face outward: RouterOS knowledge, and how to
use public tikoci tools (`routeros-tikoci-<tool>`, with a suffix when needed,
for example `routeros-tikoci-quickchr-cli`). One more, `routeros-tikoci-house`,
points users who want to report on or contribute to a tikoci repo at the
right places. All follow the same public-content and grounding rules.

Skills for developing and maintaining tikoci repos are the `tikoci-*` house
skills, published at <https://tikoci.dev/house/>. Repos copy or reference
them; they are not installed from here. Any other personal skills stay in your
own skill directories.

## Install

```sh
git clone https://github.com/tikoci/routeros-skills.git
cd routeros-skills
make link   # symlink every routeros-* into the target dirs
make check  # verify every skill is linked into every target dir
```

## Updating

```sh
git pull
```

The assistants follow the symlinks into the checkout, so `git pull` takes
effect at once. A renamed or newly added skill directory also needs
`make link` and a fresh assistant session. To relink after every pull or
checkout automatically, run `make install-hooks` once.

## Renamed tikoci tool skills

| Previous name | Current name |
|---------------|--------------|
| `routeros-centrs` | `routeros-tikoci-centrs` |
| `routeros-quickchr` | `routeros-tikoci-quickchr` |
| `routeros-quickchr-cli` | `routeros-tikoci-quickchr-cli` |

After pulling this rename, run `make link` followed by `make check`.
`make link` removes the three obsolete symlinks in the target directories
only when they point to the old paths in this checkout, then creates the
current links. Real directories and links to other checkouts are preserved.
For installations made by copying folders or another installer, remove the old
skills and install the new names using that method.

Update explicit skill invocations, saved prompts, and links to the old skill
directories. The old names are retired without alias skills; start a fresh
assistant session to discover the new names. The `centrs` and `quickchr` CLI
commands and `@tikoci/centrs` / `@tikoci/quickchr` package names are unchanged.

## Linting locally

CI gates every PR on markdownlint + cspell + a `SKILL.md` validator (and an
offline link check). Run the same gate before pushing:

```sh
bun install        # one-time: cspell + markdownlint-cli2 (devDeps)
make lint          # markdownlint + cspell + skill validator
make lint-links    # offline relative-link + #anchor check (needs `lychee`)
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for what each check does and the
spelling-dictionary policy.

## Adding a new routeros-* skill

1. Create `routeros-<name>/SKILL.md` (and optionally `references/`).
2. Run `make link` to link it into every target directory, then `make check`.
   Linking everything at once avoids a skill that is committed but never
   linked. A newly linked skill appears in a fresh assistant session.
3. Run `make lint`, then open a pull request (see
   [CONTRIBUTING.md](CONTRIBUTING.md)).

After `make link`, each target directory lists the `routeros-*` entries as
symlinks into the checkout:

```text
routeros-fundamentals -> <checkout>/routeros-fundamentals
routeros-container    -> <checkout>/routeros-container
...
```
