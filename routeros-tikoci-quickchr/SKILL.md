---
name: routeros-tikoci-quickchr
description: "Ground RouterOS config/scripts/API code against a REAL router using quickchr (@tikoci/quickchr) — a CLI + Bun/TS library that downloads, boots, and manages MikroTik CHR VMs on QEMU. Use when: validating generated RouterOS config or scripts against real RouterOS before trusting them; spinning up a disposable CHR for REST/CLI/API iteration; writing integration/lab tests against CHR; needing host↔guest networking for a CHR (port-forward, L2/MNDP capture, guest→host UDP); driving an external RouterOS tool against a live CHR. For raw QEMU/CHR boot mechanics (VirtIO, UEFI vs SeaBIOS, acceleration) without quickchr, use routeros-qemu-chr instead."
---

# Grounding RouterOS with quickchr

Pinned to **0.6.0**, published to npm's `next` tag; `latest` is
still 0.5.6, so install the pinned version explicitly. 0.6.0 has
breaking changes: read its `CHANGELOG.md` "Breaking (0.6.0)" list before
upgrading from 0.5.x, and `[0.5.0]` through `[0.5.2]` before upgrading
from 0.4.x. Where a behavior changed, this skill names the
version.[^versions]

## What this is for

The reliable way to know whether a RouterOS config, script, or API call actually
works is to run it against **real RouterOS** — not to guess from docs. quickchr
([`@tikoci/quickchr`](https://github.com/tikoci/quickchr), npm, MIT, public) makes
that a few lines: it downloads a MikroTik **CHR** (Cloud Hosted Router) image,
boots it under QEMU, provisions it, and hands you a REST/SSH/exec handle. The free
CHR license (1 Mbps, no signup) is enough for config validation, API iteration, and
test grounding.

**Reach for quickchr when** you want to apply config and read it back, iterate on
REST/scripting against a live box, or run integration tests against CHR.

**Don't reach for it** when you only need documentation (use the `rosetta` MCP /
the `routeros-fundamentals` skill), or you're flashing physical hardware (use the
`routeros-netinstall` skill). For raw QEMU boot internals without the quickchr
wrapper, see the `routeros-qemu-chr` skill.

## The grounding loop (core pattern)

```ts
import { QuickCHR } from "@tikoci/quickchr";

const chr = await QuickCHR.start({ name: "lab", channel: "stable" });
// start() resolves REST-READY — provisioning is already done. No second wait needed
// in normal background/library use; waitForBoot() is only a belt-and-suspenders check.

await chr.exec("/ip/firewall/address-list/add list=blocked address=10.9.9.9");
const list = await chr.rest("/ip/firewall/address-list");   // structured read-back
// assert the entry is there → your config is grounded against real RouterOS

await chr.remove();   // tear down
```

