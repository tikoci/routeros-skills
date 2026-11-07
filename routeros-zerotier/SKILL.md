---
name: routeros-zerotier
description: "Configure and troubleshoot native ZeroTier on MikroTik RouterOS: ARM/ARM64 extra package, device-mode, instances/interfaces/peers, private-network authorization in ZeroTier Central or /zerotier/controller, managed addresses and routes, firewall integration, flow rules, RoMON, and bridging. Use when joining a ZeroTier network, hosting a RouterOS controller, debugging ACCESS_DENIED or NOT_FOUND, or working with /zerotier, ZeroTier Central, or RoMON over ZeroTier. Use routeros-tikoci-centrs for device operations and routeros-tikoci-quickchr for a disposable ARM64 CHR lab."
---

# RouterOS ZeroTier

RouterOS uses `/zerotier` instances and interfaces rather than the Linux
`zerotier-cli`. This skill covers the native package and its controller role.
The original lab used **arm64 CHR 7.25**; its reported results and the limits of
that evidence are recorded in [Grounding](./references/grounding.md).[^lab]

## Package and device-mode

- Install the `zerotier` extra package matching the router's version and
  architecture, then reboot. See [Extra packages](../routeros-fundamentals/references/extra-packages.md).[^docs]
- The native package supports ARM/ARM64. For a CHR lab, use **arm64**: the
  official 7.25 arm64 archive contains `zerotier-7.25-arm64.npk`; the x86 archive
  has no ZeroTier package. This distinction was independently rechecked during
  review.[^packages]
- Check `/system/device-mode/print` for `zerotier: yes` before configuring it.
  If blocked, follow the [device-mode procedure](../routeros-fundamentals/references/device-mode.md),
  including any required physical confirmation.[^docs]

## Instance, interface, and peer

Enable the default instance before joining a network:[^docs]

```routeros
/zerotier/enable [find where name="zt1"]
/zerotier/print
```

- `/zerotier` is the local node instance. Its 10-digit hexadecimal ZeroTier
  address is the prefix of its public identity; use that address to identify
  the member in Central. It is **not** the interface MAC address. Treat the
  full identity as sensitive; do not publish private identity material.[^cli]
- `/zerotier/interface` has one interface per network membership. Each network
  acts as a virtual Ethernet segment; the interface can be routed or bridged.[^docs]
- `/zerotier/peer` shows known peers, roles such as `LEAF`/`PLANET`, and tunnel
  paths. Check `recvd`/`sent` ages as well as `active`; a listed path alone does
  not establish current end-to-end reachability.[^peer]
- `/zerotier/controller` hosts a network on RouterOS. It manages membership
  and configuration; it does not replace the root-server infrastructure.[^docs]

## Join and authorize

Replace the synthetic network ID below with your controller's 16-digit ID.
**Private networks require authorization at their controller; public networks
allow joining without that approval.**[^docs]

```routeros
/zerotier/interface/add network=0123456789abcdef instance=zt1 name=zt-example
/zerotier/interface/print
```

For a private network, identify the joining instance's ZeroTier address, then:

- **Central-hosted:** authorize the member in the owning Central console or
  matching API. See [Central accounts and API](./references/zerotier-central.md).
- **RouterOS-hosted:** authorize it on the controller router under
  `/zerotier/controller/member`. See [RouterOS controller](./references/zerotier-controller.md).

Re-read the interface until it reports `OK`. Check `/ip/address` and `/ip/route`
when managed addressing/routing is configured and permitted by the client;
authorized membership alone does not guarantee an assigned IP.[^docs][^lab]

The 7.25 lab reported these statuses; they are diagnostic leads, not a complete
status enumeration:[^lab]

| Status | Interpretation |
|---|---|
| `OK` | Network configuration accepted; separately verify addressing and traffic |
| `ACCESS_DENIED` | Controller denied membership; check private-network authorization |
| `NOT_FOUND` | Network not found; verify the ID and controller before inferring a cause |
| `REQUESTING_CONFIGURATION` | Awaiting configuration; seen during rejoin |

A malformed network ID was rejected at add time with `network id not valid`.[^lab]

## Managed addresses and routes

These gates belong to `/zerotier/interface`, not controller member rows:[^cli]

| Setting | Effect |
|---|---|
| `allow-managed=yes` | Accept controller-managed addresses and routes |
| `allow-global=yes` | Also permit managed addresses/routes in public IP space |
| `allow-default=yes` | Permit a controller-managed default route |

Choose the gates deliberately; allowing managed routes does not itself grant
permission to replace the default route. Do not translate desktop DNS settings
into an invented RouterOS flag: the documented interface properties expose no
`allow-dns` equivalent.[^cli]

With managed configuration enabled, RouterOS can install addresses and routes
automatically. Inspect the resulting route table before adding statics.
Site-to-site access also needs forwarding permission and a return path; other
LAN routers may need routes through the ZeroTier router.[^docs]

In the 7.25 lab, `allow-managed=no` removed managed configuration while the
interface stayed `OK`. Restoring `yes` did not restore it within two minutes;
a disable/enable cycle did. This is a versioned observation, not a guaranteed
recovery time or a reason to bounce a production interface immediately.[^lab]

## Firewall and service integration

