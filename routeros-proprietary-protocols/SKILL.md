---
name: routeros-proprietary-protocols
description: "Navigate MikroTik-specific protocols and file formats: WinBox/M2/nova IPC, MAC-WinBox, MAC-Telnet, RoMON, MNDP, native API, btest, EoIP, IP packing, WebFig jsproxy, CAPsMAN, CMR, MLAG ICCP, Loop Protect, Nv2, cloud services, The Dude, and RouterOS binary files. Use to identify unfamiliar MikroTik traffic or files by port, EtherType, or artifact; find vendor docs, research, or implementations; or learn what is still unknown. A background index; specialist skills handle operations."
---

# RouterOS Proprietary Protocols and File Formats

An index of MikroTik-specific wire protocols and files. Each row gives a
fingerprint, where to read, and what the linked material covers. The linked
docs and code hold the details; read them before implementing anything.

**Coverage** describes what this index links, not all public knowledge:
**docs** (vendor behavior/config docs), **spec** (vendor wire spec),
**code** (tikoci implementation), **research** (version-scoped m2ir findings),
**leads** (sources to investigate; not assessed here), **gap** (wire/format
details not curated here).

## WinBox first

WinBox talks to RouterOS's internal M2 (`nv::message`) / nova IPC system. That
makes WinBox the main entry point for understanding how the router represents
configuration. Start with m2ir's [agent reading map][m2ir-map]. It routes capture
decoding, patched WinBox clients, and native configuration backends to canonical
YAML. For other formats, use the [format and research index][m2ir-index].

## Protocols

Ports and EtherTypes are defaults and clues, not proof of protocol. They come
from MikroTik's [Services][services] page, the bridge filter
[MAC-protocol list][mac-protocols], and the linked protocol pages.

