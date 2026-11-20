# ZeroTier Central: accounts and authorization

First identify the controller that owns the network. Central-hosted **private**
networks authorize members in Central; a RouterOS-hosted network uses
`/zerotier/controller/member` instead. Public networks do not require individual
approval.[^routeros]

Match the member by its **10-digit ZeroTier address**, taken from the joining
instance's public identity in `/zerotier/print`. The interface's `MAC-ADDRESS`
is a different identifier. Verify the network as well as the member before
authorizing access.[^routeros][^api]

## Legacy Central (my.zerotier.com)

Use a personal API token from the account page. The legacy API base is
`https://api.zerotier.com/api/v1`, with `Authorization: token <key>`.[^api]

Run these in a host shell, not RouterOS. Supply `ZT_TOKEN` securely; set `NWID`
to your network ID and `MEMBER_ID` to the verified member address. The listing
returns a JSON array.[^api]

```sh
curl --fail-with-body -H "Authorization: token $ZT_TOKEN" \
  "https://api.zerotier.com/api/v1/network/$NWID/member"

curl --fail-with-body -X POST \
  -H "Authorization: token $ZT_TOKEN" -H 'Content-Type: application/json' \
  -d '{"config":{"authorized":true}}' \
  "https://api.zerotier.com/api/v1/network/$NWID/member/$MEMBER_ID"
```

The original 7.25 lab reported an authorization response with an empty
`ipAssignments` array, followed about 30 seconds later by interface `OK` and a
managed IP. Do not treat the immediate response as final convergence. Re-read
the member and RouterOS interface with a bounded timeout. With
`allow-managed=yes`, check for addresses assigned explicitly through
`ipAssignments` or automatically from an applicable pool. `noAutoAssignIps`
exempts a member from the pool; it does not cancel explicit assignments.[^lab][^member]

The portal equivalent is to open the network, locate that ZeroTier address,
and authorize the member. API integrations include
[go-ztcentral](https://github.com/zerotier/go-ztcentral),
[zerotier-rust-api](https://github.com/zerotier/zerotier-rust-api),
[terraform-provider-zerotier](https://github.com/zerotier/terraform-provider-zerotier),
and community [pytier](https://github.com/rainmana/pytier).
Check each integration's supported Central generation before choosing it.

## New Central (central.zerotier.com)

New Central uses organizations and service-account API tokens. The current
[token guide](https://docs.zerotier.com/tokens/) requires Essential or above
for service accounts and API access. Without that entitlement, use the portal's
member authorization control.[^tokens]

The documented v2 base is `https://central.zerotier.com/api/v2`, with
`Authorization: Bearer <service-account-token>`. Follow the
[New Central API reference](https://docs.zerotier.com/api/central/new/) for its
organization and resource parameters. This skill's original lab did **not**
exercise v2; the legacy examples above are not a verified v2 workflow.[^tokens][^lab]

## Flow-rule policy and plan requirements

A common Legacy Central ruleset filters out Ethernet types other than IPv4,
IPv6, and ARP. New Central documents flow rules as disabled by default; its
Layer 2 Protocol Filter restricts traffic to those same three types when
enabled.[^rules]

New Central provides templated rules on Essential or above; **custom rules
require Scale or Enterprise**. Legacy Central provides the full custom rules
engine to all users. Plan entitlements and templates can change: inspect the
network's actual rules and available editor before using RoMON or a VLAN
trunk.[^rules]

See [Flow rules, RoMON, and bridging](./zerotier-romon-flow-rules.md).

[^routeros]: MikroTik [ZeroTier](https://manual.mikrotik.com/docs/virtual-private-networks/zerotier) and [instance CLI reference](https://manual.mikrotik.com/docs/cli-reference/zerotier/).
[^api]: ZeroTier [legacy API reference](https://docs.zerotier.com/api/central/legacy/) and [Central API examples](https://docs.zerotier.com/api-central-examples/).
[^tokens]: ZeroTier [API tokens](https://docs.zerotier.com/tokens/), checked 2026-11-01.
[^rules]: ZeroTier [Rules Engine](https://docs.zerotier.com/rules/), checked 2026-11-01.
[^lab]: [Grounding](./grounding.md#reported-lab-results) links the original authorization run and records its limits.
[^member]: ZeroTier's published [Central MemberConfig schema](https://github.com/zerotier/go-ztcentral/blob/main/spec.json) defines `ipAssignments` separately from the pool exemption `noAutoAssignIps`.
