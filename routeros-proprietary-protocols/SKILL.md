---
name: routeros-proprietary-protocols
description: "Navigate MikroTik-specific protocols and file formats: WinBox/M2/nova IPC, MAC-WinBox, RoMON, MAC-Telnet, MNDP, native API, EoIP, bandwidth test (btest), IP packing, and RouterOS binary files. Use to identify an unfamiliar MikroTik artifact, find protocol research or implementation pointers, interpret captures, investigate WinBox compatibility, or plan a native configuration backend. A background index with explicit knowledge gaps; use existing specialist skills for operations."
---

# RouterOS Proprietary Protocols and File Formats

Use this inventory to find existing knowledge about MikroTik-specific wire
protocols and files. It includes documented vendor protocols, partial reverse
engineering, and topics with only leads. Coverage below describes the linked
resources, not everything anyone knows. Follow their current status before
implementing.

## Start with WinBox and the configuration system

WinBox is an entrypoint into RouterOS's internal management system. The
[`nv::message` / M2 grammar][m2-grammar] and [WinBox profile guide][winbox-guide]
connect typed messages, process/handler routing, authentication, and configuration
access. This is useful background for understanding how the router represents
configuration, beyond the WinBox GUI.

MAC-WinBox, RoMON, and terminal access belong on that reading map, but keep their
transport and session layers distinct. Shared authentication or saved RoMON
records alone do not establish a shared wire format. MNDP has a separate grammar;
the native API is another configuration interface, with its own framing.

For deeper work, use m2ir's [agent reading map][m2ir-map]: it routes capture
interpretation, patched WinBox client compatibility, and native configuration
backend development. Use the [format and research index][m2ir-index] for other
artifacts. These are maintained entrypoints; field tables and research inventories
stay upstream.

## Protocol inventory

