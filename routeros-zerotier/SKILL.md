---
name: routeros-zerotier
description: "ZeroTier on MikroTik RouterOS: extra-package install, instance/interface/peer model, network join, member authorization via ZeroTier Central or the RouterOS /zerotier/controller, allow-managed/allow-global/allow-default gates, firewall integration, flow rules and RoMON over ZeroTier. Use when: joining a RouterOS router to a ZeroTier network, authorizing members, hosting a controller on RouterOS, debugging ACCESS_DENIED or NOT_FOUND, or when the user mentions /zerotier, ZeroTier Central, my.zerotier.com, or RoMON over ZeroTier."
---

# RouterOS ZeroTier

ZeroTier on RouterOS is an **extra package** exposing a `/zerotier` object model. LLM pretraining mostly knows the Linux `zerotier-cli` world — the RouterOS paths, the join→authorize loop, and the controller role are what this skill teaches.

## Package, arch, device-mode gate

Three things bite before any command works:

- **Extra package.** Install `zerotier` via `/system/package` (see [extra-packages in routeros-fundamentals](../routeros-fundamentals/references/extra-packages.md)), then reboot. Without it, `/zerotier/print` fails with `validation/package-missing` (verified on x86 CHR).
- **Arch limits.** The package ships for ARM/ARM64. On CHR specifically: **arm64 CHR carries `zerotier.npk`, x86 CHR does not** (verified against the 7.25 package lists and live). Ground ZeroTier work on arm64.
- **Device-mode.** ZeroTier can be blocked by `system/device-mode` — check `zerotier=true` there first (default on; see [device-mode in routeros-fundamentals](../routeros-fundamentals/references/device-mode.md)).

## Instance → interface → peer model

```routeros
# Default instance ships disabled with an empty identity; enable it first
/zerotier/enable zt1
/zerotier/print
# zt1 ... port=9993 state=running online=true identity=8905b352c9:0:<128-hex-public>:...
```

- `/zerotier` (instance, default `zt1`, UDP port 9993) is the local node. The **node ID is the first 10 hex chars of the identity** — that is the member address you authorize. `interface=` scopes which local interfaces the instance may use for tunnels (default `all`).
- `/zerotier/interface` (one row per joined network) is the Member object. Think of each ZeroTier network as a global Ethernet switch and the interface as a port on it — it behaves like any L2 interface (bridgeable, routable; closest analogy is a dynamic one-to-many EoIP).
- `/zerotier/peer` is the read-only tunnel view: `PATH=active,preferred,<ip>/9993,recvd:…,sent:…` plus `ROLE` (`LEAF`/`PLANET`). RouterOS shows `active` even when stale — **check the `recvd`/`sent` timers**, and correlate with `/ip/firewall/connection` on port 9993.
- `/zerotier/controller` + `/zerotier/controller/member` — RouterOS **as** the network controller (7.3+). See [references/zerotier-controller.md](./references/zerotier-controller.md).

## Join → authorize loop

Every join needs authorization **somewhere**. Know which controller owns the network before anything else:

```routeros
/zerotier/interface/add network=D5E5FB653762BE63 instance=zt1 name=zt-d5e5
# ok, ret *8
/zerotier/interface/print
# zt-d5e5 ... status=ACCESS_DENIED running=false type=PRIVATE
```

- **Central-hosted network:** the member appears in the ZeroTier Central console (or API) unauthorized. Authorize it there — portal checkbox, or legacy API `POST /network/{id}/member/{addr}` with `{"config":{"authorized":true}}`. Then re-read: status flips to `OK`, `running=true`, and the managed IP appears in `/ip/address`. Details and the two account types: [references/zerotier-central.md](./references/zerotier-central.md).
- **RouterOS-hosted network:** authorize under `/zerotier/controller/member/` on the controller router instead — no cloud console involved. Details: [references/zerotier-controller.md](./references/zerotier-controller.md).

**Status vocabulary** (observed on 7.25): `OK` (authorized, `running=true`), `ACCESS_DENIED` (joined, awaiting authorization — a live verdict, not a connectivity failure, when controller peers are reachable), `NOT_FOUND` (network gone), `REQUESTING_CONFIGURATION` (rejoin transient). A malformed ID fails at add time: `failure: network id not valid`.

## allow-managed / allow-global / allow-default

Client-side gates on `/zerotier/interface` (desktop clients use slightly different terms):

- `allow-managed=yes` — accept controller-pushed IPs and routes. Interface-side **only**: members reject it (`unknown-attribute`). Setting `=no` drops the managed IP/routes while the interface stays `OK`; restoring with `=yes` can take minutes — a disable/enable bounce restores immediately.
- `allow-global=yes` — allow managed IPs/routes to overlap public space. Default `no`.
- `allow-default=yes` — allow the network to override the default route (full tunnel). A `0.0.0.0/0` managed route does **nothing** until the client sets this — nothing in the cloud can force it.
- RouterOS does **not** support the "Allow DNS Configuration" flag (the only such carve-out).

Production shape (redacted real export): `allow-managed=yes allow-global=no allow-default=no` per join.

