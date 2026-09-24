---
name: routeros-w60g
description: "MikroTik 60 GHz (W60G, 802.11ad) links on RouterOS v7: /interface/w60g, wlan60-1, ap-bridge/bridge/station-bridge, point-to-multipoint with per-station wlan60-station-N ports, VLANs across a 60 GHz link, the 5 GHz backup (active-backup bond of wlan60-1 + wlan1) and its failover/failback times, region and scan-list, factory defaults, bench loop risks, and which driver package the 60 GHz Cubes need. Use when: configuring or reinstalling a Cube 60Pro ac, CubeSA 60Pro ac, Cube 60G ac, Wireless Wire, wAP 60G, LHG 60G or nRAY; building a 60 GHz AP with stations that bridge clients; carrying VLANs over 60 GHz; adding or tuning a 5 GHz fallback; a W60G station links but client VLANs do not pass; choosing between wireless and wifi-qcom-ac on a Cube; or when the user mentions W60G, 60 GHz, wlan60, wlan60-station, or 60G failover."
---

# RouterOS W60G (60 GHz)

60 GHz gear is a short, very fast, line-of-sight bridge. It lives in its own menu,
`/interface/w60g`, not in `/interface/wifi` or `/interface/wireless`.[^w60g] The
Cube 60Pro family also has a 5 GHz 802.11ac radio meant as a fallback link.

Everything marked [^bench] was run on one CubeSA 60Pro ac (AP) and two or three Cube 60Pro ac
(stations) on RouterOS 7.24.4, with an upstream router serving DHCP behind the AP and real
DHCP clients cabled behind the stations.

## Packages: `wireless`, not `wifi-qcom-ac`

- W60G is in the `wireless` package.[^w60g] On the Cube 60Pro family the same package also
  drives the 5 GHz radio, as `wlan1` under `/interface/wireless` (legacy driver: WPA2, no
  WPA3).[^bench]
- The Cubes are **not** on MikroTik's list of `wifi-qcom-ac` devices, and the built-in radios
  cannot use both packages at once.[^wifi5] A netinstall with `routeros` + `wireless` gave
  both `/interface/w60g` and `/interface/wireless`.[^bench]
- Offline command trees built from CHR have no `/interface/w60g`, so offline validation won't
  catch w60g mistakes. Test on hardware.

## Modes, radio settings, monitoring

| `mode` | Use |
|---|---|
| `ap-bridge` | Point-to-multipoint AP. More than one station needs license level 4 (the CubeSA 60Pro and Cube 60Pro ship with L4).[^w60g][^dist] |
| `bridge` | Point-to-point "bridge" end (one station). |
| `station-bridge` | The client end: a transparent L2 link that also carries VLANs. |

- `region=` limits channels; `usa` allows channels 1-6.[^w60g] `-US` SKUs use `region=usa`.
- One AES `password` per link, no auth types. The station's `scan-list` must include the
  AP's `frequency`.[^w60g] Channel 5 is **66960**: that is what 7.24.4 lists in
  `default-scan-list` and accepts in `scan-list`. The manual lists `66000`, which the device
  also accepts but is not an 802.11ad channel center.[^bench][^w60g]
- `/interface/w60g/monitor wlan60-1 once` shows `connected`, `frequency`, `tx-mcs`,
  `tx-phy-rate`, `rssi`, `tx-sector-info` (which way to turn) and `distance`. `align`
  refreshes faster for aiming but drops the link for a few seconds.[^w60g]
- On an AP, `wlan60-1` showed `running=false` while stations were connected. Check
  `/interface/w60g/station` (`running`) or `monitor` instead.[^bench]
- The 60 GHz interface has its own MAC, separate from the sticker's `W01` (the 5 GHz
  radio). A station's entry on the AP carries `remote-address` = the station's `wlan60-1` MAC.[^bench]

## Point-to-multipoint: AP with the uplink, stations bridge to clients

