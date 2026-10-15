---
name: routeros-cmr
description: "Configure or debug MikroTik CMR on RouterOS 7.26beta1: the optional cmr controller package, built-in /cmr/client, routed controller-addresses or neighbor discovery, TCP/54321, independent pairing requirements, labels, fleet scripts, alerts and HTTP webhooks, topology, upgrade rules, package directories and backup/export limitations. Use for a CMR controller or client, waiting-for-pairing, CMR alert or upgrade rules, fleet run-script, or the /cmr menus. Use routeros-quickchr for a disposable CMR lab and routeros-centrs for validated device operations. CMR monitors RouterOS clients; it is not a general SNMP/ping replacement for The Dude."
---

# RouterOS CMR

Grounded on **RouterOS 7.26beta1, x86 CHR**, with four disposable routers and
three quickchr socket links. The controller, a transit client, a remote client
reachable through OSPF, and a direct discovery client exercise different paths.
The [runnable example][example] and [evidence report][report] are the reproduction
surface. No later beta, arm64 CHR or WiFi radio was verified by this lab.[^lab]

CMR manages RouterOS devices: inventory, resource/availability/log alerts,
fleet scripts and upgrades, topology, and WiFi/VLAN provisioning. It does not
provide general ping/SNMP/HTTP monitoring of non-RouterOS equipment.[^docs]

## Versions and packages

CMR first appeared in 7.26beta1. Pin that version for reproductions and record
both the controller and client versions. The lab installed the optional `cmr`
package only on the controller; clients used the built-in `/cmr/client`.[^lab]

The manual lists arm, arm64 and x86 for the server package. Clients exclude smips
and powerpc. A mipsbe client was observed in the earlier hardware session; that
architecture was not re-tested in the CHR lab.[^docs][^prior]

## Server, service and client discovery

```routeros
/cmr set enabled=yes track-topology=yes fetch-comments=yes auto-labels=all
```

The controller lists its own built-in client in `/cmr/device`. A dynamic service
named `cmr` listens on TCP/54321. Scope this service with the input firewall.
In the lab, CMR was blocked on each host-management NIC so pairing used only the
socket topology.[^lab]

```routeros
/cmr/client set enabled=yes controller-addresses=10.255.0.1
```

The remote client reached that controller loopback through a transit router,
with an asserted active OSPF route. A direct client with **no**
`controller-addresses` discovered the controller on its socket link. DHCP-based
discovery and application traffic collection remain manual-only claims.[^lab][^docs]

Read `/cmr/client` for `status`, `pairing-status`, `controller-address` and
`controller-identity`. The lab observed `waiting-for-pairing,connected` becoming
`paired,connected`. Paired clients reconnected with pairing intact after a clean
`/system/reboot`, a hard power-off and a controller reboot.[^lab]

A reconnect can stall for one TCP SYN timeout (about 90 seconds) when the route to
the controller is briefly withdrawn while a default route exists. The connect leaves
via the default route, and its retransmits keep that source address after the
specific route returns. The lab first misread this as a CMR reconnect bug. It now
rejects tcp/54321 out of its management NIC with a TCP reset.[^lab]

The controller's own `/cmr/device` row reports `connected=false`, although its
self-client is paired and fleet scripts execute on it. Do not require the C flag
on that row when checking fleet readiness.[^lab]

`/cmr/client/forget` clears pairing. Disabling the client removes CMR-managed
(`Y`) configuration according to the manual.[^docs] On 7.26beta1, client
disable/enable also cleared the client-side pairing approval. The client came
back `waiting-for-pairing,connected` with `password required`, and the
controller flagged the device REMOTE-PENDING until it was paired again. A reboot
did not do this. Avoid toggling `enabled` on a paired client unless re-pairing
is acceptable.[^lab]

## Pairing: satisfy both sides

On **7.26beta1**, client completion offers `none` and `password`; setting client
`pairing-requirement=confirm` returns `syntax error (line 1 column 37)`. The manual
also describes `confirm` on clients. This mismatch is reproduced and has a
prepared support report; do not silently assume the documented value works.[^lab][^docs]

The server's per-device requirement accepts `none`, `password` and `confirm`.
The unpaired device state spells out both requirements as
`device:<client condition>, cmr:<server condition>`.[^lab]

| Client requirement | Server per-device requirement | Fresh pairing verified with |
|---|---|---|
| none | none | automatic acceptance |
| none | password | client `pair` with controller login |
| none | confirm | controller `device/pair` without credentials |
| password | none | controller `device/pair` with client login |
| password | password | client `pair` with controller login |
| password | confirm | controller `device/pair` with client login |

All six combinations reached `paired,connected`. Running `pair` locally approves
that side, so password/password does not require two commands when one side
approves itself locally and supplies the remote side's login.[^lab][^docs]

```routeros
# On the controller, using a RouterOS account ON THE CLIENT:
/cmr/device/pair [find identity="lab-client"] username=client-user password="..."
# On the client, using an account ON THE CONTROLLER:
/cmr/client/pair username=controller-user password="..."
```

