---
name: routeros-quickchr-cli
description: "Answer a RouterOS question by asking RouterOS. quickchr boots a real, disposable MikroTik CHR router on the local machine under QEMU — no hardware, no cloud, gone when you remove it — and centrs drives it. Covers the shell path end to end: the add/start/stop/remove lifecycle and what --bg actually does, getting REST endpoints and credentials out of a machine, L2 links between two VMs, and the provisioning steps (device-mode) that only work before a machine's first boot. Use when: checking a claim or config against real RouterOS instead of guessing; needing a throwaway router for REST/CLI/API iteration; giving a shell script or CI job a router to talk to. For TypeScript harnesses that import the QuickCHR class, use routeros-quickchr instead."
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

One limit to keep in view: a CHR booted this way runs the **free**
license (`quickchr get <name>` shows `Level: free`), which MikroTik
rate-limits to **1 Mbps per interface**. Config, API and CLI grounding
are unaffected; throughput or queue numbers measured here are the
license talking, not the feature.[^license]

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
- `exec <name> <command…>` runs one RouterOS command over REST.
  `--via` is `auto|rest|qga` here, and **`qga` is narrower than it
  looks**: RouterOS only starts its guest agent for an **x86** CHR
  under **Linux KVM**. Under macOS HVF or TCG the port is presented but
  the guest never opens it, and ARM64 CHR has no QGA at all — both time
  out. Stay on REST unless you are on Linux/KVM with an x86 guest. (The
  library's `ExecTransport` type also lists `ssh` and `console`; those
  are not CLI surface.) `stop` is instant; `remove` deletes the
  machine. `list` shows state and PIDs.[^ground-exec]
- **Version selection**: `--version 7.24.4` pins; `--channel
  stable|long-term|testing|development` resolves the newest of a
  channel. Bare `quickchr --version` prints what each channel currently
  resolves to.[^ground-channel]
- **Ports are auto-allocated** from 9100 in per-machine blocks of ten
  (9140, 9150, 9160 …), so parallel machines do not collide and you
  need no port bookkeeping. `--port-base` overrides;
  `--forward name:host:guest/proto` adds extras, ranges
  included.[^ground-ports]
- **Pre-warm without booting**: `quickchr cache add --version 7.24.4
  --arch x86` resolves and downloads one image, no QEMU and no machine
  required. `cache key` prints `dir=/version=/arch=` for CI. (Both new
  in 0.4.8 — before it, `cache` was `list|prune|clear` only and the
  only way to warm the cache was to boot something.)[^ground-cache]
- **Never hand-edit `machine.json`** to change networks or options — it
  breaks boot. Everything is reachable through `add` flags.[^field]

## `--bg` is a no-op — background it yourself

**`--bg` changes nothing: background is already the default.** The CLI
sets `background = !wantFg`, so the flag only fails to select the
foreground mode you did not ask for; `--fg`/`--foreground` is the
switch that does something. And `start` waits for REST-readiness by
contract either way, so `--bg` does not hand your shell back. Both
halves of what the name promises are things it does not do
(tikoci/quickchr#159 — the `--no-wait` half and the naming decision are
still open).[^bg]

Examples here pass `--bg` only because it is harmless and widespread in
existing scripts. To actually get the shell back, background it
yourself and poll readiness:

```sh
nohup quickchr start lab-a --bg >lab-a.start.log 2>&1 &

ready() { centrs retrieve --quickchr lab-a /system/resource >/dev/null 2>&1; }
for _ in $(seq 60); do ready && break; sleep 5; done   # 60 x 5s = 5 min
ready || { quickchr list; tail -20 lab-a.start.log; exit 1; }
```

**Bound the wait.** `start` can fail outright — `MISSING_QEMU`,
`SPAWN_FAILED`, `BOOT_TIMEOUT` — and an unbounded `until` loop then
polls forever, which in CI is a hung job with no diagnostic. Size the
bound off the slow end (TCG minutes, not HVF seconds) and on timeout
print `quickchr list` plus the start log rather than just
exiting.[^ground-poll]

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

quickchr prints all three hazards below as a warning when you create an
`mcast` link. **Two of them fail silently** — same signature each time:
interfaces up, addresses assigned, 100% loss, nothing logged:[^mcast]

