<!-- GENERATED from rosetta export v0.12.0-next.123 (inspect 7.24.5, tree 7.26) by scripts/build-refs.ts — do not edit by hand. -->

# routeros-container CLI reference (rosetta v0.12.0-next.123)

Generated slice of the rosetta export covering this skill's owned menus. Regenerate with `bun scripts/build-refs.ts --export <dir>`.

Layers: command paths and settable inputs come from the inspect layer (`commands.tsv`, versioned per release); element fields, settable-vs-read-only kinds, and platform restrictions come from the CLI-reference layer (manual tree, version-less). The owned-menu scope below is authored community judgment, not export data.

| Provenance | Value |
|---|---|
| release_tag | `v0.12.0-next.123` |
| schema_version | `12` |
| source_commit | `84c890ddcb55c80176fc2bdb0d3db038fb73e22f` |
| built_at | `2026-10-21T17:12:26.963Z` |
| docs_manual_version | `7.26` |
| inspect_versions | `7.24.5` |
| cliref_tree | `7.26` |
| cliref_rows_digest | `610ac4a0dde812fb…` (whole-tree digest, not a slice checksum) |
| slice_sha256 | `d6f6afb6bb71de56…` (checksum of this slice's paths and occurrences) |

## How to use this reference

- Command sections below are sorted by path; each lists the settable inputs from the inspect layer.
- Occurrences carry manual-layer details: field kinds (settable vs read-only), `Syscap`/`Package`/`Conditions` restrictions, and official-source links.
- Inspect data and manual data carry different versions (see provenance): a property present in one layer may be absent from the other.
- This reference covers names and kinds only; runtime behavior needs a device.

## Authored scope (not export data)

The slice covers these owned menu prefixes, authored in `scripts/build-refs.ts`:

- `/app`
- `/console/inspect`
- `/container`
- `/interface/bridge/add`
- `/interface/bridge/port`
- `/interface/list/member`
- `/interface/veth/add`
- `/ip/address/add`
- `/ip/firewall/nat/add`
- `/log`
- `/system/device-mode/update`
- `/system/package/apply-changes`
- `/system/package/enable`
- `/system/package/print`
- `/system/package/update`
- `/system/reboot`
- `/system/resource`

## `/app/add` (inspect 7.24.5)

| Property | Description |
|---|---|
| `auto-update` | — |
| `container-command-lines` | string value |
| `copy-from` | — |
| `devices` | — |
| `disabled` | — |
| `environment` | — |
| `extra-mounts` | string value |
| `firewall-redirects` | — |
| `network` | — |
| `network-outgoing-access` | — |
| `network-pvid` | — |
| `required-hw-devices` | string value |
| `required-mounts` | string value |
| `secrets` | string value |
| `use-https` | — |
| `yaml` | string value, min length 1 |

## `/app/cleanup` (inspect 7.24.5)

| Property | Description |
|---|---|
| `numbers` | — |

## `/app/disable` (inspect 7.24.5)

| Property | Description |
|---|---|
| `numbers` | — |

## `/app/edit` (inspect 7.24.5)

| Property | Description |
|---|---|
| `number` | — |
| `value-name` | — |

## `/app/enable` (inspect 7.24.5)

| Property | Description |
|---|---|
| `numbers` | — |

## `/app/export` (inspect 7.24.5)

| Property | Description |
|---|---|
| `compact` | — |
| `file` | — |
| `hide-sensitive` | — |
| `path` | — |
| `show-sensitive` | — |
| `terse` | — |
| `verbose` | — |
| `where` | — |

## `/app/find` (inspect 7.24.5)

| Property | Description |
|---|---|
| `where` | — |

## `/app/get` (inspect 7.24.5)

| Property | Description |
|---|---|
| `as-string` | — |
| `as-string-value` | — |
| `number` | — |
| `value-name` | — |

## `/app/network/find` (inspect 7.24.5)

| Property | Description |
|---|---|
| `where` | — |

## `/app/network/get` (inspect 7.24.5)

| Property | Description |
|---|---|
| `as-string` | — |
| `as-string-value` | — |
| `number` | — |
| `value-name` | — |

## `/app/network/print` (inspect 7.24.5)

| Property | Description |
|---|---|
| `append` | — |
| `as-value` | — |
| `brief` | — |
| `comments` | — |
| `count-only` | — |
| `detail` | — |
| `file` | — |
| `follow` | — |
| `follow-only` | — |
| `from` | — |
| `group-by` | — |
| `interval` | 00:00:00.200.. (time interval) |
| `on-event` | script |
| `order-by` | — |
| `proplist` | — |
| `show-ids` | — |
| `terse` | — |
| `timestamp` | — |
| `value-list` | — |
| `where` | — |
| `without-paging` | — |

## `/app/network/reset` (inspect 7.24.5)

| Property | Description |
|---|---|
| `allow-outgoing-access` | — |
| `name` | string value |
| `numbers` | — |

## `/app/print` (inspect 7.24.5)

| Property | Description |
|---|---|
| `append` | — |
| `as-value` | — |
| `brief` | — |
| `comments` | — |
| `count-only` | — |
| `detail` | — |
| `file` | — |
| `follow` | — |
| `follow-only` | — |
| `from` | — |
| `group-by` | — |
| `interval` | 00:00:00.200.. (time interval) |
| `on-event` | script |
| `order-by` | — |
| `proplist` | — |
| `show-ids` | — |
| `show-sensitive` | — |
| `terse` | — |
| `timestamp` | — |
| `value-list` | — |
| `where` | — |
| `without-paging` | — |

## `/app/remove` (inspect 7.24.5)

| Property | Description |
|---|---|
| `numbers` | — |

## `/app/reset` (inspect 7.24.5)

| Property | Description |
|---|---|
| `auto-update` | — |
| `container-command-lines` | string value |
| `devices` | — |
| `disabled` | — |
| `environment` | — |
| `extra-mounts` | string value |
| `firewall-redirects` | — |
| `network` | — |
| `network-outgoing-access` | — |
| `network-pvid` | — |
| `numbers` | — |
| `required-hw-devices` | string value |
| `required-mounts` | string value |
| `secrets` | string value |
| `use-https` | — |
| `yaml` | string value, min length 1 |

## `/app/restart` (inspect 7.24.5)

| Property | Description |
|---|---|
| `numbers` | — |

## `/app/set` (inspect 7.24.5)

| Property | Description |
|---|---|
| `auto-update` | — |
| `container-command-lines` | string value |
| `devices` | — |
| `disabled` | — |
| `environment` | — |
| `extra-mounts` | string value |
| `firewall-redirects` | — |
| `network` | — |
| `network-outgoing-access` | — |
| `network-pvid` | — |
| `numbers` | — |
| `required-hw-devices` | string value |
| `required-mounts` | string value |
| `secrets` | string value |
| `use-https` | — |
| `yaml` | string value, min length 1 |

## `/app/settings/edit` (inspect 7.24.5)

| Property | Description |
|---|---|
| `value-name` | — |

## `/app/settings/export` (inspect 7.24.5)

| Property | Description |
|---|---|
| `compact` | — |
| `file` | — |
| `hide-sensitive` | — |
| `path` | — |
| `show-sensitive` | — |
| `terse` | — |
| `verbose` | — |
| `where` | — |

## `/app/settings/get` (inspect 7.24.5)

| Property | Description |
|---|---|
| `as-string` | — |
| `as-string-value` | — |
| `value-name` | — |

## `/app/settings/print` (inspect 7.24.5)

| Property | Description |
|---|---|
| `as-value` | — |
| `comments` | — |
| `file` | — |
| `interval` | 00:00:00.200.. (time interval) |
| `without-paging` | — |

## `/app/settings/reset` (inspect 7.24.5)

| Property | Description |
|---|---|
| `app-store-urls` | string value, min length 1 |
| `auto-update` | — |
| `disk` | — |
| `download-path` | — |
| `lan-bridge` | — |
| `media-path` | — |
| `registry-mirrors` | string value, min length 1 |
| `router-ip` | A.B.C.D (IP address) |
| `show-in-webfig` | — |

## `/app/settings/set` (inspect 7.24.5)

| Property | Description |
|---|---|
| `app-store-urls` | string value, min length 1 |
| `auto-update` | — |
| `disk` | — |
| `download-path` | — |
| `lan-bridge` | — |
| `media-path` | — |
| `registry-mirrors` | string value, min length 1 |
| `router-ip` | A.B.C.D (IP address) |
| `show-in-webfig` | — |

## `/app/setup` (inspect 7.24.5)

No settable inputs.

## `/app/unset` (inspect 7.24.5)

| Property | Description |
|---|---|
| `numbers` | — |
| `value-name` | — |

## `/app/update` (inspect 7.24.5)

| Property | Description |
|---|---|
| `numbers` | — |

## `/console/inspect` (inspect 7.24.5)

| Property | Description |
|---|---|
| `as-value` | — |
| `input` | string value |
| `path` | string value |
| `proplist` | — |
| `request` | self\|child\|completion\|highlight\|syntax\|error[,Request*] |
| `without-paging` | — |

## `/container/add` (inspect 7.24.5)

| Property | Description |
|---|---|
| `check-certificate` | — |
| `cmd` | string value |
| `comment` | string value |
| `copy-from` | — |
| `cpu-list` | — |
| `default-dns` | — |
| `devices` | — |
| `dns` | — |
| `domain-name` | string value |
| `entrypoint` | string value |
| `env` | — |
| `envlists` | — |
| `file` | — |
| `healthcheck-cmd` | string value |
| `healthcheck-interval` | 1s..7w17h2m47s295ms (time interval) |
| `healthcheck-retries` | — |
| `healthcheck-start-interval` | 1s..7w17h2m47s295ms (time interval) |
| `healthcheck-start-period` | time interval |
| `healthcheck-status` | string value |
| `healthcheck-timeout` | 1s..7w17h2m47s295ms (time interval) |
| `hostname` | string value |
| `hosts` | string value, min length 1 |
| `ignore-remote-image-change` | — |
| `interface` | — |
| `layer-dir` | — |
| `logging` | — |
| `memory-high` | — |
| `memory-max` | — |
| `mount` | — |
| `mountlists` | — |
| `name` | string value |
| `privileged` | — |
| `remote-image` | string value |
| `restart-interval` | time interval |
| `restart-max-count` | — |
| `restart-policy` | — |
| `root-dir` | — |
| `shell` | string value |
| `shm-size` | — |
| `start-on-boot` | — |
| `stop-on-unhealthy` | — |
| `stop-signal` | — |
| `stop-time` | time interval |
| `swap-max` | — |
| `tmpfs` | string value, min length 1 |
| `user` | string value |
| `workdir` | string value |

## `/container/comment` (inspect 7.24.5)

| Property | Description |
|---|---|
| `comment` | string value |
| `numbers` | — |

## `/container/config/edit` (inspect 7.24.5)

| Property | Description |
|---|---|
| `value-name` | — |

## `/container/config/export` (inspect 7.24.5)

| Property | Description |
|---|---|
| `compact` | — |
| `file` | — |
| `hide-sensitive` | — |
| `path` | — |
| `show-sensitive` | — |
| `terse` | — |
| `verbose` | — |
| `where` | — |

## `/container/config/get` (inspect 7.24.5)

| Property | Description |
|---|---|
| `as-string` | — |
| `as-string-value` | — |
| `value-name` | — |

## `/container/config/print` (inspect 7.24.5)

| Property | Description |
|---|---|
| `as-value` | — |
| `comments` | — |
| `file` | — |
| `interval` | 00:00:00.200.. (time interval) |
| `show-sensitive` | — |
| `without-paging` | — |

## `/container/config/reset` (inspect 7.24.5)

| Property | Description |
|---|---|
| `layer-dir` | — |
| `memory-high` | — |
| `memory-max` | — |
| `password` | string value |
| `registry-url` | string value |
| `swap-max` | — |
| `tmpdir` | — |
| `username` | string value |

## `/container/config/set` (inspect 7.24.5)

| Property | Description |
|---|---|
| `layer-dir` | — |
| `memory-high` | — |
| `memory-max` | — |
| `password` | string value |
| `registry-url` | string value |
| `swap-max` | — |
| `tmpdir` | — |
| `username` | string value |

## `/container/edit` (inspect 7.24.5)

| Property | Description |
|---|---|
| `number` | — |
| `value-name` | — |

## `/container/envs/add` (inspect 7.24.5)

| Property | Description |
|---|---|
| `comment` | string value |
| `copy-from` | — |
| `disabled` | — |
| `key` | string value |
| `list` | — |
| `value` | string value |

## `/container/envs/comment` (inspect 7.24.5)

| Property | Description |
|---|---|
| `comment` | string value |
| `numbers` | — |

## `/container/envs/disable` (inspect 7.24.5)

| Property | Description |
|---|---|
| `numbers` | — |

## `/container/envs/edit` (inspect 7.24.5)

| Property | Description |
|---|---|
| `number` | — |
| `value-name` | — |

## `/container/envs/enable` (inspect 7.24.5)

| Property | Description |
|---|---|
| `numbers` | — |

## `/container/envs/export` (inspect 7.24.5)

| Property | Description |
|---|---|
| `compact` | — |
| `file` | — |
| `hide-sensitive` | — |
| `path` | — |
| `show-sensitive` | — |
| `terse` | — |
| `verbose` | — |
| `where` | — |

## `/container/envs/find` (inspect 7.24.5)

| Property | Description |
|---|---|
| `where` | — |

## `/container/envs/get` (inspect 7.24.5)

| Property | Description |
|---|---|
| `as-string` | — |
| `as-string-value` | — |
| `number` | — |
| `value-name` | — |

## `/container/envs/print` (inspect 7.24.5)

| Property | Description |
|---|---|
| `append` | — |
| `as-value` | — |
| `brief` | — |
| `comments` | — |
| `count-only` | — |
| `detail` | — |
| `file` | — |
| `follow` | — |
| `follow-only` | — |
| `from` | — |
| `group-by` | — |
| `interval` | 00:00:00.200.. (time interval) |
| `on-event` | script |
| `order-by` | — |
| `proplist` | — |
| `show-ids` | — |
| `terse` | — |
| `timestamp` | — |
| `value-list` | — |
| `where` | — |
| `without-paging` | — |

## `/container/envs/remove` (inspect 7.24.5)

| Property | Description |
|---|---|
| `numbers` | — |

## `/container/envs/reset` (inspect 7.24.5)

| Property | Description |
|---|---|
| `comment` | string value |
| `disabled` | — |
| `key` | string value |
| `list` | — |
| `numbers` | — |
| `value` | string value |

## `/container/envs/set` (inspect 7.24.5)

| Property | Description |
|---|---|
| `comment` | string value |
| `disabled` | — |
| `key` | string value |
| `list` | — |
| `numbers` | — |
| `value` | string value |

## `/container/export` (inspect 7.24.5)

| Property | Description |
|---|---|
| `compact` | — |
| `file` | — |
| `hide-sensitive` | — |
| `path` | — |
| `show-sensitive` | — |
| `terse` | — |
| `verbose` | — |
| `where` | — |

## `/container/find` (inspect 7.24.5)

| Property | Description |
|---|---|
| `where` | — |

## `/container/get` (inspect 7.24.5)

| Property | Description |
|---|---|
| `as-string` | — |
| `as-string-value` | — |
| `number` | — |
| `value-name` | — |

## `/container/kill` (inspect 7.24.5)

| Property | Description |
|---|---|
| `as-value` | — |
| `number` | — |
| `signal` | — |

## `/container/layers/find` (inspect 7.24.5)

| Property | Description |
|---|---|
| `where` | — |

## `/container/layers/get` (inspect 7.24.5)

| Property | Description |
|---|---|
| `as-string` | — |
| `as-string-value` | — |
| `number` | — |
| `value-name` | — |

## `/container/layers/print` (inspect 7.24.5)

| Property | Description |
|---|---|
| `append` | — |
| `as-value` | — |
| `brief` | — |
| `comments` | — |
| `count-only` | — |
| `detail` | — |
| `file` | — |
| `follow` | — |
| `follow-only` | — |
| `from` | — |
| `group-by` | — |
| `interval` | 00:00:00.200.. (time interval) |
| `on-event` | script |
| `order-by` | — |
| `proplist` | — |
| `show-ids` | — |
| `terse` | — |
| `timestamp` | — |
| `value-list` | — |
| `where` | — |
| `without-paging` | — |

## `/container/log/find` (inspect 7.24.5)

| Property | Description |
|---|---|
| `where` | — |

## `/container/log/get` (inspect 7.24.5)

| Property | Description |
|---|---|
| `as-string` | — |
| `as-string-value` | — |
| `number` | — |
| `value-name` | — |

## `/container/log/print` (inspect 7.24.5)

| Property | Description |
|---|---|
| `append` | — |
| `as-value` | — |
| `brief` | — |
| `comments` | — |
| `count-only` | — |
| `detail` | — |
| `file` | — |
| `follow` | — |
| `follow-only` | — |
| `group-by` | — |
| `interval` | 00:00:00.200.. (time interval) |
| `on-event` | script |
| `order-by` | — |
| `proplist` | — |
| `show-ids` | — |
| `terse` | — |
| `timestamp` | — |
| `value-list` | — |
| `where` | — |
| `without-paging` | — |

## `/container/mounts/add` (inspect 7.24.5)

| Property | Description |
|---|---|
| `comment` | string value |
| `copy-from` | — |
| `disabled` | — |
| `dst` | string value |
| `list` | — |
| `mode` | — |
| `src` | — |

## `/container/mounts/comment` (inspect 7.24.5)

| Property | Description |
|---|---|
| `comment` | string value |
| `numbers` | — |

## `/container/mounts/disable` (inspect 7.24.5)

| Property | Description |
|---|---|
| `numbers` | — |

## `/container/mounts/edit` (inspect 7.24.5)

| Property | Description |
|---|---|
| `number` | — |
| `value-name` | — |

## `/container/mounts/enable` (inspect 7.24.5)

| Property | Description |
|---|---|
| `numbers` | — |

## `/container/mounts/export` (inspect 7.24.5)

| Property | Description |
|---|---|
| `compact` | — |
| `file` | — |
| `hide-sensitive` | — |
| `path` | — |
| `show-sensitive` | — |
| `terse` | — |
| `verbose` | — |
| `where` | — |

## `/container/mounts/find` (inspect 7.24.5)

| Property | Description |
|---|---|
| `where` | — |

## `/container/mounts/get` (inspect 7.24.5)

| Property | Description |
|---|---|
| `as-string` | — |
| `as-string-value` | — |
| `number` | — |
| `value-name` | — |

## `/container/mounts/print` (inspect 7.24.5)

| Property | Description |
|---|---|
| `append` | — |
| `as-value` | — |
| `brief` | — |
| `comments` | — |
| `count-only` | — |
| `detail` | — |
| `file` | — |
| `follow` | — |
| `follow-only` | — |
| `from` | — |
| `group-by` | — |
| `interval` | 00:00:00.200.. (time interval) |
| `on-event` | script |
| `order-by` | — |
| `proplist` | — |
| `show-ids` | — |
| `terse` | — |
| `timestamp` | — |
| `value-list` | — |
| `where` | — |
| `without-paging` | — |

## `/container/mounts/remove` (inspect 7.24.5)

| Property | Description |
|---|---|
| `numbers` | — |

## `/container/mounts/reset` (inspect 7.24.5)

| Property | Description |
|---|---|
| `comment` | string value |
| `disabled` | — |
| `dst` | string value |
| `list` | — |
| `mode` | — |
| `numbers` | — |
| `src` | — |

## `/container/mounts/set` (inspect 7.24.5)

| Property | Description |
|---|---|
| `comment` | string value |
| `disabled` | — |
| `dst` | string value |
| `list` | — |
| `mode` | — |
| `numbers` | — |
| `src` | — |

## `/container/print` (inspect 7.24.5)

| Property | Description |
|---|---|
| `append` | — |
| `as-value` | — |
| `brief` | — |
| `comments` | — |
| `count-only` | — |
| `detail` | — |
| `file` | — |
| `follow` | — |
| `follow-only` | — |
| `from` | — |
| `group-by` | — |
| `interval` | 00:00:00.200.. (time interval) |
| `json` | — |
| `on-event` | script |
| `order-by` | — |
| `proplist` | — |
| `show-ids` | — |
| `terse` | — |
| `timestamp` | — |
| `value-list` | — |
| `where` | — |
| `without-paging` | — |

## `/container/remove` (inspect 7.24.5)

| Property | Description |
|---|---|
| `numbers` | — |

## `/container/repull` (inspect 7.24.5)

| Property | Description |
|---|---|
| `as-value` | — |
| `file` | — |
| `number` | — |
| `remote-image` | string value |

## `/container/reset` (inspect 7.24.5)

| Property | Description |
|---|---|
| `check-certificate` | — |
| `cmd` | string value |
| `comment` | string value |
| `cpu-list` | — |
| `default-dns` | — |
| `devices` | — |
| `dns` | — |
| `domain-name` | string value |
| `entrypoint` | string value |
| `env` | — |
| `envlists` | — |
| `file` | — |
| `healthcheck-cmd` | string value |
| `healthcheck-interval` | 1s..7w17h2m47s295ms (time interval) |
| `healthcheck-retries` | — |
| `healthcheck-start-interval` | 1s..7w17h2m47s295ms (time interval) |
| `healthcheck-start-period` | time interval |
| `healthcheck-status` | string value |
| `healthcheck-timeout` | 1s..7w17h2m47s295ms (time interval) |
| `hostname` | string value |
| `hosts` | string value, min length 1 |
| `ignore-remote-image-change` | — |
| `interface` | — |
| `layer-dir` | — |
| `logging` | — |
| `memory-high` | — |
| `memory-max` | — |
| `mount` | — |
| `mountlists` | — |
| `name` | string value |
| `numbers` | — |
| `privileged` | — |
| `remote-image` | string value |
| `restart-interval` | time interval |
| `restart-max-count` | — |
| `restart-policy` | — |
| `root-dir` | — |
| `shell` | string value |
| `shm-size` | — |
| `start-on-boot` | — |
| `stop-on-unhealthy` | — |
| `stop-signal` | — |
| `stop-time` | time interval |
| `swap-max` | — |
| `tmpfs` | string value, min length 1 |
| `user` | string value |
| `workdir` | string value |

## `/container/restart` (inspect 7.24.5)

| Property | Description |
|---|---|
| `as-value` | — |
| `number` | — |

## `/container/run` (inspect 7.24.5)

| Property | Description |
|---|---|
| `as-value` | — |
| `cmd` | string value |
| `detach` | — |
| `entrypoint` | string value |
| `interactive` | — |
| `line-separator` | string value |
| `number` | — |
| `tty` | — |
| `user` | string value |
| `workdir` | string value |

## `/container/save` (inspect 7.24.5)

| Property | Description |
|---|---|
| `commit` | — |
| `file` | — |
| `name` | string value |
| `number` | — |

## `/container/set` (inspect 7.24.5)

| Property | Description |
|---|---|
| `check-certificate` | — |
| `cmd` | string value |
| `comment` | string value |
| `cpu-list` | — |
| `default-dns` | — |
| `devices` | — |
| `dns` | — |
| `domain-name` | string value |
| `entrypoint` | string value |
| `env` | — |
| `envlists` | — |
| `file` | — |
| `healthcheck-cmd` | string value |
| `healthcheck-interval` | 1s..7w17h2m47s295ms (time interval) |
| `healthcheck-retries` | — |
| `healthcheck-start-interval` | 1s..7w17h2m47s295ms (time interval) |
| `healthcheck-start-period` | time interval |
| `healthcheck-status` | string value |
| `healthcheck-timeout` | 1s..7w17h2m47s295ms (time interval) |
| `hostname` | string value |
| `hosts` | string value, min length 1 |
| `ignore-remote-image-change` | — |
| `interface` | — |
| `layer-dir` | — |
| `logging` | — |
| `memory-high` | — |
| `memory-max` | — |
| `mount` | — |
| `mountlists` | — |
| `name` | string value |
| `numbers` | — |
| `privileged` | — |
| `remote-image` | string value |
| `restart-interval` | time interval |
| `restart-max-count` | — |
| `restart-policy` | — |
| `root-dir` | — |
| `shell` | string value |
| `shm-size` | — |
| `start-on-boot` | — |
| `stop-on-unhealthy` | — |
| `stop-signal` | — |
| `stop-time` | time interval |
| `swap-max` | — |
| `tmpfs` | string value, min length 1 |
| `user` | string value |
| `workdir` | string value |

## `/container/shell` (inspect 7.24.5)

| Property | Description |
|---|---|
| `as-value` | — |
| `cmd` | string value |
| `line-separator` | string value |
| `no-sh` | — |
| `number` | — |
| `timeout` | — |
| `user` | string value |
| `workdir` | string value |

## `/container/start` (inspect 7.24.5)

| Property | Description |
|---|---|
| `numbers` | — |

## `/container/stop` (inspect 7.24.5)

| Property | Description |
|---|---|
| `numbers` | — |

## `/container/unset` (inspect 7.24.5)

| Property | Description |
|---|---|
| `numbers` | — |
| `value-name` | — |

## `/container/update` (inspect 7.24.5)

| Property | Description |
|---|---|
| `as-value` | — |
| `number` | — |

## `/interface/bridge/add` (inspect 7.24.5)

| Property | Description |
|---|---|
| `admin-mac` | AB[:\|-\|.]CD[:\|-\|.]EF[:\|-\|.]GH[:\|-\|.]IJ[:\|-\|.]KL (MAC address) |
| `ageing-time` | 10s..1w4d13h46m40s (time interval) |
| `arp` | — |
| `arp-timeout` | — |
| `auto-mac` | — |
| `comment` | string value |
| `copy-from` | — |
| `dhcp-agent-circuit-id` | string value |
| `dhcp-agent-remote-id` | string value |
| `dhcp-snooping` | — |
| `dhcpv6-agent-circuit-id` | string value |
| `dhcpv6-agent-remote-id` | string value |
| `dhcpv6-snooping` | — |
| `disabled` | — |
| `ether-type` | — |
| `fast-forward` | — |
| `forward-delay` | 4s..30s (time interval) |
| `forward-reserved-addresses` | — |
| `frame-types` | — |
| `igmp-snooping` | — |
| `igmp-version` | — |
| `ingress-filtering` | — |
| `last-member-interval` | 1s..71w2h27m52s950ms (time interval) |
| `last-member-query-count` | — |
| `max-hops` | — |
| `max-learned-entries` | — |
| `max-message-age` | 6s..40s (time interval) |
| `membership-interval` | 1s..71w2h27m52s950ms (time interval) |
| `mlag-heartbeat` | — |
| `mlag-peer-port` | — |
| `mlag-priority` | — |
| `mld-version` | — |
| `mtu` | — |
| `multicast-querier` | — |
| `multicast-router` | — |
| `mvrp` | — |
| `name` | string value |
| `port-cost-mode` | — |
| `priority` | — |
| `protocol-mode` | — |
| `pvid` | — |
| `querier-interval` | 1s..71w2h27m52s950ms (time interval) |
| `querier-uses-bridge-address` | — |
| `query-interval` | 1s..71w2h27m52s950ms (time interval) |
| `query-response-interval` | 1s..71w2h27m52s950ms (time interval) |
| `ra-guard` | — |
| `region-name` | string value |
| `region-revision` | — |
| `startup-query-count` | — |
| `startup-query-interval` | 1s..71w2h27m52s950ms (time interval) |
| `transmit-hold-count` | — |
| `vlan-filtering` | — |

## `/interface/bridge/port/add` (inspect 7.24.5)

| Property | Description |
|---|---|
| `auto-isolate` | — |
| `bpdu-guard` | — |
| `bridge` | — |
| `broadcast-flood` | — |
| `comment` | string value |
| `copy-from` | — |
| `disabled` | — |
| `edge` | — |
| `fast-leave` | — |
| `frame-types` | — |
| `horizon` | — |
| `hw` | — |
| `ingress-filtering` | — |
| `interface` | — |
| `internal-path-cost` | — |
| `learn` | — |
| `multicast-router` | — |
| `mvrp-applicant-state` | — |
| `mvrp-registrar-state` | — |
| `path-cost` | — |
| `place-before` | — |
| `point-to-point` | — |
| `priority` | — |
| `pvid` | — |
| `restricted-role` | — |
| `restricted-tcn` | — |
| `tag-stacking` | — |
| `trusted` | — |
| `trusted-dhcpv6` | — |
| `trusted-ra` | — |
| `unknown-multicast-flood` | — |
| `unknown-unicast-flood` | — |

## `/interface/bridge/port/comment` (inspect 7.24.5)

| Property | Description |
|---|---|
| `comment` | string value |
| `numbers` | — |

## `/interface/bridge/port/disable` (inspect 7.24.5)

| Property | Description |
|---|---|
| `numbers` | — |

## `/interface/bridge/port/edit` (inspect 7.24.5)

| Property | Description |
|---|---|
| `number` | — |
| `value-name` | — |

## `/interface/bridge/port/enable` (inspect 7.24.5)

| Property | Description |
|---|---|
| `numbers` | — |

## `/interface/bridge/port/export` (inspect 7.24.5)

| Property | Description |
|---|---|
| `compact` | — |
| `file` | — |
| `hide-sensitive` | — |
| `path` | — |
| `show-sensitive` | — |
| `terse` | — |
| `verbose` | — |
| `where` | — |

## `/interface/bridge/port/find` (inspect 7.24.5)

| Property | Description |
|---|---|
| `where` | — |

## `/interface/bridge/port/get` (inspect 7.24.5)

| Property | Description |
|---|---|
| `as-string` | — |
| `as-string-value` | — |
| `number` | — |
| `value-name` | — |

## `/interface/bridge/port/monitor` (inspect 7.24.5)

| Property | Description |
|---|---|
| `append` | — |
| `as-value` | — |
| `do` | script |
| `duration` | time interval |
| `file` | — |
| `freeze-frame-interval` | 00:00:00.020..00:00:30 (time interval) |
| `interval` | 00:00:00.020..00:00:05 (time interval) |
| `numbers` | — |
| `once` | — |
| `proplist` | — |
| `without-paging` | — |

## `/interface/bridge/port/move` (inspect 7.24.5)

| Property | Description |
|---|---|
| `destination` | — |
| `numbers` | — |

## `/interface/bridge/port/mst-override/add` (inspect 7.24.5)

| Property | Description |
|---|---|
| `comment` | string value |
| `copy-from` | — |
| `disabled` | — |
| `identifier` | — |
| `interface` | — |
| `internal-path-cost` | — |
| `priority` | — |

## `/interface/bridge/port/mst-override/comment` (inspect 7.24.5)

| Property | Description |
|---|---|
| `comment` | string value |
| `numbers` | — |

## `/interface/bridge/port/mst-override/disable` (inspect 7.24.5)

| Property | Description |
|---|---|
| `numbers` | — |

## `/interface/bridge/port/mst-override/edit` (inspect 7.24.5)

| Property | Description |
|---|---|
| `number` | — |
| `value-name` | — |

## `/interface/bridge/port/mst-override/enable` (inspect 7.24.5)

| Property | Description |
|---|---|
| `numbers` | — |

## `/interface/bridge/port/mst-override/export` (inspect 7.24.5)

| Property | Description |
|---|---|
| `compact` | — |
| `file` | — |
| `hide-sensitive` | — |
| `path` | — |
| `show-sensitive` | — |
| `terse` | — |
| `verbose` | — |
| `where` | — |

## `/interface/bridge/port/mst-override/find` (inspect 7.24.5)

| Property | Description |
|---|---|
| `where` | — |

## `/interface/bridge/port/mst-override/get` (inspect 7.24.5)

| Property | Description |
|---|---|
| `as-string` | — |
| `as-string-value` | — |
| `number` | — |
| `value-name` | — |

## `/interface/bridge/port/mst-override/monitor` (inspect 7.24.5)

| Property | Description |
|---|---|
| `append` | — |
| `as-value` | — |
| `do` | script |
| `duration` | time interval |
| `file` | — |
| `freeze-frame-interval` | 00:00:00.020..00:00:30 (time interval) |
| `interval` | 00:00:00.020..00:00:05 (time interval) |
| `numbers` | — |
| `once` | — |
| `proplist` | — |
| `without-paging` | — |

## `/interface/bridge/port/mst-override/print` (inspect 7.24.5)

| Property | Description |
|---|---|
| `append` | — |
| `as-value` | — |
| `brief` | — |
| `comments` | — |
| `count-only` | — |
| `debug` | — |
| `detail` | — |
| `file` | — |
| `follow` | — |
| `follow-only` | — |
| `from` | — |
| `group-by` | — |
| `interval` | 00:00:00.200.. (time interval) |
| `on-event` | script |
| `order-by` | — |
| `proplist` | — |
| `show-ids` | — |
| `terse` | — |
| `timestamp` | — |
| `value-list` | — |
| `where` | — |
| `without-paging` | — |

## `/interface/bridge/port/mst-override/remove` (inspect 7.24.5)

| Property | Description |
|---|---|
| `numbers` | — |

## `/interface/bridge/port/mst-override/reset` (inspect 7.24.5)

| Property | Description |
|---|---|
| `comment` | string value |
| `disabled` | — |
| `identifier` | — |
| `interface` | — |
| `internal-path-cost` | — |
| `numbers` | — |
| `priority` | — |

## `/interface/bridge/port/mst-override/set` (inspect 7.24.5)

| Property | Description |
|---|---|
| `comment` | string value |
| `disabled` | — |
| `identifier` | — |
| `interface` | — |
| `internal-path-cost` | — |
| `numbers` | — |
| `priority` | — |

## `/interface/bridge/port/mst-override/unset` (inspect 7.24.5)

| Property | Description |
|---|---|
| `numbers` | — |
| `value-name` | — |

## `/interface/bridge/port/print` (inspect 7.24.5)

| Property | Description |
|---|---|
| `append` | — |
| `as-value` | — |
| `brief` | — |
| `comments` | — |
| `count-only` | — |
| `debug` | — |
| `detail` | — |
| `file` | — |
| `follow` | — |
| `follow-only` | — |
| `from` | — |
| `group-by` | — |
| `interval` | 00:00:00.200.. (time interval) |
| `on-event` | script |
| `order-by` | — |
| `proplist` | — |
| `show-ids` | — |
| `stats` | — |
| `terse` | — |
| `timestamp` | — |
| `value-list` | — |
| `where` | — |
| `without-paging` | — |

## `/interface/bridge/port/remove` (inspect 7.24.5)

| Property | Description |
|---|---|
| `numbers` | — |

## `/interface/bridge/port/reset` (inspect 7.24.5)

| Property | Description |
|---|---|
| `auto-isolate` | — |
| `bpdu-guard` | — |
| `bridge` | — |
| `broadcast-flood` | — |
| `comment` | string value |
| `disabled` | — |
| `edge` | — |
| `fast-leave` | — |
| `frame-types` | — |
| `horizon` | — |
| `hw` | — |
| `ingress-filtering` | — |
| `interface` | — |
| `internal-path-cost` | — |
| `learn` | — |
| `multicast-router` | — |
| `mvrp-applicant-state` | — |
| `mvrp-registrar-state` | — |
| `numbers` | — |
| `path-cost` | — |
| `point-to-point` | — |
| `priority` | — |
| `pvid` | — |
| `restricted-role` | — |
| `restricted-tcn` | — |
| `tag-stacking` | — |
| `trusted` | — |
| `trusted-dhcpv6` | — |
| `trusted-ra` | — |
| `unknown-multicast-flood` | — |
| `unknown-unicast-flood` | — |

## `/interface/bridge/port/set` (inspect 7.24.5)

| Property | Description |
|---|---|
| `auto-isolate` | — |
| `bpdu-guard` | — |
| `bridge` | — |
| `broadcast-flood` | — |
| `comment` | string value |
| `disabled` | — |
| `edge` | — |
| `fast-leave` | — |
| `frame-types` | — |
| `horizon` | — |
| `hw` | — |
| `ingress-filtering` | — |
| `interface` | — |
| `internal-path-cost` | — |
| `learn` | — |
| `multicast-router` | — |
| `mvrp-applicant-state` | — |
| `mvrp-registrar-state` | — |
| `numbers` | — |
| `path-cost` | — |
| `point-to-point` | — |
| `priority` | — |
| `pvid` | — |
| `restricted-role` | — |
| `restricted-tcn` | — |
| `tag-stacking` | — |
| `trusted` | — |
| `trusted-dhcpv6` | — |
| `trusted-ra` | — |
| `unknown-multicast-flood` | — |
| `unknown-unicast-flood` | — |

## `/interface/bridge/port/unset` (inspect 7.24.5)

| Property | Description |
|---|---|
| `numbers` | — |
| `value-name` | — |

## `/interface/list/member/add` (inspect 7.24.5)

| Property | Description |
|---|---|
| `comment` | string value |
| `copy-from` | — |
| `disabled` | — |
| `interface` | — |
| `list` | — |

## `/interface/list/member/comment` (inspect 7.24.5)

| Property | Description |
|---|---|
| `comment` | string value |
| `numbers` | — |

## `/interface/list/member/disable` (inspect 7.24.5)

| Property | Description |
|---|---|
| `numbers` | — |

## `/interface/list/member/edit` (inspect 7.24.5)

| Property | Description |
|---|---|
| `number` | — |
| `value-name` | — |

## `/interface/list/member/enable` (inspect 7.24.5)

| Property | Description |
|---|---|
| `numbers` | — |

## `/interface/list/member/export` (inspect 7.24.5)

| Property | Description |
|---|---|
| `compact` | — |
| `file` | — |
| `hide-sensitive` | — |
| `path` | — |
| `show-sensitive` | — |
| `terse` | — |
| `verbose` | — |
| `where` | — |

## `/interface/list/member/find` (inspect 7.24.5)

| Property | Description |
|---|---|
| `where` | — |

## `/interface/list/member/get` (inspect 7.24.5)

| Property | Description |
|---|---|
| `as-string` | — |
| `as-string-value` | — |
| `number` | — |
| `value-name` | — |

## `/interface/list/member/print` (inspect 7.24.5)

| Property | Description |
|---|---|
| `append` | — |
| `as-value` | — |
| `brief` | — |
| `comments` | — |
| `count-only` | — |
| `detail` | — |
| `file` | — |
| `follow` | — |
| `follow-only` | — |
| `from` | — |
| `group-by` | — |
| `interval` | 00:00:00.200.. (time interval) |
| `on-event` | script |
| `order-by` | — |
| `proplist` | — |
| `show-ids` | — |
| `terse` | — |
| `timestamp` | — |
| `value-list` | — |
| `where` | — |
| `without-paging` | — |

## `/interface/list/member/remove` (inspect 7.24.5)

| Property | Description |
|---|---|
| `numbers` | — |

## `/interface/list/member/reset` (inspect 7.24.5)

| Property | Description |
|---|---|
| `comment` | string value |
| `disabled` | — |
| `interface` | — |
| `list` | — |
| `numbers` | — |

## `/interface/list/member/set` (inspect 7.24.5)

| Property | Description |
|---|---|
| `comment` | string value |
| `disabled` | — |
| `interface` | — |
| `list` | — |
| `numbers` | — |

## `/interface/veth/add` (inspect 7.24.5)

| Property | Description |
|---|---|
| `address` | — |
| `comment` | string value |
| `container-mac-address` | AB[:\|-\|.]CD[:\|-\|.]EF[:\|-\|.]GH[:\|-\|.]IJ[:\|-\|.]KL (MAC address) |
| `copy-from` | — |
| `dhcp` | — |
| `disabled` | — |
| `gateway` | — |
| `gateway6` | — |
| `mac-address` | AB[:\|-\|.]CD[:\|-\|.]EF[:\|-\|.]GH[:\|-\|.]IJ[:\|-\|.]KL (MAC address) |
| `name` | string value |

## `/ip/address/add` (inspect 7.24.5)

| Property | Description |
|---|---|
| `address` | A.B.C.D (IP address) |
| `broadcast` | A.B.C.D (IP address) |
| `comment` | string value |
| `copy-from` | — |
| `disabled` | — |
| `interface` | — |
| `netmask` | A.B.C.D (IP address) |
| `network` | A.B.C.D (IP address) |

## `/ip/firewall/nat/add` (inspect 7.24.5)

| Property | Description |
|---|---|
| `action` | — |
| `address-list` | — |
| `address-list-timeout` | — |
| `chain` | — |
| `comment` | string value |
| `connection-bytes` | — |
| `connection-limit` | — |
| `connection-mark` | — |
| `connection-rate` | — |
| `connection-type` | — |
| `content` | — |
| `copy-from` | — |
| `disabled` | — |
| `dscp` | — |
| `dst-address` | — |
| `dst-address-list` | — |
| `dst-address-type` | — |
| `dst-limit` | — |
| `dst-port` | — |
| `fragment` | — |
| `hotspot` | — |
| `icmp-options` | — |
| `in-bridge-port` | — |
| `in-bridge-port-list` | — |
| `in-interface` | — |
| `in-interface-list` | — |
| `ingress-priority` | — |
| `ipsec-policy` | — |
| `ipv4-options` | — |
| `jump-target` | — |
| `layer7-protocol` | — |
| `limit` | — |
| `log` | — |
| `log-prefix` | string value, max length 31 |
| `nth` | — |
| `out-bridge-port` | — |
| `out-bridge-port-list` | — |
| `out-interface` | — |
| `out-interface-list` | — |
| `packet-mark` | — |
| `packet-size` | — |
| `per-connection-classifier` | — |
| `place-before` | — |
| `port` | — |
| `priority` | — |
| `protocol` | — |
| `psd` | — |
| `random` | — |
| `randomise-ports` | — |
| `realm` | — |
| `routing-mark` | — |
| `same-not-by-dst` | — |
| `socks5-port` | — |
| `socks5-server` | A.B.C.D (IP address) |
| `socksify-service` | — |
| `src-address` | — |
| `src-address-list` | — |
| `src-address-type` | — |
| `src-mac-address` | — |
| `src-port` | — |
| `tcp-mss` | — |
| `time` | — |
| `to-addresses` | A.B.C.D[-A.B.C.D \|0..32 \|/A.B.C.D ] (IP address range) |
| `to-ports` | — |
| `tos` | — |
| `ttl` | — |

## `/log/debug` (inspect 7.24.5)

| Property | Description |
|---|---|
| `message` | string value |

## `/log/error` (inspect 7.24.5)

| Property | Description |
|---|---|
| `message` | string value |

## `/log/find` (inspect 7.24.5)

| Property | Description |
|---|---|
| `where` | — |

## `/log/get` (inspect 7.24.5)

| Property | Description |
|---|---|
| `as-string` | — |
| `as-string-value` | — |
| `number` | — |
| `value-name` | — |

## `/log/info` (inspect 7.24.5)

| Property | Description |
|---|---|
| `message` | string value |

## `/log/print` (inspect 7.24.5)

| Property | Description |
|---|---|
| `append` | — |
| `as-value` | — |
| `brief` | — |
| `comments` | — |
| `count-only` | — |
| `detail` | — |
| `file` | — |
| `follow` | — |
| `follow-only` | — |
| `group-by` | — |
| `interval` | 00:00:00.200.. (time interval) |
| `on-event` | script |
| `order-by` | — |
| `proplist` | — |
| `show-ids` | — |
| `terse` | — |
| `timestamp` | — |
| `value-list` | — |
| `where` | — |
| `with-extra-info` | — |
| `without-paging` | — |

## `/log/warning` (inspect 7.24.5)

| Property | Description |
|---|---|
| `message` | string value |

## `/system/device-mode/update` (inspect 7.24.5)

| Property | Description |
|---|---|
| `activation-timeout` | 10s..1d (time interval) |
| `append` | — |
| `as-value` | — |
| `bandwidth-test` | — |
| `container` | — |
| `do` | script |
| `duration` | time interval |
| `email` | — |
| `fetch` | — |
| `file` | — |
| `flagged` | — |
| `flagging-enabled` | — |
| `freeze-frame-interval` | 00:00:00.020..00:00:30 (time interval) |
| `hotspot` | — |
| `install-any-version` | — |
| `interval` | 00:00:00.020..00:00:05 (time interval) |
| `ipsec` | — |
| `l2tp` | — |
| `mode` | — |
| `once` | — |
| `partitions` | — |
| `pptp` | — |
| `proxy` | — |
| `romon` | — |
| `routerboard` | — |
| `scheduler` | — |
| `smb` | — |
| `sniffer` | — |
| `socks` | — |
| `traffic-gen` | — |
| `without-paging` | — |
| `zerotier` | — |

## `/system/package/apply-changes` (inspect 7.24.5)

| Property | Description |
|---|---|
| `ignore-missing` | — |

## `/system/package/enable` (inspect 7.24.5)

| Property | Description |
|---|---|
| `numbers` | — |

## `/system/package/print` (inspect 7.24.5)

| Property | Description |
|---|---|
| `append` | — |
| `as-value` | — |
| `brief` | — |
| `comments` | — |
| `count-only` | — |
| `detail` | — |
| `file` | — |
| `follow` | — |
| `follow-only` | — |
| `from` | — |
| `group-by` | — |
| `interval` | 00:00:00.200.. (time interval) |
| `on-event` | script |
| `order-by` | — |
| `proplist` | — |
| `show-ids` | — |
| `terse` | — |
| `timestamp` | — |
| `value-list` | — |
| `where` | — |
| `without-paging` | — |

## `/system/package/update/cancel` (inspect 7.24.5)

| Property | Description |
|---|---|
| `as-value` | — |

## `/system/package/update/check-for-updates` (inspect 7.24.5)

| Property | Description |
|---|---|
| `append` | — |
| `as-value` | — |
| `do` | script |
| `duration` | time interval |
| `fetch-changelog` | — |
| `file` | — |
| `freeze-frame-interval` | 00:00:00.020..00:00:30 (time interval) |
| `interval` | 00:00:00.020..00:00:05 (time interval) |
| `once` | — |
| `proplist` | — |
| `without-paging` | — |

## `/system/package/update/download` (inspect 7.24.5)

| Property | Description |
|---|---|
| `append` | — |
| `as-value` | — |
| `do` | script |
| `duration` | time interval |
| `file` | — |
| `freeze-frame-interval` | 00:00:00.020..00:00:30 (time interval) |
| `ignore-missing` | — |
| `interval` | 00:00:00.020..00:00:05 (time interval) |
| `once` | — |
| `proplist` | — |
| `without-paging` | — |

## `/system/package/update/edit` (inspect 7.24.5)

| Property | Description |
|---|---|
| `value-name` | — |

## `/system/package/update/export` (inspect 7.24.5)

| Property | Description |
|---|---|
| `compact` | — |
| `file` | — |
| `hide-sensitive` | — |
| `path` | — |
| `show-sensitive` | — |
| `terse` | — |
| `verbose` | — |
| `where` | — |

## `/system/package/update/get` (inspect 7.24.5)

| Property | Description |
|---|---|
| `as-string` | — |
| `as-string-value` | — |
| `value-name` | — |

## `/system/package/update/install` (inspect 7.24.5)

| Property | Description |
|---|---|
| `append` | — |
| `as-value` | — |
| `do` | script |
| `duration` | time interval |
| `file` | — |
| `freeze-frame-interval` | 00:00:00.020..00:00:30 (time interval) |
| `ignore-missing` | — |
| `interval` | 00:00:00.020..00:00:05 (time interval) |
| `once` | — |
| `proplist` | — |
| `without-paging` | — |

## `/system/package/update/print` (inspect 7.24.5)

| Property | Description |
|---|---|
| `as-value` | — |
| `comments` | — |
| `file` | — |
| `interval` | 00:00:00.200.. (time interval) |
| `without-paging` | — |

## `/system/package/update/reset` (inspect 7.24.5)

| Property | Description |
|---|---|
| `channel` | — |
| `check-certificate` | — |
| `ip-version` | — |
| `mode` | — |

## `/system/package/update/set` (inspect 7.24.5)

| Property | Description |
|---|---|
| `channel` | — |
| `check-certificate` | — |
| `ip-version` | — |
| `mode` | — |

## `/system/reboot` (inspect 7.24.5)

No settable inputs.

## `/system/resource/cpu/find` (inspect 7.24.5)

| Property | Description |
|---|---|
| `where` | — |

## `/system/resource/cpu/get` (inspect 7.24.5)

| Property | Description |
|---|---|
| `as-string` | — |
| `as-string-value` | — |
| `number` | — |
| `value-name` | — |

## `/system/resource/cpu/print` (inspect 7.24.5)

| Property | Description |
|---|---|
| `append` | — |
| `as-value` | — |
| `brief` | — |
| `comments` | — |
| `count-only` | — |
| `detail` | — |
| `file` | — |
| `follow` | — |
| `follow-only` | — |
| `from` | — |
| `group-by` | — |
| `interval` | 00:00:00.200.. (time interval) |
| `oid` | — |
| `on-event` | script |
| `order-by` | — |
| `proplist` | — |
| `show-ids` | — |
| `terse` | — |
| `timestamp` | — |
| `value-list` | — |
| `where` | — |
| `without-paging` | — |

## `/system/resource/export` (inspect 7.24.5)

| Property | Description |
|---|---|
| `compact` | — |
| `file` | — |
| `hide-sensitive` | — |
| `path` | — |
| `show-sensitive` | — |
| `terse` | — |
| `verbose` | — |
| `where` | — |

## `/system/resource/get` (inspect 7.24.5)

| Property | Description |
|---|---|
| `as-string` | — |
| `as-string-value` | — |
| `value-name` | — |

## `/system/resource/hardware/authorize` (inspect 7.24.5)

| Property | Description |
|---|---|
| `allow` | — |
| `numbers` | — |

## `/system/resource/hardware/export` (inspect 7.24.5)

| Property | Description |
|---|---|
| `compact` | — |
| `file` | — |
| `hide-sensitive` | — |
| `path` | — |
| `show-sensitive` | — |
| `terse` | — |
| `verbose` | — |
| `where` | — |

## `/system/resource/hardware/find` (inspect 7.24.5)

| Property | Description |
|---|---|
| `where` | — |

## `/system/resource/hardware/get` (inspect 7.24.5)

| Property | Description |
|---|---|
| `as-string` | — |
| `as-string-value` | — |
| `number` | — |
| `value-name` | — |

## `/system/resource/hardware/print` (inspect 7.24.5)

| Property | Description |
|---|---|
| `append` | — |
| `as-value` | — |
| `brief` | — |
| `comments` | — |
| `count-only` | — |
| `detail` | — |
| `file` | — |
| `follow` | — |
| `follow-only` | — |
| `from` | — |
| `group-by` | — |
| `interval` | 00:00:00.200.. (time interval) |
| `on-event` | script |
| `order-by` | — |
| `proplist` | — |
| `show-ids` | — |
| `terse` | — |
| `timestamp` | — |
| `value-list` | — |
| `where` | — |
| `without-paging` | — |

## `/system/resource/hardware/usb-power-reset` (inspect 7.24.5)

| Property | Description |
|---|---|
| `bus` | — |
| `duration` | time interval |
| `slot` | — |

## `/system/resource/hardware/usb-settings/edit` (inspect 7.24.5)

| Property | Description |
|---|---|
| `value-name` | — |

## `/system/resource/hardware/usb-settings/export` (inspect 7.24.5)

| Property | Description |
|---|---|
| `compact` | — |
| `file` | — |
| `hide-sensitive` | — |
| `path` | — |
| `show-sensitive` | — |
| `terse` | — |
| `verbose` | — |
| `where` | — |

## `/system/resource/hardware/usb-settings/get` (inspect 7.24.5)

| Property | Description |
|---|---|
| `as-string` | — |
| `as-string-value` | — |
| `value-name` | — |

## `/system/resource/hardware/usb-settings/print` (inspect 7.24.5)

| Property | Description |
|---|---|
| `as-value` | — |
| `comments` | — |
| `file` | — |
| `interval` | 00:00:00.200.. (time interval) |
| `without-paging` | — |

## `/system/resource/hardware/usb-settings/reset` (inspect 7.24.5)

| Property | Description |
|---|---|
| `authorization` | — |

## `/system/resource/hardware/usb-settings/set` (inspect 7.24.5)

| Property | Description |
|---|---|
| `authorization` | — |

## `/system/resource/irq/edit` (inspect 7.24.5)

| Property | Description |
|---|---|
| `number` | — |
| `value-name` | — |

## `/system/resource/irq/export` (inspect 7.24.5)

| Property | Description |
|---|---|
| `compact` | — |
| `file` | — |
| `hide-sensitive` | — |
| `path` | — |
| `show-sensitive` | — |
| `terse` | — |
| `verbose` | — |
| `where` | — |

## `/system/resource/irq/find` (inspect 7.24.5)

| Property | Description |
|---|---|
| `where` | — |

## `/system/resource/irq/get` (inspect 7.24.5)

| Property | Description |
|---|---|
| `as-string` | — |
| `as-string-value` | — |
| `number` | — |
| `value-name` | — |

## `/system/resource/irq/print` (inspect 7.24.5)

| Property | Description |
|---|---|
| `append` | — |
| `as-value` | — |
| `brief` | — |
| `comments` | — |
| `count-only` | — |
| `detail` | — |
| `file` | — |
| `follow` | — |
| `follow-only` | — |
| `from` | — |
| `group-by` | — |
| `interval` | 00:00:00.200.. (time interval) |
| `on-event` | script |
| `order-by` | — |
| `per-cpu-count` | — |
| `proplist` | — |
| `show-ids` | — |
| `terse` | — |
| `timestamp` | — |
| `value-list` | — |
| `where` | — |
| `without-paging` | — |

## `/system/resource/irq/reset` (inspect 7.24.5)

| Property | Description |
|---|---|
| `cpu` | — |
| `numbers` | — |

## `/system/resource/irq/set` (inspect 7.24.5)

| Property | Description |
|---|---|
| `cpu` | — |
| `numbers` | — |

## `/system/resource/monitor` (inspect 7.24.5)

| Property | Description |
|---|---|
| `append` | — |
| `as-value` | — |
| `do` | script |
| `duration` | time interval |
| `file` | — |
| `freeze-frame-interval` | 00:00:00.020..00:00:30 (time interval) |
| `interval` | 00:00:00.020..00:00:05 (time interval) |
| `once` | — |
| `proplist` | — |
| `without-paging` | — |

## `/system/resource/print` (inspect 7.24.5)

| Property | Description |
|---|---|
| `as-value` | — |
| `comments` | — |
| `file` | — |
| `interval` | 00:00:00.200.. (time interval) |
| `oid` | — |
| `without-paging` | — |

## CLI-reference occurrences (tree 7.26)

### `/app`

Type: Directory · Match: exact · Package: `container` · Syscap: `app` · [Official source](https://manual.mikrotik.com/docs/cli-reference/app)

### `/app/cleanup`

Type: Command · Match: exact · Package: `container` · Syscap: `app` · [Official source](https://manual.mikrotik.com/docs/cli-reference/app/cleanup)

### `/app/network`

Type: Directory · Match: exact · Package: `container` · Syscap: `app` · [Official source](https://manual.mikrotik.com/docs/cli-reference/app/network)

| Field | Kind | Type | Description |
|---|---|---|---|
| `name` | Argument | string |  |
| `allow-outgoing-access` | Argument | bool |  |
| `network` | Read-only Argument | ipAddr |  |
| `ip` | Read-only Argument | ipAddr |  |
| `status` | Read-only Argument | string |  |
| `used-ips` | Read-only Argument | multi { array-id, array-id, ip-and-name: composite { ip: ipAddr , name: string } } |  |
| `bridge-interface` | Read-only Argument | iface_enum { none } |  |
| `cmds` | Read-only Argument | multi { cmd: string } |  |

| Flag | Name | Description |
|---|---|---|
| `e` | external |  |
| `I` | invalid |  |

### `/app/remove`

Type: Command · Match: exact · Package: `container` · Syscap: `app` · [Official source](https://manual.mikrotik.com/docs/cli-reference/app/remove)

### `/app/restart`

Type: Command · Match: exact · Package: `container` · Syscap: `app` · [Official source](https://manual.mikrotik.com/docs/cli-reference/app/restart)

### `/app/settings`

Type: Settings Directory · Match: exact · Package: `container` · Syscap: `app` · [Official source](https://manual.mikrotik.com/docs/cli-reference/app/settings)

| Field | Kind | Type | Description |
|---|---|---|---|
| `disk` | Argument | enum (none) | Global setting that specifies which disk will be used for storage operations |
| `router-ip` | Argument | ipAddr | Manually specifies the IP address at which the current RouterOS device can be reached |
| `lan-bridge` | Argument | iface_enum { none } | Manually specifies the bridge interface that represents the local area network |
| `media-path` | Argument | file | Manually specifies the directory path where all media files will be stored |
| `download-path` | Argument | file | Manually specifies the directory path where all downloaded content will be stored |
| `show-in-webfig` | Argument | bool | Controls whether links to enabled applications are displayed on the WebFig login page |
| `auto-update` | Argument | bool | Global setting that enables automatic updates for all installed applications packages |
| `registry-mirrors` | Argument | multi { array-id, array-id, src-and-dst: composite { src: string , dst: string } } | Specifies one or more registry mirror URLs for container image retrieval |
| `app-store-urls` | Argument | multi { array-id, app-store-url: string } | URL to a custom app store. Must point to a YAML array where each application is an element |
| `assumed-router-ip` | Read-only Argument | ipAddr | Automatically detected network IP address of the RouterOS device |
| `assumed-lan-bridge` | Read-only Argument | iface_enum { none } | Automatically detected bridge interface used for LAN connectivity |
| `assumed-media-path` | Read-only Argument | file | Default media storage path, typically located on the system disk |
| `assumed-download-path` | Read-only Argument | file | Default download directory path, typically located within the media storage area |
| `certificate-status` | Read-only Argument | string |  |
| `certificate` | Read-only Argument | enum (none) |  |

### `/app/setup`

Type: Command · Match: exact · Package: `container` · Syscap: `app` · [Official source](https://manual.mikrotik.com/docs/cli-reference/app/setup)

| Field | Kind | Type | Description |
|---|---|---|---|
| `disk` | Read-only Argument | enum (none) | Selected storage disk for application installation |
| `lan-bridge` | Read-only Argument | iface_enum { none } | Selected LAN bridge interface for container networking |
| `router-ip-alt` | Read-only Argument | alt { router-ip-enum: enum , router-ip: ipAddr } | Manual IP address override for the RouterOS device |

### `/app/update`

Type: Command · Match: exact · Package: `container` · Syscap: `app` · [Official source](https://manual.mikrotik.com/docs/cli-reference/app/update)

### `/console/inspect`

Type: Command · Match: exact · [Official source](https://manual.mikrotik.com/docs/cli-reference/console/inspect)

| Field | Kind | Type | Description |
|---|---|---|---|
| `request` | Argument | ubit (self, child, completion, highlight, syntax, error) |  |
| `path` | Argument | multi { name: string } |  |
| `input` | Argument | string |  |
| `type` | Read-only Argument | enum (self \| child \| completion \| highlight \| syntax \| error) |  |
| `name` | Read-only Argument | string |  |
| `node-type` | Read-only Argument | enum (path \| dir \| cmd \| arg) |  |
| `completion` | Read-only Argument | string |  |
| `style` | Read-only Argument | enum (none \| syntax-meta \| syntax-nonterminal \| syntax-value \| syntax-obsolete \| error \| ambiguous \| comment \| escaped \| variable \| variable-undefined \| variable-global \| variable-local \| variable-auto \| variable-parameter \| dir \| cmd \| arg \| arg-scope \| arg-dot \| obj-disabled \| obj-inactive \| obj-dynamic \| obj-running \| obj-wildcard \| obj-decode-error \| about \| prompt-nosafe \| prompt-safe \| prompt-user \| prompt-host \| prompt-path \| prompt-hotlock \| line-more \| line-number \| hud-key \| flag-title \| flag-hints \| flag \| brief-header \| detail-arg-name \| detail-arg-equals \| gradient-0 \| gradient-1 \| gradient-2 \| gradient-3 \| gradient-4 \| gradient-5 \| gradient-6 \| gradient-7) |  |
| `offset` | Read-only Argument | num |  |
| `preference` | Read-only Argument | num |  |
| `show` | Read-only Argument | bool |  |
| `highlight` | Read-only Argument | multi { style: enum (none \| syntax-meta \| syntax-nonterminal \| syntax-value \| syntax-obsolete \| error \| ambiguous \| comment \| escaped \| variable \| variable-undefined \| variable-global \| variable-local \| variable-auto \| variable-parameter \| dir \| cmd \| arg \| arg-scope \| arg-dot \| obj-disabled \| obj-inactive \| obj-dynamic \| obj-running \| obj-wildcard \| obj-decode-error \| about \| prompt-nosafe \| prompt-safe \| prompt-user \| prompt-host \| prompt-path \| prompt-hotlock \| line-more \| line-number \| hud-key \| flag-title \| flag-hints \| flag \| brief-header \| detail-arg-name \| detail-arg-equals \| gradient-0 \| gradient-1 \| gradient-2 \| gradient-3 \| gradient-4 \| gradient-5 \| gradient-6 \| gradient-7) } |  |
| `symbol` | Read-only Argument | string |  |
| `symbol-type` | Read-only Argument | enum (collection \| explanation \| definition) { collection:0, explanation:1, definition:2 } |  |
| `nested` | Read-only Argument | num |  |
| `nonorm` | Read-only Argument | bool |  |
| `text` | Read-only Argument | string |  |

### `/container`

Type: Directory · Match: exact · Package: `container` · [Official source](https://manual.mikrotik.com/docs/cli-reference/container)

| Field | Kind | Type | Description |
|---|---|---|---|
| `file` | Argument | file |  |
| `remote-image` | Argument | string |  |
| `ignore-remote-image-change` | Argument | bool |  |
| `check-certificate` | Argument | bool |  |
| `name` | Argument | string |  |
| `privileged` | Argument | bool |  |
| `interface` | Argument | multi { interface: iface_enum } |  |
| `env` | Argument | object { key-and-value-element: super { ! , key-and-value: composite { key: string , value: string } } } |  |
| `envlists` | Argument | multi { envlist: enum } |  |
| `entrypoint` | Argument | multi { cmd: string } |  |
| `cmd` | Argument | multi { cmd: string } |  |
| `shell` | Argument | multi { cmd: string } |  |
| `stop-signal` | Argument | enum (1-SIGHUP \| 2-SIGINT \| 3-SIGQUIT \| 4-SIGILL \| 5-SIGTRAP \| 6-SIGABTR \| 7-SIGBUS \| 8-SIGFPE \| 9-SIGKILL \| 10-SIGUSR1 \| 11-SIGSEGV \| 12-SIGUSR2 \| 13-SIGPIPE \| 14-SIGALRM \| 15-SIGTERM \| 16-SIGSTKFLT \| 17-SIGCHLD \| 18-SIGCONT \| 19-SIGSTOP \| 20-SIGTSTP \| 21-SIGTTIN \| 22-SIGTTOU \| 23-SIGURG \| 24-SIGXCPU \| 25-SIGXFSZ \| 26-SIGVTALRM \| 27-SIGPROF \| 28-SIGWINCH \| 29-SIGIO \| 30-SIGPWR \| 31-SIGSYS) { 1-SIGHUP:1, 2-SIGINT:2, 3-SIGQUIT:3, 4-SIGILL:4, 5-SIGTRAP:5, 6-SIGABTR:6, 7-SIGBUS:7, 8-SIGFPE:8, 9-SIGKILL:9, 10-SIGUSR1:10, 11-SIGSEGV:11, 12-SIGUSR2:12, 13-SIGPIPE:13, 14-SIGALRM:14, 15-SIGTERM:15, 16-SIGSTKFLT:16, 17-SIGCHLD:17, 18-SIGCONT:18, 19-SIGSTOP:19, 20-SIGTSTP:20, 21-SIGTTIN:21, 22-SIGTTOU:22, 23-SIGURG:23, 24-SIGXCPU:24, 25-SIGXFSZ:25, 26-SIGVTALRM:26, 27-SIGPROF:27, 28-SIGWINCH:28, 29-SIGIO:29, 30-SIGPWR:30, 31-SIGSYS:31 } |  |
| `stop-time` | Argument | time |  |
| `root-dir` | Argument | file |  |
| `layer-dir` | Argument | file |  |
| `mount` | Argument | object { src-dst-mode: composite { src: file , dst-mode: composite { dst: string , mode: enum (rw \| ro \| rw,noexec \| ro,noexec) } } } |  |
| `tmpfs` | Argument | object { dst-size-mode: composite { dst: string , size-mode: composite { size: num , mode: string } } } |  |
| `mountlists` | Argument | multi { mountlist: enum } |  |
| `shm-size` | Argument | num |  |
| `dns` | Argument | multi { dns-server-ip: address (flags=46) } |  |
| `default-dns` | Argument | multi { dns-server-ip: address (flags=46) } |  |
| `hostname` | Argument | string |  |
| `domain-name` | Argument | string |  |
| `workdir` | Argument | string |  |
| `logging` | Argument | bool |  |
| `start-on-boot` | Argument | bool |  |
| `stop-on-unhealthy` | Argument | bool |  |
| `restart-policy` | Argument | enum (no \| on-failure \| always) |  |
| `restart-max-count` | Argument | num |  |
| `restart-interval` | Argument | time |  |
| `user` | Argument | string |  |
| `cpu-list` | Argument | multi { cpu: enum } |  |
| `memory-high` | Argument | num |  |
| `memory-max` | Argument | num |  |
| `swap-max` | Argument | num |  |
| `devices` | Argument | object { dst-size-mode: composite { device: enum , container-dev-name: string } } |  |
| `hosts` | Argument | object { host-entry: composite { host-name: string , host-addr: address (flags=46) } } |  |
| `healthcheck-cmd` | Argument | multi { healthcheck-cmd: string } |  |
| `healthcheck-interval` | Argument | time |  |
| `healthcheck-timeout` | Argument | time |  |
| `healthcheck-start-period` | Argument | time |  |
| `healthcheck-start-interval` | Argument | time |  |
| `healthcheck-retries` | Argument | num |  |
| `healthcheck-status` | Argument | string |  |
| `tag` | Read-only Argument | string |  |
| `os` | Read-only Argument | string |  |
| `arch` | Read-only Argument | string |  |
| `env-current` | Read-only Argument | object { key-and-value: composite { key: string , value: string } } |  |
| `default-entrypoint` | Read-only Argument | string |  |
| `default-cmd` | Read-only Argument | string |  |
| `default-shell` | Read-only Argument | string |  |
| `default-stop-signal` | Read-only Argument | enum (1-SIGHUP \| 2-SIGINT \| 3-SIGQUIT \| 4-SIGILL \| 5-SIGTRAP \| 6-SIGABTR \| 7-SIGBUS \| 8-SIGFPE \| 9-SIGKILL \| 10-SIGUSR1 \| 11-SIGSEGV \| 12-SIGUSR2 \| 13-SIGPIPE \| 14-SIGALRM \| 15-SIGTERM \| 16-SIGSTKFLT \| 17-SIGCHLD \| 18-SIGCONT \| 19-SIGSTOP \| 20-SIGTSTP \| 21-SIGTTIN \| 22-SIGTTOU \| 23-SIGURG \| 24-SIGXCPU \| 25-SIGXFSZ \| 26-SIGVTALRM \| 27-SIGPROF \| 28-SIGWINCH \| 29-SIGIO \| 30-SIGPWR \| 31-SIGSYS) { 1-SIGHUP:1, 2-SIGINT:2, 3-SIGQUIT:3, 4-SIGILL:4, 5-SIGTRAP:5, 6-SIGABTR:6, 7-SIGBUS:7, 8-SIGFPE:8, 9-SIGKILL:9, 10-SIGUSR1:10, 11-SIGSEGV:11, 12-SIGUSR2:12, 13-SIGPIPE:13, 14-SIGALRM:14, 15-SIGTERM:15, 16-SIGSTKFLT:16, 17-SIGCHLD:17, 18-SIGCONT:18, 19-SIGSTOP:19, 20-SIGTSTP:20, 21-SIGTTIN:21, 22-SIGTTOU:22, 23-SIGURG:23, 24-SIGXCPU:24, 25-SIGXFSZ:25, 26-SIGVTALRM:26, 27-SIGPROF:27, 28-SIGWINCH:28, 29-SIGIO:29, 30-SIGPWR:30, 31-SIGSYS:31 } |  |
| `default-workdir` | Read-only Argument | string |  |
| `restart-count` | Read-only Argument | num |  |
| `default-user` | Read-only Argument | string |  |
| `memory-current` | Read-only Argument | num |  |
| `swap-current` | Read-only Argument | num |  |
| `cpu-usage` | Read-only Argument | num |  |
| `container-size` | Read-only Argument | num |  |
| `data-size` | Read-only Argument | num |  |
| `image-id` | Read-only Argument | string |  |
| `config-json` | Read-only Argument | string |  |
| `layers` | Read-only Argument | multi { layer: enum } |  |
| `default-healthcheck-cmd` | Read-only Argument | multi { default-healthcheck-cmd: string } |  |
| `default-healthcheck-interval` | Read-only Argument | time |  |
| `default-healthcheck-timeout` | Read-only Argument | time |  |
| `default-healthcheck-start-period` | Read-only Argument | time |  |
| `default-healthcheck-start-interval` | Read-only Argument | time |  |
| `default-healthcheck-retries` | Read-only Argument | num |  |

| Flag | Name | Description |
|---|---|---|
| `S` | stopped |  |
| `N` | starting |  |
| `R` | running |  |
| `T` | stopping |  |
| `E` | downloading/extracting |  |
| `D` | deleting |  |
| `F` | download/extract failed |  |
| `C` | starting-with-healthcheck |  |
| `H` | healthy |  |
| `U` | unhealthy |  |

### `/container/config`

Type: Settings Directory · Match: exact · Package: `container` · [Official source](https://manual.mikrotik.com/docs/cli-reference/container/config)

| Field | Kind | Type | Description |
|---|---|---|---|
| `registry-url` | Argument | string |  |
| `username` | Argument | string |  |
| `password` | Argument | string |  |
| `layer-dir` | Argument | file |  |
| `tmpdir` | Argument | file |  |
| `memory-high` | Argument | num |  |
| `memory-max` | Argument | num |  |
| `swap-max` | Argument | num |  |
| `assumed-registry-url` | Read-only Argument | string |  |
| `memory-current` | Read-only Argument | num |  |
| `swap-current` | Read-only Argument | num |  |

### `/container/envs`

Type: Directory · Match: exact · Package: `container` · [Official source](https://manual.mikrotik.com/docs/cli-reference/container/envs)

| Field | Kind | Type | Description |
|---|---|---|---|
| `list` | Argument | enum |  |
| `key` | Argument | string |  |
| `value` | Argument | string |  |

| Flag | Name | Description |
|---|---|---|
| `X` | disabled |  |

### `/container/kill`

Type: Command · Match: exact · Package: `container` · [Official source](https://manual.mikrotik.com/docs/cli-reference/container/kill)

| Field | Kind | Type | Description |
|---|---|---|---|
| `signal` | Argument | enum (1-SIGHUP \| 2-SIGINT \| 3-SIGQUIT \| 4-SIGILL \| 5-SIGTRAP \| 6-SIGABTR \| 7-SIGBUS \| 8-SIGFPE \| 9-SIGKILL \| 10-SIGUSR1 \| 11-SIGSEGV \| 12-SIGUSR2 \| 13-SIGPIPE \| 14-SIGALRM \| 15-SIGTERM \| 16-SIGSTKFLT \| 17-SIGCHLD \| 18-SIGCONT \| 19-SIGSTOP \| 20-SIGTSTP \| 21-SIGTTIN \| 22-SIGTTOU \| 23-SIGURG \| 24-SIGXCPU \| 25-SIGXFSZ \| 26-SIGVTALRM \| 27-SIGPROF \| 28-SIGWINCH \| 29-SIGIO \| 30-SIGPWR \| 31-SIGSYS) { 1-SIGHUP:1, 2-SIGINT:2, 3-SIGQUIT:3, 4-SIGILL:4, 5-SIGTRAP:5, 6-SIGABTR:6, 7-SIGBUS:7, 8-SIGFPE:8, 9-SIGKILL:9, 10-SIGUSR1:10, 11-SIGSEGV:11, 12-SIGUSR2:12, 13-SIGPIPE:13, 14-SIGALRM:14, 15-SIGTERM:15, 16-SIGSTKFLT:16, 17-SIGCHLD:17, 18-SIGCONT:18, 19-SIGSTOP:19, 20-SIGTSTP:20, 21-SIGTTIN:21, 22-SIGTTOU:22, 23-SIGURG:23, 24-SIGXCPU:24, 25-SIGXFSZ:25, 26-SIGVTALRM:26, 27-SIGPROF:27, 28-SIGWINCH:28, 29-SIGIO:29, 30-SIGPWR:30, 31-SIGSYS:31 } |  |

### `/container/layers`

Type: Directory · Match: exact · Package: `container` · [Official source](https://manual.mikrotik.com/docs/cli-reference/container/layers)

| Field | Kind | Type | Description |
|---|---|---|---|
| `name` | Read-only Argument | string |  |
| `layer-dir` | Read-only Argument | string |  |
| `size` | Read-only Argument | alt { size: num , size-state: enum (unavailable \| pending \| done) } |  |
| `type` | Read-only Argument | enum (layer \| root-dir) |  |
| `containers` | Read-only Argument | multi { container: enum } |  |

### `/container/log`

Type: Directory · Match: exact · Package: `container` · [Official source](https://manual.mikrotik.com/docs/cli-reference/container/log)

| Field | Kind | Type | Description |
|---|---|---|---|
| `time` | Read-only Argument | date |  |
| `container` | Read-only Argument | enum |  |
| `message` | Read-only Argument | string |  |

### `/container/mounts`

Type: Directory · Match: exact · Package: `container` · [Official source](https://manual.mikrotik.com/docs/cli-reference/container/mounts)

| Field | Kind | Type | Description |
|---|---|---|---|
| `list` | Argument | enum |  |
| `src` | Argument | file |  |
| `dst` | Argument | string |  |
| `mode` | Argument | enum (rw \| ro \| rw,noexec \| ro,noexec) |  |

| Flag | Name | Description |
|---|---|---|
| `X` | disabled |  |

### `/container/repull`

Type: Command · Match: exact · Package: `container` · [Official source](https://manual.mikrotik.com/docs/cli-reference/container/repull)

| Field | Kind | Type | Description |
|---|---|---|---|
| `file` | Argument | file |  |
| `remote-image` | Argument | string |  |

### `/container/restart`

Type: Command · Match: exact · Package: `container` · [Official source](https://manual.mikrotik.com/docs/cli-reference/container/restart)

### `/container/save`

Type: Command · Match: exact · Package: `container` · [Official source](https://manual.mikrotik.com/docs/cli-reference/container/save)

| Field | Kind | Type | Description |
|---|---|---|---|
| `file` | Argument | file |  |
| `commit` | Argument | switch |  |
| `name` | Argument | string |  |

### `/container/start`

Type: Command · Match: exact · Package: `container` · [Official source](https://manual.mikrotik.com/docs/cli-reference/container/start)

### `/container/stop`

Type: Command · Match: exact · Package: `container` · [Official source](https://manual.mikrotik.com/docs/cli-reference/container/stop)

### `/container/update`

Type: Command · Match: exact · Package: `container` · [Official source](https://manual.mikrotik.com/docs/cli-reference/container/update)

### `/interface/bridge/port`

Type: Directory · Match: exact · [Official source](https://manual.mikrotik.com/docs/cli-reference/interface/bridge/port)

| Field | Kind | Type | Description |
|---|---|---|---|
| `interface` | Argument | alt { interface: iface_enum , interface-list: enum } |  |
| `bridge` | Argument | iface_enum |  |
| `priority` | Argument | enum (0x00 \| 0x10 \| 0x20 \| 0x30 \| 0x40 \| 0x50 \| 0x60 \| 0x70 \| 0x80 \| 0x90 \| 0xa0 \| 0xb0 \| 0xc0 \| 0xd0 \| 0xe0 \| 0xf0) { 0x00:0x00, 0x10:0x10, 0x20:0x20, 0x30:0x30, 0x40:0x40, 0x50:0x50, 0x60:0x60, 0x70:0x70, 0x80:0x80, 0x90:0x90, 0xa0:0xa0, 0xb0:0xb0, 0xc0:0xc0, 0xd0:0xd0, 0xe0:0xe0, 0xf0:0xf0 } |  |
| `path-cost` | Argument | num |  |
| `internal-path-cost` | Argument | num |  |
| `edge` | Argument | enum (auto \| yes \| no \| yes-discover \| no-discover) { auto:0, yes:1, no:2, yes-discover:3, no-discover:4 } |  |
| `point-to-point` | Argument | enum (auto \| yes \| no) { auto:0, yes:1, no:2 } |  |
| `learn` | Argument | enum (auto \| yes \| no) { auto:0, yes:2, no:1 } |  |
| `horizon` | Argument | num |  |
| `hw` | Argument | bool |  |
| `auto-isolate` | Argument | bool |  |
| `restricted-role` | Argument | bool |  |
| `restricted-tcn` | Argument | bool |  |
| `pvid` | Argument | num |  |
| `frame-types` | Argument | enum (admit-all \| admit-only-vlan-tagged \| admit-only-untagged-and-priority-tagged) { admit-all:0, admit-only-vlan-tagged:1, admit-only-untagged-and-priority-tagged:2 } |  |
| `ingress-filtering` | Argument | bool |  |
| `unknown-unicast-flood` | Argument | bool |  |
| `unknown-multicast-flood` | Argument | bool |  |
| `broadcast-flood` | Argument | bool |  |
| `tag-stacking` | Argument | bool |  |
| `bpdu-guard` | Argument | bool |  |
| `trusted` | Argument | bool |  |
| `trusted-ra` | Argument | bool |  |
| `trusted-dhcpv6` | Argument | bool |  |
| `trusted-arp` | Argument | bool |  |
| `mvrp-registrar-state` | Argument | enum (normal \| fixed) |  |
| `mvrp-applicant-state` | Argument | enum (normal-participant \| non-participant) |  |
| `multicast-router` | Argument | enum (disabled \| temporary-query \| permanent) { disabled:0, temporary-query:1, permanent:2 } |  |
| `fast-leave` | Argument | bool |  |
| `parent` | Read-only Argument | enum |  |
| `status` | Read-only Argument | enum (inactive \| in-bridge \| in-bridge \| disabled) |  |
| `port-id` | Read-only Argument | composite { priority: num , number: num } |  |
| `role` | Read-only Argument | enum (disabled-port \| root-port \| designated-port \| alternate-port \| backup-port) { disabled-port:0, root-port:1, designated-port:2, alternate-port:3, backup-port:4 } |  |
| `edge-port` | Read-only Argument | bool |  |
| `edge-port-discovery` | Read-only Argument | bool |  |
| `point-to-point-port` | Read-only Argument | bool |  |
| `external-fdb-status` | Read-only Argument | bool |  |
| `sending-rstp` | Read-only Argument | bool |  |
| `learning` | Read-only Argument | bool |  |
| `forwarding` | Read-only Argument | bool |  |
| `actual-path-cost` | Read-only Argument | num |  |
| `root-path-cost` | Read-only Argument | num |  |
| `internal-root-path-cost` | Read-only Argument | num |  |
| `designated-bridge-id` | Read-only Argument | composite { number: num , address: macAddr } |  |
| `designated-cost` | Read-only Argument | num |  |
| `designated-port-id` | Read-only Argument | composite { priority: num , number: num } |  |
| `tx-bpdu` | Read-only Argument | num |  |
| `rx-bpdu` | Read-only Argument | num |  |
| `discard-transitions` | Read-only Argument | num |  |
| `forward-transitions` | Read-only Argument | num |  |
| `tx-tc` | Read-only Argument | num |  |
| `rx-tc` | Read-only Argument | num |  |
| `topology-changes` | Read-only Argument | num |  |
| `last-topology-change` | Read-only Argument | time |  |
| `multicast-router` | Read-only Argument | bool |  |
| `hw-offload-group` | Read-only Argument | enum |  |
| `declared-vlan-ids` | Read-only Argument | multi { vlan-range: range } |  |
| `registered-vlan-ids` | Read-only Argument | multi { vlan-range: range } |  |
| `hw-offload` | Read-only Argument | bool |  |
| `debug-info` | Read-only Argument | string |  |

| Flag | Name | Description |
|---|---|---|
| `X` | disabled | disabled |
| `I` | inactive | inactive |
| `D` | dynamic | dynamic |
| `H` | hw-offload | hw-offload |
| `Y` | managed | managed |

### `/interface/bridge/port/monitor`

Type: Command · Match: exact · [Official source](https://manual.mikrotik.com/docs/cli-reference/interface/bridge/port/monitor)

| Field | Kind | Type | Description |
|---|---|---|---|
| `interface` | Read-only Argument | alt { interface: iface_enum , interface-list: enum } |  |
| `status` | Read-only Argument | enum (inactive \| in-bridge \| in-bridge \| disabled) |  |
| `port-id` | Read-only Argument | composite { priority: num , number: num } |  |
| `role` | Read-only Argument | enum (disabled-port \| root-port \| designated-port \| alternate-port \| backup-port) { disabled-port:0, root-port:1, designated-port:2, alternate-port:3, backup-port:4 } |  |
| `edge-port` | Read-only Argument | bool |  |
| `edge-port-discovery` | Read-only Argument | bool |  |
| `point-to-point-port` | Read-only Argument | bool |  |
| `external-fdb` | Read-only Argument | bool |  |
| `sending-rstp` | Read-only Argument | bool |  |
| `learning` | Read-only Argument | bool |  |
| `forwarding` | Read-only Argument | bool |  |
| `actual-path-cost` | Read-only Argument | num |  |
| `root-path-cost` | Read-only Argument | num |  |
| `internal-root-path-cost` | Read-only Argument | num |  |
| `designated-bridge-id` | Read-only Argument | composite { number: num , address: macAddr } |  |
| `designated-cost` | Read-only Argument | num |  |
| `designated-internal-cost` | Read-only Argument | num |  |
| `designated-port-id` | Read-only Argument | composite { priority: num , number: num } |  |
| `designated-message-age` | Read-only Argument | num |  |
| `designated-max-age` | Read-only Argument | num |  |
| `designated-remaining-hops` | Read-only Argument | num |  |
| `tx-rx-bpdu` | Read-only Argument | composite { tx: num , rx: num } |  |
| `discard-transitions` | Read-only Argument | num |  |
| `forward-transitions` | Read-only Argument | num |  |
| `tx-rx-tc` | Read-only Argument | composite { tx: num , rx: num } |  |
| `topology-changes` | Read-only Argument | num |  |
| `last-topology-change` | Read-only Argument | time |  |
| `multicast-router` | Read-only Argument | bool |  |
| `hw-offload-group` | Read-only Argument | enum |  |
| `declared-vlan-ids` | Read-only Argument | multi { vlan-range: range } |  |
| `registered-vlan-ids` | Read-only Argument | multi { vlan-range: range } |  |

### `/interface/bridge/port/mst-override`

Type: Directory · Match: exact · [Official source](https://manual.mikrotik.com/docs/cli-reference/interface/bridge/port/mst-override)

| Field | Kind | Type | Description |
|---|---|---|---|
| `interface` | Argument | iface_enum |  |
| `identifier` | Argument | num |  |
| `priority` | Argument | enum (0x00 \| 0x10 \| 0x20 \| 0x30 \| 0x40 \| 0x50 \| 0x60 \| 0x70 \| 0x80 \| 0x90 \| 0xa0 \| 0xb0 \| 0xc0 \| 0xd0 \| 0xe0 \| 0xf0) { 0x00:0x00, 0x10:0x10, 0x20:0x20, 0x30:0x30, 0x40:0x40, 0x50:0x50, 0x60:0x60, 0x70:0x70, 0x80:0x80, 0x90:0x90, 0xa0:0xa0, 0xb0:0xb0, 0xc0:0xc0, 0xd0:0xd0, 0xe0:0xe0, 0xf0:0xf0 } |  |
| `internal-path-cost` | Argument | num |  |
| `debug-info` | Read-only Argument | string |  |

| Flag | Name | Description |
|---|---|---|
| `X` | disabled | disabled |
| `D` | dynamic | dynamic |

### `/interface/bridge/port/mst-override/monitor`

Type: Command · Match: exact · [Official source](https://manual.mikrotik.com/docs/cli-reference/interface/bridge/port/mst-override/monitor)

| Field | Kind | Type | Description |
|---|---|---|---|
| `port` | Read-only Argument | iface_enum |  |
| `status` | Read-only Argument | enum (inactive \| in-bridge \| in-bridge \| disabled) |  |
| `identifier` | Read-only Argument | num |  |
| `port-id` | Read-only Argument | composite { priority: num , number: num } |  |
| `role` | Read-only Argument | enum (disabled-port \| root-port \| designated-port \| alternate-port \| backup-port \| master-port) { disabled-port:0, root-port:1, designated-port:2, alternate-port:3, backup-port:4, master-port:5 } |  |
| `learning` | Read-only Argument | bool |  |
| `forwarding` | Read-only Argument | bool |  |
| `internal-root-path-cost` | Read-only Argument | num |  |
| `designated-bridge-id` | Read-only Argument | composite { number: num , address: macAddr } |  |
| `designated-cost` | Read-only Argument | num |  |
| `designated-internal-cost` | Read-only Argument | num |  |
| `designated-port-id` | Read-only Argument | composite { priority: num , number: num } |  |
| `designated-remaining-hops` | Read-only Argument | num |  |
| `tx-rx-bpdu` | Read-only Argument | composite { tx: num , rx: num } |  |
| `discard-transitions` | Read-only Argument | num |  |
| `forward-transitions` | Read-only Argument | num |  |
| `tx-rx-tc` | Read-only Argument | composite { tx: num , rx: num } |  |
| `topology-changes` | Read-only Argument | num |  |
| `last-topology-change` | Read-only Argument | time |  |

### `/interface/list/member`

Type: Directory · Match: exact · [Official source](https://manual.mikrotik.com/docs/cli-reference/interface/list/member)

| Field | Kind | Type | Description |
|---|---|---|---|
| `list` | Argument | enum | Name of the interface list to which the member belongs. |
| `interface` | Argument | iface_enum | Name of the interface that is a member of the list. |
| `dynamic` | Read-only Argument | bool | Whether the member was added dynamically. |

| Flag | Name | Description |
|---|---|---|
| `X` | disabled | Member entry is disabled. |
| `D` | dynamic | Dynamically added member. |

### `/log`

Type: Directory · Match: exact · [Official source](https://manual.mikrotik.com/docs/cli-reference/log)

| Field | Kind | Type | Description |
|---|---|---|---|
| `buffer` | Read-only Argument | enum | Buffer the entry belongs to: `memory` for the default buffer, or the name of another memory action or of a disk action. A disk action's newest entries show here, and after a reboot the entries of its active file. `/log/print` without a filter lists every buffer, so a message passed to several actions shows once per action. |
| `time` | Read-only Argument | date | Date and time the entry was added. |
| `topics` | Read-only Argument | multi { array-id, topic: enum } | Topics of the entry, for example `system,info,account`. The rules in `/system/logging` select messages by these topics. |
| `message` | Read-only Argument | string | Text of the entry, with the rule's `prefix` in front when the rule has one. |
| `extra-info` | Read-only Argument | string | Extra `key=value` fields that some messages carry, for example a login: `app=ssh duser=admin outcome=success src=192.0.2.1`. `print with-extra-info` appends them to the message, and the `cef` remote log format sends them after `msg=`. |

### `/system/device-mode/update`

Type: Command · Match: exact · [Official source](https://manual.mikrotik.com/docs/cli-reference/system/device-mode/update)

| Field | Kind | Type | Description |
|---|---|---|---|
| `mode` | Argument | enum | Device mode to apply. Specifying `mode` replaces the entire device-mode configuration except the other parameters given in the same command; omitted features get the new mode's defaults. - `advanced` - Previously called `enterprise`. - `basic` - For most other devices. - `home` - For home routers. - `rose` - For RDS and similar devices with wide disk use. |
| `flagged` | Argument | bool | Set to `no` to clear the flagged state, after inspecting the configuration for unauthorized changes. Requires physical confirmation. |
| `flagging-enabled` | Argument | bool | Enable or disable the configuration analysis for signs of unauthorized access. Default: yes. |
| `scheduler` | Argument | bool | Allow or block `/system/scheduler`. |
| `socks` | Argument | bool | Allow or block `/ip/socks`. |
| `fetch` | Argument | bool | Allow or block `/tool/fetch`. |
| `pptp` | Argument | bool | Allow or block PPTP client and server interfaces. |
| `l2tp` | Argument | bool | Allow or block L2TP client and server interfaces. |
| `bandwidth-test` | Argument | bool | Allow or block `/tool/bandwidth-test`, `/tool/bandwidth-server` and `/tool/speed-test`. |
| `traffic-gen` | Argument | bool | Allow or block `/tool/traffic-generator`, `/tool/flood-ping`, and `/tool/ping-speed`. |
| `sniffer` | Argument | bool | Allow or block `/tool/sniffer`. |
| `ipsec` | Argument | bool | Allow or block `/ip/ipsec`. |
| `romon` | Argument | bool | Allow or block `/tool/romon`. |
| `proxy` | Argument | bool | Allow or block `/ip/proxy`. |
| `hotspot` | Argument | bool | Allow or block `/ip/hotspot`. |
| `smb` | Argument | bool | Allow or block `/ip/smb`. |
| `email` | Argument | bool | Allow or block `/tool/e-mail`. |
| `zerotier` | Argument | bool | Allow or block `/zerotier`. |
| `container` | Argument | bool | Allow or block container functionality. |
| `install-any-version` | Argument | bool | Allow or block downgrading to RouterOS versions outside the allowed-versions list. |
| `partitions` | Argument | bool | Allow or block changing partition count. |
| `routerboard` | Argument | bool | Allow or block `/system/routerboard/settings` (except auto-upgrade) and SwOS/RouterOS transition on dual-boot devices. |
| `activation-timeout` | Argument | time | How long to wait for the physical confirmation (button press or power cycle) before the update is canceled. Also sets the length of the `attempt-count` reset window when an update is refused after three unsuccessful attempts. Range: 00:00:10 to 1d00:00:00. Default: 5m. |
| `update` | Read-only Argument | string | Status of a pending update with the time left to confirm it; empty when no update is pending. |

### `/system/package/apply-changes`

Type: Command · Match: exact · [Official source](https://manual.mikrotik.com/docs/cli-reference/system/package/apply-changes)

| Field | Kind | Type | Description |
|---|---|---|---|
| `ignore-missing` | Argument | bool | Upgrade only the RouterOS main package, omitting packages that are missing or not uploaded. |

### `/system/package/enable`

Type: Command · Match: exact · [Official source](https://manual.mikrotik.com/docs/cli-reference/system/package/enable)

### `/system/package/update`

Type: Settings Directory · Match: exact · [Official source](https://manual.mikrotik.com/docs/cli-reference/system/package/update)

| Field | Kind | Type | Description |
|---|---|---|---|
| `channel` | Argument | enum (long-term \| stable \| testing \| development) | Upgrade channel to use when checking for new versions. |
| `mode` | Argument | enum (https \| http) | Protocol for connecting to the MikroTik download server. Use `http` only if your network blocks HTTPS. HTTPS is recommended. |
| `check-certificate` | Argument | enum (no \| yes \| yes-without-crl) | Whether and how to validate the server SSL certificate. Always use `yes` to ensure a secure connection. `yes-without-crl` can be used to skip CRL validation. |
| `ip-version` | Argument | enum (auto \| ipv4 \| ipv6) | IP version preference for connecting to the MikroTik download server. |
| `installed-version` | Read-only Argument | string | Currently installed RouterOS version. |
| `latest-version` | Read-only Argument | string | Latest available RouterOS version in the selected channel. |
| `status` | Read-only Argument | string | Current status of the update process (for example, `New version is available`). |

### `/system/package/update/cancel`

Type: Command · Match: exact · [Official source](https://manual.mikrotik.com/docs/cli-reference/system/package/update/cancel)

### `/system/package/update/check-for-updates`

Type: Command · Match: exact · [Official source](https://manual.mikrotik.com/docs/cli-reference/system/package/update/check-for-updates)

| Field | Kind | Type | Description |
|---|---|---|---|
| `fetch-changelog` | Argument | switch | Whether to fetch the changelog along with the update check. |
| `changelog` | Read-only Argument | string | Changelog text for the latest available version. |

### `/system/package/update/download`

Type: Command · Match: exact · [Official source](https://manual.mikrotik.com/docs/cli-reference/system/package/update/download)

| Field | Kind | Type | Description |
|---|---|---|---|
| `ignore-missing` | Argument | bool | Download only the RouterOS main package, omitting packages that are missing or not uploaded. |

### `/system/package/update/install`

Type: Command · Match: exact · [Official source](https://manual.mikrotik.com/docs/cli-reference/system/package/update/install)

| Field | Kind | Type | Description |
|---|---|---|---|
| `ignore-missing` | Argument | bool | Install only the RouterOS main package, omitting packages that are missing or not uploaded. |

### `/system/reboot`

Type: Command · Match: exact · [Official source](https://manual.mikrotik.com/docs/cli-reference/system/reboot)

### `/system/resource`

Type: Settings Directory · Match: exact · [Official source](https://manual.mikrotik.com/docs/cli-reference/system/resource)

| Field | Kind | Type | Description |
|---|---|---|---|
| `uptime` | Read-only Argument | time | Time interval passed since boot-up |
| `version` | Read-only Argument | string | Installed RouterOS version number |
| `build-time` | Read-only Argument | string | Installed RouterOS version build-time |
| `minimum-version` | Read-only Argument | string | Minimum RouterOS version the board allows downgrading to (was factory-software) |
| `free-memory` | Read-only Argument | num | The unused amount of RAM |
| `total-memory` | Read-only Argument | num | Amount of installed RAM |
| `cpu` | Read-only Argument | string | CPU model that is on the board |
| `cpu-count` | Read-only Argument | num | Number of CPUs present on the system; each core is a separate CPU, Intel HT also counts as one CPU |
| `cpu-frequency` | Read-only Argument | num | Current CPU frequency |
| `cpu-load` | Read-only Argument | num | Percentage of used CPU resources, combined for all CPUs; per-core values are in `/system/resource/cpu` |
| `free-hdd-space` | Read-only Argument | num | Free space on the hard drive or NAND |
| `total-hdd-space` | Read-only Argument | num | Size of the hard drive or NAND |
| `write-sect-since-reboot` | Read-only Argument | num | The number of sector writes to the drive/NAND since the router was last rebooted |
| `write-sect-total` | Read-only Argument | num | The number of sector writes in total |
| `bad-blocks` | Read-only Argument | num | Percentage of bad blocks on the NAND |
| `architecture-name` | Read-only Argument | string | CPU architecture of this build (arm, arm64, x86, tile ...) |
| `board-name` | Read-only Argument | string | RouterBOARD model name |
| `platform` | Read-only Argument | string | Platform name |

### `/system/resource/cpu`

Type: Directory · Match: exact · [Official source](https://manual.mikrotik.com/docs/cli-reference/system/resource/cpu)

| Field | Kind | Type | Description |
|---|---|---|---|
| `cpu` | Read-only Argument | string | Identification number of the CPU whose usage is shown |
| `load` | Read-only Argument | num | CPU usage in percent |
| `irq` | Read-only Argument | num | IRQ usage in percent |
| `disk` | Read-only Argument | num | Disk usage in percent |

### `/system/resource/hardware`

Type: Directory · Match: exact · Conditions: !powerpc, !smips · [Official source](https://manual.mikrotik.com/docs/cli-reference/system/resource/hardware)

| Field | Kind | Type | Description |
|---|---|---|---|
| `device-name` | Read-only Argument | string | Name of the device as reported by its firmware (name column refinement) |
| `location` | Read-only Argument | string | Device location in the system topology |
| `parent` | Read-only Argument | enum | Parent bus or controller |
| `type` | Read-only Argument | enum (usb \| pci \| scsi \| serial) | Bus type of the device: `usb`, `pci`, `scsi` or `serial` |
| `vendor` | Read-only Argument | string | Device vendor name |
| `name` | Read-only Argument | string | Device name or model |
| `category` | Read-only Argument | string | Device category |
| `serial-number` | Read-only Argument | string | Device serial number |
| `vendor-id` | Read-only Argument | string | Vendor identifier (VID) |
| `device-id` | Read-only Argument | string | Device identifier (PID / Device ID) |
| `speed` | Read-only Argument | string | Negotiated device speed |
| `ports` | Read-only Argument | num | Number of ports provided by the device |
| `usb-version` | Read-only Argument | string | Supported USB version |
| `manufacturer-reported-max-power` | Read-only Argument | string | Maximum power draw reported by the device (for example a USB modem) |
| `irq` | Read-only Argument | num | Assigned interrupt number |
| `memory` | Read-only Argument | multi { range: composite { min: num , max: num } } | Memory window assigned to the device |
| `io` | Read-only Argument | multi { range: composite { min: num , max: num } } | I/O window assigned to the device |
| `owner` | Read-only Argument | string | Subsystem or driver owning the device |
| `device-path` | Read-only Argument | multi { path: string } | Device path from root bus to endpoint |

| Flag | Name | Description |
|---|---|---|
| `I` | inactive | inactive: the device is present but not active |

### `/system/resource/hardware/authorize`

Type: Command · Match: exact · Conditions: !powerpc, !smips · [Official source](https://manual.mikrotik.com/docs/cli-reference/system/resource/hardware/authorize)

| Field | Kind | Type | Description |
|---|---|---|---|
| `allow` | Argument | bool | Authorize the USB device (`yes`) or keep it unusable (`no`) |

### `/system/resource/hardware/usb-power-reset`

Type: Command · Match: exact · Conditions: !powerpc, !smips, i386 · [Official source](https://manual.mikrotik.com/docs/cli-reference/system/resource/hardware/usb-power-reset)

| Field | Kind | Type | Description |
|---|---|---|---|
| `duration` | Argument | time | Power-off duration before re-enabling USB |
| `bus` | Argument | num | USB bus number (as shown by `/system/resource/hardware`) |
| `slot` | Argument | num | USB slot number on the bus |

### `/system/resource/hardware/usb-settings`

Type: Settings Directory · Match: exact · Conditions: !powerpc, !smips · [Official source](https://manual.mikrotik.com/docs/cli-reference/system/resource/hardware/usb-settings)

| Field | Kind | Type | Description |
|---|---|---|---|
| `authorization` | Argument | bool | Require per-device authorization before USB devices become usable (`authorization=yes`) |

### `/system/resource/irq`

Type: Directory · Match: exact · [Official source](https://manual.mikrotik.com/docs/cli-reference/system/resource/irq)

| Field | Kind | Type | Description |
|---|---|---|---|
| `cpu` | Argument | num | The CPU the IRQ is pinned to; `auto` lets the scheduler balance by interrupt counts |
| `irq` | Read-only Argument | num | IRQ identification number |
| `users` | Read-only Argument | object { user: alt { interface: iface_enum , other: string } } | Process/driver bound to the IRQ |
| `active-cpu` | Read-only Argument | num | The CPU currently serving the IRQ on multicore systems |
| `count` | Read-only Argument | num | The number of interrupts handled (on ethernet interfaces interrupt = packet) |
| `per-cpu-count` | Read-only Argument | multi { count: num } | Per-CPU interrupt counts as a list |

| Flag | Name | Description |
|---|---|---|
| `o` | read-only | read-only (the CPU assignment is fixed by the hardware) |

### `/system/resource/irq/rps`

Type: Directory · Match: manual-only (no inspect crosswalk) · Syscap: `rps` · [Official source](https://manual.mikrotik.com/docs/cli-reference/system/resource/irq/rps)

| Field | Kind | Type | Description |
|---|---|---|---|
| `interface` | Argument | iface_enum | Interface whose receive path is steered |

| Flag | Name | Description |
|---|---|---|
| `X` | disabled | disabled entry (RPS steering off for this interface) |

### `/system/resource/monitor`

Type: Command · Match: exact · [Official source](https://manual.mikrotik.com/docs/cli-reference/system/resource/monitor)

| Field | Kind | Type | Description |
|---|---|---|---|
| `cpu-used` | Read-only Argument | num | Total CPU usage across cores |
| `cpu-used-per-core` | Read-only Argument | multi { cpu-used: num } | One line per core with its percent usage |
| `free-memory` | Read-only Argument | num | Free memory in KiB |
