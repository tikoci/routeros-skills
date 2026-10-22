# CLI grounding log — quickchr 0.4.8 and 0.5.0, CHR x86, HVF

## Contents

- Lifecycle timings (warm cache, HVF)
- Group-kill: 0.4.7 loses the VM, 0.4.8 does not
- Bounded readiness poll
- First NIC is ether1 (DHCP), socket NIC is ether2
- Named-socket link: either order, ping passes on macOS
- Third machine refused
- Socket create output (transport is printed)
- Driving with centrs
- Cache
- Device-mode
- Endpoints and credentials
- What was *not* re-verified in this run
- quickchr 0.5.0 re-check
- What the 0.5.0 re-check did *not* cover

Live runs behind the claims in `routeros-quickchr-cli/SKILL.md`, so a
reviewer can re-run any of them. Every section up to "What was *not*
re-verified in this run" is the 0.4.8 pass; the 0.5.0 pass is its own
section at the end. Environment of the 0.4.8 pass: macOS Intel x64 host,
QEMU 11.1.1 with HVF, warm image cache (`chr-7.24.4.img` present — no
download involved), RouterOS CHR 7.24.4 x86.

Both quickchr releases were installed **from npm**, not from a working
tree, and invoked by path so the version under test is unambiguous:

```sh
mkdir lab48 && cd lab48 && bun add @tikoci/quickchr@0.4.8   # ./node_modules/.bin/quickchr
mkdir lab47 && cd lab47 && bun add @tikoci/quickchr@0.4.7   # control, group-kill before/after
```

Two **separate project directories** on purpose — a second `bun add` in one
project would just move the same dependency and overwrite
`node_modules/.bin/quickchr`, leaving no 0.4.7 to compare against. Each run
below invokes its release by path (`../lab47/node_modules/.bin/quickchr`,
`./node_modules/.bin/quickchr`), never a `quickchr` found on `PATH`. A
development checkout linked onto `PATH` (`bun link`) shadows the published
binary and reports its own in-tree version — which is exactly how the
previous pass mislabelled what it had tested.

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

Ports come in per-machine blocks of ten from 9100, with no flags and no
collisions: each new machine takes the next free block, `http` first, then
`https ssh api api-ssl winbox` within it. With the lower blocks already in
use here, the three lab machines created next were handed 9140, 9150 and
9160 in creation order. `quickchr add --help`: "`--port-base <port>`
Starting port number (default: auto-allocated from 9100)".

Restart of an existing machine is faster than first boot: `start --bg`
11s on a second boot vs 22s first boot. Issue #21's "40–80s to
REST-ready" band came from a TCG software-emulation lab; the field lab
(sandboxed, no hardware acceleration) saw ~4 min boots and one real
`BOOT_TIMEOUT` at 480s — where the machine was auto-cleaned while its
QEMU kept running. That last detail is the field lab's report, not
reproduced here: 0.4.8's `cleanupAfterBootFailure()` calls `stop()`
before `remove()`. On HVF-class acceleration expect the low end above.

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

On 0.4.8, `start` waits for REST-readiness regardless (no
`--no-wait`). Hence the `nohup … &` + poll pattern in the skill — for
"give me my shell back", not for "keep the VM alive". 0.5.0 closed the
rest of #159: `--no-wait` and a deprecated `--bg` (see §quickchr 0.5.0
re-check).

## Bounded readiness poll

The skill's detach-and-poll snippet, run verbatim on this host:

```sh
nohup quickchr start lab-a --bg >lab-a.start.log 2>&1 &

ready() { centrs retrieve --quickchr lab-a /system/resource >/dev/null 2>&1; }
for _ in $(seq 60); do ready && break; sleep 5; done   # 60 x 5s = 5 min
ready || { quickchr list; tail -20 lab-a.start.log; exit 1; }
```

Success path: shell returned immediately, loop broke at **21s**, and
`centrs retrieve` then reported `"version": "7.24.4 (stable)"`.

Failure path, forced against a machine name that does not exist (bound
shortened to 3 x 2s): the loop ran out, the `ready ||` branch printed
`quickchr list` and the log tail, and the script **exited 1**.

That second half is the point of the bound. An unbounded
`until ready; do sleep 5; done` never exits when `start` fails outright
— `MISSING_QEMU`, `SPAWN_FAILED`, `BOOT_TIMEOUT` are all terminal, and
the poll cannot distinguish "still booting" from "never will". In CI
that is a job that hangs to the runner limit with no diagnostic.

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
quickchr add --name q48-x --version 7.24.4 --arch x86 \
  --add-network user --add-network 'socket::q48-seg'