- **No macOS delivery** — QEMU's multicast socket omits
  `SO_REUSEPORT`, which BSD/macOS require before two sockets on one
  group both receive (tikoci/quickchr#167).
- **Refused where unconnected UDP sends are blocked** —
  seccomp-filtered sandboxes and some Linux CI return `EPERM` on
  `sendto()` while the group join succeeds (tikoci/quickchr#169).

The third is the opposite failure — traffic flows where it should not:

- **Not confined to your machine** — quickchr passes no `localaddr=`,
  so the group rides the host's default multicast interface. Another
  host on your LAN using the same group **joins your segment**, and the
  link keeps working, so nothing looks wrong. That is an isolation
  failure, not a loss one. Give an N-way link a group of its own, or
  stay on `dgram` for two machines.

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

Need the raw endpoint instead — curl, or some other tool?
`quickchr inspect <name> --json` carries the resolved URL **and
ready-to-use credentials**. CHR here is `admin` with an *empty*
password, and inspect hands you the Basic header already encoded:

```json
"rest-api": { "url": "http://127.0.0.1:9150/rest", "port": 9150,
              "auth": { "username": "admin", "password": "", "basic": "admin:" } }
```

(`auth` also carries a pre-encoded `header` if you would rather not
build the Basic value yourself.) Straight to curl:

```sh
url=$(quickchr inspect lab-a --json | jq -r '.services["rest-api"].url')
curl -s -u admin: "$url/system/resource" | jq .
```

That is the same door centrs uses — `--quickchr` resolves through
`quickchr inspect`, never by reading `machine.json` — which is why it
needs no credential configuration from you.[^ground-inspect]

## Device-mode: the window closes at first boot

Two traps, and agents hit them in this order.

**The guest-side route does not work.** `/system/device-mode/update
container=yes` over REST or API never returns — RouterOS is waiting for
a power cycle it cannot perform on itself — and the feature stays
`false`. Observed live: the call timed out, `container` unchanged. Do
not reach for this, and do not read the timeout as a transport
problem.[^dm-trap]

**The flags are honored only on a machine's first boot.** quickchr
applies device-mode by provisioning — boot the guest, set the mode,
power-cycle QEMU via the monitor, re-read to confirm (≈45s vs ≈22s
without). That runs only while the machine has never started. Once
`lastStartedAt` is set, `--device-mode-enable` is parsed, accepted and
**silently ignored**: no warning, no extra boot time, no change
(tikoci/quickchr#176 — open).[^dm-window]

| machine state | `start --device-mode-enable container` |
|---|---|
| added, never started | applies — "Device-mode verified: mode=rose container=yes" |
| started at least once | silently ignored — stays `container: false` |

So `add --device-mode-enable <feature>` when you can; if you only
realize you need it *after* creating the machine, you can still pass it
to the **first** `start`. Once it has booted, the CLI has no way to
change device-mode — `remove` + `add --device-mode-enable …` + `start`
is the only CLI path. (The library exposes
`instance.setDeviceMode()`, which power-cycles for you — see
**routeros-quickchr**.)

Which side of the line a machine is on, and what it currently has:

```sh
quickchr inspect <name> --json | jq -r '.lastStartedAt // "never started"'
quickchr get <name>    # live Device Mode / License / Admin Users
```

Enabling `container` moves the mode itself too (`advanced` → `rose`).
Provisioning needs RouterOS **7.20.8+** *and* a user-mode NIC — with
only socket NICs it fails `NETWORK_UNAVAILABLE`; older 7.x is
boot-only.[^device-mode]

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
[^bg]: `--bg` as a no-op: `src/cli/index.ts` — "Background default:
    true. Explicitly foreground only with --fg / --foreground /
    --no-background / --no-bg", and `quickchr start --help` renders
    `--bg / --background   Run in background (default)`.
    tikoci/quickchr#159 — part 1 (`--no-wait`) and the `--bg` naming
    decision remain open; part 2 (POSIX process group) shipped in
    0.4.8.
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
[^dm-trap]: `references/cli-grounding.md` §Device-mode — the guest-side
    `/system/device-mode/update container=yes` timing out with
    `container` unchanged, reproduced on 0.4.8 / CHR 7.24.4.
[^dm-window]: Same section: the never-started machine applied and
    verified the change, the already-booted one silently did not. The
    gate is `!existing.lastStartedAt` in `QuickCHR.start()`
    (`src/lib/quickchr.ts`), which passes provisioning options to
    `_launchExisting()` on a first boot and `undefined` afterwards.
    Filed as tikoci/quickchr#176, which also asks which provisioning
    steps should be allowed to run later; until it lands, treat the
    silence as the documented behavior.
[^ground-inspect]: `references/cli-grounding.md` §Endpoints and
    credentials (`quickchr inspect --json`, `quickchr get`).
[^ground-poll]: Failure codes from quickchr's `ErrorCode` union
    (`src/lib/types.ts`); the bound-and-diagnose shape is this skill's
    recommendation, verified as a script in
    `references/cli-grounding.md` §Bounded readiness poll.
[^ground-channel]: `quickchr add --help` (`--version`, `--channel`);
    `quickchr --version` prints the resolved stable/long-term versions.
[^ground-ports]: `quickchr add --help` — "`--port-base <port>` Starting
    port number (default: auto-allocated from 9100)"; successive
    machines observed at 9140/9150/9160 in
    `references/cli-grounding.md`.
[^license]: `quickchr get <name>` reports `License Level: free` on a
    default machine. The 1 Mbps free-CHR cap is MikroTik's licensing,
    not a quickchr behavior — see the **routeros-quickchr** skill's
    gotchas, where the CHR licensing tiers live.
[^device-mode]: quickchr MANUAL.md "Order of operations"
    (`_provisionInstance`); `--device-mode-enable` in
    `src/cli/flags.ts` (accepted by both `add` and `start`, though the
    condensed `add --help` lists only `--device-mode <m>`); the
    user-mode-NIC requirement is the `NETWORK_UNAVAILABLE` guard in
    `QuickCHR.start()`.
