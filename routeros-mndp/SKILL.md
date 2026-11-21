---
name: routeros-mndp
description: "MNDP (MikroTik Neighbor Discovery Protocol) wire format, behavior, and RouterOS /ip/neighbor integration. Use when: implementing MNDP discovery, parsing MNDP packets, working with /ip/neighbor, understanding WinBox device discovery, debugging why a router doesn't appear in neighbor lists, or when the user mentions MNDP, neighbor discovery, WinBox discovery, or /ip/neighbor."
---

# MNDP — MikroTik Neighbor Discovery Protocol

MNDP is the UDP broadcast/multicast protocol that RouterOS uses for automatic device
discovery on the local network. It is the same protocol WinBox uses to find routers.
RouterOS generally ships with MNDP broadly enabled; exactly which interfaces take part
varies by device, version and default configuration.

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
| Copies | Every announcement goes out as an IPv4 broadcast. Most also go out as an IPv6 multicast with the same payload and counter, but not all. These were IPv4 only: 12 of 13 boot announcements on 6.49.23–7.26beta5, 0 to 2 announcements after a 7.x boot with IPv6 enabled, and every one while `disable-ipv6=yes`. On 7.x an announcement with TLV 15 always had the IPv6 copy, but not the reverse: one IPv6 copy without TLV 15 was captured just after IPv6 was re-enabled. 6.49 sends the IPv6 copy only with the `ipv6` package enabled, and never TLV 15[^m2ir-wire] |
| Direction | Bidirectional — same port for send and receive |
| Authentication | None — read-only discovery, no credentials |
| Scope | Layer 2 broadcast domain (does not cross routers) |

## How Discovery Works

1. **Listener sends a request** — a small UDP datagram to 255.255.255.255:5678; `00 00 00 00 00 06 00 00` is the form to use (see below). The 9-byte forms in circulation get **no** reply
2. **Every RouterOS device announcing on the segment replies** to a broadcast request with an ordinary announcement. A reply is an announcement, so a router sends none on an interface that doesn't participate in discovery, or while `mode=rx-only` (see [Multi-Interface Behavior](#multi-interface-behavior)) (identity, version, board, MAC, IP, uptime, etc.). A unicast request draws a reply only from the router it is addressed to. Either way the reply is **broadcast** from port 5678 to 255.255.255.255:5678 (and usually `ff02::1`), so a listener must bind port 5678
3. **Replies arrive after a random delay** — 21 ms to 1.96 s on the tested 7.x routers and 11 ms to 1.87 s on 6.49.23 (an observed range, not a measured bound); 7.x routers answer a burst of requests once[^m2ir-wire]
4. **RouterOS devices also announce periodically** every `discover-interval` (a setting since 7.16, default 30 s; a fixed 60 s before[^changelog-716]) — passive listening works but is slow to populate
5. **Some config changes announce at once** (observed on 7.26beta5) — identity, CAPsMAN, CMR, `/ip/packing` on that interface, IPv6 on/off, discovery `protocol`/`discover-interval`/`lldp-med`, `mode` returning to a transmitting value, and address changes (7.21+[^changelog-721]). Service toggles (MAC server, RoMON, IP services) wait for the next interval[^m2ir-wire]

### Request Packet (Discovery Request)

A request asks every router on the segment to announce now. RouterOS treats a payload
as a request when its 4-byte header is `00 00 00 00` **or** it carries TLV 6 (empty).
A payload whose TLVs do not end exactly at the end of the datagram is dropped whole: no
reply and no neighbor row. These held on 6.49.23, 7.17.2, 7.18.2, 7.20.8 and 7.26beta5
in every round:[^m2ir-wire]

