# `:parse` IL — the structural view

`:parse` lowers a script to the textual intermediate language ("parseIL") the
RouterOS engine executes. It is the structural complement to highlight's flat
token stream: blocks, expressions, scopes, evaluation order. Full grammar and
corpus evidence:
[`parseil-format.md`](https://github.com/tikoci/lsp-routeros-ts/blob/main/docs/parseil-format.md)
(913-script corpus on 7.20.8 / 7.22.1 / 7.23rc1).

## Readout recipe

Only `:put` reveals the IL (`:tostr`, `:serialize`, environment printing all
collapse to the placeholder `(code)`):

```routeros
:put [:parse ":put hello"]
# (evl /putmessage=hello)
```

Over REST, avoid string-escape collisions by uploading first:

```text
POST /rest/file/add     {"name":"probe.rsc","contents":"...script..."}
POST /rest/execute      {"script":":put [:parse [/file/get probe.rsc contents]]","as-string":"true"}
POST /rest/file/remove  {"numbers":"probe.rsc"}
```

Note this recipe touches `/file` and `/rest/execute` — inspection-flavored
but not purely read-only. Limits: `/rest/file/add` returns 413 above the
upload cap (~126 KiB observed); `:parse` itself has **no 32 KB cap** and no
latency cliff (56 KB parsed cleanly; ≤10 ms typical for small scripts).

## Grammar essentials

- A script is a `;`-separated sequence of `(evl …)` forms. Empty source →
  empty IL; comment-only source → the single character `/`.
- `(evl <PATH><ARGS>)` — path and args are fused with **no separator**
  (`/localname=$x` = path `/local` + args `name=$x`). Splitting them
  deterministically requires the command schema (`child`/`syntax`).
- Block-valued args (`do={…}`, `else={…}`, `on-error={…}`) appear as the key
  with empty value (`do=;`) followed by the block body as an adjacent
  `(evl …)` sibling. Multi-statement blocks wrap as
  `(evl <child> <child> …)` with space-separated children.
- Expressions are Lisp-style prefix forms: `(= 1 1)`, `(+ 1 2)`,
  `(. "now=" $now)`, `(and … …)`, `(~ $addr 10.0.0.0)`.
- Two real (undocumented) operators appear: `(> …)` quotes code into an `op`
  value; `(<%% …)` applies an op/function in an explicit environment. Both
  labels come from `request=completion` itself (`quote`, "activate in
  environment").
- Variable references are textual `$name` with **no scope information** —
  local/global/parameter resolution requires reconstructing scopes from the
  surrounding `/local`/`/global` declarations and `do=` boundaries.

## Canonicalizations (useful for "RouterOS will see this as…")

- Paths fully qualify: `:put` → `/put`; `/ip address print` →
  `/ip/address/print`. No implicit current menu in the IL.
- `yes`/`no` → `true`/`false`; time literals expand (`200ms` →
  `00:00:00.200`).
- `find`/`where` forms dump **every property of the target menu** as
  `findwhere=$field;…` — the whole field set, not just referenced fields.
  Version-sensitive (the main source of cross-version IL drift), and useful
  for version-aware property enumeration. It carries **no required-vs-optional
  signal** (see [validation.md](validation.md)).

## Errors

At the first error `:parse` stops: an error string with `(line N column M)`
and **no partial IL**. Observed stems: `syntax error`,
`expected end of command`, `missing closing brace`, `missing value for
where`. One special case embeds the error *inside* IL: an unknown command
name lowers to a `(<%% bad command name … )` form — late-binding rather than
parse-fatal. Error wording and coordinates are **not stable across
versions**; match stems loosely.

## Drift

91.9% of the corpus is byte-identical across 7.20.8/7.22.1/7.23rc1. All
drift is schema leakage (the `findwhere=` dumps, path re-canonicalization
like `/ping` → `/tool/ping`, parameter validation churn) — the core IL
surface (`(evl …)`, `;`, prefix ops, `(> …)`, `(<%% …)`) did not change.
Version-tag any stored IL.

## Choosing highlight vs `:parse`

| Question | Use |
|---|---|
| Token class at each byte / editor coloring | highlight |
| First-error position | either — highlight: exact byte, no message; `:parse`: line/column + message. Pair them |
| All errors in one call | neither (both stop at the first hard error) |
| Blocks, scopes, functions | `:parse` |
| Canonical value forms | `:parse` |
| Scripts > 32 KB | `:parse` (no cap) |
| Cheap validity pre-check | `:parse` (~10 ms, no 28 KB cliff) |
