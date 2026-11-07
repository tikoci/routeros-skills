---
name: routeros-proprietary-protocols
description: "Navigate MikroTik-specific protocols and file formats: WinBox/M2/nova IPC, MAC-WinBox, MAC-Telnet, RoMON, MNDP, native API, btest, EoIP, IP packing, CAPsMAN, CMR, MLAG ICCP, Nv2, cloud services, The Dude, and RouterOS binary files. Use to identify unfamiliar MikroTik traffic or files by port, EtherType, or artifact; find vendor docs, research, or implementations; or learn what is still unknown. A background index; specialist skills handle operations."
---

# RouterOS Proprietary Protocols and File Formats

An index of MikroTik-specific wire protocols and files. Each row gives a
fingerprint, where to read, and how much is known. The linked docs and code
hold the details; read them before implementing anything.

**Knowledge levels used below:**

- **vendor docs**: MikroTik documents configuration and behavior, not the wire format.
- **spec**: MikroTik publishes the wire format.
- **implemented**: working tikoci code you can read and run.
- **research**: partial, version-scoped reverse engineering in m2ir.
- **leads**: public sources are listed, but nobody has studied them yet.
- **gap**: nothing useful is linked yet.

## WinBox first

WinBox talks to RouterOS's internal M2 (`nv::message`) / nova IPC system. That
makes WinBox the main entry point for understanding how the router represents
configuration. Start with m2ir's [agent reading map][m2ir-map]. It routes capture
decoding, patched WinBox clients, and native configuration backends to canonical
YAML. For other formats, use the [format and research index][m2ir-index].

## Protocols

Ports and EtherTypes come from MikroTik's [Services][services] page and the
linked protocol pages.