| Protocol | On the wire | Read | Coverage |
|---|---|---|---|
| **WinBox / M2 / nova IPC** | TCP 8291 (also the mobile app and The Dude) | [m2ir map][m2ir-map], [WinBox guide][winbox-guide] | research: framing, auth, crypto, selected handlers |
| **MAC-WinBox** | UDP 20561 ([MAC server][mac-server]) | [m2ir source inventory][m2ir-sources] | docs, leads |
| **MAC-Telnet / MAC-Ping** | UDP 20561 | [routeros-mac-telnet](../routeros-mac-telnet/SKILL.md) | code (centrs); MAC-Ping payload only sketched |
| **RoMON** | EtherType 0x88bf, dst 01:80:c2:00:88:bf | [RoMON][romon] | docs; centrs support not started |
| **MNDP** | UDP 5678 | [routeros-mndp](../routeros-mndp/SKILL.md), [centrs codec][centrs-mndp] | code; some values unknown ([m2ir#3][m2ir-mndp]) |
| **API / API-SSL** | TCP 8728 / 8729 | [API][api], [routeros-tikoci-centrs](../routeros-tikoci-centrs/SKILL.md) | spec, code ([centrs][centrs-api]) |
| **Bandwidth test** | TCP 2000; UDP allocated from 2000 upward | [Bandwidth test][btest], [centrs btest][centrs-btest] | code: client and server, tested against CHR |
| **EoIP / EoIPv6** | EoIP: GRE, IP protocol 47 | [EoIP][eoip] | docs; no wire reference |
| **IP packing** | EtherType 0x9000 simple / 0x9001 compressed; MNDP TLV 14 advertises unpacking | [IP packing][packing], [m2ir#3][m2ir-mndp] | docs; frame and compression formats are a gap |
| **WebFig `/jsproxy`** | HTTP(S) to `/jsproxy`, `Content-Type: msg` | [routeros-webfig](../routeros-webfig/SKILL.md) ([validation notes](../routeros-webfig/references/validation.md)) | observed only; gap |
| **CAPsMAN** | WiFi: TCP and UDP 5246; legacy: UDP 5246 control, 5247 data; or Layer 2 | [WiFi CAPsMAN][capsman] | docs |
| **CMR** | TCP 54321 | [routeros-cmr](../routeros-cmr/SKILL.md) | docs, lab-tested operation; no wire reference |
| **MLAG ICCP** | EtherType 0x88b5, dst 01:80:c2:00:00:0e | [MLAG][mlag] | docs |
| **Loop Protect** | EtherType 0x9003 | [Loop Protect][loop-protect] | docs |
| **Nv2 / NStreme** | Wireless MAC layer (legacy `wireless` package) | [Nv2][nv2] | docs |
| **MikroTik cloud** | `cloud2.mikrotik.com` UDP 15252 (DDNS), TCP 15252 (backup) | [Cloud server communication][cloud-comm] | docs; payloads are a gap |
| **The Dude client/server** | Via the WinBox service | [Dude][dude] (discontinued) | gap; `dude.db` files are under Files |
| **Netinstall / Etherboot** | BOOTP/DHCP ports, TFTP | [routeros-netinstall](../routeros-netinstall/SKILL.md) | workflow docs; no wire reference |

For what centrs implements today, check its [capability matrix][centrs-matrix].

## Files

Routes and boundaries are maintained in the [m2ir format and research index][m2ir-index].

| Artifact | Start | Coverage |
|---|---|---|
| WinBox `.cdb` saved connections | [centrs reader][centrs-cdb] | code; m2ir profile is a placeholder |
| WinBox `.wbx` saved sessions | [m2ir source inventory][m2ir-sources] | leads |
| The Dude `dude.db` object blobs | [m2ir Dude profile][m2ir-dude] → donny, TheDudeToHuman | research: initial schema |
| `.x3` metadata, `/rw/store/cfg.*` | [m2ir CHR extraction][m2ir-chr]; [SYS_OWNER][m2ir-sys-keys] | research, version-scoped |
| NPK, binary `.backup`, user database, `supout.rif` | [m2ir source inventory][m2ir-sources] | leads |

## Standard building blocks and related formats

- **[Back To Home][bth]**: the VPN data plane is WireGuard and works with
  standard clients. MikroTik adds provisioning, DNS naming, and an optional relay.
- **REST** is HTTP(S) and JSON over RouterOS menu paths; see
  [routeros-fundamentals](../routeros-fundamentals/SKILL.md).
- **`.rsc` exports** are RouterOS script text, not binary backups; see
  [routeros-scripting](../routeros-scripting/SKILL.md).
- **TZSP** sniffer streaming is TamoSoft's format; see [routeros-sniffer](../routeros-sniffer/SKILL.md).

## Evidence

A shared EC-SRP5 login (WinBox, MAC-Telnet, btest) proves that login, not a
shared session format or native WinBox config access. m2ir findings are
version-scoped: read each entry's confidence, evidence, and version range, and
record the RouterOS/client versions you used. When only docs or leads exist,
say so instead of inventing a grammar. Report observations and negative results
through m2ir's [discovery guidance][discoveries].

[m2ir-map]: https://raw.githubusercontent.com/tikoci/m2ir/main/llms.txt
[m2ir-index]: https://raw.githubusercontent.com/tikoci/m2ir/main/profiles/README.md
[winbox-guide]: https://raw.githubusercontent.com/tikoci/m2ir/main/profiles/winbox-ipc/README.md
[m2ir-mndp]: https://github.com/tikoci/m2ir/issues/3
[m2ir-sources]: https://raw.githubusercontent.com/tikoci/m2ir/main/work/2026-05-winbox-nova-sources/winbox-nova-source-inventory.md
[m2ir-dude]: https://raw.githubusercontent.com/tikoci/m2ir/main/profiles/dude-on-disk/profile.yaml
[m2ir-chr]: https://raw.githubusercontent.com/tikoci/m2ir/main/work/2026-10-chr-extraction/README.md
[m2ir-sys-keys]: https://raw.githubusercontent.com/tikoci/m2ir/main/profiles/winbox-ipc/sys-keys.yaml
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
[mac-protocols]: https://manual.mikrotik.com/docs/bridging-and-switching/
[loop-protect]: https://manual.mikrotik.com/docs/bridging-and-switching/user-guides/loop-protect/
[capsman]: https://manual.mikrotik.com/docs/wireless/wifi/capsman/
[mlag]: https://manual.mikrotik.com/docs/high-availability-solutions/multi-chassis-link-aggregation-group/
[nv2]: https://manual.mikrotik.com/docs/wireless/abgn/nv2/
[cloud-comm]: https://manual.mikrotik.com/docs/network-management/cloud/communication-mikrotik-cloud-servers/
[dude]: https://manual.mikrotik.com/docs/management-tools/dude/
[bth]: https://manual.mikrotik.com/docs/network-management/cloud/back-to-home/
