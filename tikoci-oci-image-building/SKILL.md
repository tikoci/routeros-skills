---
name: tikoci-oci-image-building
description: "Building OCI container images without Docker using crane and standard tools. Use when: building container images with crane, creating single-layer Docker v1 tars, building images for constrained runtimes (like MikroTik RouterOS /container), extracting Alpine rootfs, managing busybox symlinks, or when the user mentions crane, OCI image, Docker v1 tar, single-layer tar, or building images without Docker."
---

# OCI Image Building Without Docker

## CRITICAL: When NOT to Use crane for Standard Docker Images

**Do not use crane to build images for standard Docker/containerd runtimes.** After extensive debugging across multiple approaches, crane-based image construction (both single-layer and `crane append` + jq config modification) produces images that fail on Docker 28+ with containerd image store. The failure mode: `exec /entrypoint.sh: no such file or directory` for ALL binaries, even Debian's own `ls` and `cat`, despite `crane export` confirming all files exist in the image.

**Root cause never fully diagnosed.** The overlay filesystem mount appears empty regardless of how the image is constructed without a real Docker build.

**The anti-patterns that do NOT work:**
1. `crane export base | tar xf` → add files → `tar cf layer.tar` → hand-craft `config.json` + `manifest.json` → `crane push`  
   _Fails: empty overlay on Docker 28+ even though `crane export` confirms files exist_
2. `crane append -b base -f additions.tar -o intermediate.tar` → extract → `jq` modify config → rename config by sha256 → `crane push`  
   _Fails: same empty overlay symptom after push_

**Use Dockerfile + `docker buildx` for anything destined for standard Docker/containerd runtimes.**

---

## Why Build Without Docker (RouterOS / Constrained Runtimes Only)

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
# Entries have no prefix: bin, etc, entrypoint.sh
(cd rootfs && tar cf - *) > layer.tar
```

**Important limitations:** Hand-crafted single-layer Docker v1 tars work with `crane push` for registry upload but DO NOT work with `docker load` or `docker pull` on Docker 28+ (containerd image store). Docker's overlay filesystem gets an empty mount — all exec calls fail with `no such file or directory`. The root cause is unclear (SHA-256 diff_ids appear correct, `crane export` shows files exist). **Use `crane append` for multi-layer images instead** — this is the recommended approach for non-RouterOS targets.

**When to use single-layer:** Only for RouterOS `/container` which requires exactly one uncompressed layer. For standard Docker/containerd runtimes, use `crane append` (see below).

## Building Multi-Layer Images with `crane append`

For standard Docker/containerd runtimes, use `crane append` to add files on top of a base image. This preserves the base layers intact (Docker knows how to mount them) and avoids the single-layer diff_id issue.

### Basic flow

```sh
# 1. Create a tar of JUST your additions (not the full rootfs)
mkdir -p staging/app
cp myapp staging/app/myapp
cp entrypoint.sh staging/entrypoint.sh
(cd staging && tar cf - entrypoint.sh app) > additions.tar

# 2. Append to base image, output Docker v1 tar
crane append -b debian:bookworm-slim --platform linux/amd64 \
  -f additions.tar -t myimage:local -o intermediate.tar

# 3. Modify config (Cmd, WorkingDir) — crane append inherits base config
mkdir extract && tar xf intermediate.tar -C extract
cfg=$(jq -r '.[0].Config' extract/manifest.json)
jq '.config.Cmd=["/entrypoint.sh"] | .config.WorkingDir="/app"' \
  "extract/$cfg" > extract/config.tmp
new_hash=$(sha256sum extract/config.tmp | cut -d' ' -f1)
new_cfg="sha256:$new_hash"
mv extract/config.tmp "extract/$new_cfg"
rm "extract/$cfg"
jq --arg c "$new_cfg" '.[0].Config=$c' extract/manifest.json > extract/manifest.tmp
mv extract/manifest.tmp extract/manifest.json
tar cf final.tar -C extract .

# 4. Push to registry
crane push final.tar registry/myimage:tag
```

### Config modification

`crane append` inherits the base image's config (e.g., `Cmd: ["bash"]` from debian). To change it:
- Extract the Docker v1 tar
- Modify config JSON with `jq`
- Recompute config hash (file is named by sha256)
- Rename file and update manifest.json reference

`crane mutate` can modify config for **remote images** (already pushed to a registry) but **cannot** operate on local Docker v1 tarballs.

### Multi-platform with crane append

```sh
# Build per-platform tars
for plat in linux/amd64 linux/arm64; do
  crane append -b debian:bookworm-slim --platform "$plat" \
    -f "additions-${plat//\//-}.tar" -t myimage:local \
    -o "image-${plat//\//-}.tar"
  # ... modify config ...
  crane push "image-${plat//\//-}.tar" "registry/myimage:tag-${plat//\//-}"
done

# Create multi-arch index
crane index append -t registry/myimage:tag \
  -m registry/myimage:tag-linux-amd64 \
  -m registry/myimage:tag-linux-arm64
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
