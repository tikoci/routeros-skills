# Skill Backlog

This file tracks proposed new `routeros-*` skills and improvements to existing ones.

It is organized by **how weak an LLM's pretraining is likely to be** on each topic
— highest weakness → highest value of a grounded `SKILL.md`. A skill's job is
not to re-teach things the model already knows; it's to correct the things the
model is likely to confidently get wrong.

Weakness is assessed from the perspective of a modern general-purpose LLM
(Claude Opus 4.x class, training cutoff late 2025 / early 2026). The signals:

- **Recency** — RouterOS subsystems added or reworked in v7 (roughly 2021+) and
  especially the 7.13+ wifi pivot, 7.18+ package flow, 7.21+/7.22+ `/app`,
  7.22+ inline container env/mount — these are underrepresented in training data.
- **Vendor idiosyncrasy** — MikroTik patterns that superficially resemble
  common Linux concepts (firewall, containers, bridges) but diverge in ways a
  model will confidently paper over with Linux defaults.
- **Scripting corpus scarcity** — `.rsc` has a tiny public corpus vs. bash/python;
  the model often invents syntax.

## Legend

- **Priority** — H/M/L by expected value of a grounded SKILL
- **Grounding** — where facts should be sourced from (tikoci project, MikroTik
  docs page, `/console/inspect` query, anchor test, etc.)

---

## H — New skills, high value

### `routeros-scripting`

RouterOS scripting language (`.rsc` and interactive). Currently one reference
file inside `routeros-fundamentals/references/scripting.md`, but the topic is
large and LLM-hostile enough to warrant its own skill.

LLMs conflate `.rsc` with bash, shell, or TCL. Common invented syntax:
`if ($var == "foo") then`, `echo $var`, backtick command substitution. None of
these exist. Real idioms: `:if ($var = "foo") do={ ... }`, `:put $var`,
`[/system/resource/get board-name]`.

Suggested contents:
- Variable scoping (`:local`, `:global`) and why assigning to an undeclared
  variable fails
- Control flow (`:if`, `:foreach`, `:while`, `:do { } on-error={ }`)
- Arrays, iteration, `:tonum`/`:tostr`/`:totime` type coercion
- String ops: `:pick`, `:find`, `:len`, `[:toarray [$str]]`
- Command substitution vs. property access (`[...]` vs `$...`)
- `:do { } on-error={ }` and when to use it vs. not
- Scheduler patterns — `/system/scheduler` to run scripts, run-count semantics
- `:serialize to=json` for REST-friendly output from any CLI output
- Files vs. interactive: `.rsc` file semantics and `/import`

Grounding: tikoci/lsp-routeros-ts (grammar + builtins), MikroTik docs
"Scripting" pages, rosetta MCP for builtin list.

### `routeros-wifi`

The "new" wifi package (7.13+), which displaces legacy `wireless`. This is the
single biggest area where LLM training data is wrong, because (a) it's recent
and (b) there's a parallel legacy system most training data describes.

Key things the model needs told:
- `/interface/wifi` (new) vs. `/interface/wireless` (legacy) — both exist, both
  valid, do not mix
- Package names: `wifi-qcom`, `wifi-qcom-ac`, `wifi` — which chipset takes
  which package; `wifi-qcom` is not just "the ARM wifi package"
- Configuration profiles: `/interface/wifi/configuration`, `/interface/wifi/security`,
  `/interface/wifi/channel`, `/interface/wifi/datapath` — the "slice"
  approach is different from legacy's monolithic interface config
- CAPsMAN v2 (now integrated, not a separate package)
- Which hardware supports the new package and which is stuck on legacy

Grounding: MikroTik docs "WiFi" top-level page, `/console/inspect` for
`/interface/wifi`, rosetta MCP. Hardware coverage from
rosetta's device lookup.

### `routeros-routing-v7`

Routing was reorganized for v7. Key changes LLMs often miss:
- Routing tables are first-class objects: `/routing/table/add name=... fib`
- `/routing/rule` routes between tables (policy routing)
- BGP, OSPF, RIP moved under `/routing/bgp`, `/routing/ospf`, `/routing/rip`
  with new object models (instances, templates, peers/neighbors)
