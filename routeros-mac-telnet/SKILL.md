---
name: routeros-mac-telnet
description: "MAC-Telnet protocol (MikroTik Layer-2 terminal/exec over UDP 20561) wire format, session handshake, and MD5 + MTWEI (EC-SRP) authentication. Use when: implementing or debugging a MAC-Telnet client/server, reaching a RouterOS device by MAC address without IP, parsing MAC-Telnet packets, understanding the WinBox-style L2 terminal, deciding between classic MD5 and modern MTWEI auth, or when the user mentions MAC-Telnet, mactelnet, mactelnetd, port 20561, or MTWEI/EC-SRP RouterOS login."
---

# MAC-Telnet — MikroTik Layer-2 Terminal Protocol

MAC-Telnet lets you open an interactive RouterOS terminal (or run commands)
addressing a device by its **MAC address** — you do not need to know or route to
the target's IP. It works across a Layer-2 broadcast domain even when the target
has no IP, a wrong IP, or an IP you cannot route to, which is why WISPs and
provisioning tools rely on it. WinBox's "MAC Telnet" and the `tools/mac-telnet`
CLI use this protocol family.

## Why This Matters for Agents

- It is the only way to get a shell on a freshly-unboxed or misconfigured
  RouterOS device that has no reachable IP.
- The protocol carries its **own 6+6-byte source/destination MAC addressing
  inside every packet**, independent of the outer UDP/L2 delivery. This trips up
  implementers who assume normal UDP semantics.
- Authentication has **two incompatible modes** — classic **MD5** and modern
  **MTWEI (EC-SRP over Curve25519)**. Current RouterOS 7.x defaults to MTWEI;
  getting the mode-detection wrong is the single most common failure.
- It is simple enough to implement from scratch for the MD5 path; MTWEI needs an
  elliptic-curve library.

## Protocol Basics

| Property | Value |
|----------|-------|
| Transport | UDP |
| Port | **20561** (server listens; client may use an ephemeral or matching source port) |
| Addressing | In-packet 6-byte src + 6-byte dst MAC (the real addressing); outer UDP/IP is just transport |
| Delivery | Layer-2 — broadcast or unicast Ethernet frame to the target MAC; does not cross routers |
| Reliability | Application-level: byte-counter ACKs + timed retransmission (UDP gives none) |
| Session | Stateful handshake → authenticated → raw terminal stream → teardown |
| Auth | MD5 (legacy) **or** MTWEI / EC-SRP (current RouterOS 7.x default) |
| Max packet | 1500 bytes (`MT_PACKET_LEN`) |

MAC-Telnet (UDP 20561) is a **sibling of MNDP** (UDP 5678) from the same
MikroTik L2 toolset: MNDP discovers the device and its MAC; MAC-Telnet then
connects to that MAC. See the `routeros-mndp` skill for discovery. They are
otherwise independent wire formats — MNDP is a one-shot TLV announcement with no
session, auth, control-block magic, or `00 15` client-type.

## Packet Header (22 bytes)

Every SESSIONSTART / DATA / ACK / END session packet starts with a fixed
22-byte header. **The session-key and client-type fields swap position by
direction** — this is the #1 footgun. (PING/PONG belong to the MAC-Ping tool and
use an 18-byte variant; see *Packet Types*.)

Client → server layout:

```
Offset  Len  Field
0       1    version  = 0x01 (always 1)
1       1    packet type (see table below)
2       6    source MAC (the client's in-protocol address)
8       6    destination MAC (the target device)
14      2    session key   (uint16, BIG-endian)      ← client direction
16      2    client type   = 00 15                    ← client direction
18      4    counter       (uint32, BIG-endian)
```

Server → client layout is identical **except** the two middle fields swap:

```
14      2    client type   = 00 15                    ← server direction
16      2    session key   (uint16, BIG-endian)       ← server direction
```

So a parser must know the direction (or which MAC is "ours") to read the session
key from the right offset. Reference: `init_packet()` in MAC-Telnet `protocol.c`
keys both fields on `mt_direction_fromserver`.

- **Version** is always `1`. Reject other values as not-this-protocol.
- **Client type `00 15`** is a fixed constant identifying a MAC-Telnet/WinBox
  client. Treat it as a magic constant; its internal meaning is not
  documented by MikroTik.
- **Counter** is **cumulative payload bytes**, not a packet index — see below.

## Packet Types (`enum mt_ptype`)

