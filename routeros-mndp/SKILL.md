---
name: routeros-mndp
description: "MNDP (MikroTik Neighbor Discovery Protocol) wire format, behavior, and RouterOS /ip/neighbor integration. Use when: implementing MNDP discovery, parsing MNDP packets, working with /ip/neighbor, understanding WinBox device discovery, debugging why a router doesn't appear in neighbor lists, or when the user mentions MNDP, neighbor discovery, WinBox discovery, or /ip/neighbor."
---

# MNDP — MikroTik Neighbor Discovery Protocol

MNDP is the UDP broadcast/multicast protocol that RouterOS uses for automatic device
discovery on the local network. It is the same protocol WinBox uses to find routers.
Every RouterOS device participates by default.

## Why This Matters for Agents

- **`/ip/neighbor`** on RouterOS is the CLI/REST surface for MNDP results
- WinBox's "Neighbors" tab is an MNDP listener
- Any agent implementing device discovery for MikroTik equipment needs MNDP
- The protocol is simple enough to implement from scratch — no library needed

## Protocol Basics

| Property | Value |
|----------|-------|
| Transport | UDP |
| Port | 5678 |
| IPv4 | Broadcast to 255.255.255.255:5678 |
| IPv6 | Multicast to ff02::1 (all-nodes link-local) |
| Copies | Each announcement goes out as **both** an IPv4 broadcast and an IPv6 multicast, same payload[^m2ir-wire] |
| Direction | Bidirectional — same port for send and receive |
| Authentication | None — read-only discovery, no credentials |
| Scope | Layer 2 broadcast domain (does not cross routers) |

## How Discovery Works

1. **Listener sends a refresh packet** — a small UDP datagram to 255.255.255.255:5678 (MAC-Telnet sends a minimal 4-byte zeroed header; a 9-byte form also works — see below)
2. **All RouterOS devices on the LAN reply** — each sends a TLV-encoded announcement with identity, version, board, MAC, IP, uptime, etc.
3. **Replies arrive asynchronously** — devices respond within milliseconds to seconds depending on network conditions
4. **RouterOS devices also announce periodically** every `discover-interval` (a setting since 7.16, default 30 s; a fixed 60 s before[^changelog-716]) — passive listening works but is slow to populate
5. **Some config changes announce at once** — identity, CAPsMAN, CMR, `/ip/packing`, IPv6 on/off, discovery `protocol`/`mode`/`discover-interval`/`lldp-med`, and address changes (7.21+[^changelog-721]). Service toggles (MAC server, RoMON, IP services) wait for the next interval[^m2ir-wire]

### Refresh Packet (Discovery Request)

A short packet that triggers immediate replies from all RouterOS devices on the broadcast
domain. The minimal form is just a zeroed 4-byte header — this is exactly what MAC-Telnet
sends (`unsigned int message = 0;`):

```text
Offset  Length  Value       Field
0       4       00 00 00 00 header (zero in a request; a counter in announcements — see below)
```

As raw bytes (minimal): `00 00 00 00`

Some implementations append an explicit refresh TLV (type 6, length 0). The complete
header + empty-TLV form is 8 bytes (`00 00 00 00 00 06 00 00`); some implementations add
a trailing zero byte (non-semantic padding), giving 9 bytes. RouterOS accepts all forms:

```text
Offset  Length  Value       Field
0       4       00 00 00 00 header
4       2       0x0006      TLV type = 6 (refresh)   ← big-endian
6       2       0x0000      TLV length = 0
8       1       0x00        optional trailing pad (non-semantic)
```

As raw bytes (9-byte form): `00 00 00 00 00 06 00 00 00`

### Response Packet

```text
Offset  Length  Field
0       4       announcement counter (uint32, SENDER's native byte order)
4+      TLV[]   zero or more TLV records (see below)
```

The header is one 32-bit counter of announcements sent on that interface (periodic
and triggered). It restarts at boot, and the IPv4 and IPv6 copies of one
announcement carry the same value. Its byte order is the **sender's CPU byte
order**: little-endian on x86, ARM and ARM64, big-endian on MIPSBE boards.[^m2ir-wire]
Older readings (MAC-Telnet's version + TTL bytes plus a big-endian sequence number
at bytes 2–3) describe the same 4 bytes seen on a long-running big-endian router.

