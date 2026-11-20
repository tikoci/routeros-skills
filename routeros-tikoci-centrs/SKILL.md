---
name: routeros-tikoci-centrs
description: "Use whenever a task touches a real MikroTik RouterOS device or CHR: reading or changing config, running a RouterOS CLI command non-interactively, checking a command before sending it, waiting for a router or a condition, watching a menu change, moving files, discovering neighbors, or doing the same thing across several routers. Reach for centrs (@tikoci/centrs, CLI + Bun/TS) rather than hand-rolling curl or scripting ssh: it resolves address, credentials, port and protocol from the WinBox address book or a quickchr VM, validates the command before it runs, and returns one structured envelope (data, warnings, tips, meta) over REST, native API, SSH/SFTP, MAC-Telnet or MNDP. Covers what agents miss: `explain` (offline or live), `--json` and where failures print, `retrieve --wait/--until/--query`, NDJSON streams, fan-out, the `--yes` gate, 60 s limits, reading a rejection. Not for booting the CHR (routeros-tikoci-quickchr-cli, routeros-tikoci-quickchr) or RouterOS docs (rosetta MCP, routeros-fundamentals)."
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
(use `routeros-tikoci-quickchr-cli` from a shell, or `routeros-tikoci-quickchr` for the TypeScript
library — centrs consumes a quickchr VM, it does not boot one).

