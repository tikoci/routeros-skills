# MikroTik RouterOS "SkillStore" (`SKILL.md`) for AI assistants

[![CI](https://github.com/tikoci/routeros-skills/actions/workflows/ci.yml/badge.svg)](https://github.com/tikoci/routeros-skills/actions/workflows/ci.yml)

Custom instruction skills for [GitHub Copilot](https://docs.github.com/en/copilot/customizing-copilot/adding-custom-instructions-for-github-copilot), Claude Code, Codex, and similar AI coding assistants that teach them about [MikroTik RouterOS](https://mikrotik.com/) v7.

## Skills

Names distinguish RouterOS knowledge from tikoci tooling:

- `routeros-*`: RouterOS features, protocols, and platform knowledge.
- `routeros-tikoci-*`: using public tikoci tools with RouterOS, including centrs
  and quickchr. Future tikoci tool skills use this prefix too.
- `routeros-tikoci-house`: a pointer for contributing to tikoci repos.
- `tikoci-*` (not here): house skills for developing tikoci repos, published at
  <https://tikoci.dev/house/>.

| Skill | Description |
|-------|-------------|
| **routeros-fundamentals** | RouterOS v7 domain knowledge — CLI, REST API, scripting, architecture. The foundational skill that others build on. |
| **routeros-scripting** | RouterOS scripting and CLI config automation — `.rsc` syntax, `[find]` selectors, script-safe IDs, arrays, globals, scheduler policies. |
| **routeros-container** | RouterOS `/container` subsystem — VETH/bridge networking, OCI images, device-mode, lifecycle management. |
| **routeros-firewall** | RouterOS firewall filter, NAT, mangle, and address-list configuration — rule ordering, connection tracking, address/interface lists, DNS redirects, and port forwarding. |
| **routeros-hotspot** | RouterOS hotspot captive portal for wired/wireless access control — hotspot chains, profiles, walled garden, DHCP option 114 (RFC 8910), RADIUS integration. |
| **routeros-app-yaml** | RouterOS `/app` YAML format for container applications (7.21+ builtin, 7.22+ custom YAML). |
| **routeros-command-tree** | `/console/inspect` API — command tree introspection, schema generation, CLI-to-REST mapping. |
| **routeros-syntax-inspection** | `/console/inspect` syntax surfaces (`highlight`/`completion`/`syntax`) + `:parse` IL — validating commands, reading token streams, enum discovery, script "explain"/lint; necessary-not-sufficient vs runtime. |
| **routeros-qemu-chr** | MikroTik CHR (Cloud Hosted Router) with QEMU — boot, VirtIO, acceleration, CI/CD patterns. |
| **routeros-tikoci-quickchr** | Ground RouterOS config/scripts/API code against a real router with quickchr (`@tikoci/quickchr`) — boot a disposable CHR, apply config, read it back; networking recipes, integration-test harness patterns. |
| **routeros-tikoci-quickchr-cli** | The shell-first half of quickchr — boot a disposable CHR from the terminal and drive it with centrs. Lifecycle (`add` is not `start`), `--bg`, endpoints and credentials, L2 links between VMs, and the provisioning steps that only apply before first boot. |
| **routeros-tikoci-centrs** | Drive a real router or CHR with centrs (`@tikoci/centrs`) — target resolution from the WinBox CDB or a quickchr VM, RouterOS command validation before it runs, one structured envelope over REST, native API, SSH/SFTP, MAC-Telnet, and MNDP, plus `retrieve --wait`/`--query` and NDJSON streams. Use instead of hand-rolled `curl`/`ssh`. |
| **routeros-zerotier** | Native ZeroTier on ARM/ARM64 — instances, network authorization, RouterOS controllers, managed routes, firewall integration, RoMON, and bridging. |
| **routeros-webfig** | Link humans to RouterOS WebFig views — connections, addresses, VLANs, bridges, firewall rules and CMR; object URLs, login/session behavior, and native WebView integration guidance grounded on CHR browser checks. |
| **routeros-cmr** | MikroTik CMR for managing a fleet of RouterOS devices — the optional controller package and built-in `/cmr/client`, controller/client pairing over TCP/54321, routed controller-addresses or neighbor discovery, labels, fleet run-scripts, resource/availability/log alerts and HTTP webhooks, topology, and upgrade rules. |
| **routeros-netinstall** | `netinstall-cli` for automated RouterOS device flashing — etherboot, BOOTP/TFTP, modescript. |
| **routeros-proprietary-protocols** | Navigator for MikroTik-specific protocols and file formats — WinBox/M2, MAC-WinBox, RoMON, MAC-Telnet, MNDP, API, EoIP, btest, IP packing, and binary files; research/implementation pointers and explicit knowledge gaps. |
| **routeros-mndp** | MNDP (MikroTik Neighbor Discovery Protocol) — wire format, `/ip/neighbor`, WinBox discovery. |
| **routeros-mac-telnet** | MAC-Telnet (UDP 20561) — Layer-2 terminal by MAC address, 22-byte header, control blocks, MD5 + MTWEI (EC-SRP) auth. |
| **routeros-legacy-wireless** | The legacy `wireless` package — `/interface/wireless`, legacy CAPsMAN (`/caps-man`) provisioning and access-list gotchas, and 60 GHz W60G links (point-to-multipoint, VLANs over `wlan60-station-N`, the 5 GHz backup bond). |
| **routeros-tikoci-house** | Pointer for contributing to tikoci repos — where the house skills live, which repo owns what, how to report a bug or vulnerability, and what a PR needs; plus where to start a GitHub Actions workflow that tests RouterOS against a CHR. |
| **routeros-sniffer** | RouterOS packet capture and TZSP streaming — `/tool/sniffer`, firewall sniff-tzsp, Wireshark integration. |

## Install

Clone this repo and symlink the skill folders into your assistant skill directories:

```sh
git clone https://github.com/tikoci/routeros-skills.git
cd routeros-skills
make link   # ~/.agents/skills plus each installed harness's skills dir
make check
```

The centrs and quickchr skills were renamed to `routeros-tikoci-*`. Existing
installs should run `make link` after pulling, update explicit skill names and
links, and start a fresh assistant session. See [migration details](SETUP.md#renamed-tikoci-tool-skills).

Each skill is a folder containing a `SKILL.md` file and optionally a `references/` subfolder. VS Code Copilot and Claude Code automatically discover skills in their respective `~/.*/skills/` directories.
Codex discovers user-authored skills in `~/.agents/skills`, and Hermes in `~/.hermes/skills`.
To pick the directories yourself, set `SKILL_DIRS`; see [SETUP.md](SETUP.md#skill-directories).

> **Tip:** Start with **routeros-fundamentals** — it covers the core concepts that other skills reference.

## Repository layout

This repo is the **single source of truth** for all `routeros-*` skills. After `make link`, the `routeros-*` entries in your assistant skill directories are symlinks into your checkout, so editing them is the same as editing here.

Skills for developing and maintaining tikoci repos are the `tikoci-*` house skills at <https://tikoci.dev/house/>, **not** this repo. See [SETUP.md](SETUP.md) for the local setup guide.

**The Skill Set is the `routeros-*/` folders only.** Everything else at the repo root is the **CI/QA and tooling layer** that validates and ships those skills — it is *not* part of the skill content and is not symlinked into `~/.*/skills/`:

- `AGENTS.md`, `CLAUDE.md` — instructions for agents working on this repo
- `.github/` — CI workflows (lint, link check, dependency review), Dependabot config, and the PR template
- `scripts/` — the `SKILL.md` validator (`check-skills.ts`) run by CI and `make lint`
- `hooks/` — optional local git hooks that re-symlink skills after checkout/merge (`make install-hooks`)
- `Makefile`, `.markdownlint*.yaml`, `cspell.json`, `project-words.txt`, `package.json`, `bun.lock` — lint/build configuration and the dev dependency tree

## Scope

These skills cover **RouterOS 7.x** (long-term and newer releases). RouterOS v6 is not covered and accuracy for v6 questions will be low.

## Contributing

1. Fork this repository (or branch, if you have write access)
2. Edit or add skills (each skill is a `<name>/SKILL.md` folder)
3. Run the checks locally: `make lint` (and `make lint-links` if you have [lychee](https://lychee.cli.rs/))
4. Open a pull request — `main` is protected, so all changes land via PR

Every PR is gated by [CI](.github/workflows/ci.yml) (markdownlint + cspell + a `SKILL.md` validator + offline link check) and reviewed by CodeRabbit and Copilot. See [CONTRIBUTING.md](CONTRIBUTING.md) for the local setup, the dictionary policy, and what each check does.

Feedback, corrections, and new skill ideas are welcome via [issues](https://github.com/tikoci/routeros-skills/issues).

## License

[MIT](LICENSE)
