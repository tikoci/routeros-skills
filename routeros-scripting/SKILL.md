---
name: routeros-scripting
description: "RouterOS scripting language and CLI configuration idioms for .rsc files and interactive commands. Use when: writing or reviewing RouterOS scripts, scheduler/netwatch/on-event snippets, idempotent CLI config, :local/:global/:foreach/:do syntax, [find] selectors, print as-value handling, script permissions, or when the user mentions .rsc, RouterOS script, scripting tips, or CLI config automation."
---

# RouterOS Scripting & CLI Config

RouterOS scripts (`.rsc`, `/system/script`, scheduler `on-event`, Netwatch hooks, and
interactive CLI snippets) use RouterOS's own language. It is **not shell, Lua, Python,
or Tcl**. For the syntax baseline, see [references/syntax.md](./references/syntax.md).
This skill focuses on the traps that LLMs are likely to confidently get wrong.

## Do Not Use Interactive Row Numbers in Scripts

Interactive `print` output shows temporary row numbers (`0`, `1`, `2`...) for the
current console buffer. They are **not stable object IDs** and are not usable inside
scripts.

```routeros
# WRONG in scripts — "1" is only an interactive print-buffer row number
/ip/route/set 1 gateway=3.3.3.3

# Better — internal IDs have a * prefix, but can change if objects are removed/re-added
/ip/route/set *1 gateway=3.3.3.3

# Best — resolve the target at runtime
/ip/route/set [find dst-address="0.0.0.0/0"] gateway=3.3.3.3
```

For generated config, use stable selectors such as `comment=`, `name=`, or a unique
address/list value. Internal IDs are visible in `print as-value` as `.id=*HEX`.

## Treat `[find]` Results as ID Arrays

`[find ...]` returns zero, one, or many internal IDs. Many commands accept that
array directly (`set`, `remove`, `disable`), but code that needs exactly one object
should check the count before `get`.

```routeros
:local ids [/interface/find where name="ether1"]
:if ([:len $ids] = 1) do={
  :put [/interface/get ($ids->0) name]
} else={
  :error ("expected exactly one interface, got " . [:len $ids])
}
```

Use `[find comment="my-tool-tag"]` for idempotent cleanup, not broad selectors such
as `[find dynamic=no]` that can delete unrelated user configuration.

## Quote IP Prefixes in `find` / `where`

RouterOS does aggressive type conversion, but not always in the direction you expect.
For `/ip/address`, the `address` property is stored as a string including the prefix
length. An unquoted literal like `111.111.1.1/24` is an IP-prefix value and may match
nothing.

```routeros
# WRONG — can silently return nothing
/ip/address/print where address=111.111.1.1/24

# Correct
/ip/address/print where address="111.111.1.1/24"

# Correct when value came from a variable
:local prefix 111.111.1.1/24
/ip/address/print where address=[:tostr $prefix]
```

When a query unexpectedly returns nothing, inspect the stored type:

```routeros
:put [:typeof ([:pick [/ip/address/print as-value] 0]->"address")]
```

## `print as-value` Is Usually an Array of Maps

`print as-value where ...` returns `{{...}; {...}}`, even when only one row matches.
Pick a row before accessing a property.

```routeros
# WRONG — tries to read "gateway" from the outer array
:put ([/ip/route/print as-value where gateway="ether1"]->"gateway")

# Correct — pick the first map, then read the property
:put ([:pick [/ip/route/print as-value where gateway="ether1"] 0]->"gateway")
```

For commands without `get`, `as-value` is often the only script-friendly output:

```routeros
:put ([/tool/fetch url="https://example.com/file.txt" output=user as-value]->"data")
```

## Monitor Commands Need `once do={...}`

Commands such as `monitor-traffic` are interactive loops unless told to run once.
Use `once do={}` to capture their temporary values in a script. Hyphenated field
names use `$"name-with-hyphens"`.

```routeros
/interface/monitor-traffic ether1 once do={
  :put ("rx=" . $"rx-bits-per-second")
}
```

Use `:log`, not only `:put`, for scheduler or hook scripts where no terminal is
attached.

## Globals Must Be Re-Declared Where Read

Global variables and global functions are not automatically visible inside another
script or function body. Declare access with `:global name;` before reading or
calling them.

```routeros
:global state "ready"
:global showState do={
  :global state
  :put ("state=" . $state)
}

:global addOne do={ :return ($1 + 1) }
:global caller do={
  :global addOne
  :return [$addOne 5]
}
```

Use unique variable names. Avoid names that collide with RouterOS properties such as
`dst-address`; if you must access such a variable, use quoted variable syntax
(`$"dst-address"`).

## Arrays Are Not JavaScript Arrays

```routeros
# Empty array: {} is a syntax error
:local arr [:toarray ""]

# Indexing and assignment use ->
:set ($arr->"name") "router1"
:put ($arr->"name")
```

String concatenation with `.` distributes over arrays unless you convert first:

```routeros
:local arr {"a"; "b"}
:put ("value=" . $arr)          # two outputs: value=a and value=b
:put ("value=" . [:tostr $arr]) # one output: value=a;b
```

Named keys are sorted alphabetically. Unnamed elements preserve insertion order but
are moved before keyed elements.

## Files Have CLI-Specific Limits

RouterOS has no direct "create empty file" or append primitive. The documented
workaround creates a file via `print file=...`, then writes `contents=`.

```routeros
/file/print file=myFile
/file/set myFile.txt contents=""
```

To append, read the existing contents, concatenate, and write the whole file back.
Large files and binary content are a poor fit for RouterOS scripts; prefer `/tool/fetch`,
REST, SCP/SFTP, or external tooling when possible.

## Script Policies Are Part of Correctness

Scheduler, Netwatch, PPP `on-up`, and similar hooks execute with limited policies.
If a script needs files, backups, passwords, sniffing, or reboot rights, the caller
must have the matching policy.

```routeros
/system/script/add name=backup policy=read,write,ftp,sensitive source={
  /system/backup/save name=daily
}
```

Be cautious with `dont-require-permissions=yes`: it allows less-privileged callers
to run the script with the script's own policy set. Use it only for deliberately
bounded scripts.

## Validate Command Shape Before Running

For unknown attributes, flags, and package-dependent commands:

1. Prefer the new MikroTik manual CLI Reference:
   <https://manual.mikrotik.com/docs/CLI%20Reference/>
2. For a live router or exact RouterOS version, `/console/inspect` is the ground
   truth. See the `routeros-command-tree` skill.
3. When available, use `rosetta` MCP (`routeros_explain_command`,
   `routeros_command_tree`) for read-only explanation before execution.
4. If uncertain and a local CHR is available, use `quickchr exec <name> '<command>'`
   on a disposable instance before publishing the script.

## Official Docs to Review First

- New RouterOS manual home: <https://manual.mikrotik.com/> — replaces the older
  Confluence-based `help.mikrotik.com` documentation over time.
- Scripting tips and tricks:
  <https://manual.mikrotik.com/docs/Developer%20Guides/Scripting/scripting-tips-and-tricks/>
- Scripting examples:
  <https://manual.mikrotik.com/docs/Developer%20Guides/Scripting/scripting-examples/>
- CLI Reference:
  <https://manual.mikrotik.com/docs/CLI%20Reference/> — browsable command/property
  schema organized by package and command path.