| Protocol | On the wire | Read | Known |
|---|---|---|---|
| **WinBox / M2 / nova IPC** | TCP 8291 (also the mobile app and The Dude) | [m2ir map][m2ir-map], [WinBox guide][winbox-guide] | research: framing, auth, crypto, selected handlers |
| **MAC-WinBox** | UDP 20561 ([MAC server][mac-server]) | [m2ir index][m2ir-index] → source inventory | vendor docs, leads |
| **MAC-Telnet / MAC-Ping** | UDP 20561 | [routeros-mac-telnet](../routeros-mac-telnet/SKILL.md) | implemented (centrs); MAC-Ping payload only sketched |
| **RoMON** | EtherType 0x88bf, dst 01:80:c2:00:88:bf | [RoMON][romon] | vendor docs; centrs support not started |
| **MNDP** | UDP 5678 | [routeros-mndp](../routeros-mndp/SKILL.md), [centrs codec][centrs-mndp] | implemented; some values unknown ([m2ir#3][m2ir-mndp]) |
| **API / API-SSL** | TCP 8728 / 8729 | [API][api], [routeros-centrs](../routeros-centrs/SKILL.md) | spec, implemented ([centrs][centrs-api]) |
| **Bandwidth test** | TCP/UDP 2000 | [Bandwidth test][btest], [centrs btest][centrs-btest] | implemented: client and server, tested against CHR |
| **EoIP / EoIPv6** | EoIP: GRE, IP protocol 47 | [EoIP][eoip] | vendor docs; no wire reference |
| **IP packing** | EtherType 0x9000; MNDP TLV 14 advertises unpacking | [IP packing][packing], [m2ir#3][m2ir-mndp] | vendor docs; frame and compression formats are a gap |
| **CAPsMAN** | UDP 5246 control; UDP 5247 legacy data; or Layer 2 | [WiFi CAPsMAN][capsman] | vendor docs |
| **CMR** | TCP 54321 | [routeros-cmr](../routeros-cmr/SKILL.md) | vendor docs, lab-tested operation; no wire reference |
| **MLAG ICCP** | EtherType 0x88b5, dst 01:80:c2:00:00:0e | [MLAG][mlag] | vendor docs |
| **Nv2 / NStreme** | Wireless MAC layer (legacy `wireless` package) | [Nv2][nv2] | vendor docs |
| **MikroTik cloud** | `cloud2.mikrotik.com` UDP 15252 (DDNS), TCP 15252 (backup) | [Cloud server communication][cloud-comm] | vendor docs; payloads are a gap |
| **The Dude client/server** | Via the WinBox service | [Dude][dude] (discontinued) | gap; `dude.db` files are under Files |
| **Netinstall / Etherboot** | BOOTP/DHCP ports, TFTP | [routeros-netinstall](../routeros-netinstall/SKILL.md) | workflow docs; no wire reference |

For what centrs implements today, check its [capability matrix][centrs-matrix].

## Files

Routes and boundaries are maintained in the [m2ir format and research index][m2ir-index].

| Artifact | Start | Known |
|---|---|---|
| WinBox `.cdb` saved connections | [centrs reader][centrs-cdb] | implemented; m2ir profile is a placeholder |
| WinBox `.wbx` saved sessions | m2ir source inventory | leads |
| The Dude `dude.db` object blobs | m2ir Dude profile → donny, TheDudeToHuman | research: initial schema |
| `.x3` metadata, `/rw/store/cfg.*` | m2ir CHR extraction notes; SYS_OWNER findings | research, version-scoped |
| NPK, binary `.backup`, user database, `supout.rif` | m2ir source inventory | leads |

## Looks proprietary, is not

- **[Back To Home][bth]**: the VPN data plane is plain WireGuard and works with
  standard clients. MikroTik adds provisioning, DNS naming, and an optional relay.
- **REST / WebFig** run over HTTP(S); the endpoints and semantics are RouterOS's own.
  See [routeros-fundamentals](../routeros-fundamentals/SKILL.md) and
  [routeros-webfig](../routeros-webfig/SKILL.md).
- **`.rsc` exports** are script text; see [routeros-scripting](../routeros-scripting/SKILL.md).
- **TZSP** sniffer streaming is TamoSoft's format; see [routeros-sniffer](../routeros-sniffer/SKILL.md).

## Conclusions not to draw

- WinBox, MAC-Telnet, and btest share EC-SRP5 login. A working login proves that
  login, not a shared session format or native WinBox config access.
- A saved RoMON record in a CDB is not a RoMON wire specification.
- A port or EtherType identifies traffic; it says nothing about the payload.
- An m2ir placeholder profile ranks below a working implementation and its specialist skill.
- m2ir findings are version-scoped. Read each entry's confidence, evidence, and
  version range, and record the RouterOS/client versions you used.

When only docs or leads exist, say so instead of inventing a grammar. Report
observations, unknown TLVs, and negative results through m2ir's
[discovery guidance][discoveries], with sanitized evidence.

[m2ir-map]: https://raw.githubusercontent.com/tikoci/m2ir/main/llms.txt
[m2ir-index]: https://raw.githubusercontent.com/tikoci/m2ir/main/profiles/README.md
[winbox-guide]: https://raw.githubusercontent.com/tikoci/m2ir/main/profiles/winbox-ipc/README.md
[m2ir-mndp]: https://github.com/tikoci/m2ir/issues/3
[discoveries]: https://github.com/tikoci/m2ir/blob/main/README.md#submit-a-discovery
[centrs-mndp]: https://github.com/tikoci/centrs/blob/main/src/data/mndp.ts
[centrs-api]: https://github.com/tikoci/centrs/blob/main/src/protocols/native-api.ts
[centrs-btest]: https://github.com/tikoci/centrs/blob/main/commands/btest/README.md
[centrs-cdb]: https://github.com/tikoci/centrs/blob/main/src/data/winbox-cdb.ts
[centrs-matrix]: https://github.com/tikoci/centrs/blob/main/docs/MATRIX.md
[services]: https://manual.mikrotik.com/docs/system-information-and-utilities/services/
[mac-server]: https://manual.mikrotik.com/docs/management-tools/mac-server/
[romon]: https://manual.mikrotik.com/docs/management-tools/romon/
[api]: https://manual.mikrotik.com/docs/developer-guides/api/
[btest]: https://manual.mikrotik.com/docs/diagnostics-monitoring-and-troubleshooting/bandwidth-test/
[eoip]: https://manual.mikrotik.com/docs/virtual-private-networks/eoip/
[packing]: https://manual.mikrotik.com/docs/system-information-and-utilities/ip-packing/
[capsman]: https://manual.mikrotik.com/docs/wireless/wifi/capsman/
[mlag]: https://manual.mikrotik.com/docs/high-availability-solutions/multi-chassis-link-aggregation-group/
[nv2]: https://manual.mikrotik.com/docs/wireless/abgn/nv2/
[cloud-comm]: https://manual.mikrotik.com/docs/network-management/cloud/communication-mikrotik-cloud-servers/
[dude]: https://manual.mikrotik.com/docs/management-tools/dude/
[bth]: https://manual.mikrotik.com/docs/network-management/cloud/back-to-home/