| Protocol or mechanism | What to read | Knowledge and boundary |
|---|---|---|
| **WinBox over IP; M2 / nova IPC** | [WinBox guide][winbox-guide] → [agent map][m2ir-map] → canonical YAML and its evidence | Substantial but partial research: framing, authentication, crypto, routing, and selected configuration handlers. Exact version and handler scope matter. |
| **MAC-WinBox** | [MikroTik MAC server docs][mac-server]; [m2ir index][m2ir-index] → source inventory | Layer-2 WinBox access. Public implementation leads exist; m2ir has no populated canonical profile. Keep separate from MAC-Telnet. |
| **RoMON** | [MikroTik RoMON docs][romon]; [m2ir index][m2ir-index] → CDB guide / source leads | Vendor management overlay used for WinBox and other management access. Operational docs and saved-record evidence exist; those records do not specify the tunnel wire protocol. |
| **MAC-Telnet; MAC-Ping** | [routeros-mac-telnet](../routeros-mac-telnet/SKILL.md) → upstream C implementation and centrs | Detailed MAC-Telnet framing/authentication references and implemented client. MAC-Ping payload semantics are only sketched there. Shared EC-SRP evidence does not make this WinBox session encryption. |
| **MNDP** | [routeros-mndp](../routeros-mndp/SKILL.md); [centrs codec][centrs-mndp]; [m2ir index][m2ir-index] | Existing codec/dissector references cover discovery TLVs. m2ir's MNDP profile is a placeholder; use the specialist skill and implementation. Includes packing-related advertisements. |
| **RouterOS native API / API-SSL** | [Official API specification][api]; [centrs native API implementation][centrs-api]; [routeros-centrs](../routeros-centrs/SKILL.md) | Publicly documented vendor sentence/word protocol. Separate from WinBox/M2 and from REST; TLS does not change the underlying API grammar. |
| **EoIP** | [MikroTik EoIP docs][eoip] | MikroTik Ethernet tunneling using GRE. Configuration and encapsulation overview available; GRE ancestry alone does not establish interoperability with another Ethernet-over-GRE implementation. No detailed wire reference curated here. |
| **Bandwidth test / btest** | [MikroTik bandwidth-test docs][btest]; [WinBox guide's implementation trail][winbox-guide] → centrs authentication, protocol code, and tests | Operational docs and implementation evidence exist. Shared EC-SRP5 findings cover authentication use; they are not a complete m2ir btest profile. |
| **IP packing (`/ip/packing`)** | [MikroTik IP packing docs][packing]; [routeros-mndp](../routeros-mndp/SKILL.md) → packing TLVs | Poorly understood here. Documented aggregation/compression requires neighbor discovery; MNDP exposes packing information. No complete packing/compression wire grammar or decoder is linked here. Advertisement fields do not explain the data format. |
| **Netinstall / Etherboot** | [routeros-netinstall](../routeros-netinstall/SKILL.md) | Existing workflow and BOOTP/TFTP references. Distinguish standard boot transports from MikroTik-specific installation exchanges and artifacts. |

For implemented centrs capabilities, check its current [capability matrix][centrs-matrix]
and follow the relevant source/tests. An authentication implementation does not
prove native WinBox configuration retrieval, notifications, or RoMON support.

## File-format inventory

Start with the [m2ir format and research index][m2ir-index], which maintains the
following routes and their upstream sources:

| Artifact | Reading route and current boundary |
|---|---|
| **WinBox CDB saved connections; WBX saved sessions** | CDB guide → [centrs reader][centrs-cdb] and tests; source inventory → WBX/conversion leads. CDB's m2ir profile is a placeholder; WBX has no canonical grammar there. |
| **The Dude `dude.db` object blobs** | Dude profile → object classes / fields → `tikoci/donny` and `german77/TheDudeToHuman`. Initial populated schema; not a complete database specification. |
| **RouterOS `.x3` metadata; internal store files** | CHR extraction notes / experimental decoder; WinBox system keys / persistence findings for `/rw/store/cfg.*`. Selected version-scoped research, not general file grammars. |
| **NPK packages, binary backups, user databases, supout** | Source inventory → extraction/tooling leads. Coverage varies; a listed lead does not establish a complete decoder. |

## Vendor branding and standard protocols

- **[Back To Home VPN][bth]** uses real WireGuard, with MikroTik provisioning,
  DNS naming, and optional relay service around it. Exported configurations work
  with standard WireGuard clients. Distinguish that VPN data plane from the
  vendor's discovery/control/relay mechanisms when investigating behavior.
- **REST / WebFig** use HTTP(S); RouterOS endpoints and configuration semantics
  remain vendor-specific. Use [routeros-fundamentals](../routeros-fundamentals/SKILL.md)
  and [routeros-webfig](../routeros-webfig/SKILL.md) for those interfaces.
- **`.rsc` exports** are RouterOS script text, distinct from binary backups.
  Use [routeros-scripting](../routeros-scripting/SKILL.md).

## Follow the evidence and return discoveries

Read the selected m2ir YAML entry's confidence, evidence, revision history, and
version scope. Preserve unknown tags and distinguish observed bytes from inferred
meanings. Record the repository revision and exact RouterOS/client versions for
technical conclusions; a working login or one decoded message proves only that
operation. Use [routeros-sniffer](../routeros-sniffer/SKILL.md) for capture acquisition.

If only documentation or an implementation lead exists, say so. If no useful
reference is indexed, report that gap rather than inventing a grammar. Send new
observations, unknown TLVs, negative results, or corrections through m2ir's
[discovery submission guidance][discoveries], with sanitized evidence and scope.

[m2-grammar]: https://raw.githubusercontent.com/tikoci/m2ir/main/physical/nv-message.yaml
[winbox-guide]: https://raw.githubusercontent.com/tikoci/m2ir/main/profiles/winbox-ipc/README.md
[m2ir-map]: https://raw.githubusercontent.com/tikoci/m2ir/main/llms.txt
[m2ir-index]: https://raw.githubusercontent.com/tikoci/m2ir/main/profiles/README.md
[discoveries]: https://github.com/tikoci/m2ir/blob/main/README.md#submit-a-discovery
[centrs-mndp]: https://github.com/tikoci/centrs/blob/main/src/data/mndp.ts
[centrs-api]: https://github.com/tikoci/centrs/blob/main/src/protocols/native-api.ts
[centrs-cdb]: https://github.com/tikoci/centrs/blob/main/src/data/winbox-cdb.ts
[centrs-matrix]: https://github.com/tikoci/centrs/blob/main/docs/MATRIX.md
[mac-server]: https://help.mikrotik.com/docs/spaces/ROS/pages/98795539/MAC+server
[romon]: https://help.mikrotik.com/docs/spaces/ROS/pages/8978569/RoMON
[api]: https://help.mikrotik.com/docs/spaces/ROS/pages/47579160/API
[eoip]: https://help.mikrotik.com/docs/spaces/ROS/pages/24805521/EoIP
[btest]: https://help.mikrotik.com/docs/spaces/ROS/pages/7962644/Bandwidth+Test
[packing]: https://help.mikrotik.com/docs/spaces/ROS/pages/139526171/IP+packing
[bth]: https://help.mikrotik.com/docs/spaces/ROS/pages/197984280/Back+To+Home
