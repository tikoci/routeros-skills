---
name: tikoci-qemu-user-emulation
description: "QEMU user-mode emulation for running foreign-architecture binaries, plus macOS VM bridging for raw-socket Linux tools. Use when: running x86 binaries on ARM hosts, setting up qemu-user-static, using binfmt_misc, building containers with QEMU emulation, running Linux network tools (like MikroTik netinstall-cli) on macOS via QEMU system VM, or when the user mentions qemu-i386, qemu-user, binfmt, cross-architecture emulation, or vmnet-bridged."
---

# QEMU User-Mode Emulation & macOS VM Bridging

## QEMU User-Mode Emulation

QEMU user-mode lets you run a binary compiled for one architecture on a host with a different architecture. The binary runs as a regular process — no VM, no kernel emulation. System calls are translated to the host kernel.

### Use Case

Run x86/i386 Linux binaries (like `netinstall-cli`) on ARM/ARM64 Linux hosts. On x86_64 Linux, the kernel natively supports running i386 binaries, so no QEMU is needed.

### Installation

| Platform | Package | Binary name |
|---|---|---|
| Debian/Ubuntu | `qemu-user-static` | `qemu-i386-static` |
| Alpine | `qemu-i386` | `qemu-i386` |
| Fedora/RHEL | `qemu-user-static` | `qemu-i386-static` |
| Container (tonistiigi/binfmt) | N/A | `qemu-i386` |

**Note:** Debian/Ubuntu use `qemu-i386-static` (statically linked — can be copied into containers). Alpine uses `qemu-i386` (dynamically linked — must stay on the host or in a matching rootfs).

### Direct Usage

```sh
# Prefix the command with the QEMU binary
qemu-i386-static ./netinstall-cli -r -b -i eth0 routeros-7.22-arm64.npk

# Or with explicit path
/usr/bin/qemu-i386 ./my-x86-binary arg1 arg2
```

### Auto-Detection Pattern

When you need to find the right QEMU binary across platforms:

```sh
# Priority: local binary, static (Debian), dynamic (Alpine)
for q in ./i386 qemu-i386-static qemu-i386; do
  if [ -x "$q" ] || command -v "$q" >/dev/null 2>&1; then
    QEMU="$q"
    break
  fi
done

# On x86_64, skip QEMU entirely
if [ "$(uname -m)" = "x86_64" ]; then
  QEMU=""
fi

# Usage
${QEMU:+$QEMU} ./netinstall-cli [args...]
```

### binfmt_misc (Automatic Transparent Emulation)

Linux's `binfmt_misc` can automatically invoke QEMU for foreign binaries:

```sh
# Register QEMU handlers (usually done by package install or docker setup)
# The tonistiigi/binfmt image does this for Docker:
docker run --privileged --rm tonistiigi/binfmt --install all

# After registration, foreign binaries run transparently:
./my-i386-binary  # kernel automatically invokes qemu-i386
```

**In containers:** The QEMU binary must be accessible inside the container's filesystem. With static QEMU (`qemu-i386-static`), copy it into the container image. With binfmt and the `F` flag, the kernel pre-loads the interpreter.

### Container Embedding

For containers that need to run x86 binaries on ARM hosts, embed QEMU in the image:

```sh
# Extract from the binfmt support image
crane export --platform linux/arm64 tonistiigi/binfmt:latest - | \
  tar xf - usr/bin/qemu-i386
mv usr/bin/qemu-i386 rootfs/app/i386
chmod +x rootfs/app/i386
```

In the container, invoke the binary as: `./i386 ./netinstall-cli [args...]`

## macOS: When User-Mode Isn't Enough

QEMU user-mode is a **Linux-only feature**. On macOS, you cannot use `qemu-i386` user-mode. For Linux ELF binaries that need raw network access (BOOTP/TFTP on privileged ports), a full QEMU system VM is required.

### vmnet-bridged + 9p Pattern

Boot a minimal Alpine Linux VM that bridges to a macOS network interface (L2 access) and shares the host working directory via 9p virtfs. The Linux binary runs natively inside x86_64 Linux — no user-mode QEMU.

**Key components:**
- `qemu-system-x86_64` (`brew install qemu`) + `sudo` (for vmnet-bridged)
- Alpine `linux-virt` kernel + custom initramfs (Alpine rootfs + kernel modules + init script)
- Kernel modules loaded via `insmod` in explicit dependency order (busybox has no `modprobe`)
- `virtio_net` depends on `net_failover` → `failover` (not obvious)
- `9p` depends on `9pnet_virtio` → `9pnet` → `netfs`

**Critical lessons:**
- Get kernel and modules from the **same** `linux-virt` APK — version mismatch breaks module loading
- Busybox `insmod` cannot load compressed `.ko.gz` — decompress at build time
- `netinstall-cli` requires an IPv4 address on the interface (use link-local `169.254.1.1/16`)

See [macOS VM bridging reference](./references/macos-vm-bridging.md) for the full QEMU launch command, initramfs build process, init script, and module load order.

## Additional Resources

**Reference files:**
- For full macOS VM launch command, initramfs build, init script, and module load order: see [macOS VM bridging reference](./references/macos-vm-bridging.md)

**Related skills:**
- For RouterOS CHR system-level QEMU (full RouterOS in VM): see the `routeros-qemu-chr` skill
- For building OCI images with embedded QEMU: see the `tikoci-oci-image-building` skill
- For netinstall-cli specifics: see the `routeros-netinstall` skill
