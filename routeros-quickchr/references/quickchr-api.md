# quickchr API reference (for automation)

A fuller map of the `@tikoci/quickchr` library surface than the SKILL body. This is
a navigational summary — the **authoritative, versioned** source is the quickchr
[`MANUAL.md`](https://github.com/tikoci/quickchr/blob/main/MANUAL.md) and the JSDoc
in [`src/lib/types.ts`](https://github.com/tikoci/quickchr/blob/main/src/lib/types.ts).
Verify signatures there before relying on exact shapes; this doc favors stable
concepts over version-specific detail.

## Trigger terms

quickchr, `@tikoci/quickchr`, CHR, Cloud Hosted Router, ground/validate RouterOS
config against a real router, disposable RouterOS VM, CHR integration test, QEMU
RouterOS, `QuickCHR.start`, `ChrInstance`, `exec`/`rest` against CHR, host↔guest
port-forward, guest→host UDP, MNDP/L2 capture from CHR.

## `QuickCHR.start(opts)` → `ChrInstance`

Returns a **REST-ready** instance: download, boot, and provisioning have all
completed when the promise resolves (background/library use). Common `StartOptions`:

| Field | Meaning |
|---|---|
| `name` | machine name (must not start with `-`) |
| `channel` | one of `"stable"`, `"long-term"`, `"testing"`, `"development"` |
| `version` | pinned RouterOS, e.g. `"7.23.1"` (may be used with `channel`; if both are set, they should be consistent) |
| `arch` | `"x86"` or `"arm64"` (default: host arch) |
| `secureLogin` | `true` → managed `quickchr` user with a stored password; `false` → open admin. Inverse alias: `noAuth` (`noAuth: true` ≙ `secureLogin: false`). Prefer `secureLogin` in new configs. |
| `cpu`, `mem` | vCPUs / MiB RAM |
| `background` | run detached (the library default for automation) |
| `networks` | `NetworkSpecifier[]` — extra NICs (see networking) |
| `extraPorts` | `PortMapping[]` — custom host→guest forwards |
| `license` | one-shot trial/license at start |
| `packages` | packages to install during provisioning |
| `bootSize`, `extraDisks` | disk sizing (needs `qemu-img`) |

The full option set + defaults are in `StartOptions` (types.ts). Other static
entry points: `QuickCHR.list()`, `QuickCHR.get(name)`, `QuickCHR.stop(name)`.

## `ChrInstance`

**Methods:**

| Method | Purpose |
|---|---|
| `rest(path, init?)` | REST call → parsed JSON |
| `exec(cmd, opts?)` | run a CLI command/script → `{ output, via }`. `opts.via`: `auto`/`rest`/`qga`/`console` |
| `waitForBoot(timeoutMs?)` | optional re-check that REST is up (start() already waits) |
| `waitFor(cond, timeoutMs?)` | poll an arbitrary async predicate (e.g. "/dude enabled") |
| `installPackage(names)` | one name or an array; download + install + reboot; returns names actually installed |
| `availablePackages()` | package names available for this version/arch |
| `upload(local, remote?)` / `download(remote, local)` | SCP file transfer |
| `subprocessEnv()` | env vars for a child process (see below) |
| `descriptor()` | structured `{ urls, auth, ports, status, version, … }` |
| `snapshot(...)` | qcow2 savevm/loadvm/list/delete |
| `qga(cmd, args?)` | QEMU Guest Agent (x86 on **Linux with KVM only**; excludes macOS/HVF and Windows) |
| `stop()` / `remove()` / `destroy()` | lifecycle teardown |

**Properties:** `name`, `ports`, `restUrl`, `sshPort`, `portBase`,
`captureInterface` (`"lo0"` on macOS, `"any"` on Linux), `tzspGatewayIp`
(`"10.0.2.2"` — the host as seen from the guest).

### Connection surface for child processes

`subprocessEnv()` returns (keys): `QUICKCHR_NAME`, `QUICKCHR_REST_URL`,
`QUICKCHR_REST_BASE`, `QUICKCHR_SSH_PORT`, `QUICKCHR_AUTH`, and the legacy-compat
`URLBASE` (= REST base, includes `/rest`) and `BASICAUTH`. **`BASICAUTH` /
`QUICKCHR_AUTH` are raw `user:password`** — base64-encode for an
`Authorization: Basic …` header. **⚠️ Secret-bearing output:** never log/print these
values, never include them in thrown error messages, and never commit them to
version control (including `.env`, CI logs, or debug artifacts). Prefer redaction
(`***`) in diagnostics and keep values in memory only for the minimum needed scope.
`descriptor()` throws `MACHINE_STOPPED` if the machine isn't running — check status
before using stored ports.

## Port layout

Each machine claims a block of `PORTS_PER_BLOCK` (10) host ports from a `portBase`
(default `9100`; second machine `9110`, etc. — don't hardcode `9100`). Offsets:

| Offset | Service | Guest |
|---|---|---|
| +0 | http / WebFig / REST | 80 |
| +1 | https | 443 |
| +2 | ssh | 22 |
| +3 | api | 8728 |
| +4 | api-ssl | 8729 |
| +5 | winbox | 8291 |
| +6 | monitor (QEMU IPC) | — |
| +7 | serial (QEMU IPC) | — |
| +8 | qga (QEMU IPC) | — |

Pin a service to a known host port with `--forward winbox:8291` (CLI) or an
explicit-`host` `extraPorts` entry; explicit hosts are collision-checked against
this machine's services and other machines'.

## Error codes

`QuickCHRError.code` is one of `ErrorCode` (types.ts). Frequently seen:
`MISSING_QEMU`, `PORT_CONFLICT`, `BOOT_TIMEOUT`, `DOWNLOAD_FAILED`, `SPAWN_FAILED`,
`MACHINE_EXISTS`, `MACHINE_NOT_FOUND`, `MACHINE_STOPPED`, `INVALID_FORWARD_SPEC`,
`INVALID_NETWORK`, `PROVISIONING_VERSION_UNSUPPORTED`, `QGA_UNSUPPORTED`.

## CLI ↔ library parity

| CLI | Library |
|---|---|
| `quickchr add/start <name> …` | `QuickCHR.start({ name, … })` |
| `--forward <spec>` (repeatable) | `extraPorts` (`parseForwardSpec` / `expandForwardSpec`) |
| `--add-network <spec>` (repeatable) | `networks` |
| `quickchr exec <name> "<cmd>"` | `instance.exec(cmd)` |
| `quickchr inspect/env <name>` | `instance.descriptor()` / `subprocessEnv()` |
| `quickchr list` | `QuickCHR.list()` |

Run the CLI without installing: `bunx @tikoci/quickchr <cmd>`.