The AP's ether1 goes to the upstream router (DHCP, internet). Each station bridges its
ether1 to whatever is cabled there. Nothing routes; the clients get addresses from upstream.

```routeros
# AP
/interface/bridge/add name=bridge protocol-mode=rstp
/interface/bridge/port/add bridge=bridge interface=ether1
/interface/w60g/set wlan60-1 mode=ap-bridge ssid="Link60" password=$psk region=usa \
    put-stations-in-bridge=bridge isolate-stations=no disabled=no

# each station (without the 5 GHz backup)
/interface/bridge/add name=bridge
/interface/bridge/port/add bridge=bridge interface=ether1
/interface/bridge/port/add bridge=bridge interface=wlan60-1
/interface/w60g/set wlan60-1 mode=station-bridge ssid="Link60" password=$psk region=usa \
    scan-list=58320,60480,62640,64800,66960 disabled=no
```

Two stations linked at 2.3 Gbps PHY on the bench, and a client behind each got a lease from
the router behind the AP.[^bench] Add an IP (or `/ip/dhcp-client`) on each bridge for
management. `isolate-stations=yes` (the default) blocks station-to-station traffic.[^w60g]

**Per-station ports on the AP.** Each connected station gets an interface,
`wlan60-station-1`, … `put-stations-in-bridge=bridge` adds it to the bridge as a *dynamic*
bridge port; `wlan60-1` itself is not a port.[^w60g] The station interfaces themselves are
**saved config**, not dynamic interfaces. `/export` shows
`/interface w60g station add … remote-address=…`, with no `D` flag.[^bench]

## VLANs across the link

On a **station**, `wlan60-1` (or the bond, below) is an ordinary bridge port: tag VLANs on it.

On the **AP**, because the station interfaces are not dynamic interfaces, a bridge VLAN
entry with `tagged=ether1,dynamic` tags only ether1. Management (untagged) crosses the link
and client VLANs do not. The built-in list `all` works (interface lists in bridge VLANs: 7.17+)[^vlans]:

```routeros
# AP: trunk on ether1, tagged toward every station and the 5 GHz radio
/interface/bridge/vlan/add bridge=bridge vlan-ids=58 tagged=ether1,all
/interface/bridge/set bridge vlan-filtering=yes

# station: VLAN 58 untagged on ether1 (access port for the client), tagged over the air
/interface/bridge/port/set [find interface=ether1] pvid=58
/interface/bridge/vlan/add bridge=bridge vlan-ids=58 tagged=bond1 untagged=ether1
/interface/bridge/set bridge vlan-filtering=yes
```

`current-tagged` became `bridge,wlan60-station-1,wlan1,wlan60-station-2,ether1`, and the
client behind the station got a VLAN 58 lease from upstream over 60 GHz. The same VLAN kept
working over 5 GHz after a failover.[^bench] `all` also tags the bridge itself (harmless
without a VLAN interface on it). Keep the AP's bridge ports to the uplink, the stations and
`wlan1`, or `all` tags more than you want. Arm a revert (a delayed `:execute` that sets
`vlan-filtering=no` unless cancelled) before turning on `vlan-filtering` remotely.

## 5 GHz backup (bond)

MikroTik's documented fallback: on each station, an active-backup bond with `wlan60-1` as
primary and `wlan1` (5 GHz station-bridge) as backup. On the AP, `wlan1` (5 GHz ap-bridge) is
simply another bridge port next to the station ports.[^ptmp] In point-to-point, the manual
also bonds the AP side (`primary=wlan60-station-1 slaves=wlan60-station-1,wlan1`).[^ptp]