There is no separate CMR pairing password. The current manual explains remote
RouterOS credentials; a former draft's claim that it required "server credentials"
for server-side `pair` was an interpretation of older wording.[^lab][^docs]

Use real client credentials and explicit controller approval for the normal
flow. Client-side `none` accepts pairing without client approval; the
controller's independent `password` or `confirm` requirement must still be
satisfied before management begins. The example uses generated quickchr logins
and does not put passwords into its reports.[^lab][^docs]

Changing an already paired client from `none` to `password` made it pending in
the prior hardware session. Global `/cmr pairing-requirement`, wrong-password
negative controls and that transition were **not re-tested** by the six-case
matrix, which uses fresh pairings and per-device requirements.[^prior]

## Labels, fleet scripts and topology

Set explicit labels on devices and select them for rules and commands:[^lab]

```routeros
/cmr/device/set [find identity="lab-client"] labels=lab,remote
/cmr/device/run-script labels=lab script=":put [/system/identity get name]"
/cmr/layout/add name=lab
/cmr/layout/add-devices [find name=lab] labels=lab
/cmr/layout/rebuild-links [find name=lab]
```

The lab returned four successful fleet-script outputs and generated four nodes
and three links matching its socket topology. Script results include progress
sections: the controller's successful output can appear in multiple sections.
Check the final successful result **per device**, rather than counting all output
occurrences.[^lab]

Plain labels are OR; `+label` requires a label and `-label` excludes it. Combined
label predicates were not exercised by this lab. Maps and dashboards are shown
in WinBox 4/WebFig; GUI rendering was not verified here.[^docs]

### The controller login is not the limit

On 7.26beta1, CMR does not check the caller's policy against what a fleet
command does on the clients. A controller "reader" login is **not read-only**
once the `cmr` package is installed. MikroTik confirmed this and says 7.26beta2
will not allow it for a `read` group; that is not yet checked on a beta2
build.[^policy]

| Controller login group | Direct write or reboot | Through CMR |
| --- | --- | --- |
| `read,api,rest-api` | `not enough permissions (9)` | `run-script` wrote to a client and rebooted it |
| `read,test,api,rest-api` | `not enough permissions (9)` | `run-script` wrote to the controller's own row; `/cmr/device/reboot` rebooted a client |

`run-script` needed only `read` + `api` on the caller, and `/cmr/device/reboot`
only `read` + `test` + `api`. The probe ran over REST, which needs `rest-api`
to log in. `api` is not part of that login on 7.26beta1: `read,rest-api` logged
in and was refused by `run-script` itself (`std failure: not allowed (9)`, not
an authentication failure), and adding `api` let it run. Neither command checked `write` or
`reboot`. The script ran
on each selected client with `read,write,test,reboot`, and that includes the
controller's own device row, so the same login could also write to the
controller itself. CMR's own ceiling still held: `/user/add` in a script failed
with `not enough permissions (9)`.[^policy] Give a controller login only to
someone (or an agent) who may change every paired device, and treat
`/cmr/device/{run-script,reboot,upgrade,pair}` and `/cmr/upgrade/trigger` as
writes in any tool's read-only mode. `upgrade`, `pair` and `trigger` were not
tested with a restricted login.

A login with `read` + `api` (plus `rest-api` over REST), even with
`!sensitive,!policy`, can read its own `/user` row and `/user/group` over both
APIs; a REST login without `api` was not tried for this read. So a tool can check which policies the caller lacks
before it sends a fleet command.[^policy]

### Watching a long fleet script

`run-script` returns a client's output only when that client's script ends:
lines printed four seconds apart came back together, and no `/cmr` menu records
a running script.[^field] To watch a long job, watch what it changes on a client
that can be reached directly (for example `/ip/address print follow` while the
script adds addresses).[^field]

## Alerts and HTTP webhooks

```routeros
/cmr/alert/add name=down labels=remote disconnected-more-than=10s \
  action.log="DOWN [identity] [address]" severity=high
```

Eight example rules were disabled by default. The lab adds enabled CPU, memory,
disk, reboot, bridge-interface, log, version and availability rules. Log and
interface events and HTTP POST delivery are core executable checks. A real VM stop/restart, with down and reconnect webhooks, is an extended probe. Resource exhaustion, successful/failed upgrades and health sensors were
not induced.[^lab]

`upgrade-done` takes `success` or `fail` in the observed default rules; do not
write it as a boolean. The lab uses `upgrade-done=success` without upgrading.[^lab]

The first bridge added to a device that has no bridges does not fire
`interface-change=added`, typed or untyped. Later additions fire within seconds.
Reproduced on three clients. It is per device, not per rule: a rule created after
a device already had a bridge fired on its first match. `interface-type` offers
only `any`, `ethernet`, `wifi` and `bridge`; VRRP additions never alerted.
The example keeps a `--first-bridge` reproducer. The default lab creates a bridge loopback on each router before CMR starts.[^lab]

