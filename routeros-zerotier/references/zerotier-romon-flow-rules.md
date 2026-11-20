# Flow rules, RoMON, and bridging over ZeroTier

## Check the actual flow rules

ZeroTier's rules engine is distributed and stateless. Ethernet-type filtering
can allow IP while blocking RoMON or a VLAN trunk. A common ruleset used with
Legacy Central is equivalent to:[^rules]

```text
drop
  not ethertype ipv4
  and not ethertype arp
  and not ethertype ipv6
;
accept;
```

This still carries Ethernet frames for IPv4/IPv6/ARP; it does **not** mean
"no Layer 2." Untagged IP bridging can work while other Ethernet types fail.
New Central documents flow rules as disabled initially, with all traffic
allowed; enabling its Layer 2 Protocol Filter applies an IP/ARP whitelist.
Check the effective rules rather than assuming a default from account age.[^rules]

The RouterOS controller's documented surface has no flow-rule editor. That
alone does not prove that a given Ethernet protocol works; see the
[controller limitations](./zerotier-controller.md#controller-policy-limits).

## RoMON over ZeroTier

RoMON uses EtherType `0x88bf` and forwards management discovery/data hop by hop
on permitted RoMON ports. It can reach RouterOS devices beyond the ZeroTier
members where those devices are connected through additional permitted RoMON
ports. Reachability is bounded by that topology and policy.[^romon]

The custom EtherType rules in this reference (RoMON `0x88bf` and VLAN trunks
`0x8100`) use the raw rules editor. In **New Central**, that editor requires
**Scale or Enterprise**; Essential offers templated rules only. **Legacy
Central** provides the full custom rules engine to all users.[^rules]

If the network's flow rules reject that EtherType, insert this **ZeroTier rule**
before the rule that drops non-IP traffic. Save the rules in Central; this is
not RouterOS CLI syntax:[^rules]

```text
accept ethertype 0x88bf;
```

For a router being configured for RoMON for the first time, restrict its default
wildcard before enabling the service. The wildcard entry cannot be disabled or
removed; set `forbid=yes`. An explicit interface entry overrides it:[^romon]

```routeros
/tool/romon/port/set [find where interface=all] forbid=yes
/tool/romon/port/add interface=zt-example forbid=no
/tool/romon/set enabled=yes
/tool/romon/port/print
```

On an existing deployment, review all explicit entries too, and update an
existing `zt-example` entry rather than adding a duplicate. Add trusted LAN
ports explicitly only when onward RoMON access is intended. Do not apply
port-policy changes over your sole RoMON management path without alternate
access.[^romon]

When neighbors are missing, check the ZeroTier rules, each router's RoMON
service and port policy, then multicast handling, switch ACLs, VLAN membership,
and bridge-port `frame-types`. RoMON is non-IP; an `/ip/firewall` accept rule
does not open this path. The manual documents hardware-specific restrictions,
so check the device model as well.[^romon]

## Bridging and address assignment

In Central, locate the member by the instance's ZeroTier address. For a member
that forwards frames for other devices, enable **Allow Ethernet Bridging**.
Leave it off on ordinary routed members. In the bridged-LAN recipe, also select
**Do Not Auto-Assign IPs** for the bridge member and manage the bridge's own
address explicitly.[^bridge]

ZeroTier's managed address assignment is separate from DHCP. A bridge can
carry DHCP broadcasts from downstream devices, and a separately configured
DHCP client can use them. When both Central auto-assignment and a LAN DHCP
server allocate within the same subnet, keep Central's auto-assign range and
the RouterOS DHCP `/ip/pool` non-overlapping, accounting for static addresses
too.[^bridge]

For example, an untagged ZeroTier port on an existing VLAN-filtered bridge
uses a PVID, like another access port. This fragment assumes `bridge1`, VLAN 10,
and the bridge VLAN table are already configured; it is not a complete bridge
configuration:[^vlan]

```routeros
/interface/bridge/port/add bridge=bridge1 interface=zt-lan pvid=10
```

For a tagged-only trunk, permit `0x8100` in the ZeroTier rules where needed
(with the custom-editor access described above),
enable Ethernet bridging on each member forwarding the trunk, and configure
the intended tagged VLAN membership at both ends. A hybrid port also needs
explicit untagged/PVID handling. Use a deliberate DHCP design per VLAN;
VRRP alone does not coordinate DHCP leases or prevent competing servers.[^vlan][^vrrp]

These are documentation-backed integration patterns. The original lab did not
exercise bridged DHCP, a VLAN trunk, or RoMON over the overlay.[^lab]

[^rules]: ZeroTier [Rules Engine](https://docs.zerotier.com/rules/), checked 2026-11-01.
[^romon]: MikroTik [RoMON](https://help.mikrotik.com/docs/spaces/ROS/pages/8978569/RoMON).
[^bridge]: ZeroTier [Layer 2 Bridge](https://docs.zerotier.com/bridging/); its Linux commands do not apply to RouterOS, but the member and pool settings explain the integration pattern.
[^vlan]: MikroTik [Bridge VLAN Table](https://help.mikrotik.com/docs/spaces/ROS/pages/28606465/Bridge+VLAN+Table); ZeroTier [Rules Engine](https://docs.zerotier.com/rules/) for Ethernet-type matching.
[^vrrp]: MikroTik [VRRP](https://help.mikrotik.com/docs/spaces/ROS/pages/81362945/VRRP) documents address redundancy; DHCP service/lease coordination must be designed separately.
[^lab]: [Grounding](./grounding.md#reported-lab-results).
