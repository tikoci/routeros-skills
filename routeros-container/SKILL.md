---
name: routeros-container
description: "RouterOS /container subsystem for running OCI containers on MikroTik devices. Use when: enabling containers on RouterOS, setting up VETH/bridge networking for containers, managing container lifecycle via CLI or REST API, building OCI images for RouterOS, configuring container environment variables, troubleshooting container issues, or when the user mentions RouterOS container, /container, VETH, device-mode container, or MikroTik Docker."
---

# RouterOS Container Subsystem

## Overview

RouterOS 7.x includes a container subsystem (`/container`) that runs OCI-compatible container images directly on MikroTik hardware. It is NOT Docker — it's MikroTik's own implementation with significant differences.

**Requirements:**
- RouterOS 7.x with `container` extra package installed
- Device-mode must be enabled (requires physical access for initial setup)
- Sufficient storage (external USB disk recommended, 100+ MB/s, 10K+ random IOPS)
- ARM, ARM64, or x86 architecture (MIPS not supported for containers)

## Device-Mode — Physical Access Required

Container support is gated behind device-mode, which requires physical confirmation (reset button press or power cycle) to enable:

```routeros
# Enable container mode
/system/device-mode/update mode=advanced container=yes

# After executing: physically confirm within activation-timeout
# - Press reset button, OR
# - Power cycle the device
```

Device-mode is a general RouterOS security feature — not container-specific. It gates many features (scheduler, fetch, sniffer, etc.) across four modes (`home`, `basic`, `advanced`, `rose`) with device-dependent factory defaults.

For the full feature matrix, modes, update properties, and physical confirmation details: see the [Device-mode reference](../routeros-fundamentals/references/device-mode.md) in the `routeros-fundamentals` skill.

**Mode script bypass (7.22+):** During netinstall, a mode script (`-sm`) can set device-mode on first boot, automatically triggering a reboot. See the `routeros-netinstall` skill.

## Installing the Container Package

```routeros
# Check if container package is already installed
/system/package/print where name=container
```

**Method 1: Upload .npk file + reboot** (offline)
```sh
# Upload via SCP (or Winbox drag-and-drop, or WebFig file upload)
scp container-7.22-arm64.npk admin@router:/
```
```routeros
# Then reboot to activate
/system/reboot
```

**Method 2: Online package update** (requires internet)
```routeros
/system/package/update check-for-updates
/system/package/update install
```
This downloads and installs all available updates including extra packages. To enable a specific package already uploaded but not active, use `/system/package/enable container` then `/system/reboot`.

## Networking Setup

### VETH (Virtual Ethernet)

Containers connect to RouterOS networking via VETH interfaces:

```routeros
# Create VETH pair
/interface/veth/add name=veth-myapp address=172.17.0.2/24 gateway=172.17.0.1

# The VETH name IS the container's interface name (RouterOS 7.21+)
```

### Bridge Setup

```routeros
# Create a bridge for containers
/interface/bridge/add name=containers

# Add VETH to the bridge
/interface/bridge/port/add bridge=containers interface=veth-myapp

# Assign IP to bridge (acts as gateway for containers)
/ip/address/add address=172.17.0.1/24 interface=containers
```

### NAT / Firewall

```routeros
# Masquerade container traffic for internet access
/ip/firewall/nat/add chain=srcnat action=masquerade src-address=172.17.0.0/24

# Port forwarding from host to container
/ip/firewall/nat/add chain=dstnat action=dst-nat \
  dst-port=8080 protocol=tcp to-addresses=172.17.0.2 to-ports=80

# Allow container bridge in interface list (if firewall restricts)
/interface/list/member/add list=LAN interface=containers
```

### Layer 2 Networking (Bridge Mode)

For containers that need to be on the same L2 network as physical interfaces (e.g., netinstall):

```routeros
# Add both physical port and VETH to the same bridge
/interface/bridge/port/add bridge=mybridge interface=ether5
/interface/bridge/port/add bridge=mybridge interface=veth-netinstall
```

This gives the container direct L2 access to devices on ether5.

## Environment Variables

Environment variables are configured via `/container/envs`:

```routeros
# RouterOS 7.20+ syntax (CLI and REST API use the same property names)
/container/envs/add key=MY_VAR list=MYAPP value="hello world"
/container/envs/add key=DB_HOST list=MYAPP value=172.17.0.3

# Pre-7.20: property was 'name=' instead of 'list='
/container/envs/add key=MY_VAR name=MYAPP value="hello world"
```

**Property name changes at 7.20:**
| Context | Pre-7.20 | 7.20+ |
|---|---|---|
| Env list name field (`/container/envs`) | `name=` | `list=` |
| Container env reference (`/container`) | `envlist=` | `envlists=` |

CLI and REST API property names are **always the same** on a given RouterOS version — both reflect the underlying `/console/inspect` command tree. Any perceived CLI-vs-REST difference is syntax (CLI keyword parsing vs JSON keys), not different property names.

> **Note:** The property details above are confirmed against working code and 7.22 documentation (via rosetta MCP). The change point is 7.20 based on the commit history of `tools/container-manager.sh` (commit 4305181).

## Container Image Formats

RouterOS accepts container images in these formats:

### Option A: Pull from Registry
```routeros
/container/config/set registry-url=https://registry-1.docker.io tmpdir=disk1/pull
/container/add remote-image=library/alpine:latest interface=veth-myapp
```

### Option B: Import Local Tar File
Upload a Docker v1 tar to the router, then:
```routeros
/container/add file=myimage.tar interface=veth-myapp
```

### OCI Image Requirements for Local Import

RouterOS's container loader has specific requirements for local tar files:

1. **Single layer only** — multi-layer images are not supported
2. **No gzip compression** — layers must be uncompressed tar
3. **Docker v1 manifest format** — `manifest.json` + `config.json` + `layer.tar`

