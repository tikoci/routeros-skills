---
name: routeros-quickchr-cli
description: "Stand up a real MikroTik CHR router from the shell with quickchr CLI and drive it with centrs — add/start/stop/remove lifecycle, --bg detach truth, socket listen/connect start order, mcast hazards. Use when: booting a disposable CHR to answer a question or check a claim; grounding generated RouterOS config against live RouterOS; running commands/REST against a CHR from shell scripts. For TypeScript harnesses importing QuickCHR, use routeros-quickchr instead."
---

# CHR from the shell: quickchr CLI + centrs

quickchr ([`@tikoci/quickchr`](https://github.com/tikoci/quickchr), CLI + Bun/TS
library) downloads a MikroTik CHR image, boots it under QEMU, and hands you a
router. This skill is the **shell-first** path: you have a terminal, you want a
router to interrogate, and the answer will be quoted as shell + RouterOS
commands (e.g. in a `forum.mikrotik.com` reply). If you are writing a
`bun:test` harness that imports `QuickCHR`, use the
**routeros-quickchr** skill instead — one scheme per task, never both.[^split]

## Lifecycle: `add` is not `start`

```sh
quickchr add --name lab-a --version 7.24.4 --arch x86 --add-network user
quickchr start lab-a --bg
quickchr exec lab-a "/system/resource/print"
quickchr stop lab-a
quickchr remove lab-a
```

- `add` only writes config (instant on a warm cache) and prints
  `quickchr start <name>` as its tip. It never boots.[^ground-add]
- `start --bg` blocks until the guest is REST-ready, then prints the
  REST/SSH/WinBox endpoints (≈22s first boot warm-cache HVF; ≈11s
  restart; TCG labs report 40–80s). Size harness timeouts from that,
  not from zero.[^ground-timings]
- `exec <name> <command…>` runs one RouterOS command over REST
  (`--via auto|rest|ssh|console|qga`). `stop` is instant; `remove`
  deletes the machine. `list` shows state.[^ground-exec]
- Timings above are warm-cache. Cold (first download of an image)
  adds the download; pre-warm with the `cache` subcommand
  (`list | prune | clear`).[^cache]

## `--bg` does not detach — the nohup pattern

`--bg` only redirects QEMU's serial console. The CLI still waits for
REST-ready, and on POSIX QEMU shares the caller's process group, so a
harness timeout that kills the group can take the VM with it
(tikoci/quickchr#159 — open). Until that lands, detach explicitly and
poll readiness independently:[^bg]

```sh
nohup quickchr start lab-a --bg >lab-a.start.log 2>&1 &
centrs retrieve --quickchr lab-a /system/resource   # poll until it answers
```

Observed failure mode behind this advice: a start killed 8s in printed
nothing, yet QEMU kept running orphaned and finished booting on its
own — the parent's death neither stops the boot nor reports readiness.
So never infer "start failed" from a killed CLI; check `quickchr list`
and poll REST.[^ground-bg]

## NIC order and the two-VM link

- Put `user` **first**: `--add-network user --add-network
  'socket:listen:5231'`. RouterOS auto-DHCPs only ether1
  (observed: dynamic `10.0.2.15/24` on ether1), and the host
  port-forwards assume it.[^ground-nic]
- With a `socket:listen:<port>` / `socket:connect:<port>` pair, start
  the **listener first**, then the connector. Verified end to end:
  listener→connector start, static `/24`s on ether2 via `centrs
  execute --quickchr <name> --yes …`, ping 3/3 one way and 2/2 back
  after a connector stop/start (roles persist).[^ground-l2]
- A third machine on a two-machine link is refused with a pointer to
  `--mode mcast` — that refusal *is* the configuration check working.

## Which transport: default `dgram`, opt-in `mcast`

`quickchr networks sockets create <name>` prints its transport —
believe the output, not the name. `socket::<name>` links resolve to a
stored entry whose default mode is `dgram` (unix datagram pair,
filesystem-confined, two machines); `--mode mcast` is UDP multicast
`230.0.0.1` (N-way) and prints a warning at create time.[^ground-sock]

Three hazards share one signature (interfaces up, addresses assigned,
100% loss, nothing logged), so pick deliberately:[^mcast]

- **No macOS delivery** — QEMU's multicast socket omits
  `SO_REUSEPORT`, which BSD/macOS require before two sockets on one
  group both receive (tikoci/quickchr#167).
- **Refused where unconnected UDP sends are blocked** —
  seccomp-filtered sandboxes and some Linux CI return `EPERM` on
  `sendto()` while the group join succeeds (tikoci/quickchr#169).
- **Not confined to your machine** — quickchr passes no `localaddr=`,
  so the group rides the host's default multicast interface; another
  host on your LAN using the same group joins your segment. Give an
  N-way link a group of its own, or stay on `dgram` for two machines.

## Driving the router: `centrs --quickchr`

Once the machine is up, reads and writes go through centrs
([`@tikoci/centrs`](https://github.com/tikoci/centrs)) targeting the
machine by name — no credential plumbing:[^ground-drive]

```sh
centrs retrieve --quickchr lab-a /system/resource
centrs execute --quickchr lab-a --yes '/ip/address/add interface=ether2 address=198.51.100.1/24'
```

Reads need no flag; **writes refuse without `--yes`**. `exec()`-style
single-command semantics apply: one RouterOS statement per call.

## Device-mode needs a cold cycle

`/system/device-mode` changes are applied by quickchr provisioning at
boot (it kills QEMU and restarts it to confirm — MANUAL.md "Order of
operations"), so a guest-side `/system/reboot` does not apply a new
device-mode: change it through `add`/`start` flags and cycle with
`quickchr stop` / `quickchr start`.[^device-mode] Provisioning flags need
RouterOS 7.20.8+; older 7.x is boot-only.

## Grounding behind this skill

- [`references/cli-grounding.md`](./references/cli-grounding.md) —
  the live runs (commands, outputs, timings, environment) and an
  explicit list of what was *not* re-verified there.
- quickchr [`MANUAL.md`](https://github.com/tikoci/quickchr/blob/main/MANUAL.md),
  [`DESIGN.md`](https://github.com/tikoci/quickchr/blob/main/DESIGN.md),
  [`docs/networking.md`](https://github.com/tikoci/quickchr/blob/main/docs/networking.md) —
  authoritative behavior reference; the skill favors stable CLI
  concepts over version-specific flags (pinned observations:
  `quickchr 0.4.7`, CHR 7.24.4 x86).
- Field lab that motivated this skill: external 3-CHR lab notes
  (muse-app, quickchr 0.4.7 + centrs 0.1.6, 2026-09-19) — detached
  starts + REST polling, `add`-doesn't-start, socket start order.

[^split]: Split rationale: tikoci/routeros-skills#21. Library consumers
    stay on **routeros-quickchr**; shell-first agents come here.
[^ground-add]: `references/cli-grounding.md` §Lifecycle timings.
[^ground-timings]: Same, plus TCG band from the field lab notes.
[^ground-exec]: Same, §Lifecycle timings.
[^cache]: `quickchr cache --help`; warm-cache behavior observed live.
[^bg]: tikoci/quickchr#159; orphan observation in
    `references/cli-grounding.md` §`--bg` blocks.
[^ground-bg]: Same section.
[^ground-nic]: `references/cli-grounding.md` §First NIC.
[^ground-l2]: `references/cli-grounding.md` §Socket pair.
    Connector-first silence is DESIGN.md's account, not re-proven here.
[^ground-sock]: `references/cli-grounding.md` §Socket create output;
    `defaultSocketMode()` in quickchr `src/lib/socket-registry.ts`.
[^mcast]: quickchr DESIGN.md "A named socket says what it is";
    tikoci/quickchr#167 (delivery) and #169 (permission).
[^ground-drive]: `references/cli-grounding.md` §Lifecycle timings and
    §Socket pair (retrieve + `execute --yes` observed).
[^device-mode]: quickchr MANUAL.md "Order of operations"
    (`_provisionInstance`); default `mode: advanced` read live;
    cold-cycle requirement confirmed by the field lab.
