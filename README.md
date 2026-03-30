# MikroTik RouterOS "SkillStore" (`SKILL.md`) for AI assistants 

Custom instruction skills for [GitHub Copilot](https://docs.github.com/en/copilot/customizing-copilot/adding-custom-instructions-for-github-copilot) and Claude Code that teach AI coding assistants about [MikroTik RouterOS](https://mikrotik.com/) v7.

## Skills

| Skill | Description |
|-------|-------------|
| **routeros-fundamentals** | RouterOS v7 domain knowledge — CLI, REST API, scripting, architecture. The foundational skill that others build on. |
| **routeros-container** | RouterOS `/container` subsystem — VETH/bridge networking, OCI images, device-mode, lifecycle management. |
| **routeros-app-yaml** | RouterOS `/app` YAML format for container applications (7.21+ builtin, 7.22+ custom YAML). |
| **routeros-command-tree** | `/console/inspect` API — command tree introspection, schema generation, CLI-to-REST mapping. |
| **routeros-qemu-chr** | MikroTik CHR (Cloud Hosted Router) with QEMU — boot, VirtIO, acceleration, CI/CD patterns. |
| **routeros-netinstall** | `netinstall-cli` for automated RouterOS device flashing — etherboot, BOOTP/TFTP, modescript. |

## Install

Copy or symlink the skill folders you want into your `~/.copilot/skills/` directory:

```sh
git clone https://github.com/tikoci/routeros-skills.git
cp -r routeros-skills/routeros-fundamentals ~/.copilot/skills/
# or symlink to track updates:
ln -s "$(pwd)/routeros-skills/routeros-fundamentals" ~/.copilot/skills/
```

Each skill is a folder containing a `SKILL.md` file (and optionally a `references/` subfolder with supporting documentation). VS Code Copilot automatically discovers skills in `~/.copilot/skills/`.

> **Tip:** Start with **routeros-fundamentals** — it covers the core concepts that other skills reference.

## Scope

These skills cover **RouterOS 7.x** (long-term and newer releases). RouterOS v6 is not covered and accuracy for v6 questions will be low.

## Contributing

1. Fork this repository
2. Edit or add skills (each skill is a `<name>/SKILL.md` folder)
3. Open a pull request

Feedback, corrections, and new skill ideas are welcome via [issues](https://github.com/tikoci/routeros-skills/issues).

## License

[MIT](LICENSE)
