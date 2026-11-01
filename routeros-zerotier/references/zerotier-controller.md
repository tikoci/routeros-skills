# RouterOS as ZeroTier controller

RouterOS 7.3+ can **be** the network controller (`/zerotier/controller`): it admits members, issues certificates, and pushes IP assignment plus managed routes — no cloud console involved. This is the least-documented part of RouterOS ZeroTier; the MikroTik manual page is the only real write-up, and the flow below is grounded on arm64 CHR 7.25.

## Create the network

```routeros
/zerotier/controller/add name=ZT-lab instance=zt1 \
  ip-range=172.27.27.10-172.27.27.20 routes=172.27.27.0/24
# ok, ret *1
/zerotier/controller/print
# ZT-lab ... network=8905b352c9403017 private=true broadcast=true mtu=2800 ...
```

- The network ID is **generated** from the controller address + controller ID combination — here node `8905b352c9` produced `8905b352c9403017`. You do not pick it.
- `private` defaults to `true`: members must be authorized (below). A public network auto-accepts joiners — fine for a quick lab test, not for production.
- `ip-range` is the auto-assign pool; `routes` are the managed routes pushed to members. Up to 100 devices per network per the manual.

## Join and authorize

```routeros
# On any router (or the controller box itself):
/zerotier/interface/add network=8905b352c9403017 instance=zt1 name=zt-lab
# Join auto-creates the member row with authorized=false; interface reads ACCESS_DENIED

# On the controller box:
/zerotier/controller/member/print
/zerotier/controller/member/set *1 authorized=yes
# ~20 s later: interface OK, running=true
```

Verify the push landed:

```routeros
/ip/address/print where interface=zt-lab
# 172.27.27.17/24 ... dynamic
/ip/route/print where gateway~"zt-lab"
# managed route 172.27.27.0/24 active
```

The member row also gains its `ip-address` after authorization.

## What the MikroTik controller cannot do

MikroTik's controller exposes **no flow rules, tags, or capabilities** — those controls exist only on ZeroTier One / Central controllers. Consequences:

- There is no ruleset to block RoMON or VLAN ethertypes on a RouterOS-hosted network; anything the members send passes (subject to RouterOS firewall on each box).
- There is no capability system for fine-grained member permissions; authorization is boolean (`authorized=yes/no`).
- For networks that need L2 filtering or micro-segmentation, host the controller on Central (or self-hosted ZeroTier One) instead. See [zerotier-central.md](./zerotier-central.md).

## Controller vs roots (do not conflate)

- **Network controller** (this page, VL2): membership, auth, IP/routes. RouterOS can be one.
- **Roots** — planet and moons (VL1): connection facilitation (discovery, rendezvous, relay). The RouterOS native package exposes **no planet/moon setting** and ignores private roots; all instances use the baked-in public roots. Private roots require containerized upstream ZeroTier (out of scope — see the larsa pointer in the skill body).
