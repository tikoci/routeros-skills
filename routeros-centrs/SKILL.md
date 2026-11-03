---
name: routeros-centrs
description: "Use whenever a task touches a real MikroTik RouterOS device or CHR: reading or changing config, running a RouterOS CLI command non-interactively, checking a command before sending it, waiting for a router or a condition, watching a menu change, moving files, discovering neighbors, or doing the same thing across several routers. Reach for centrs (@tikoci/centrs, CLI + Bun/TS) rather than hand-rolling curl against /rest or scripting ssh: it resolves address, credentials, port and protocol from the WinBox address book or a quickchr VM, validates the command before it runs, and returns one structured envelope (data, warnings, tips, meta) over REST, native API, SSH/SFTP, MAC-Telnet or MNDP. Covers what agents miss: `explain` (offline or live), `--json` and where failures print, `retrieve --wait/--until/--query`, NDJSON streams, fan-out, the `--yes` gate, and reading a rejection. Not for booting the CHR (routeros-quickchr-cli, routeros-quickchr) or RouterOS docs (rosetta MCP, routeros-fundamentals)."
---

# Driving RouterOS with centrs

## What this is for

[`@tikoci/centrs`](https://github.com/tikoci/centrs) is a **friendly conduit** to
RouterOS, not a configuration abstraction. You still speak RouterOS; centrs handles
the parts that are tedious and error-prone to do by hand:

- resolving `<router>` to an address, credentials, port, and a protocol;
- **validating a RouterOS-shaped command before it runs**;
- returning the same structured envelope whatever transport carried the call.

Validation and structured diagnostics are the product. Without them it would be a
worse `curl`.

**Reach for centrs when** you need to run a RouterOS command, read state, wait for a
router, or move a file — from a shell script, a test, or an agent loop.

**Don't reach for it** when you need RouterOS *documentation* (use the `rosetta` MCP
or the `routeros-fundamentals` skill), or when you need to *create* the router itself
(use `routeros-quickchr-cli` from a shell, or `routeros-quickchr` for the TypeScript
library — centrs consumes a quickchr VM, it does not boot one).

