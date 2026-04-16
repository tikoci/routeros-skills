# MikroTik RouterOS "SkillStore" (`SKILL.md`) for AI assistants

Custom instruction skills for [GitHub Copilot](https://docs.github.com/en/copilot/customizing-copilot/adding-custom-instructions-for-github-copilot) and Claude Code (and similar AI coding assistants) that teach them about [MikroTik RouterOS](https://mikrotik.com/) v7.

## Skills

| Skill | Description |
|-------|-------------|
| **routeros-fundamentals** | RouterOS v7 domain knowledge — CLI, REST API, scripting, architecture. The foundational skill that others build on. |
| **routeros-container** | RouterOS `/container` subsystem — VETH/bridge networking, OCI images, device-mode, lifecycle management. |
| **routeros-app-yaml** | RouterOS `/app` YAML format for container applications (7.21+ builtin, 7.22+ custom YAML). |
| **routeros-command-tree** | `/console/inspect` API — command tree introspection, schema generation, CLI-to-REST mapping. |
| **routeros-qemu-chr** | MikroTik CHR (Cloud Hosted Router) with QEMU — boot, VirtIO, acceleration, CI/CD patterns. |
| **routeros-netinstall** | `netinstall-cli` for automated RouterOS device flashing — etherboot, BOOTP/TFTP, modescript. |
| **routeros-mndp** | MNDP (MikroTik Neighbor Discovery Protocol) — wire format, `/ip/neighbor`, WinBox discovery. |
| **routeros-sniffer** | RouterOS packet capture and TZSP streaming — `/tool/sniffer`, firewall sniff-tzsp, Wireshark integration. |
| **routeros-crossref** | Cross-project knowledge map — which tikoci project owns which RouterOS domain, critical cross-cutting gotchas. |

## Install

Clone this repo and symlink the skill folders into `~/.copilot/skills/` (and/or `~/.claude/skills/`):

```sh
git clone https://github.com/tikoci/routeros-skills.git ~/GitHub/routeros-skills

# Symlink all routeros-* skills at once (Copilot)
for skill in ~/GitHub/routeros-skills/routeros-*/; do
  ln -s "$skill" ~/.copilot/skills/"$(basename $skill)"
done

# Same for Claude
for skill in ~/GitHub/routeros-skills/routeros-*/; do
  ln -s "$skill" ~/.claude/skills/"$(basename $skill)"
done
```

Each skill is a folder containing a `SKILL.md` file and optionally a `references/` subfolder. VS Code Copilot and Claude Code automatically discover skills in their respective `~/.*/skills/` directories.

> **Tip:** Start with **routeros-fundamentals** — it covers the core concepts that other skills reference.

## Repository layout

This repo is the **single source of truth** for all `routeros-*` skills. Locally, `~/.copilot/skills/routeros-*` and `~/.claude/skills/routeros-*` are symlinks into this repo — editing either location is the same as editing here.

Non-`routeros-*` skills (e.g. `tikoci-*`, `screenshot`, `sql-as-rag`) are personal/project-scoped and live only in the local `~/.*/skills/` directories, **not** in this repo. See [SETUP.md](SETUP.md) for the full local setup guide.

## Scope

These skills cover **RouterOS 7.x** (long-term and newer releases). RouterOS v6 is not covered and accuracy for v6 questions will be low.

## Contributing

1. Fork this repository
2. Edit or add skills (each skill is a `<name>/SKILL.md` folder)
3. Open a pull request

Feedback, corrections, and new skill ideas are welcome via [issues](https://github.com/tikoci/routeros-skills/issues).

## License

[MIT](LICENSE)
