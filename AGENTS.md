# routeros-skills — agent instructions

This repo publishes the outward-facing `routeros-*` skills: RouterOS v7
knowledge, how to use public tikoci tools (`routeros-tikoci-*`), and one
pointer for contributing to tikoci repos (`routeros-tikoci-house`). Each
`routeros-*/` folder at the root is one skill (`SKILL.md` plus optional
`references/`) and is the product. Everything else is lint, CI and install
tooling. [README.md](README.md) lists the skills; [CONTRIBUTING.md](CONTRIBUTING.md)
holds the grounding rules, the checks and the spelling policy;
[SETUP.md](SETUP.md) covers installing with `make link`.

## Rules

- **Skills are public.** No operator machine facts (home paths, host names,
  accounts, local checkouts), no non-public projects, no captures or
  credentials from real routers. Write examples with placeholders.
- **RouterOS 7 only.** Ground each non-obvious claim (help.mikrotik.com, a
  public tikoci repo, a `/console/inspect` query, a run against a CHR) and say
  which version it was checked on. Less detail beats shaky detail
  ([CONTRIBUTING.md](CONTRIBUTING.md#grounding-dont-record-what-you-havent-verified)).
- **A new skill** is `routeros-<topic>` or `routeros-tikoci-<tool>`;
  frontmatter `name` equals the directory; add its row to the README table.
  `tikoci-*` names are reserved for the house skills.
- **Run `make lint`** (and `make lint-links` when lychee is installed) before
  pushing; it is the CI gate. Real terms go in `project-words.txt`; typos get
  fixed.
- **Work items** go in issues or [BACKLOG.md](BACKLOG.md), never in this file.
- **Temporary work** goes in `.scratch/` (gitignored).

## Pull requests

Follow the house PR flow (below), in short: open a draft PR early; add the
`skip-review` label for a typo, link fix or version bump; CodeRabbit reviews
once when the PR is marked ready, and an agent never asks it for another
review; answer every thread (fixed, declined with evidence, or tracked) and
resolve it; a human squash-merges. Fill in
[the PR template](.github/pull_request_template.md), including how each new
claim was grounded.

## House skills

Referenced by URL, none copied. Read the one that fits before that kind of
change:

- [tikoci-house](https://tikoci.dev/house/skills/tikoci-house/SKILL.md)
  (referenced): AGENTS.md, CLAUDE.md, skill tiers, precedence.
- [tikoci-pr-flow](https://tikoci.dev/house/skills/tikoci-pr-flow/SKILL.md)
  (referenced): opening, reviewing, answering and merging a PR.
- [tikoci-github](https://tikoci.dev/house/skills/tikoci-github/SKILL.md)
  (referenced): repo settings, security alerts, SECURITY.md.
- [tikoci-ci](https://tikoci.dev/house/skills/tikoci-ci/SKILL.md) and
  [tikoci-dependencies](https://tikoci.dev/house/skills/tikoci-dependencies/SKILL.md)
  (referenced): workflows, SHA-pinned actions, Dependabot.
- [tikoci-grounding](https://tikoci.dev/house/skills/tikoci-grounding/SKILL.md)
  (referenced): checking a RouterOS claim on a CHR before writing it down.
- [tikoci-crossref](https://tikoci.dev/house/skills/tikoci-crossref/SKILL.md)
  (referenced): which tikoci repo owns a topic.

## House exceptions

- **Skills live at the repo root (`routeros-*/`), not `.agents/skills/`.**
  They are the published product, installed per user by `make link`; this
  repo has no repo-local skills.
- **CodeRabbit runs the `chill` profile**, not `assertive`: review here is
  about RouterOS accuracy in prose, and CI owns spelling and Markdown.
- **The dependency-review workflow stays**: it is a required check on `main`.
  It sees GitHub Actions and the `package.json` ranges, not `bun.lock`.
- **Skills may link a sibling skill by relative path** (`../routeros-*/`),
  since `make link` installs them together; links outside this repo are
  absolute URLs. A skill meant to stand alone (`routeros-tikoci-house`) uses
  absolute URLs throughout.
- **Branch protection on `main` applies to admins too.** Agents here act
  through the maintainer's admin login, so enforcement stops an agent from
  pushing to `main` directly. The maintainer can turn it off to unblock `main`.
- **House adoption is partial.** The `tikoci-ci` recipes this repo has not
  adopted yet are tracked in [BACKLOG.md](BACKLOG.md)
  (Housekeeping), not here.
