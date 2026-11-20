# ZeroTier grounding and version notes

This reference distinguishes the **original lab reports** from the checks
performed while polishing PR #46. A reported observation is not a universal
RouterOS behavior or an independent reproduction.

## Reported lab results

The public [issue #26 grounding report](https://github.com/tikoci/routeros-skills/issues/26#issuecomment-6564324365)
and [completed legacy authorization run](https://github.com/tikoci/routeros-skills/issues/26#issuecomment-6564437245)
record an arm64 CHR 7.25 lab under QEMU TCG on 2026-11-01:

| Probe | Reported result | Evidence boundary |
|---|---|---|
| Private-network join | `ACCESS_DENIED` before authorization | Requires a reachable controller; not every join is private |
| RouterOS controller | Create network, join on the same router, authorize member, receive managed IP and active connected route | Local configuration loop; not a multi-router traffic test |
| Legacy Central | List members, authorize through API, interface reaches `OK`, managed IP follows | One configured private network; about 30 seconds in that run |
| `allow-managed` | Accepted on interface; rejected on controller member; disabling removes managed configuration | Reported 7.25 behavior |
| Restore managed configuration | No restoration within two minutes after `yes`; interface disable/enable restores it | Versioned observation, not a prescribed production timeout |
| Other states | `NOT_FOUND`, `REQUESTING_CONFIGURATION`; malformed ID rejected at add | Status observations, not an exhaustive state machine |
| Package availability | arm64 package runs; x86 command rejected through centrs | `validation/package-missing` is a centrs diagnostic, not native CLI wording |

The raw captures referenced by the issue are not committed to this repository
and were not available in the review checkout. The review therefore attributes
these results to the issue instead of claiming a fresh live run. Examples in
the skill use synthetic IDs or caller-supplied variables, not the lab network
and member identifiers.

New Central v2 authorization, cross-router forwarding, RoMON, VLAN trunks,
bridged DHCP, and private-root containers were **not independently exercised**
by this review. The native controller test does not establish arbitrary
Ethernet forwarding or an air-gapped deployment.

## Independent review checks

On 2026-11-01, review downloaded the official RouterOS 7.25 extra-package
archives and inspected their ZIP listings:

- [arm64 archive](https://download.mikrotik.com/routeros/7.25/all_packages-arm64-7.25.zip): contains `zerotier-7.25-arm64.npk`.
- [x86 archive](https://download.mikrotik.com/routeros/7.25/all_packages-x86-7.25.zip): no `zerotier` package.

Reproduce the package comparison by downloading these exact archives and
running `unzip -l` on each. This verifies distribution contents, not a fresh
live CHR installation. The [current manual](https://manual.mikrotik.com/docs/virtual-private-networks/zerotier)
also lists ARM/ARM64 support.

Review cross-checked the join/controller examples and managed-route guidance
against that manual and the published [controller](https://manual.mikrotik.com/docs/cli-reference/zerotier/controller/)
and [member](https://manual.mikrotik.com/docs/cli-reference/zerotier/controller/member/)
CLI references. RoMON policy was checked against the [RoMON manual](https://help.mikrotik.com/docs/spaces/ROS/pages/8978569/RoMON).
Central plan/API and flow-rule statements were checked against ZeroTier's
[token guide](https://docs.zerotier.com/tokens/),
[legacy examples](https://docs.zerotier.com/api-central-examples/), and
[rules guide](https://docs.zerotier.com/rules/). These account entitlements and
defaults can change; inspect the current console when operating a network.

## Release anchors

The official changelogs contain these ZeroTier changes:

| RouterOS | Change | Implication |
|---|---|---|
| [7.3](https://download.mikrotik.com/routeros/7.3/CHANGELOG) | Controller configuration added | Older statements that RouterOS cannot be a controller are stale |
| [7.17](https://download.mikrotik.com/routeros/7.17/CHANGELOG) | Debug logging added | Logging availability is version-dependent |
| [7.20.8](https://download.mikrotik.com/routeros/7.20.8/CHANGELOG) | Route removal improved | Do not generalize older route-removal observations to all versions |

The [later issue scope discussion](https://github.com/tikoci/routeros-skills/issues/26#issuecomment-6564171138)
keeps private-root containers to a reference pointer. This skill does not ship
a private-roots recipe. ZeroTier's [current roots documentation](https://docs.zerotier.com/roots/)
discourages new private moons; evaluate that guidance before using older
community instructions.
