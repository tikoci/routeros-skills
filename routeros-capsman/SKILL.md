---
name: routeros-capsman
description: "RouterOS legacy CAPsMAN (/caps-man) provisioning, reprovisioning, and access-list gotchas for multi-AP wireless controller deployments. Use when: diagnosing why a CAPsMAN provisioning-rule change didn't take effect on an already-connected CAP, forcing a specific radio or CAP to re-provision without a full disconnect, seeing interface=*XX (hex id) instead of a name in /caps-man/access-list print output, cleaning up wide/extension-channel (40MHz+) configs that keep reappearing and causing network-wide wireless slowness, or when the user mentions /caps-man, CAPsMAN provisioning, caps-man interface, or caps-man access-list. Covers the legacy wireless package CAPsMAN only — for the newer /interface/wifi CAPsMAN (wifi-qcom packages) see MikroTik's WiFi CAPsMAN docs instead."
---

# RouterOS Legacy CAPsMAN — Provisioning & Access-List Gotchas

Covers `/caps-man` (the `wireless` package controller, RouterOS 7.x). Does **not** cover
the newer `/interface/wifi` CAPsMAN (`wifi-qcom`/`wifi-qcom-ac` packages) — see MikroTik's
[WiFi CAPsMAN](https://manual.mikrotik.com/docs/wireless/wifi/capsman) docs for that stack.

## The core gotcha: provisioning is one-time, not live

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
/caps-man/provisioning/set [find radio-mac=D0:EA:11:44:82:05] master-configuration=cfg_5g_5220

# RIGHT: edit the profile the radio is already bound to — pushes live, no drop
/caps-man/configuration/set [find name=cfg_5g_5220_40] channel=cfg_5g_5220
# or edit the channel profile directly:
/caps-man/channel/set [find name=ch_5220_40] extension-channel=disabled control-channel-width=20mhz
```

## Forcing a real re-provision (when you actually need one)

If you do need a radio to re-run provisioning-rule matching (e.g., you want it to pick up
a *different* configuration by name, not just edited properties), there are built-in
commands for exactly this — no need to disable/remove anything:

```routeros
/caps-man/radio/provision [find radio-mac="04:F4:1C:F2:E5:9C"]
/caps-man/remote-cap/provision [find name="[04:F4:1C:F2:E5:99]"]
```

**Do not** reach for `/caps-man/interface disable`+`enable` or `/caps-man/interface
remove` to force a rebind — see the next section for why `remove` in particular causes
collateral damage.

## Collateral damage: removing an interface orphans access-list rules

`/caps-man/access-list` rules reference their `interface=` field by **internal object
ID**, not by a live name lookup. If you `/caps-man/interface remove` an interface — even
to immediately recreate one with the identical name via `/caps-man/interface add` — any
access-list rule that pointed at the deleted interface becomes a dangling reference. The
rule is not deleted and does not error; it silently stops matching anything.

**Detecting it:** the rule's `interface=` field prints as a raw internal hex id instead
of a name:

```routeros
[admin@CM] /caps-man/access-list> print terse
 8 comment=1FL-Meeting-room-5G: accept > -75dBm interface=*92 signal-range=-75..0 action=accept
```

Compare to a healthy rule on an interface that was never removed:

```routeros
 0 comment=2FL-Accounting-5G: accept > -75dBm interface=2FL Accounting 5Ghz signal-range=-75..0 action=accept
```

`interface=*92` (a bare `*hex`) instead of a quoted/plain interface name is the tell.
Every client that would have matched that rule instead falls through to whatever the
next matching rule is — commonly a catch-all `action=accept` at the bottom of the list —
which silently disables signal-based roaming enforcement for that interface. In a
multi-AP deployment this shows up as one AP accumulating far more clients than its
neighbors (weak-signal clients that should have been rejected and forced to roam never
get rejected).

**Fix:** remove the orphaned rule(s) by comment/other stable field and re-add them
pointing at the current interface name:

```routeros
/caps-man/access-list remove [find comment="1FL-Meeting-room-5G: accept > -75dBm"]
/caps-man/access-list add interface="1FL Meeting room 5Ghz" signal-range=-75..0 \
    action=accept comment="1FL-Meeting-room-5G: accept > -75dBm"
```

**Prevention:** avoid `/caps-man/interface remove` on a live interface entirely. Use
`/caps-man/radio/provision` (above) to force a rebind, or edit the bound configuration
profile in place. Reserve `remove` for interfaces you intend to delete permanently.

## Diagnosing wide-channel regressions in dense multi-AP deployments

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

## Related

- For general RouterOS CLI/REST fundamentals, see the `routeros-fundamentals` skill.
- For scripting idioms (`[find]`, `:local`, idempotent config), see the
  `routeros-scripting` skill.
- Official docs: [CAPsMAN](https://manual.mikrotik.com/docs/wireless/abgn/capsman/),
  [AP Controller (CAPsMAN)](https://manual.mikrotik.com/docs/wireless/abgn/capsman/ap-controller-capsman),
  [WiFi CAPsMAN](https://manual.mikrotik.com/docs/wireless/wifi/capsman) (newer
  `/interface/wifi` stack — different menu tree, same one-time-provisioning concept).
