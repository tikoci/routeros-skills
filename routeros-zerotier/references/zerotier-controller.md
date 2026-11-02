# RouterOS as ZeroTier controller

RouterOS 7.3 added controller configuration. A controller admits members and
provides their network configuration, including managed addresses and routes.
It is distinct from a root server. The original skill lab reported the
create/join/authorize loop on arm64 CHR 7.25.[^version][^lab]

## Create a private network

On the controller router, after installing the package:[^docs]

```routeros
/zerotier/enable [find where name="zt1"]
/zerotier/controller/add name=ZT-lab instance=zt1 private=yes \
  ip-range=172.27.27.10-172.27.27.20 routes=172.27.27.0/24
/zerotier/controller/print
```

Read the generated `network` ID. It incorporates the controller's address and
network identifier; use the returned value rather than an ID copied from a lab.
`ip-range` defines the assignment pool. `routes` supplies managed routes using
`destination[@gateway]` entries; a directly attached subnet needs no gateway.
The manual describes up to 100 devices per network.[^docs][^cli]

## Join and authorize

On each joining router, enable its instance and substitute the generated
network ID for this **synthetic** example:[^docs]

```routeros
/zerotier/enable [find where name="zt1"]
/zerotier/interface/add network=0123456789abcdef instance=zt1 name=zt-lab
/zerotier/interface/print
```

The controller itself must also join if it should participate as a member.
With `private=yes`, the new member initially reports `ACCESS_DENIED`.[^docs]

On the controller, inspect the pending members. Match the joining instance's
10-digit ZeroTier address, not its interface MAC. Replace `0123456789` below
with the verified address. The selector includes both the controller-network
name and the node address so it does not authorize an unrelated row:[^cli]

```routeros
/zerotier/controller/member/print detail
/zerotier/controller/member/set \
  [find where network="ZT-lab" and zt-address="0123456789"] authorized=yes
```

Re-read the joining interface until it is `OK`, then verify the configured
address and route on that router:[^docs]

```routeros
/zerotier/interface/print where name="zt-lab"
/ip/address/print where interface=zt-lab
/ip/route/print where gateway~"zt-lab"
```

The original lab reported a dynamic address in the configured pool and an
active connected subnet route after authorization. That proves the local
configuration loop; the same-box test does not prove remote peer connectivity
or a routed multi-site topology.[^lab]

## Controller policy limits

The published RouterOS controller and member CLI references expose membership,
addressing, routes, and network settings, but no flow-rule editor, tags, or
capabilities. Do not invent Central-style rule commands under these menus.
This absence is not evidence that arbitrary Ethernet traffic will pass: VLAN
trunks and RoMON were not exercised by the recorded controller lab. Check
actual traffic and the endpoints' Layer 2 policies.[^cli][^lab]

If a deployment needs ZeroTier's distributed flow rules, evaluate Central or
an upstream ZeroTier controller that exposes them. RouterOS IP firewall policy
still controls IP traffic handled by the router; it is not a substitute for
Ethernet filtering of non-IP protocols.[^rules]

## Controller versus roots

A **network controller** manages membership and network configuration at VL2.
**Roots** facilitate peer discovery, rendezvous, and relaying at VL1. Hosting a
RouterOS controller does not make the overlay independent of public roots.[^docs]

The native package's documented instance surface has no custom planet/moon
setting. An upstream ZeroTier deployment offers different root configuration
options; roots can run on another host. Running an upstream client on RouterOS
would be a separate container deployment, not a setting on `/zerotier`.[^instance]

ZeroTier now discourages new private-moon deployments. Consult its
[current root guidance](https://docs.zerotier.com/roots/) before pursuing that
architecture. Larsa's [RouterOS container discussion](https://forum.mikrotik.com/t/how-to-running-private-zerotier-root-servers-in-routeros-containers/273076)
is a community pointer, not a validated recipe in this skill; use
`routeros-container` for the RouterOS container subsystem.[^roots]

[^version]: MikroTik [7.3 changelog](https://download.mikrotik.com/routeros/7.3/CHANGELOG).
[^docs]: MikroTik [ZeroTier](https://manual.mikrotik.com/docs/virtual-private-networks/zerotier).
[^cli]: MikroTik CLI references: [controller](https://manual.mikrotik.com/docs/cli-reference/zerotier/controller/) and [member](https://manual.mikrotik.com/docs/cli-reference/zerotier/controller/member/).
[^instance]: MikroTik [instance CLI reference](https://manual.mikrotik.com/docs/cli-reference/zerotier/).
[^rules]: ZeroTier [Rules Engine](https://docs.zerotier.com/rules/).
[^roots]: ZeroTier [Private Root Servers](https://docs.zerotier.com/roots/), checked 2026-11-01.
[^lab]: [Grounding](./grounding.md#reported-lab-results).
