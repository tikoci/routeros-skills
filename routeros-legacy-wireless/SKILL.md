---
name: routeros-legacy-wireless
description: "RouterOS v7 legacy wireless package (`wireless`): /interface/wireless radios, legacy CAPsMAN (/caps-man) and 60 GHz W60G (/interface/w60g). Use when: a device runs the wireless package instead of wifi-qcom or wifi-qcom-ac; a CAPsMAN provisioning-rule change didn't reach an already-connected CAP; forcing one radio or CAP to re-provision; /caps-man/access-list shows interface=*XX instead of a name; wide-channel (40 MHz+) profiles keep coming back and slow the whole network; configuring a Cube 60Pro, CubeSA 60Pro, wAP 60G, LHG 60G, Wireless Wire or nRAY; 60 GHz point-to-multipoint, VLANs over wlan60-station-N ports, or the 5 GHz backup bond; or when the user mentions /caps-man, /interface/wireless, W60G, 60 GHz or wlan60. Not for the wifi-* packages (/interface/wifi and its built-in CAPsMAN)."
---

# RouterOS Legacy Wireless (`wireless` package)

One skill for everything the legacy `wireless` package provides on RouterOS 7:

| Menu | What it is | Where in this skill |
|---|---|---|
| `/interface/wireless` | Legacy 802.11a/b/g/n/ac radio driver | [Which package](#which-package-wireless-or-wifi-) |
| `/caps-man` | Legacy CAPsMAN controller | [Legacy CAPsMAN](#legacy-capsman-caps-man) |
| `/interface/w60g` | 60 GHz (802.11ad) links | [W60G](#w60g-60-ghz) and [references/w60g.md](references/w60g.md) |

The `wifi-*` packages (`wifi-qcom`, `wifi-qcom-ac`, earlier `wifiwave2`) are a separate stack
with `/interface/wifi` and their own integrated CAPsMAN under `/interface/wifi/capsman`. They
are out of scope here; see MikroTik's [WiFi](https://manual.mikrotik.com/docs/wireless/wifi/)
docs. The two stacks don't share menus or configuration, so never mix their commands.

## Which package: `wireless` or `wifi-*`

- A device runs one driver package for its built-in radios, not both. Only devices on
  MikroTik's [Wi-Fi 5 driver list](https://manual.mikrotik.com/docs/wireless/wifi-ac/) can
  swap `wireless` for `wifi-qcom-ac`; check that list before suggesting the swap.
- `/interface/w60g` exists only with `wireless`. The 60 GHz Cube 60Pro family is not on the
  `wifi-qcom-ac` list, and its 5 GHz radio runs as `wlan1` under `/interface/wireless`
  (WPA2, no WPA3).
- Offline command trees built from CHR have no `/interface/w60g`, and a CHR has no radios to
  test against, so offline validation can't catch mistakes here. Test on the device.

## Legacy CAPsMAN (`/caps-man`)

Covers `/caps-man`, the controller in the `wireless` package. Its CAPs run legacy
`/interface/wireless` radios. The newer CAPsMAN in `/interface/wifi/capsman` belongs to the
`wifi-*` packages and has a different menu tree, though the same one-time provisioning idea.

### The core gotcha: provisioning is one-time, not live

> "Provision must be done only initially, and is done automatically upon CAP joining if
> there are matching provisioning rules that are enabled. If you adjust any configuration
> profile that is linked to the provisioned interface, all changes will be 'pushed' as
> soon as you apply changes to the profile, with no need to re-create the already existing
> interface. Provisioning itself is not for sending configuration, it is for essentially
> creating a new interface. In most cases, there is no reason to perform manual
> provisioning once you already have CAP interfaces running."
> — [WiFi CAPsMAN docs](https://manual.mikrotik.com/docs/wireless/wifi/capsman) (the note
> applies equally to legacy `/caps-man`; confirmed by reproducing the behavior below on
> RouterOS 7.21.3)

This has two practical consequences agents get wrong:

1. **Editing `/caps-man/provisioning` (changing which `master-configuration` a
   `radio-mac` rule points to) does nothing to already-provisioned/bound interfaces.**
   The provisioning table is only consulted when a radio is first matched — an
   already-bound `/caps-man/interface` keeps whatever `configuration` it was created
   with, forever, until something forces it to re-provision.
2. **Editing the properties of a `/caps-man/configuration` (or the `/caps-man/channel`
   profile it references) that an interface is *already* bound to DOES push live**,
   with zero disruption. No reprovisioning, no client drop.

**Implication:** if the goal is "change the channel width / frequency / tx-power CAPs
are already running with," edit the existing profile in place — don't repoint the
provisioning rule to a different profile name and expect it to take effect.

```routeros
# WRONG for changing already-running radios: repointing provisioning does nothing until next CAP join
/caps-man/provisioning/set [find radio-mac=02:00:00:00:01:05] master-configuration=cfg_5g_5220

# RIGHT: edit the profile the radio is already bound to — pushes live, no drop
/caps-man/configuration/set [find name=cfg_5g_5220_40] channel=cfg_5g_5220
# or edit the channel profile directly:
/caps-man/channel/set [find name=ch_5220_40] extension-channel=disabled control-channel-width=20mhz
```

### Forcing a real re-provision (when you actually need one)

If you do need a radio to re-run provisioning-rule matching (e.g., you want it to pick up
a *different* configuration by name, not just edited properties), there are built-in
commands for exactly this — no need to disable/remove anything:

```routeros
/caps-man/radio/provision [find radio-mac="02:00:00:00:02:0C"]
/caps-man/remote-cap/provision [find name="[02:00:00:00:02:09]"]
```

**Do not** reach for `/caps-man/interface disable`+`enable` or `/caps-man/interface
remove` to force a rebind — see the next section for why `remove` in particular causes
collateral damage.

### Collateral damage: removing an interface orphans access-list rules

`/caps-man/access-list` rules reference their `interface=` field by **internal object
ID**, not by a live name lookup. If you `/caps-man/interface remove` an interface — even
to immediately recreate one with the identical name via `/caps-man/interface add` — any
access-list rule that pointed at the deleted interface becomes a dangling reference. The
rule is not deleted and does not error; it silently stops matching anything.

**Detecting it:** the rule's `interface=` field prints as a raw internal hex id instead
of a name:

```routeros
[admin@capsman] /caps-man/access-list> print terse
 8 comment=ap-a-5g: accept > -75dBm interface=*92 signal-range=-75..0 action=accept
```

Compare to a healthy rule on an interface that was never removed:

```routeros
 0 comment=ap-b-5g: accept > -75dBm interface=AP-B 5GHz signal-range=-75..0 action=accept
```

`interface=*92` (a bare `*hex`) instead of a quoted/plain interface name is the tell.
Every client that would have matched that rule instead falls through to whatever the
next matching rule is — commonly a catch-all `action=accept` at the bottom of the list —
which silently disables signal-based roaming enforcement for that interface. In a
multi-AP deployment this shows up as one AP accumulating far more clients than its
neighbors (weak-signal clients that should have been rejected and forced to roam never
get rejected).

**Fix:** point the orphaned rule at the current interface in place. Setting the one field
keeps the rule's position (the list is checked top-down until the first match) and every
other property on it (MAC, time, VLAN, forwarding and other overrides):

```routeros
/caps-man/access-list set [find comment="ap-a-5g: accept > -75dBm"] interface="AP-A 5GHz"
```

If you rebuild a rule instead, copy all of its properties from `print detail` and add it
with `place-before=` the old rule before removing that one; a rule appended below a
catch-all `accept` never matches.

**Prevention:** avoid `/caps-man/interface remove` on a live interface entirely. Use
`/caps-man/radio/provision` (above) to force a rebind, or edit the bound configuration
profile in place. Reserve `remove` for interfaces you intend to delete permanently.

### Diagnosing wide-channel regressions in dense multi-AP deployments

A recurring failure pattern in CAPsMAN networks with many APs on a narrow band (e.g. 9-10
APs sharing UNII-1 5GHz with `skip-dfs-channels=yes`): someone (a well-meaning admin
trying to give one overloaded AP more per-client throughput, or a config left over from
troubleshooting) creates `_40`-style configuration/channel profiles with
`extension-channel` set to `eC`/`Ce`/`eeCe`/etc. (40MHz+ effective width) and either adds
new provisioning rules for them or edits existing ones. Symptom: general network-wide
wireless slowness returns after being previously fixed, because 20MHz-wide neighbor APs
now overlap with a 40MHz+ neighbor.

Quick audit:

```routeros
/caps-man/channel/print detail
# any entry with extension-channel != disabled is a candidate suspect
/caps-man/provisioning/print detail
# cross-check which radio-mac rules point at a *_40 (or any non-disabled-extension) configuration
```

Widening a specific AP's channel does **not** reliably fix client overload on that AP —
it fixes per-client peak throughput at the cost of interference with every neighboring
AP on an overlapping frequency. If the real problem is one AP accumulating too many
clients, the fix is the access-list signal-range roaming thresholds (tighten the
`accept`/`weak -> roam` `signal-range` split for that interface), not channel width — see
the collateral-damage section above for how those rules can silently stop working after
an interface rebuild.

## W60G (60 GHz)

60 GHz gear is a short, very fast, line-of-sight bridge in its own menu, `/interface/w60g`.
The details, grounded on a CubeSA 60Pro ac AP with Cube 60Pro ac stations on 7.24.4, are in
[references/w60g.md](references/w60g.md). The points agents most often get wrong:

- `ap-bridge` (point-to-multipoint, more than one station needs license level 4),
  `bridge` (point-to-point end) and `station-bridge` (client end; carries VLANs).
- On the AP, each station gets a saved `wlan60-station-N` interface, added to the bridge as
  a dynamic port by `put-stations-in-bridge`. Because the interfaces themselves are not
  dynamic, a bridge VLAN entry with `tagged=ether1,dynamic` never tags them; use
  `tagged=ether1,all` (interface lists in bridge VLANs need 7.17+; on older versions,
  name the `wlan60-station-N` interfaces explicitly).
- The 5 GHz backup is an active-backup bond of `wlan60-1` and `wlan1` on each station.
  Failover took 0.2–0.3 s with two-way traffic but about 13 s with inbound-only traffic, and
  failback lost 2–18 s even with `up-delay=20s`. Treat it as "keeps the site up", not hitless.
- A station cabled to the same switch as its AP makes an L2 loop as soon as it links.

## Related

- For general RouterOS CLI/REST fundamentals, see the `routeros-fundamentals` skill.
- For scripting idioms (`[find]`, `:local`, idempotent config), see the
  `routeros-scripting` skill.
- To arm etherboot on a device with no reachable reset button (as on mounted Cubes), see
  the `routeros-netinstall` skill.
- Official docs: [CAPsMAN](https://manual.mikrotik.com/docs/wireless/abgn/capsman/),
  [AP Controller (CAPsMAN)](https://manual.mikrotik.com/docs/wireless/abgn/capsman/ap-controller-capsman),
  [W60G](https://manual.mikrotik.com/docs/wireless/w60g/),
  [WiFi CAPsMAN](https://manual.mikrotik.com/docs/wireless/wifi/capsman) (newer
  `/interface/wifi` stack — different menu tree, same one-time-provisioning concept).