Parsers should skip the 4 header bytes and iterate TLVs from offset 4. If the
counter matters, pick the byte order whose value × `discover-interval` is closest
to the uptime (TLV 10).

## TLV Format

Each TLV (Type-Length-Value) record in the response:

```text
Offset  Length  Field
0       2       type   (big-endian uint16)
2       2       length (big-endian uint16) — byte count of value
4       N       value  (raw bytes — interpretation depends on type)
```

**Byte order:** TLV type and length are **big-endian** (network byte order — `ntohs`).
This is confirmed by the canonical reference implementations: MAC-Telnet's `protocol.c`
(`type = ntohs(type); len = ntohs(len);`) and the official Wireshark MNDP dissector
(`packet-mndp.c`, which reads both with `ENC_BIG_ENDIAN`).

**Value encoding varies by type and is the most common footgun:** string TLVs are UTF-8,
IPv4/IPv6/MAC are raw network-order bytes, but **TLV 10 (uptime) is a little-endian
uint32**, also on big-endian MIPSBE routers. TLV 9 (`aggregated-size`) is
little-endian on x86 (unverified on big-endian CPUs), and the header counter follows
the sender's CPU.[^m2ir-wire]

### TLV Type Reference

| Type | Hex    | Name           | Value Format | Notes |
|------|--------|----------------|-------------|-------|
| 1    | 0x0001 | MAC Address    | 6 raw bytes (network order) | Per-interface MAC, not chassis MAC |
| 2    | 0x0002 | Unpack: simple | empty (flag) | Neighbor unpacks aggregated packets; with 3 and 4, builds `unpack=`[^m2ir-wire][^packing] |
| 3    | 0x0003 | Unpack: headers | empty (flag) | Also decompresses headers (`unpack=uncompress-headers`) |
| 4    | 0x0004 | Unpack: all    | empty (flag) | Also decompresses payload (`unpack=uncompress-all`) |
| 5    | 0x0005 | Identity       | UTF-8 string | Hostname — same across all interfaces |
| 7    | 0x0007 | Version        | UTF-8 string | Format varies by version — see below |
| 8    | 0x0008 | Platform       | UTF-8 string | `MikroTik`, or the branding package's name |
| 9    | 0x0009 | Aggregated size | 4 bytes **LE** uint32 (x86) | `/ip/packing` `aggregated-size`; sent only with TLV 2 |
| 10   | 0x000a | Uptime         | 4 bytes **LE** uint32 | Seconds since boot; LE on every CPU |
| 11   | 0x000b | Software ID    | UTF-8 string | License identifier |
| 12   | 0x000c | Board          | UTF-8 string | e.g. `RB4011iGS+5HacQ2HnD`, `CHR` |
| 14   | 0x000e | IPv6 enabled   | 1 byte | `01` IPv6 enabled, `00` disabled; shown as `ipv6=` in `/ip/neighbor`. **Not** "unpack"[^m2ir-wire][^changelog-718] |
| 15   | 0x000f | IPv6 Address   | 16 raw bytes | **Repeats** once per address: global first, then link-local |
| 16   | 0x0010 | Interface Name | UTF-8 string | Sending interface; `bridge/port` (e.g. `bridge/ether1`) for a bridge port |
| 17   | 0x0011 | IPv4 Address   | 4 raw bytes (network order) | IP of the sending interface |
| 18   | 0x0012 | Running        | 1 byte | 7.20+: `00` none, `01` CAPsMAN, `02` CMR controller (seen singly; a bitmask is inferred, combined values unseen); shown as `running=`[^changelog-720][^quickchr-cmr] |
| 19   | 0x0013 | TTL            | 1 byte | 7.24+: entry lifetime in seconds, `min(discover-interval × 4 + 1, 255)`, an approximate lifetime; `00` = dying gasp[^changelog-724] |

**Source of truth:** types 1, 5, 7, 8, 10–12 and 15–17 match the canonical MAC-Telnet
`protocol.c` (`MT_MNDPTYPE_*` enum) and the Wireshark MNDP dissector value table. Note in
particular that **uptime is type 10, software-id is type 11, and board is type 12** —
a common mistake is to off-by-one these (uptime=11/board=13), which silently misparses
real RouterOS packets. Types 2–4, 9, 18 and 19, and the meaning of 14, come from live
captures across RouterOS 6.49–7.26beta5, one setting changed at a time.[^m2ir-wire] Both
MAC-Telnet and Wireshark label type 14 "unpack"; that label is wrong.

