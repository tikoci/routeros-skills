# quickchr API reference (for automation)

A fuller map of the `@tikoci/quickchr` library surface than the SKILL body. This is
a navigational summary — the **authoritative, versioned** source is the quickchr
[`MANUAL.md`](https://github.com/tikoci/quickchr/blob/main/MANUAL.md) and the JSDoc
in [`src/lib/types.ts`](https://github.com/tikoci/quickchr/blob/main/src/lib/types.ts).
Verify signatures there before relying on exact shapes; this doc favors stable
concepts over version-specific detail. Installed from npm as `@tikoci/quickchr`
(`bun add @tikoci/quickchr`, or `bunx @tikoci/quickchr <cmd>` without installing).

## Trigger terms

quickchr, `@tikoci/quickchr`, CHR, Cloud Hosted Router, ground/validate RouterOS
config against a real router, disposable RouterOS VM, CHR integration test, QEMU
RouterOS, `QuickCHR.start`, `ChrInstance`, `exec`/`rest` against CHR, host↔guest
port-forward, guest→host UDP, MNDP/L2 capture from CHR.

## `QuickCHR.start(opts)` → `ChrInstance`

Returns a **REST-ready** instance: download, boot, and provisioning have all
completed when the promise resolves (background/library use). Common `StartOptions`:

| Field | Meaning / default |
|---|---|
| `name` | machine name (must not start with `-`); auto-generated from version+arch if omitted |
| `channel` | one of `"stable"`, `"long-term"`, `"testing"`, `"development"` (default `stable`) |
| `version` | pinned RouterOS, e.g. `"7.23.1"`. **Mutually exclusive with `channel`** — `start()` takes `version` when set and never looks at `channel`, so an inconsistent pair is resolved silently in `version`'s favour, not rejected. A channel name passed as `version` is accepted with a warning. |
| `arch` | `"x86"` or `"arm64"` or `"auto"` (default: host arch; `"auto"` is an explicit synonym for the default) |
| `cpu` | vCPUs (default `1`) |
| `mem` | MiB RAM (default `512`; `1024` for cross-arch TCG) |
| `background` | `true` (default, detached) / `false` (foreground, serial on stdio) |
| `secureLogin` | `true` → managed `quickchr` user with a stored password; `false`/omitted → open admin. Inverse alias: `noAuth` (`noAuth: true` ≙ `secureLogin: false`; `secureLogin` wins if both set). Prefer `secureLogin`. **Must be explicitly `true` to take effect** — provisioning tests `secureLogin === true`, so omitting it leaves `admin` password-less (observed: `inspect --json` reports `"password": ""`). Some doc comments in `types.ts` still say it defaults to true; the code does not. |
| `user` | `{ name, password }` custom user (provisioning, ≥ 7.20.8) |
| `disableAdmin` | disable default admin after boot (provisioning, ≥ 7.20.8) |
| `packages` | `string[]` extra packages to install (provisioning, ≥ 7.20.8) |
| `installAllPackages` | install all packages from all_packages.zip (overrides `packages`) |
| `license` | one-shot trial/license at start (`"p1"` / `"p10"` / `"unlimited"` or `LicenseOptions`) |
| `deviceMode` | `/system/device-mode` config (provisioning, ≥ 7.20.8) |
| `networks` | `NetworkSpecifier[]` — extra NICs (see networking) |
| `extraPorts` | custom host→guest forwards — `PortMapping[]` with `proto` `"tcp"` or `"udp"` |
| `portBase` | first port of the 10-port block (auto from `9100` if omitted) |
| `excludePorts` | `ServiceName[]` to exclude (e.g. `["winbox", "api-ssl"]`) |
| `bootSize` | resize boot disk e.g. `"512M"` / `"2G"` (needs `qemu-img`; auto-converts to qcow2) |
| `bootDiskFormat` | `"qcow2"` (snapshots + resize) or `"raw"` |
| `extraDisks` | `string[]` extra blank qcow2 disks e.g. `["512M", "1G"]` |
| `timeoutExtra` | extra ms added to computed boot timeout |
| `onProgress` | `(msg: string) => void` progress callback (debug lines only when `QUICKCHR_DEBUG=1`) |
| `installDeps` | auto-install missing host deps |
| `dryRun` | print resolved options + QEMU command, don't start |

The full option set + defaults are in `StartOptions` (types.ts). Other static
entry points: `QuickCHR.list()`, `QuickCHR.get(name)`, `QuickCHR.stop(name)`.

## `ChrInstance`

**Methods:**

| Method | Purpose |
|---|---|
| `rest(path, init?)` | REST call → parsed JSON |
| `exec(cmd, opts?)` | run a CLI command/script → `{ output, via }`. `opts.via`: `auto`/`rest`/`ssh`/`console`/`qga` |
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

**Properties:** `name`, `state`, `ports`, `restUrl`, `sshPort`, `portBase`,
`captureInterface` (`"lo0"` on macOS, `"any"` on Linux), `hostGatewayIp`
(`"10.0.2.2"` — the host as seen from the guest). Since 0.4.8 the old name
`tzspGatewayIp` is a deprecated alias carrying the identical value; it is due
for removal no earlier than 0.5.0, and the value was never TZSP-specific — it
carries any guest→host UDP.

### `exec` details (what you otherwise need `types.ts` for)

```ts
type ExecTransport = "auto" | "rest" | "ssh" | "console" | "qga";
interface ExecOptions { via?: ExecTransport; user?: string; password?: string; timeout?: number; }
interface ExecResult  { output: string; via: ExecTransport; }
```

- Single command per `exec()` call — RouterOS `/rest/execute` runs one script
  statement; multi-line `\n`-joined strings may silently drop after the first line.
  Call `exec()` multiple times or wrap in `:do { /cmd1; /cmd2 }`.
- Some RouterOS commands return HTTP 200 with an error string in `output`
  (e.g. `"doAdd Agent not implemented"`); `exec()` does not parse soft errors —
  inspect `output` yourself.

### Connection surface for child processes

`subprocessEnv()` returns (keys): `QUICKCHR_NAME`, `QUICKCHR_REST_URL`,
`QUICKCHR_REST_BASE`, `QUICKCHR_SSH_PORT`, `QUICKCHR_AUTH`, and the legacy-compat
`URLBASE` (= REST base, includes `/rest`) and `BASICAUTH`. **`BASICAUTH`/
`QUICKCHR_AUTH` are raw `user:password`** — base64-encode for an
`Authorization: Basic ***` header. **⚠️ Secret-bearing output:** never log/print these
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

`QuickCHRError.code` is one of `ErrorCode` (types.ts). Full set:
`MISSING_QEMU`, `MISSING_FIRMWARE`, `MISSING_BUN`, `MISSING_UNZIP`,
`PORT_CONFLICT`, `BOOT_TIMEOUT`, `QGA_UNSUPPORTED`, `QGA_TIMEOUT`,
`DOWNLOAD_FAILED`, `DOWNLOAD_STALLED`, `DOWNLOAD_TOO_SLOW`, `SPAWN_FAILED`,
`MACHINE_EXISTS`, `MACHINE_NOT_FOUND`, `MACHINE_RUNNING`, `MACHINE_STOPPED`,
`MACHINE_LOCKED`, `INVALID_VERSION`, `INVALID_ARCH`, `INVALID_NAME`,
`INVALID_ARGUMENT`, `INVALID_DISK_SIZE`, `INVALID_SIZE_STRING`, `INVALID_NETWORK`,
`INVALID_FORWARD_SPEC`, `INVALID_SETTING_KEY`, `INVALID_SETTING_VALUE`,
`PROVISIONING_VERSION_UNSUPPORTED`, `INSUFFICIENT_DISK_SPACE`, `STATE_ERROR`,
`EXEC_FAILED`, `PROCESS_FAILED`, `NETWORK_UNAVAILABLE`.

Frequently seen in grounding: `MISSING_QEMU`, `PORT_CONFLICT`, `BOOT_TIMEOUT`,
`DOWNLOAD_FAILED`, `SPAWN_FAILED`, `MACHINE_EXISTS`, `MACHINE_STOPPED`,
`INVALID_FORWARD_SPEC`, `INVALID_NETWORK`, `PROVISIONING_VERSION_UNSUPPORTED`,
`QGA_UNSUPPORTED`.

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
