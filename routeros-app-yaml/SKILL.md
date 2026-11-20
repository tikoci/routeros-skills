---
name: routeros-app-yaml
description: "RouterOS /app YAML format for container applications (7.21+ builtin app, 7.22+ custom YAML creation). Use when: writing or validating RouterOS /app YAML files, working with MikroTik container apps, building docker-compose-like definitions for RouterOS, creating /app store schemas, debugging /app validation errors, or when the user mentions /app, tikapp, or RouterOS container YAML."
---

# RouterOS /app YAML Format (7.21+)

RouterOS 7.21 introduced the `/app` path (built-in app listing and management). The full YAML app creation feature (`/app/add`) appeared in **7.22** (first seen in 7.22beta5). Think of it as MikroTik's opinionated alternative to `docker-compose` — but it is NOT docker-compose, with significant differences.

## What /app Is

The `/app` subsystem lets users define one or more containers as a single "application" in YAML. RouterOS parses the YAML, creates containers, volumes, networks, and config files, then manages the lifecycle.

**Key concepts:**

- Each `/app` is defined by a YAML document with services, configs, volumes, and networks
- The YAML is loaded into RouterOS via CLI (`/app/add yaml=...`) or REST (`PUT /rest/app` with `{"yaml": "..."}`). 7.24.5 has no `yaml-url` parameter on `/app/add`; fetch the file first (see [Lifecycle](#lifecycle-on-the-router))
- Built-in apps ship with RouterOS (visible at `GET /rest/app`)
- Custom apps can be added from URLs or inline YAML
- App stores (`app-store-urls=`) provide curated collections

## Critical Differences from docker-compose

| Feature | docker-compose | RouterOS /app |
|---|---|---|
| Port format | `host:container[/protocol]` | Two styles (see below) |
| Environment | `KEY=value` or list | Same, but placeholders expand |
| Volumes | Named or bind mounts | Subset — no bind mount options |
| Networks | Full docker network model | Simplified — name + external |
| Build | Full Dockerfile support | Minimal (context + dockerfile) |
| Configs | Docker configs API | Inline `content` only |
| Deploy/resources | Yes | No — not supported |
| Top-level `version:` | Deprecated (was required) | Not used |
| File extension | `.yml` / `.yaml` | `.tikapp.yaml` (convention) |

## Top-Level Properties

| Property | Type | Required | Description |
|---|---|---|---|
| `name` | string | No | Unique identifier for the /app |
| `descr` | string | No | Human-readable description shown in app UI |
| `page` | string (URI) | No | Project homepage URL |
| `category` | string (enum) | No | App store classification |
| `icon` | string (URI) | No | Icon URL (shown in WebFig with `show-in-webfig=yes`) |
| `default-credentials` | string or null | No | `username:password` shown in UI |
| `url-path` | string | No | URL path suffix for browser access (e.g., `/admin`) |
| `credentials` | string | No | Credential hint (alternative to default-credentials) |
| `option` | boolean | No | Whether app is optional |
| `auto-update` | boolean | No | Pull and restart containers on every boot |
| `services` | object | **Yes** | Container service definitions (≥1 required) |
| `volumes` | object | No | Named volume declarations |
| `networks` | object | No | Network declarations |
| `configs` | object | No | Config file declarations with inline content |

### Category Values (Exhaustive)

```text
productivity, storage, networking, development, communication,
file-management, search, video, media, media-management,
home-automation, monitoring, database, automation, ai,
messaging, radio, security, business
```

New categories appear when MikroTik adds built-in apps. The CI schema validation catches these.

## Service Properties

Each key under `services:` defines one container. Required property: `image`.

| Property | Type | Description |
|---|---|---|
| `image` | string | Container image (omit registry to use `/container/config`'s `registry-url`) |
| `container_name` | string | Explicit name; used as base for file paths under `/container` |
| `hostname` | string | Container hostname |
| `entrypoint` | string or string[] | Override default entrypoint |
| `command` | string or string[] | Override default command |
| `ports` | array | Port mappings (see format section) |
| `environment` | object or array or null | Environment variables (`KEY=value` list or `{KEY: value}` map) |
| `volumes` | array of strings | Volume mounts (e.g., `my-vol:/data`) |
| `configs` | array of objects | Config file placements (`{source, target, mode}`) |
| `restart` | enum | `no`, `always`, `on-failure`, `unless-stopped` |
| `depends_on` | array or object | Service dependency ordering |
| `devices` | array of strings | Device mappings passed to container |
| `user` | string | User to run container as |
| `security_opt` | array of strings | Security options |
| `shm_size` | string | Shared memory size |
| `stop_grace_period` | string or int | Time before SIGKILL |
| `ulimits` | object | Resource limits (e.g., `nofile: {soft: 65536, hard: 65536}`) |
| `build` | object or string | Build configuration (context, dockerfile, args) |
| `healthcheck` | object | Health check (test, interval, timeout, retries, start_period) |
| `stdin_open` | boolean | Keep stdin open |
| `expose` | array | Internal ports (not published to host) |
| `secrets` | array of strings | Secrets to expose |
| `attach` | boolean | Attach to stdio |

## Port Format — Two Styles

RouterOS supports two port mapping string formats. Both are valid; new apps from 7.23beta2+ prefer the colon style.

**Never put an IP address in front of a port.** RouterOS takes the first octet as the published port and shifts every other field left: `"192.168.88.1:8088:8080/tcp:web"` became a live dstnat rule on `dst-port=192`, with the label `8080/tcp`. Both styles break the same way (CHR 7.24.5 x86, and a field report on an RB5009 running 7.22+).[^ip-prefix] `/app` publishes ports on the router's own address, so there is nothing to put there. The manual's port syntax has no IP field either.[^manual-apps] The strict restraml schema still accepts the prefix ([tikoci/restraml#106](https://github.com/tikoci/restraml/issues/106)), so a green schema check doesn't catch it.

### Old OCI-style (pre-7.23)

```text
host_port:container_port[/tcp|/udp][:label]
```

Examples:

```yaml
ports:
  - "8080:80/tcp"
  - "8443:443/tcp:https"
  - "53:53/udp:dns"
```

### New RouterOS style (7.23+)

```text
host_port:container_port[:label][:tcp|:udp]
```

Protocol is appended with colon instead of slash:

```yaml
ports:
  - "8080:80:web:tcp"
  - "8443:443:https:tcp"
  - "53:53:dns:udp"
```

### Long-form (object) syntax

```yaml
ports:
  - target: 80
    published: 8080
    protocol: tcp
    name: web
    app_protocol: http
```

A port labelled `web` makes RouterOS set up a reverse proxy with a generated URL, and port 80 counts as `web` unless labelled otherwise. The health check probes that port, so an app with nothing listening there stays in `starting`. Label ports explicitly.[^manual-apps]

## Placeholders

RouterOS expands these placeholders at deploy time:

| Placeholder | Expands to |
|---|---|
| `[accessIP]` | IP address or hostname used to reach the app from outside |
| `[accessPort]` | Router port mapped to the app's web interface |
| `[accessProto]` | `http` or `https` |
| `[containerIP]` | IP address assigned to the container |
| `[containerInterface]` | Name of the app's VETH interface |
| `[routerIP]` | Router's IP address on the app network |
| `[env:variable]`, `[env:service:variable]` | Another environment variable of the app or of one service |
| `[secret:name]` | A value from the app-level `secrets:` section (see below) |

The manual lists environment values and the default-credentials field as the places placeholders expand.[^manual-apps] It doesn't list port strings (and an address there is parsed wrongly, above) or config content; test a placeholder in a config file before relying on it.

## Secrets

Declare secrets at app level and reference them as `[secret:name]`, or list them under a service to get a file at `/run/secrets/<name>`. RouterOS generates the value when the app runs.[^manual-apps]

```yaml
secrets:
  db_password:
services:
  db:
    image: docker.io/postgres:17
    environment:
      POSTGRES_PASSWORD: "[secret:db_password]"
```

Don't put passwords or keys in `environment:` as literals. The app's YAML is router configuration, so it lands in `/export` and backups (7.23 fixed custom-app YAML missing from exports).

## Configs (Inline Files)

Top-level `configs:` declares config content; services reference them:

```yaml
configs:
  my-config:
    content: |
      server {
        listen 80;
        server_name [accessIP];
      }

services:
  web:
    image: nginx:alpine
    configs:
      - source: my-config
        target: /etc/nginx/conf.d/default.conf
        mode: 0644
```

## Volumes and Networks

```yaml
volumes:
  app-data: {}      # Named volume (null or empty object)

networks:
  app-net:
    name: my-network
    external: true   # Use existing RouterOS network
```

## Store Schema (app-store-urls)

RouterOS can load app collections from URLs configured via `app-store-urls=`. The store format is simply a **YAML array** of /app definitions:

```yaml
- name: app-one
  services:
    web:
      image: nginx:alpine
- name: app-two
  services:
    db:
      image: postgres:16
```

Store files use the `.tikappstore.yaml` extension by convention.

## REST API for /app

```typescript
// List all /app entries (built-in + custom)
const apps = await fetch(`${base}/app`, auth).then(r => r.json());

// Each entry has: .id, name, yaml (raw YAML string), and metadata
// The 'yaml' field is a RouterOS string containing the full YAML document

// Add a custom /app from URL
await fetch(`${base}/app`, {
  method: "PUT",
  ...auth,
  body: JSON.stringify({ yaml: yamlText, "use-https": "no" }),
});
// The new app is disabled: PATCH it with {"disabled": "no"} (see Lifecycle)
```

**Note:** The `/app` endpoint requires the **container** extra package to be installed.

## Lifecycle on the Router

Measured on CHR 7.25.1 (and 7.26beta5 where noted) by tikoci/app-t3code, unless marked as a field report.[^t3code]

- **Before enabling:** `/app` refuses to enable an app until a disk is set with `/app/settings/set disk=<mount-point>`. Format it first (`/disk/format <id> file-system=ext4`; the id is positional).
- **Adding leaves the app disabled.** After `/app/add` or `PUT /rest/app`, run `/app/set [find where name=<app>] disabled=no`, then poll `/container` (`.running` is the string `"true"`).
- **`use-https=yes` needs a cloud DNS name.** Without one (a free-license CHR has no `/ip/cloud`), the app stalls at `wait for reverse proxy`; use `use-https=no` in labs.[^ip-prefix]
- **Fetching YAML from a URL:** `/app/add yaml=([/tool/fetch url="https://…/my.tikapp.yaml" output=user as-value]->"data")`.
- **Never change an installed app's `yaml=` to change settings.** `/app/set … yaml=` recreates the app's volumes, wiping their data even for a comment-only change, and leaves the app disabled (7.25.1 and 7.26beta5). Back up every app-owned volume first if the YAML really must change.
- **Use `/app/update` for a new image and `/app/set environment=` for settings.** `environment=` restarts the container and keeps its volumes, and the value survives `/app/update` and reboots. But it replaces the **whole** list (the YAML's `environment:` is only the starting value), and a string value is split on commas, so set values without commas or rebuild the list from `[/app/get <app> environment]`.
- **Stop with `/app/set … disabled=yes`**, not `/container/stop`: /app restarts a stopped container within about 30 s (field report, RB5009, 7.22+).[^ip-prefix]
- **A redeploy can change the container's IP and recreate its VETH.** Bridge-filter rules that named the old VETH go invalid and are skipped, so isolation fails open. Match on address lists and re-point rules after a redeploy (field report).[^ip-prefix]
- **Check `/ip/reverse-proxy print` after deploying.** A `web` port gets a reverse-proxy entry with a generated URL,[^manual-apps] which can make the app reachable through the router's cloud DNS name.

## JSON Schema for Validation

Two schema variants exist for each /app document:

| Schema | Purpose | Port validation | Env var names |
|---|---|---|---|
| `*.latest.json` | CI/strict validation | Regex patterns enforced | `^[A-Z_][A-Z0-9_]*$` only |
| `*.editor.json` | Editor/SchemaStore UX | No regex (allows autocompletion) | Case-insensitive |

The strict schema has regex `pattern` on port strings which **prevents VSCode autocompletion** — the YAML extension won't suggest values for fields with patterns. The editor variant removes these patterns.

### VSCode Integration

Add to VSCode settings for YAML autocompletion:

```json
{
  "yaml.schemas": {
    "https://tikoci.github.io/restraml/routeros-app-yaml-schema.latest.json": "*.tikapp.yaml",
    "https://tikoci.github.io/restraml/routeros-app-yaml-store-schema.latest.json": "*.tikappstore.yaml"
  }
}
```

Use `.editor.json` URLs for better autocompletion at the cost of less strict validation.

## Version History

- **7.22**: Initial /app support with basic service properties
- **7.23beta2**: New colon-style port format (`:tcp`/`:udp` suffix)
- **7.23+**: Additional service properties (`devices`, `expose`, `secrets`, `attach`)

## Common Mistakes

- **Assuming docker-compose compatibility** — not all properties are supported, some behave differently
- **Using `version:` key** — RouterOS ignores it; not needed
- **Mixing port format styles** in a single entry — each port string must use ONE style exclusively
- **An IP address in a port string** — RouterOS publishes the first octet as the port (see [Port Format](#port-format--two-styles))
- **Editing an installed app's YAML to change a setting** — it wipes the app's volumes; use `environment=` or `/app/update`
- **Secrets as literal `environment:` values** — they end up in `/export`; use `secrets:`
- **Uppercase env var names required** in strict validation — use `*.editor.json` for mixed case
- **Forgetting the container package** — `/app` returns 404 without the `container` extra package
- **Using `deploy:` or `resources:`** — not supported by RouterOS

## Additional Resources

- For RouterOS fundamentals, CLI syntax, REST API: see the `routeros-fundamentals` skill
- For running CHR in QEMU (needed to test /app): see the `routeros-qemu-chr` skill
- MikroTik forum reference: <https://forum.mikrotik.com/t/amm0s-manual-for-custom-app-containers-7-22beta/268036/22>

[^manual-apps]: MikroTik manual, [Apps](https://manual.mikrotik.com/docs/containers/apps/): "Port Mapping", "Runtime Placeholders" and "Secrets".
[^ip-prefix]: [#36](https://github.com/tikoci/routeros-skills/issues/36): CHR 7.24.5 x86 lab (container package, ext4 app disk) reproducing the field report from [adelomer12/routeros-inverterscout](https://github.com/adelomer12/routeros-inverterscout) (RB5009, 7.22+). The `dst-port=192` rule, `use-https` stall and missing `yaml-url` were seen on the CHR; the `/container/stop` and VETH items are from the field report only.
[^t3code]: tikoci/app-t3code, [`AGENTS.md` "Gotchas"](https://github.com/tikoci/app-t3code/blob/037158bbf3c4776cf2be65b03e1d9a2536bceb67/AGENTS.md) and [`docs/research/2026-11-app-set-environment/README.md`](https://github.com/tikoci/app-t3code/blob/037158bbf3c4776cf2be65b03e1d9a2536bceb67/docs/research/2026-11-app-set-environment/README.md): disposable CHRs on 7.25.1 and 7.26beta5 x86 with an Alpine probe app that records volume recreation and restarts.
