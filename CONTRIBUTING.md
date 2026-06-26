# Contributing to routeros-skills

This repo is the canonical source for the public `routeros-*` skills consumed by
Claude Code and GitHub Copilot. Changes are small and content-focused — a skill
is just a `<name>/SKILL.md` file (plus optional `references/`) — but they ship to
every agent that loads these skills, so we gate quality in CI.

## Pull-request discipline

- **`main` is protected.** All changes land through a pull request; direct pushes
  are rejected. Branch off `main`, push, and open a PR.
- **CI must be green** before merge (see below). No approving review is required —
  this is a small, often solo-maintained repo — but the deterministic checks are
  required.
- **Every PR is also reviewed by [CodeRabbit] and [GitHub Copilot]** automatically.
  They handle the *semantic* side — RouterOS factual accuracy and the
  footnote-grounding discipline — which the linters can't. CI owns spelling and
  Markdown structure; the bots don't re-report those (configured in
  [`.coderabbit.yaml`](.coderabbit.yaml)).

[CodeRabbit]: https://coderabbit.ai/
[GitHub Copilot]: https://github.com/features/copilot

## Running the checks locally

Prerequisites: [Bun](https://bun.sh). Optional: [lychee](https://lychee.cli.rs/)
(`brew install lychee`) for the link check.

```sh
bun install        # one-time: installs cspell + markdownlint-cli2
make lint          # = bun run check: markdownlint + cspell + SKILL.md validator
make lint-links    # offline relative-link + #anchor check (needs lychee)
```

`make lint` is the exact gate CI runs. Get it green before opening a PR.

## What CI checks

| Check | Tool | What it catches |
|-------|------|-----------------|
| `lint` → markdown | `markdownlint-cli2` | Structure: code-fence language tags, list/heading spacing, tables, bare URLs. Config: [`.markdownlint.yaml`](.markdownlint.yaml). |
| `lint` → spelling | `cspell` | Typos. Real RouterOS/networking terms live in [`project-words.txt`](project-words.txt). |
| `lint` → skills | [`scripts/check-skills.ts`](scripts/check-skills.ts) | Each `SKILL.md` has valid frontmatter, `name` matches the directory, `description` ≤ 1024 chars, and an H1. |
| `links` | `lychee` (offline) | Broken **relative** links and `#anchors`. External URLs are skipped so a flaky network never fails the gate. |
| `actionlint` | `actionlint` | Mistakes in the workflow YAML itself. |

Security workflows (CodeQL, dependency review) also run — see [`SECURITY.md`](SECURITY.md).

## Spelling: dictionary vs. typo

When cspell flags a word, decide which it is:

- **A real term** (a RouterOS keyword, protocol, tool, acronym) → add it to
  [`project-words.txt`](project-words.txt), one word per line, keeping the file
  roughly alphabetical. To list everything cspell doesn't know:

  ```sh
  bunx cspell lint . --no-progress --words-only --unique | sort -uf
  ```

- **An actual typo** → fix it in the source. Don't paper over a misspelling by
  adding it to the dictionary.

## Adding a new skill

1. Create `routeros-<name>/SKILL.md` with frontmatter:

   ```yaml
   ---
   name: routeros-<name>
   description: "What it covers + when to use it. Keep under 1024 chars."
   ---
   ```

2. `name` **must** equal the directory name, and the body should start with an H1.
3. Run `make lint` and fix anything it reports.
4. See [SETUP.md](SETUP.md) for symlinking the new skill into your local
   `~/.claude/skills` and `~/.copilot/skills` (`make link`).