`exec()` runs a CLI command (config writes, scripts) and returns `{ output, via }`;
`rest()` does a REST call and returns parsed JSON. Install from npm (`bun add @tikoci/quickchr@0.6.0`)
or run the CLI without installing (`bunx @tikoci/quickchr@0.6.0 <cmd>`). Worked, runnable version:
[`examples/grounding/`](https://github.com/tikoci/quickchr/tree/main/examples/grounding).
Minimal boot-and-read smoke test:
[`examples/quickstart/`](https://github.com/tikoci/quickchr/tree/main/examples/quickstart).
All examples are runnable `bun run` scripts (`grounding/` is the one `bun:test`); the
full set + coverage map is in
[`examples/COVERAGE.md`](https://github.com/tikoci/quickchr/tree/main/examples/COVERAGE.md).

> **Tip — re-run safety.** Give each run a unique machine name and assert on
> values carrying a per-run nonce, so a stale machine from an interrupted run can't
> make a later run pass falsely.

## Key entry points

Pointers, not duplicated signatures — the authoritative, versioned reference is the
quickchr [`MANUAL.md`](https://github.com/tikoci/quickchr/blob/main/MANUAL.md) and
the JSDoc in
[`src/lib/types.ts`](https://github.com/tikoci/quickchr/blob/main/src/lib/types.ts).
See also [`references/quickchr-api.md`](./references/quickchr-api.md) in this skill.

| Need | Surface |
|---|---|
| Boot / create a machine | `QuickCHR.start(opts)` → REST-ready `ChrInstance` |
| Pick RouterOS | `channel` (`stable`/`long-term`/`testing`/`development`) **or** `version` (`"7.23.1"`); if both, `version` wins (with a warning) |
| Return before ready | `wait: false`, then `instance.waitForBoot()`; refused with provisioning options |
| Architecture | `arch:` — `"x86"` or `"arm64"` |
| Managed login vs open admin | `secureLogin: true` (managed user, real password, managed SSH key) / `false`. Use `true` for anything that will use SSH/SFTP, centrs over SSH included: the key is made at first boot only (see gotchas) |
| Run a CLI command | `instance.exec(cmd, opts?)` — `opts.via` is `auto`/`rest`/`ssh`/`console`/`qga` |
| REST call | `instance.rest(path, init?)` |
| Move files | `instance.upload(local, remote?)` / `instance.download(remote, local)` |
| Add a package | `packages` at first boot, or `instance.installPackage(name)` later (downloads + reboots; returns installed names) |
| Pre-download an image | `cacheAdd({ channel \| version, arch })` — no machine |
| Size your own timeouts | `defaultBootTimeout(arch, withPackages?, accel?)` — the per-attempt budget `start()` uses |
| Custom port-forwards | `extraPorts` / CLI `--forward` (see Networking) |
| Extra NICs | `networks` / CLI `--add-network` (see Networking) |
| Connection surface for a child process | `instance.subprocessEnv()` / `instance.descriptor()` |
| Snapshots | `instance.snapshot(...)` |
| Change device-mode after boot | `instance.setDeviceMode(opts)` (power-cycles the VM) |
| Tear down | `instance.stop()` (power cut) / `instance.shutdown()` (guest shutdown first) / `instance.remove()` / `instance.destroy()` |

Shell-first agents (terminal, forum answers): the **routeros-tikoci-quickchr-cli**
skill owns the CLI lifecycle (`add`, `start`, `networks`, `cache`)
and the `centrs --quickchr` driving pattern — this skill does not repeat
it. Library dependency patterns (npm / `file:` / `bun link`):
[`examples/README.md`](https://github.com/tikoci/quickchr/blob/main/examples/README.md).
CLI without installing: `bunx @tikoci/quickchr@0.6.0 <cmd>`.

## Networking — which mechanism for which traffic

The default `user` (SLIRP) NIC handles management (REST/SSH/WinBox via host-port
forward) and is all most grounding needs. Reach past it only for these shapes
(full by-goal guide:
[`docs/networking-recipes.md`](https://github.com/tikoci/quickchr/blob/main/docs/networking-recipes.md)):

| You want… | Direction | Mechanism |
|---|---|---|
| Reach a guest TCP/UDP service (REST, SSH, WinBox, SNMP, container port) | host → guest | `user` NIC + `hostfwd` (`--forward` / `extraPorts`) |
| Reach a guest service on many/dynamic ports (e.g. btest data ports) | host → guest | `hostfwd` **range** (`--forward name:9200-9210:2000-2010/udp`) |
| Receive UDP the **guest sends** (syslog, NetFlow, TZSP, a server replying) | guest → host | guest sends to gateway `10.0.2.2:<port>`; host binds an **unconnected** socket — **no forward** |
| Receive guest **L2 frames / broadcasts** (MNDP, MAC-Telnet, raw Ethernet) | guest ↔ host | `socket-connect` L2 NIC (host runs a TCP server) |
| L2 link between two VMs | VM ↔ VM | `socket::<name>` named socket (default `dgram` unix pair, **either machine may start first**; `--mode mcast` is UDP multicast — see gotchas) or an explicit `socket:listen:`/`socket:connect:` pair (listener starts first) |
| Real LAN presence / DHCP from the host | full L3 | `shared` or `bridged:<iface>` (macOS: once per host, `quickchr networks create <net>`, the one sudo step) |

Two non-obvious points worth keeping:

- **guest → host UDP needs no forward.** The gateway `10.0.2.2` *is* the host from
  inside the VM. A datagram the guest sends to `10.0.2.2:<port>` reaches a host
  socket bound on loopback — but **leave that host socket unconnected** (`recvfrom`):
  SLIRP relays it from a rewritten source (`127.0.0.1:<ephemeral>`), so a
  `connect()`-ed socket filters it out. `instance.hostGatewayIp` (`10.0.2.2`) and
  `instance.captureInterface` (`lo0`/`any`) expose the constants. Runnable:
  [`examples/udp-gateway/`](https://github.com/tikoci/quickchr/tree/main/examples/udp-gateway).
- **`user` terminates Layer 2.** For MNDP/MAC-Telnet/broadcasts, add a
  `socket-connect` NIC — the host runs a TCP server, QEMU streams length-prefixed
  guest frames to it (rootless, loopback-only, cross-platform). Recipe + wire
  detail: [`docs/mndp.md`](https://github.com/tikoci/quickchr/blob/main/docs/mndp.md);
  [`examples/mndp/`](https://github.com/tikoci/quickchr/tree/main/examples/mndp).
  Keep `user` **first** (ether1) in any multi-NIC config — RouterOS only
  auto-DHCPs ether1, and `hostfwd` needs the guest's `10.0.2.15`.
  `networks` *replaces* the default NIC, so list `"user"` yourself: since
  0.6.0 a waiting `start()` with no `user` NIC is refused with
  `INVALID_NETWORK` before anything downloads (pass `wait: false` to boot
  without one).[^nic]

## Driving an external tool against a live CHR

To point a separate process at a running CHR (a schema extractor, a protocol
suite, a CLI), use the stable connection surface instead of reading `machine.json`:

```ts
const env = await chr.subprocessEnv();   // URLBASE, BASICAUTH, QUICKCHR_*
Bun.spawn(["my-tool"], { env: { ...process.env, ...env } });
```

`BASICAUTH` / `QUICKCHR_AUTH` are the **raw `user:password`** string (not a
header) — base64-encode for HTTP Basic: `Authorization: Basic ${btoa(env.BASICAUTH)}`.
`URLBASE` already includes the `/rest` base. `descriptor()` gives the same surface
as a structured `{ urls, auth, ports, status, version }` record. **Both are
secret-bearing** — pass via env, don't log. Always check a machine is `running`
before using stored ports. Runnable:
[`examples/harness/`](https://github.com/tikoci/quickchr/tree/main/examples/harness).

## Running several CHRs at once

Concurrent creations are safe (quickchr#190):[^ground-lock]
auto-allocated machines get distinct port blocks and NIC MACs whether
they come from one process or several. An explicit `portBase` is never
moved: one that overlaps another machine's block is refused with
`PORT_CONFLICT`. Lifecycle calls on *one* machine are ordered by a
per-machine lock. `stop()`, `clean()` and `remove()` wait (up to the
boot timeout) for an operation already in progress. The exception is a
machine started in the foreground: it holds the lock until its VM
exits, so they fail at once instead. A second `start()` of the same
machine also fails at once. Both failures are `MACHINE_LOCKED`, and
the message names the operation, pid and age of the holder.

On 0.4.7, concurrent *creations* collided: two
`QuickCHR.start()` calls in one `Promise.all`, or two `quickchr start`
processes, could both pick the same auto-allocated port block, and one
QEMU then failed with `SPAWN_FAILED` (*"Could not set up host
forwarding rule"*).[^ground-race] For versions before the 0.5.0 fix, create machines
one at a time, or give each an explicit `portBase` at least 10 apart.
Once created, machines can run side by side.

## Using quickchr in another project's tests

The pattern for a project that boots CHRs from its own `bun:test`
integration tests. quickchr's MANUAL has the full example and the timeout
arithmetic:
[Using quickchr in another project's tests](https://github.com/tikoci/quickchr/blob/main/MANUAL.md#using-quickchr-in-another-projects-tests).
centrs's own integration tests work this way.[^tests]

- **Download first, outside every test timeout.** Call `cacheAdd()` in a
  bunfig preload, or run `quickchr cache add` as a CI step. Then boot the
  `version` it returns, not the channel, so a channel that moves between
  the two steps cannot start a download inside a test.
- **Create and boot with one `start()`** on a random name
  (`myapp-it-<hex>`). Don't use `add()` then `start({ name })`: `start()`
  claims a new name under the same locks, removes the machine again if its
  first boot times out, and returns the handle. On 0.6.0, `start()` on a
  machine `add()` made also ignores `timeoutExtra` (fixed after 0.6.0,
  quickchr#291).
- **Keep stdout the test's own.** Pass `onProgress` to `start()` and
  `logger: createLogger(onProgress)` to `cacheAdd()`; quickchr then prints
  nothing to stdout. `add()` prints its image line anyway (quickchr#290).
- **The hook timeout must outlive quickchr's own waits**, so a slow boot
  ends in quickchr's `BOOT_TIMEOUT` report instead of the runner cutting it
  off. Start from `defaultBootTimeout(arch, withPackages, "tcg")` and add
  the margins the MANUAL lists (`timeoutExtra` twice, for the respawn, plus
  300 s for the lock, the failure report and the stop).
- **Print the machine name** (to stderr) before `start()`, so a killed run
  says what it left behind, and **`remove()` in `afterAll`**.
- **In CI, give the run its own `QUICKCHR_DATA_DIR`** (an absolute path in
  the runner's temp directory; 0.6.0 refuses a relative one) and cache
  `<data dir>/cache` between runs.
- **Pass `arch` explicitly.** The default is the Bun process's
  architecture, which is `x86` for an x64 Bun under Rosetta on Apple
  Silicon (quickchr#293).

## Grounding gotchas & known limitations

- **Provisioning floor:** managed login, package install, and `exec`-write
  provisioning need RouterOS **7.20.8+**; older 7.x is boot-only. quickchr
  also boots RouterOS 6 (x86, CLI only, no REST, no provisioning): see
  **routeros-tikoci-quickchr-cli**.
- **Provisioning runs once, at first boot.** Provisioning
  options passed to `start()` on a machine that has booted throw
  `PROVISIONING_WINDOW_CLOSED`, which
  names the route that still works (`setDeviceMode()`,
  `installPackage()`, or `clean()` and start again). (On 0.4.8 they
  were silently dropped.)[^window]
- **The managed SSH key is first-boot only.** `secureLogin: true` (without
  `user`) on the first boot is the only way a machine gets the
  batch-verified key that `descriptor()` advertises and centrs needs for
  every SSH/SFTP path. A machine booted without it has to be cleaned or
  recreated (quickchr#253; adding one later is quickchr#280).[^secure-login]
- **A machine whose QEMU another user owns** (one started with `sudo`) is
  refused by `stop()`, `shutdown()`, `remove()` and `clean()` with
  `PERMISSION_DENIED` since 0.6.0. Run them as that user against the same
  data dir.
- **`BOOT_TIMEOUT` on a restart:** 0.5.0 preserves a machine that
  booted before. A machine created by
  the same call is still removed, and one `add()` created that never
  booted is reset. On 0.4.8 the machine was removed instead, so set
  `QUICKCHR_PRESERVE_ON_FAILURE=1` there before restarting one you
  configured.[^boot-timeout]
- **QGA (`--via=qga`) needs KVM** — RouterOS only starts the guest agent under a
  KVM hypervisor, so it's unavailable under HVF (macOS) and TCG. Use REST/exec.
- **`socket-mcast` fails silently on macOS and in restricted Linux** (QEMU
  sets only `SO_REUSEADDR`, which BSD/macOS reject for sharing — and
  seccomp-filtered sandboxes refuse the `sendto()` while the group join
  succeeds). It is also **not host-confined** (no `localaddr=`, so the
  group rides the default multicast interface). Prefer `dgram` (the
  default) or `socket:listen:`/`socket:connect:` for two machines; use
  `mcast` only for N-way with a group of your own. Shell-first agents:
  see the **routeros-tikoci-quickchr-cli** skill for the CLI lifecycle.
- **Cross-arch TCG x86-on-arm64 is not viable** (x86 I/O emulation is too slow);
  aarch64-on-x86 is fine. KVM/HVF require host/guest arch match.
- **Free CHR is rate-limited to 1 Mbps** — fine for config/API grounding, not
  throughput tests. A free 60-day trial removes the limit.

> **Flakes:** these examples and recipes are grounded on real CHR runs. If you hit
> a *non-deterministic* failure (a boot that wedges, an intermittent REST error),
> re-run once; if it persists, please file an issue with `qemu.log` at
> <https://github.com/tikoci/quickchr/issues> rather than working around it
> silently.

## Authoritative docs & related skills

- quickchr repo: [README](https://github.com/tikoci/quickchr/blob/main/README.md) ·
  [MANUAL](https://github.com/tikoci/quickchr/blob/main/MANUAL.md) ·
  [DESIGN](https://github.com/tikoci/quickchr/blob/main/DESIGN.md) ·
  [docs/](https://github.com/tikoci/quickchr/tree/main/docs) ·
  [examples/](https://github.com/tikoci/quickchr/tree/main/examples)
- [`references/quickchr-api.md`](./references/quickchr-api.md) — fuller API map
  (start options, `ChrInstance` methods/properties, port layout, error codes).
- **routeros-qemu-chr** — raw QEMU/CHR boot internals (VirtIO, UEFI/SeaBIOS,
  acceleration) underneath quickchr.
- **routeros-fundamentals** — RouterOS CLI/REST/scripting once the CHR is up.
- **routeros-sniffer** / **routeros-mndp** — TZSP capture and MNDP wire format
  (the gateway-UDP and `socket-connect` recipes above feed these).

[^versions]: quickchr
    [`CHANGELOG.md`](https://github.com/tikoci/quickchr/blob/v0.6.0/CHANGELOG.md)
    `[0.5.0]` through `[0.6.0]`;
    [0.6.0 package review](../routeros-tikoci-quickchr-cli/references/cli-grounding.md#quickchr-060-package-review)
    and, before it, the
    [0.5.2 package review](../routeros-tikoci-quickchr-cli/references/cli-grounding.md#quickchr-052-package-review). The 0.5.0 behavior here was re-run against the published
    package (`routeros-tikoci-quickchr-cli/references/cli-grounding.md`
    §quickchr 0.5.0 re-check).
[^window]: quickchr MANUAL.md §5 "Provisioning pipeline"; CHANGELOG
    `[0.5.0]` Fixed (#176). 0.4.8's silent drop is reproduced in
    `routeros-tikoci-quickchr-cli/references/cli-grounding.md` §Device-mode.
[^boot-timeout]: 0.5.0: quickchr MANUAL.md §"Auto-cleanup on boot
    timeout" and CHANGELOG `[0.5.0]` (#182, #189). 0.4.8:
    `cleanupAfterBootFailure()` in `src/lib/quickchr.ts` at tag
    `v0.4.8` stops QEMU, then removes the machine unless
    `QUICKCHR_PRESERVE_ON_FAILURE=1`.
[^ground-race]: [tikoci/quickchr#140](https://github.com/tikoci/quickchr/issues/140):
    two concurrent `QuickCHR.start()` calls on quickchr 0.4.7 both chose
    `portBase=9140`, and the second QEMU failed `hostfwd=tcp::9145-:8291`
    with `SPAWN_FAILED`. The issue records a second collision at 9100 and
    the cause: the port block is chosen before any lock is taken.
[^ground-lock]: [tikoci/quickchr#190](https://github.com/tikoci/quickchr/pull/190),
    which closes #140, #180 and #181, released in 0.5.0. quickchr's
    [`MANUAL.md`](https://github.com/tikoci/quickchr/blob/main/MANUAL.md#static-methods-on-quickchr)
    (**Concurrency**) states the guarantee. It is covered by quickchr's
    `test/unit/machine-lock-concurrency.test.ts` (one `Promise.all` of
    four creations, and three processes started at the same instant, get
    distinct blocks) and by a live test in which two concurrent starts
    both boot (`test/integration/start-stop.test.ts`, "concurrent starts").
[^nic]: quickchr CHANGELOG `[0.6.0]` Breaking and Fixed (#268); the
    refusal was reproduced against the published 0.6.0 package in
    `routeros-tikoci-quickchr-cli/references/cli-grounding.md`
    §quickchr 0.6.0 package review.
[^tests]: quickchr MANUAL.md §4 "Using quickchr in another project's
    tests" (tikoci/quickchr#296, merged in #297). The MANUAL's example ran
    as a `bun:test` against the published 0.6.0 package: one pass in 22 s,
    nothing from quickchr on stdout, the machine removed afterwards
    (`routeros-tikoci-quickchr-cli/references/cli-grounding.md`
    §quickchr 0.6.0 package review).
[^secure-login]: quickchr MANUAL.md `StartOptions` (`secureLogin` row,
    #253). On 0.6.0 a `--secure-login` machine's `inspect --json` listed
    `batchModes: ["private-key"]`, and `centrs execute --via ssh` reached it
    (`routeros-tikoci-quickchr-cli/references/cli-grounding.md`
    §quickchr 0.6.0 package review).
