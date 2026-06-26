# Security Policy

## Reporting a Vulnerability

Report privately via [GitHub Security Advisories](https://github.com/tikoci/routeros-skills/security/advisories/new). Do **not** open a public issue for an undisclosed vulnerability.

Please include the affected files or workflow, reproduction details, and impact. Initial response within a few business days; fixes land on `main`.

## Scope

This repository ships **Markdown documentation** — AI-assistant skills (`SKILL.md` + reference files) teaching coding agents about MikroTik RouterOS v7. It has no runtime service, network listener, or stored credentials. The only executable code is dev-time lint tooling:

- `scripts/check-skills.ts` — a Bun script that validates skill frontmatter, run in CI and locally.
- `.github/workflows/**` — CI workflows (lint, link check, dependency review, CodeQL).

So the practical security surface is the **CI workflows** and the **dev dependency tree** (`cspell`, `markdownlint-cli2`), not anything that runs on a user's router or host.

## Code scanning

The repository's [Security tab](https://github.com/tikoci/routeros-skills/security) is the live source of current alerts and advisories. This section describes *what* checks run and *why*, so it stays meaningful even when the badge is at 0.

- **CodeQL** — GitHub [Default Setup](https://github.com/tikoci/routeros-skills/settings/security_analysis), `default` query suite (the org-managed baseline). Languages: `javascript-typescript` (the Bun helper script) and `actions` (the workflow YAML — this is what raises the `actions/unpinned-tag` advice, so third-party Actions in [`.github/workflows/**`](.github/workflows) are pinned to a commit SHA with a `# vX.Y.Z` comment and kept fresh by Dependabot). Runs on push to `main` and pull requests. Default Setup is used because the org auto-enables it on public repos; an advanced repo-managed workflow would conflict with it.
- **Code Quality (AI findings, preview)** — enabled. Surfaces non-security code-quality suggestions for the Bun script and Markdown prose; GitHub can open autofix PRs for them (labeled `gh-ai-finding`). These are advisory, not a merge gate.
- **Dependency review** — [`.github/workflows/dependency-review.yml`](.github/workflows/dependency-review.yml), `fail-on-severity: high`, on pull requests.
- **Dependabot alerts** — enabled.
- **Secret scanning** — enabled (GitHub default for public repositories), with push protection.
- **Private vulnerability reporting** — enabled.

Because there is so little code (one Bun helper script), CodeQL is intentionally low-volume; it is kept to stay on the tikoci public-repo baseline.

## Supported versions

| Version | Supported |
| --- | --- |
| `main` | ✅ |
| older | ❌ |
