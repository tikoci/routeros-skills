# Alpine-Based OCI Image Build Recipe

Step-by-step recipe for building a single-layer OCI image from Alpine without Docker.

## Step 1: Extract Alpine Rootfs via Crane

```sh
mkdir -p rootfs
crane export --platform linux/arm64 alpine:latest - | tar xf - -C rootfs
```

**Critical:** `crane export` does NOT create busybox applet symlinks. Must create them manually.

## Step 2: Create Busybox Symlinks

Alpine containers depend on busybox providing commands like `sh`, `ls`, `wget`, etc. via symlinks:

```sh
while read -r _bpath; do
  mkdir -p "rootfs/$(dirname "$_bpath")"
  ln -sf /bin/busybox "rootfs/$_bpath"
done < rootfs/etc/busybox-paths.d/busybox
```

The file `etc/busybox-paths.d/busybox` lists all applet paths (e.g., `/usr/bin/wget`, `/bin/sh`).

## Step 3: Add Packages (e.g., make)

Alpine packages can be installed manually without `apk` by downloading from the mirror:

```sh
# Resolve package version from APKINDEX
MIRROR="https://dl-cdn.alpinelinux.org/alpine/latest-stable/main"
ARCH="aarch64"  # or: armv7, x86_64

wget -q "$MIRROR/$ARCH/APKINDEX.tar.gz" -O apkindex.tar.gz
tar xzf apkindex.tar.gz APKINDEX

# Parse version (awk: find package name, then extract version)
MAKE_VER=$(awk '/^P:make$/{f=1} f&&/^V:/{print substr($0,3);exit}' APKINDEX)

# Download and extract just the binary
wget -q "$MIRROR/$ARCH/make-${MAKE_VER}.apk" -O make.apk
tar xzf make.apk -C rootfs usr/bin/make
chmod +x rootfs/usr/bin/make
```

## Step 4: Add QEMU (for Cross-Architecture)

When building images that need to run x86 binaries on ARM hosts:

```sh
# Extract qemu-i386 from the binfmt support image
crane export --platform linux/arm64 tonistiigi/binfmt:latest - | \
  tar xf - usr/bin/qemu-i386
mv usr/bin/qemu-i386 rootfs/app/i386
chmod +x rootfs/app/i386
```

**Note:** The binary is `qemu-i386` (not `qemu-i386-static`) in the binfmt image.

## Step 5: Add Application Files

```sh
cp Makefile rootfs/app/Makefile
# Add any other files your application needs
```

## Step 6: Package as Single-Layer Tar

```sh
# Create the layer
tar cf layer.tar -C rootfs .

# Compute digest
DIGEST=$(shasum -a 256 layer.tar 2>/dev/null || sha256sum layer.tar | cut -d' ' -f1)

# Create config.json
printf '{"architecture":"arm64","os":"linux","config":{"WorkingDir":"/app","Cmd":["make","service"]},"rootfs":{"type":"layers","diff_ids":["sha256:%s"]}}' \
  "$DIGEST" > config.json

# Create manifest.json
printf '[{"Config":"config.json","RepoTags":["myimage:latest"],"Layers":["layer.tar"]}]' \
  > manifest.json

# Create final image tar
tar cf image.tar config.json manifest.json layer.tar
```
