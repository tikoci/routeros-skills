---
name: routeros-syntax-inspection
description: "Inspecting and validating RouterOS command/script syntax against a live device via /console/inspect (highlight, completion, syntax, child) and :parse IL. Use when: validating RouterOS commands before execution, explaining or linting RouterOS scripts, building syntax-aware tooling (LSP servers, validators, agent explain/check commands), interpreting highlight token streams or :parse intermediate language, discovering enum values or argument schemas, or when the user mentions console/inspect, highlight tokens, parseIL, or RouterOS script validation."
---

# RouterOS Syntax Inspection

## Overview

RouterOS exposes its **own parser** over the REST API: `/console/inspect`
classifies every byte of console input (`highlight`), proposes continuations
(`completion`), returns structured help (`syntax`), and enumerates the command
tree (`child`); the `:parse` scripting command returns the intermediate
language (IL) the engine actually executes. Together these are the ground
truth for "is this valid RouterOS?" — version-exact, package-exact, and even
runtime-state-exact, which no static grammar can be.

This skill is a **probe-selection and wire-format guide**: which surface
answers which question, how to read each response, and which claims the
responses do and do not support. It is grounded in full-corpus captures
(913 scripts × multiple RouterOS versions) published in
[tikoci/lsp-routeros-ts](https://github.com/tikoci/lsp-routeros-ts) — the
`docs/` references there carry the full evidence [^1].

**"Parse RouterOS" is not one operation.** Pick the probe for the question:

| Question | Probe | What it cannot establish |
|---|---|---|
| Which span is a command, argument, variable, comment, live-state marker? | `request=highlight` | Nested structure; value validity; anything after the first hard error |
| Is the script structurally valid; what blocks/expressions result? | `:parse` | Source ranges; partial IL on error; path/argument split without schema data |
| What is valid at this cursor position? Enum values? | `request=completion` | Requiredness; exhaustiveness of candidate lists; runtime acceptance |
| What paths, commands, arguments exist on this device? | `request=child` + `request=syntax` | Enum values (those come from `completion`); required arguments |
| Which arguments are required? | Execute-error probe (`add` with no args) | Conditional requirements past the first discriminator |

Details per surface: [references/highlight.md](references/highlight.md),
[references/parseil.md](references/parseil.md),
[references/command-schema.md](references/command-schema.md),
[references/validation.md](references/validation.md).

For crawling the full command hierarchy (`child` traversal, schema/RAML/OpenAPI
generation), see the **`routeros-command-tree`** skill — this skill covers the
*syntax/validity* surfaces of the same `/console/inspect` endpoint.

## Request shape

All four inspect surfaces share one endpoint (basic auth, any RouterOS 7.x):

```text
POST /rest/console/inspect
{"request": "highlight" | "completion" | "syntax" | "child",
 "input": "<console input>",     // optional
 "path":  "ip,address,add"}      // optional comma-separated menu context
```

Every successful response is a JSON array of flat all-string objects with a
`type` field naming the request type. Beyond that, the four response shapes
share nothing — treat them as four APIs behind one endpoint.

## Version baseline and safety

- **Baseline: RouterOS 7.20.8** — a long-term-channel release, used here as the
  recommended floor: the parseIL and crash-path behavior below was captured on
  it [^1][^3]. REST itself exists since 7.1beta4 (HTTPS-only at first [^2]);
  behavior below 7.20.8 is best-effort (7.9.2 was measured but harsher — see
  [references/highlight.md](references/highlight.md)), and RouterOS v6 has no
  REST API at all.
- **Always set a per-request timeout** (a few seconds). Old versions can hang
  the whole REST server on specific inspect calls; a hung server also makes
  *subsequent* unrelated probes appear broken.
- **Known hazards** (all measured, see [^1] and [^3]):

| Hazard | Versions | Rule |
|---|---|---|
| `request=syntax`/`completion` at bare path `do` deadlocks the REST server | ≤ 7.20.8 (fixed by 7.21.4) [^3] | Skip scripting-keyword paths (`where`, `do`, `else`, `rule`, `command`, `on-error`) on old/unknown versions; it is a conservative skip policy, not a timeless six-path crash rule |
| `request=syntax` with `input`, or command-level `syntax`, stalls ~60 s | observed on 7.9.2 | Query `syntax` by `path` only; feature-detect command-level lookups with a short timeout |
| `input` beyond 32,767 bytes rejected | all | Route oversized input to `:parse` (no cap) or reject it — never highlight a truncated copy and present it as validating the whole script |
| Highlight latency cliff near 28 KB | observed 7.23.x | Prefer a `:parse` pre-check for big scripts (no such cliff, no 32 KB cap) |

- **Distinguish `[]`, timeout, and transport failure.** An empty array is a
  real answer (nonexistent path); a timeout is not. Conflating them corrupts
  any cached conclusion.

## Reading results — rules that prevent wrong claims

These are the measured behaviors that most often get summarized wrongly:

1. **Offsets and tokens are byte-based.** RouterOS strings are single-byte
   data — the console has no Unicode awareness. Highlight emits exactly one
   token per input **byte**, and completion `offset` counts bytes as received
   on the wire (UTF-8 over REST, so non-ASCII characters occupy 2+ bytes and
   desynchronize byte offsets from UTF-16/JS string indexes). ASCII-normalize
   input first — replacing each char > 127 with one ASCII byte (`?`) keeps
   editor character positions aligned to RouterOS byte positions.
2. **One hard error, then silence.** Both highlight and `:parse` stop at the
   first hard error. Highlight marks exactly one `error` byte and leaves the
   rest unclassified (`none`); `:parse` returns a message with line/column
   and **no partial IL**. Neither gives multi-error diagnostics in one call.
   Soft markers (`obj-*`, `variable-undefined`, `syntax-obsolete`) do *not*
   stop classification.
3. **`none` means unclassified, not "valid literal."** Highlight accepts an
   obviously bad IP as `none`. Value validation is a different layer.
4. **`obj-inactive` / `obj-disabled` / `obj-dynamic` are live-state
   classifications, not grammar errors.** A disabled service or dynamic route
   table is a perfectly valid reference. Diagnostic severity is the
   consumer's policy decision — do not hard-code these as "invalid syntax."
5. **An undeclared `$name` is usually not an error.** It classifies as
   `variable-parameter` (it may be supplied at call time). The "probably a
   typo" signal is `variable-undefined` — a bare unresolvable identifier in
   expression position.
6. **Completion candidates are observed suggestions, not proven-closed
   enums.** Preserve "observed candidates" provenance unless independent
   evidence proves closure.
7. **Results are stateful.** Token classes and candidates depend on the
   RouterOS version, installed packages, and current object flags. Record
   version + package manifest with any captured result; a snapshot from one
   router is only approximately valid for another.

## Validating a command via completion

The grounded mechanics of "check before you run" (full detail:
[references/command-schema.md](references/command-schema.md)):

- Probe with the cursor **immediately after the word under test** — before
  `=`, whitespace, or the next token. Completion verdicts are cursor-local:
  advancing past an invalid word can hide its sentinel.
- Sentinel rows (`preference:"-20"`, empty `completion`,
  `text:"unknown command"`/`"unknown parameter"`) classify **the word at
  their `offset`** — and also appear *prospectively* at the end of valid
  input, so presence alone is not a verdict. Decision rule (7.21+):
  sentinel with no completing candidate → unknown name; sentinel plus
  candidates at the same offset → ambiguous prefix; candidates only → valid
  partial; a nonexistent *path* returns `[]` outright.
- Feature-detect on old versions: 7.9.2 emits the unknown-*command* sentinel
  but returns bare `[]` for an unknown typed *argument*.
- **Passing inspect validation is necessary, not sufficient.** There is a
  measured inspect-vs-runtime gap: `/console/inspect` accepts forms the
  device rejects at execution (e.g. `blackhole=yes` on a route, where the
  runtime wants the bare `blackhole` flag) [^4]. Only execution on an
  appropriate target proves runtime acceptance.

## Minimum pipeline for a syntax "explain"

1. **Segment** input statically (find command boundaries; preserve offsets).
2. **highlight** the ASCII-normalized input → lexical spans + first error.
3. **`:parse`** only when structure or an error message is needed → nested IL
   or line/column message. Align its error with highlight's error byte.
4. **`child`/`syntax`/`completion`** (or a same-version schema snapshot) →
   split IL's fused path/argument forms, enumerate arguments, fetch enums.
5. **Enrich** with docs/changelog prose — but the live device wins for what
   its inspect surface exposes; only execution proves runtime acceptance.

Steps 1–2 suffice for a lightweight explain; block/scope analysis needs 3;
rich command help needs 4–5. Execution probes (required-args discovery,
`/rest/execute`) mutate state — run them only on explicit request against an
appropriate target.

Whatever the depth, keep provenance with every derived fact: source probe,
RouterOS version + packages, path context, whether the claim is a direct
response or derived, normalization applied, truncation, and outcome
(`ok` / `empty` / `timeout` / `transport-error`).

## References

- [references/highlight.md](references/highlight.md) — per-byte token stream:
  vocabulary, error model, statefulness, drift.
- [references/parseil.md](references/parseil.md) — `:parse` IL: readout
  recipe, grammar, canonicalizations, error behavior.
- [references/command-schema.md](references/command-schema.md) —
  `child`/`syntax`/`completion` response shapes, enum discovery, sentinels.
- [references/validation.md](references/validation.md) — required-argument
  probing and layering live vs static evidence.

[^1]: Full format references with capture artifacts:
    [`highlight-format.md`](https://github.com/tikoci/lsp-routeros-ts/blob/main/docs/highlight-format.md),
    [`parseil-format.md`](https://github.com/tikoci/lsp-routeros-ts/blob/main/docs/parseil-format.md),
    [`inspect-shapes.md`](https://github.com/tikoci/lsp-routeros-ts/blob/main/docs/inspect-shapes.md)
    in tikoci/lsp-routeros-ts — 913-script corpus swept on 7.9.2/7.23.2/7.24rc2
    (highlight, inspect shapes) and 7.20.8/7.22.1/7.23rc1 (parseIL).
[^2]: MikroTik REST API introduction in 7.1beta4:
    <https://help.mikrotik.com/docs/spaces/ROS/pages/47579162/REST+API>.
[^3]: MikroTik support case SUP-127641; per-version probe data in
    [tikoci/restraml](https://github.com/tikoci/restraml) (`deep-inspect.ts`
    `CRASH_PATHS` notes and `docs/<version>/deep-inspect.json`
    `crashPathsCrashed`): bare `do` hangs `syntax`/`completion` on 7.20.8 at
    both 128 MB and 512 MB RAM; all six paths return instantly on 7.21.4+.
[^4]: [tikoci/bench-routeros-tools](https://github.com/tikoci/bench-routeros-tools)
    `REPORT.md` — the `blackhole=yes` inspect-vs-runtime case.
