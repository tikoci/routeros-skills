---
name: routeros-centrs
description: "Use whenever a task touches a real MikroTik RouterOS device or CHR: reading or changing config, running a RouterOS CLI command non-interactively, checking a command is well-formed before sending it, moving files on or off a device, discovering neighbors, or doing the same thing across several routers. Reach for centrs (@tikoci/centrs, CLI + Bun/TS) rather than hand-rolling curl against /rest or scripting ssh: it resolves the router's address, credentials, port and protocol from your WinBox address book or a quickchr VM, validates the RouterOS command before it runs, and returns one structured envelope (data, warnings, tips, meta) whatever transport carried it - REST, native API, SSH/SFTP, MAC-Telnet, MNDP. Also covers the parts agents routinely miss: offline `explain`, `--json`, fan-out, the `--yes` write gate, and how to read a rejection. Not for booting the CHR itself (routeros-quickchr) or for RouterOS documentation (rosetta MCP, routeros-fundamentals)."
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

**Reach for centrs when** you need to run a RouterOS command, read state, or move a
file — from a shell script, a test, or an agent loop.

**Don't reach for it** when you need RouterOS *documentation* (use the `rosetta` MCP
or the `routeros-fundamentals` skill), or when you need to *create* the router itself
(use the `routeros-quickchr` skill — centrs consumes a quickchr VM, it does not boot
one).