Check transport traffic and overlay traffic separately. UDP 9993 is the default
instance port, but ZeroTier also uses high ports and peers may listen on any
UDP port. Permit outbound UDP and the corresponding return traffic through
stateful firewall/NAT rules; a 9993-only peer policy can prevent direct paths.[^docs]

For traffic arriving on `zt-example`, review the existing input/forward rules.
Prefer explicit access for the required services and destination subnets.
If **every member is trusted as LAN**, and the existing rules use the `LAN`
interface list for that policy, membership can integrate the interface:[^firewall]

```routeros
/interface/list/member/add list=LAN interface=zt-example
```

This grants the access defined by that list; it is not suitable for an untrusted
or shared overlay. The manual's blanket input/forward accept examples are
permissive alternatives, not prerequisites for every installation.[^docs]

Also review these independent controls:[^services]

- `/ip/service` allowed addresses for IP management services.
- `/ip/neighbor/discovery-settings` and its discovery interface list.
- `/tool/mac-server` and `/tool/mac-server/mac-winbox` allowed interface lists.
  Do not assume factory defaults; Layer 2 management is not protected by the
  IP input firewall.

## Flow rules, RoMON, and bridging

ZeroTier flow rules add distributed, stateless filtering. A ruleset that admits
only IPv4, IPv6, and ARP blocks RoMON (`0x88bf`) and VLAN-tagged frames (`0x8100`).
That is a common ruleset on Legacy Central. New Central documents flow
rules as disabled initially, with all traffic allowed; enabling its Layer 2
Protocol Filter restricts Ethernet types. **Inspect the actual network policy**
before assuming which Ethernet types pass.[^rules]

RoMON can extend management through ZeroTier and onward through explicitly
permitted RoMON ports. Restrict its default `all` port policy before enabling
it; adding a ZeroTier port alone does not restrict the wildcard. RoMON is a
Layer 2 protocol, so IP firewall accept rules do not enable or contain it.[^romon]

See [Flow rules, RoMON, and bridging](./references/zerotier-romon-flow-rules.md)
for separate rule-language and RouterOS examples, member settings, and address
pool planning.

## Common mistakes

| Mistake | Correct approach |
|---|---|
| Run `zerotier-cli join` on RouterOS | Enable an instance, then add `/zerotier/interface` |
| Treat every join as requiring Central | Private networks authorize at their owning controller; RouterOS can host it |
| Match a Central member by interface MAC | Match the instance's 10-digit ZeroTier address |
| Add static routes before checking managed routes | Inspect `/ip/route` and the client gates first |
| Assume all CHR architectures have the package | Use arm64 for the verified 7.25 lab path[^packages] |
| Treat managed IP assignment as DHCP | ZeroTier controller assignment is separate; a bridge can still carry DHCP |
| Enable RoMON, then add one allowed port | Set the wildcard policy and review explicit ports before enabling RoMON |

## Additional resources

- [Grounding and version notes](./references/grounding.md)
- [RouterOS controller](./references/zerotier-controller.md)
- [Central accounts and API](./references/zerotier-central.md)
- [Flow rules, RoMON, and bridging](./references/zerotier-romon-flow-rules.md)
- `routeros-tikoci-centrs` — validated device operations
- `routeros-tikoci-quickchr` — disposable CHR labs
- `routeros-container` — container deployment when investigating upstream ZeroTier
- `routeros-firewall` — interface lists and rule ordering

[^lab]: [Grounding](./references/grounding.md) distinguishes the original issue's lab reports from this review's independent checks.
[^docs]: MikroTik [ZeroTier manual](https://manual.mikrotik.com/docs/virtual-private-networks/zerotier).
[^packages]: Official 7.25 [arm64 archive](https://download.mikrotik.com/routeros/7.25/all_packages-arm64-7.25.zip) and [x86 archive](https://download.mikrotik.com/routeros/7.25/all_packages-x86-7.25.zip); see [Grounding](./references/grounding.md#independent-review-checks).
[^cli]: MikroTik CLI references: [instance](https://manual.mikrotik.com/docs/cli-reference/zerotier/), [interface](https://manual.mikrotik.com/docs/cli-reference/zerotier/interface/), [member](https://manual.mikrotik.com/docs/cli-reference/zerotier/controller/member/).
[^peer]: MikroTik [peer reference](https://manual.mikrotik.com/docs/cli-reference/zerotier/peer/); path-age caveat from Amm0's [community guide](https://forum.mikrotik.com/t/zerotier-on-mikrotik-a-rosetta-stone-v7-1-1/155978/1), not an independent live-path test here.
[^firewall]: [RouterOS firewall skill](../routeros-firewall/SKILL.md).
[^services]: MikroTik [IP services](https://help.mikrotik.com/docs/spaces/ROS/pages/103841820/Services), [Neighbor discovery](https://help.mikrotik.com/docs/spaces/ROS/pages/24805517/Neighbor+discovery), and [MAC server](https://help.mikrotik.com/docs/spaces/ROS/pages/98795539/MAC+server).
[^rules]: ZeroTier [Rules Engine](https://docs.zerotier.com/rules/).
[^romon]: MikroTik [RoMON](https://help.mikrotik.com/docs/spaces/ROS/pages/8978569/RoMON).
