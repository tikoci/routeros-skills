---
name: routeros-crossref
description: "RouterOS cross-project knowledge map — which tikoci project owns which domain, where to find implementation details, and critical gotchas shared across projects. Use when: working on any MikroTik/RouterOS project under ~/GitHub or ~/Lab, asking where a RouterOS feature is implemented, crossing project boundaries (e.g. rosetta needing restraml schema data), debugging RouterOS API issues, or when the user mentions tikoci projects, RouterOS cross-references, or 'where is X implemented'. Also use when starting work in a RouterOS project to understand its neighbors."
---

# RouterOS Cross-Project Knowledge

Many projects under `~/GitHub` and `~/Lab` deal with MikroTik RouterOS. Each project's instruction files (CLAUDE.md or `.github/instructions/`) have deep domain knowledge on its slice — when working in one, check related projects for context. See `~/GitHub/CLAUDE.md` for the full project index.

## Topic → Where to look

| Topic | Project | What it knows |
|-------|---------|---------------|
| **QEMU expert (all CHR)** | `~/GitHub/quickchr` | QEMU args, firmware, acceleration, networking modes, boot detection, channels (monitor/serial/QGA), device-mode, provisioning, `exec` (run RouterOS CLI commands via REST `/execute`). Instructions in `.github/instructions/qemu.instructions.md` — no CLAUDE.md (intentional) |
| REST API structure | `~/GitHub/restraml` | Endpoint tree, `/console/inspect`, RAML schema, `/app` YAML schema (7.22+), `deep-inspect.json` (enriched schema with attribute enums via `request=completion`) |
| REST API gotchas | `~/GitHub/netinstall` | HTTP verb mapping (PUT=create, PATCH=update, POST=command), property name differences pre/post-7.22 |
| Scripting language / LSP | `~/GitHub/lsp-routeros-ts` | LSP architecture, `/console/inspect` API usage, three build targets, TikBook integration |
| Docs as RAG (MCP) | `~/GitHub/rosetta` | RouterOS docs → SQLite FTS5, command tree (40K entries from inspect.json), device benchmarks, changelogs, YouTube transcripts. MCP server (14 tools, consolidating toward ~8–10) + first-class browse TUI sharing one core. Canonical SQL-as-RAG reference — see `BACKLOG.md` "Guiding Principles" + "North Star" for current thinking on classifier-based search, tool surface design, and TUI-as-audit-surface. Pending: enrichment from restraml `deep-inspect.json` |
| CHR image building | `~/GitHub/fat-chr` | EXT2→FAT EFI partition conversion for UEFI-strict platforms (OCI, some Macs) |
| ARM64 CHR / Cloud | `~/GitHub/chr-armed` | OCI ARM64 (A1.Flex) + AWS x86 AMI building. **Serial console provisioning**: prompt detection with buffer offset tracking, `\r` not `\r\n` for PTY, license Y/n screen, forced password change. ARM64 CHR lacks AWS ENA driver (reported to MikroTik) |
| Netinstall protocol | `~/GitHub/netinstall` | `netinstall-cli` flags, BOOTP/TFTP, architecture mapping, modescript. Makefile pattern for sequential package orchestration |
| Container provisioning | `~/GitHub/netinstall` | `/container` REST workflow, VETH/bridge setup, env vars, lifecycle |
| Pkl + UTM + QEMU | `~/GitHub/mikropkl` | Declarative VM manifests, UTM packaging, Make-based builds. `Lab/` has extensive QEMU experiments and grounded CHR facts. `qemu.cfg` scheme separates QEMU config concerns. **vmnet-shared and vmnet-bridge tested on Intel Mac** |
| CHR in CI | `~/GitHub/restraml` | Direct QEMU on GitHub runner, KVM, wait-for-boot pattern |
| Notebook / CLI tools | `~/GitHub/vscode-tikbook` | API interaction, SSH/fetch patterns |
| Copilot skills | `~/GitHub/routeros-skills` | RouterOS skills for GitHub Copilot (source of truth: `~/.copilot/skills/`). Missing: `/console/inspect request=completion` validation skill |
| TZSP packet capture (MCP) | `~/Lab/mcp-monorepo/mcp-tzsp` | TZSP listener MCP server — receives mirrored packets from RouterOS `/tool/sniffer` or mangle `sniff-tzsp`. Pure TypeScript TZSP parser, UDP socket, SQLite config. See `routeros-sniffer` skill for RouterOS-side setup |
| Forum archive (MCP) | `~/Lab/mcp-discourse` | MikroTik forum as SQLite FTS5 for LLM retrieval |
| RouterOS TUI | `~/Lab/tiktui` | HTMX+SSE experiment with native API, REST API, and SSH access patterns. Has SSH→SSE proxy mode. Not shipping but useful reference for multi-protocol RouterOS access |
| Alpine/container build | `~/GitHub/make.d` | Makefile-based Alpine package + RouterOS container builds. Pattern for declarative package management |
| Version channels | `~/GitHub/restraml`, `~/GitHub/netinstall` | `upgrade.mikrotik.com/routeros/NEWESTa7.<channel>`, download vs cdn URLs |

## Critical Cross-Project Learnings

These are hard-won gotchas that apply across multiple projects. If you're doing anything in the affected area, surface these proactively.

- **Multiplexed API batches crash RouterOS API process** (from restraml): batches of multiplexed `/console/inspect` requests via native API can crash the API process on the router, requiring full retry of the batch. REST API is safer — pins failure to a single call. Reported to MikroTik. Applies to any project doing bulk API calls.
- **`/console/inspect request=completion` validates commands**: check the result array for `"error"` or `"obj-invalid"` entries to validate a command before executing. Used by lsp-routeros-ts and vscode-tikbook. quickchr plans `exec --lint` (default on, `--skip-lint` to bypass) using this same mechanism. Any tool sending commands via SSH, serial, or REST `/execute` should consider a "strict mode" that pre-validates via inspect.
- **ARM64 CHR has more packages than x86** (extra: zerotier, wifi-qcom). restraml wants to schema all packages — ARM64 CHR gives the most complete schema.

## Common RouterOS Constants

Don't duplicate these across projects — reference them:
- CHR image URLs: `download.mikrotik.com` (stable) vs `cdn.mikrotik.com` (beta/rc)
- Architecture names: `arm`, `arm64`, `mipsbe`, `mmips`, `smips`, `ppc`, `tile`, `x86`
- Version format: `MAJOR.MINOR[beta|rc|N]` — e.g. `7.22`, `7.23beta2`, `7.22rc1`