| Value | Name | Direction | Purpose |
|-------|------|-----------|---------|
| 0 | SESSIONSTART | client → server | Open a session (header only, no payload) |
| 1 | DATA | both | Carries control blocks and/or terminal bytes; must be ACKed |
| 2 | ACK | both | Acknowledges received bytes (header only; counter = bytes seen) |
| 4 | PING | either | **MAC-Ping** liveness/latency probe — *not* the session keepalive (see below) |
| 5 | PONG | either | Reply to PING, echoing the PING's payload |
| 255 | END | either | Tear down the session |

Note the gap: there is **no type 3**; PING/PONG are 4/5.

**PING/PONG are the separate MAC-Ping tool, not session keepalive.** In the
canonical implementation a PING packet is **18 bytes**, not 22: it is built like
a normal header but bytes 14–17 (the swapped session-key/client-type fields) are
zeroed and the 4-byte counter field at 18–21 is omitted (`init_pingpacket`). The
responder echoes the payload back in a PONG. Do not use PING/PONG to keep a
terminal session alive — that is done with empty ACKs (see *Session Lifecycle*
and *Reliability*).

## The Counter (ACK accounting — footgun)

The 32-bit `counter` is a **running total of payload bytes**, per direction —
not a sequence/packet number.

- SESSIONSTART and the first DATA use counter `0`.
- Each side advances its outbound counter by the number of **payload bytes it
  sent** (control-block bytes *including* their 9-byte headers, plus raw
  terminal bytes).
- An **ACK's counter = the received packet's counter + the length of that
  packet's payload** (i.e. "I have now received this many bytes"). A peer keeps
  retransmitting a DATA packet until it sees an ACK whose counter reaches the
  end of that payload.
- A DATA packet whose counter does **not advance** past what you've already
  processed is a retransmission: still ACK it (so the peer stops resending) but
  do not re-deliver its payload.

Getting this wrong produces a session that authenticates but then hangs on
endless retransmits, or one that double-prints terminal output.

## Control Blocks (the DATA payload format)

A DATA payload is zero or more **control blocks**, optionally followed/mixed with
raw terminal data. Each control block:

```
Offset  Len  Field
0       4    magic  = 56 34 12 FF
4       1    control type (see table)
5       4    length (uint32, BIG-endian) — byte count of value
9       N    value
```

- The 9-byte control header is `MT_CPHEADER_LEN`. The magic is
  `56 34 12 ff` (`mt_mactelnet_cpmagic`).
- **Length is big-endian** (`htonl` in the reference, even though it carries a
  16-bit value).
- **PLAINDATA**: any bytes in the payload that do **not** begin with the 4-byte
  magic are raw terminal data with no header. A parser reads blocks until the
  next 4 bytes aren't the magic, then treats the remainder as one PLAINDATA run.
  This is how keystrokes (client→server) and screen output (server→client) ride
  inside DATA packets. PLAINDATA is `cptype -1` internally — never on the wire.
  Note there is **no escaping**: terminal bytes that happen to begin with
  `56 34 12 ff` at a parse boundary would be misread as a control block. This is
  vanishingly rare for text terminals but matters for robust codec tests — the
  reference parser distinguishes PLAINDATA only by the *absence* of the magic at
  the current offset.

### Control Types (`enum mt_cptype`)

| Value | Name | Direction | Value payload |
|-------|------|-----------|---------------|
| 0 | BEGINAUTH | client → server | empty (length 0) — starts auth |
| 1 | PASSSALT | **both (overloaded)** | server→client: salt (MD5) or pubkey+salt (MTWEI). client→server (MTWEI only): `username\0` + client pubkey |
| 2 | PASSWORD | client → server | MD5: 17 bytes. MTWEI: 32-byte EC-SRP proof |
| 3 | USERNAME | client → server | login name (byte string; commonly ASCII/UTF-8, no encoding is specified) |
| 4 | TERM_TYPE | client → server | `$TERM` (byte string, e.g. `vt102`, `xterm`) |
| 5 | TERM_WIDTH | client → server | uint16 **little-endian** columns |
| 6 | TERM_HEIGHT | client → server | uint16 **little-endian** rows |
| 7 | PACKET_ERROR | server → client | error string (byte string; auth failure, etc.) |
| 9 | END_AUTH | server → client | empty — auth done, terminal mode begins |

Note the gap: there is **no control type 8**; END_AUTH is 9.

**Endianness trap:** the control-block *length* is big-endian, but the terminal
*width/height values* are little-endian uint16. Everything else multi-byte in
the header (session key, counter) is big-endian.

## Session Lifecycle

A successful client session, in order:

