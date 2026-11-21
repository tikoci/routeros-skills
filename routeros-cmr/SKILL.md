---
name: routeros-cmr
description: "Configure or debug MikroTik CMR on RouterOS 7.26 betas (grounded on 7.26beta5): the optional cmr controller package, built-in /cmr/client, routed controller-addresses, MNDP or DNS discovery, TCP/54321, pairing on both sides (password/confirm defaults, the half-paired state), labels, fleet run-script and its policy, alerts and HTTP webhooks, topology, upgrade rules, package directories, export and backup. Use for a CMR controller or client, waiting-for-pairing, a client that says paired but is never selected, CMR alert or upgrade rules, fleet run-script, CMR VLAN port-labels, or the /cmr menus. Use routeros-tikoci-quickchr for a disposable CMR lab and routeros-tikoci-centrs for validated device operations. CMR monitors RouterOS clients; it is not a general SNMP/ping replacement for The Dude."
---

# RouterOS CMR

Grounded on **RouterOS 7.26beta5, x86 CHR**. CMR is new in the 7.26 development
builds and changed between them, so every version-specific statement below names
its build. quickchr's [CMR findings][findings] are the source of truth: one
column per build, a source mark on every cell, and the lab evidence. Read that
table for per-build detail instead of trusting older prose, including older
versions of this skill.[^findings]

CMR manages RouterOS devices: inventory, resource/availability/log alerts,
fleet scripts and upgrades, topology, and WiFi/VLAN provisioning. It does not
provide general ping/SNMP/HTTP monitoring of non-RouterOS equipment.[^docs]

## Versions and packages

