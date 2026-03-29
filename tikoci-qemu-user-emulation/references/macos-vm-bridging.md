# macOS VM Pattern: vmnet-bridged + 9p

QEMU user-mode is a **Linux-only feature** (translates Linux syscalls). On macOS, you cannot use `qemu-i386` user-mode at all.

For simple binaries, Rosetta 2 (Apple Silicon) or native x86 execution (Intel Mac) may work — but only for Mach-O binaries, not Linux ELFs.

**For Linux ELF binaries that need raw network access** (like netinstall-cli which uses BOOTP/TFTP on privileged ports), a full QEMU system VM is required.

## Architecture

The pattern boots a minimal Linux VM that:
1. Bridges to a macOS network interface (L2 access for BOOTP/TFTP)
2. Shares the host working directory via 9p (virtfs)
3. Runs the Linux binary natively inside x86_64 Linux

```
macOS Host
├── qemu-system-x86_64 (Homebrew)
├── vmlinuz-virt (Alpine kernel)
├── initramfs-netinstall.gz (custom minimal rootfs)
├── Working directory (shared via 9p)
└── Network interface (e.g., en5, bridged via vmnet)

    ↕ vmnet-bridged (L2)    ↕ 9p/virtfs

Linux VM (QEMU)
├── /host (9p mount of macOS working dir)
├── eth0 (bridged to macOS interface)
└── make run IFACE=eth0 (runs netinstall-cli natively)
```

## QEMU System VM Launch

```sh
sudo qemu-system-x86_64 \
  -m 256M \
  -kernel downloads/vmlinuz-virt \
  -initrd downloads/initramfs-netinstall.gz \
  -append "console=ttyS0 quiet" \
  -virtfs local,path=.,mount_tag=hostfs,security_model=none \
  -netdev vmnet-bridged,id=n0,ifname=en5 \
  -device virtio-net-pci,netdev=n0 \
  -nographic \
  -no-reboot
```

**Requirements:**
- `brew install qemu` (provides `qemu-system-x86_64`)
- `sudo` (required for vmnet-bridged)
- Alpine `linux-virt` kernel + custom initramfs

## Building the Initramfs

The initramfs is a cpio archive containing:
1. Alpine rootfs (from OCI image export)
2. Kernel modules (from `linux-virt` APK — must match kernel version)
3. Custom `/init` script

**Critical kernel modules** (must be loaded via `insmod` in explicit order):

```
1. virtio.ko           — VirtIO core
2. virtio_ring.ko      — VirtIO ring buffer
3. virtio_pci.ko       — VirtIO PCI transport
4. failover.ko         — Network failover core
5. net_failover.ko     — Network failover (virtio_net depends on this)
6. virtio_net.ko       — VirtIO network driver
7. netfs.ko            — Network filesystem core
8. 9pnet.ko            — 9P network protocol
9. 9pnet_virtio.ko     — 9P over VirtIO transport
10. 9p.ko              — 9P filesystem
```

**Load order matters** — modules have unlisted dependencies:
- `virtio_net` depends on `net_failover` → `failover` (not obvious from module names)
- `9p` depends on `9pnet_virtio` → `9pnet` → `netfs`

## Init Script

```sh
#!/bin/sh
mount -t proc none /proc
mount -t sysfs none /sys
mount -t devtmpfs none /dev

kmod=/lib/modules/$(uname -r)/kernel
insmod $kmod/drivers/virtio/virtio.ko 2>/dev/null
insmod $kmod/drivers/virtio/virtio_ring.ko 2>/dev/null
insmod $kmod/drivers/virtio/virtio_pci.ko 2>/dev/null
insmod $kmod/net/core/failover.ko 2>/dev/null
insmod $kmod/drivers/net/net_failover.ko 2>/dev/null
insmod $kmod/drivers/net/virtio_net.ko
insmod $kmod/fs/netfs/netfs.ko 2>/dev/null
insmod $kmod/net/9p/9pnet.ko
insmod $kmod/net/9p/9pnet_virtio.ko
insmod $kmod/fs/9p/9p.ko

mkdir -p /host
mount -t 9p -o trans=virtio,version=9p2000.L hostfs /host

ip link set eth0 up
ip addr add 169.254.1.1/16 dev eth0

sh /host/.vm-cmd.sh
poweroff -f
```

## Lessons Learned

1. **Alpine virt kernel has almost nothing built-in** — virtio, 9p, IDE are all modules
2. **Alpine's `initramfs-virt`** (netboot) only includes essential boot modules, NOT 9p — can't use it as-is
3. **Kernel/module version must match exactly** — get both from the same `linux-virt` APK (don't mix netboot kernel with APK modules)
4. **Module files may be compressed** (`.ko.gz`) — busybox `insmod` cannot load compressed modules. Decompress at build time: `find modules/ -name '*.ko.gz' -exec gunzip {} \;`
5. **Merged-usr in Alpine** — `/lib` → `/usr/lib` symlink breaks cpio overlay of `/lib/modules/`. Embed modules directly in the initramfs rootfs
6. **`netinstall-cli` requires an IPv4 address** on the interface even though it does its own BOOTP/TFTP — use a link-local address like `169.254.1.1/16`