> **Status:** `0.1.x` preview under active development. The repo README publishes
> preview builds under npm's `next` tag, so pin `@next` rather than assuming `latest`
> tracks them — confirm with `npm view @tikoci/centrs dist-tags`. Expect breaking
> changes before 1.0 and exercise writes on lab or disposable targets first.
> [`docs/MATRIX.md`](https://github.com/tikoci/centrs/blob/main/docs/MATRIX.md) is the
> single source of truth for what works today; treat anything not green there as
> not-yet-shipped.

## Install and first call

```sh
bunx @tikoci/centrs@next --help                 # no install
bun add @tikoci/centrs@next                     # library + local CLI
```

The offline analyzer needs no router and no credentials — it is the cheapest way to
confirm centrs works at all:

```sh
bunx @tikoci/centrs@next explain '/ip/address print' --json
```

## The loop: explain → run

This is the pattern centrs exists for. Analyze the command offline, then run it.

```sh
# 1. Is this well-formed, and what will it actually do?
centrs explain '/ip/address/add address=192.0.2.1/24 interface=ether2'

# 2. Run it. Writes need --yes when there is no TTY to prompt on.
centrs execute lab --yes '/ip/address/add address=192.0.2.1/24 interface=ether2'

# 3. Read it back as data.
centrs retrieve lab /ip/address --json
```

`explain` is offline: it opens no connection, canonicalizes the input, reports
structure and syntax diagnostics, and tells you which centrs command would carry it.
It is also **the first thing to run when a command is rejected** — see
[When a command is rejected](#when-a-command-is-rejected).

`explain` is deliberately conservative: a `pass` verdict means *centrs found nothing
wrong offline*, never that RouterOS will accept it. The envelope says so itself with
`runtimeAcceptance: "not-proven"`. Live device probes are designed, not shipped.

## Naming a router

Every router-facing command resolves a **target**. Four ways, in the order you will
want them:

| You have | Use |
|---|---|
| A CHR booted by quickchr | `--quickchr <name>` — resolves host, port, and credentials from the live VM; no credential plumbing at all |
| A router saved in WinBox | the positional `<router>` — centrs reads `~/.config/tikoci/winbox.cdb` (the WinBox address book **is** the device registry; centrs keeps no store of its own) |
| Neither | `--host` / `--port` / `--username` / `--password`, or `CENTRS_USERNAME` / `CENTRS_PASSWORD` |
| Nothing yet | `centrs discover` over MNDP, `--save` to write found neighbors into the CDB |

`--quickchr` is exclusive of positional targets and of `--host`/`--port`/`--username`/
`--password`; pick one mechanism per call.

### Fan out instead of looping

`--quickchr` repeats, and the CDB selectors fan out too. Prefer these to a shell loop —
one envelope, bounded concurrency, per-target errors that do not abort the rest:

```sh
centrs retrieve --quickchr sun --quickchr earth --quickchr comet /system/resource --json
centrs execute --group edge --yes '/system/ntp/client/set enabled=yes'
centrs retrieve --all /system/resource --json
```

Fan-out selectors: `--group <name>`, `--all`, `--where <attr>=<value>`, `--near`,
`--bbox`. `--default` is a target selector too, but it picks the single reserved
`__default__` record rather than fanning out.

## The command map

Twelve commands. The three obvious ones are not the whole surface — `explain`, `api`,
and `discover` are the ones most callers never find.

| Command | Purpose | State |
|---|---|---|
| `retrieve <router> <path>` | Read RouterOS state | shipped (REST, native API) |
| `execute <router> '<cli>'` | Run a RouterOS CLI-shaped read/write | shipped (REST, native API, SSH, MAC-Telnet) |
| `api <router> <endpoint>` | Structured passthrough, `gh api` style: `-X PUT`, `-f k=v`, `--query`, `--stream` | shipped (REST, native API) |
| `explain '<input>'` | Offline analysis of a RouterOS command | shipped offline; live probes designed |
| `transfer <router> upload\|download\|list\|remove\|mkdir\|copy` | Device files | shipped (REST, native API, SFTP) |
| `terminal <router>` | Interactive console | shipped (SSH, MAC-Telnet) |
| `discover` | MNDP neighbor discovery, `--save` into the CDB | shipped |
| `devices` | The CDB device registry, and the atomic write layer every CDB mutation routes through — including `discover --save` | shipped |
| `settings` | centrs's own preferences (`centrs.env`) | shipped |
| `mcp` | Scoped stdio MCP server, CDB-gated | shipped |
| `btest` | MikroTik bandwidth test, client or server | shipped |
| `check` | Reachability + health battery | **designed only — not implemented** |

`retrieve` vs `execute` vs `api`: `retrieve` reads a menu; `api` is the structured
operation surface (it can write); `execute` takes a literal RouterOS CLI string and is
the only one that reaches SSH and MAC-Telnet. There is no `update` command — CLI-shaped
writes ride `execute`.

## Read the envelope, not the text

Every call returns one shape, whatever the transport (the one exception is
`api --raw`, which deliberately strips the envelope and emits bare RouterOS JSON):

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
    "validation": {},        // validator name + result, if validation ran
    "operation": { "objectCount": 3 }
  }
}
```

**Pass `--json` (or `--format json`).** This is the single most-missed thing about
centrs. `retrieve` and `execute` default to `--format text`, and their text output
renders `data` as pretty-printed JSON — so piping the default straight into a JSON
parser *appears* to work while silently discarding `warnings`, `tips`, and all of
`meta`. (`api` already defaults to JSON.)

Two consequences worth internalizing:

- `meta.operation.objectCount` is the reliable row count. `data` itself is
  shape-unstable today: zero rows come back as an **empty object**, one row as a bare
  object, and N rows as an array
  ([centrs#360](https://github.com/tikoci/centrs/issues/360)). All three need handling,
  and the empty object is the one that bites — it is truthy, so the obvious
  `d ? [d] : []` invents a row that does not exist, exactly during the failover or
  empty-menu read you were measuring. Take the count from `meta`, and normalize with
  something that excludes it:

  ```js
  const rows = Array.isArray(d)
    ? d
    : d && typeof d === "object" && Object.keys(d).length > 0
      ? [d]
      : [];
  ```

- `tips` and `warnings` are separate channels on purpose. A tip is explicitly *not* a
  problem; do not treat a non-empty `tips` array as a failure.

## Writing

Write-shaped commands are gated. With a TTY, centrs prompts; without one it refuses:

```console
$ centrs execute lab '/ip/address/add address=192.0.2.1/24 interface=ether2'
[usage/confirmation-required] Write-shaped RouterOS execute commands require explicit confirmation.
Fix: Pass `--yes` in non-interactive automation, or answer `yes` at the TTY prompt after reviewing the command.
```

So: **a non-interactive `execute` or `api` write needs `--yes`**, as does a mutating
`transfer` fan-out across several routers. Overwriting an existing file is a *separate*
gate — `transfer --force` / `--overwrite`, not `--yes`. Never disable validation to make
a write succeed: validation is the product, and `--no-validate` should be a deliberate,
explained choice, not a workaround.

## Files

```sh
centrs transfer <router> upload ./routeros-7.24.4.npk
centrs transfer <router> list
centrs transfer <router> download flash/backup.rsc ./backup.rsc
```

RouterOS's `/file` contents write caps at **60 KB**, so REST and native API cannot
carry a large upload. With no `--via` pinned, centrs already notices the size and
auto-selects SFTP — you do not need to pick the transport. On a device with no
SSH key installed that auto-hop can fail on authentication rather than on size: the
SSH clients run with `BatchMode=yes`, so an empty or password-only credential is not
usable there even though REST accepts it.

## When a command is rejected

Validation is **two stages**, and which one rejected you is the whole diagnosis:

1. **Offline** — the same analyzer `explain` uses runs first, with no connection. A
   syntax fault is refused here with the offending byte span, and its remediation tells
   you to run `centrs explain` to see it in context. No round trip happens.
2. **Device** — `:parse` plus `/console/inspect` on the router, for the semantic half
   offline analysis cannot decide.

`--validate=false` disables both. A clean offline pass is necessary, never sufficient.

The device stage is where the error text is thin, and the failure mode is worth knowing
because it costs agents real time:

```console
$ centrs execute lab '/container/print'
[validation/syntax] RouterOS rejected the command syntax while parsing it.
Fix: Fix the RouterOS CLI syntax (quotes, brackets, attribute form), then retry.
```

**That remediation is often wrong.** `validation/syntax` is what you get when the path
does not exist *for any reason* — including a menu whose package is not installed or
whose device-mode feature is off
([centrs#361](https://github.com/tikoci/centrs/issues/361)). Re-quoting a command that
has no quoting problem is an infinite loop. When you see it:

1. Run `centrs explain '<the same command>'`. If it passes offline, the input is
   well-formed and the problem is the device, not the string — and since stage 1 already
   ran the same analyzer, a rejection you *received* from a router is by definition one
   offline analysis let through. Re-quoting cannot help.
2. Check the device — `centrs retrieve <router> /system/package --json`, then
   `centrs retrieve <router> /system/device-mode --json`. A missing `container`,
   `zerotier`, or `wireless` package is the usual answer.
3. Only then suspect the syntax — and use `explain`'s diagnostics rather than guessing.

Re-run with `--verbose` to get the error `context`, which carries the device's own
`:parse` output; the default two-line render drops it, along with the per-code details
URL and the `(line N column M)` position
([centrs#362](https://github.com/tikoci/centrs/issues/362)). Every error code has a
page at `https://tikoci.github.io/centrs/errors/<code>`.

