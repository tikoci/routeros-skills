# `child`, `syntax`, `completion` — schema and candidates

The three non-highlight request types of `/console/inspect`. Grounded on a
37-context probe catalog captured verbatim on RouterOS 7.9.2, 7.23.2, and
7.24rc2:
[`inspect-shapes.md`](https://github.com/tikoci/lsp-routeros-ts/blob/main/docs/inspect-shapes.md)
(artifacts in that repo's `test-data/inspect-shapes.v<version>.json`).

Observed field sets are identical across all three versions; item counts and
candidate contents track the live device's schema and state.

## `request=child` — node enumeration

Items: `{name, node-type: "dir"|"path"|"cmd"|"arg", type: "self"|"child"}`.

- `type:"self"` describes the addressed node itself; `"child"` rows are its
  children. A name that is both a command and an argument returns both rows.
- Root (`path:""`) lists every top-level menu and scripting command.
- **A nonexistent path returns `[]`, not an error** — absence is the only
  "not found" signal.
- `input` is **ignored**; filtering is the caller's job.

This is the surface schema crawlers (e.g.
[tikoci/restraml](https://github.com/tikoci/restraml)) walk; see the
`routeros-command-tree` skill for traversal recipes.

## `request=syntax` — structured help

Not just a description string. Full item:

```json
{"symbol": "Address", "symbol-type": "definition",
 "text": "A.B.C.D    (IP address)",
 "nested": "0", "nonorm": "false", "type": "syntax"}
```

- `symbol-type` discriminates: `definition` (the addressed node's own entry —
  for a value-typed arg, `text` is the **value-type notation**, the closest
  thing this API has to a type grammar), `explanation` (one row per member
  of a container: querying a command returns every argument's description),
  `collection` (the container row). `nested` behaves like row depth.
- **Enum-valued args return an empty definition** — enum values live in
  `completion`, not `syntax`.
- On 7.21.4+, one `syntax` call on a *command* returns all of its arguments'
  descriptions at once — much cheaper than per-arg lookups. **Feature-detect
  with a short timeout**: on 7.9.2 the same command-level lookup stalled
  ~60 s; combining `input` with `syntax` also hangs there (on 7.23.x it just
  degrades to a lone empty row). Query `syntax` by `path` only.
- Scripting-keyword paths (`where`, `do`, `else`, `rule`, `command`,
  `on-error`): bare `do` with `syntax`/`completion` deadlocks the REST server
  on ≤ 7.20.8, fixed by 7.21.4 (restraml's live matrix, MikroTik case
  SUP-127641). Keep the six-path skip as conservative policy on old/unknown
  versions.

## `request=completion` — candidates, enums, validity signal

Each item proposes text that could continue or repair the input:

| Field | Meaning (observed) |
|---|---|
| `completion` | Candidate text; empty string on sentinel rows |
| `offset` | **Byte offset into `input`** where replacement begins (RouterOS counts raw bytes as received; the REST wire is UTF-8, so non-ASCII shifts offsets off JS/UTF-16 indexes — ASCII-normalize first). End-of-input = append; smaller = replaces the partial word |
| `preference` | Observed ranking weight, not a documented enum. Typical: `96` names, `95` separators, `75` expression openers, `40` statement glue, `-1` hidden placeholders, `-10` obsolete-syntax, `-20` unknown-name sentinels |
| `show` | `"true"` = display as candidate; `"false"` = machine-facing row (connectives, placeholders, sentinels). Not a validity flag |
| `style` | Highlight-vocabulary class the candidate is associated with (`dir`, `cmd`, `arg`, `variable-local`, `obj-inactive`, …) |
| `text` | Human description (menu blurb, arg description, sentinel reason) |

Grounded uses:

- **Enum-candidate discovery**: `input:"/ip/firewall/filter/add action="`
  returns the enum-looking value set as `show:"true"` rows — the only inspect
  source for enum values. Treat the list as *observed candidates*, not a
  proven-closed set.
- **Live-object values**: `interface=` completes with the device's actual
  interfaces — stateful by design.
- **`where`-clause fields** complete as `style:"variable-local"` — consistent
  with highlight's classing and parseIL's `findwhere=` dump.
- **Value-position grammar**: after `word=` a `completion:"<value>"`,
  `preference:"-1"` placeholder row describes the generic literal grammar —
  a hint, not proof the preceding argument or value is valid.

### Validity checking (the sentinel decision rule)

Sentinel rows — empty `completion`, `preference:"-20"`,
`style:"obj-inactive"`, `text:"unknown command"`/`"unknown parameter"` —
classify **the word starting at their `offset`**, and also appear
*prospectively* at the empty end-of-input position of valid commands.
Probe with the cursor immediately after the word under test (before `=` or
whitespace — verdicts are cursor-local and advancing can hide an earlier
word's sentinel). Then, per word (measured on 7.23.2/7.24rc2):

- sentinel at the word's offset and **no** `show:"true"` candidate completing
  it → unknown name;
- sentinel **plus** candidates at the same offset → ambiguous prefix;
- candidates only → valid partial;
- sentinel at end-of-input → prospective; ignore.
- a nonexistent *path* returns `[]` outright (same absence signal as
  `child`).

Version caveat: 7.9.2 still emits the unknown-*command* sentinel but returns
bare `[]` for an unknown typed *argument* — feature-detect the argument rule.

**Necessary, not sufficient**: inspect accepts some forms the runtime
rejects (the `blackhole=yes` case in
[tikoci/bench-routeros-tools](https://github.com/tikoci/bench-routeros-tools)).
Only execution on an appropriate target proves acceptance.
