---
name: routeros-tikoci-house
description: "Pointer for going from using a tikoci tool to changing or reporting on one: which tikoci repo owns a topic, how to file a bug or a private vulnerability report, what a pull request to a tikoci repo needs (AGENTS.md first, draft PR, CI gate, evidence, the skip-review label), and where tikoci's house skills for developing its repos live (tikoci.dev/house). Also routes a GitHub Actions workflow that tests RouterOS config or scripts against a CHR to the skills that cover it. Use when: reporting a bug or wrong claim in centrs, quickchr, rosetta, another tikoci project or a routeros-* skill; opening an issue or PR on a github.com/tikoci repo; writing CI that boots a CHR. Not for using the tools (routeros-tikoci-centrs, routeros-tikoci-quickchr-cli) or RouterOS knowledge (routeros-fundamentals)."
---

# Contributing to tikoci

A map of where to look, not a list of rules. [tikoci](https://tikoci.dev/) repos share conventions,
the **house skills** (`tikoci-*`), published at <https://tikoci.dev/house/>.
Each repo's `AGENTS.md` says which ones it follows and lists its exceptions.
This skill tells an agent where to look when it moves from *using* a tikoci
tool to *reporting on* or *changing* one. It restates no house rule: follow the
links for the current version.

## Find the right repo

- **The topic-to-repo map** is
  [tikoci-crossref](https://tikoci.dev/house/skills/tikoci-crossref/SKILL.md),
  generated from the org catalog: device access is centrs, CHR VMs are
  quickchr, docs search is rosetta, command schemas are restraml, agent skills
  are routeros-skills, and so on. For the tools as a user, start at
  <https://tikoci.dev/llms.txt>.
- **A wrong or stale claim in a `routeros-*` skill** goes to
  [tikoci/routeros-skills](https://github.com/tikoci/routeros-skills/issues).
- **A bug in RouterOS itself** goes to MikroTik support, not to tikoci. tikoci
  is not affiliated with MikroTik.

## Report a bug

- **Search the repo's open issues first**; comment on a match rather than
  filing a duplicate.
- **Make it reproducible**: the tool and its version, the RouterOS version and
  architecture (a CHR, or the board), the exact command, and its full output.
  A run against a disposable CHR
  ([routeros-tikoci-quickchr-cli](../routeros-tikoci-quickchr-cli/SKILL.md))
  shows the bug is not one network's quirk.
- **Redact before posting**: credentials, public IP addresses, serial numbers
  and license keys. Never attach a WinBox address book (`.cdb`), a Dude
  database, a packet capture or an export from a real router; reduce it to a
  synthetic example.
- **A security problem** (a credential leak, an unsafe default, a workflow an
  outsider could abuse) goes through the repo's private vulnerability
  reporting, under **Security → Report a vulnerability**, never a public
  issue.[^ground-settings]

## Open a pull request

- **Read the repo's `AGENTS.md`, then `CONTRIBUTING.md`, before changing
  anything.** The repo's own file wins over the house skills
  ([tikoci-house](https://tikoci.dev/house/skills/tikoci-house/SKILL.md),
  "Instruction precedence").
- **The house PR flow** is
  [tikoci-pr-flow](https://tikoci.dev/house/skills/tikoci-pr-flow/SKILL.md).
  What a contributor meets: PRs target `main`; a draft PR is welcome early;
  CodeRabbit reviews once when the PR is marked ready, and nobody needs to ask
  it again; every review thread is answered and resolved; a maintainer
  squash-merges, so the PR title becomes the commit subject.
- **Without write access, fork and open the PR from the fork.** A first-time
  contributor's workflow runs wait for a maintainer's approval.[^ground-settings]
- **The `skip-review` label** keeps CodeRabbit off a PR that needs no hosted
  review (a typo, a link, a version bump). Applying labels needs triage
  access, so an outside contributor asks for it in the PR
  description.[^ground-labels]
- **Run the repo's own gate before pushing**, the one its `CONTRIBUTING.md`
  or `AGENTS.md` names (routeros-skills: `make lint`), and say in the
  description what you ran.
- **Claims need evidence.** A change to what a tool or skill says RouterOS
  does carries the source: a run against a CHR with its output, a
  help.mikrotik.com page, or a `/console/inspect` query
  ([tikoci-grounding](https://tikoci.dev/house/skills/tikoci-grounding/SKILL.md)).

## GitHub Actions that test RouterOS

- **Booting a CHR on a GitHub-hosted runner** (KVM on `ubuntu-latest`, image
  download, boot wait, cleanup):
  [routeros-qemu-chr, GitHub Actions CI](../routeros-qemu-chr/references/github-actions-ci.md).
- **With quickchr**:
  [routeros-tikoci-quickchr-cli](../routeros-tikoci-quickchr-cli/SKILL.md) for
  shell steps, [routeros-tikoci-quickchr](../routeros-tikoci-quickchr/SKILL.md)
  for a Bun/TypeScript test harness (a per-run data directory, the image
  cache).
- **Talking to the CHR from a step**:
  [routeros-tikoci-centrs](../routeros-tikoci-centrs/SKILL.md).
- **tikoci's own workflow conventions** (actions pinned to a commit SHA and
  updated by Dependabot, a read-only workflow token, one gate job) are in
  [tikoci-ci](https://tikoci.dev/house/skills/tikoci-ci/SKILL.md) and
  [tikoci-dependencies](https://tikoci.dev/house/skills/tikoci-dependencies/SKILL.md).
  They are written for tikoci repos but are reasonable defaults for any repo.

[^ground-settings]: Checked 2026-11-20 with
    `gh api repos/tikoci/<repo>/private-vulnerability-reporting`, which
    returned `{"enabled":true}` for centrs, quickchr, rosetta and
    routeros-skills; `actions/permissions/fork-pr-contributor-approval`
    returned `first_time_contributors` for those four, restraml and
    lsp-routeros-ts. Private vulnerability reporting is a house default
    ([tikoci-github](https://tikoci.dev/house/skills/tikoci-github/SKILL.md),
    "Security settings").

[^ground-labels]: GitHub Docs,
    [Managing labels](https://docs.github.com/en/issues/using-labels-and-milestones-to-track-work/managing-labels):
    applying a label to an issue or PR needs triage access to the repository.
