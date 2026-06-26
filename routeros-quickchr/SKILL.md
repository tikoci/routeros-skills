---
name: routeros-quickchr
description: "Ground RouterOS config/scripts/API code against a REAL router using quickchr (@tikoci/quickchr) — a CLI + Bun/TS library that downloads, boots, and manages MikroTik CHR VMs on QEMU. Use when: validating generated RouterOS config or scripts against real RouterOS before trusting them; spinning up a disposable CHR for REST/CLI/API iteration; writing integration/lab tests against CHR; needing host↔guest networking for a CHR (port-forward, L2/MNDP capture, guest→host UDP); driving an external RouterOS tool against a live CHR. For raw QEMU/CHR boot mechanics (VirtIO, UEFI vs SeaBIOS, acceleration) without quickchr, use routeros-qemu-chr instead."
---

# Grounding RouterOS with quickchr

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

**Don't** when you only need documentation (use the `rosetta` MCP / the
`routeros-fundamentals` skill), or you're flashing physical hardware (use the
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
`rest()` does a REST call and returns parsed JSON. Worked, runnable version:
[`examples/grounding/`](https://github.com/tikoci/quickchr/tree/main/examples/grounding).
Minimal boot-and-read smoke test:
[`examples/vienk/`](https://github.com/tikoci/quickchr/tree/main/examples/vienk).

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
| Pick RouterOS | `channel` (`stable`/`long-term`/`testing`/`development`) **or** `version` (`"7.23.1"`) |
| Architecture | `arch: "x86" \| "arm64"` |
| Managed login vs open admin | `secureLogin: true` (managed user, real password) / `false` |
| Run a CLI command | `instance.exec(cmd, opts?)` |
| REST call | `instance.rest(path, init?)` |
| Move files | `instance.upload(local, remote?)` / `instance.download(remote, local)` |
| Add a package | `instance.installPackage(name)` (downloads + reboots; returns installed names) |
| Custom port-forwards | `extraPorts` / CLI `--forward` (see Networking) |
| Extra NICs | `networks` / CLI `--add-network` (see Networking) |
| Connection surface for a child process | `instance.subprocessEnv()` / `instance.descriptor()` |
| Snapshots | `instance.snapshot(...)` |
| Tear down | `instance.remove()` / `instance.stop()` / `instance.destroy()` |

The same two knobs exist on the CLI and the library:

| CLI | Library (`StartOptions`) |
|---|---|
| `--forward <spec>` (repeatable) | `extraPorts: PortMapping[]` |
| `--add-network <spec>` (repeatable) | `networks: NetworkSpecifier[]` |

CLI without installing: `bunx @tikoci/quickchr <cmd>` (e.g. `add`, `start`, `exec`,
`list`, `inspect`, `env`, `networks`, `logs`). Library dependency patterns (npm /
`file:` / `bun link`):
[`examples/README.md`](https://github.com/tikoci/quickchr/blob/main/examples/README.md).

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
| L2 link between two VMs | VM ↔ VM | `socket::<name>` named pair |
| Real LAN presence / DHCP from the host | full L3 | `shared` or `bridged:<iface>` |

Two non-obvious points worth keeping:

- **guest → host UDP needs no forward.** The gateway `10.0.2.2` *is* the host from
  inside the VM. A datagram the guest sends to `10.0.2.2:<port>` reaches a host
  socket bound on loopback — but **leave that host socket unconnected** (`recvfrom`):
  SLIRP relays it from a rewritten source (`127.0.0.1:<ephemeral>`), so a
  `connect()`-ed socket filters it out. `instance.tzspGatewayIp` (`10.0.2.2`) and
  `instance.captureInterface` (`lo0`/`any`) expose the constants. Runnable:
  [`examples/udp-gateway/`](https://github.com/tikoci/quickchr/tree/main/examples/udp-gateway).
- **`user` terminates Layer 2.** For MNDP/MAC-Telnet/broadcasts, add a
  `socket-connect` NIC — the host runs a TCP server, QEMU streams length-prefixed
  guest frames to it (rootless, loopback-only, cross-platform). Recipe + wire
  detail: [`docs/mndp.md`](https://github.com/tikoci/quickchr/blob/main/docs/mndp.md);
  [`examples/mndp/`](https://github.com/tikoci/quickchr/tree/main/examples/mndp).
  Keep `user` **first** (ether1) in any multi-NIC config — RouterOS only
  auto-DHCPs ether1, and `hostfwd` needs the guest's `10.0.2.15`.

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

## Grounding gotchas & known limitations

- **Provisioning floor:** managed login, package install, and `exec`-write
  provisioning need RouterOS **7.20.8+**; older 7.x is boot-only.
- **QGA (`--via=qga`) needs KVM** — RouterOS only starts the guest agent under a
  KVM hypervisor, so it's unavailable under HVF (macOS) and TCG. Use REST/exec.
- **`socket-mcast` is broken on macOS** (QEMU sets only `SO_REUSEADDR`); use
  `socket-connect` for point-to-point / host capture. Works on Linux.
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