```
1. client → SESSIONSTART                     (counter 0, header only)
2. server → ACK
3. client → DATA: BEGINAUTH [+ MTWEI login block]   (see auth below)
4. server → DATA: PASSSALT  (16 bytes → MD5 mode; 49 bytes → MTWEI mode)
   client → ACK (always ACK inbound DATA)
5. client → DATA: PASSWORD + USERNAME + TERM_TYPE + TERM_WIDTH + TERM_HEIGHT
6. server → DATA: END_AUTH                    → terminal mode
7. ── interactive: server PLAINDATA (screen) / client PLAINDATA (keystrokes),
      each DATA ACKed; empty-ACK keepalive on idle (see below) ──
8. either → END                               → both close
```

Every inbound DATA is answered with an ACK (step counter = received counter +
payload length). **Keepalive** is an **empty ACK** sent on idle: the reference
client sends one after ~10 seconds of inactivity, and the server drops a session
after ~15 seconds without traffic (`MT_CONNECTION_TIMEOUT`). END should be
echoed/acknowledged, then the socket closed. (PING/PONG, despite the name, are
the MAC-Ping tool — not part of this keepalive.)

## Authentication

The server announces the mode by the **length of the PASSSALT it sends**:

| Server PASSSALT length | Mode | Meaning of bytes |
|------------------------|------|------------------|
| **16** | MD5 (legacy) | 16-byte random salt |
| **49** | MTWEI / EC-SRP | 33-byte server public key ‖ 16-byte salt |

Any other length is invalid — abort. This single check is the correct, robust
way to detect the mode (do not rely on RouterOS version strings).

### Classic MD5

Simple and library-free:

```
PASSWORD value = 0x00 ‖ MD5( 0x00 ‖ password ‖ salt )      // 17 bytes total
```

- Leading `0x00`, then the 16-byte MD5 digest of (`0x00` + password bytes +
  16-byte salt). The client sends only `BEGINAUTH` in step 3 and waits for the
  server's 16-byte salt.
