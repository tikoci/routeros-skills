---
name: routeros-quickchr-cli
description: "Answer a RouterOS question by asking RouterOS. quickchr boots a real, disposable MikroTik CHR router on the local machine under QEMU — no hardware, no cloud, gone when you remove it — and centrs drives it. Covers the shell path end to end: the add/start/stop/shutdown/remove lifecycle, getting the shell back (--no-wait; --bg does not), getting REST endpoints and credentials out of a machine, L2 links between two VMs, provisioning (device-mode) that applies at first boot and the set route after it, and RouterOS 6 as a boot-only target. Pinned to quickchr 0.5.2. Use when: checking a claim or config against real RouterOS instead of guessing; needing a throwaway router for REST/CLI/API iteration; giving a shell script or CI job a router to talk to. For TypeScript harnesses that import the QuickCHR class, use routeros-quickchr instead."
---

# CHR from the shell: quickchr CLI + centrs

quickchr ([`@tikoci/quickchr`](https://github.com/tikoci/quickchr), CLI + Bun/TS
library) downloads a MikroTik CHR image, boots it under QEMU, and hands you a
router. This skill is the **shell-first** path: you have a terminal, you want a
router to interrogate, and the answer will be quoted as shell + RouterOS
commands (e.g. in a `forum.mikrotik.com` reply). If you are writing a
`bun:test` harness that imports `QuickCHR`, use the
**routeros-quickchr** skill instead — one scheme per task, never both.[^split]

Behavior below is pinned to **0.5.2**. Install with
`bun install -g @tikoci/quickchr@0.5.2`, or invoke
`bunx @tikoci/quickchr@0.5.2 <command>`. Check yours with
`quickchr --version`. Where 0.4.8 and earlier differ in a way that can
hurt you, the text says so inline; the rest of the version history
lives in the footnotes.[^pin]

One limit to keep in view: a CHR booted this way runs the **free**
license (`quickchr get <name>` shows `Level: free`), which MikroTik caps
at **1 Mbps upload per interface** — every other RouterOS feature is
unrestricted. Config, API and CLI grounding are unaffected; a throughput
or queue number measured here is the license talking, not the
feature.[^license]

## Host prerequisites and storage

Use Bun **1.4.4**, the tested runtime shipped in 0.5.2. Run
`quickchr doctor` for missing dependencies and install hints. The old
`start --install-deps` flag now errors; it never installed dependencies.
The CLI defaults to **qcow2**, requiring `qemu-img`; the library defaults
to **raw** unless `bootSize` implies qcow2. Extra disks also need
`qemu-img`.[^release052]

Storage admission checks the bytes the operation will write plus a
**2 GiB reserve** on each filesystem it uses, accounting for concurrent
operations. The old 10 GiB floor is gone. `QUICKCHR_STORAGE_RESERVE`
(or `storage-reserve`) adjusts the reserve; cache eviction precedes an
`INSUFFICIENT_DISK_SPACE` refusal. Cache limits now include packages and
partial downloads, so the first prune after upgrading can evict more
than before.[^release052]

## Lifecycle: `add` is not `start`

```sh
quickchr add --name lab-a --version 7.24.4 --arch x86 --add-network user
quickchr start lab-a
quickchr exec lab-a "/system/resource/print"
quickchr stop lab-a
quickchr remove lab-a
```

- `add` only writes config (0s on a warm cache) and prints
  `quickchr start <name>` as its tip. **It never boots** — the single most
  common wrong assumption about this CLI.[^ground-add]
- `start` blocks until the guest is REST-ready, then prints the
  REST/SSH/WinBox endpoints (≈22–25s first boot, ≈11–20s restart,
  warm-cache HVF). `--no-wait` returns as soon as QEMU is
  running (next section). Under TCG software emulation expect minutes, not seconds — a
  sandboxed field lab saw ~4 min boots and a real `BOOT_TIMEOUT` at
  480s. Size harness timeouts from the slow end.[^ground-timings]
- **`start` on a name that does not exist creates it** — the
  one-command flow. A typo'd name therefore boots a factory machine on
  fresh ports instead of erroring, which after a failed start can look
  like your machine came back wrong. Check `quickchr list` before
  retrying a name. Since 0.5.1 the status says "created and started"
  ("created — not waiting for RouterOS" with `--no-wait`); resuming
  an existing machine says "started".[^release052]
- `exec <name> <command…>` runs one RouterOS command over REST.
  `--via` is `auto|rest|qga` here, and **`qga` is narrower than it
  looks**: RouterOS only starts its guest agent for an **x86** CHR
  under **Linux KVM**. Under macOS HVF or TCG the port is presented but
  the guest never opens it, and ARM64 CHR has no QGA at all — both time
  out. Stay on REST unless you are on Linux/KVM with an x86 guest. (The
  library's `ExecTransport` type also lists `ssh` and `console`; those
  are not CLI surface.) `remove` deletes the machine. `list` shows
  state and PIDs.[^ground-exec]
- **`stop` is a power cut**: SIGTERM to QEMU, then SIGKILL after 5s. It
  does not ask RouterOS to shut down, so unsaved guest state can be
  lost. That is fine for a disposable lab. For a graceful exit on
  RouterOS 7, `quickchr shutdown <name> [--timeout <s>]` sends
  `/system/shutdown` over REST, waits up to 10s by default
  (`QUICKCHR_SHUTDOWN_TIMEOUT`) for QEMU to exit, and falls back to a
  power cut it reports as "forced". On RouterOS 6 the REST request
  fails at once, so `shutdown` sits out the whole timeout and then
  cuts power ("forced", exit 0) — use `stop` there.
  Disks and credentials survive either way.[^shutdown]
- **`start --all`** starts every stopped machine in the background. It
  accepts only `--no-wait`, `--bg`/`--background`, `--accel`,
  `--timeout-extra` and `--[no-]secure-login`; any other option fails
  with `INVALID_ARGUMENT` rather than being silently dropped (0.5.0+).
  Start a machine by name to pass anything else.[^start-all]
- **Version selection**: `--version 7.24.4` pins; `--channel
  stable|long-term|testing|development` resolves the newest of a
  channel. Bare `quickchr --version` prints what each channel currently
  resolves to.[^ground-channel]
- **Ports are auto-allocated** from 9100 in per-machine blocks of ten
  (9140, 9150, 9160 …), so machines created one after another do not
  collide and you need no port bookkeeping. `--port-base` overrides;
  `--forward name:host:guest/proto` adds extras, ranges
  included.[^ground-ports]
- **Creating several at once** (`quickchr start a & quickchr start b &`)
  is safe: concurrent creations get distinct port blocks, an
  overlapping `--port-base` is refused with `PORT_CONFLICT`, and
  `stop`/`remove` wait for a `start` of the same machine in progress.
  A foreground `start` holds the machine until its VM exits, so they
  fail with `MACHINE_LOCKED` instead of waiting. (Before 0.5.0 both
  could pick the same block and one failed with `SPAWN_FAILED` —
  start them one at a time there.)[^ground-concurrent]
- **Pre-warm without booting**: `quickchr cache add --version 7.24.4
  --arch x86` resolves and downloads one image, no QEMU and no machine
  required. `cache key` prints `dir=/version=/arch=` for CI.[^ground-cache]
- **Never hand-edit `machine.json`** to change networks or options — it
  breaks boot. Everything is reachable through `add` flags.[^field]
- **Keep `QUICKCHR_DATA_DIR` short on macOS.** QEMU's monitor socket
  lives under it, and a socket path of 104 bytes or more makes `start`
  fail with `SPAWN_FAILED` ("UNIX socket path … is too long").[^socket-path]

## Getting the shell back: `--no-wait`, not `--bg`

**`--bg` never returned early.** Background is already the default. The
flag only failed to select the foreground mode you did not ask for, and
`start` waited for REST-readiness either way. It is now deprecated:
it does nothing, and prints a warning on stderr. (On 0.4.8 it was
silently harmless.) Leave it out of scripts. `--fg`/`--foreground` is
the switch that does something.[^bg]

**`--no-wait`.** `start` returns once QEMU is running (about
2s), with state and ports already saved, and readiness is yours. centrs
0.1.8+ waits for it with a bound:

```sh
quickchr start lab-a --no-wait
centrs retrieve --quickchr lab-a /system/resource --wait 5m
```

It is refused (`INVALID_ARGUMENT`, nothing booted) when combined with
`--fg`, or with any provisioning flag. That includes provisioning that
`add` recorded and the first start has not applied yet. Provisioning
runs against the booted guest, so that first `start` has to wait. Later
starts can use `--no-wait`.[^nowait]

On 0.4.8 there is no `--no-wait`: background `start` yourself
(`nohup quickchr start lab-a >lab-a.start.log 2>&1 &`) and poll
readiness with a bound, as in the next paragraph.

**Bound the wait.** `start` can fail outright — `MISSING_QEMU`,
`SPAWN_FAILED`, `BOOT_TIMEOUT` — and an unbounded `until` loop then
polls forever, which in CI is a hung job with no diagnostic. Size the
bound off the slow end (TCG minutes, not HVF seconds) and on timeout
print `quickchr list` plus the start log rather than just
exiting.[^ground-poll]

**A killed `start` does not stop the VM.** QEMU is spawned
`detached` (its own session), so even a harness that SIGKILLs the whole
process group leaves the guest booting — it comes up REST-ready with
nothing left to report it. Verified against both published releases:
group-SIGKILL 8s into a first boot took the VM down on **0.4.7**, and
left it running and REST-ready on **0.4.8** and later. So never infer "start
failed" from a killed CLI — check `quickchr list` and poll REST, and
`stop`/`remove` to clean up. If you are pinned below 0.4.8, that kill
*does* take the VM with it — upgrade rather than work around it.[^ground-bg]

**A `BOOT_TIMEOUT` cleans up after itself.** quickchr stops QEMU
first, then:[^boot-timeout]

- created by this `start` — removed;
- created by `add`, never booted — reset to the factory disk,
  `add`'s options kept;
- booted before (a restart) — preserved: retry with `start`.

On 0.4.8 and earlier the restart case was **removed** too, unless
`QUICKCHR_PRESERVE_ON_FAILURE=1` was set first — a slow boot deleted a
machine you had configured by hand. On 0.5.0 the flag still keeps the
first two cases for inspection.

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

Prefer it over `quickchr exec`: quickchr itself says so, in
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
container=yes` over REST or API does not complete — RouterOS is waiting
for a power cycle it cannot perform on itself — and the feature stays
`false`. Observed live: the call did not return within the 10s client
timeout and `container` was unchanged afterwards. (Whether it would
*ever* return is not established; a field lab reported waiting ~5 min.)
Do not reach for this, and do not read the timeout as a transport
problem.[^dm-trap]

**Provisioning flags apply at a machine's first boot.** quickchr
applies device-mode by provisioning: boot the guest, set the mode,
power-cycle QEMU via the monitor, re-read to confirm (≈45s vs ≈22s
without). That runs on the first boot, so pass it to `add`, or to the
first `start` of a machine `add` created plain. After that boot:[^dm-window]

| `start --device-mode-enable container` on… | 0.5.2 |
|---|---|
| a machine that never started | applies — "Device-mode verified: mode=rose container=yes" |
| a machine that has booted | refused, `PROVISIONING_WINDOW_CLOSED`, with the `quickchr set …` command to run |
| a machine that already has it | "already applied — nothing to do", and it starts |

(On 0.4.8 an already-booted machine silently ignored the request:
`container=false` stayed false; an already-enabled container stayed enabled.)

**Changing it later.** `quickchr set <name> --device-mode-enable
container` works on a running machine. It prints each setting that will
move, power-cycles once, verifies, and records the change. Read it back
with `quickchr get <name> device-mode`. Observed: 21s, then `container`
listed under Enabled.[^dm-set]

Before 0.5.0 the CLI had no post-boot route: `remove`, then
`add --device-mode-enable …`, then `start` was the only CLI path. The
library's `instance.setDeviceMode()` power-cycles for you on both
versions (see **routeros-quickchr**).

The other provisioning flags also refuse after first boot
(`--add-package`, `--add-user`, `--disable-admin`, `--secure-login`,
`--license-*`, `--install-all-packages`). The refusal names the route
that still works. For anything without one, `quickchr clean <name>`
resets the disk and reopens the window, at first-boot cost. Then repeat
the original command, because a refused request is not saved.[^window]

The refusal tells you which side of the line a machine is on — no
detective work needed before relying on a flag:

```sh
quickchr get <name>    # live Device Mode / License / Admin Users
```

Enabling `container` moves the mode itself too (`advanced` → `rose`).
Provisioning needs RouterOS **7.20.8+** *and* a user-mode NIC — with
only socket NICs it fails `NETWORK_UNAVAILABLE`; older 7.x is
boot-only.[^device-mode]

## RouterOS 6: boot-only

quickchr boots RouterOS 6 CHR for v6→v7 migration work (0.5.0+). It is
best-effort, CLI-only, and x86 only. quickchr runs no REST and no
provisioning against it:[^v6]

```sh
quickchr add --name lab6 --version 6.49.23 --arch x86
quickchr start lab6    # ready on a native-API login, ~27s on HVF
centrs retrieve --quickchr lab6 /system/resource --via native-api --no-validate
```

- `--arch arm64` is refused with `INVALID_ARCH`, because MikroTik
  publishes no arm64 CHR for 6.x.
- Every provisioning flag, and the `set` routes, fail with
  `PROVISIONING_VERSION_UNSUPPORTED`.
- `quickchr exec`, `get`'s live groups and REST calls fail at once with
  `REST_UNAVAILABLE` and do not time out. Use the native API, as above.
  `--no-validate` is needed because centrs validates against the 7.x
  command tree.
- `list`, `inspect`, `stop`, `remove` and `start --no-wait` work as on
  7.x. `shutdown` cannot ask a 6.x guest to halt: it waits out its
  timeout and reports a forced power cut, so `stop` is the faster
  equivalent.

On 0.4.8 and earlier, a 6.x `start` waits for a REST API that 6.x does
not have, and times out. Use 7.x there, or upgrade.

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
[^release052]: quickchr [0.5.2 CHANGELOG](https://github.com/tikoci/quickchr/blob/v0.5.2/CHANGELOG.md)
    `[0.5.1]` and `[0.5.2]`;
    [package review](./references/cli-grounding.md#quickchr-052-package-review).
[^pin]: The 0.5.2 changes were checked against the published package
    ([package review](./references/cli-grounding.md#quickchr-052-package-review)).
    Pinned observations: the 0.5.0 claims were re-run against
    published `@tikoci/quickchr@0.5.0` and `@tikoci/centrs@0.1.8`,
    CHR 7.24.5 and 6.49.23 x86
    (`references/cli-grounding.md` §quickchr 0.5.0 re-check), and
    checked against quickchr's
    [`CHANGELOG.md`](https://github.com/tikoci/quickchr/blob/main/CHANGELOG.md)
    `[0.5.0]` section. Underneath that pass sits the 0.4.8 one (CHR
    7.24.4 x86, QEMU 11.1.1 + HVF on macOS Intel, 0.4.7 as a control):
    the named-socket `dgram` default, the printed transport, the
    three-machine refusal and the POSIX detach all shipped in 0.4.8
    (quickchr #158, #159) and are absent from 0.4.7.
[^ground-add]: `references/cli-grounding.md` §Lifecycle timings.
[^ground-timings]: Same (0.4.8: 22s / 11s); §quickchr 0.5.0 re-check
    (0.5.0: 25s / 20s, CHR 7.24.5). TCG band and the 480s
    `BOOT_TIMEOUT` from the field lab notes.
[^ground-exec]: Same, §Lifecycle timings.
[^ground-cache]: `references/cli-grounding.md` §Cache; quickchr
    CHANGELOG 0.4.8 "Added" (`cache add`, `cache key`).
[^field]: Field lab notes: `--add-network` at `add` time, never a
    hand-edited `machine.json`.
[^bg]: 0.4.8: `src/cli/index.ts` — "Background default:
    true. Explicitly foreground only with --fg / --foreground /
    --no-background / --no-bg", and `quickchr start --help` renders
    `--bg / --background   Run in background (default)`. 0.5.0:
    CHANGELOG `[0.5.0]` Breaking, "`start --bg` / `--background` are
    deprecated and do nothing" (tikoci/quickchr#159). The warning text
    is quoted in `references/cli-grounding.md` §quickchr 0.5.0
    re-check.
[^ground-bg]: `references/cli-grounding.md` §Group-kill, which records
    the 0.4.7-vs-0.4.8 before/after. Unchanged in 0.5.0: MANUAL.md
    `start` — "QEMU runs detached in its own session either way".
[^nowait]: quickchr MANUAL.md `start` (`--no-wait` row and the centrs
    0.1.8+ example); CHANGELOG `[0.5.0]` Added (#159). All three
    refusals reproduced in `references/cli-grounding.md` §quickchr
    0.5.0 re-check.
[^shutdown]: quickchr MANUAL.md `stop` ("Power cut: sends SIGTERM to
    QEMU, waits up to 5 seconds, then SIGKILL") and `shutdown`;
    CHANGELOG `[0.5.0]` Added and Fixed (#143). The "guest exited" and
    "already stopped" outcomes were observed on 7.x. The forced
    fallback was observed on RouterOS 6.49.23 with 0.5.2
    (`references/cli-grounding.md` §quickchr 0.5.2 package review); it was not
    forced on 7.x.
[^start-all]: quickchr MANUAL.md `start` (`--all` row); CHANGELOG
    `[0.5.0]`; the `batchFlags` check in `cmdStart()`,
    `src/cli/index.ts` at `v0.5.2`. The refusal was reproduced in
    `references/cli-grounding.md` §quickchr 0.5.2 package review.
[^socket-path]: Observed on macOS while setting up the 0.5.0 re-check
    (`references/cli-grounding.md`); QEMU reports "Path must be less
    than 104 bytes".
[^boot-timeout]: 0.5.0: quickchr MANUAL.md §"Auto-cleanup on boot
    timeout"; CHANGELOG `[0.5.0]` Breaking (#182) and Fixed (#189).
    0.4.8: `cleanupAfterBootFailure()` in `src/lib/quickchr.ts` at tag
    `v0.4.8` calls `stop()`, then `remove()` unless
    `QUICKCHR_PRESERVE_ON_FAILURE=1`. Not forced live in either
    version.
[^dm-set]: quickchr MANUAL.md `set`; reproduced in
    `references/cli-grounding.md` §quickchr 0.5.0 re-check.
[^window]: quickchr MANUAL.md §5 "Provisioning pipeline" (the window,
    the routes table, and `clean()` retaining intent); CHANGELOG
    `[0.5.0]` Fixed (#176). `clean` was not run in the re-check.
[^v6]: quickchr MANUAL.md §"RouterOS 6 (boot-only)"; CHANGELOG
    `[0.5.0]` Added (#182), which also gives the 0.4.8 behavior ("ready
    in ~25 s under HVF instead of timing out against a REST API it does
    not have"). The arm64 refusal, the provisioning
    refusal, the 27s boot, `REST_UNAVAILABLE` and the native-API read
    are in `references/cli-grounding.md` §quickchr 0.5.0 re-check.
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
[^dm-window]: 0.4.8: `references/cli-grounding.md` §Device-mode —
    the never-started machine applied and verified the change, the
    already-booted one silently did not. The gate was
    `!existing.lastStartedAt` in `QuickCHR.start()`
    (`src/lib/quickchr.ts`). 0.5.0: tikoci/quickchr#176 shipped. The
    gate is the new `MachineState.provisioning` record, and the refusal
    and the "already applied" path are in §quickchr 0.5.0 re-check.
[^ground-inspect]: `references/cli-grounding.md` §Endpoints and
    credentials (`quickchr inspect --json`, `quickchr get`).
[^ground-poll]: Failure codes from quickchr's `ErrorCode` union
    (`src/lib/types.ts`); the bound-and-diagnose shape is this skill's
    recommendation, verified as a script in
    `references/cli-grounding.md` §Bounded readiness poll.
[^ground-channel]: `quickchr add --help` (`--version`, `--channel`);
    `quickchr --version` prints the resolved stable/long-term versions.
[^ground-concurrent]: [tikoci/quickchr#140](https://github.com/tikoci/quickchr/issues/140)
    (two concurrent starts on 0.4.7 both chose 9140; the second QEMU failed
    its `hostfwd` bind) and the fix,
    [tikoci/quickchr#190](https://github.com/tikoci/quickchr/pull/190),
    released in 0.5.0 (CHANGELOG `[0.5.0]` Fixed, #140 and #181) and
    covered by quickchr's concurrency unit tests and a live two-CHR start.
    See the **routeros-quickchr** skill, "Running several CHRs at once".
[^ground-ports]: `quickchr add --help` — "`--port-base <port>` Starting
    port number (default: auto-allocated from 9100)"; successive
    machines observed at 9140/9150/9160 in
    `references/cli-grounding.md`.
[^license]: MikroTik, [CHR: Licensing → CHR License
    Levels](https://manual.mikrotik.com/docs/getting-started/routeros-licensing/chr/chr-licensing#chr-license-levels):
    *"The Free license level allows CHR to run indefinitely with a 1 Mbps
    upload limit per interface. All other RouterOS features are available
    without restrictions."* Paid tiers raise the cap (P1 1 Gbit, P10
    10 Gbit, P-Unlimited), and a 60-day trial of a paid tier is free with
    a MikroTik account. This is MikroTik licensing, not a quickchr
    behavior; `quickchr get <name>` reports `License Level: free` on a
    default machine.
[^device-mode]: quickchr MANUAL.md "Order of operations"
    (`_provisionInstance`); `--device-mode-enable` in
    `src/cli/flags.ts` (accepted by both `add` and `start`, though the
    condensed `add --help` lists only `--device-mode <m>`); the
    user-mode-NIC requirement is the `NETWORK_UNAVAILABLE` guard in
    `QuickCHR.start()`.
