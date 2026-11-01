# ZeroTier Central: account types and API

Central-hosted networks authorize members in the console or over HTTPS. There are **two account generations** and the agent must know which one owns the network — the API surface and the flow-rule defaults differ.

## Legacy accounts (my.zerotier.com)

- Account-level API tokens from the Account page. Base URL `https://api.zerotier.com/api/v1`, header `Authorization: token <key>`.
- Authorize flow (grounded end-to-end against a private test network):

```sh
# Member appears after the RouterOS join; note: members endpoint returns a JSON list
curl -H "Authorization: token $TOKEN" \
  https://api.zerotier.com/api/v1/network/D5E5FB653762BE63/member
# [{"nodeId":"8905b352c9","config":{"authorized":false}, ...}]

curl -X POST -H "Authorization: token $TOKEN" -H 'Content-Type: application/json' \
  -d '{"config":{"authorized":true}}' \
  https://api.zerotier.com/api/v1/network/D5E5FB653762BE63/member/8905b352c9
# {"config":{"authorized":true,"ipAssignments":[]}, ...}
```

- The POST response carries **empty `ipAssignments`** — the assignment lands ~30 s later. Poll: re-read the member (or the RouterOS interface) until status is `OK` with a managed IP (`10.147.17.170/24` observed). Never trust the POST response alone.
- Portal equivalent: open the network, find the member row (match Address/MAC against `/zerotier/interface/print`), check Authorize.
- Rate limits: 100 req/s paid, 20 req/s free.
- SDK pointers: [go-ztcentral](https://github.com/zerotier/go-ztcentral) (official Go; Central only, not self-hosted controllers), [zerotier-rust-api](https://github.com/zerotier/zerotier-rust-api), [terraform-provider-zerotier](https://github.com/zerotier/terraform-provider-zerotier), [pytier](https://github.com/rainmana/pytier) (community Python). Docs: `https://docs.zerotier.com/api/central/legacy/` (the old `openapi/centralv1.json` URL is dead).
- Default flow rules allow only IPv4/ARP/IPv6 ethertypes — effectively **no L2** (RoMON, VLAN trunks blocked until accepted). Exact default ruleset quoted in [zerotier-romon-flow-rules.md](./zerotier-romon-flow-rules.md).

## New accounts (central.zerotier.com, organization-based)

- Identity is organization-based; programmatic access uses **service accounts**, which require a paid plan. Without them, authorization is a manual portal click — there is no free API path.
- New Central API v2 lives at `https://central.zerotier.com/api/v2` with `Authorization: Bearer <service-account-key>`. Docs: `https://docs.zerotier.com/api/central/new/`.
- Default flow rules **allow all traffic, all L2** ("By default, all traffic is permitted"); the Layer 2 Protocol Filter toggle restricts to IPv4/IPv6/ARP when enabled — but editing any flow rules requires a paid plan tier. A new-account network passes RoMON and trunk tags with no rule changes.
- SDK pointers for v2 are thinner than v1; the [open-connector provider](https://github.com/oomol-lab/open-connector/pull/605) documents the v2 surface (orgs, network groups, bulk member ops, IAM, webhooks).

## Which controller owns this network?

| Signal | Meaning |
|--------|---------|
| Network ID known, member visible in a Central console | Central-hosted — authorize there (portal or matching-generation API) |
| `/zerotier/controller/print` on one of your routers shows the network | RouterOS-hosted — authorize under `/zerotier/controller/member/` |
| Neither | Unknown controller — find it before doing anything else; authorizing in the wrong place silently does nothing |