```routeros
# AP, added to the PtMP config above
/interface/wireless/security-profiles/set [find default=yes] mode=dynamic-keys \
    authentication-types=wpa2-psk wpa2-pre-shared-key=$psk
/interface/wireless/set wlan1 mode=ap-bridge band=5ghz-a/n/ac frequency=5805 \
    channel-width=20mhz ssid="Link5" installation=outdoor disabled=no
/interface/bridge/port/add bridge=bridge interface=wlan1

# station: the bond replaces wlan60-1 as the uplink port
/interface/wireless/security-profiles/set [find default=yes] mode=dynamic-keys \
    authentication-types=wpa2-psk wpa2-pre-shared-key=$psk
/interface/wireless/set wlan1 mode=station-bridge band=5ghz-a/n/ac scan-list=5805 \
    channel-width=20mhz ssid="Link5" installation=outdoor disabled=no
/interface/bonding/add name=bond1 mode=active-backup primary=wlan60-1 \
    slaves=wlan60-1,wlan1 up-delay=20s
/interface/bridge/port/add bridge=bridge interface=bond1
/interface/bridge/set bridge protocol-mode=none
```

- **Bond slaves.** 7.24.4 accepted the legacy `wlan1` as a bond slave, and
  `/interface/bonding/monitor bond1` showed the active port switch both ways.[^bench] With the
  newer `wifi` package, bonding Wi-Fi interfaces was reported removed in 7.21
  (beta).[^forum] That does not affect these Cubes, which stay on `wireless`.
- **Why the station's bond doesn't loop.** Only the active slave forwards. The AP bridges
  `wlan1` and the station ports together, yet nothing looped with two stations on both links.[^bench]
- **5 GHz channel on a `-US` unit.** With `installation=outdoor`, `country-info` allows
  only 5735-5835 MHz outdoors; 5170-5250 is indoor-only. Set to 5180, the AP's `wlan1` stayed
  `running=false` and the station logged "scan-list does not contain valid channels". 5805 at
  20 MHz worked.[^bench] A backup doesn't need width; a narrow channel is kinder to neighbors.

### What failover and failback cost

Measured by pinging a client behind a station from the router upstream every 100 ms while
turning the AP's `wlan60-1` off, then on again. The station logged `link down` within 1 s,
and the bond moved to `wlan1` at once.[^bench]

| Event | Loss |
|---|---|
| 60 → 5 GHz, client also sending (two-way traffic) | 0.2-0.3 s, every run |
| 60 → 5 GHz, only inbound traffic | ~13 s |
| 5 → 60 GHz, bond without `up-delay` | ~10 s or more |
| 5 → 60 GHz, `up-delay=20s` | 2-18 s over six runs, after the 20 s delay |

- **Inbound-only is slow.** The bond sends no announcement for the MACs bridged behind it,
  so the AP keeps forwarding to the dead path until the client itself transmits. Real clients
  usually send something within seconds; a silent camera or sensor is the worst case.
- **Failback is the rough edge.** After the bond switched back to `wlan60-1`, the AP's
  `/interface/bridge/host` kept both clients' MACs on `wlan1` for 5-8 s, even though they were
  sending every 100 ms. Cause not isolated. `up-delay` on the bond keeps it from switching
  back while the 60 GHz link is still settling. With RSTP on the stations too, failback also
  lost up to 8.5 s: their BPDUs start arriving on the AP's `wlan60-station-N` port, which
  stops being an edge port. `protocol-mode=none` on the stations avoided that. Keep RSTP on the
  AP, the side that faces the rest of the network. A loop behind a station was not tested.
- Treat the bond as "keeps the site up during rain or a blocked beam", not as hitless
  failover.

## Factory defaults (7.24.4)

`/system/default-configuration` `script` differs by model:[^bench]

- **CubeSA 60Pro ac**: RSTP bridge of ether1 + `wlan1` (5 GHz `ap-bridge`),
  `wlan60-1` `ap-bridge` with `put-stations-in-bridge=bridge`, 192.168.88.1/24 on the bridge.
- **Cube 60Pro ac**: the same script, except `wlan1` is **not** bridged and no bond is created,
  although its header says "5GHz interface is set as W60G backup using bonding". `wlan60-1` is
  also set to `ap-bridge`, so a factory station must be changed to `station-bridge` to
  join an AP.