- Modern RouterOS no longer accepts MD5 in practice. Verified on stock CHR 7.23:
  the device offers a **16-byte salt to a classic client** (one that sends only
  `BEGINAUTH`, with no MTWEI offer) but then **rejects the MD5 proof even for
  credentials it accepts over REST/native-API** ("login failure … via
  mac-telnet" in the device log). So a 16-byte salt does **not** mean MD5 will be
  honored — you must drive MTWEI to log in. MD5 stays useful only for genuinely
  legacy/downgraded gear.

### MTWEI (EC-SRP over Curve25519) — current default

A zero-knowledge password proof: the password never crosses the wire and the
exchange proves the client knows it without revealing it. It requires an
elliptic-curve implementation. (Note: MTWEI authenticates the login but does
**not** encrypt the subsequent terminal stream — MAC-Telnet has no transport
cipher. Treat it as management-plane traffic on a trusted L2 segment.)

Wire-level flow (what differs from MD5):

1. Client generates a keypair → **33-byte client public key**. This is **not**
   the standard 32-byte X25519 wire format: MTWEI runs EC-SRP on a custom
   Curve25519-in-Weierstrass form and serializes the public point as a 32-byte
   big-endian X coordinate plus a 1-byte Y-parity flag (literal `0`/`1`, not a
   SEC1 `0x02`/`0x03` compressed-point tag). Use the reference MTWEI math, not
   an off-the-shelf X25519 API.
2. In step 3 the client sends, alongside `BEGINAUTH`, a **PASSSALT (type 1)
   block carrying `username` + `0x00` + the 33-byte client public key**. (Yes —
   control type 1 is overloaded: server→client it is the salt; client→server in
   MTWEI it is the login+pubkey.)
3. Server replies with a 49-byte PASSSALT = **33-byte server public key ‖
   16-byte salt**.
4. Client derives the SRP identity in **two SHA-256 stages**:
   `v1 = SHA256(username ‖ ":" ‖ password)`, then
   `id = SHA256(salt ‖ v1)` (16-byte salt). It runs the EC-SRP exchange over
   both public keys using `id` to produce a **32-byte PASSWORD proof**, sent with
   USERNAME + terminal blocks as in MD5.
5. Server verifies; on success sends END_AUTH.

Username caveat: the C reference strips any `+...` console-parameter suffix from
the login name **only for the MTWEI identity hash** (`strsep(..., "+")` before
`mtwei_id()`), while still sending the original login string in the USERNAME
control block. Implement this if you support RouterOS console parameters in the
login field.

The cryptographic core (point arithmetic, Weierstrass↔Montgomery conversion,
proof derivation) is non-trivial — implement against a reference rather than
from this summary:

- C: `mtwei.c` / `mtwei.h` in `haakonnessjoen/MAC-Telnet` (OpenSSL EC;
  EC-SRP per the IEEE P1363.2 draft, derived from Margin Research's PoC).
- .NET: `EcsrpEngine.cs` / `EcsrpMath.cs` in `KCTech-Lab/KC.MacTelnet`.
- m2ir: `profiles/winbox-ipc/ec-srp5-handshake.yaml` captures the related
  WinBox EC-SRP5 point encoding and is useful corroboration for the 32-byte-X +
  parity shape. Do **not** copy WinBox's later AES-128-CBC transport encryption
  into MAC-Telnet; MAC-Telnet's terminal stream is not encrypted.

Constants worth pinning in tests: client/server public key = **33 bytes**
(`MTWEI_PUBKEY_LEN`), validator/proof = **32 bytes** (`MTWEI_VALIDATOR_LEN`).

### Auth-mode pragmatics

To log into current RouterOS you must implement **MTWEI** — an MD5-only client
gets a 16-byte salt but its proof is refused (see *Classic MD5* above). A robust
client offers MTWEI in `BEGINAUTH` by default and falls back to MD5 only when the
device returns a 16-byte salt (legacy gear). `tikoci/centrs` does this — it
implements **both** MD5 and MTWEI (`src/protocols/mtwei.ts`, a dependency-free
BigInt port of `mtwei.c`) and is validated over real L2 against stock CHR 7.23.

**`END_AUTH` does not mean the login succeeded.** A *failed* login also sends
`END_AUTH`, immediately followed by a `PLAINDATA` "Login failed, incorrect
username or password" message and `END`. Confirm success only when real terminal
output (a prompt/banner) arrives; treat `END_AUTH` → "Login failed" → `END` (or
an `END` right after `END_AUTH` with no prompt) as auth failure. Grounded on CHR
7.23 via `centrs`.

## Reliability & Retransmission

UDP provides nothing, so the protocol layers on:

- **ACK-by-byte-counter** (above) — a sender retransmits an unacknowledged DATA.
- **Timed retransmission** schedule from the reference client, in milliseconds:
  `{15, 20, 30, 50, 90, 170, 330, 660, 1000}` (`retransmit_intervals`), i.e. a
  rough exponential backoff, up to 9 tries before giving up.
- **Empty-ACK keepalive** so idle authenticated sessions are not dropped: the
  client sends an empty ACK after ~10s idle; the server times out a session
  after ~15s of silence. (PING/PONG is the MAC-Ping tool, not this keepalive.)

## Transport & Socket Notes

- **Server**: UDP **20561**. To receive frames addressed to a device that has no
  IP, real clients often send to the **broadcast** address (or a raw Ethernet
  frame to the unicast target MAC) and rely on the in-packet destination MAC to
  let the right device claim the session. The device replies to the client MAC.
- Because addressing is in-band, you generally do **not** need the target's IP —
  only its MAC (discovered via MNDP, ARP, or printed on the label).
- A shared L2 segment means **other devices' MAC-Telnet traffic can hit your
  socket**. Filter rigorously: accept a packet only when version = 1, the
  session key matches, and the in-packet src/dst MACs mirror your own (their src
  = your dst, their dst = your src). Drop everything else.
- **Self-echo**: broadcasting can loop your own packet back; ignore packets whose
  in-packet source MAC is yours.
- **Privilege**: sending raw Ethernet frames (the most robust delivery) needs
  root / `CAP_NET_RAW`. A pure UDP-broadcast approach avoids that but is less
  universal.
- **Testing without a router**: the codec and state machine are pure functions
  of bytes — drive them with a scripted in-memory peer (no L2 fabric needed), as
  `centrs`' unit tests do. Full end-to-end testing needs a real L2 segment
  (CHR-on-a-bridge or hardware), since broadcast/raw-frame delivery is the part a
  CI runner usually can't provide.

## Security Considerations

- **MD5 auth is weak** — salted MD5 of the password, no forward secrecy, and the
  17-byte proof is replayable within a salt. Prefer MTWEI; disable legacy MD5
  login on RouterOS unless required for old gear.
- **MTWEI** does not transmit the password, but MAC-Telnet does not use MTWEI as
  a transport cipher for the terminal stream — treat it as a management-plane
  protocol for trusted L2 segments.
- **No transport authentication of the peer** beyond the auth exchange; any
  device on the segment can attempt sessions. Restrict MAC-Telnet on RouterOS
  (`/tool mac-server`) to trusted interfaces.
- Exposure: a reachable L2 segment + a weak password = shell. Lock down the
  MAC-server interface list the same way you would Telnet/SSH.

## RouterOS-Side Surface

```routeros
# Which interfaces accept incoming MAC-Telnet (server side)
/tool/mac-server/print
/tool/mac-server/set allowed-interface-list=LAN

# MAC WinBox (related L2 service) is configured separately
/tool/mac-server/mac-winbox/print

# From one RouterOS device to another, by MAC:
/tool/mac-telnet 64:D1:54:XX:XX:XX
```

Restricting `allowed-interface-list` to a trusted list is the primary hardening
control; the default may allow all interfaces.

## Reference Implementations

| Lang | Source | Notes |
|------|--------|-------|
| C | `haakonnessjoen/MAC-Telnet` (`protocol.c/.h`, `mactelnet.c`, `mactelnetd.c`, `mtwei.c/.h`) | **Canonical ground truth.** Header offsets, control magic, MD5 + MTWEI. MTWEI added 2022. |
| .NET 10 | `KCTech-Lab/KC.MacTelnet` (`MacTelnetDriver/Proto/*`, `Proto/Auth/Ecsrp*`) | Modern client; implements **MTWEI** against current RouterOS 7.x; pluggable terminal engine. |
| TypeScript | `tikoci/centrs` (`src/protocols/mac-telnet.ts`, `mtwei.ts`) | Pure codec + injectable-sink session state machine; **MD5 + MTWEI** (dependency-free BigInt EC-SRP port of `mtwei.c`); scripted-peer unit tests + real-L2 CHR-7.23 integration via quickchr `socket-connect`. |

**Verified:** the header layout (22 bytes, direction-swapped session-key/client-
type), control-block magic `56 34 12 ff`, big-endian length, little-endian
terminal dimensions, packet/control type enums, the 17-byte MD5 proof, the
16-vs-49-byte PASSSALT mode detection, the MTWEI identity hash, and the 33-byte
public-point encoding in this skill were cross-checked against `MAC-Telnet`'s
`protocol.c` / `mactelnet.c` / `mtwei.c`, the `centrs` codec + tests, and
`m2ir`'s related EC-SRP5 profile.

## Provenance & Unknowns

Captured deliberately, with confidence noted:

- **High confidence (source-grounded):** port 20561, the 22-byte header and its
  direction swap, control magic, packet/control type numbers, byte-counter ACK
  semantics, the empty-ACK keepalive (~10s client / ~15s server timeout), MD5
  proof formula, the two-stage MTWEI identity hash, the 16-vs-49 PASSSALT
  detection, the MTWEI public-key (33) / proof (32) sizes, and the 32-byte-X +
  parity point encoding — all read directly from `protocol.c`, `mactelnet.c`,
  `mactelnetd.c`, and `mtwei.c`, with key codec behavior cross-checked against
  `centrs` and the point encoding corroborated by `m2ir`'s WinBox EC-SRP5
  profile.
- **C-reference-specific behavior:** MTWEI strips a `+...` console-parameter
  suffix from the login name before hashing the SRP identity, but still sends
  the original login string in USERNAME. This is grounded in `mactelnet.c`;
  verify against your target implementation if you depend on console
  parameters.
- **Meaning of `client type 00 15`:** treated as an opaque constant. MikroTik
  publishes no spec; do not attribute semantics to it.
- **MTWEI math details** (curve constants, Weierstrass↔Montgomery conversion,
  proof derivation): not reproduced here on purpose — they are easy to get
  subtly wrong, and the 33-byte public key is *not* standard X25519. Implement
  against `mtwei.c` or `EcsrpEngine.cs` and pin the byte-length constants plus
  the 32-byte-X + parity encoding in tests.
- **PING/PONG (MAC-Ping):** present in the enum (4/5) and used by the MAC-Ping
  latency tool with 18-byte packets; the exact MAC-Ping payload semantics are
  out of scope here and only sketched.
- **Exact UDP delivery (broadcast vs. raw unicast Ethernet, source port choice):**
  varies by implementation and platform; the in-packet MAC addressing is the
  invariant. Verify delivery empirically on your target segment.
- **There is no official MikroTik protocol specification.** All of the above is
  reverse-engineered and corroborated across the reference implementations cited.

## Related Skills

- `routeros-mndp` — discover the device and MAC to connect to (UDP 5678).
- `routeros-fundamentals` — RouterOS CLI/REST basics for what you do once
  connected.
- `routeros-qemu-chr` — boot CHR (e.g. bridged onto an L2 segment) to test
  MAC-Telnet without hardware.
- `routeros-sniffer` — capture and inspect MAC-Telnet packets on the wire.
