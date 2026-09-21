# CLI grounding log — quickchr 0.4.7, CHR 7.24.4 x86, HVF

Live runs behind the claims in `routeros-quickchr-cli/SKILL.md`, so a
reviewer can re-run any of them. Environment: macOS Intel x64 host,
QEMU 11.1.1 with HVF, `quickchr 0.4.7`, warm image cache
(`chr-7.24.4.img` present — no download involved), RouterOS CHR 7.24.4
x86. All machine/socket names below are nonce (`skillab-*`); the four
pre-existing machines on the host were untouched, and every nonce
machine and socket was stopped and removed afterwards.

## Lifecycle timings (warm cache, HVF)

```sh
quickchr add --name skillab-a --version 7.24.4 --arch x86 --add-network user
# → "skillab-a created", ports http:9140…winbox:9145, tip: `quickchr start skillab-a`
# elapsed: 0s — add only writes config, it never boots
```

```sh
quickchr start skillab-a --bg
# → "● skillab-a started", REST http://admin@127.0.0.1:9140, SSH, WinBox lines
# elapsed: 23s — start --bg blocks until the guest is REST-ready, then returns
```

```sh
quickchr exec skillab-a "/system/resource/print"        # elapsed: 0s
centrs retrieve --quickchr skillab-a /system/resource   # elapsed: 1s
# both return version 7.24.4 (stable), board "CHR QEMU Standard PC (i440FX + PIIX, 1996)"
```

```sh
quickchr stop skillab-a    # → "○ skillab-a stopped", elapsed: 0s
quickchr remove skillab-a  # → "skillab-a removed."
```

Restart of an existing machine is faster than first boot: `stop` 0s,
`start --bg` 11s (same machine, second boot), vs 22–23s first boot.
Issue #21's "40–80s to REST-ready" band came from a TCG software-emulation
lab; on HVF-class acceleration expect the low end above.

## `--bg` blocks; a killed parent leaves QEMU behind

`quickchr start skillab-c --bg` under an 8s shell timeout printed
nothing (first boot needs ~22s) — the CLI was still inside its
readiness wait when the timeout fired. Afterwards `quickchr list`
showed the machine present with a live QEMU pid, and ~20s later
`centrs retrieve` answered normally; `stop`/`remove` cleaned up with
no stranded lock. So a parent killed mid-start neither stops the boot
nor reports readiness — the VM keeps going orphaned. A harness timeout
that kills the whole *process group* is worse: on POSIX QEMU shares the
caller's group (tikoci/quickchr#159 — `Bun.spawn` + `unref()`, no
`setsid`), so a group signal reaches QEMU itself. That is why the skill
recommends `nohup … &` plus independent polling.

## First NIC is ether1 (DHCP), socket NIC is ether2

Machines created with `--add-network user` first show a dynamic
`10.0.2.15/24` on ether1 — RouterOS auto-DHCPs the first NIC, and the
host port-forwards depend on it:

```json
[
  { ".id": "*1", "address": "10.0.2.15/24", "dynamic": "true", "interface": "ether1" },
  { ".id": "*2", "address": "198.51.100.1/24", "comment": "skillab", "interface": "ether2" }
]
```

(`centrs retrieve --quickchr skillab-a /ip/address`.)

## Socket pair: listener first, then connector, ping passes

```sh
quickchr add --name skillab-a --version 7.24.4 --arch x86 \
  --add-network user --add-network 'socket:listen:5231'
quickchr add --name skillab-b --version 7.24.4 --arch x86 \
  --add-network user --add-network 'socket:connect:5231'
# auto port blocks 9140… / 9150…, no collision, no flags needed
```

Started in listener→connector order (22s + 22s), addressed ether2 via
writes (`centrs execute --quickchr <name> --yes …` — writes refuse
without `--yes`), then:

```sh
centrs execute --quickchr skillab-a '/ping 198.51.100.2 count=3'
# → sent=3 received=3 packet-loss=0%
centrs execute --quickchr skillab-b '/ping 198.51.100.1 count=2'
# → sent=2 received=2 packet-loss=0% (after skillab-b stop/start — roles persist)
```

## Socket create output (transport is printed)

```sh
quickchr networks sockets create skillab-seg
# → "Created named socket: skillab-seg (dgram)"
#   "Transport: unix datagram ~/.local/share/quickchr/networks/skillab-seg.{0,1}.sock"
#   (output shows the absolute data-dir path; rendered here with ~)
quickchr networks sockets create skillab-mcast --mode mcast
# → "Created named socket: skillab-mcast (mcast)"
#   "Transport: UDP multicast 230.0.0.1:4000 (N-way)"
#   plus the create-time warning: silent failure, no macOS delivery,
#   refused where unconnected UDP sends are blocked, and not confined
#   to loopback (LAN-leak) — "Use a unique group, or prefer 'dgram'".
```

Default mode is `dgram` off-Windows (`defaultSocketMode()` in
`src/lib/socket-registry.ts`); `230.0.0.1` is `DEFAULT_MCAST_GROUP`.

## What was *not* re-verified in this run

- The `nohup … &` detach half of the #159 workaround: this sandbox
  forbids backgrounding, so only the block-on-readiness half is
  observed above; the detach rationale is a code reading of #159.
- A device-mode value change through `--device-mode`: the mechanism is
  a source reading (provisioning step in `_provisionInstance` kills
  QEMU and restarts it — MANUAL.md "Order of operations"), plus the
  external field lab's confirmation that a guest-side `/system/reboot`
  does not apply it. Default state (`mode: advanced`) was read live.
- Connector-first start order failing silently: documented in
  DESIGN.md and consistent with the listen/connect mechanism; this run
  only demonstrates the correct order working.