Don't assume a factory unit already has the bond; build it as above.

## Bench and deployment gotchas

- **Air link + cable = L2 loop.** A station cabled to the same switch as its AP bridges the
  switch to itself as soon as it links. Before enabling a Cube's switch port, turn the AP's
  60 GHz off (every link drops at once). To move a station onto the air link, arm reverts
  on both boxes, enable its radio with `:execute ":delay 5s; /interface/w60g/enable [find]"`,
  and disable its switch port right away, so the two paths never overlap. It relinked 8 s
  after the cut.[^bench] With the 5 GHz backup enabled there are two air paths plus the cable:
  cut the cable first.
- **Test clients behind a PoE switch.** A switch port taken out of the bridge and put in its
  own VRF with a `/ip/dhcp-client` is a real client behind a station, still powered by the
  switch. Give each such port its own VRF: two ports in one VRF on the same subnet sent the
  requests out one port and got the replies on the other.[^bench]
- A reset or reinstall that brings a station's radio up **disabled** leaves a mounted
  station with no uplink. Only make it enabled at boot once the air link is its uplink.
- One of three Cubes hung on the reboot of `/system/reset-configuration … run-after-reset=`
  (link up, no frames at all). A PoE power-cycle brought it back, and the script ran on that
  boot. Normal reboots were fine.[^bench]
- 60 GHz is cut hard by rain and foliage. The manual tests the Wireless Wire kit to 200 m and
  the dish kit to 2500 m. Cube 60Pro beam span ~11°, CubeSA 60Pro sector 60° × 30°.[^w60g]
- Cube 60Pro units have a serial port named `gps` in `/port`. No fix indoors; outdoor fix
  not checked.[^bench]
- Netinstall on the 64 MB Cubes: 4-5 min from BOOTP to `done`, mostly formatting.[^bench]
  To arm etherboot without the reset button, see `routeros-netinstall`.

[^w60g]: MikroTik manual, W60G: <https://manual.mikrotik.com/docs/wireless/w60g/> (modes, `put-stations-in-bridge`, station sub-menu, regions, `frequency`/`scan-list` values, monitor/align, RF table, distances).
[^dist]: MikroTik manual, W60G distance guide (license levels per product): <https://manual.mikrotik.com/docs/wireless/w60g/distance-guide>
[^ptmp]: MikroTik manual, Fail-over PtMP CLI example: <https://manual.mikrotik.com/docs/wireless/w60g/fail-over-ptmp-cli-example>
[^ptp]: MikroTik manual, Fail-over PtP CLI example: <https://manual.mikrotik.com/docs/wireless/w60g/fail-over-ptp-cli-example>
[^wifi5]: MikroTik manual, Wi-Fi 5 (802.11ac), devices with a choice of driver: <https://manual.mikrotik.com/docs/wireless/wifi-ac/>
[^vlans]: RouterOS 7.17 changelog: "bridge - added interface-list support for VLANs".
[^forum]: MikroTik forum, v7.21beta thread, a user quoting MikroTik support on Wi-Fi interfaces as bonding slaves: <https://forum.mikrotik.com/t/v7-21beta-testing-is-released/265403/207>. The 7.21 changelog has "wifi - fixed issue when trying to use interface as bonding slave".
[^bench]: Verified on hardware 2026-09-24, RouterOS 7.24.4: one CubeG-5ac60ay-SA as AP, two or three CubeG-5ac60ay as stations, netinstalled with `routeros,wireless,zerotier,gps`, then reset to the plain configs shown here. Clients were RouterOS switch ports in separate VRFs running `/ip/dhcp-client`, PoE-powering the stations. Loss was measured with `/ping interval=100ms` run on the upstream router via `:execute … file=`; client-side traffic ran the same way. Six failback runs with `up-delay=20s`.
