# CLI grounding log — quickchr 0.4.8, CHR 7.24.4 x86, HVF

Live runs behind the claims in `routeros-quickchr-cli/SKILL.md`, so a
reviewer can re-run any of them. Environment: macOS Intel x64 host,
QEMU 11.1.1 with HVF, warm image cache (`chr-7.24.4.img` present — no
download involved), RouterOS CHR 7.24.4 x86.

Both quickchr releases were installed **from npm**, not from a working
tree, and invoked by path so the version under test is unambiguous:

```sh
bun add @tikoci/quickchr@0.4.8   # ./node_modules/.bin/quickchr → 0.4.8
bun add @tikoci/quickchr@0.4.7   # control, for the group-kill before/after
```

This matters: an earlier pass of this log was recorded against a
`bun link`ed working tree while labelled `0.4.7`. The named-socket
`dgram` default, the printed transport, the three-machine refusal and
the POSIX detach all shipped in **0.4.8** (quickchr #158, #159) and are
genuinely absent from 0.4.7 — the pin is now the published artifact.

All machine/socket names below are nonce (`q48-*`, `q47-*`); the four
pre-existing machines on the host were untouched, and every nonce
machine and socket was stopped and removed afterwards.

## Lifecycle timings (warm cache, HVF)

```sh
quickchr add --name q48-a --version 7.24.4 --arch x86 --add-network user
# → "Using cached image: chr-7.24.4", "q48-a created",
#   ports http:9140…winbox:9145, "tip:  quickchr start q48-a"
# elapsed: 0s — add only writes config, it never boots. stderr empty.
```

```sh
quickchr start q48-a --bg
# → "● q48-a started", REST http://admin@127.0.0.1:9140, SSH, WinBox lines
# elapsed: 22s — start --bg blocks until the guest is REST-ready, then returns
```

```sh
quickchr exec q48-a "/system/resource/print"        # elapsed: 0s
centrs retrieve --quickchr q48-a /system/resource   # elapsed: 1s
# both report version 7.24.4 (stable), board "CHR QEMU Standard PC (i440FX + PIIX, 1996)"
```

```sh
quickchr stop q48-a    # instant
quickchr remove q48-a  # → "q48-a removed."
```

Restart of an existing machine is faster than first boot: `start --bg`
11s on a second boot vs 22s first boot. Issue #21's "40–80s to
REST-ready" band came from a TCG software-emulation lab; the field lab
(sandboxed, no hardware acceleration) saw ~4 min boots and one real
`BOOT_TIMEOUT` at 480s — where the machine was auto-cleaned while its
QEMU kept running. On HVF-class acceleration expect the low end above.

## Group-kill: 0.4.7 loses the VM, 0.4.8 does not

The harness puts the CLI in its own process group, waits 8s (mid-boot),
then SIGKILLs the **group** — what a shell `timeout`, a CI step
teardown or an agent harness killing a stuck command actually does:

```python
p = subprocess.Popen([quickchr_bin, "start", machine, "--bg"], preexec_fn=os.setsid)
time.sleep(8)
os.killpg(os.getpgid(p.pid), signal.SIGKILL)
```

| published release | machine after group SIGKILL |
|---|---|
| 0.4.7 | `quickchr list` → `○` stopped, no QEMU — **the VM died with the group** |
| 0.4.8 | `quickchr list` → `●` running, pid 79385 — **VM survived** |

The 0.4.8 survivor answered `centrs retrieve --quickchr q48-kill
/system/resource` on the first 5s poll after the kill: the boot ran to
completion with no parent left to announce it.

`ps` shows why — the surviving QEMU is a session leader, so the group
signal never reached it (`detached: true` in `spawnQemu()`, part 2 of
quickchr #159):

```text
  PID  PPID  PGID   SESS STAT COMMAND
79385     1 79385      0 Ss   qemu-system-x86_64 … machines/q48-kill/boot.qcow2 …
```

Note the first detector used here (`pgrep -af qemu`) printed bare PIDs
on macOS and reported *both* releases as "GONE". That was a tooling
artifact, corrected by `quickchr list` + `ps -o pid,pgid,sess`; the
table above is from the corrected run.

Still open in #159: `start` waits for REST-readiness regardless (no
`--no-wait`), and the `--bg` naming decision. Hence the `nohup … &` +
poll pattern in the skill — now for "give me my shell back", not for
"keep the VM alive".

## First NIC is ether1 (DHCP), socket NIC is ether2

Machines created with `--add-network user` first show a dynamic
`10.0.2.15/24` on ether1 — RouterOS auto-DHCPs the first NIC, and the
host port-forwards depend on it:

```json
[
  { ".id": "*1", "address": "10.0.2.15/24", "dynamic": "true", "interface": "ether1" },
  { ".id": "*2", "address": "198.51.100.1/24", "comment": "q48lab", "interface": "ether2" }
]
```

(`centrs retrieve --quickchr q48-x /ip/address`.)

## Named-socket link: either order, ping passes on macOS

```sh
quickchr networks sockets create q48-seg
# → "Created named socket: q48-seg (dgram)"
#   "Transport: unix datagram ~/.local/share/quickchr/networks/q48-seg.{0,1}.sock"
quickchr add --name q48-x … --add-network user --add-network 'socket::q48-seg'
quickchr add --name q48-y … --add-network user --add-network 'socket::q48-seg'
```

Started **q48-y first, then q48-x** — deliberately not in any
listener/connector order, because a `dgram` link has no roles. Both
came up (22s, 21s) and `start` named the transport each resolved to:

```text
Network socket::q48-seg: unix datagram …/q48-seg.0.sock -> …/q48-seg.1.sock   (q48-y)
Network socket::q48-seg: unix datagram …/q48-seg.1.sock -> …/q48-seg.0.sock   (q48-x)
```

`quickchr networks sockets` then listed `q48-seg │ dgram │ … │ q48-y, q48-x`.
After static `/24`s on ether2:

```sh
centrs execute --quickchr q48-x --yes '/ping 198.51.100.2 count=3'
# → sent=3 received=3 packet-loss=0% min-rtt=683us avg-rtt=1ms41us
```

L2 works over the `dgram` default on a macOS host — the exact case
where `mcast` would have shown 100% loss and logged nothing.

## Third machine refused

```sh
quickchr add --name q48-z … --add-network 'socket::q48-seg'   # succeeds
quickchr start q48-z
# → Error [NETWORK_UNAVAILABLE]: Named socket "q48-seg" is a dgram link and
#   carries 2 machines; q48-y and q48-x already hold both ends. Stop one of
#   them, or create an N-way segment with
#   'quickchr networks sockets create <name> --mode mcast'.
```

The cap is enforced at **`start`**, not at `add` — `add` accepted the
third machine without complaint.

## Socket create output (transport is printed)

```sh
quickchr networks sockets create q48-mc --mode mcast
# → "Created named socket: q48-mc (mcast)"
#   "Transport: UDP multicast 230.0.0.1:4000 (N-way)"
#   "Note: UDP multicast is the only N-way segment, and the only one that
#          fails silently. It does not deliver on macOS, and it is refused
#          in sandboxes that block unconnected UDP sends (some Linux CI).
#          This group is not confined to loopback: 230.0.0.1 rides the host's
#          default multicast interface, so another machine on your LAN using
#          the same group joins this segment. Use a unique group, or prefer
#          'dgram' for two machines."
quickchr networks sockets create q48-lc --mode listen-connect
# → "Transport: TCP pair on 127.0.0.1:4001"
```

Default mode is `dgram` off-Windows (`defaultSocketMode()` in
`src/lib/socket-registry.ts`); `230.0.0.1` is `DEFAULT_MCAST_GROUP`.

## Driving with centrs

```sh
centrs execute --quickchr q48-x --yes '/ip/address/add interface=ether2 address=198.51.100.1/24'
# → { "ret": "*2", ".id": "*2" }
centrs execute --quickchr q48-x '/ip/address/add interface=ether2 address=203.0.113.9/24'
# → [usage/confirmation-required] Write-shaped RouterOS execute commands require
#   explicit confirmation.
#   Fix: Pass `--yes` in non-interactive automation, or answer `yes` at the TTY prompt…
```

Why centrs over `quickchr exec`, shown on one command:

```sh
quickchr exec q48-a "/system/identity/print"   # → "name: C" / "H" / "R"  (screen-scraped)
centrs retrieve --quickchr q48-a /system/identity   # → { "name": "CHR" }
```

0.4.8 says the same thing itself. Bare `quickchr exec` writes to
**stderr** (stdout keeps the machine table, so `--json` stays parseable):

```text
tip: centrs validates RouterOS commands before running them: centrs execute --quickchr <name> <command>
```

and `quickchr exec --help` ends with:

```text
See also — centrs (@tikoci/centrs) validates a RouterOS-shaped command
before running it, and has per-verb help. 'quickchr exec' does not: it is a
raw /rest/execute pipe, and whatever you type is what RouterOS is asked to run.
…
centrs resolves the machine through 'quickchr inspect' — it never reads machine.json.
```

`QUICKCHR_NO_TIPS=1` suppressed the tip (stderr 0 bytes).

## Cache

```sh
quickchr cache --help   # → "quickchr cache <add|key|list|prune|clear>"
quickchr cache key --version 7.24.4 --arch x86
# → dir=/Users/amm0/.local/share/quickchr/cache
#   version=7.24.4
#   arch=x86
quickchr cache add --version 7.24.4 --arch x86
# → "Already cached: RouterOS 7.24.4 (x86)", elapsed 0s
```

`add` and `key` are 0.4.8; the field lab hit exactly this gap on an
earlier release ("`quickchr cache` only does `list | prune | clear`.
There is no way to warm the cache without booting").

## Device-mode

`centrs retrieve --quickchr q48-x /system/device-mode` on a default
machine reads `mode: advanced`, `container: false`, `partitions: false`.
`--device-mode-enable` is accepted by `add`/`start` as a CSV list
(`src/cli/flags.ts`), though the condensed `add --help` lists only
`--device-mode <m>`.

## What was *not* re-verified in this run

- **A device-mode value change through `--device-mode-enable`.** The
  mechanism is a source reading (`_provisionInstance` kills QEMU and
  restarts it — MANUAL.md "Order of operations"); the guest-side hang
  (`/system/device-mode/update container=yes` timing out on 7.24.3 and
  7.24.4, ~5 min wait for a power cycle) and the
  `--device-mode-enable container` fix come from the field lab, which
  reached `mode=rose container=yes` that way. Default state read live.
- **`socket:listen:`/`socket:connect:` ordering.** The raw pair's
  listener-first requirement is DESIGN.md's account plus
  `parseSocketSpecifier()`; this run used `socket::<name>` throughout,
  which is the path the skill recommends. An earlier pass did verify a
  listener-first raw pair end to end (ping 3/3 and 2/2 across a
  connector restart), but on an unpinned build.
- **Windows `listen-connect` default.** CHANGELOG and
  `defaultSocketMode()`; no Windows host here.
- **TCG timings and `BOOT_TIMEOUT`.** From the field lab's sandbox, not
  reproduced on this HVF host.