```
myimage.tar
├── manifest.json    # [{"Config":"config.json","RepoTags":["name:tag"],"Layers":["layer.tar"]}]
├── config.json      # {"architecture":"arm64","os":"linux","config":{...},"rootfs":{...}}
└── layer.tar        # Uncompressed tar of the full filesystem
```

See the `tikoci-oci-image-building` skill for building compliant images without Docker.

## Container Lifecycle

### CLI

```routeros
# Create container
/container/add file=myimage.tar interface=veth-myapp envlist=MYAPP \
  root-dir=disk1/myapp logging=yes

# Start
/container/start [find tag~"myapp"]

# Stop
/container/stop [find tag~"myapp"]

# View status
/container/print

# View logs (if logging=yes)
/log/print where topics~"container"

# Remove (must be fully stopped first)
/container/remove [find tag~"myapp"]
```

### REST API

```typescript
const base = "http://192.168.1.1/rest";
const auth = { headers: { Authorization: `Basic ${btoa("admin:")}` } };

// List containers
const containers = await fetch(`${base}/container`, auth).then(r => r.json());

// Start container by ID
await fetch(`${base}/container/start`, {
  method: "POST", ...auth,
  headers: { ...auth.headers, "Content-Type": "application/json" },
  body: JSON.stringify({ ".id": "*1" }),
});

// Check status — .running field is "true"/"false" (strings!)
const status = await fetch(`${base}/container/*1`, auth).then(r => r.json());
if (status.running === "true") { /* container is running */ }

// Stop container
await fetch(`${base}/container/stop`, {
  method: "POST", ...auth,
  body: JSON.stringify({ ".id": "*1" }),
});

// Delete — must be fully stopped. Poll .running and retry.
async function deleteContainer(id) {
  for (let i = 0; i < 5; i++) {
    const c = await fetch(`${base}/container/${id}`, auth).then(r => r.json());
    if (c.running === "false") {
      await fetch(`${base}/container/${id}`, { method: "DELETE", ...auth });
      return;
    }
    await new Promise(r => setTimeout(r, 3000));
  }
  throw new Error("Container did not stop in time");
}
```

### REST API Gotchas for Containers

- **`.running` field** is the status indicator — values are strings `"true"` / `"false"`, not booleans
- **No `.stopped` field exists** — only check `.running`
- **Delete while stopping = HTTP 400** — must poll `.running` until `"false"` before DELETE
- **`file=` for local tar**, `remote-image=` for registry pull
- **Container `envlists`** (with trailing `s`) references the env list name — note the plural

## Container Properties

| Property | Description |
|---|---|
| `tag` | Image tag / name |
| `interface` | VETH interface |
| `envlist` / `envlists` | Environment variable list name (see version notes above) |
| `root-dir` | Storage location for container filesystem |
| `mounts` | Volume mounts (`src=host/path,dst=/container/path`) |
| `cmd` | Override container CMD |
| `entrypoint` | Override container ENTRYPOINT |
| `hostname` | Container hostname |
| `dns` | DNS server for container |
| `logging` | Enable container stdout/stderr to RouterOS log (`yes`/`no`) |
| `workdir` | Override working directory |

## Volumes

```routeros
# Named mount
/container/mounts/add name=appdata src=disk1/appdata dst=/data

# Reference in container
/container/add ... mounts=appdata
```

**Best practice:** Always place container volumes on external disk (`disk1/`), never on internal flash storage.

## Architecture Mapping

When pulling from registries or building images, map RouterOS architecture to Docker platform:

| RouterOS `architecture-name` | Docker Platform |
|---|---|
| `arm` | `linux/arm/v7` |
| `arm64` | `linux/arm64` |
| `x86` | `linux/amd64` |

Query the router's architecture:
```typescript
const resource = await fetch(`${base}/system/resource`, auth).then(r => r.json());
const arch = resource["architecture-name"]; // "arm64", "arm", "x86"
```

## /app System (7.22+)

RouterOS 7.22 introduced `/app` — a docker-compose-like YAML system for defining container applications. See the `routeros-app-yaml` skill for the full YAML specification.

```routeros
# List available apps
/app/print

# Add app from URL
/app/add yaml-url=https://example.com/myapp.tikapp.yaml
```

### /app vs Manual Container Setup

| Concern | Manual (this page) | /app YAML |
|---|---|---|
| Networking | Full control — any bridge/VETH/L2 topology | Docker-style: `internal` subnet with port forwarding (NAT) |
| L2 bridge access | Yes — add VETH + physical port to same bridge | Not directly — but can assign a bridge post-creation via `/app/set network=<bridge>` |
| Multi-container | Manual per-container setup | Declarative YAML, multiple services |
| Use case | Raw L2 access (netinstall, DHCP relay, etc.) | Standard app deployment with port forwarding |

Netinstall specifically requires L2 bridge access for BOOTP/TFTP, which is why the manual VETH+bridge approach is used rather than /app. For typical containers that only need port-forwarded TCP/UDP services, `/app` is simpler.

## Additional Resources

**Related skills:**
- For netinstall and device-mode automation: see the `routeros-netinstall` skill
- For building OCI images compatible with RouterOS: see the `tikoci-oci-image-building` skill
- For the /app YAML format: see the `routeros-app-yaml` skill
- For general RouterOS fundamentals (CLI, REST, scripting): see the `routeros-fundamentals` skill

**MCP tools:**
- For RouterOS documentation and property lookups: use the `rosetta` MCP server tools (`routeros_search`, `routeros_get_page`, `routeros_search_properties`)

**External docs:**
- MikroTik official docs: https://help.mikrotik.com/docs/spaces/ROS/pages/84901929/Container