- VRF (`/ip/vrf`) is usable
- Route attributes (`/ip/route` vs legacy) and `gateway=` resolution
- `routing-mark` → `.mark` in v7 / table assignment via rules
- RPKI, BFD, MPLS-LDP settings

LLMs very often write v6 syntax (`/ip/route/add routing-mark=...`) that no
longer applies cleanly in v7.

Grounding: MikroTik help.mikrotik.com pages under Routing, `/console/inspect`
at `/routing/bgp/*` and `/ip/route`, rosetta MCP.

### `routeros-firewall`

Firewall is superficially similar to iptables but the model will default to
iptables assumptions in subtle ways:
- Chain ordering inside filter/nat/mangle (rules are position-ordered, not
  priority-based)
- `action=passthrough` vs `accept`/`drop`/`jump` semantics
- `connection-state=new,established,related,invalid` and RouterOS's `untracked`
- `raw` table — bypasses connection tracking (performance for DDoS)
- `fasttrack-connection` and its interactions with mangle
- Address-lists (`/ip/firewall/address-list`), dynamic vs static, timeout
- `log=yes` + `log-prefix` for debugging, where logs show up (/log)
- `in-interface-list` / `out-interface-list` — interface-list membership is
  a powerful pattern LLMs rarely propose
- Port protocol and service matchers (`protocol=tcp dst-port=80,443`)
- IPv6 firewall (`/ipv6/firewall`) is separate — never forget this

Grounding: MikroTik "Firewall" help pages, rosetta MCP, anchor examples in
a future `test/firewall/` inside tikoci tooling.

### `routeros-bridge-vlan`

Bridge VLAN filtering is where real-world RouterOS configs break most often,
and where LLMs most often give answers that "look right" but don't work on
the actual chip offload.

Key concepts:
- `/interface/bridge` with `vlan-filtering=yes` changes the model entirely
- `pvid=` on bridge ports (untagged ingress tagging)
- `/interface/bridge/vlan` table — tagged vs untagged membership per VID
- Frame types (`admit-only-untagged-and-priority-tagged`, etc.) on ports
- MAC learning with vlan-filtering (per-VLAN FDB)
- Hardware offload: `hw=yes` on bridge vs per-port, what that means on
  different chips (CRS3xx, CRS5xx, RB5009, hEX series)
- `ingress-filtering=yes` on bridge — widely recommended, often forgotten

Grounding: MikroTik "Bridging and Switching" help pages; rosetta MCP for
device-specific switch chip capabilities (`routeros_device_lookup`).

### `routeros-certificates`

Certificates touch IPsec, HTTPS (WebFig/REST), WireGuard (indirectly), SSTP,
OpenVPN. The model often mixes OpenSSL semantics with RouterOS's.

Key:
- `/certificate/add` vs `/certificate/import` (different intents)
- PEM vs DER detection, passphrase handling
- SCEP, Let's Encrypt (`/certificate/enable-ssl-certificate-trust`)
- Template → sign flow, self-signed CA creation
- `key-usage=`, `trusted=` fields
- Export (private key extraction) — restrictions
- Certificate chain handling and common-name / subject-alt-name

Grounding: MikroTik "Certificates" help page; CHR lab examples.

---

## M — New skills, medium value

### `routeros-queues-qos`

Simple queues vs queue tree vs CAKE vs HTB. Mangle marking patterns
(`packet-mark` + `connection-mark` flow). Interface queue types.
`pcq-rate`, `pcq-classifier`. Bufferbloat and CAKE (7.x+).

LLMs tend to recommend queue-tree + mangle for everything even when a simple
queue would work, because queue-tree looks more like tc.

### `routeros-tools`

`/tool/fetch` (the go-to HTTP client inside RouterOS), `/tool/traceroute`,
`/tool/bandwidth-test`, `/tool/torch`, `/tool/ping-speed`, `/tool/profile`,
`/tool/graphing`. The utility command set.

`fetch` specifically — auth handling, headers, HTTPS cert validation defaults,
`keep-result=no` for side-effect-only, saving to `/file`, multipart uploads.

### `routeros-interface-lists`

`/interface/list` + `/interface/list/member` is a foundational RouterOS
pattern for firewall/policy that LLMs rarely surface. Worth a short skill.

### `routeros-logging`

