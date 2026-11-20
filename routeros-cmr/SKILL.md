---
name: routeros-cmr
description: "Configure or debug MikroTik CMR on RouterOS 7.26 betas (grounded on 7.26beta5): the optional cmr controller package, built-in /cmr/client, routed controller-addresses or neighbor discovery, TCP/54321, pairing on both sides (password/confirm defaults, the half-paired state), labels, fleet run-script and its policy, alerts and HTTP webhooks, topology, upgrade rules, package directories, export and backup. Use for a CMR controller or client, waiting-for-pairing, a client that says paired but is never selected, CMR alert or upgrade rules, fleet run-script, CMR VLAN port-labels, or the /cmr menus. Use routeros-tikoci-quickchr for a disposable CMR lab and routeros-tikoci-centrs for validated device operations. CMR monitors RouterOS clients; it is not a general SNMP/ping replacement for The Dude."
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

| Build | Released | Note |
|---|---|---|
| 7.26beta1 | 2026-10-01 | First CMR build |
| 7.26beta2 | never published | A change "since beta2" means since beta3 for anyone booting a build |
| 7.26beta3 | 2026-10-16 | 17 CMR changelog lines: pairing, export, first interface alert, identity sync |
| 7.26beta4 | 2026-10-27 | Alert-test policy, VLAN `port-labels`, effective values in print |
| 7.26beta5 | 2026-10-30 | No CMR changelog lines; the client script policy differs from beta3 (see [run-script](#fleet-scripts-and-policy)) |

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
routed (the lab reaches a loopback over OSPF through a transit router). A client
with **no** `controller-addresses` finds the controller in its neighbor table: a
controller with `/cmr` enabled announces itself in MNDP (TLV 18 = `02`), and the
client's `/ip/neighbor` row shows `running=cmr`. The client's SYN leaves within
tens of milliseconds of `enabled=yes`, without waiting for a new announcement.
MNDP carries nothing about pairing, and a client's own CMR state is not in its
announcements.[^beta5][^lab]

**A slow first connect is usually a source-address problem, not CMR.** On a fresh
7.26beta5 boot, a client's first SYN to the controller left from another
interface's address (the lab's management NIC), the reply went out the
controller's default route, and the client gave up after about 85 s before
connecting from the link address at once. The beta1 lab saw the same about 90 s
stall when a route to the controller was briefly withdrawn and the connect left
via the default route. If pairing takes a minute and a half, check which source
address the SYN uses before blaming CMR; a TCP reset for tcp/54321 out of the
wrong interface makes the client retry at once.[^beta5][^beta1]

Read `/cmr/client` for `status`, `pairing-status`, `controller-address` and
`controller-identity`, but read pairing from both sides (next section).

The controller's own `/cmr/device` row reports `connected=false` although its
self-client is paired, has an upgrade rule, and runs fleet scripts (beta1 and
beta5). Do not require the C flag on that row when checking fleet
readiness.[^lab]

`/cmr/client/forget` clears pairing. **Client `enabled=no` then `enabled=yes`
also clears the pairing** on beta1 and beta5: the client comes back
`device:password required` and the controller keeps the row as `remote-pending`
until it is paired again. MikroTik says this is intended, although the manual says
enabling again "reconnects the client with its existing pairing". A clean reboot,
a power-off, or a controller reboot keeps the pairing.[^beta5][^vendor]

## Pairing: read both sides

Both ends have a `pairing-requirement` of `none`, `password` or `confirm`. The
controller has a global value (`/cmr`) and a per-device override
(`/cmr/device`). On 7.26beta5:

- A fresh client defaults to `password`; a fresh device row on the controller to
  `confirm`. A fresh client does not pair without a `pair` command.
- Client `pairing-requirement=confirm` is accepted (beta1 rejected it with a
  syntax error). A client set to `confirm` waits with `device:waiting
  confirmation` until it is approved locally.
- Changing a paired client's `pairing-requirement` makes it pair again.
- A paired row's `pairing-requirement` reads `none`.
- Every combination of client `none`/`password` and device
  `none`/`password`/`confirm` can reach paired, by a client `pair` with a
  controller login, a bare controller `pair`, or a credentialed one. Only client
  `password` + device `confirm` half-pairs (below).[^beta5][^lab][^docs]

The unpaired row's `state` spells out both sides as
`pair: device:<client condition>, cmr:<controller condition>`. There is no
separate CMR pairing password: the controller-side `pair` takes a RouterOS login
**on the client**, the client-side `pair` a login **on the controller**.[^beta5][^docs]

### The half-paired state

| State | Client `status` | Controller `/cmr/device` row | `run-script` |
|---|---|---|---|
| pending | `waiting-for-pairing,connected` | `pending` (flag `P`), maybe `remote-pending` (`p`); `state="pair: device:…, cmr:…"` | `no devices selected` |
| paired | `paired,connected` | connected, **no** `state`, has `upgrade-rule` and `channel` | selects it |
| half-paired | `paired,connected` | connected, `state="pair: device:ok, cmr:ok"`, no `upgrade-rule` | `no devices selected` |

**The client's `paired,connected` alone does not prove pairing.** A half-paired
session is idle (TCP keepalives only), and after the controller's CMR service
restarts the row is pending again with `cmr:waiting confirmation`: the
controller's approval was never stored. A readiness check should require the row
to have no `state` and an `upgrade-rule`, or `run-script` to select the
device.[^beta5]

On 7.26beta5 with the default requirements (client `password`, device
`confirm`), the manual's single credentialed command half-paired 7 of 9 fresh
pairings on three boots; centrs saw 0–100% per boot:[^beta5]

```routeros
# Can half-pair on 7.26beta5:
/cmr/device/pair [find identity="lab-client"] username=client-user password="..."
```

Its output predicts the result: a last table ending `device:ok, cmr:ok` meant
half-paired, `paired` meant committed, in every captured trial. These sequences
were committed 9 of 9 each, interleaved on the same boots:[^beta5]

```routeros
# 1. Controller approves first, then supplies the client's login:
/cmr/device/pair [find identity="lab-client"]
/cmr/device/pair [find identity="lab-client"] username=client-user password="..."

# 2. Client approves locally while the controller runs a bare pair.
#    /cmr/client/pair blocks until the controller approves: run the two
#    concurrently, not one after the other.
/cmr/client/pair username=controller-user password="..."   # on the client
/cmr/device/pair [find identity="lab-client"]               # on the controller

# 3. Client drops its requirement, then the controller approves:
/cmr/client/set pairing-requirement=none                   # on the client
/cmr/device/pair [find identity="lab-client"]               # on the controller
```

After `/cmr/client/set pairing-requirement=…` the client renegotiates; a
controller `pair` sent before the row shows `device:ok` selects nothing. To
recover a half-paired client, run one bare `/cmr/device/pair` for it.[^beta5]

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

**The controller login is the gate.** From 7.26beta3, `/cmr/device/run-script`
needs `write` and `reboot` on the controller login: on beta5, `read`,
`read,write` and `read,reboot` groups get `not enough permissions (9)`, and
`read,write,reboot` runs it. Over REST the refused call drops the connection on
beta3. `/cmr/alert/test` on beta5 also needs `read,write,reboot`, more than the
beta4 changelog's "write". A `read`-only login can still list `/cmr/device`. On
7.26beta1 a login without `write` could dispatch a write; that is fixed.[^beta5][^centrs]

**On the client, a script is not bounded by the documented policies.** The manual
says scripts run with `read`, `write`, `test` and `reboot`, without a user
session. On 7.26beta5, from either the full `admin` login or the smallest login
that may send a script, a single `run-script` line on the client:

- created a `group=full` user and a new group;
- printed a PPP secret's password in clear;
- saved a script with all six requested policies (owner `*sys`);
- started the sniffer and saved an unencrypted binary backup.

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
`action-failures=0` on beta1 and beta5. Resource exhaustion, upgrade results and
health sensors were not induced.[^lab]

- `upgrade-done` takes `success` or `fail`, not a boolean.[^beta1]
- From 7.26beta3, `rebooted=no` and `unpaired-device-connected=no` create no
  condition (changelog only).[^log]
- **First interface added:** on beta1 the first bridge added to a device with no
  bridges did not fire `interface-change=added`. The beta3 changelog fixes it, and
  on beta5 it fired whenever the rule already covered the client. Rule coverage
  can lag rule creation: wait for the rule to cover the device before testing.
  `interface-type` offers `any`, `ethernet`, `wifi` and `bridge`; VRRP additions
  never alerted (beta1).[^beta5][^beta1]
- **Log alerts** install a managed `/system/logging` entry on the client with
  `action=cmr`, the requested topics and regex. Wait for that entry before
  emitting a test log.[^lab]
- **Webhooks** use `action.http-url`, `action.http-method`, `action.http-body` and
  `action.http-headers`. Send an explicit `Content-Type`, and check
  `action-failures` as well as delivery.[^lab]
- **Reconnect alerts:** `connected=yes reset-on-disconnect=yes`. Rule evaluation
  can take up to a minute; poll state with a bound instead of assuming immediate
  execution.[^lab][^docs]

An earlier beta1 hardware session saw `[address]=unknown` while a client was down
and an empty address for the controller. Identify devices by identity or label in
alert text, not by address. Script actions, other placeholders, `show-devices` and
health thresholds remain docs-only here.[^beta1][^docs]

## Upgrade rules and package directory

A dynamic, read-only `default` rule (`channel=stable`) covers devices no other
rule claims; editing it returns `can't edit default rule`. A labelled rule claims
matching devices first.[^beta5]

**A pinned rule can downgrade.** On beta5, a rule pinned to `channel=7.26beta1`
gave beta5 devices `available-version=7.26beta1` and `upgrade-available=true`
(flag `U`) and fired the `upgrade-available` alert. The U flag means "a different
offered version", not "newer". On beta1 the default rule offered the older stable
7.24.5 the same way; MikroTik says this is intended, and the manual says the
offered version "can be earlier than installed".[^beta5][^vendor]

Add a lab rule without a schedule, and never call `upgrade` or `trigger` in a
lab that must keep its version:

```routeros
/cmr/upgrade/add name=lab-pinned labels=lab channel=7.26beta5 \
  strategy=sequential fail-policy=stop
```

`packages-directory` must name an existing directory and end with `/`. Without
the slash: `input does not match any value of packages-directory`. Changing it
restarts CMR and clients reconnect (documented). Read cache and schedule settings
from the current manual.[^beta5][^docs]

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

The beta3 changelog fixed both export gaps. `/cmr/print` lists only values that
were set: a fresh controller prints only `enabled: yes`. REST `/cmr` returns the
set values plus `local-id` and `self-client-id`. `/cmr/device/set identity=`
renames the client, and a client rename updates the row (fixed in beta3).[^beta5][^log]

## VLAN, WiFi and application traffic

Not grounded by a lab: CHR has no radios, and VLAN provisioning can cut a lab's
own CMR link. Known from other sources:

- From 7.26beta4, `/cmr/vlan/add` without `port-labels` is refused
  (`missing =port-labels=`). Before that, a rule without `port-labels` applied to
  all ports.[^centrs][^log]
- An empty or unset port selector can include the uplink.[^vendor]
- Disabling and enabling the server or a VLAN rule rebuilds `cmr-bridge` with a
  new ID. MikroTik announced that a later beta will reuse an existing enabled
  bridge; beta5 does not.[^vendor]

## Still open

DHCP and DNS service-record discovery, push-button pairing, application traffic, IPv6, NAT
between client and controller, the global server pairing policy, arm64 CHR, and
why the half-pair hits some boots and not others. CHR has no WiFi radios or
physical health sensors; a configured rule is not evidence that those paths
work. The findings page keeps the open questions.[^findings]

[findings]: https://github.com/tikoci/quickchr/blob/main/examples/cmr/FINDINGS.md
[example]: https://github.com/tikoci/quickchr/tree/main/examples/cmr

[^findings]: quickchr [`examples/cmr/FINDINGS.md`][findings] (CMR findings, by
    build), read at quickchr `main` @ `5573f30`, 2026-11-20.
[^beta5]: 7.26beta5 x86 CHR. quickchr CMR example studies on a Linux KVM host,
    2026-11-12 to 2026-11-14 (`evidence/7.26beta5/`: `pairing.json`,
    `policy.json`, `recheck.json`, `wire.json`, `demo-probe.json`), summarized in
    [FINDINGS.md][findings].
[^lab]: The [CMR example][example]'s four-router lab (controller, transit, routed
    remote over OSPF, direct discovery client). It passed on 7.26beta1
    (2026-10-05) and on 7.26beta5 with `--probe`: on a Linux KVM host
    (`evidence/7.26beta5/demo-probe.json`), and again for this revision on
    2026-11-20, x86 CHR under HVF on an Intel Mac, quickchr `main` @ `5573f30`.
[^beta1]: 7.26beta1 only: the original quickchr lab (2026-10-05,
    [REPORT.md](https://github.com/tikoci/quickchr/blob/main/examples/cmr/REPORT.md))
    or an earlier hardware session the same day (arm64 controller, mipsbe client).
    Not re-measured on a later build.
[^centrs]: centrs integration lab:
    [#456](https://github.com/tikoci/centrs/issues/456) (beta1),
    [#527](https://github.com/tikoci/centrs/issues/527) (beta3), CMR17 (beta4).
[^vendor]: MikroTik staff on the forum, linked from the matching rows of
    [FINDINGS.md][findings].
[^log]: MikroTik `CHANGELOG` for the named build. A claim until a lab confirms it.
[^docs]: MikroTik [CMR manual](https://manual.mikrotik.com/docs/management-tools/cmr/)
    and [`/cmr` CLI reference](https://manual.mikrotik.com/docs/cli-reference/cmr/),
    as read for FINDINGS.md on 2026-11-12. A docs-only citation is not runtime
    validation.