## Known rough edges

Behaviors to plan around rather than debug from scratch. Each links to the tracking
issue — if you hit one, add evidence there rather than working around it silently.

- **A hang can be the success path.** `/system/device-mode/update container=yes`
  blocks by design while RouterOS waits for a *hard power-cycle* to confirm. centrs
  reports that as a plain timeout on every transport
  ([centrs#363](https://github.com/tikoci/centrs/issues/363)). For a CHR, set
  device-mode at VM creation and let quickchr do the power-cycle. The same applies to
  `/system/reboot`, package installs, and unbounded `/ping`.
- **No wait primitive.** There is no `--wait` / `--until`; readiness and convergence
  polling is the caller's job today
  ([centrs#364](https://github.com/tikoci/centrs/issues/364)). Poll a cheap read
  (`retrieve <router> /system/resource`) against a wall-clock deadline, and do not
  silence its errors — "not converged" and "centrs failed" must stay distinguishable.
- **Output can contain secrets.** centrs redacts credentials it *holds*; it has no
  notion of secrets RouterOS *returns*
  ([centrs#359](https://github.com/tikoci/centrs/issues/359)). `/file print detail`
  can inline private keys and API tokens, and `/export show-sensitive=yes` is one word
  from the safe default. Prefer targeted reads over broad dumps, especially through
  MCP, where the output leaves the machine.
- **REST timeouts cap at 60 s.** `--timeout` above that is rejected on `rest-api`.
- **`check` is not implemented.** It is `designed` in the matrix; do not build on it.

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
  contract and worked examples)
- **routeros-quickchr** — boot the CHR that `--quickchr` then targets. The pair is the
  normal grounding loop: quickchr creates the router, centrs drives it.
- **routeros-fundamentals** / **routeros-scripting** — what to actually say to
  RouterOS once centrs can reach it.
- **routeros-syntax-inspection** — `/console/inspect` and `:parse`, the machinery
  behind centrs's validation gate.
- **routeros-mac-telnet** / **routeros-mndp** — the L2 protocols behind
  `execute --via mac-telnet` and `discover`.

> This skill is a starting point, not a manual. `docs/CLI.md` and `commands/<name>/`
> in the repo are authoritative and versioned; when they disagree with this file, they
> win — and the disagreement is worth reporting at
> <https://github.com/tikoci/centrs/issues>.