Log alerts install a managed `/system/logging` entry on the client with
`action=cmr`, the requested topics and regex. Wait for that entry before emitting
a test log. The lab emits a fresh marker and requires the alert to fire.[^lab]

Webhook actions use `action.http-url`, `action.http-method`, `action.http-body`
and `action.http-headers`. The example receives substituted device data at an
ephemeral host listener via the QEMU user gateway, with an explicit
`Content-Type: text/plain`. It checks `action-failures` as well as delivery.[^lab]

`connected=yes reset-on-disconnect=yes` is configured for reconnect alerts.
The lab records initial connected and actual down webhook messages and `fired`
counters, and the extended probe also receives the reconnected webhook. Rule evaluation
can take up to a minute; use bounded state polling instead of assuming immediate
execution.[^lab][^docs]

The earlier hardware session saw `[address]=unknown` while a client was down and
an empty address for the controller. Treat that as a versioned observation, not a
stable address lookup; identify devices with an explicit identity or label.[^prior]

Actions can also run named scripts. Script permissions, additional placeholders,
`alert/test`, `show-devices` and health thresholds remain docs-only here.[^docs]

## Upgrade rules and package directory

A dynamic, read-only `default` rule selects stable. On the beta controller it
offered **7.24.5**, an older release, and editing it returned
`can't edit default rule`. A U flag means a different offered version; it does
not prove that installing it is an upgrade.[^lab]

Add a lab rule without a schedule:[^lab]

```routeros
/cmr/upgrade/add name=lab-pinned labels=lab channel=7.26beta1 \
  strategy=sequential fail-policy=stop
```

The example asserts that every device selects this rule and **never** calls
`upgrade` or `trigger`. Package retention on a downgrade was not tested; the
old draft's claim that a downgrade necessarily removes CMR is not established by
this lab.[^lab]

`packages-directory` must name an existing directory and end with `/`:[^lab]

```routeros
/file/add type=directory name=cmr-packages
/cmr set packages-directory=cmr-packages/
```

Without the slash the lab received `input does not match any value of
packages-directory`. Changing it restarts CMR and clients reconnect; the manual
now documents both behaviors. Do not report these as new bugs. Cache settings
and scheduling details should be read from the current manual instead of
assuming the prior hardware cache limit is a universal default.[^lab][^docs]

## Export versus binary backup

On 7.26beta1, `/cmr/export`, `/cmr/export verbose` and full `/export verbose`
omit the controller's `/cmr set` settings, including `enabled=yes` and the custom
package directory. Rules/layouts appear, but the paired device inventory is also
absent. Export alone is insufficient to reproduce the running controller.[^lab]

A real binary backup was saved, CMR was disabled, and the backup was loaded.
After the resulting reboot, server settings, device identities, labels and
pairing IDs matched the saved state. Keep a binary backup for this beta and
separately record the controller settings when relying on exports.[^lab]

## Still docs-only or outside the lab

WiFi and VLAN provisioning, DHCP discovery, apptraffic, dashboard GUI,
push-button pairing, global server pairing policy, ARM servers and later betas
need separate experiments. CHR has no WiFi radios or physical health sensors;
do not turn a configured rule into a claim that those hardware paths work.[^docs]

[example]: https://github.com/tikoci/quickchr/tree/main/examples/cmr
[report]: https://github.com/tikoci/quickchr/blob/main/examples/cmr/REPORT.md

[^lab]: quickchr [CMR example][example], [beta evidence and support drafts][report],
    RouterOS 7.26beta1, x86 CHR, 2026-10-05 local date.
    Executable core checks: `cmr.ts`; additional pairing/export/backup probes:
    `tool/probes.ts`. No later release was tested.
[^docs]: MikroTik [CMR manual](https://manual.mikrotik.com/docs/management-tools/cmr/)
    and [`/cmr` CLI reference](https://manual.mikrotik.com/docs/cli-reference/cmr/),
    read 2026-10-05. A docs-only citation is not runtime validation.
[^policy]: centrs [#456](https://github.com/tikoci/centrs/issues/456): a two-CHR
    7.26beta1 x86 lab over REST (2026-10-13), plus the same `run-script` write
    on 7.26beta1 hardware (arm64 controller, mipsbe/mmips clients). The own
    `/user` + `/user/group` read was checked over REST and the native API on the
    same lab (2026-10-15). The `run-script` write is re-run by centrs'
    `execute --cmr` integration test (example CMR15). MikroTik's acknowledgement
    and the beta2 fix: [forum post](https://forum.mikrotik.com/t/7-26beta-development-is-released/273582/139)
    (2026-10-15).
[^field]: centrs [#457](https://github.com/tikoci/centrs/issues/457) item 8, a
    field run on 7.26beta1 hardware (2026-10-13). Not re-tested on CHR.
[^prior]: Earlier 2026-10-05 observation on 7.26beta1: an arm64 controller,
    a mipsbe client and a routed x86 CHR. These specific claims were not re-tested
    by the four-CHR lab; kept as explicitly limited prior observations.