## Firewall and service checklist

Default firewall blocks both the tunnels and the ZT-interface traffic. The MikroTik manual's "optional" accept rules are not optional:

```routeros
# Blunt form: accept everything arriving on the ZT interface, first in chain
/ip/firewall/filter/add chain=input in-interface=zt-d5e5 action=accept place-before=0
/ip/firewall/filter/add chain=forward in-interface=zt-d5e5 action=accept place-before=0
# Better form: fold the interface into LAN so existing rules cover it
/interface/list/member/add list=LAN interface=zt-d5e5
```

- Allow UDP 9993 for the tunnels themselves.
- `/ip/service`: add the ZT range to allowed addresses for winbox/ssh.
- `/ip/neighbor discovery-settings`: `discover-interface-list` must include the ZT interface for WinBox Neighbors discovery over ZeroTier.
- `/tool/mac-server` (+ `mac-winbox`): defaults allow `all`, which includes the ZT interface — check if locked down. MAC-telnet/WinBox-by-MAC works over ZeroTier at L2 even without IP firewall rules.

## Flow rules and RoMON over ZeroTier

ZeroTier **flow rules** are a second, stateless firewall enforced locally on each device. In the rule language the default action is drop — on legacy accounts RoMON frames (ethertype `0x88bf`) and VLAN trunks (`0x8100`) are silently dropped unless a rule accepts them. **Account type changes the defaults:**

- **Legacy accounts**: default rules allow only IPv4/ARP/IPv6 ethertypes — effectively no L2. RoMON over ZeroTier needs an explicit `accept ethertype 0x88bf` rule on the network.
- **New (organization) accounts**: L2 is allowed by default; restricting it is a paid entitlement.

With the ethertype passing, enable RoMON on the ZT interface like any other port:

```routeros
/tool/romon/set enabled=yes
/tool/romon/port/add interface=zt-d5e5
```

The payoff is large: RoMON-over-ZeroTier gives a world-wide view of **all** ZeroTier routers **and** the RouterOS neighbors on their RoMON-enabled ports — not just the ZT hosts, but each host's connected ports (configurable per port), with hop-by-hop forwarding built from RoMON tx/rx on those ports. Bridging recipes, member checkbox settings, and trunk rules: [references/zerotier-romon-flow-rules.md](./references/zerotier-romon-flow-rules.md).

## Common LLM mistakes

| Mistake | Correct behavior |
|---------|-----------------|
| `zerotier-cli join <nwid>` on RouterOS | No CLI binary — model is `/zerotier` instance → `/zerotier/interface add` → authorize elsewhere |
| Assuming the join alone brings connectivity | Every join needs authorization: Central console/API **or** `/zerotier/controller/member` |
| `ACCESS_DENIED` read as a connectivity failure | It is the normal unauthorized state when controller peers are reachable |
| Looking for flow-rule controls on a RouterOS controller | MikroTik's controller exposes no flow rules, tags, or capabilities |
| `allow-managed` on a controller member | Interface-side only — members reject it with `unknown-attribute` |
| Expecting managed routes to route | They only push config to clients; RouterOS still needs its own `/ip/route` statics for site-to-site |
| Repeating "RouterOS cannot be a controller" | Stale (pre-7.3). `/zerotier/controller` exists since 7.3 |
| Repeating "no ZeroTier on CHR" | Stale. x86 CHR lacks the package; **arm64 CHR ships it** |
| Expecting DHCP on a ZT interface | Clients never run DHCP — IPs are pushed from controller config; bridge recipes must split the `/ip/pool` |
| RoMON "just works" on a legacy-account network | Default rules drop ethertype `0x88bf` — add the accept rule (new accounts allow L2 by default) |

## Additional Resources

**Related skills:**

- `routeros-fundamentals` — extra packages, device-mode, REST/CLI basics
- `routeros-container` — the `/container` path (one recipe: private ZeroTier roots in containers — not covered here)
- `routeros-firewall` — filter/NAT/mangle ordering around the ZT interface

**MikroTik docs:**

- [ZeroTier](https://manual.mikrotik.com/docs/virtual-private-networks/zerotier) — official reference, incl. the only real `/zerotier/controller` write-up
- [RoMON](https://manual.mikrotik.com/docs/management-tools/romon) — neighbor discovery this skill extends over ZeroTier

**Community (mined, verify staleness flags in the issue before citing blindly):**

- amm0, [ZeroTier on MikroTik: a Rosetta Stone](https://forum.mikrotik.com/t/zerotier-on-mikrotik-a-rosetta-stone-v7-1-1/155978) — concept↔path mapping
- larsa, [private ZeroTier roots in RouterOS containers](https://forum.mikrotik.com/t/how-to-running-private-zerotier-root-servers-in-routeros-containers/273076) — pointer only, recipe not covered

**Skill references:**

- [RouterOS as controller](./references/zerotier-controller.md)
- [Central: account types and API](./references/zerotier-central.md)
- [Flow rules, RoMON, bridging](./references/zerotier-romon-flow-rules.md)