| Build | Released | CMR changelog |
|---|---|---|
| 7.26beta1 | 2026-10-01 | First CMR build |
| 7.26beta2 | never published | A change "since beta2" means since beta3 for anyone booting a build |
| 7.26beta3 | 2026-10-16 | 17 lines: pairing, export, first interface alert, identity sync |
| 7.26beta4 | 2026-10-27 | 5 lines: alert-test policy, VLAN `port-labels`, effective values in print |
| 7.26beta5 | 2026-10-30 | 2 lines, both WiFi Clients-table display fixes. The [client script policy](#fleet-scripts-and-policy) differs from the manual but is not in any changelog |

Record both the controller's and the client's version in any report or
reproduction. The optional `cmr` package goes on the controller only; clients use
the built-in `/cmr/client`.[^findings][^log]

The manual lists arm, arm64 and x86 for the controller package. Clients exclude
smips and powerpc. The labs here are x86 CHR only: arm64 controllers, physical
radios and IPv6 transport are not grounded.[^docs][^findings]

## Server, service and client discovery

```routeros
/cmr set enabled=yes track-topology=yes fetch-comments=yes auto-labels=all
```

The controller lists its own built-in client in `/cmr/device`. A dynamic service
named `cmr` listens on TCP/54321; scope it with the input firewall.[^lab]

```routeros
/cmr/client set enabled=yes controller-addresses=10.255.0.1
```

A client with `controller-addresses` connects to that address, which may be
routed (the lab reaches a loopback over OSPF through a transit router).[^lab]
Without it, the manual says the client finds the controller through MNDP or DNS:
it resolves `_cmr._tcp.lan` and `_cmr._tcp.<domain>`, where `<domain>` is the
domain name from DHCP option 15. DNS discovery is untested here.[^docs]

In the 7.26beta5 MNDP trials, a controller with `/cmr` enabled announced itself
at once (TLV 18 = `02`), and the client's `/ip/neighbor` row showed
`running=cmr`. The client connected from its neighbor table: its SYN left 11–35
ms after `enabled=yes`, with no new announcement in between. MNDP carried nothing
about pairing, and a client's own CMR state was not in its announcements.[^beta5]

**A connect that stalls for about 85–90 s is a TCP connect timeout, not a CMR
retry.** Two cases were measured, and the fix differs:

- **7.26beta5, client enabled right after its link address was added:** in
  quickchr's two-router lab (11 of 11 fresh boots), the client's first SYN left
  through the **link** interface with the **management** NIC's source address
  (10.0.2.15, QEMU user-mode). Every lab router has that address, the controller
  included, so no reply could reach the client: it gave up after about 85 s, then
  connected from the link address at once. The four-router lab, which enables
  clients minutes after addressing them, connected within 35 ms. Why the first
  connect picks that source is not established. On a network with unique
  management addresses such a SYN might be answered instead, and the session would
  run from that address (untested).[^beta5]
- **7.26beta1, route withdrawn:** while OSPF had no route to the controller, the
  connect left via the default route out of the management interface, and its
  retransmits kept that source after the route returned (about 90 s). A TCP reset
  for tcp/54321 out of the management interface made the client retry at once.
  That rule does **not** catch the beta5 case, whose SYN leaves through the link
  interface.[^beta1]

When pairing takes a minute and a half, check both the SYN's source address and
its egress interface before blaming CMR.

Read `/cmr/client` for `status`, `pairing-status`, `controller-address` and
`controller-identity`, but read pairing from both sides (next section).

The controller's own `/cmr/device` row reports `connected=false` although its
self-client is paired, has an upgrade rule, and runs fleet scripts (beta1 and
beta5). Do not require the C flag on that row when checking fleet
readiness.[^lab]

### Disabling the client

The manual says disabling the client (`/cmr/client set enabled=no`) removes the
configuration CMR provisioned on the device, and that enabling it again
"reconnects the client with its existing pairing".[^docs]

The second half did not hold on 7.26beta1 or 7.26beta5: after `enabled=no` then
`enabled=yes` the client came back `device:password required`, and the
controller kept the row as `remote-pending` until it was paired again. MikroTik
staff said this is intended. Avoid toggling `enabled` on a paired client unless
losing the provisioned configuration and re-pairing are both acceptable.
`/cmr/client/forget` clears pairing on purpose.[^beta5][^vendor]

What kept the pairing: on 7.26beta1, a clean client reboot, a hard power-off and
a controller reboot; on 7.26beta5, a power-off of a routed client and a
controller reboot after loading a binary backup.[^beta1][^lab]

## Pairing: read both sides

Both ends have a `pairing-requirement` of `none`, `password` or `confirm`. The
controller has a global value (`/cmr`) and a per-device override
(`/cmr/device`). There is no separate CMR pairing password: the controller-side
`pair` takes a RouterOS login **on the client**, the client-side `pair` a login
**on the controller**. Each side's login is needed only when the other side
requires `password`; a bare `pair` on either side approves that side
locally.[^docs][^lab]

On 7.26beta5:

- A fresh client defaults to `password`; a fresh device row on the controller to
  `confirm` (the manual does not state the controller default).[^beta5][^docs]
- With those defaults, a fresh client stayed pending without a `pair` command (3
  of 3 trials in centrs' lab).[^findings]
- Client `pairing-requirement=confirm` is accepted (7.26beta1 rejected it with a
  syntax error). A client set to `confirm` waits with `device:waiting
  confirmation` until it is approved locally.[^beta5]
- Changing a paired client's `pairing-requirement`, including unsetting it back
  to the default, makes it pair again.[^beta5]
- In the six-combination matrix (client `none`/`password` × device
  `none`/`password`/`confirm`), `none`/`none` paired automatically and the others
  paired with one command: a client `pair` with a controller login, a bare
  controller `pair`, or a credentialed one. Client `password` + device `confirm`
  was the only combination **observed** to half-pair (below); one run of each
  combination per lab, so other triggers are not ruled out.[^beta5][^lab]

The unpaired row's `state` spells out both sides as
`pair: device:<client condition>, cmr:<controller condition>`.[^beta5]

### The half-paired state (7.26beta5)

| State | Client `status` | Controller `/cmr/device` row (the connected one) | `run-script` |
|---|---|---|---|
| pending | `waiting-for-pairing,connected` | `pending` (flag `P`), maybe `remote-pending` (`p`); `state="pair: device:…, cmr:…"` | `no devices selected` |
| paired | `paired,connected` | `connected=true`, **no** `state`, has `upgrade-rule` and `channel` | selects it |
| half-paired | `paired,connected` | `connected=true`, `state="pair: device:ok, cmr:ok"`, no `upgrade-rule` | `no devices selected` |

Both paired and half-paired rows read `pairing-requirement=none`, so that field
proves nothing.[^beta5]

**The client's `paired,connected` alone does not prove pairing.** A half-paired
session is idle (TCP keepalives only). After any reconnect (a controller CMR
restart, or a reboot of either side) the client is pending again and the row reads
`cmr:waiting confirmation`: the controller's approval was never stored.[^beta5]

A readiness check: several rows can exist briefly after a reconnect, so pick the
row for the client's identity with `connected=true`. Require that row to have an
empty `state` and an `upgrade-rule`, and the client to read `paired,connected`.
Where it matters, confirm that `run-script` selects the device and returns its
output. The controller's own row is the exception noted above.[^beta5]

With the 7.26beta5 defaults (client `password`, device `confirm`), the manual's
single credentialed command half-paired 7 of 9 fresh pairings on three boots, and
24 of 26 on two more; centrs saw anywhere from 0 to 100% per boot:[^beta5][^centrs]

```routeros
# Can half-pair on 7.26beta5:
/cmr/device/pair [find identity="lab-client"] username=client-user password="..."
```

Its output predicts the result: a last table ending `device:ok, cmr:ok` meant
half-paired, `paired` meant committed, in every captured trial. **Committed**
means still paired after the controller's CMR service restarts (`/cmr set
enabled=no`, then `enabled=yes`), a lab check that drops every client's session.
These sequences were committed 9 of 9 each, interleaved on the same
boots:[^beta5]

```routeros
# 1. Controller approves first, then supplies the client's login:
/cmr/device/pair [find identity="lab-client"]
/cmr/device/pair [find identity="lab-client"] username=client-user password="..."

# 2. Bare pair on both sides. The client's /cmr/client/pair blocks until the
#    controller approves, so run the two concurrently, not one after the other.
/cmr/client/pair                                            # on the client
/cmr/device/pair [find identity="lab-client"]               # on the controller

# 3. Client drops its requirement and renegotiates:
/cmr/client/set pairing-requirement=none                    # on the client
#    wait until the controller's connected row shows device:ok in its state;
#    a pair sent earlier selects nothing and prints nothing
/cmr/device/pair [find identity="lab-client"]               # on the controller
```

To recover a half-paired client, run one bare `/cmr/device/pair` for it; a reboot
does not fix it. On 7.26beta5 that committed 24 of 24, and each repaired pairing
survived a controller CMR restart.[^beta5]

Client-side `none` accepts pairing without the client's approval; the
controller's own `password` or `confirm` must still be satisfied. Use real client
credentials and explicit controller approval for anything but a lab.[^docs]

## Labels, fleet scripts and topology

```routeros
/cmr/device/set [find identity="lab-client"] labels=lab,remote
/cmr/device/run-script labels=lab script=":put [/system/identity get name]"
/cmr/layout/add name=lab
/cmr/layout/add-devices [find name=lab] labels=lab
/cmr/layout/rebuild-links [find name=lab]
```

Plain labels are OR; `+label` requires a label and `-label` excludes it. Combined
predicates were not exercised by the labs.[^docs]

Fleet-script results include progress sections, and a device's successful output
can appear in more than one. Check the final result **per device** rather than
counting output occurrences. The labs built layouts whose nodes and links match
their socket topology; maps and dashboards in WinBox 4/WebFig were not
verified.[^lab]

### Fleet scripts and policy

**The controller login is the gate.** The manual does not say what the caller
needs. Measured: on 7.26beta1 a login without `write` could dispatch a
`run-script` that wrote on the client; from 7.26beta3 it is refused with
`not enough permissions (9)` (over REST, beta3 dropped the connection
instead).[^centrs]

On 7.26beta5, four controller groups that all had `read,test,api,rest-api` were
tested. Adding `write` alone or `reboot` alone was refused for both
`run-script` and `/cmr/alert/test`; adding both let `run-script` run and
`alert/test` return without a permission error. `read` and `test` were not
varied. The beta4 changelog says only that `alert/test` requires `write`. A
`read`-only login can still list `/cmr/device`.[^beta5][^log]

**On the client, a script is not bounded by the documented policies.** The manual
says scripts sent with `run-script` run on each client "with the `read`, `write`,
`test`, and `reboot` policies, without a user session", so `/user add` should
fail.[^docs] On 7.26beta5, separate one-line scripts, sent from the full `admin`
login and from the least-privileged login tested
(`read,write,reboot,test,api,rest-api`), gave the same results on the client:

- created a `group=full` user and a new group;
- printed a PPP secret's password in clear;
- saved a script with all six requested policies (owner `*sys`);
- saved an unencrypted binary backup;
- `/tool/sniffer/start` returned success (whether the sniffer ran was not read
  back).

Only `/export file=` was refused. Treat a `write,reboot` controller login as close
to full control of every client it can select, and give it out
accordingly.[^beta5]

## Alerts and HTTP webhooks

```routeros
/cmr/alert/add name=down labels=remote disconnected-more-than=10s \
  action.log="DOWN [identity] [address]" severity=high
```

The example rules are disabled by default. Log-regex, bridge-added, connected,
disconnected-more-than and rebooted alerts and HTTP webhooks fired with
`action-failures=0` on 7.26beta1 and 7.26beta5. Resource exhaustion, upgrade
results and health sensors were not induced.[^lab]

- **`upgrade-done`** is not a boolean. The default rules on 7.26beta1 and
  7.26beta5 use `success` and `fail`; the CLI reference also documents `yes`
  (the default) for any outcome.[^lab][^docs]
- From 7.26beta3, `rebooted=no` and `unpaired-device-connected=no` create no
  condition (changelog only).[^log]
- **First interface added:** on 7.26beta1, the first bridge added to a device
  with no bridges did not fire `interface-change=added`; later ones did. The beta3
  changelog lists a fix. On 7.26beta5 the first bridge fired in 2 of 2 trials
  where the rule already covered the client; an earlier run with a 5 s old rule
  missed it without confirming coverage. Wait for the rule to cover the device
  before testing.[^beta5][^beta1][^log]
- On 7.26beta1, `interface-type` offered only `any`, `ethernet`, `wifi` and
  `bridge`, and VRRP additions never alerted. Not re-checked on beta5.[^beta1]
- **Log alerts** install a managed `/system/logging` entry on the client with
  `action=cmr`, the requested topics and regex. Wait for that entry before
  emitting a test log.[^lab]
- **Webhooks** use `action.http-url`, `action.http-method`, `action.http-body` and
  `action.http-headers`. Send an explicit `Content-Type`, and check
  `action-failures` as well as delivery.[^lab]
- **Reconnect alerts:** `connected=yes reset-on-disconnect=yes`. Alerts are not
  immediate: poll state with an explicit bound. The lab allows up to 120 s for its
  disconnect and reconnect checks.[^lab]

A 7.26beta1 hardware session saw `[address]=unknown` while a client was down and
an empty address for the controller. Identify devices by identity or label in
alert text, not by address. Script actions, other placeholders, `show-devices` and
health thresholds remain docs-only here.[^beta1][^docs]

## Upgrade rules and package directory

The manual says the first rule in the list that matches a device claims it, and
the dynamic `default` rule (`channel=stable`) covers devices no other rule
claims. A user rule is matched by list position, not by how specific its labels
are: an earlier rule with `labels=all` claims everything.[^docs] On 7.26beta1 and
7.26beta5, editing the `default` rule returned `can't edit default rule`, and a
matching labelled rule claimed devices ahead of it.[^lab]

**The offered version can be older than the installed one.** On 7.26beta1 the
`default` rule offered stable 7.24.5 to beta1 devices; on 7.26beta5 no
`available-version` appeared within 60 s of pairing (a version check was not
awaited). Separately on beta5, a rule pinned to `channel=7.26beta1` gave beta5
devices `available-version=7.26beta1` and `upgrade-available=true` (flag `U`) and
fired the `upgrade-available` alert. MikroTik staff said the older offer is
intended, and the manual says the offered version "can be earlier than
installed" and that a pinned channel can downgrade devices. The U flag means "a
different version is offered", not "newer".[^beta1][^beta5][^vendor][^docs]

Add a lab rule without a schedule, and never call `upgrade` or `trigger` in a
lab that must keep its version:

```routeros
/cmr/upgrade/add name=lab-pinned labels=lab channel=7.26beta5 \
  strategy=sequential fail-policy=stop
```

`packages-directory` must name an existing directory and end with `/`. Without
the slash, 7.26beta1 and 7.26beta5 return `input does not match any value of
packages-directory`. Changing it restarts CMR and clients reconnect (documented).
Read cache and schedule settings from the current manual.[^lab][^docs]

```routeros
/file/add type=directory name=cmr-packages
/cmr set packages-directory=cmr-packages/
```

## Export, backup and identity

| | 7.26beta1 | 7.26beta5 |
|---|---|---|
| `/cmr/export` includes `/cmr set …` | no | yes, every value that was set |
| `/cmr/device/export` | missing | `add identity= ids= pairing-requirement=` per row, with `labels=` |
| Binary backup restores settings, labels and pairing IDs | yes | yes |

The beta3 changelog listed fixes for the missing settings export, the missing
device export command, and identity changes not syncing; 7.26beta5 measurements
confirm all three. On 7.26beta5, `/cmr/device/set identity=` renames the client,
and a client rename updates the row. Keep a binary backup anyway: it is the only
path the labs have shown restores pairing.[^beta1][^beta5][^log]

On 7.26beta5, `/cmr/print` lists only values that were set; REST `/cmr` returns
the set values plus `local-id` and `self-client-id`.[^beta5]

## VLAN, WiFi and application traffic

Not grounded by a lab here: CHR has no radios, and VLAN provisioning can cut a
lab's own CMR link. From other sources, by build:

- **7.26beta4:** `/cmr/vlan/add` without `port-labels` is refused
  (`missing =port-labels=`), measured on a disabled add; beta3 accepted it. The
  beta4 changelog fixes VLAN rules being applied to all ports when `port-labels`
  is not set.[^centrs][^log]
- **7.26beta4, MikroTik staff:** an empty or unset port selector on an existing
  rule can include the uplink. Set `port-labels` explicitly.[^vendor]
- **7.26beta5 era, MikroTik staff:** disabling and enabling the server or a VLAN
  rule rebuilds `cmr-bridge` with a new ID, so management configuration attached
  to that bridge by hand can lose connectivity. A later beta is announced to reuse
  an existing enabled bridge; beta5 does not.[^vendor]

## Still open

DNS discovery, push-button pairing, application traffic, IPv6, NAT between
client and controller, the global server pairing policy, arm64 CHR, and why the
half-pair hits some boots and not others. CHR has no WiFi radios or physical
health sensors; a configured rule is not evidence that those paths work. The
findings page keeps the open questions.[^findings]

[findings]: https://github.com/tikoci/quickchr/blob/main/examples/cmr/FINDINGS.md
[example]: https://github.com/tikoci/quickchr/tree/main/examples/cmr

[^findings]: quickchr [`examples/cmr/FINDINGS.md`][findings] (CMR findings, by
    build), read at
    [`9bce9f2`](https://github.com/tikoci/quickchr/blob/9bce9f237a1815cb5ae25cfde71b29cd45272073/examples/cmr/FINDINGS.md),
    2026-11-20.
[^beta5]: 7.26beta5 x86 CHR. quickchr CMR example studies on a Linux KVM host,
    2026-11-12 to 2026-11-14 (`evidence/7.26beta5/`: `pairing.json`,
    `policy.json`, `recheck.json`, `wire.json`, `demo-probe.json`), and the
    `repair` study on an Intel Mac (HVF), 2026-11-20 (`repair.json`), summarized
    in [FINDINGS.md][findings].
[^lab]: The [CMR example][example]'s four-router lab (controller, transit, routed
    remote over OSPF, direct discovery client) with `--probe`. It passed on
    7.26beta1 (2026-10-05), on 7.26beta5 on a Linux KVM host
    (`evidence/7.26beta5/demo-probe.json`, where the `password`/`confirm` matrix
    case half-paired and was finished with a bare `pair`), and again for this
    revision on 2026-11-20, x86 CHR under HVF on an Intel Mac, quickchr `main` @
    `5573f30` (`evidence/7.26beta5/demo-probe-hvf-2026-11-20.json`), where all six
    matrix cases committed.
[^beta1]: 7.26beta1 only: the original quickchr lab (2026-10-05,
    [REPORT.md](https://github.com/tikoci/quickchr/blob/main/examples/cmr/REPORT.md)
    and `evidence/7.26beta1/`) or an earlier hardware session the same day (arm64
    controller, mipsbe client). Not re-measured on a later build.
[^centrs]: centrs integration lab:
    [#456](https://github.com/tikoci/centrs/issues/456) (beta1 run-script),
    [#527](https://github.com/tikoci/centrs/issues/527) (beta3 refusal; per-boot
    half-pair rate),
    [#655](https://github.com/tikoci/centrs/pull/655) (VLAN `port-labels`, beta3
    vs beta4).
[^vendor]: MikroTik staff on the forum:
    [client `confirm` and disable/enable](https://forum.mikrotik.com/t/claude-and-codex-try-out-cmr-in-7-26beta-mostly-successful/273613/4),
    [empty port selector](https://forum.mikrotik.com/t/7-26beta-development-is-released/273582/188),
    [bridge rebuild](https://forum.mikrotik.com/t/7-26beta-development-is-released/273582/232),
    [announced bridge reuse](https://forum.mikrotik.com/t/7-26beta-development-is-released/273582/248).
    The older-offer statement is linked from the matching row of
    [FINDINGS.md][findings].
[^log]: MikroTik `CHANGELOG` for the named build. A claim until a lab confirms it.
[^docs]: MikroTik [CMR manual](https://manual.mikrotik.com/docs/management-tools/cmr/),
    [CMR client](https://manual.mikrotik.com/docs/management-tools/cmr/client/),
    [`/cmr` CLI reference](https://manual.mikrotik.com/docs/cli-reference/cmr/)
    and [`/cmr/alert` reference](https://manual.mikrotik.com/docs/cli-reference/cmr/alert/),
    read 2026-11-20 (upgrade-rule order, DNS discovery, client disable, `pair`
    credentials, `upgrade-done`, run-script policies) and for FINDINGS.md on
    2026-11-12. A docs-only citation is not runtime validation.