quickchr add --name q48-y --version 7.24.4 --arch x86 \
  --add-network user --add-network 'socket::q48-seg'
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
quickchr add --name q48-z --version 7.24.4 --arch x86 \
  --add-network user --add-network 'socket::q48-seg'   # succeeds
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

  centrs retrieve --quickchr <name> /system/resource    Read state
  centrs execute  --quickchr <name> <command>           Run a read/write command
  centrs explain  <command>                             Analyze without running it

centrs resolves the machine through 'quickchr inspect' — it never reads machine.json.
Install: bun add -g @tikoci/centrs
```

`QUICKCHR_NO_TIPS=1` suppressed the tip (stderr 0 bytes).

## Cache

```sh
quickchr cache --help   # → "quickchr cache <add|key|list|prune|clear>"
quickchr cache key --version 7.24.4 --arch x86
# → dir=~/.local/share/quickchr/cache        (absolute in real output)
#   version=7.24.4
#   arch=x86
quickchr cache add --version 7.24.4 --arch x86
# → "Already cached: RouterOS 7.24.4 (x86)", elapsed 0s
```

`add` and `key` are 0.4.8; the field lab hit exactly this gap on an
earlier release ("`quickchr cache` only does `list | prune | clear`.
There is no way to warm the cache without booting").

## Device-mode

A default machine reads `mode: advanced`, `container: false`,
`partitions: false`. Three runs, in the order an agent hits them.

**Guest-side update does not apply, and does not return.** On a running
machine:

```sh
centrs execute --quickchr q48-dm --yes '/system/device-mode/update container=yes'
# → [transport/timeout] The RouterOS API command to api://127.0.0.1:9143
#   timed out after 10000ms.
# container afterwards: still "false"
```

RouterOS is waiting for a power cycle it cannot perform on itself. The
timeout is the symptom, not a transport fault. Note the bound: what is
observed is that the call **did not complete within the 10s client
timeout** and left `container` unchanged. Whether it would ever return is
not established here — the field lab's ~5 min wait was not reproduced.

**On 0.4.8, the flag is silently ignored on an already-booted machine.**
(0.5.0 refuses it instead — see §quickchr 0.5.0 re-check.)

```sh
quickchr add --name q48-dm … ; quickchr start q48-dm --bg   # 22s, container=false
quickchr stop q48-dm
quickchr start q48-dm --bg --device-mode-enable container   # 20s, NO provisioning output
# container afterwards: still "false"
```

No warning, no error, no extra boot time — the flag parses and is
dropped. The gate is in `QuickCHR.start()` (`src/lib/quickchr.ts`):
provisioning options are passed to `_launchExisting()` only under
`if (!existing.lastStartedAt)`, and `undefined` is passed on every
later start.

**It applies on a first boot — including one where `add` had no such
flag.** A machine added plain but never started:

```sh
quickchr add --name q48-dm3 --version 7.24.4 --arch x86 --add-network user
quickchr start q48-dm3 --bg --device-mode-enable container
# → Applying device-mode (mode=rose container=yes)...
#     Device-mode power-cycled via QEMU monitor quit
#     Waiting for CHR to reboot after device-mode power-cycle...
#     Device-mode verified: mode=rose container=yes
# elapsed: 46s (vs 22s without provisioning); container afterwards: "true"
```

So the boundary is **first boot**, not `add`. Setting it at `add` time
behaves identically (`add` prints
`Device-mode: auto  (applied on first start)`, then the same 45s start).
Enabling `container` also moved `mode` from `advanced` to `rose`.

On 0.4.8 there is **no CLI command** to change device-mode afterwards —
`get` only displays it. The library has `instance.setDeviceMode()`
(`src/lib/quickchr.ts`), which is not exposed on the CLI, so the CLI
answer for a booted machine is `remove` + `add` + `start`.

## Endpoints and credentials

```sh
quickchr get q48-dm3        # → License (level/software ID), Device Mode, Admin Users
quickchr inspect q48-dm3 --json
```

`inspect --json` is the machine descriptor: `status`, `pid`,
`createdAt`, **`lastStartedAt`** (on 0.4.8, the field that decides whether
device-mode flags will apply), `networks`, `customForwards`, and a
`services` block per service. Each service carries its resolved URL and
ready-to-use auth — this CHR is `admin` with an empty password:

```json
"rest-api": { "available": true, "host": "127.0.0.1", "port": 9150,
              "url": "http://127.0.0.1:9150/rest",
              "auth": { "username": "admin", "password": "",
                        "basic": "admin:", "header": "Basic <encoded>" } }