**Unknown values:** types 6 and 13 and anything above 19 were never seen in an
announcement, and combined TLV 18 bits (CAPsMAN and CMR together) are untested.
Skip unknown types by length, preserve their bytes when logging, and report
observations to m2ir.[^m2ir-mndp]

### Layout and Version Differences

TLV order changes between versions, so **never parse by position**:

| Versions | TLV order |
|----------|-----------|
| 6.49, 7.6–7.19 | 1, 5, 7, 8, 10, 11, 12, 14, [15], 16, 17 |
| 7.20–7.23 | …, 16, 17, 18 |
| 7.24 and later | 1, [2, 3, 4, 9], 5, 7, 8, 10, 11, 12, 14, 16, 18, 19, 17, 15… |

TLVs 15 and 17 are absent when the interface has no such address, including right
after boot. TLV 7 text also changes format:

| Versions | Example |
|----------|---------|
| 6.x | `6.49.21 (long-term)` |
| 7.6–7.13 | `7.12.1 (stable) Nov/17/2023 11:38:45` |
| 7.14–7.24 | `7.24.6 (long-term) 2026-10-30 08:24:29` |
| 7.25 and later | `7.25.1 2026-11-02 12:39:53` (no channel) |

Take the version as the first space-separated token; don't require a channel.

### Entry Lifetime and Dying Gasp (7.24+)

A receiver removes a silent neighbor at about its TLV 19 TTL after the last
announcement, or up to about 20 s later. With only MNDP enabled, a TTL-21 neighbor
was removed anywhere from age 18–22 s to about 20 s past the TTL, and a TTL-121
neighbor 2–17 s past it.[^m2ir-wire] A listener that caches neighbors can expire them at
the TTL; RouterOS's own `/ip/neighbor` may keep them a little longer. For senders without TLV 19 (before 7.24), fall back to a few times
the expected interval.

With `dying-gasp=yes`, a router going through a graceful reboot, shutdown or upgrade sends a short announcement of TLVs 1,
19 = `00`, 17 and 15. Treat TTL 0 as "remove this neighbor now".[^changelog-724]

## Multi-Interface Behavior

A RouterOS device with N active interfaces sends **N separate MNDP announcements** — one per interface. Each announcement has:

- A **different MAC address** (the interface's own MAC)
- A **different interface name** (TLV 16)
- A **different IP address** (if assigned)
- The **same identity** (hostname)

This is expected behavior, not a bug. When displaying results, **group by identity** to avoid showing the same router N times. Use MAC address to disambiguate when the identity is the factory default (`MikroTik`).

## Timing and Reliability

| Scenario | Expected Response Time |
|----------|----------------------|
| Local LAN (wired) | 1-3 seconds |
| WiFi / congested network | 3-10 seconds |
| ZeroTier / tunnel overlay | 5-20 seconds |
| Satellite / high-latency | 10-30 seconds |

**Best practice:** Send multiple refresh packets during the listen window (every 5 seconds, matching WinBox behavior). Devices that miss the first broadcast due to packet loss, WiFi power-save, or tunnel relay latency will respond to subsequent refreshes.

**Never interpret missing devices as offline.** A short scan window produces partial results. Increase the timeout before concluding a device is unreachable.

## RouterOS /ip/neighbor

`/ip/neighbor` is the RouterOS-side view of MNDP (and CDP/LLDP) discovery results. It shows what the router has heard from other devices on its directly-connected networks.

```routeros
# Print discovered neighbors
/ip/neighbor/print

# Columns: interface, address, mac-address, identity, platform, version, board
```

### /ip/neighbor/discovery-settings

Controls which interfaces participate in neighbor discovery:

```routeros
# Show current discovery settings
/ip/neighbor/discovery-settings/print

# Disable MNDP on a specific interface (security hardening)
/interface/list/member/add list=no-mndp interface=ether1
/ip/neighbor/discovery-settings/set discover-interface-list=!no-mndp

# Supported protocols (can be combined)
# cdp — Cisco Discovery Protocol
# lldp — Link Layer Discovery Protocol
# mndp — MikroTik Neighbor Discovery Protocol
/ip/neighbor/discovery-settings/set protocol=mndp,lldp
```

### REST API Access

```sh
# List neighbors via REST
curl -u admin: http://<router-ip>/rest/ip/neighbor

# Response is JSON array with the same fields as CLI print
```

### Security Considerations

- MNDP has **no authentication** — any device on the broadcast domain can discover routers
- Disable MNDP on untrusted interfaces (public-facing, guest networks)
- RouterOS defaults to discovery on all interfaces — review and restrict
- MNDP reveals: identity (hostname), version, board model, IPs, MACs, uptime
- This information is useful for attackers — treat MNDP like an open SNMP community

## Socket Implementation Notes

### Port Sharing (SO_REUSEPORT)

MNDP uses the **same port (5678) for both sending and receiving**. If another process (e.g., WinBox) already has UDP/5678 bound, your listener needs `SO_REUSEPORT` to coexist:

```typescript
// Node.js / Bun dgram
import { createSocket } from "node:dgram";
const sock = createSocket({ type: "udp4", reuseAddr: true, reusePort: true });
sock.bind(5678, "0.0.0.0", () => {
  sock.setBroadcast(true);
});
```

```c
// C / POSIX
int opt = 1;
setsockopt(fd, SOL_SOCKET, SO_REUSEPORT, &opt, sizeof(opt));
setsockopt(fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));
setsockopt(fd, SOL_SOCKET, SO_BROADCAST, &opt, sizeof(opt));
```

**Platform note:** `SO_REUSEPORT` works on macOS and Linux. On Windows, `SO_REUSEADDR` alone may be sufficient. In Bun, `reusePort: true` requires Bun >= 1.3.11 (earlier versions silently ignored it on macOS).

### Self-Echo Filtering

When you send a broadcast to 255.255.255.255:5678, the OS delivers a copy back to your own socket. Filter out packets from your own IP addresses to avoid processing your own refresh as a neighbor response. The looped-back packet will have no MNDP TLVs (it's your 9-byte refresh, not a device announcement).

### IPv6 Multicast

IPv6 MNDP uses `ff02::1` (all-nodes multicast). Less commonly used than IPv4 broadcast but supported:

```typescript
sock.addMembership("ff02::1");
```

IPv6 link-local addresses include a zone ID (e.g., `fe80::1%en0`) that identifies the receiving interface — useful topology information not available in IPv4.

## Parsing Example (TypeScript)

```typescript
function parseMndpResponse(buf: Buffer): Record<string, string | number | boolean | string[]> {
  let offset = 4; // skip the 4-byte announcement counter (sender's byte order)
  const fields: Record<string, string | number | boolean | string[]> = {};
  const ipv6: string[] = [];

  while (offset + 4 <= buf.length) {
    const tlvType = buf.readUInt16BE(offset);      // big-endian
    const tlvLen  = buf.readUInt16BE(offset + 2);  // big-endian
    offset += 4;

    if (offset + tlvLen > buf.length) break; // malformed / truncated
    const value = buf.subarray(offset, offset + tlvLen);

    switch (tlvType) {
      case 1:  // MAC Address — 6 raw bytes
        fields.macAddress = [...value].map(b => b.toString(16).padStart(2, "0")).join(":");
        break;
      case 5:  fields.identity = value.toString("utf8"); break;
      case 7:  fields.version = value.toString("utf8"); break;
      case 8:  fields.platform = value.toString("utf8"); break;
      case 10: // Uptime — 4 bytes LITTLE-ENDIAN uint32 (on every CPU)
        if (tlvLen === 4) fields.uptime = value.readUInt32LE(0);
        break;
      case 11: fields.softwareId = value.toString("utf8"); break;
      case 12: fields.board = value.toString("utf8"); break;
      case 14: // IPv6 enabled flag (NOT unpack)
        if (tlvLen === 1) fields.ipv6Enabled = value[0] === 1;
        break;
      case 15: // IPv6 — 16 bytes; one TLV per address, so collect them
        if (tlvLen === 16) ipv6.push(formatIpv6(value));
        break;
      case 16: fields.interfaceName = value.toString("utf8"); break;
      case 17: // IPv4 — 4 raw bytes
        if (tlvLen === 4) fields.ipv4 = `${value[0]}.${value[1]}.${value[2]}.${value[3]}`;
        break;
      case 18: // Running (7.20+): 0x01 CAPsMAN, 0x02 CMR controller (bitmask inferred)
        if (tlvLen === 1) fields.running = value[0];
        break;
      case 19: // TTL seconds (7.24+); 0 = dying gasp, remove the neighbor
        if (tlvLen === 1) fields.ttl = value[0];
        break;
      // 2/3/4 (empty unpack flags) and 9 (aggregated-size, LE) omitted for brevity
    }
    offset += tlvLen;
  }
  if (ipv6.length) fields.ipv6 = ipv6;
  return fields;
}
```

## Reference Implementations

| Language | Source | Notes |
|----------|--------|-------|
| C | github.com/haakonnessjoen/MAC-Telnet (`protocol.c`, `protocol.h`) | **Canonical ground truth** for the original TLV enum, `ntohs` big-endian TLVs and `le32toh` uptime; its header and TLV 14 names are outdated |
| C (dissector) | Wireshark `epan/dissectors/packet-mndp.c` | Official protocol dissector — confirms type IDs and `ENC_BIG_ENDIAN` TLVs |
| Go | github.com/middelink/mikrotik-fwupdate | Secondary protocol cross-check |
| Elixir | hex.pm mndp package | Confirms TLV type IDs |
| Swift | Open-source macOS implementations | Confirms raw-byte MAC encoding |

**Verified:** The original TLV type IDs and TLV byte order were cross-checked against
MAC-Telnet's `protocol.c` and the Wireshark dissector — both agree that TLV type/length
are big-endian and uptime (type 10) is little-endian. The header, TLVs 2–4, 9, 14, 18
and 19, the layouts and the lifetime behavior were grounded on live captures.[^m2ir-wire]

## Related Skills

- For IP packing and other MikroTik-specific protocols and files: see [routeros-proprietary-protocols](../routeros-proprietary-protocols/SKILL.md).
- For RouterOS CLI/REST basics: see `routeros-fundamentals` skill
- For the `/console/inspect` command tree: see `routeros-command-tree` skill
- For packet capture and TZSP streaming: see `routeros-sniffer` skill
- For QEMU CHR setup (testing without hardware): see `routeros-qemu-chr` skill

## Related MCP Tools

- For RouterOS docs lookup: use the `rosetta` MCP server tools (`routeros_search`, `routeros_get_page`)

[^packing]: MikroTik [IP Packing](https://manual.mikrotik.com/docs/system-information-and-utilities/ip-packing/): routers announce their unpacking setting through neighbor discovery and pack only toward a neighbor that unpacks; `unpack=none|simple|uncompress-headers|uncompress-all`.
[^m2ir-mndp]: [tikoci/m2ir#3](https://github.com/tikoci/m2ir/issues/3) tracks the remaining unknowns: types 6/13/>19, combined TLV 18 bits, TLV 9 on big-endian CPUs, and the packed-frame format.
[^m2ir-wire]: m2ir MNDP grounding lab, 2026-11-15: CHR labs on 6.49.23, 7.24.6, 7.25 and 7.26beta5 changing one setting per step, plus a field capture of RouterOS 6.49–7.26beta5 on ARM, ARM64 and MIPSBE hardware. Findings and evidence: [`work/2026-11-mndp-grounding/FINDINGS.md`](https://github.com/tikoci/m2ir/blob/main/work/2026-11-mndp-grounding/FINDINGS.md).
[^quickchr-cmr]: quickchr CMR wire study, 7.26beta5: [FINDINGS.md → MNDP](https://github.com/tikoci/quickchr/blob/dd7e0ad99aa51acc79f086fe5d71e65efbb511eb/examples/cmr/FINDINGS.md#mndp).
[^changelog-716]: RouterOS 7.16 changelog: "added discover-interval setting" and "changed default discover-interval setting from 60s to 30s".
[^changelog-718]: RouterOS 7.18 changelog: "advertise IPv6 capabilities based on "Disable IPv6" global setting".
[^changelog-720]: RouterOS 7.20 changelog: "report router as CAPsMAN on MNDP under running parameter".
[^changelog-721]: RouterOS 7.21 changelog: "send out neighbor discovery immediately on IPv4/IPv6 changes".
[^changelog-724]: RouterOS 7.24 changelog: "added "dying-gasp" feature for LLDP, MNDP, CDP that sends packet with "TTL=0" before graceful reboot/shutdown/upgrade" and "clear neighbor entry when receiving "dying-gasp" packet".