| Payload (hex) | Bytes | Replies | Requester listed in 7.x `/ip/neighbor` |
|---------------|-------|---------|----------------------------------------|
| `00 00 00 00 00 06 00 00` (header 0 + empty TLV 6) | 8 | yes | **no** |
| `00 00 00 00` (MAC-Telnet's `unsigned int message = 0;`) | 4 | yes | yes, empty identity, the host's IPv4 |
| `00 00 00 00 00 06 00 00 00` (TLV 6 + trailing pad) | 9 | **no** | no |
| `00` × 9 | 9 | **no** | no |
| `01 00 00 00` (non-zero header, no TLV 6) | 4 | no | yes |

Use the 8-byte form: every router answers, and the scanner doesn't add itself to
the neighbor tables. On 7.x receivers, any well-formed payload without TLV 6, request
or not, creates or refreshes a neighbor row for its sender (6.49 was not checked). Requests over IPv6 to `ff02::1` also drew replies from every router with
IPv6. WinBox's own request bytes were not captured.

```text
Offset  Length  Value       Field
0       4       00 00 00 00 header
4       2       0x0006      TLV type = 6 (request)   ← big-endian
6       2       0x0000      TLV length = 0 (nothing follows)
```

### Response Packet

```text
Offset  Length  Field
0       4       announcement counter (uint32, SENDER's native byte order)
4+      TLV[]   zero or more TLV records (see below)
```

The header is one 32-bit counter of announcements sent on that interface (periodic,
triggered, and replies to requests). It restarts at 0 on boot, so the first announcement
after a reboot has header `00 00 00 00` and doubles as a request: its neighbors answer
it. The IPv4 and IPv6 copies of one announcement carry the same value. Its byte order is the **sender's CPU byte
order**: little-endian on x86, ARM and ARM64, big-endian on MIPSBE boards.[^m2ir-wire]
Older readings (MAC-Telnet's version + TTL bytes plus a big-endian sequence number
at bytes 2–3) describe the same 4 bytes seen on a long-running big-endian router.

Parsers should skip the 4 header bytes and iterate TLVs from offset 4. Treat the
counter as 4 opaque bytes. Compare them raw to deduplicate the IPv4 and IPv6 copies,
and read `00 00 00 00` as a boot announcement. A receiver can't reliably tell the
sender's byte order from the packet. It doesn't know the sender's `discover-interval`:
TLV 19 reveals it only on 7.24+, and it caps at 255. Replies to requests and triggered
announcements also inflate the count. A 6.49.23 lab router had counter 38 at 673 s of
uptime, where its 60 s interval predicts about 11. m2ir used uptime ÷ counter only to
confirm the byte order of field devices whose CPU was already known, not as a decoding
rule.[^m2ir-wire] If you need the number, map the byte order from the board (TLV 12) to
its CPU, and treat anything else as a guess.

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
| 1    | 0x0001 | MAC Address    | 6 raw bytes (network order) | Per-interface MAC, not chassis MAC. RouterOS's own neighbor row uses the frame's Ethernet source instead (see below) |
| 2    | 0x0002 | Unpack: simple | empty (flag) | Neighbor unpacks aggregated packets; with 3 and 4, builds `unpack=`[^m2ir-wire][^packing] |
| 3    | 0x0003 | Unpack: headers | empty (flag) | Also decompresses headers (`unpack=uncompress-headers`) |
| 4    | 0x0004 | Unpack: all    | empty (flag) | Also decompresses payload (`unpack=uncompress-all`) |
| 5    | 0x0005 | Identity       | UTF-8 string | Hostname — same across all interfaces |
| 6    | 0x0006 | Request        | empty (flag) | Only in requests: "announce now". Never in an announcement |
| 7    | 0x0007 | Version        | UTF-8 string | Format varies by version — see below |
| 8    | 0x0008 | Platform       | UTF-8 string | `MikroTik`, or the branding package's name |
| 9    | 0x0009 | Aggregated size | 4 bytes **LE** uint32 (x86) | `/ip/packing` `aggregated-size`; sent only with TLV 2 |
| 10   | 0x000a | Uptime         | 4 bytes **LE** uint32 | Seconds since boot; LE on every CPU |
| 11   | 0x000b | Software ID    | UTF-8 string | License identifier |
| 12   | 0x000c | Board          | UTF-8 string | e.g. `RB4011iGS+5HacQ2HnD`, `CHR` |
| 14   | 0x000e | IPv6 enabled   | 1 byte | `01` enabled, `00` disabled, but what it tracks varies by version (below); shown as `ipv6=` in `/ip/neighbor`. **Not** "unpack"[^m2ir-wire][^changelog-718] |
| 15   | 0x000f | IPv6 Address   | 16 raw bytes | **Repeats** once per address: global first, then link-local |
| 16   | 0x0010 | Interface Name | UTF-8 string | Sending interface; `bridge/port` (e.g. `bridge/ether1`) for a bridge port |
| 17   | 0x0011 | IPv4 Address   | 4 raw bytes (network order) | IP of the sending interface |
| 18   | 0x0012 | Running        | 1 byte | 7.20+ bitmask: `01` CAPsMAN, `02` CMR controller, `03` both, `00` none. Receivers print `running=capsman`, `cmr` or `capsman,cmr` and omit the field for `00`[^m2ir-wire][^changelog-720][^quickchr-cmr] |
| 19   | 0x0013 | TTL            | 1 byte | 7.24+ (not in 7.24beta1): entry lifetime in seconds, `min(discover-interval × 4 + 1, 255)`, an approximate lifetime; `00` = dying gasp[^changelog-724] |

**Source of truth:** types 1, 5, 7, 8, 10–12 and 15–17 match the canonical MAC-Telnet
`protocol.c` (`MT_MNDPTYPE_*` enum) and the Wireshark MNDP dissector value table. Note in
particular that **uptime is type 10, software-id is type 11, and board is type 12** —
a common mistake is to off-by-one these (uptime=11/board=13), which silently misparses
real RouterOS packets. Types 2–4, 6, 9, 18 and 19, and the meaning of 14, come from live
captures across RouterOS 6.49–7.26beta5, one setting changed at a time.[^m2ir-wire] Both
MAC-Telnet and Wireshark label type 14 "unpack"; that label is wrong.

**TLV 14 by version.** Before 7.18 the flag meant "IPv6 present". Since 7.18 it
follows `/ipv6/settings disable-ipv6`, but on 7.18.2 and 7.20.8 only after a
reboot:[^m2ir-wire][^changelog-718][^changelog-721]

| Sender | `disable-ipv6=yes` | Then reboot | `disable-ipv6=no` |
|--------|--------------------|-------------|-------------------|
| 6.49.23 | — (flag follows the `ipv6` package: `00` disabled, `01` enabled) | — | — |
| 7.17.2 | stays `01` | stays `01` | `01` |
| 7.18.2, 7.20.8 | stays `01` | `00` | `01` at once |
| 7.26beta5 | `00` at once | `00` | `01` at once |

7.21's "fixed MNDP IPv6 status reporting" is the likely boundary for live updates;
7.21–7.25 were not tested. So `ipv6=true` from a 7.17–7.20 sender does not prove IPv6
is on. On the four tested 7.x releases, `disable-ipv6=yes` dropped the TLV 15 addresses
at once, so their absence is the better signal on 7.x, though not proof on its own: 6.49
never sends TLV 15, and 7.x usually omits it for the first announcements after boot.

**Unknown values:** type 13 and anything above 19 were never seen. Other TLV 18 bits
(services beyond CAPsMAN and CMR), TLV 9 on big-endian CPUs, and packing TLVs on 6.x
and 7.x before 7.24 are untested.
Skip unknown types by length, preserve their bytes when logging, and report
observations to m2ir.[^m2ir-mndp]

### Layout and Version Differences

TLV order changes between versions, so **never parse by position**:

| Versions (observed) | TLV order |
|---------------------|-----------|
| 6.49, 7.6–7.19 | 1, 5, 7, 8, 10, 11, 12, 14, [15], 16, 17 |
| 7.20–7.23 | 1, 5, 7, 8, 10, 11, 12, 14, [15], 16, 17, 18 |
| 7.24beta1 | 1, 5, 7, 8, 10, 11, 12, 14, 16, 18, 17 |
| 7.24.5–7.26beta5 | 1, [2, 3, 4, 9], 5, 7, 8, 10, 11, 12, 14, 16, 18, 19, 17, 15… |

TLVs 15 and 17 are absent when the interface has no such address, including right
after boot. The packing TLVs' positions and meaning were tested only on x86 CHR 7.26beta5. TLV 7 text also changes format:

| Versions | Example |
|----------|---------|
| 6.x | `6.49.21 (long-term)` |
| 7.6–7.13 | `7.12.1 (stable) Nov/17/2023 11:38:45` |
| 7.14–7.24 | `7.24.6 (long-term) 2026-10-30 08:24:29` |
| 7.25 and later (7.25beta5 seen) | `7.25.1 2026-11-02 12:39:53` (no channel) |

The 7.13/7.14 boundary comes from a neighbor table, not a capture. Take the version as the first space-separated token; don't require a channel.

### Entry Lifetime and Dying Gasp (7.24+)

TLV 19 is an approximate lifetime, not an exact expiry. In a 7.26beta5 lab with
only MNDP enabled, the receiver's `/ip/neighbor` dropped a silent TTL-121 neighbor
2–17 s after the TTL. A TTL-21 neighbor went at age 18–22 s in one run; in others it
was still listed 8–15 s past the TTL and gone within about 20 s.[^m2ir-wire] A listener that caches
neighbors can expire them at the TTL, unless that router's `discover-interval` was just
shortened (see below); RouterOS's own table may keep them a little longer. For senders without TLV 19 (before 7.24), fall back to a few times the
interval (60 s before 7.16, 30 s default after).

Shortening `discover-interval` sends one triggered announcement, but the next periodic
one may still wait for the old interval. After 2 h → 10 s, none of five routers
(7.17.2–7.26beta5) sent a periodic announcement in the next 40 s; 9 h → 5 s showed the
same.[^m2ir-wire] The cause (the pending timer not being rescheduled) is inferred. Until
then a receiver can go past the new, shorter TTL without hearing from that router.

With `dying-gasp=yes` (seen off on a fresh 7.26beta5 CHR; check `/ip/neighbor/discovery-settings`
on the actual router before relying on it), a router going through a graceful
reboot, shutdown or upgrade sends a short announcement: the header (the counter
continues), then TLVs 1, 19 = `00`, 17 and 15.[^m2ir-wire][^changelog-724] It has no
identity (TLV 5) or interface name (TLV 16), so match it to the cached entry by MAC
(TLV 1). Treat TTL 0 as "remove this neighbor now".

## Multi-Interface Behavior

A RouterOS device sends **one MNDP announcement per participating interface** (with `mode` not `rx-only`). An interface participates if it is in `discover-interface-list`, or if its bridge or bonding master is: discovery runs on the individual ports, so listing a master enrolls all of them.[^nd-manual] Each announcement has:

- A **different MAC address** (the interface's own MAC)
- A **different interface name** (TLV 16)
- A **different IP address** (if assigned)
- The **same identity** (hostname)

This is expected behavior, not a bug. When displaying results, **group by identity** to avoid showing the same router N times. Use MAC address to disambiguate when the identity is the factory default (`MikroTik`).

RouterOS's own `/ip/neighbor` keys a row on the frame's Ethernet source MAC, not TLV 1,
and takes `address4` from TLV 17, or from the IP source address when TLV 17 is missing
(seen on 7.17.2 and 7.26beta5 with a spoofed packet).[^m2ir-wire] A UDP listener can't
see the Ethernet source, so TLV 1 is the best it has; on real routers the two match. The
IP source rarely stands in for a missing TLV 17: on 7.26beta5, 7.20.8 and 6.49.23, every
captured IPv4 announcement without TLV 17 came from `0.0.0.0`, at 2–47 s of
uptime.[^m2ir-wire] Leave `address4` unset in that case rather than recording
`0.0.0.0`. The likely cause, not yet tested, is an interface with no IPv4 address yet.
Whether a real router ever sends a usable IPv4 source without TLV 17 is still unknown
(evidence in [#61](https://github.com/tikoci/routeros-skills/issues/61)).

## Timing and Reliability

On a local lab segment, routers replied to a request after a random 11 ms–1.96 s
(see [How Discovery Works](#how-discovery-works)). No maximum was measured, and slower
links (WiFi, tunnels, overlays) add their own latency, so size the listen window
generously.

**Best practice:** Send several requests during the listen window, a few seconds apart, and keep listening well past 2 s after the last one. Requests close together (50–200 ms) drew one reply per 7.x router, so spacing them out is what helps. Devices that miss the first broadcast due to packet loss, WiFi power-save, or tunnel relay latency will respond to later requests.

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

# Announce every 10 s (7.16+, minimum 5s) and send a dying gasp on reboot (7.24+);
# dying gasp only goes out on interfaces that already participate in discovery
/ip/neighbor/discovery-settings/set discover-interval=10s dying-gasp=yes

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
- Which interfaces participate is whatever `discover-interface-list` names, plus the ports of any bridge or bond it names. Values seen include `static` (a 7.26beta5 CHR) and `LAN` (defconf on SOHO devices), and older versions may have used `all`. It varies by device, version and default configuration, so read it on the actual router rather than assuming, then restrict
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

When you send a broadcast to 255.255.255.255:5678, the OS delivers a copy back to your own socket. Filter out packets from your own IP addresses to avoid processing your own request as a neighbor response. The looped-back packet carries no announcement TLVs (only your request's header and TLV 6).

### IPv6 Multicast

IPv6 MNDP uses `ff02::1` (all-nodes multicast). Most announcements also go there, as
well as to the IPv4 broadcast, so a listener on both sockets gets them twice:
deduplicate on MAC (TLV 1) plus the header counter. Don't rely on the IPv6 copy alone.
On 7.17–7.26beta5 it was missing for 0 to 2 announcements after boot, for every
announcement while `disable-ipv6=yes`, and sometimes for the first one after IPv6 was
re-enabled.[^m2ir-wire]

IPv6 multicast needs its own `udp6` socket; `addMembership` on the `udp4` socket above
fails. Name the interface to join on a specific link:

```typescript
const sock6 = createSocket({ type: "udp6", reuseAddr: true, reusePort: true });
sock6.bind(5678, "::", () => {
  sock6.addMembership("ff02::1", "::%eth0"); // omit the 2nd arg to let the OS pick
});
```

IPv6 link-local addresses include a zone ID (e.g., `fe80::1%en0`) that identifies the receiving interface — useful topology information not available in IPv4.

## Parsing Example (TypeScript)

```typescript
function formatIpv6(b: Buffer): string {
  const groups: string[] = [];
  for (let i = 0; i < 16; i += 2) groups.push(b.readUInt16BE(i).toString(16));
  return groups.join(":"); // uncompressed; e.g. fe80:0:0:0:7e:d1ff:fe2a:671c
}

// Returns null for a malformed datagram: RouterOS drops a payload whose TLVs
// don't end exactly at the end of the datagram, so a parser should too.
function parseMndpResponse(buf: Buffer): Record<string, string | number | boolean | string[]> | null {
  if (buf.length < 4) return null;
  let offset = 4; // skip the 4-byte announcement counter (sender's byte order)
  const fields: Record<string, string | number | boolean | string[]> = {};
  const ipv6: string[] = [];

  while (offset + 4 <= buf.length) {
    const tlvType = buf.readUInt16BE(offset);      // big-endian
    const tlvLen  = buf.readUInt16BE(offset + 2);  // big-endian
    offset += 4;

    if (offset + tlvLen > buf.length) return null; // truncated TLV
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
      case 18: // Running (7.20+), bitmask: 0x01 CAPsMAN, 0x02 CMR controller
        if (tlvLen === 1) fields.running = value[0];
        break;
      case 19: // TTL seconds (7.24+); 0 = dying gasp, remove the neighbor
        if (tlvLen === 1) fields.ttl = value[0];
        break;
      // 2/3/4 (empty unpack flags) and 9 (aggregated-size, LE) omitted for brevity
    }
    offset += tlvLen;
  }
  if (offset !== buf.length) return null; // trailing bytes that aren't a whole TLV
  if (ipv6.length) fields.ipv6 = ipv6;
  return fields;
}
```

## Reference Implementations

| Language | Source | Notes |
|----------|--------|-------|
| C | github.com/haakonnessjoen/MAC-Telnet (`protocol.c`, `protocol.h`) | **Canonical ground truth** for the original TLV enum, `ntohs` big-endian TLVs and `le32toh` uptime; its header and TLV 14 names are outdated |
| C (dissector) | Wireshark `epan/dissectors/packet-mndp.c` | Official protocol dissector — confirms type IDs and `ENC_BIG_ENDIAN` TLVs; also labels TLV 14 "unpack" |
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

[^nd-manual]: MikroTik [Neighbor Discovery](https://manual.mikrotik.com/docs/system-information-and-utilities/neighbor-discovery/#choose-which-interfaces-participate): "When a master interface (e.g. bonding or bridge) is included in the discovery interface list, all its slave interfaces will automatically participate in neighbor discovery."
[^packing]: MikroTik [IP Packing](https://manual.mikrotik.com/docs/system-information-and-utilities/ip-packing/): routers announce their unpacking setting through neighbor discovery and pack only toward a neighbor that unpacks; `unpack=none|simple|uncompress-headers|uncompress-all`.
[^m2ir-mndp]: [tikoci/m2ir#3](https://github.com/tikoci/m2ir/issues/3) tracks the remaining unknowns: type 13 and >19, other TLV 18 bits, TLV 9 on big-endian CPUs, TLV 14 on 7.21–7.25, WinBox's request bytes, and the packed-frame format.
[^m2ir-wire]: m2ir MNDP grounding labs, 2026-11-15/16: CHR labs on 6.49.23, 7.24.6, 7.25 and 7.26beta5 changing one setting per step; a hub lab (6.49.23, 7.17.2, 7.18.2, 7.20.8 and two 7.26beta5 on one segment with the host as a station) for requests, TLV 14 and TLV 18; and a field capture of RouterOS 6.49–7.26beta5 on ARM, ARM64 and MIPSBE hardware. Canonical YAML: [`physical/mndp.yaml`](https://github.com/tikoci/m2ir/blob/2e57a9c3b075bad2e564a05450cb671a8fdc4207/physical/mndp.yaml) (datagram grammar) and [`profiles/mndp/profile.yaml`](https://github.com/tikoci/m2ir/blob/2e57a9c3b075bad2e564a05450cb671a8fdc4207/profiles/mndp/profile.yaml) (TLVs 1–19 with version scope and confidence, requests, layouts, timing). Findings and evidence: [`work/2026-11-mndp-grounding/FINDINGS.md`](https://github.com/tikoci/m2ir/blob/2e57a9c3b075bad2e564a05450cb671a8fdc4207/work/2026-11-mndp-grounding/FINDINGS.md).
[^quickchr-cmr]: quickchr CMR wire study, 7.26beta5: [FINDINGS.md → MNDP](https://github.com/tikoci/quickchr/blob/dd7e0ad99aa51acc79f086fe5d71e65efbb511eb/examples/cmr/FINDINGS.md#mndp).
[^changelog-716]: RouterOS [7.16 changelog](https://download.mikrotik.com/routeros/7.16/CHANGELOG): "added discover-interval setting" and "changed default discover-interval setting from 60s to 30s".
[^changelog-718]: RouterOS [7.18 changelog](https://download.mikrotik.com/routeros/7.18/CHANGELOG): "advertise IPv6 capabilities based on "Disable IPv6" global setting".
[^changelog-720]: RouterOS [7.20 changelog](https://download.mikrotik.com/routeros/7.20/CHANGELOG): "report router as "CAPsMAN" on MNDP under "running" parameter".
[^changelog-721]: RouterOS [7.21 changelog](https://download.mikrotik.com/routeros/7.21/CHANGELOG): "send out neighbor discovery immediately on IPv4/IPv6 changes" and "fixed MNDP IPv6 status reporting".
[^changelog-724]: RouterOS [7.24 changelog](https://download.mikrotik.com/routeros/7.24/CHANGELOG): "added "dying-gasp" feature for LLDP, MNDP, CDP that sends packet with "TTL=0" before graceful reboot/shutdown/upgrade" and "clear neighbor entry when receiving "dying-gasp" packet".