```

Verified as a copy-paste recipe against a live machine:

```sh
url=$(quickchr inspect lab-a --json | jq -r '.services["rest-api"].url')
curl -s -u admin: "$url/system/resource" | jq '{version, "board-name"}'
# → { "version": "7.24.4 (stable)",
#     "board-name": "CHR QEMU Standard PC (i440FX + PIIX, 1996)" }
```

`--device-mode-enable` is accepted by both `add` and `start` as a CSV
list (`src/cli/flags.ts`), though the condensed `add --help` lists only
`--device-mode <m>`. Provisioning also requires a user-mode NIC — the
`NETWORK_UNAVAILABLE` guard in `QuickCHR.start()` refuses it otherwise.

## What was *not* re-verified in this run

- **The field lab's ~5 min guest-side hang.** The guest-side attempt was
  reproduced here, but bounded at 60s (it failed the API call at 10s and
  left `container` unchanged), so the full wait the field lab described
  was not re-observed. Everything else about device-mode in §Device-mode
  above is from live runs on 0.4.8.
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

## quickchr 0.5.0 re-check

`@tikoci/quickchr@0.5.0` (npm `next`; `latest` was still 0.4.8) and
`@tikoci/centrs@0.1.8`, both installed from npm into one scratch
project and invoked from its `node_modules/.bin`. Same macOS Intel
host, HVF, CHR **7.24.5** x86 (image copied into the scratch cache) and
6.49.23 x86 (downloaded). `QUICKCHR_DATA_DIR` pointed at a scratch
directory, so no existing machine was visible or touched, and every
`q50-*` machine was removed afterwards.

One setup failure first. A deep `QUICKCHR_DATA_DIR` makes QEMU refuse
the monitor socket, and `start` fails with `SPAWN_FAILED`:

```text
UNIX socket path '…/machines/q50-a/monitor.sock' is too long
Path must be less than 104 bytes
```

That is the macOS `sun_path` limit, not a quickchr bug. A short data
directory fixed it.

**`--bg` warns, and `start` still waits.**

```sh
quickchr add --name q50-a --version 7.24.5 --arch x86 --add-network user   # 1s
quickchr start q50-a --bg
# → Warning: --bg is deprecated and does nothing — background is already the
#   default, and it never made start return early. Use --no-wait to return as
#   soon as QEMU is running.
quickchr start q50-a        # → "● q50-a started", elapsed 25s (first boot)
```

(The `--bg` run above then failed on a transient DNS error resolving
`upgrade.mikrotik.com`. The plain retry is the one timed.)

**`stop` is a power cut; `--no-wait` returns at once.**

```sh
quickchr stop q50-a                    # → "○ q50-a stopped", 1s
quickchr start q50-a --no-wait
# → "● q50-a launched — not waiting for RouterOS (--no-wait)", 2s
#   tip: wait for readiness with: centrs retrieve --quickchr q50-a /system/resource --wait 5m
centrs retrieve --quickchr q50-a /system/resource --wait 5m
# → "version": "7.24.5 (stable)", "uptime": "14s"
```

centrs 0.1.6 (an older global install) rejected `--wait`; MANUAL.md
names centrs 0.1.8+ for it.

**`--no-wait` refusals** — all `INVALID_ARGUMENT`, exit 1, nothing booted:

```text
$ quickchr start --name q50-b --version 7.24.5 --arch x86 --no-wait --add-package container
Error [INVALID_ARGUMENT]: --no-wait (wait: false) cannot be combined with provisioning:
  provisioning was requested (install extra packages), … Drop --no-wait for this first
  boot — later starts can use it.
$ quickchr start q50-a --no-wait --fg
Error [INVALID_ARGUMENT]: --no-wait (wait: false) cannot be combined with --fg …
$ quickchr add --name q50-c … --device-mode-enable container; quickchr start q50-c --no-wait
Error [INVALID_ARGUMENT]: … machine "q50-c" has first-boot provisioning recorded by 'add'
  (change device-mode) …
```

`q50-b` was not left behind (`quickchr list` did not show it).

**A provisioning flag on a booted machine is refused, with the route.**
`q50-a` had booted once, with no provisioning:

```text
$ quickchr start q50-a --device-mode-enable container
Error [PROVISIONING_WINDOW_CLOSED]: Machine "q50-a" has already booted, so provisioning
  cannot run against it — the guest may no longer hold the default configuration
  provisioning expects.
  device-mode (mode=rose container=yes) — apply it with:
      quickchr set q50-a --device-mode rose --device-mode-enable container   # power-cycles the machine
