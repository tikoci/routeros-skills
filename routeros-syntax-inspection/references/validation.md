# Required arguments and evidence layering

## No inspect surface exposes requiredness

Measured across `/console/inspect` and parseIL (evidence:
[`parseil-format.md` §5.2](https://github.com/tikoci/lsp-routeros-ts/blob/main/docs/parseil-format.md)
and
[`required-args.md`](https://github.com/tikoci/lsp-routeros-ts/blob/main/docs/required-args.md)):

- `completion` returns every `add` argument with identical metadata
  (`preference:96`, `style:"arg"`) — no `required` field, no priority split.
- `syntax` descriptions carry type hints, not requiredness.
- parseIL's `findwhere=` dump lists **every** property of a menu (required,
  optional, and read-only alike) — the only structural asymmetry is that
  positional-insertion args like `place-before` never appear in it.

## The execute-error probe — the one reliable signal

Running `add` with no arguments produces a machine-parseable error:

```text
Script Error: missing value(s) of argument(s) <arg1> <arg2> … (<path>/add; line 1)
```

Probe shape (creates and immediately removes a row when `add` succeeds):

```routeros
:local id [/some/menu add]; :put $id; /some/menu remove $id
```

**This is an execution probe, not inspection** — it can mutate state (an
interrupted run leaves a row behind; some menus have side effects). Run it
only against a disposable target (e.g. a lab CHR) and never as part of a
read-only explain path.

Measured on 7.20.8 / 7.22.1 / 7.23rc1 (~230 add-capable paths each):
~65% of paths report the exact `missing value(s)` pattern, ~22% need no
arguments at all, ~9% use custom human text (`"address or mac-address is
required"`, one-of rules), and a handful error out (read-only or stateful
menus). Caveats:

- Custom-text rows encode **one-of / conditional** rules — keep the raw
  message as the source of truth, don't flatten to a set.
- Conditional requirements need a second pass after providing the
  discriminator (`/disk add type=iscsi` then requires `iscsi-address`).
- The result is **version-specific**: required sets drift across releases
  (six paths changed across the three captured versions). Key any cached map
  by menu path + RouterOS version.

## Layering live and static evidence

When a live device and a static snapshot (schema dump, docs) disagree:

- The **live target wins** for what its inspect surface exposes — existence,
  token classes, candidates.
- **Only execution proves runtime acceptance** — inspect has measured
  false-accepts (see
  [command-schema.md](command-schema.md)).
- **Static sources win** only for what they uniquely provide: prose,
  history/changelogs, cross-version comparisons.

Keep every derived fact answerable to "how do we know?": record the source
probe, whether the claim is a direct response or derived, RouterOS version +
installed packages, path context, input normalization/truncation, and the
outcome class (`ok` / `empty` / `timeout` / `transport-error`) — an empty
array is an answer; a timeout is not.
