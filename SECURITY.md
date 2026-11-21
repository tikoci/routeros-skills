# Security Policy

## Reporting a vulnerability

Report privately through
[private vulnerability reporting](https://github.com/tikoci/routeros-skills/security/advisories/new).
Do **not** open a public issue for an undisclosed vulnerability. A maintainer
answers in the advisory.

Please include the affected files or workflow, reproduction details, and
impact.

## Scope

This repository ships **Markdown documentation**: AI-assistant skills
(`SKILL.md` plus reference files) that teach coding agents about MikroTik
RouterOS v7. It has no runtime service, network listener, or stored
credentials. The only executable code is tooling:

- `scripts/check-skills.ts`: a Bun script that validates skill frontmatter, run
  in CI and locally.
- `scripts/link-skills.sh` and `hooks/`: local install helpers that symlink the
  skills into assistant skill directories (`make link`).
- `.github/workflows/**`: CI workflows (lint, link check, dependency review).

So the practical security surface is the **CI workflows** and the **dev
dependency tree** (`cspell`, `markdownlint-cli2`), not anything that runs on a
user's router.

A skill that teaches something unsafe (a command that exposes a router, a
credential written into an example) is a security bug too: report it the same
way, or as a normal issue when it is not exploitable. Vulnerabilities in
RouterOS itself go to MikroTik, not here.

## Code scanning

The [Security tab](https://github.com/tikoci/routeros-skills/security) holds
the current alerts. This table says what runs; it was filled from the
repository settings on 2026-11-20.

| Check | State |
| --- | --- |
| CodeQL, default setup (`actions`, `javascript-typescript`), Extended suite | enabled |
| Secret scanning with push protection | enabled |
| Private vulnerability reporting | enabled |
| Dependabot alerts | enabled, on the dependency graph: GitHub Actions, and `package.json` as version ranges (it does not read the resolved versions in `bun.lock`) |
| Dependabot security updates | enabled for GitHub Actions; Dependabot has no security updates for Bun |
| Dependabot version updates | GitHub Actions and Bun, weekly, grouped ([`.github/dependabot.yml`](.github/dependabot.yml)); they raise direct dependencies only, so a vulnerable transitive package can stay locked until a direct dependency releases |
| Dependency review | [`.github/workflows/dependency-review.yml`](.github/workflows/dependency-review.yml), `fail-on-severity: high`, on pull requests; it compares the same dependency graph (Actions, and `package.json` ranges), not `bun.lock` |
| `bun audit` of the resolved `bun.lock` tree | [`.github/workflows/audit.yml`](.github/workflows/audit.yml) runs `bun run audit` ([`scripts/audit.ts`](scripts/audit.ts)) when `bun.lock` or `package.json` changes, and weekly; it fails on any advisory not on the script's ignore list, where each entry carries its reason |
| Code Quality, AI findings | not enabled: paid features, outside the tikoci house setup |

Third-party Actions in [`.github/workflows/**`](.github/workflows) are pinned
to a commit SHA with a `# vX.Y.Z` comment, and Dependabot keeps the pins
current. Open alerts are fixed, or dismissed in the Security tab with a written
reason.

## Supported versions

Fixes land on `main`. Only `main` is supported.