To provision from scratch, reset the disk to the factory image and reopen the window:
      quickchr clean q50-a   # then repeat the original start command — a refused request is not remembered
```

Exit 1 after 2s, and the machine stayed stopped.

**`set` changes device-mode after boot.** On the running machine:

```text
$ quickchr set q50-a --device-mode-enable container
Setting device-mode on q50-a: mode=rose container=yes
Applying device-mode (mode=rose container=yes)...
  mode: advanced -> rose
  container: no -> yes
  Device-mode power-cycled via QEMU monitor quit
  Device-mode verified: mode=rose container=yes
# elapsed 21s
$ quickchr get q50-a device-mode
    Mode: rose
    Enabled:  bandwidth-test, container, email, fetch, hotspot, ipsec, l2tp, pptp, proxy, romon, scheduler, smb, sniffer, socks, zerotier
    Disabled: install-any-version, partitions, routerboard, traffic-gen
```

`machine.json` then held `"provisioning": {"steps": ["deviceMode"], …}`.
That record is not in `list --json` or `inspect --json`. Passing the
same flag on the next start was a no-op, not a refusal:

```text
$ quickchr start q50-a --device-mode-enable container
device-mode (mode=rose container=yes) is already applied — nothing to do.
● q50-a started          # 20s
```

**`shutdown`.**

```sh
quickchr shutdown q50-a              # → "q50-a: guest exited after shutdown request", <1s
quickchr shutdown q50-a --timeout 1  # (after another start) → same, 1s
quickchr shutdown q50-a              # stopped machine → "q50-a: already stopped", exit 0
```

**RouterOS 6.**

```text
$ quickchr add --name q50-v6arm --version 6.49.23 --arch arm64
Error [INVALID_ARCH]: RouterOS 6.49.23 has no arm64 CHR image — MikroTik publishes
  RouterOS 6 CHR for x86 only. Pass --arch x86 (arch: "x86").
$ quickchr add --name q50-v6p --version 6.49.23 --arch x86 --add-package container
Error [PROVISIONING_VERSION_UNSUPPORTED]: Cannot install extra packages on RouterOS 6.49.23.
  RouterOS 6 is a best-effort boot-only target: …
$ quickchr add --name q50-v6 --version 6.49.23 --arch x86   # 88s, image download
$ quickchr start q50-v6                                      # 27s
● q50-v6 started
  Version: 6.49.23 (x86)  boot-only: no REST, no provisioning
  API:     127.0.0.1:9113  (native API, user admin)
$ quickchr exec q50-v6 "/system/resource/print"
Error [REST_UNAVAILABLE]: RouterOS 6: not available — exec uses the REST API, which
  RouterOS 6.49.23 does not have. … Reach it over the native API instead, e.g. centrs
  retrieve --quickchr q50-v6 /system/resource --via native-api --no-validate …
$ centrs retrieve --quickchr q50-v6 /system/resource --via native-api --no-validate
# → "version": "6.49.23 (stable)", "board-name": "CHR"
```

**Library surface**, read from the published package's
`src/lib/types.ts`: no `tzspGatewayIp` anywhere in `src/`;
`StartOptions.wait?: boolean`; `ShutdownOptions { timeoutMs? }` and
`ShutdownResult { outcome: "guest-exited" | "forced" | "already-stopped";
requestError? }`; `ErrorCode` gains `PROVISIONING_WINDOW_CLOSED` and
`REST_UNAVAILABLE`. Passing both `version` and `channel` warns that
`channel` is ignored (`QuickCHR` in `src/lib/quickchr.ts`). Neither
0.4.8 nor 0.5.0 has a static `QuickCHR.stop(name)`. Use
`QuickCHR.get(name)?.stop()`.

## What the 0.5.0 re-check did *not* cover

- **`shutdown`'s forced fallback.** Every request here ended in "guest
  exited" within a second. The "forced power cut — guest shutdown not
  confirmed" outcome is MANUAL.md's account.
- **`BOOT_TIMEOUT` cleanup by machine history** (#182, #189). It was not
  forced here. The table in the skill is MANUAL.md §"Auto-cleanup on boot
  timeout" and the CHANGELOG `[0.5.0]` entries. On 0.4.8, the cleanup
  function stops QEMU and removes the machine unless
  `QUICKCHR_PRESERVE_ON_FAILURE=1`.
- **`clean` reopening the provisioning window** (#176). It is
  MANUAL.md's account and was not run here.