`/system/logging` topics and actions (memory, disk, remote syslog, email).
Log file rotation and retrieval. Which topics matter for which subsystem
(`container`, `wireguard`, `wifi`, `dhcp`). A short skill — maybe one page —
would prevent a lot of wrong advice.

### `routeros-wireguard`

Peer, endpoint, persistent-keepalive semantics. Key generation (`/interface/wireguard/peers/add`
vs manual). Allowed-address and routing interactions. Preshared-keys.
WireGuard on RouterOS has a few idiosyncrasies around `mtu` and firewall
interactions worth grounding.

### `routeros-files-and-backup`

`/file` system, upload/download mechanisms (SCP, FTP, REST PUT, Winbox, WebFig),
`/export` (plaintext config), `/system/backup/save` (binary), `.rsc` vs
`.backup` semantics, restoring across hardware types.

---

## L — Nice to have, or could be references under existing skills

- `routeros-hotspot` — captive portal, walled-garden. Large surface area
  but niche in 2026.
- `routeros-radius-usermanager` — RADIUS client/server, User Manager.
- `routeros-snmp` — `/snmp`, community/v3, OIDs.
- `routeros-ipv6` — might fit better as a reference file in firewall/routing
  skills rather than its own top-level skill.
- `routeros-api-proto` — the binary API on 8728/8729. Mostly legacy — REST is
  preferred.
- `routeros-dude` — The Dude monitoring. rosetta has a Dude dataset; a short
  skill pointing at that MCP could be useful.
- `routeros-tr069` — CWMP/TR-069 client config.

---

## Improvements to existing skills

### `routeros-fundamentals`

- Add a short section on **RouterOS version policy**: which channels map to
  stable vs testing, what "long-term" means, how the `NEWESTa7.<channel>`
  endpoint works. Some of this is in `version-parsing.md` but the "which
  channel should I target?" decision isn't captured.
- Add a pointer to the BACKLOG (this file) so model contributors know what's
  planned vs what exists.

### `routeros-qemu-chr`

- **De-duplicate** acceleration/CPU-model advice with tikoci `quickchr` once
  that project is published — the skill should describe *why* and point to
  the project for the actual heuristic.
- Consider adding a **boot-fail decision tree**: "image won't boot → is it
  UEFI vs MBR?, correct pflash size?, virtio-blk-pci explicit on aarch64?,
  KVM/HVF arch-match?".
- The q35-vs-pc rationale now points to `tikoci/mikrotik-gpl` for kernel
  config evidence — consider expanding the `references/` with a short
  kernel-config summary pulled from that repo.

### `routeros-container`

- A short example of the common "container on bridge, container on L2, container
  in its own L3" decision tree.
- Note on external-disk requirement — currently mentioned but could be more
  emphatic (USB / M.2 SSD; internal NAND does not have the IOPS).

### `routeros-netinstall`

- Mode script (`-sm`) examples — the skill mentions it but doesn't show a
  ready-to-copy mode script. Add one for the common case (enable container
  device-mode + set timezone).

### `routeros-command-tree`

- A short worked example of turning `/console/inspect` output into a RAML or
  JSON-Schema fragment, grounded in what `restraml` emits.

---

## Cross-cutting: grounding / footnote wishlist

Per the repo's "less detail, but grounded" principle, these are places where
existing claims would benefit from a visible grounding reference:

- **Wherever a version is cited** (`7.18+`, `7.21+`, `7.22+`) — add a pointer
  to the rosetta MCP query or `/console/inspect` diff that proves the
  boundary. Version boundaries are the most common "one confident data point
  becomes a general rule" failure mode.
- **Anywhere a property name appears without a version qualifier** —
  properties silently rename across versions (the most recent example: env/mount
  reference properties 7.20 → 7.21). Default assumption should be "this may
  have moved; verify via rosetta."
- **Any "this works, that doesn't" claim** — should cite the anchor test or
  lab notebook that exercises it. `bun-runtime-gotchas.md` does this well;
  other references could copy the pattern.

---

## Housekeeping

- Consider a `CONTRIBUTING.md` or section in the README that codifies the
  "grounding discipline" — each non-obvious claim cites a public tikoci repo,
  mikrotik.com docs URL, `/console/inspect` query, or anchor test.
- Consider adding a simple CI check that each SKILL.md starts with valid
  frontmatter and a leading `# Title` heading, and that `references/*.md`
  linked from a SKILL actually exist.
