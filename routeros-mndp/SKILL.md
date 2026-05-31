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
| Direction | Bidirectional — same port for send and receive |
| Authentication | None — read-only discovery, no credentials |
| Scope | Layer 2 broadcast domain (does not cross routers) |

## How Discovery Works

1. **Listener sends a refresh packet** — a small UDP datagram to 255.255.255.255:5678 (MAC-Telnet sends a minimal 4-byte zeroed header; a 9-byte form also works — see below)
2. **All RouterOS devices on the LAN reply** — each sends a TLV-encoded announcement with identity, version, board, MAC, IP, uptime, etc.
3. **Replies arrive asynchronously** — devices respond within milliseconds to seconds depending on network conditions
4. **RouterOS devices also announce periodically** (~60s cycle) without being prompted — passive listening works but is slow to populate

### Refresh Packet (Discovery Request)

A short packet that triggers immediate replies from all RouterOS devices on the broadcast
domain. The minimal form is just a zeroed 4-byte header — this is exactly what MAC-Telnet
sends (`unsigned int message = 0;`):

```
Offset  Length  Value       Field
0       1       0x00        header byte 0 (version per MAC-Telnet; "unknown" per Wireshark)
1       1       0x00        header byte 1 (ttl per MAC-Telnet)
2       2       0x0000      seqno / checksum
```

As raw bytes (minimal): `00 00 00 00`

Some implementations append an explicit refresh TLV (type 6, length 0). The complete
header + empty-TLV form is 8 bytes (`00 00 00 00 00 06 00 00`); some implementations add
a trailing zero byte (non-semantic padding), giving 9 bytes. RouterOS accepts all forms:

```
Offset  Length  Value       Field
0       4       00 00 00 00 header (2 header bytes + 2-byte seqno)
4       2       0x0006      TLV type = 6 (refresh)   ← big-endian
6       2       0x0000      TLV length = 0
8       1       0x00        optional trailing pad (non-semantic)
```

As raw bytes (9-byte form): `00 00 00 00 00 06 00 00 00`

### Response Packet

```
Offset  Length  Field
0       2       header bytes (version + ttl per MAC-Telnet; "unknown" per Wireshark)
2       2       sequence number (big-endian; per-device counter)
4+      TLV[]   zero or more TLV records (see below)
```

The first 4 bytes are a fixed header; parsers skip the first 2 bytes and read the
sequence number as a big-endian uint16, then iterate TLVs from offset 4.

## TLV Format

Each TLV (Type-Length-Value) record in the response:

```
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
uint32** — the *only* little-endian value in the entire protocol. Everything else
multi-byte is big-endian/raw.

### TLV Type Reference

| Type | Hex    | Name           | Value Format | Notes |
|------|--------|----------------|-------------|-------|
| 1    | 0x0001 | MAC Address    | 6 raw bytes (network order) | Per-interface MAC, not chassis MAC |
| 5    | 0x0005 | Identity       | UTF-8 string | Hostname — same across all interfaces |
| 7    | 0x0007 | Version        | UTF-8 string | e.g. `7.18 (stable)`, `7.22rc1` |
| 8    | 0x0008 | Platform       | UTF-8 string | Usually `MikroTik` |
| 10   | 0x000a | Uptime         | 4 bytes **LE** uint32 | Seconds since boot — the only little-endian value |
| 11   | 0x000b | Software ID    | UTF-8 string | License identifier |
| 12   | 0x000c | Board          | UTF-8 string | e.g. `RB4011iGS+5HacQ2HnD`, `CHR` |
| 14   | 0x000e | Unpack         | 1 byte | Firmware compression flag (some parsers treat as IPv6-present flag) |
| 15   | 0x000f | IPv6 Address   | 16 raw bytes | Link-local or global IPv6 |
| 16   | 0x0010 | Interface Name | UTF-8 string | Sending interface on the router (e.g. `ether1`) |
| 17   | 0x0011 | IPv4 Address   | 4 raw bytes (network order) | IP of the sending interface |

**Source of truth:** these type IDs match the canonical MAC-Telnet `protocol.c`
(`MT_MNDPTYPE_*` enum) and the Wireshark MNDP dissector value table exactly. Note in
particular that **uptime is type 10, software-id is type 11, and board is type 12** —
a common mistake is to off-by-one these (uptime=11/board=13), which silently misparses
real RouterOS packets.

**Packing TLVs (types 2, 3, 9):** related to `/ip` packing/compression. Safe to skip.

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
function parseMndpResponse(buf: Buffer): Record<string, string | number> {
  let offset = 4; // skip 2-byte header (version, ttl) + 2-byte sequence
  const fields: Record<string, string | number> = {};

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
      case 10: // Uptime — 4 bytes LITTLE-ENDIAN uint32 (the only LE value)
        if (tlvLen === 4) fields.uptime = value.readUInt32LE(0);
        break;
      case 11: fields.softwareId = value.toString("utf8"); break;
      case 12: fields.board = value.toString("utf8"); break;
      case 15: // IPv6 — 16 bytes
        if (tlvLen === 16) fields.ipv6 = formatIpv6(value);
        break;
      case 16: fields.interfaceName = value.toString("utf8"); break;
      case 17: // IPv4 — 4 raw bytes
        if (tlvLen === 4) fields.ipv4 = `${value[0]}.${value[1]}.${value[2]}.${value[3]}`;
        break;
    }
    offset += tlvLen;
  }
  return fields;
}
```

## Reference Implementations

| Language | Source | Notes |
|----------|--------|-------|
| C | github.com/haakonnessjoen/MAC-Telnet (`protocol.c`, `protocol.h`) | **Canonical ground truth.** TLV enum + `ntohs` big-endian TLVs + `le32toh` uptime |
| C (dissector) | Wireshark `epan/dissectors/packet-mndp.c` | Official protocol dissector — confirms type IDs and `ENC_BIG_ENDIAN` TLVs |
| Go | github.com/middelink/mikrotik-fwupdate | Secondary protocol cross-check |
| Elixir | hex.pm mndp package | Confirms TLV type IDs |
| Swift | Open-source macOS implementations | Confirms raw-byte MAC encoding |

**Verified:** The TLV type IDs and byte order in this skill were cross-checked against
MAC-Telnet's `protocol.c` and the Wireshark dissector — both agree that TLV type/length
are big-endian and that uptime (type 10) is the sole little-endian value.

## Related Skills

- For RouterOS CLI/REST basics: see `routeros-fundamentals` skill
- For the `/console/inspect` command tree: see `routeros-command-tree` skill
- For packet capture and TZSP streaming: see `routeros-sniffer` skill
- For QEMU CHR setup (testing without hardware): see `routeros-qemu-chr` skill

## Related MCP Tools

- For RouterOS docs lookup: use the `rosetta` MCP server tools (`routeros_search`, `routeros_get_page`)
