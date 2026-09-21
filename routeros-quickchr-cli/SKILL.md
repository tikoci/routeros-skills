---
name: routeros-quickchr-cli
description: "Stand up a real MikroTik CHR router from the shell with quickchr CLI and drive it with centrs — add/start/stop/remove lifecycle, --bg detach truth, named-socket L2 links, mcast hazards. Use when: booting a disposable CHR to answer a question or check a claim; grounding generated RouterOS config against live RouterOS; running commands/REST against a CHR from shell scripts. For TypeScript harnesses importing QuickCHR, use routeros-quickchr instead."
---

# CHR from the shell: quickchr CLI + centrs

quickchr ([`@tikoci/quickchr`](https://github.com/tikoci/quickchr), CLI + Bun/TS
library) downloads a MikroTik CHR image, boots it under QEMU, and hands you a
router. This skill is the **shell-first** path: you have a terminal, you want a
router to interrogate, and the answer will be quoted as shell + RouterOS
commands (e.g. in a `forum.mikrotik.com` reply). If you are writing a
`bun:test` harness that imports `QuickCHR`, use the
**routeros-quickchr** skill instead — one scheme per task, never both.[^split]

Behavior below is pinned to **quickchr 0.4.8**. Several of these are 0.4.8
changes, called out inline; on 0.4.7 and earlier the answer differs.[^pin]

## Lifecycle: `add` is not `start`

```sh
quickchr add --name lab-a --version 7.24.4 --arch x86 --add-network user
quickchr start lab-a --bg
quickchr exec lab-a "/system/resource/print"
quickchr stop lab-a
quickchr remove lab-a
```

- `add` only writes config (0s on a warm cache) and prints
  `quickchr start <name>` as its tip. **It never boots** — the single most
  common wrong assumption about this CLI.[^ground-add]
- `start --bg` blocks until the guest is REST-ready, then prints the
  REST/SSH/WinBox endpoints (≈22s first boot, ≈11s restart, warm-cache
  HVF). Under TCG software emulation expect minutes, not seconds — a
  sandboxed field lab saw ~4 min boots and a real `BOOT_TIMEOUT` at
  480s. Size harness timeouts from the slow end.[^ground-timings]
- `exec <name> <command…>` runs one RouterOS command over REST
  (`--via auto|rest|ssh|console|qga`). `stop` is instant; `remove`
  deletes the machine. `list` shows state and PIDs.[^ground-exec]
- **Pre-warm without booting**: `quickchr cache add --version 7.24.4
  --arch x86` resolves and downloads one image, no QEMU and no machine
  required. `cache key` prints `dir=/version=/arch=` for CI. (Both new
  in 0.4.8 — before it, `cache` was `list|prune|clear` only and the
  only way to warm the cache was to boot something.)[^ground-cache]
- **Never hand-edit `machine.json`** to change networks or options — it
  breaks boot. Everything is reachable through `add` flags.[^field]

## `--bg` still blocks — background it yourself

`--bg` does *not* mean "return immediately". It only redirects QEMU's
serial console to a log file; `start` waits for REST-readiness by
contract either way. That half of tikoci/quickchr#159 is still open
(no `--no-wait`), so to get your shell back, background it and poll
readiness yourself:[^bg]

```sh
nohup quickchr start lab-a --bg >lab-a.start.log 2>&1 &
until centrs retrieve --quickchr lab-a /system/resource >/dev/null 2>&1; do sleep 5; done
```

**A killed `start` does not stop the VM.** On 0.4.8 QEMU is spawned
`detached` (its own session), so even a harness that SIGKILLs the whole
process group leaves the guest booting — it comes up REST-ready with
nothing left to report it. Verified against both published releases:
group-SIGKILL 8s into a first boot took the VM down on **0.4.7**, and
left it running and REST-ready on **0.4.8**. So never infer "start
failed" from a killed CLI — check `quickchr list` and poll REST, and
`stop`/`remove` to clean up. (A `BOOT_TIMEOUT` can likewise auto-clean
the machine while QEMU keeps running.)[^ground-bg]

If a harness group-kills commands and you are pinned below 0.4.8, that
kill *does* take the VM with it — upgrade rather than work around it.

## NIC order and the two-VM link

- Put `user` **first**: `--add-network user --add-network
  'socket::lab-link'`. RouterOS auto-DHCPs only ether1 (observed:
  dynamic `10.0.2.15/24`), and the host port-forwards assume
  it.[^ground-nic]
- For an L2 link between two VMs, prefer a **named socket**
  `socket::<name>`. It resolves through a registry entry, defaults to
  `dgram` (a unix datagram pair) off Windows, and **either machine may
  start first** — there are no listener/connector roles to get wrong.
  `start` prints the transport each link resolved to. Verified: two
  machines on one `socket::` link, started in arbitrary order, static
  `/24`s on ether2, ping 3/3 on a macOS host.[^ground-l2]
- The raw `socket:listen:<port>` / `socket:connect:<port>` pair is the
  ordering-sensitive form — a TCP pair where the **listener must start
  first**. Reach for it only when you need those explicit roles;
  `socket::<name>` exists to avoid the ordering problem.[^ground-forms]
- A third machine on a two-machine link is refused **at `start`** (not
  at `add`), naming the two holders and pointing at `--mode mcast`.
  That refusal *is* the configuration check working.[^ground-third]

## Which transport: default `dgram`, opt-in `mcast`

`quickchr networks sockets create <name>` takes `--mode
dgram|listen-connect|mcast` and **prints the transport it created** —
believe the output, not the name. Default is `dgram` (unix datagram
pair, filesystem-confined, two machines) on macOS/Linux and
`listen-connect` (TCP pair) on Windows, which has no AF_UNIX datagram
socket. `--mode mcast` is UDP multicast `230.0.0.1` — the only N-way
transport, and the only one that fails silently.[^ground-sock]

Three hazards share one signature (interfaces up, addresses assigned,
100% loss, nothing logged), and quickchr prints all three as a warning
when you create an `mcast` link:[^mcast]

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
machine by name — it resolves the endpoint through `quickchr inspect`,
so there is no credential plumbing:[^ground-drive]

```sh
centrs retrieve --quickchr lab-a /system/resource
centrs execute --quickchr lab-a --yes '/ip/address/add interface=ether2 address=198.51.100.1/24'
```

Reads need no flag; **writes refuse without `--yes`**
(`[usage/confirmation-required]`). One RouterOS statement per call.

Prefer it over `quickchr exec`: as of 0.4.8 quickchr itself says so, in
`exec --help` and in a stderr tip on a bare `quickchr exec`
(suppressible with `QUICKCHR_NO_TIPS=1`; tips never touch stdout, so
`--json` stays parseable). `quickchr exec` is **a raw `/rest/execute`
pipe with no validation** — whatever you type is what RouterOS is asked
to run, and its output is screen-scraped text where centrs returns
typed JSON.[^ground-tips]

## Device-mode needs a cold cycle

Set device-mode **at create time** — `--device-mode <m>` for the mode
itself, `--device-mode-enable <feature>` (e.g. `container`) for
individual features. quickchr's provisioning applies it by killing
QEMU and restarting it, which a guest-side change cannot do: running
`/system/device-mode/update container=yes` from inside RouterOS
**hangs** (it waits ~5 min for a power cycle that never comes) and the
feature stays `false`. Change it through `add` flags and cycle with
`quickchr stop` / `quickchr start`.[^device-mode] Provisioning flags
need RouterOS 7.20.8+; older 7.x is boot-only.

## Grounding behind this skill

- [`references/cli-grounding.md`](./references/cli-grounding.md) —
  the live runs (commands, outputs, timings, environment) and an
  explicit list of what was *not* re-verified there.
- quickchr [`MANUAL.md`](https://github.com/tikoci/quickchr/blob/main/MANUAL.md),
  [`DESIGN.md`](https://github.com/tikoci/quickchr/blob/main/DESIGN.md),
  [`docs/networking.md`](https://github.com/tikoci/quickchr/blob/main/docs/networking.md),
  [`CHANGELOG.md`](https://github.com/tikoci/quickchr/blob/main/CHANGELOG.md) —
  authoritative behavior reference; the skill favors stable CLI
  concepts over version-specific flags.
- Field lab that motivated this skill: external 3-CHR lab notes
  (muse-app, 2026-09-19/20) — `add`-doesn't-start, detached starts +
  REST polling, cold power-cycle for device-mode, cache-warming gap.

[^split]: Split rationale: tikoci/routeros-skills#21. Library consumers
    stay on **routeros-quickchr**; shell-first agents come here.
[^pin]: Pinned observations: published `@tikoci/quickchr` 0.4.8 (and
    0.4.7 as a control), CHR 7.24.4 x86, QEMU 11.1.1 + HVF on macOS
    Intel. The named-socket `dgram` default, the printed transport,
    the three-machine refusal and the POSIX detach are all 0.4.8
    (quickchr #158, #159) — they are absent from 0.4.7.
[^ground-add]: `references/cli-grounding.md` §Lifecycle timings.
[^ground-timings]: Same; TCG band and the 480s `BOOT_TIMEOUT` from the
    field lab notes.
[^ground-exec]: Same, §Lifecycle timings.
[^ground-cache]: `references/cli-grounding.md` §Cache; quickchr
    CHANGELOG 0.4.8 "Added" (`cache add`, `cache key`).
[^field]: Field lab notes: `--add-network` at `add` time, never a
    hand-edited `machine.json`.
[^bg]: tikoci/quickchr#159 — part 1 (`--no-wait`) and the `--bg`
    naming decision remain open; part 2 (POSIX process group) shipped
    in 0.4.8.
[^ground-bg]: `references/cli-grounding.md` §Group-kill, which records
    the 0.4.7-vs-0.4.8 before/after.
[^ground-nic]: `references/cli-grounding.md` §First NIC.
[^ground-l2]: `references/cli-grounding.md` §Named-socket link.
[^ground-forms]: `parseSocketSpecifier()` in quickchr
    `src/lib/network.ts` accepts `socket::<name>`,
    `socket:listen:<port>`, `socket:connect:<port>`,
    `socket:mcast:<group>:<port>`; `docs/networking.md` — "Named
    sockets avoid the listen/connect ordering problem".
[^ground-third]: `references/cli-grounding.md` §Third machine refused.
[^ground-sock]: `references/cli-grounding.md` §Socket create output;
    `defaultSocketMode()` in quickchr `src/lib/socket-registry.ts`.
[^mcast]: quickchr DESIGN.md "A named socket says what it is";
    tikoci/quickchr#167 (delivery) and #169 (permission); warning text
    quoted in `references/cli-grounding.md`.
[^ground-drive]: `references/cli-grounding.md` §Driving with centrs
    (`retrieve`, `execute --yes`, and the refusal without `--yes`).
[^ground-tips]: `quickchr exec --help` and bare `quickchr exec` on
    0.4.8, quoted in `references/cli-grounding.md` §Driving with
    centrs; CHANGELOG 0.4.8 "Added" (tips).
[^device-mode]: quickchr MANUAL.md "Order of operations"
    (`_provisionInstance`); `--device-mode-enable` in
    `src/cli/flags.ts`; default `mode: advanced` read live. The
    guest-side hang and the `--device-mode-enable container` fix are
    the field lab's, not re-run here.
