---
name: tikoci-oci-image-building
description: "Building OCI container images without Docker using crane and standard tools. Use when: building container images with crane, creating single-layer Docker v1 tars, building images for constrained runtimes (like MikroTik RouterOS /container), extracting Alpine rootfs, managing busybox symlinks, or when the user mentions crane, OCI image, Docker v1 tar, single-layer tar, or building images without Docker."
---

# OCI Image Building Without Docker

## Why Build Without Docker

Some environments lack Docker (e.g., RouterOS containers, minimal CI, macOS without Docker Desktop). `crane` (from go-containerregistry) can export and manipulate OCI images without requiring a container runtime.

**Core tools:**
- `crane` — export/push/inspect OCI images (`brew install crane` on macOS, `go install github.com/google/go-containerregistry/cmd/crane@latest`)
- `tar` — standard archive tool for filesystem assembly
- `wget`/`curl` — downloading APK packages, base images
- `cpio` — for initramfs building (optional)

## The Single-Layer Docker v1 Tar

Some container runtimes (notably RouterOS `/container`) only support a **single uncompressed layer** in Docker v1 manifest format. This is the simplest possible OCI image format.

### Structure

```
image.tar
├── manifest.json
├── config.json
└── layer.tar
```

### manifest.json

```json
[{
  "Config": "config.json",
  "RepoTags": ["myimage:latest"],
  "Layers": ["layer.tar"]
}]
```

### config.json

```json
{
  "architecture": "arm64",
  "os": "linux",
  "config": {
    "WorkingDir": "/app",
    "Cmd": ["make", "service"],
    "Env": ["PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"]
  },
  "rootfs": {
    "type": "layers",
    "diff_ids": ["sha256:LAYER_DIGEST_HERE"]
  }
}
```

**Architecture values:** `amd64`, `arm64`, `arm` (for armv7)

**`diff_ids`:** SHA-256 of the uncompressed `layer.tar`. Compute with:
```sh
sha256sum layer.tar | cut -d' ' -f1
# or on macOS:
shasum -a 256 layer.tar | cut -d' ' -f1
```

### layer.tar

A standard tar archive of the complete filesystem rootfs:
```sh
tar cf layer.tar -C rootfs .
```

## Building an Alpine-Based Image

Build a complete single-layer image from Alpine without Docker using `crane` and standard tools:

1. **Extract rootfs:** `crane export --platform <plat> alpine:latest - | tar xf - -C rootfs`
2. **Create busybox symlinks** from `rootfs/etc/busybox-paths.d/busybox` — `crane export` does NOT create them
3. **Add APK packages** manually (download from mirror, parse APKINDEX for version, extract binary)
4. **Add QEMU** if needed (extract `qemu-i386` from `tonistiigi/binfmt` image — note: name is `qemu-i386`, not `qemu-i386-static`)
5. **Add application files** to rootfs
6. **Package** `layer.tar` + `config.json` + `manifest.json` → `image.tar`

See [Alpine image recipe](./references/alpine-image-recipe.md) for the full step-by-step with code examples.

## Platform Mapping

When building multi-platform images:

| Target | `crane --platform` | Config `architecture` | APK arch |
|---|---|---|---|
| ARM64 | `linux/arm64` | `arm64` | `aarch64` |
| ARM v7 | `linux/arm/v7` | `arm` | `armv7` |
| x86_64 | `linux/amd64` | `amd64` | `x86_64` |

## Pushing with Crane

```sh
# Push single-platform image
crane push image.tar myregistry/myimage:linux-arm64

# Set metadata after push
crane mutate --workdir /app --cmd "make,service" myregistry/myimage:linux-arm64

# Create multi-platform manifest
crane index append \
  -t myregistry/myimage:latest \
  -m myregistry/myimage:linux-arm64 \
  -m myregistry/myimage:linux-arm-v7 \
  -m myregistry/myimage:linux-amd64
```

## Digest Computation Gotcha (POSIX Shell)

Computing SHA-256 in a Makefile recipe requires careful escaping:

```makefile
# WRONG — dash interprets $$(( )) as arithmetic expansion
_digest=$$(shasum -a 256 file | cut -d' ' -f1)

# CORRECT — space after ( makes it unambiguously command substitution
_digest=$$( ( shasum -a 256 file 2>/dev/null || sha256sum file ) | cut -d' ' -f1)
```

The `( cmd )` with space is a subshell, and `$$( ... )` is command substitution. Without the space, `$$(( ... ))` becomes `$(( ... ))` which dash rejects as arithmetic.

## Alpine Merged-usr Caveat

Modern Alpine container images use merged-usr layout (`/lib` → `/usr/lib` symlink). When overlaying files into `/lib/` (e.g., kernel modules for initramfs), this can cause issues because writing to `/lib/modules/` actually writes to `/usr/lib/modules/`. Build initramfs separately rather than overlaying onto the container rootfs.

## RouterOS-Specific Constraints

When building images for RouterOS `/container`:

1. **Single layer** — must be exactly one `layer.tar` entry
2. **No gzip** — `layer.tar` must not be compressed
3. **Docker v1 format** — `manifest.json` + `config.json` + `layer.tar`
4. **Architecture must match** — ARM device needs ARM image; no automatic platform selection
5. **Upload via SCP** — `scp image.tar admin@router:/disk1/images/`
6. **Create container** — `/container/add file=disk1/images/image.tar interface=veth-myapp`

## Additional Resources

**Reference files:**
- For full step-by-step Alpine image build: see [Alpine image recipe](./references/alpine-image-recipe.md)

**Related skills:**
- For RouterOS container setup and image requirements: see the `routeros-container` skill
- For QEMU user-mode emulation details: see the `tikoci-qemu-user-emulation` skill

**External docs:**
- Crane documentation: https://github.com/google/go-containerregistry/tree/main/cmd/crane