> **Status and version.** Checked against centrs **0.1.8** (npm `latest`) and
> **0.1.9-next** (npm `next`, `main` as of 2026-11-02). Items marked **(0.1.9)** are
> `@next` only until 0.1.9 is cut; a few of them (marked †) landed on `main` after
> `0.1.9-next.24`, so confirm with `centrs <command> --help`. Run
> `npm view @tikoci/centrs dist-tags` to see what each tag points at, and
> `centrs --version` (0.1.9) to see what you are running. Expect breaking changes
> before 1.0 and exercise writes on lab or disposable targets first.
> [`docs/MATRIX.md`](https://github.com/tikoci/centrs/blob/main/docs/MATRIX.md) is
> the single source of truth for what works today.

## Install and first call

```sh
bun x @tikoci/centrs@next --help                # no install
bun add @tikoci/centrs@next                     # library + local CLI
```

`bun x` works wherever `bunx` does, including sandboxes that ship Bun without the
`bunx` shim. The offline analyzer needs no router and no credentials — the
cheapest way to confirm centrs works at all:

```sh
bun x @tikoci/centrs@next explain '/ip/address print' --json
```

## Flag spelling

Write flags with a **space**, never `=`: `--via native-api`, `--timeout 30s`.
`--via=native-api` and `--validate=false` are rejected as
`input/invalid-command` ("Unknown retrieve flag"), even where `--help` says the `=`
form is accepted. Boolean flags have explicit negatives: `--no-validate`,
`--no-verify`. Durations take a unit (`30s`, `2m`); several flags refuse a bare
number.

With `execute`, put centrs flags **before** `--`. Everything after `--` is the
RouterOS command; a centrs flag found there is refused before anything dials
(0.1.9):

```console
$ centrs execute lab -- '/system/resource/print' --json
[usage/flag-after-separator] `--json` comes after `--`, so it would be sent to RouterOS as part of the command.
Fix: Put centrs flags before `--`: `centrs execute lab --json -- /system/resource/print`
```

## The loop: explain → run → read back

This is the pattern centrs exists for. Analyze the command, run it, read the result
as data.

```sh
# 1. Is this well-formed, and what will it actually do? (offline)
centrs explain '/ip/address/add address=192.0.2.1/24 interface=ether2'

# 2. Run it. Writes need --yes when there is no TTY to prompt on.
centrs execute lab --yes '/ip/address/add address=192.0.2.1/24 interface=ether2'

# 3. Read it back as data, filtered on the router.
centrs retrieve lab /ip/address --query 'interface=ether2' --json
```

### `explain`

Offline (no `<router>`), `explain` opens no connection. It canonicalizes the input,
reports structure and syntax diagnostics with byte spans, says whether the input is
write-shaped, and names the centrs command that would carry it (often a ready
`centrs api … -X PUT -f …` line). Input can also come from `--file <path>` or
piped stdin. It exits **2** when the verdict reaches `--fail-on` (`error` by
default; `warning` or `never`), so it works as a pre-commit or CI gate for `.rsc`
snippets.

**Live `explain <router> '<input>'`** (0.1.9; REST and native API, `CHR-passed`)
adds read-only device evidence: RouterOS's own `:parse` verdict, its syntax
highlighting, and argument names. The analyzed input never executes. Two flags are
live-only:

- `--schema` — describe the path at the cursor: a menu's verbs and submenus, a
  command's arguments with their declared syntax, `print`'s proplist.
- `--complete [--cursor <byte>]` — the device's own completion candidates at the
  cursor (menus, verbs, argument names, values). `--full` lifts the size limits.

```sh
centrs explain lab '/interface/bridge/port/add ' --complete --json
centrs explain --quickchr lab '/ip/firewall/filter' --schema --json
```

Whatever the mode, `pass` means *centrs found nothing wrong*, never that RouterOS
will accept the command: every envelope carries `runtimeAcceptance: "not-proven"`.

## Naming a router

Every router-facing command resolves a **target**:

| You have | Use |
|---|---|
| A CHR booted by quickchr | `--quickchr <name>` — host, port and credentials from the live VM; no credential plumbing |
| A router saved in WinBox | the positional `<router>` — centrs reads `~/.config/tikoci/winbox.cdb` (the WinBox address book **is** the device registry) |
| An address, no CDB record | the positional `<ip>` / `http(s)://host[:port]`, or `--host <host\|url>` with no positional (0.1.8; no CDB lookup), plus `--username` / `--password` or `CENTRS_USERNAME` / `CENTRS_PASSWORD` |
| Nothing yet | `centrs discover` over MNDP; `--save` writes found neighbors into the CDB |

- `--quickchr` is exclusive of positional targets, CDB selectors and
  `--host`/`--port`/`--username`/`--password`; pick one mechanism per call.
- **Never put credentials in the target.** `admin:pass@host` (or a URL with
  `user:pass@`) is refused as `input/invalid-target` (0.1.9), with the password
  masked as `***@`.
- One address saved under two users is ambiguous: pick the record with
  `--match user=<name>` (or `target=<addr>`, or a record type) (0.1.9†).
- `centrs devices init` creates an empty CDB (`--cdb-file` for a custom path); it
  never overwrites an existing one, so bootstrap scripts can run it
  unconditionally. Other subcommands: `list`, `show`, `groups`, `add`, `edit`,
  `set`, `remove`; `devices` is the only command that writes the CDB.
  `devices init --encrypt` / `devices encrypt` create or convert an encrypted CDB
  (0.1.9†).

### Fan out instead of looping

`--quickchr` repeats, and the CDB selectors fan out too. Prefer these to a shell loop
— one envelope, bounded concurrency, per-target errors that do not abort the rest:

```sh
centrs retrieve --quickchr sun --quickchr earth /system/resource --json
centrs execute --group edge --yes '/system/ntp/client/set enabled=yes'
centrs retrieve --all /system/resource --json
```

Selectors: `--group <name>`, `--all`, `--where <attr>=<value>`, `--near`, `--bbox`.
`--default` picks the single reserved `__default__` record. A fan-out envelope's
`data` is `{ summary: { total, ok, failed }, targets: [...] }`; each target
inherits any `meta` it does not repeat from the outer envelope.

An **empty selection** behaves differently for reads and writes (0.1.9): a read
over a group that matches nothing is `ok: true` with a `cdb/empty-group` warning,
but a write (`execute`, mutating `api`, `transfer upload|remove|mkdir|copy`) exits 1
— a typo in a group name no longer passes for a successful bulk write.

## The command map

| Command | Purpose | State |
|---|---|---|
| `retrieve <router> <path>` | Read a menu; `--query`, `--wait`, `--follow`, `--sample` | shipped (REST, native API) |
| `execute <router> '<cli>'` | Run a RouterOS CLI-shaped read/write | shipped (REST, native API, SSH, MAC-Telnet) |
| `api <router> <endpoint>` | Structured passthrough, `gh api` style: `-X PUT`, `-f k=v`, `--query`, `--stream` | shipped (REST, native API) |
| `explain [<router>] '<input>'` | Analyze a command; live evidence with a router | shipped (offline; live REST + native API in 0.1.9) |
| `transfer <router> upload\|download\|list\|remove\|mkdir\|copy` | Device files | shipped (REST, native API, SFTP) |
| `terminal <router>` | Interactive console | shipped (SSH, MAC-Telnet) |
| `discover` | MNDP neighbor discovery, `--save` into the CDB | shipped |
| `devices` | The CDB device registry | shipped |
| `settings` | centrs's own preferences (`centrs.env`) | shipped |
| `mcp` | Scoped stdio MCP server, CDB-gated | shipped |
| `btest` | MikroTik bandwidth test, client or server | shipped |
| `check` | Reachability + health battery | **designed only — not implemented** |

`retrieve` vs `execute` vs `api`: `retrieve` reads a menu; `api` is the structured
operation surface (it can write); `execute` takes a literal RouterOS CLI string and is
the only one that reaches SSH and MAC-Telnet (`execute --via ssh` drives the host's
OpenSSH client, so `ssh` must be on `PATH`). There is no `update` command —
CLI-shaped writes ride `execute`.

`retrieve` and `api` paths must be plain menu names — letters, digits and hyphens
between slashes. Anything else (`/system/reboot#`, `?`) is refused as
`input/invalid-routeros-path` before anything dials, even with `--no-validate`
(0.1.9†). Filter with `--query`, never with characters in the path.

## Read the envelope, not the text

Every call returns one shape, whatever the transport (the exception is `api --raw`,
which strips the envelope and emits bare RouterOS JSON):

```jsonc
{
  "ok": true,
  "data": [ /* the payload */ ],
  "warnings": [],            // always present; non-fatal anomalies about this result
  "tips": [],                // always present; advice that is NOT a problem
  "meta": {
    "target": {},            // resolved target + where each field came from
    "via": "rest-api",       // the protocol actually chosen
    "settings": {},          // which setting won, and from which source
    "validation": {},        // gate stages and their verdicts, when the gate ran
    "operation": { "objectCount": 3 }
  }
}
```

A failure has `ok: false` and an `error` with `code`, `summary`, `remediation`,
`details_url` and, where RouterOS gave one, a `position`. Every code has a page at
`https://tikoci.github.io/centrs/errors/<code>`.

**Pass `--json` (or `--format json`).** `retrieve`, `execute` and `transfer` default
to `--format text`, and text stdout is data only: warnings and the `Tips:` footer
go to **stderr**, and `meta` shows only as the `--verbose` header (0.1.9; before
that, `execute` dropped warnings and tips entirely and `retrieve`/`transfer` mixed
them into stdout). Parsing the text default can appear to work while you never see
a warning such as `transport/write-outcome-unknown`. (`api` already defaults to
JSON.)

**Where the envelope goes.** With `--json`, a one-shot **success** prints on stdout
and a one-shot **failure** prints on **stderr**, with exit 1. A script that runs
`centrs … --json 2>/dev/null` sees an empty stdout and loses the reason for every
failure. Capture both streams and parse whichever holds the envelope. Streams and
`retrieve --wait` are different: they put every envelope, failures included, on
stdout (see below).

### The shape of `data`

- `retrieve` on a list menu returns an **array** of rows; on a singleton
  (`/system/resource`), an object. Projecting exactly one attribute of a singleton
  (`--attribute uptime`) returns the bare value.
- `execute` results are still shape-unstable
  ([centrs#360](https://github.com/tikoci/centrs/issues/360), open, design
  undecided): depending on row count and how centrs carried the command, zero rows
  can come back as an **empty object**, one row as a bare object, N rows as an
  array. The empty object is truthy, so `d ? [d] : []` invents a row. Take the
  count from `meta.operation.objectCount`, and normalize with something that
  excludes it:

  ```js
  const rows = Array.isArray(d)
    ? d
    : d && typeof d === "object" && Object.keys(d).length > 0
      ? [d]
      : [];
  ```

  When you want rows, prefer `retrieve` (or `api`) over `execute '/… print'`.

`tips` and `warnings` are separate channels on purpose. A tip is explicitly *not* a
problem; do not treat a non-empty `tips` array as a failure.

## Reading state: query, wait, follow, sample

All four are `retrieve` flags (0.1.8).

```sh
# Filter on the router, written as after `print where`; repeats are AND-ed.
centrs retrieve lab /interface --query 'type=ether and !disabled' --json

# Wait for a router to answer (e.g. after a reboot), up to a deadline.
centrs retrieve --quickchr sun /system/resource --wait 5m --json

# Wait for a condition: succeeds as soon as any selected row matches.
centrs retrieve lab /routing/ospf/neighbor --wait 2m --until 'state=Full' --json

# Wait for zero rows (a completed read, never silence).
centrs retrieve lab /ip/dhcp-server/lease --query 'status=waiting' --wait 1m --until-empty --json
```

- `--query` / `--filter` uses the `print where` grammar (`mtu>=1500`,
  `(a=1 or b=2)`, bare `disabled` means `=yes`). `~`, `in` and script values fail
  `input/unsupported-query`.
- `--wait <deadline>` always takes a value. It retries refused, reset and timed-out
  connections and unreachable hosts; authentication, TLS, DNS, RouterOS and
  validation errors fail immediately. `--timeout` bounds each request, not the
  wait. The one final envelope — success **or** failure — goes to **stdout**, with
  `meta.operation.wait` holding `stopReason` (`ready`, `condition-met`,
  `deadline-elapsed`, `interrupted`, `failed`), `elapsedMs`, `attempts` and
  `observations`. A deadline that ran out after completed reads is
  `wait/deadline-exceeded`; one that ran out while the router was still down keeps
  the last transport error. Single target only.
- `--follow` keeps a list menu's rows current over native API `listen`: snapshot
  rows, a `synced` line, then one line per change, with an `.id` sweep (`--sweep`,
  default `10s`) for removals RouterOS never sends. With `--query`, rows leaving
  the filter are reported too. Bound it with `--count` / `--duration`.
- `--sample <interval>` re-reads the menu on a timer, over REST or native API. Use
  it for counters (`rx-byte`, `cpu-load`) and state that `listen` never announces.

```sh
centrs retrieve lab /ip/address --follow --count 1 --duration 60s --format ndjson
centrs retrieve lab /interface --sample 5s --count 3 --format ndjson
```

## Consuming streams (NDJSON)

`retrieve --follow`, `retrieve --sample` and `api --stream` emit one envelope per
line. With `--json`/`--format ndjson`, **every** line — including errors — goes to
**stdout**; the exit code is nonzero for any failure, even after good rows. (In text
mode only data rows go to stdout; everything else goes to stderr.)

Branch on **`meta.operation.stream.kind`**, never on line position:

| `kind` | When | `data` | `meta` |
|---|---|---|---|
| `started` | first line, once the preflight passed | `null` | full; request advice is in `tips` |
| `frame` (`--follow`, `api --stream`) / `sample` (`--sample`) | each reply or read | the row(s), or `null` for an `api` `!empty` reply | `operation` only |
| `synced` (`--follow`) | snapshot finished | — | full |
| `summary` | exactly once, last | success only | full |

- Read the outcome from `meta.operation.stream` on the **summary**, on success and
  failure alike: `stopReason` (`completed`, `count-reached`, `duration-elapsed`,
  `interrupted`, `routeros-error`, `transport-error`), `frames`, `rows`, `empty`,
  `durationMs`. A failed summary is `ok: false` with an `error` and **no `data`**;
  rows already emitted are partial results, not a success.
- A stream that fails its preflight (bad target, validation, wrong transport) emits
  one error envelope and never a `started` line.
- `--count` and `--duration` are **centrs** bounds. `api`'s `-f count=3` and
  `-f duration=2s` are **device** arguments. `--count` counts rows (`!re`) only;
  `!empty` replies never use it up.
- A local stop is not a device `!done`. A frame received after centrs stopped has
  `afterStop: true` — a cancellation `!empty` is not evidence of an empty table.
  If the router never acknowledges the `/cancel`, the summary carries a
  `transport/cancel-unacknowledged` warning.
- Frames carry `observedAt` (host receipt time, ISO 8601).

`api --stream` (native API only) is the literal wire, one line per reply:

- **Follow changes** with the `<menu>/listen` endpoint — `api lab
  /ip/address/listen` implies `--stream` and native API. `ip/address/*1/listen`
  follows one row. Frames keep the device's `.id`, `.dead` and `.section`
  verbatim.
- **GET `<menu>` + `--stream`** streams one print and completes; it does not
  follow.
- **POST a command + `--stream`** runs it with its fields:
  `api lab /tool/ping -X POST -f address=192.0.2.1 -f count=3 --stream --yes`.
  Streaming never makes a command read-only, so the write gate still applies.
  Terminal attributes from RouterOS's `!done` land in the summary's `data.done`.
- A filtered or projected `listen` is sent as typed, with a tip saying what
  RouterOS will not report: `tip/filtered-follow` (rows leaving the filter, and
  deletes, are not sent) and `tip/follow-proplist` (a proplist without
  `.id,.dead` strips deletes to empty rows). For stateful filtered following, use
  `retrieve --follow --query`.
- `--raw` drops the envelope and the `started` line; it is not the structured
  stream contract. `--stream` and `/listen` are single target and fail over REST
  (`transport/capability-unsupported` — there is no polling fallback).

## Writing

Write-shaped commands are gated. With a TTY, centrs prompts; without one it refuses:

```console
$ centrs execute lab '/ip/address/add address=192.0.2.1/24 interface=ether2'
[usage/confirmation-required] Write-shaped RouterOS execute commands require explicit confirmation.
Fix: Pass `--yes` in non-interactive automation, or answer `yes` at the TTY prompt after reviewing the command.
```

- **A non-interactive `execute` or `api` write needs `--yes`**, as does a mutating
  `transfer` fan-out across several routers. Overwriting an existing device file is
  a *separate* gate: `transfer --force` / `--overwrite`.
- Reads stay reads: a bare menu path (`/system/identity`) and pure script functions
  (`:put [:serialize to=json [/system/resource/print as-value]]`, `:convert`,
  `:timestamp`, …) need no `--yes` (0.1.9). Commands nested inside their arguments
  are still checked, and an output file (`file=`, `file-name=`) makes it a write.
- **Never blindly retry a write.** centrs never replays a write it already sent
  (0.1.9). When the connection drops after sending, the envelope carries
  `transport/write-outcome-unknown`: the write **may have run**. Read the state back
  before trying again. The same warning rides a permission refusal partway through a
  multi-statement script, because the statements before it already ran.
- Never disable validation to make a write succeed: validation is the product, and
  `--no-validate` should be a deliberate, explained choice, not a workaround.

### CMR fleets

`execute <controller> --cmr --labels <expr> -- '<command>'` (0.1.9, RouterOS
7.26beta1+ with the `cmr` package) runs one validated command on the CMR clients a
controller manages. Only the controller is dialed; each client checks the command
with `:parse` first, and a client that rejects it is not sent it. One `--yes` covers
the whole selection, and a timed-out client is `cmr/outcome-unknown`, never retried.

Treat **any** login on a CMR controller as able to write to the whole fleet: on
7.26beta1, CMR `run-script` ran writes for a controller login whose group lacked
`write` ([centrs#456](https://github.com/tikoci/centrs/issues/456)), and centrs
warns `cmr/caller-policy-not-enforced`. Keep `--cmr` and CMR fleet commands
(`/cmr/device/reboot`, `run-script`, `upgrade`, …) out of read-only agent profiles.
Plain `execute`/`api` fleet commands name the devices they reach in the gate, and
warn `cmr/rule-selects-every-device` for a VLAN rule with no labels.

## Files

```sh
centrs transfer <router> upload ./routeros-7.24.4.npk
centrs transfer <router> list
centrs transfer <router> download flash/backup.rsc ./backup.rsc
```

RouterOS's `/file` contents write caps at **60 KB**, so REST and native API cannot
carry a large upload. With no `--via` pinned, centrs notices the size and
auto-selects SFTP. The SSH clients run with `BatchMode=yes`, so SFTP never sends a
password: on a device with no SSH key installed, the auto-hop fails on
authentication rather than on size. A CDB record's `via=ssh` now selects SFTP, and
`--via ssh` is accepted as an alias for `sftp` (0.1.9†). `download` replaces an
existing local file, like `curl -o`.

## When a command is rejected

Validation runs in **two stages**, and which one refused you is most of the
diagnosis:

1. **Offline** — the same analyzer `explain` uses runs first, with no connection.
   A syntax fault is refused here with the offending byte span.
2. **Device** — `:parse` plus `/console/inspect` on the router, for the semantic
   half offline analysis cannot decide.

`--no-validate` disables both. A clean offline pass is necessary, never sufficient.

Every command renders errors the same way (0.1.8), and shows the router's own words
without `--verbose`:

```text
[code] summary
At:          RouterOS's (line N column M), or the offline byte span
Device said: RouterOS's own message
Fix:         the next step
Details:     https://tikoci.github.io/centrs/errors/<code>
```

Branch on the code:

| Code | Meaning | Do |
|---|---|---|
| `validation/package-missing` | The menu exists, but behind a package this device lacks (`error.context.packages`) | Install the package, or pick another router |
| `validation/menu-unavailable` | Gated by hardware, build or version (`error.context.gates`) | Not fixable by editing the command |
| `validation/unknown-path` | No published RouterOS build has this path | Check spelling with `explain` or rosetta |
| `validation/syntax` | A real syntax fault, or a rejection centrs could not pin to one segment | Run `centrs explain '<command>'` and read `At:` |
| `routeros/permission-denied` | The RouterOS user's group lacks the policy (0.1.9) | Fix the user's group; never retried |
| `transport/auth-failed` | RouterOS refused the login | Check credentials |
| `transport/edge-auth-failed` | A 401/403 from something in front of RouterOS — proxy, tunnel, WAF (0.1.9) | Fix the edge, not RouterOS |

Before 0.1.8, an absent menu or missing package came back as `validation/syntax`
with "fix the quotes" advice; on 0.1.8+ treat `validation/syntax` as a real syntax
problem, and use `explain` to find it rather than re-quoting by guesswork. Before
0.1.9, a REST permission refusal was reported as `transport/connection-closed`.

## Known rough edges

Behaviors to plan around rather than debug from scratch.

- **A hang can be the success path.** `/system/device-mode/update container=yes`
  blocks by design while RouterOS waits for a *hard power-cycle* to confirm. centrs
  reports that as a plain timeout on every transport
  ([centrs#363](https://github.com/tikoci/centrs/issues/363), open). For a CHR, set
  device-mode at VM creation and let quickchr do the power-cycle. The same applies
  to `/system/reboot`, package installs and unbounded `/ping`; afterwards, use
  `retrieve --wait` to see the router come back.
- **REST timeouts cap at 60 s.** `--timeout` above that is rejected on `rest-api`.
  For a long `/ping`, traffic test or install, use `--via native-api` with a
  `--timeout` long enough for it (only REST has the cap), or `api … --stream` to
  see replies as they come.
- **Output can contain secrets.** centrs redacts credentials it *holds*; it does not
  filter values RouterOS *returns*
  ([centrs#359](https://github.com/tikoci/centrs/issues/359), closed won't-fix).
  The boundary is RouterOS's own `sensitive` policy: give an agent or CI job a
  RouterOS user whose group lacks `sensitive`. Arbitrary file contents
  (`/file print detail`) are outside that policy, so prefer targeted reads over
  broad dumps, especially through MCP, where output leaves the machine.
- **macOS first call.** From a desktop app, the first router call can fail with
  `FailedToOpenSocket` while macOS's Local Network permission prompt waits for a
  click. Allow it, then retry once.
- **`check` is not implemented.** It is `designed` in the matrix; do not build on
  it.

## MCP

`centrs mcp` serves stdio tools gated by the CDB: only registered devices are
reachable, credentials never leave the CDB, and a device accepts writes only when
its record carries the comment key `mcp=rw` (plus `confirm: true` on the call).
`centrs_validate` runs both validation stages without executing — the dry-run to
reach for before `centrs_execute`. `centrs_explain` needs neither CDB nor device.

## Authoritative docs & related skills

- centrs repo:
  [README](https://github.com/tikoci/centrs/blob/main/README.md) ·
  [`docs/CLI.md`](https://github.com/tikoci/centrs/blob/main/docs/CLI.md) (generated
  full flag reference) ·
  [`docs/CONSTITUTION.md`](https://github.com/tikoci/centrs/blob/main/docs/CONSTITUTION.md)
  (envelope, error model, protocol selection) ·
  [`docs/MATRIX.md`](https://github.com/tikoci/centrs/blob/main/docs/MATRIX.md)
  (what actually works) ·
  [`commands/`](https://github.com/tikoci/centrs/tree/main/commands) (per-command
  contract and worked examples) ·
  [`CHANGELOG.md`](https://github.com/tikoci/centrs/blob/main/CHANGELOG.md) (what
  `@next` adds over `@latest`)
- **routeros-quickchr-cli** / **routeros-quickchr** — boot the CHR that `--quickchr`
  then targets: the `-cli` skill for the shell path, the other for TypeScript
  harnesses. The pair is the normal grounding loop: quickchr creates the router,
  centrs drives it.
- **routeros-fundamentals** / **routeros-scripting** — what to actually say to
  RouterOS once centrs can reach it.
- **routeros-syntax-inspection** — `/console/inspect` and `:parse`, the machinery
  behind centrs's validation gate and live `explain`.
- **routeros-cmr** — CMR controllers and clients, which `execute --cmr` drives.
- **routeros-mac-telnet** / **routeros-mndp** — the L2 protocols behind
  `execute --via mac-telnet` and `discover`.

> This skill is a starting point, not a manual. `centrs <command> --help`,
> `docs/CLI.md` and `commands/<name>/` in the repo are authoritative and versioned;
> when they disagree with this file, they win — and the disagreement is worth
> reporting at <https://github.com/tikoci/centrs/issues>.
