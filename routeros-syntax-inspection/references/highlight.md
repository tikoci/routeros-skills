# `request=highlight` — the per-byte token stream

The console's own tokenizer, exposed verbatim. This is the lexical view of a
script: which class every byte belongs to. Full evidence (corpus counts,
timing, drift tables):
[`highlight-format.md`](https://github.com/tikoci/lsp-routeros-ts/blob/main/docs/highlight-format.md).

## Wire format

```text
POST /rest/console/inspect
{"request": "highlight", "input": ":put 1"}

→ [{"highlight": "dir,cmd,cmd,cmd,none,none", "type": "highlight"}]
```

- `highlight` is a comma-joined list of class names, **exactly one per input
  byte** (verified across 913 corpus files on 7.9.2, 7.23.2, 7.24rc2).
- Empty input returns `"highlight": ""` — zero tokens. Guard before
  splitting: naïve `"".split(',')` fabricates one empty-named token.
- The response array always contains exactly one item.
- Optional `path` (comma-separated, e.g. `"ip,address"`) classifies the input
  as if typed at that menu prompt.

**Send ASCII.** Non-ASCII is accepted but each byte gets a token, so token
indexes desynchronize from editor character offsets. Replace each char > 127
with one ASCII byte (`?`) before sending; non-ASCII in identifier position is
rejected by RouterOS itself anyway, and inside strings/comments the
substitution is harmless (measured: only 4 of 333 corpus error files trace to
substitution).

**Limits:** input over 32,767 bytes is rejected; latency grows with size and
complexity (corpus mean ~79 ms, p95 ~277 ms, with a cliff near 28 KB —
`:parse` has neither the cap nor the cliff).

## Token vocabulary (19 classes observed)

Identical on 7.23.2 and 7.24rc2; 7.9.2 lacks only `arg-scope`/`arg-dot`
(dotted argument names postdate it).

### Structure

| Class | Meaning (observed) |
|---|---|
| `none` | Everything unclassified: whitespace, literal values (numbers, string contents, IPs, times), and **all text after a hard error** |
| `dir` | Menu-path segments *including their slashes* (`/ip/address/` is one run); also the `:` sigil of scripting commands |
| `cmd` | Command name (`print`, `add`, `local`, `if` …) |
| `arg` | Argument name before `=` |
| `arg-scope` / `arg-dot` | Prefix / dot of a dotted argument (`export.route-targets=`); suffix is plain `arg` |
| `syntax-meta` | Syntactic punctuation: quotes, `$`, `=`, `{`, `}`, `(`, `)`, `;`, `[`, `]`, `,` |
| `escaped` | Escape sequences in strings (`\"`, `\n`, hex escapes, line-continuation backslash) |
| `comment` | Whole comment including `#` |

### Variables

| Class | Meaning (observed) |
|---|---|
| `variable-local` | `:local`-declared name, at declaration and use. **Also menu-property names in `where`/filter expressions** — the console binds the menu's fields as locals |
| `variable-global` | `:global`-declared name |
| `variable-auto` | Loop-bound names (`:foreach k,v`, `:for i`) |
| `variable-parameter` | Function parameters (`$1`, named params in `do={}`) — **and any `$name` with no visible declaration**; undeclared is indistinguishable from supplied-at-call-time |
| `variable-undefined` | Bare unresolvable identifier in expression position — the actual "probably a typo" signal |

### State and error

| Class | Meaning (observed) |
|---|---|
| `obj-inactive` | Name that doesn't resolve *on this device*: unknown command/argument/menu, or an ambiguous prefix. Soft — classification continues |
| `obj-disabled` | Reference to an object whose disabled flag is currently set on the live device |
| `obj-dynamic` | Reference to an object that is currently dynamic on the live device |
| `syntax-obsolete` | Accepted-but-deprecated syntax, marked on the divergence character (e.g. the space in old-style `} else {`) |
| `error` | Hard parse error — always exactly **one byte**; see below |

## The error model — one byte, then silence

`error` marks the first byte the parser cannot proceed past, and only that
byte; everything after it in the whole input is `none`. Measured: never two
`error` bytes in one response across 913 files × 3 versions. Consequences:

- One request yields at most one hard-error position — highlight does **not**
  mark every error. Everything *before* the error stays fully classified
  (including soft markers), and the error position is byte-exact.
- Multi-error diagnostics require iterative re-requests past each error.
- Pair with `:parse` for message + range: highlight gives the exact byte
  without a message; `:parse` gives a message with line/column.

Common triggers: descending into an unresolvable path (the unknown name is
soft `obj-inactive`; the `/` that tries to *enter* it is the `error`),
non-script content (pasted transcripts), a byte that can't start a token in
code position, `:set` on an undeclared name.

**Severity is consumer policy.** Only `error` is the measured hard stop.
Treating `obj-disabled`, `obj-dynamic`, or `syntax-obsolete` as errors is a
product decision (an LSP may want it; a validator probably does not).

## Statefulness and drift

The same input tokenizes differently across devices or device states:
version/command-tree churn, installed packages, runtime object flags
(`obj-disabled`/`obj-dynamic`), and declared globals all shift classes.
Measured drift 7.23.2 → 7.24rc2: vocabulary identical, 97.6% of files
byte-identical, all differences schema churn. 7.9.2 was *harsher* (unknown
argument = hard `error` rather than soft `obj-inactive`) but same wire
format.

Do not confuse the highlight vocabulary with `/terminal/style`'s 12
display-style names (`varname`, `syntax-val`, `ambiguous`, …) — that is the
console's *rendering palette*, overlapping on only five names, and those
style names never appear on the highlight wire.
