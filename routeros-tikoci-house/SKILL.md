---
name: routeros-tikoci-house
description: "Pointer for going from using a tikoci tool to reporting on or changing one: which tikoci repo owns a topic, how to file a bug or a private vulnerability report, what a pull request to a tikoci repo needs, and where tikoci's house skills for developing its repos live (tikoci.dev/house). Use when: reporting a bug or wrong claim in centrs, quickchr, rosetta, another tikoci project or a routeros-* skill; opening an issue or PR on a github.com/tikoci repo. Not for using the tools (routeros-tikoci-centrs, routeros-tikoci-quickchr-cli) or RouterOS knowledge (routeros-fundamentals)."
---

# Contributing to tikoci

A map of where to look, not a list of rules. [tikoci](https://tikoci.dev/)
repos share conventions, the **house skills** (`tikoci-*`), published at
<https://tikoci.dev/house/>. This skill points an agent at the right places
when it moves from *using* a tikoci tool to *reporting on* or *changing* one.
The linked pages are the current version; nothing here restates them.

## Find the right repo

- **Topic to repo**:
  [tikoci-crossref](https://tikoci.dev/house/skills/tikoci-crossref/SKILL.md),
  generated from the org catalog.
- **A wrong or stale claim in a `routeros-*` skill**:
  [tikoci/routeros-skills](https://github.com/tikoci/routeros-skills/issues);
  its [README](https://github.com/tikoci/routeros-skills#skills) lists the
  skills.
- **A bug in RouterOS itself** goes to MikroTik support, not to tikoci, which
  is not affiliated with MikroTik.

## Report a bug

- **Search the repo's open issues first**; comment on a match rather than
  filing a duplicate.
- **Make it reproducible**: the tool and its version, the RouterOS version and
  architecture, the exact command and its full output. A run against a
  disposable CHR
  ([routeros-tikoci-quickchr-cli](https://github.com/tikoci/routeros-skills/blob/main/routeros-tikoci-quickchr-cli/SKILL.md))
  shows the bug is not one network's quirk.
- **Redact before posting**: credentials, public IP addresses, serial numbers
  and license keys. Never attach a WinBox address book (`.cdb`), a Dude
  database, a packet capture or an export from a real router; reduce it to a
  synthetic example.
- **A security problem** goes through the repo's private vulnerability
  reporting (**Security → Report a vulnerability**) or the route its
  `SECURITY.md` names, never a public issue.[^ground-settings]

## Open a pull request

- **Read the repo's contributor docs first**: `AGENTS.md` where the repo has
  one, and `CONTRIBUTING.md`. They name the checks to run and win over the
  house skills.
- **The house PR flow** is
  [tikoci-pr-flow](https://tikoci.dev/house/skills/tikoci-pr-flow/SKILL.md),
  where a repo has adopted it.
- **Without write access, fork and open the PR from the fork.** A first-time
  contributor's workflow runs wait for a maintainer's
  approval.[^ground-settings]
- **Claims need evidence**: a change to what a tool or skill says RouterOS
  does carries its source, such as a run against a CHR with its output
  ([tikoci-grounding](https://tikoci.dev/house/skills/tikoci-grounding/SKILL.md)).

For CI that boots a CHR on a GitHub-hosted runner, see
[routeros-qemu-chr, GitHub Actions CI](https://github.com/tikoci/routeros-skills/blob/main/routeros-qemu-chr/references/github-actions-ci.md).

[^ground-settings]: Examples, not a guarantee for every repo. Checked
    2026-11-20: `gh api repos/tikoci/<repo>/private-vulnerability-reporting`
    returned `{"enabled":true}` for centrs, quickchr, rosetta and
    routeros-skills, and `actions/permissions/fork-pr-contributor-approval`
    returned `first_time_contributors` for those four, restraml and
    lsp-routeros-ts.
