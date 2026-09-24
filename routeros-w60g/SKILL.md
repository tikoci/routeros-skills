---
name: routeros-w60g
description: "MikroTik 60 GHz (W60G, 802.11ad/ay) links on RouterOS v7: /interface/w60g, wlan60-1, AP/station-bridge modes, per-station bridge ports, VLANs across a 60 GHz link, region and scan-list, align/monitor, bench loop risks, and which driver package the 60 GHz Cubes need. Use when: configuring or reinstalling a Cube 60Pro ac, CubeSA 60Pro ac, Cube 60G ac, Wireless Wire, wAP 60G, LHG 60G or nRAY; carrying VLANs over 60 GHz; a W60G station links but client VLANs do not pass; choosing between wireless and wifi-qcom-ac on a Cube; or when the user mentions W60G, 60 GHz, wlan60, or wlan60-station."
---

# RouterOS W60G (60 GHz)

60 GHz gear is a short, very fast, line-of-sight bridge. It lives in its own menu,
`/interface/w60g`, not in `/interface/wifi` or `/interface/wireless`.[^w60g]
Verified end to end on a CubeSA 60Pro ac (AP) and three Cube 60Pro ac (stations) on
RouterOS 7.24.4 unless a line says otherwise.[^bench]

## Packages: `wireless`, not `wifi-qcom-ac`

- W60G is in the `wireless` package.[^w60g] On the Cube 60Pro family the same package also
  drives the built-in 5 GHz 802.11ac radio, as `wlan1` under `/interface/wireless`
  (legacy driver: WPA2, no WPA3).[^bench]
- The Cubes are **not** on MikroTik's list of `wifi-qcom-ac` devices, and the built-in radios
  cannot use both packages at once.[^wifi5] A netinstall with `routeros` + `wireless` gave
  both `/interface/w60g` and `/interface/wireless`.[^bench]
- Offline command trees built from CHR have no `/interface/w60g`, so offline validation won't
  catch w60g mistakes. Test on hardware.

## Modes and roles

| `mode` | Use |
|---|---|
| `ap-bridge` | Point-to-multipoint AP. More than one station needs license level 4 (the Cube 60Pro and CubeSA 60Pro ship with L4).[^w60g][^dist] |
| `bridge` | Point-to-point "bridge" end (one station). |
| `station-bridge` | The client end. Use this for a transparent L2 link that carries VLANs. |

- `region=` limits channels. `-US` SKUs use `region=usa` (channels 1-6).[^w60g]
- One AES `password` per link; no auth types. The station's `scan-list` must include the
  AP's `frequency`.[^w60g]
- `/interface/w60g/monitor wlan60-1 once` shows `connected`, `frequency`, `tx-mcs`,
  `tx-phy-rate`, `rssi`, `tx-sector-info` (which way to turn) and a precise `distance`.
  `align` refreshes faster for aiming but drops the link for a few seconds.[^w60g]
- The 60 GHz interface has its own MAC, separate from the sticker's `W01` (the 5 GHz
  radio). An AP's `remote-address` for a station is the station's `wlan60-1` MAC.[^bench]

## Bridging and VLANs: the AP side is the trap

On a **station**, `wlan60-1` is an ordinary bridge port: tag your VLANs on it like any
port.

On the **AP**, each connected station gets its own interface (`wlan60-station-1`, …).
`put-stations-in-bridge=bridge` adds it to the bridge; `wlan60-1` itself is not a port.[^w60g]

These station interfaces are **saved config, not dynamic**. They show in `/export` as
`/interface w60g station add … remote-address=…` and carry no `D` flag. So a bridge VLAN
entry with `tagged=ether1,dynamic` (interface lists in bridge VLANs: 7.17+)[^vlans]
tags only `ether1`: management (untagged) crosses the link, client VLANs do not.[^bench]

Tag them with the built-in list `all` instead, or name each station interface:

```routeros
/interface/w60g/set [find] mode=ap-bridge ssid="Link60" password=$psk region=usa \
    put-stations-in-bridge=bridge isolate-stations=no disabled=no
/interface/bridge/vlan/add bridge=bridge vlan-ids=57,58 tagged=ether1,all
```

With `tagged=ether1,all`, `current-tagged` became `bridge,wlan60-station-1,ether1`, and a
VLAN 58 DHCP client on the station got a lease from the router behind the AP.[^bench]
`all` also tags the bridge itself (the CPU), which is harmless without a VLAN interface.
Keep the AP's bridge ports to the uplink and the stations, or `all` tags more than you want.

## Bench and deployment gotchas

- **Air link + cable = L2 loop.** A station cabled to the same switch as its AP bridges the
  switch to itself as soon as it links. Before enabling a Cube's switch port, turn the AP's
  60 GHz off (every link drops at once). To move a station onto the air link, arm reverts
  on both boxes, enable its radio with `:execute ":delay 5s; /interface/w60g/enable [find]"`,
  and disable its switch port right away so the two paths never overlap. It relinked 8 s
  after the cut.[^bench]
- A reset or reinstall that brings a station's radio up **disabled** leaves a mounted
  station with no uplink. Only render it enabled once the air link is its uplink.
- 60 GHz is cut hard by rain and foliage. The manual tests the Wireless Wire kit to 200 m
  and the dish kit to 2500 m. Cube 60Pro beam span ~11°, CubeSA 60Pro sector 60° × 30°.[^w60g]
- Cube 60Pro units have a serial port named `gps` in `/port`. No fix indoors; outdoor fix
  not yet checked.[^bench]
- Netinstall on the 64 MB Cubes: 4-5 min from BOOTP to `done`, mostly formatting.[^bench]

[^w60g]: MikroTik manual, W60G: <https://manual.mikrotik.com/docs/wireless/w60g/> (modes, `put-stations-in-bridge`, station sub-menu, regions, monitor/align, RF table, distances).
[^dist]: MikroTik manual, W60G distance guide (license levels per product): <https://manual.mikrotik.com/docs/wireless/w60g/distance-guide>
[^wifi5]: MikroTik manual, Wi-Fi 5 (802.11ac), devices with a choice of driver: <https://manual.mikrotik.com/docs/wireless/wifi-ac/>
[^vlans]: RouterOS 7.17 changelog: "bridge - added interface-list support for VLANs".
[^bench]: Verified on hardware 2026-09-24, RouterOS 7.24.4: one CubeG-5ac60ay-SA as AP, three CubeG-5ac60ay as stations, freshly netinstalled with `routeros,wireless,zerotier,gps`; VLAN test with a `/interface/vlan` + `/ip/dhcp-client` on the station.
