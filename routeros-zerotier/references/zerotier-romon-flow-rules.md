# Flow rules, RoMON, and bridging over ZeroTier

## Flow rules are a second firewall

ZeroTier flow rules are stateless (closer to bridge firewall than connection tracking) and are **enforced locally on each device, not through a central firewall**. The rules match on ethertype among other fields, which makes them the gate for everything that is not plain IPv4/IPv6/ARP. Rule language reference: <https://docs.zerotier.com/rules/> (linked from the legacy editor).

Account type sets the starting point (see [zerotier-central.md](./zerotier-central.md)):

- **Legacy accounts** ship this default ruleset (quoted verbatim from the console editor) — everything not IPv4/ARP/IPv6 is dropped, so RoMON (`0x88bf`) and VLAN trunks (`0x8100`) are **silently dropped** until a rule accepts them:

```text
# This is a default rule set that allows IPv4 and IPv6 traffic but otherwise
# behaves like a standard Ethernet switch:
drop
    not ethertype ipv4
    and not ethertype arp
    and not ethertype ipv6
;
# Accept anything else. This is required since default is 'drop':
accept;
```

In the rule language the default action is `drop`, hence the trailing `accept;`. Bridging a single untagged LAN needs no rule change; RoMON and trunks each need an `accept ethertype …` rule.

- **New (organization) accounts** use a template UI whose stated default is "**all traffic is permitted**; rules are used to restrict or limit communication as needed." The **Layer 2 Protocol Filter** toggle is the L2 gate: when enabled, only IPv4, IPv6 and ARP are permitted; with it off, all Ethernet protocols pass. No rule changes needed for RoMON or trunks — but editing any flow rules requires a paid plan tier ("You cannot add or edit flow rules at your current plan tier" on free accounts).

RouterOS-hosted networks have no flow-rule controls at all (see [zerotier-controller.md](./zerotier-controller.md)) — nothing to accept, nothing to block.

## RoMON over ZeroTier

RoMON discovers neighbors with L2 frames (ethertype `0x88bf`) on ports where it is enabled, and forwards discovery hop-by-hop — each router relays what it hears on its RoMON ports, so the neighbor view extends past direct adjacencies. Over ZeroTier:

```routeros
# 1. Legacy-account networks only: accept the RoMON ethertype in the
#    network's flow rules (Central console → Flow Rules), e.g.
/*
accept ethertype 0x88bf;
*/
# 2. On each router: enable RoMON and add the ZT interface as a port
/tool/romon/set enabled=yes
/tool/romon/port/add interface=zt-d5e5
```

Effect: a world-wide RoMON view covering **all** ZeroTier routers **plus** the RouterOS neighbors on their RoMON-enabled ports — not just the ZT hosts, but each host's connected ports (per-port configurable), with the hop scheme built from RoMON tx/rx on those ports. A router without ZeroTier becomes visible as long as it neighbors (over any RoMON-enabled port) a router that has it.

Troubleshooting order when neighbors are missing: flow rules accept `0x88bf`? (legacy networks) → RoMON enabled with the ZT interface in `/tool/romon/port`? → RouterOS firewall allows the RoMON traffic on the ZT interface?

## Bridging: member checkboxes and pools

Per-member settings in Central (match the row by Address/MAC from `/zerotier/interface/print`):

- Check **Allow Ethernet Bridging** ONLY on bridged members. Every other member — including non-bridged RouterOS routers — stays unchecked. For VLAN trunks, ALL RouterOS routers on the trunk need it.
- A bridged member also needs **Do Not Auto-Assign IPs** checked. Both take effect immediately.

ZeroTier clients never run DHCP — IPs are pushed from controller config. Bridging a LAN therefore requires **splitting the `/ip/pool`**: shrink the MikroTik DHCP range and give the remainder to the ZeroTier IPv4 auto-assign pool. If the auto-assign range collides with the LAN, pick another range rather than fighting it.

```routeros
# Untagged LAN member on a VLAN-filtered bridge (pvid pattern)
/interface/bridge/port/add bridge=bridge1 interface=zt-lan pvid=1
```

Trunk constraints: no untagged traffic on a trunk network (else it is a hybrid needing both flow rules and pool splitting), identical `/interface/bridge/vlan` tagging on both sides, only VLAN-aware members on the trunk network, and one DHCP server per VLAN (unless VRRP).
