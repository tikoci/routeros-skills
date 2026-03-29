# RouterOS Version Parsing & Comparison

## Version Format

RouterOS versions follow the pattern: `MAJOR.MINOR[.PATCH][QUALIFIER]`

| Component | Required | Examples |
|---|---|---|
| MAJOR | Yes | `7` |
| MINOR | Yes | `22`, `23` |
| PATCH | No | `.1`, `.2` (absent means `.0`) |
| QUALIFIER | No | `beta1`, `beta2`, `rc1`, `rc2` |

Full examples: `7.22`, `7.22.1`, `7.23beta2`, `7.22rc4`, `7.9.2`

## Parsing Logic

```typescript
function parseVersion(versionString: string) {
  // Match: major.minor[.patch][betaN|rcN]
  const match = versionString.match(
    /^(\d+)\.(\d+)(?:\.(\d+))?(?:(beta|rc)(\d+))?$/
  );
  if (!match) return null;

  return {
    major: parseInt(match[1]),
    minor: parseInt(match[2]),
    patch: match[3] ? parseInt(match[3]) : 0,
    preType: match[4] || null,        // "beta", "rc", or null
    preNum: match[5] ? parseInt(match[5]) : Infinity,  // Infinity = stable (sorts last/highest)
  };
}
```

**Key insight:** Stable releases (no qualifier) get `preNum = Infinity` so they sort **after** all
beta/rc releases of the same major.minor — this is correct because stable is released after all
pre-releases.

**NaN edge case:** When comparing two stable versions with the same major.minor.patch,
`Infinity - Infinity = NaN`. `Array.sort()` treats `NaN` as `0` (equal), so the result is correct —
but be aware of this if adapting the comparison for other uses (e.g., strict less-than checks).

## Sorting / Comparison

Sort order: major → minor → patch → preType → preNum

```typescript
function compareVersions(a: string, b: string): number {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  if (!pa || !pb) return 0;

  // Major, minor, patch — numeric ascending
  if (pa.major !== pb.major) return pb.major - pa.major;
  if (pa.minor !== pb.minor) return pb.minor - pa.minor;
  if (pa.patch !== pb.patch) return pb.patch - pa.patch;

  // Pre-release type: stable (null) > rc > beta
  const preOrder = { beta: 0, rc: 1, null: 2 };  // null = stable = highest
  const aOrder = preOrder[pa.preType ?? "null"] ?? -1;
  const bOrder = preOrder[pb.preType ?? "null"] ?? -1;
  if (aOrder !== bOrder) return bOrder - aOrder;

  // Same pre-release type: higher number = newer
  return pb.preNum - pa.preNum;
}
```

Result: newest first. `7.23 > 7.23rc2 > 7.23rc1 > 7.23beta4 > 7.23beta2 > 7.22.1 > 7.22`

## Pre-Release Detection

```typescript
function isPreRelease(version: string): boolean {
  return /(?:beta|rc)\d+$/.test(version);
}
```

Pre-release versions:
- Are hosted on `cdn.mikrotik.com` (not `download.mikrotik.com`)
- May have incomplete features or known bugs
- Should be excluded from user-facing version lists by default (opt-in display)

## Version Channels

RouterOS publishes current versions per channel:

```
https://upgrade.mikrotik.com/routeros/NEWESTa7.<channel>
```

| Channel | Audience | Example |
|---|---|---|
| `stable` | Production | `7.22` |
| `long-term` | Conservative | `7.18.2` |
| `testing` | Pre-release | `7.23rc2` |
| `development` | Beta | `7.23beta4` |

The response is plain text — just the version string, no JSON.

## Download URL Selection

```typescript
function getDownloadUrl(version: string, file: string): string {
  // Stable releases: download.mikrotik.com
  // Pre-releases: cdn.mikrotik.com
  const host = isPreRelease(version) ? "cdn.mikrotik.com" : "download.mikrotik.com";
  return `https://${host}/routeros/${version}/${file}`;
}

// Common files:
// chr-{ver}.img.zip         — x86_64 CHR disk image
// chr-{ver}-arm64.img.zip   — aarch64 CHR disk image
// chr-{ver}.vdi.zip         — VirtualBox format (used by some CI)
// all_packages-x86-{ver}.zip — extra packages bundle
```

**CI pattern:** Always try `download.mikrotik.com` first, then fall back to `cdn.mikrotik.com`.
This handles edge cases where beta builds appear on download.mikrotik.com temporarily.

## Checking If a Version Is "Built"

In the restraml project (and similar schema-generation projects), a version is considered
fully built when specific artifact files exist:

```typescript
// Version has base schema
const hasSchema = await fileExists(`docs/${version}/schema.raml`);

// Version has extra-packages schema
const hasExtra = await fileExists(`docs/${version}/extra/schema.raml`);

// Version has /app YAML schemas (7.22+)
const hasAppSchema = await fileExists(`docs/${version}/routeros-app-yaml-schema.json`);
```