> **Status and version.** Written for centrs **0.1.10**, which both npm dist-tags
> (`latest` and `next`) pointed at when this was checked, and exercised against
> CHR 7.25.1. Run `centrs --version`; on an older build, upgrade rather than work
> around it. `npm view @tikoci/centrs dist-tags` shows what the tags point at now.
> Unreleased changes on centrs `main` that alter codes or fields are listed under
> [Coming in 0.2.0](#coming-in-020). Expect breaking changes before 1.0 and
> exercise writes on lab or disposable targets first.
> [`docs/MATRIX.md`](https://github.com/tikoci/centrs/blob/main/docs/MATRIX.md) is
> the single source of truth for what works today.

## Install and first call

```sh
bun x @tikoci/centrs@0.1.10 --help              # no install, pinned
bun add @tikoci/centrs@0.1.10                   # library + local CLI
```

Pin an exact version (as above) for a script that must not change under you.
`@latest` and `@next` are moving release channels: use them to track releases,
not to pin. The offline analyzer needs no router and no credentials — the
cheapest way to confirm centrs works at all:

```sh
bun x @tikoci/centrs@0.1.10 explain '/ip/address print' --json
```

## Flag spelling

Value flags take either form: `--via native-api` or `--via=native-api` (the `=`
form is accepted since 0.1.10). A value flag with nothing after it fails
`usage/missing-flag-value`, and a following `--option` is not taken as its
value — except by the password flags (`--password`, `--cdb-password`), which take
the next word literally even when it looks like a flag: `--password --json`
makes `--json` the password. Durations take a unit (`30s`, `2m`); several flags refuse a bare number.

Turn a boolean off with its negative: `--no-validate`, `--no-verify`. Do not write
`--validate=false`: `retrieve` refuses it as `input/invalid-command` ("takes no
value"), while `execute` and `api` accept it, so the negative is the spelling that
works everywhere. `centrs help <command>` (or `--help <command>`) prints one
command's help.

With `execute`, put centrs flags **before** `--`. Everything after `--` is the
RouterOS command; a centrs flag found there is refused before anything dials:

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
`centrs api …` line). Input can also come from `--file <path>` or
piped stdin. It exits **2** when the verdict reaches `--fail-on` (`error` by
default; `warning` or `never`), so it works as a pre-commit or CI gate for `.rsc`
snippets.

**Live `explain <router> '<input>'`** (REST and native API, `CHR-passed`)
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
| An address, no CDB record | the positional `<ip>` / `http(s)://host[:port]`, or `--host <host\|url>` with no positional (no CDB lookup), plus `--username` / `--password` or `CENTRS_USERNAME` / `CENTRS_PASSWORD` |
| Nothing yet | `centrs discover` over MNDP; `--save` writes found neighbors into the CDB |

- `--quickchr` is exclusive of positional targets, CDB selectors and the
  connection overrides (`--host`, `--port`, `--username`, `--password`,
  `--ssh-key`): `usage/conflicting-flags`. Pick one mechanism per call.
- **SSH to a quickchr VM needs `--secure-login` at its first boot.** centrs logs
  in over SSH (`execute --via ssh`, `transfer --via sftp`, `terminal --quickchr`)
  only with the verified key quickchr creates for a machine *first booted* with
  `--secure-login` and no `--add-user`. There is no agent-key or password
  fallback; without that key the call fails `quickchr/ssh-auth-unavailable`, and
  a machine that already booted has to be recreated to get one. REST and native
  API work either way.
- **Never put credentials in the target.** `admin:pass@host` (or a URL with
  `user:pass@`) is refused as `input/invalid-target`, with the password
  masked as `***@`.
- One address saved under two users is ambiguous: pick the record with
  `--match user=<name>` (or `target=<addr>`, or a record type).
- A CDB record can pin a port per transport with the comment keys `www-port`,
  `www-ssl-port`, `api-port`, `api-ssl-port` and `ssh-port`; each beats the
  all-transport `port=` key.
- `centrs devices init` creates an empty CDB (`--cdb-file` for a custom path); it
  never overwrites an existing one, so bootstrap scripts can run it
  unconditionally. Other subcommands: `list`, `show`, `groups`, `add`, `set`,
  `remove` (`edit` is reserved). `devices init --encrypt` / `devices encrypt`
  create or convert an encrypted CDB.
- **What writes the CDB:** `devices`, `discover --save`, and the MCP server's
  `centrs_devices` and `centrs_discover` (`save`) tools. Writes take a
  `<cdb>.lock` file and re-check the revision they loaded, so concurrent writers
  no longer lose each other's changes: a stale write is retried, and a lock held
  past 10 s fails `cdb/locked`.

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
inherits any `meta` it does not repeat from the outer envelope. `api` fan-out exits
`0` when all targets succeed, `2` on a partial failure, `1` when all fail.

An **empty selection** behaves differently for reads and writes: a read
over a group that matches nothing is `ok: true` with a `cdb/empty-group` warning,
but a write (`execute`, mutating `api`, `transfer upload|remove|mkdir|copy`) exits 1
— a typo in a group name does not pass for a successful bulk write.

## The command map

| Command | Purpose | State |
|---|---|---|
| `retrieve <router> <path>` | Read a menu; `--query`, `--wait`, `--follow`, `--sample` | shipped (REST, native API) |
| `execute <router> '<cli>'` | Run a RouterOS CLI-shaped read/write | shipped (REST, native API, SSH, MAC-Telnet) |
| `api <router> <endpoint>` | Structured passthrough, `gh api` style: `-X PUT`, `-f k=v`, `--query`, `--stream` | shipped (REST, native API) |
| `explain [<router>] '<input>'` | Analyze a command; live evidence with a router | shipped (offline; live over REST + native API) |
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

**Paths.** A `retrieve` path must be plain menu names — letters, digits and
hyphens between slashes. `api` normalizes its endpoint first (`ip/address`,
`/rest/ip/address` and `'ip address'` are all `/ip/address`), and then also takes
a trailing row id (`ip/address/*1`, for GET, PATCH and DELETE; PATCH and DELETE
*need* it) or a trailing `/listen`. Anything else (`/system/reboot#`, `?`) is
refused as `input/invalid-routeros-path` before anything dials, even with
`--no-validate`. Filter with `--query`, never with characters in the path.

**`api` methods map to RouterOS commands, literally:** `GET` → `print`/`get`,
**`PUT` → `add`**, `PATCH` → `set`, `DELETE` → `remove`, `POST` → any command
(`-X POST` on `<menu>/<command>`). `PUT` is RouterOS's create, not `POST`; centrs
never rewrites the method, and tips `tip/rest-verb-mapping` when a bare-collection
`POST` carries create-looking fields. A menu without records (`/system/identity`)
has no row to PATCH: use `-X POST` on `system/identity/set`.

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
`detailsUrl` and, where RouterOS gave one, a `position`. Every code has a page at
`https://tikoci.dev/centrs/errors/<code>/` (0.1.10 still prints the older
`tikoci.github.io/centrs/errors/<code>` links, which redirect there over plain
HTTP; some agent fetch tools refuse that hop, so fetch the `tikoci.dev` form).

**Values are strings.** RouterOS returns every value as a string on both
transports (`"cpu-load": "0"`, `"disabled": "false"`), and centrs does not coerce
them. Convert before comparing numbers.

**Pass `--json` (or `--format json`).** `retrieve`, `execute` and `transfer` default
to `--format text`, and text stdout is data only: warnings and the `Tips:` footer
go to **stderr**, and `meta` shows only as the `--verbose` header. Parsing the
text default can appear to work while you never see a warning such as
`transport/write-outcome-unknown`. (`api` already defaults to JSON.)

**Where the envelope goes.** With `--json`, a one-shot **success** prints on stdout
and a one-shot **failure** prints on **stderr**, with exit 1. A script that runs
`centrs … --json 2>/dev/null` sees an empty stdout and loses the reason for every
failure. Capture both streams and parse whichever holds the envelope. Streams and
`retrieve --wait` are different: once the command is running they put every
envelope, failures included, on stdout (see below). A usage error caught while
parsing the command line (a bad or missing flag value) still goes to stderr in
every mode, so when stdout is empty, read stderr and the exit status.
`transfer download <file> -` writes the file bytes to stdout, so its envelope goes
to stderr even on success.

### The shape of `data`

- `retrieve` on a list menu returns an **array** of rows; on a singleton
  (`/system/resource`), an object. Projecting exactly one attribute of a singleton
  (`--attribute uptime`) returns the bare value.
- `execute` results are still shape-unstable (centrs's matrix carries it as a
  surface-contract theme; [centrs#360](https://github.com/tikoci/centrs/issues/360)
  is its history): depending on row count and how centrs carried the command,
  zero rows can come back as an **empty object**, one row as a bare object, N
  rows as an array, and a script's output as `{ "ret": "<text>" }`. The empty
  object is truthy, so `d ? [d] : []` invents a row. Take the count from
  `meta.operation.objectCount`, and normalize with something that excludes it:

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

All four are `retrieve` flags.

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
  `input/unsupported-query`. A query always returns an array, even on one match.
- `--wait <deadline>` always takes a value. It retries refused, reset and timed-out
  connections and unreachable hosts; authentication, TLS, DNS, RouterOS and
  validation errors fail immediately. `--timeout` bounds each request, not the
  wait. The one final envelope — success **or** failure — goes to **stdout**.
  Once the target has resolved, it carries `meta.operation.wait`: `stopReason`
  (`ready`, `condition-met`, `deadline-elapsed`, `interrupted`, `failed`),
  `elapsedMs`, `attempts` and `observations` (a target that fails to resolve fails
  at once, without it). When the deadline runs out, the error is the last
  retryable transport error if one came after the last completed read, and
  `wait/deadline-exceeded` otherwise. Reads start one second apart, start to
  start, never overlapping; `--sample <interval>` with `--wait` only sets that
  cadence, and the result is still one envelope, not a stream. `--wait` proves the
  router answers, not that it went down first: right after a reboot command, the
  first read can succeed before the router stops. Single target only.
- `--follow` keeps a list menu's rows current over native API `listen` (see
  [Follow frames](#follow-frames)). Bound it with `--count` / `--duration`.
- `--sample <interval>` (without `--wait`) re-reads the menu on a timer, over REST
  or native API, one line per complete read. Use it for counters (`rx-byte`,
  `cpu-load`) and for state `listen` never announces.

```sh
centrs retrieve lab /ip/address --follow --count 1 --duration 60s --format ndjson
centrs retrieve lab /interface --attributes name,rx-byte --sample 5s --count 3 --format ndjson
```

## Consuming streams (NDJSON)

`retrieve --follow`, `retrieve --sample` and `api --stream` emit one envelope per
line. With `--json`/`--format ndjson`, **every** line — including errors — goes to
**stdout**; the exit code is nonzero for any failure, even after good rows. (In text
mode only data rows go to stdout; everything else goes to stderr.)

Branch on **`meta.operation.stream.kind`**, never on line position. The three modes
share `started` and `summary` but differ in between:

| Mode | Lines in order | Summary counts in `meta.operation.stream` | `--count N` stops after |
|---|---|---|---|
| `retrieve --follow` | `started`, snapshot `frame`s, `synced` (if the snapshot finishes), live `frame`s, `summary` | `frames`, `snapshot`, `changes`, `sweeps`, `synced` | N **live** frames (snapshot frames never count) |
| `retrieve --sample` | `started`, `sample` per read, `summary` | `samples` | N complete samples |
| `api --stream` | `started`, `frame` per wire reply, `summary` | `frames`, `rows`, `empty` | N `!re` rows (`!empty` never counts) |

- Every summary also carries `stopReason` (`completed`, `count-reached`,
  `duration-elapsed`, `interrupted`, `routeros-error`, `transport-error`) and
  `durationMs`. Read the outcome there on success and failure alike. A failed
  summary is `ok: false` with an `error` and **no `data`**; lines already emitted
  are partial results, not a success.
- `started`, `synced` and `summary` carry the full `meta`; `frame` and `sample`
  lines carry only `meta.operation`. Request advice arrives in the `started`
  line's `tips`.
- A stream that fails its preflight (bad target, validation, wrong transport) emits
  one error envelope and never a `started` line.
- `--count` and `--duration` are **centrs** bounds. `api`'s `-f count=3` and
  `-f duration=2s` are **device** arguments.

### Follow frames

A `retrieve --follow` frame's `meta.operation.stream` has `index`, `observedAt`
(host receipt time, ISO 8601), `phase` (`snapshot` or `live`), `change`, `id` and
`source` (`print`, `listen`, `membership` or `sweep`):

- `change: "upsert"` — `data` is the latest full row; replace what you hold for `id`.
- `change: "removed"` — `data` is **`null`**; drop `id`. The id is always in
  `meta.operation.stream.id`, even when `--attributes` leaves `.id` out of `data`.

Apply the lines in order and you hold the menu's state at `synced`; after that,
each frame is one change. A follow that stops or fails before `synced` (a short
`--duration`, an error during the snapshot) ends with `synced: false` in its
summary: treat the snapshot rows you got as partial. Changes are coalesced state, not an event log: a row
created and deleted within about 200 ms may never appear.

- **The sweep** (`--sweep`, default `10s`) re-reads the `.id`s and reports rows
  that vanished without a `listen` notice (view menus such as `/ip/route` never
  send one) as `removed` with `source: "sweep"`. `--sweep 0` turns it off, with a
  `tip/follow-sweep-off`.
- **Filtered follow (`--query`) has a blind spot.** The `listen` stays unfiltered;
  for each id it reports, centrs asks the router whether the row matches now, so a
  row that enters or leaves the filter *through a change `listen` reports* is
  reported as an upsert or a removal (`source: "membership"`). The sweep also
  catches rows that leave the filter silently (a decreasing address-list
  `timeout`). But a row that **starts** matching through a change `listen` never
  reports (a counter, a timer) is never picked up, and a silent field change is never repaired. Use
  `--sample` for that kind of state.
- `listen` never reports hot counters (`rx-byte`, firewall `bytes`) or some
  protocol state; the follow is correct but quiet there.

### `api --stream`

`api --stream` (native API only) is the literal wire, one line per reply:

- **Follow changes** with the `<menu>/listen` endpoint — `api lab
  /ip/address/listen` implies `--stream` and native API. `ip/address/*1/listen`
  follows one row. Or POST `<menu>/print` with `-f follow=` / `-f follow-only=`.
  Frames keep the device's `.id`, `.dead` and `.section` verbatim.
- **GET `<menu>` + `--stream`** streams one print and completes; it does not
  follow.
- **POST a command + `--stream`** runs it with its fields:
  `api lab /tool/ping -X POST -f address=192.0.2.1 -f count=3 --stream --yes`.
  Streaming never makes a command read-only, so the write gate still applies.
  Terminal attributes from RouterOS's `!done` land in the summary's `data.done`.
- A frame's `reply` is `re` (a row) or `empty` (`!empty`, `data: null`). A frame
  received after centrs stopped has `afterStop: true`: a cancellation `!empty` is
  not evidence of an empty table. If the router never acknowledges the `/cancel`,
  the summary carries `transport/cancel-unacknowledged`.
- **A filtered follow on the wire is incomplete.** A following request (a
  `listen`, or a POST `print` with `follow`/`follow-only`) with any query word
  other than `.id=` is sent as typed, with `tip/filtered-follow`: RouterOS reports
  neither rows leaving the filter nor deletes. Following one row (`.id=*N`, or
  `<menu>/*N/listen`) does get that row's delete. A proplist without `.id,.dead` strips deletes to empty rows
  (`tip/follow-proplist`). For a filtered follow you can keep state from, use
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
  `:timestamp`, …) need no `--yes`. Commands nested inside their arguments
  are still checked, and an output file (`file=`, `file-name=`) makes it a write.
- **Never blindly retry a write.** centrs never replays a write it already sent.
  When the connection drops after sending, the envelope carries
  `transport/write-outcome-unknown`: the write **may have run**. Losing the reply
  does not stop the command on the router: over REST it keeps running until it
  finishes or reaches RouterOS's 60-second limit, and a shorter centrs `--timeout`
  can report `transport/timeout` before either. Read the state back before trying
  again. The same warning rides a permission refusal partway through a
  multi-statement script, because the statements before it already ran.
- Never disable validation to make a write succeed: validation is the product, and
  `--no-validate` should be a deliberate, explained choice, not a workaround.

### Long-running commands

There is no single 60-second limit; there are three, and `--timeout` lifts none of
them:

- **REST** caps every request at 60 s. A `--timeout` above that is refused before
  dialing (`usage/timeout-out-of-range`); a command that runs past it fails with
  RouterOS's `Session closed` (`routeros/session-closed`).
- **Native API** has no general cap: a structured command runs until `!done`.
  `execute --via native-api --timeout 120s '/tool/ping address=… count=70'` ran
  70 s and returned 70 rows. But `execute` sends every **script** (`:delay`, `;`,
  `:local`, …) over native API as `/execute as-string`, which RouterOS cuts at
  about 60 s: 0.1.10 reports it as `routeros/api-trap` ("action timed out (13)").
  `/container/shell` has the same limit.
- **SSH** runs a script at the console; no reply limit has been measured, only
  centrs's own `--timeout`.

For long work, start it in the background and poll: `:execute {…}` without
`as-string` runs the script as a `/system/script/job` and returns at once; then
`retrieve … --wait 5m --until '…'` waits on what it changes. `api … --stream` shows
the replies of a long structured command as they arrive.

### CMR fleets

`execute <controller> --cmr --labels <expr> -- '<command>'` (RouterOS
7.26beta1+ with the `cmr` package) runs one validated command on the CMR inventory
rows that `--labels` selects on the controller. The label `all` also selects **the
controller itself**, so a write with `--labels all` changes the controller too.
Only the controller is dialed; each client checks the command
with `:parse` first, and a client that rejects it is not sent it. One `--yes` covers
the whole selection, and a timed-out client is `cmr/outcome-unknown`, never retried.
A connected client RouterOS will not select (half-paired or pending) is dropped as
if no label matched ([centrs#657](https://github.com/tikoci/centrs/issues/657),
open).

Treat **any** login on a CMR controller as able to write to the whole fleet: on
7.26beta1, CMR `run-script` ran writes for a controller login whose group lacked
`write` ([centrs#456](https://github.com/tikoci/centrs/issues/456); MikroTik says
beta2 refuses it, not yet verified), and centrs warns
`cmr/caller-policy-not-enforced`. Keep `--cmr` and CMR fleet commands
(`/cmr/device/reboot`, `run-script`, `upgrade`, …) out of read-only agent profiles.
Plain `execute`/`api` fleet commands name the devices they reach in the gate, and
warn `cmr/rule-selects-every-device` for a VLAN rule with no labels.

## Files

```sh
centrs transfer <router> upload ./routeros-7.25.1.npk
centrs transfer <router> list
centrs transfer <router> download flash/backup.rsc ./backup.rsc
```

RouterOS's `/file` contents write caps at **60 KB**, so REST and native API cannot
carry a large upload. When the transfer method resolves to `auto` (no `--via`, and
no `CENTRS_TRANSFER_VIA`, CDB `via=` or config setting picking REST or native
API), centrs notices the size and selects SFTP. If a setting does pick REST or
native API, an oversized upload fails with `transport/unsupported-operation`.

The SSH clients run with `BatchMode=yes`, so SFTP never sends a password: on a
device with no SSH key installed, the auto-hop fails on authentication rather than
on size. For another router, install a key and pass `--ssh-key`. For a
`--quickchr` target, the key exists only if the machine was first booted with
`--secure-login` (see [Naming a router](#naming-a-router) and
**routeros-tikoci-quickchr-cli**). A booted machine cannot gain the key later. Only
for a disposable VM, `quickchr clean` and start again with the flag: `clean`
re-copies the boot disk and recreates extra disks, erasing configuration, app data
and snapshots, so copy off anything you need first.

A CDB record's `via=ssh` selects SFTP, and `--via ssh` is accepted as an alias for
`sftp`. `download` replaces an existing local file, like `curl -o`.

## When a command is rejected

Which check refused you is most of the diagnosis. A CLI string (`execute`, or an
`api` POST `/execute` script) goes through **two stages**:

1. **Offline** — the same analyzer `explain` uses runs first, with no connection.
   A syntax fault is refused here with the offending byte span.
2. **Device** — the router checks it before it runs.

A structured path (`retrieve`, any other `api` call) has no offline stage; only
the device checks it. What the device is asked:

| Command | Device check |
|---|---|
| `retrieve`, `api` (a structured path) | `/console/inspect` (path, verb and attribute names); no `:parse`. `api` records its offline stage as `skipped` |
| `api` POST `/execute` (a script) | `:parse` |
| `execute` over REST or native API | `:parse`, plus `/console/inspect` for a structured command |
| `execute` over SSH or MAC-Telnet | `:parse` only |

`--no-validate` disables every check. A clean offline pass is necessary, never
sufficient, and RouterOS still re-checks every write.

Every command renders errors the same way, and shows the router's own words
without `--verbose`:

```text
[code] summary
At:          RouterOS's (line N column M), or the offline byte span
Device said: RouterOS's own message
Fix:         the next step
Details:     the code's page
```

Branch on the code:

| Code | Meaning | Do |
|---|---|---|
| `validation/package-missing` | The menu exists, but behind a package this device lacks (`error.context.packages`) | Install the package, or pick another router |
| `validation/menu-unavailable` | Gated by hardware, build or version (`error.context.gates`) | Not fixable by editing the command |
| `validation/unknown-path` | No published RouterOS build has this path | Check spelling with `explain` or rosetta |
| `validation/syntax` | A real syntax fault, or a rejection centrs could not pin to one segment | Run `centrs explain '<command>'` and read `At:` |
| `routeros/permission-denied` | The RouterOS user's group lacks the policy | Fix the user's group; never retried |
| `routeros/unknown-path` | In 0.1.10: RouterOS refused at run time with `no such item` (a row that does not exist) or a path error such as `bad command name` | Read `error.context.detail` for which; the code splits in [0.2.0](#coming-in-020) |
| `transport/auth-failed` | RouterOS refused the login | Check credentials |
| `transport/edge-auth-failed` | An HTTP 401/403. Usually something in front of RouterOS (proxy, tunnel, WAF), but RouterOS itself answers 403 when REST is off for that protocol | Check the edge, and that `www`/`www-ssl` serve REST |
| `quickchr/ssh-auth-unavailable` | The quickchr VM has no verified SSH key | Recreate it with `--secure-login`, or use REST/native API |

Treat `validation/syntax` as a real syntax problem, and use `explain` to find it
rather than re-quoting by guesswork — but read the device's own words first. In
0.1.10, when the router does not answer the live `:parse` check (REST
`Session closed`, native `action timed out (13)`), that also comes back as
`validation/syntax`, and the command was never sent. 0.2.0 keeps the timeout's own
code.

## Known rough edges

Behaviors to plan around rather than debug from scratch.

- **A hang can be the success path.** `/system/device-mode/update container=yes`
  blocks by design while RouterOS waits for confirmation — a hard power-cycle on
  CHR, or a press of the reset or mode button on hardware that has one — and
  centrs reports that as a plain timeout
  ([centrs#363](https://github.com/tikoci/centrs/issues/363), now in the matrix's
  Provisioning theme). For a CHR, set device-mode at VM creation and let quickchr
  do the power-cycle. `/system/reboot` is different: on CHR 7.25.1 it returned
  `ok: true` at once on REST and native API. `retrieve --wait` then shows the
  router answering again, but its first read can land before the router goes down;
  if proving the restart matters, compare `uptime`.
- **Multi-line scripts over SSH (0.1.10).** `execute --via ssh` runs each line of a
  multi-line script on its own, so `:local` values and menu context are lost
  between lines (`:local a 7` then `:put "a=$a"` prints `a=`), and a later line can
  succeed after an earlier one failed. Join statements with `;` on one line, or
  use REST or native API. Fixed on `main`.
- **MAC-Telnet output.** `execute --via mac-telnet` can drop `:put` output from a
  single-line command with a trailing newline
  ([centrs#575](https://github.com/tikoci/centrs/issues/575), open). Use REST,
  native API or SSH when you need captured output.
- **Output can contain secrets.** centrs redacts credentials it *holds*; it does not
  filter values RouterOS *returns*
  ([centrs#359](https://github.com/tikoci/centrs/issues/359), closed won't-fix).
  The boundary is RouterOS's own `sensitive` policy: give an agent or CI job a
  RouterOS user whose group lacks `sensitive`. The built-in `read`, `write` and
  `full` groups all include `sensitive` and `reboot`, so make a group. A read-only
  client that uses REST and native API needs `read,api,rest-api`:
  `/user/group/add name=rest-read policy=read,api,rest-api`. Before RouterOS
  7.26beta3, REST alone also needs `api` (without it every REST request fails
  `not allowed (9)`); from 7.26beta3, `read,rest-api` is enough for REST only. A
  native-API-only reader needs `read,api`. See MikroTik's
  [User](https://manual.mikrotik.com/docs/authentication-authorization-accounting/user)
  and [Create a REST user](https://manual.mikrotik.com/docs/developer-guides/rest-api#create-a-rest-user).
  Arbitrary file contents (`/file print detail`) are outside that policy, so prefer
  targeted reads over broad dumps, especially through MCP, where output leaves the
  machine.
- **`check` is not implemented.** It is `designed` in the matrix; do not build on
  it.

## Dropping to raw REST

centrs exists so you do not have to, but when something else must call `/rest`
directly (a dashboard backend, a language without centrs), these RouterOS facts
bite. Checked on CHR 7.25.1 and described in MikroTik's
[REST API](https://manual.mikrotik.com/docs/developer-guides/rest-api) page:

- **One user's requests run one at a time, in order.** A same-user GET waited 5 s
  behind a `:delay 6s`, while another user's GET answered in 0.25 s. Give a
  dashboard and an automation separate users. This applies to centrs over REST
  too.
- **A client that gives up does not stop the command.** It runs until it finishes
  or reaches the 60-second limit: a `:delay 5s; …set` whose client hung up at 2 s
  still made its change.
- **Values come back as strings** (`"7"`, `"true"`); requests may send numbers and
  booleans. `{"count-only":""}` on POST `<menu>/print` returns `{"ret":"<n>"}`.
- **No CORS.** `OPTIONS` gets `503` and no `Access-Control-*` header is sent, so a
  page served from another origin cannot call the router from the browser; put a
  backend in between.
- **Restrict where a REST user can log in from.** Set the user's `address=`
  (`/user/set <name> address=<backend>`) and limit the service with
  `/ip/service/set www-ssl available-from=<backend>`; see
  [Restrict access](https://manual.mikrotik.com/docs/developer-guides/rest-api#restrict-access).
- **Ids start with `*`; send it unencoded.** `/rest/user/*1` works, `/rest/user/%2A1`
  is a `400`. Quote such URLs in a shell. Names also work as ids where records have
  them.
- **A missing permission is not a 403.** On CHR 7.25.1, a PATCH by a user without
  `write` was HTTP `500` `not enough permissions (9)` when the row was addressed by
  `*id`, and `400` `missing or invalid resource identifier` when addressed by name.
  That `400` is ambiguous: the manual also gives it for a PATCH with no row id, a
  record that cannot be removed, and a refused value. A RouterOS `403` (an HTML
  page) means REST is off for that protocol. centrs maps the explicit `500` to
  `routeros/permission-denied` and this `400` to `routeros/request-failed`.

## MCP

`centrs mcp` serves stdio tools gated by the CDB: only registered devices are
reachable, and inline host + credentials are refused (`cdb/target-not-registered`).
The server reads saved credentials to dial; tool results never return them
(devices show only `passwordSet`), though `centrs_devices add`/`set` can write
them. A device accepts writes only when its record carries the comment key
`mcp=rw` (plus `confirm: true` on the call). `centrs_validate` runs both validation
stages without executing — the dry-run to reach for before `centrs_execute`.
`centrs_explain` needs neither CDB nor device.

Do not edit the CDB while MCP device calls are running: authorization and dialing
read it separately, so a concurrent edit can change the target, credentials or
write policy in between
([centrs#604](https://github.com/tikoci/centrs/issues/604), open). In 0.1.10, a
tool result whose envelope has `ok: false` does not set MCP `isError`; check `ok`.

## Coming in 0.2.0

On centrs `main`, not in a published build when this was written. Check the
[CHANGELOG](https://github.com/tikoci/centrs/blob/main/CHANGELOG.md) before relying
on any of it:

- **Error codes.** RouterOS's `no such item` (a missing row in a menu that
  exists, or a bare REST 404) becomes `routeros/no-such-item`, and
  `routeros/unknown-path` then means `no such command` (which 0.1.10 reports as
  `routeros/request-failed` or `routeros/api-trap`). The native `action timed out (13)` trap becomes
  `routeros/action-timed-out` instead of `routeros/api-trap`. Code that matches
  these must take both spellings across the upgrade.
- `execute --via ssh` runs a multi-line script as one unit, and a nonzero RouterOS
  exit over SSH keeps a `routeros/*` code instead of `transport/network`.
- MCP sets `isError` on a failed envelope. Error links print the `tikoci.dev` host.
- `discover`/MNDP fields: `sequence`, `ipv6` and the numeric `unpack` are replaced
  by `headerHex`, `ipv6Addresses` and corrected TLV decoding.
- The Docker image runs as a non-root user; its config directory moves to
  `/home/bun/.config/tikoci/`.
- The default transport is planned to become native API first, with fallback. Pin
  `--via` where the protocol matters.

## Authoritative docs & related skills

- [routeros-proprietary-protocols](../routeros-proprietary-protocols/SKILL.md) — index of MikroTik wire protocols and files (WinBox/M2 research in m2ir, RoMON, CDB, and others) with what is and is not known.
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
  each release changed)
- **routeros-tikoci-quickchr-cli** / **routeros-tikoci-quickchr** — boot the CHR that `--quickchr`
  then targets: the `-cli` skill for the shell path, the other for TypeScript
  harnesses. The pair is the normal grounding loop: quickchr creates the router,
  centrs drives it. Boot with `--secure-login` if centrs will use SSH or SFTP.
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
