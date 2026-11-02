<!-- GENERATED from rosetta export v0.12.0-next.123 (tree 7.26) by scripts/build-refs.ts — do not edit by hand. -->

# routeros-container CLI reference (rosetta v0.12.0-next.123)

Generated slice of the rosetta export covering this skill's owned menus. Regenerate with `bun scripts/build-refs.ts --export <dir>`.

| Provenance | Value |
|---|---|
| release_tag | `v0.12.0-next.123` |
| schema_version | `12` |
| source_commit | `84c890ddcb55c80176fc2bdb0d3db038fb73e22f` |
| built_at | `2026-10-21T17:12:26.963Z` |
| docs_manual_version | `7.26` |
| cliref_tree | `7.26` |
| cliref_rows_digest | `610ac4a0dde812fb…` |

## `/app/add`

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

## `/app/cleanup`

| Property | Description |
|---|---|
| `numbers` | — |

## `/app/disable`

| Property | Description |
|---|---|
| `numbers` | — |

## `/app/edit`

| Property | Description |
|---|---|
| `number` | — |
| `value-name` | — |

## `/app/enable`

| Property | Description |
|---|---|
| `numbers` | — |

## `/app/export`

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

## `/app/find`

| Property | Description |
|---|---|
| `where` | — |

## `/app/get`

| Property | Description |
|---|---|
| `as-string` | — |
| `as-string-value` | — |
| `number` | — |
| `value-name` | — |

## `/app/network/find`

| Property | Description |
|---|---|
| `where` | — |

## `/app/network/get`

| Property | Description |
|---|---|
| `as-string` | — |
| `as-string-value` | — |
| `number` | — |
| `value-name` | — |

## `/app/network/print`

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

## `/app/network/reset`

| Property | Description |
|---|---|
| `allow-outgoing-access` | — |
| `name` | string value |
| `numbers` | — |

## `/app/print`

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

## `/app/remove`

| Property | Description |
|---|---|
| `numbers` | — |

## `/app/reset`

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

## `/app/restart`

| Property | Description |
|---|---|
| `numbers` | — |

## `/app/set`

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

## `/app/settings/edit`

| Property | Description |
|---|---|
| `value-name` | — |

## `/app/settings/export`

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

## `/app/settings/get`

| Property | Description |
|---|---|
| `as-string` | — |
| `as-string-value` | — |
| `value-name` | — |

## `/app/settings/print`

| Property | Description |
|---|---|
| `as-value` | — |
| `comments` | — |
| `file` | — |
| `interval` | 00:00:00.200.. (time interval) |
| `without-paging` | — |

## `/app/settings/reset`

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

## `/app/settings/set`

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

## `/app/unset`

| Property | Description |
|---|---|
| `numbers` | — |
| `value-name` | — |

## `/app/update`

| Property | Description |
|---|---|
| `numbers` | — |

## `/console/inspect`

| Property | Description |
|---|---|
| `as-value` | — |
| `input` | string value |
| `path` | string value |
| `proplist` | — |
| `request` | self\|child\|completion\|highlight\|syntax\|error[,Request*] |
| `without-paging` | — |

## `/container/add`

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

## `/container/comment`

| Property | Description |
|---|---|
| `comment` | string value |
| `numbers` | — |

## `/container/config/edit`

| Property | Description |
|---|---|
| `value-name` | — |

## `/container/config/export`

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

## `/container/config/get`

| Property | Description |
|---|---|
| `as-string` | — |
| `as-string-value` | — |
| `value-name` | — |

## `/container/config/print`

| Property | Description |
|---|---|
| `as-value` | — |
| `comments` | — |
| `file` | — |
| `interval` | 00:00:00.200.. (time interval) |
| `show-sensitive` | — |
| `without-paging` | — |

## `/container/config/reset`

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

## `/container/config/set`

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

## `/container/edit`

| Property | Description |
|---|---|
| `number` | — |
| `value-name` | — |

## `/container/envs/add`

| Property | Description |
|---|---|
| `comment` | string value |
| `copy-from` | — |
| `disabled` | — |
| `key` | string value |
| `list` | — |
| `value` | string value |

## `/container/envs/comment`

| Property | Description |
|---|---|
| `comment` | string value |
| `numbers` | — |

## `/container/envs/disable`

| Property | Description |
|---|---|
| `numbers` | — |

## `/container/envs/edit`

| Property | Description |
|---|---|
| `number` | — |
| `value-name` | — |

## `/container/envs/enable`

| Property | Description |
|---|---|
| `numbers` | — |

## `/container/envs/export`

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

## `/container/envs/find`

| Property | Description |
|---|---|
| `where` | — |

## `/container/envs/get`

| Property | Description |
|---|---|
| `as-string` | — |
| `as-string-value` | — |
| `number` | — |
| `value-name` | — |

## `/container/envs/print`

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

## `/container/envs/remove`

| Property | Description |
|---|---|
| `numbers` | — |

## `/container/envs/reset`

| Property | Description |
|---|---|
| `comment` | string value |
| `disabled` | — |
| `key` | string value |
| `list` | — |
| `numbers` | — |
| `value` | string value |

## `/container/envs/set`

| Property | Description |
|---|---|
| `comment` | string value |
| `disabled` | — |
| `key` | string value |
| `list` | — |
| `numbers` | — |
| `value` | string value |

## `/container/export`

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

## `/container/find`

| Property | Description |
|---|---|
| `where` | — |

## `/container/get`

| Property | Description |
|---|---|
| `as-string` | — |
| `as-string-value` | — |
| `number` | — |
| `value-name` | — |

## `/container/kill`

| Property | Description |
|---|---|
| `as-value` | — |
| `number` | — |
| `signal` | — |

## `/container/layers/find`

| Property | Description |
|---|---|
| `where` | — |

## `/container/layers/get`

| Property | Description |
|---|---|
| `as-string` | — |
| `as-string-value` | — |
| `number` | — |
| `value-name` | — |

## `/container/layers/print`

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

## `/container/log/find`

| Property | Description |
|---|---|
| `where` | — |

## `/container/log/get`

| Property | Description |
|---|---|
| `as-string` | — |
| `as-string-value` | — |
| `number` | — |
| `value-name` | — |

## `/container/log/print`

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

## `/container/mounts/add`

| Property | Description |
|---|---|
| `comment` | string value |
| `copy-from` | — |
| `disabled` | — |
| `dst` | string value |
| `list` | — |
| `mode` | — |
| `src` | — |

## `/container/mounts/comment`

| Property | Description |
|---|---|
| `comment` | string value |
| `numbers` | — |

## `/container/mounts/disable`

| Property | Description |
|---|---|
| `numbers` | — |

## `/container/mounts/edit`

| Property | Description |
|---|---|
| `number` | — |
| `value-name` | — |

## `/container/mounts/enable`

| Property | Description |
|---|---|
| `numbers` | — |

## `/container/mounts/export`

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

## `/container/mounts/find`

| Property | Description |
|---|---|
| `where` | — |

## `/container/mounts/get`

| Property | Description |
|---|---|
| `as-string` | — |
| `as-string-value` | — |
| `number` | — |
| `value-name` | — |

## `/container/mounts/print`

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

## `/container/mounts/remove`

| Property | Description |
|---|---|
| `numbers` | — |

## `/container/mounts/reset`

| Property | Description |
|---|---|
| `comment` | string value |
| `disabled` | — |
| `dst` | string value |
| `list` | — |
| `mode` | — |
| `numbers` | — |
| `src` | — |

## `/container/mounts/set`

| Property | Description |
|---|---|
| `comment` | string value |
| `disabled` | — |
| `dst` | string value |
| `list` | — |
| `mode` | — |
| `numbers` | — |
| `src` | — |

## `/container/print`

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

## `/container/remove`

| Property | Description |
|---|---|
| `numbers` | — |

## `/container/repull`

| Property | Description |
|---|---|
| `as-value` | — |
| `file` | — |
| `number` | — |
| `remote-image` | string value |

## `/container/reset`

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

## `/container/restart`

| Property | Description |
|---|---|
| `as-value` | — |
| `number` | — |

## `/container/run`

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

## `/container/save`

| Property | Description |
|---|---|
| `commit` | — |
| `file` | — |
| `name` | string value |
| `number` | — |

## `/container/set`

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

## `/container/shell`

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

## `/container/start`

| Property | Description |
|---|---|
| `numbers` | — |

## `/container/stop`

| Property | Description |
|---|---|
| `numbers` | — |

## `/container/unset`

| Property | Description |
|---|---|
| `numbers` | — |
| `value-name` | — |

## `/container/update`

| Property | Description |
|---|---|
| `as-value` | — |
| `number` | — |

## `/interface/bridge/add`

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

## `/interface/bridge/port/add`

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

## `/interface/bridge/port/comment`

| Property | Description |
|---|---|
| `comment` | string value |
| `numbers` | — |

## `/interface/bridge/port/disable`

| Property | Description |
|---|---|
| `numbers` | — |

## `/interface/bridge/port/edit`

| Property | Description |
|---|---|
| `number` | — |
| `value-name` | — |

## `/interface/bridge/port/enable`

| Property | Description |
|---|---|
| `numbers` | — |

## `/interface/bridge/port/export`

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

## `/interface/bridge/port/find`

| Property | Description |
|---|---|
| `where` | — |

## `/interface/bridge/port/get`

| Property | Description |
|---|---|
| `as-string` | — |
| `as-string-value` | — |
| `number` | — |
| `value-name` | — |

## `/interface/bridge/port/monitor`

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

## `/interface/bridge/port/move`

| Property | Description |
|---|---|
| `destination` | — |
| `numbers` | — |

## `/interface/bridge/port/mst-override/add`

| Property | Description |
|---|---|
| `comment` | string value |
| `copy-from` | — |
| `disabled` | — |
| `identifier` | — |
| `interface` | — |
| `internal-path-cost` | — |
| `priority` | — |

## `/interface/bridge/port/mst-override/comment`

| Property | Description |
|---|---|
| `comment` | string value |
| `numbers` | — |

## `/interface/bridge/port/mst-override/disable`

| Property | Description |
|---|---|
| `numbers` | — |

## `/interface/bridge/port/mst-override/edit`

| Property | Description |
|---|---|
| `number` | — |
| `value-name` | — |

## `/interface/bridge/port/mst-override/enable`

| Property | Description |
|---|---|
| `numbers` | — |

## `/interface/bridge/port/mst-override/export`

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

## `/interface/bridge/port/mst-override/find`

| Property | Description |
|---|---|
| `where` | — |

## `/interface/bridge/port/mst-override/get`

| Property | Description |
|---|---|
| `as-string` | — |
| `as-string-value` | — |
| `number` | — |
| `value-name` | — |

## `/interface/bridge/port/mst-override/monitor`

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

## `/interface/bridge/port/mst-override/print`

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

## `/interface/bridge/port/mst-override/remove`

| Property | Description |
|---|---|
| `numbers` | — |

## `/interface/bridge/port/mst-override/reset`

| Property | Description |
|---|---|
| `comment` | string value |
| `disabled` | — |
| `identifier` | — |
| `interface` | — |
| `internal-path-cost` | — |
| `numbers` | — |
| `priority` | — |

## `/interface/bridge/port/mst-override/set`

| Property | Description |
|---|---|
| `comment` | string value |
| `disabled` | — |
| `identifier` | — |
| `interface` | — |
| `internal-path-cost` | — |
| `numbers` | — |
| `priority` | — |

## `/interface/bridge/port/mst-override/unset`

| Property | Description |
|---|---|
| `numbers` | — |
| `value-name` | — |

## `/interface/bridge/port/print`

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

## `/interface/bridge/port/remove`

| Property | Description |
|---|---|
| `numbers` | — |

## `/interface/bridge/port/reset`

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

## `/interface/bridge/port/set`

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

## `/interface/bridge/port/unset`

| Property | Description |
|---|---|
| `numbers` | — |
| `value-name` | — |

## `/interface/list/member/add`

| Property | Description |
|---|---|
| `comment` | string value |
| `copy-from` | — |
| `disabled` | — |
| `interface` | — |
| `list` | — |

## `/interface/list/member/comment`

| Property | Description |
|---|---|
| `comment` | string value |
| `numbers` | — |

## `/interface/list/member/disable`

| Property | Description |
|---|---|
| `numbers` | — |

## `/interface/list/member/edit`

| Property | Description |
|---|---|
| `number` | — |
| `value-name` | — |

## `/interface/list/member/enable`

| Property | Description |
|---|---|
| `numbers` | — |

## `/interface/list/member/export`

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

## `/interface/list/member/find`

| Property | Description |
|---|---|
| `where` | — |

## `/interface/list/member/get`

| Property | Description |
|---|---|
| `as-string` | — |
| `as-string-value` | — |
| `number` | — |
| `value-name` | — |

## `/interface/list/member/print`

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

## `/interface/list/member/remove`

| Property | Description |
|---|---|
| `numbers` | — |

## `/interface/list/member/reset`

| Property | Description |
|---|---|
| `comment` | string value |
| `disabled` | — |
| `interface` | — |
| `list` | — |
| `numbers` | — |

## `/interface/list/member/set`

| Property | Description |
|---|---|
| `comment` | string value |
| `disabled` | — |
| `interface` | — |
| `list` | — |
| `numbers` | — |

## `/interface/veth/add`

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

## `/ip/address/add`

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

## `/ip/firewall/nat/add`

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

## `/log/debug`

| Property | Description |
|---|---|
| `message` | string value |

## `/log/error`

| Property | Description |
|---|---|
| `message` | string value |

## `/log/find`

| Property | Description |
|---|---|
| `where` | — |

## `/log/get`

| Property | Description |
|---|---|
| `as-string` | — |
| `as-string-value` | — |
| `number` | — |
| `value-name` | — |

## `/log/info`

| Property | Description |
|---|---|
| `message` | string value |

## `/log/print`

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

## `/log/warning`

| Property | Description |
|---|---|
| `message` | string value |

## `/system/device-mode/update`

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

## `/system/package/apply-changes`

| Property | Description |
|---|---|
| `ignore-missing` | — |

## `/system/package/enable`

| Property | Description |
|---|---|
| `numbers` | — |

## `/system/package/print`

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

## `/system/package/update/cancel`

| Property | Description |
|---|---|
| `as-value` | — |

## `/system/package/update/check-for-updates`

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

## `/system/package/update/download`

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

## `/system/package/update/edit`

| Property | Description |
|---|---|
| `value-name` | — |

## `/system/package/update/export`

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

## `/system/package/update/get`

| Property | Description |
|---|---|
| `as-string` | — |
| `as-string-value` | — |
| `value-name` | — |

## `/system/package/update/install`

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

## `/system/package/update/print`

| Property | Description |
|---|---|
| `as-value` | — |
| `comments` | — |
| `file` | — |
| `interval` | 00:00:00.200.. (time interval) |
| `without-paging` | — |

## `/system/package/update/reset`

| Property | Description |
|---|---|
| `channel` | — |
| `check-certificate` | — |
| `ip-version` | — |
| `mode` | — |

## `/system/package/update/set`

| Property | Description |
|---|---|
| `channel` | — |
| `check-certificate` | — |
| `ip-version` | — |
| `mode` | — |

## `/system/resource/cpu/find`

| Property | Description |
|---|---|
| `where` | — |

## `/system/resource/cpu/get`

| Property | Description |
|---|---|
| `as-string` | — |
| `as-string-value` | — |
| `number` | — |
| `value-name` | — |

## `/system/resource/cpu/print`

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

## `/system/resource/export`

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

## `/system/resource/get`

| Property | Description |
|---|---|
| `as-string` | — |
| `as-string-value` | — |
| `value-name` | — |

## `/system/resource/hardware/authorize`

| Property | Description |
|---|---|
| `allow` | — |
| `numbers` | — |

## `/system/resource/hardware/export`

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

## `/system/resource/hardware/find`

| Property | Description |
|---|---|
| `where` | — |

## `/system/resource/hardware/get`

| Property | Description |
|---|---|
| `as-string` | — |
| `as-string-value` | — |
| `number` | — |
| `value-name` | — |

## `/system/resource/hardware/print`

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

## `/system/resource/hardware/usb-power-reset`

| Property | Description |
|---|---|
| `bus` | — |
| `duration` | time interval |
| `slot` | — |

## `/system/resource/hardware/usb-settings/edit`

| Property | Description |
|---|---|
| `value-name` | — |

## `/system/resource/hardware/usb-settings/export`

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

## `/system/resource/hardware/usb-settings/get`

| Property | Description |
|---|---|
| `as-string` | — |
| `as-string-value` | — |
| `value-name` | — |

## `/system/resource/hardware/usb-settings/print`

| Property | Description |
|---|---|
| `as-value` | — |
| `comments` | — |
| `file` | — |
| `interval` | 00:00:00.200.. (time interval) |
| `without-paging` | — |

## `/system/resource/hardware/usb-settings/reset`

| Property | Description |
|---|---|
| `authorization` | — |

## `/system/resource/hardware/usb-settings/set`

| Property | Description |
|---|---|
| `authorization` | — |

## `/system/resource/irq/edit`

| Property | Description |
|---|---|
| `number` | — |
| `value-name` | — |

## `/system/resource/irq/export`

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

## `/system/resource/irq/find`

| Property | Description |
|---|---|
| `where` | — |

## `/system/resource/irq/get`

| Property | Description |
|---|---|
| `as-string` | — |
| `as-string-value` | — |
| `number` | — |
| `value-name` | — |

## `/system/resource/irq/print`

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

## `/system/resource/irq/reset`

| Property | Description |
|---|---|
| `cpu` | — |
| `numbers` | — |

## `/system/resource/irq/set`

| Property | Description |
|---|---|
| `cpu` | — |
| `numbers` | — |

## `/system/resource/monitor`

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

## `/system/resource/print`

| Property | Description |
|---|---|
| `as-value` | — |
| `comments` | — |
| `file` | — |
| `interval` | 00:00:00.200.. (time interval) |
| `oid` | — |
| `without-paging` | — |

## Read-only and manual fields (tree 7.26)

### `/app/network`

| Field | Kind | Description |
|---|---|---|
| `allow-outgoing-access` | Argument |  |
| `bridge-interface` | Read-only Argument |  |
| `cmds` | Read-only Argument |  |
| `ip` | Read-only Argument |  |
| `name` | Argument |  |
| `network` | Read-only Argument |  |
| `status` | Read-only Argument |  |
| `used-ips` | Read-only Argument |  |

### `/app/settings`

| Field | Kind | Description |
|---|---|---|
| `app-store-urls` | Argument | URL to a custom app store. Must point to a YAML array where each application is an element |
| `assumed-download-path` | Read-only Argument | Default download directory path, typically located within the media storage area |
| `assumed-lan-bridge` | Read-only Argument | Automatically detected bridge interface used for LAN connectivity |
| `assumed-media-path` | Read-only Argument | Default media storage path, typically located on the system disk |
| `assumed-router-ip` | Read-only Argument | Automatically detected network IP address of the RouterOS device |
| `auto-update` | Argument | Global setting that enables automatic updates for all installed applications packages |
| `certificate` | Read-only Argument |  |
| `certificate-status` | Read-only Argument |  |
| `disk` | Argument | Global setting that specifies which disk will be used for storage operations |
| `download-path` | Argument | Manually specifies the directory path where all downloaded content will be stored |
| `lan-bridge` | Argument | Manually specifies the bridge interface that represents the local area network |
| `media-path` | Argument | Manually specifies the directory path where all media files will be stored |
| `registry-mirrors` | Argument | Specifies one or more registry mirror URLs for container image retrieval |
| `router-ip` | Argument | Manually specifies the IP address at which the current RouterOS device can be reached |
| `show-in-webfig` | Argument | Controls whether links to enabled applications are displayed on the WebFig login page |

### `/app/setup`

| Field | Kind | Description |
|---|---|---|
| `disk` | Read-only Argument | Selected storage disk for application installation |
| `lan-bridge` | Read-only Argument | Selected LAN bridge interface for container networking |
| `router-ip-alt` | Read-only Argument | Manual IP address override for the RouterOS device |

### `/console/inspect`

| Field | Kind | Description |
|---|---|---|
| `completion` | Read-only Argument |  |
| `highlight` | Read-only Argument |  |
| `input` | Argument |  |
| `name` | Read-only Argument |  |
| `nested` | Read-only Argument |  |
| `node-type` | Read-only Argument |  |
| `nonorm` | Read-only Argument |  |
| `offset` | Read-only Argument |  |
| `path` | Argument |  |
| `preference` | Read-only Argument |  |
| `request` | Argument |  |
| `show` | Read-only Argument |  |
| `style` | Read-only Argument |  |
| `symbol` | Read-only Argument |  |
| `symbol-type` | Read-only Argument |  |
| `text` | Read-only Argument |  |
| `type` | Read-only Argument |  |

### `/container`

| Field | Kind | Description |
|---|---|---|
| `arch` | Read-only Argument |  |
| `check-certificate` | Argument |  |
| `cmd` | Argument |  |
| `config-json` | Read-only Argument |  |
| `container-size` | Read-only Argument |  |
| `cpu-list` | Argument |  |
| `cpu-usage` | Read-only Argument |  |
| `data-size` | Read-only Argument |  |
| `default-cmd` | Read-only Argument |  |
| `default-dns` | Argument |  |
| `default-entrypoint` | Read-only Argument |  |
| `default-healthcheck-cmd` | Read-only Argument |  |
| `default-healthcheck-interval` | Read-only Argument |  |
| `default-healthcheck-retries` | Read-only Argument |  |
| `default-healthcheck-start-interval` | Read-only Argument |  |
| `default-healthcheck-start-period` | Read-only Argument |  |
| `default-healthcheck-timeout` | Read-only Argument |  |
| `default-shell` | Read-only Argument |  |
| `default-stop-signal` | Read-only Argument |  |
| `default-user` | Read-only Argument |  |
| `default-workdir` | Read-only Argument |  |
| `devices` | Argument |  |
| `dns` | Argument |  |
| `domain-name` | Argument |  |
| `entrypoint` | Argument |  |
| `env` | Argument |  |
| `env-current` | Read-only Argument |  |
| `envlists` | Argument |  |
| `file` | Argument |  |
| `healthcheck-cmd` | Argument |  |
| `healthcheck-interval` | Argument |  |
| `healthcheck-retries` | Argument |  |
| `healthcheck-start-interval` | Argument |  |
| `healthcheck-start-period` | Argument |  |
| `healthcheck-status` | Argument |  |
| `healthcheck-timeout` | Argument |  |
| `hostname` | Argument |  |
| `hosts` | Argument |  |
| `ignore-remote-image-change` | Argument |  |
| `image-id` | Read-only Argument |  |
| `interface` | Argument |  |
| `layer-dir` | Argument |  |
| `layers` | Read-only Argument |  |
| `logging` | Argument |  |
| `memory-current` | Read-only Argument |  |
| `memory-high` | Argument |  |
| `memory-max` | Argument |  |
| `mount` | Argument |  |
| `mountlists` | Argument |  |
| `name` | Argument |  |
| `os` | Read-only Argument |  |
| `privileged` | Argument |  |
| `remote-image` | Argument |  |
| `restart-count` | Read-only Argument |  |
| `restart-interval` | Argument |  |
| `restart-max-count` | Argument |  |
| `restart-policy` | Argument |  |
| `root-dir` | Argument |  |
| `shell` | Argument |  |
| `shm-size` | Argument |  |
| `start-on-boot` | Argument |  |
| `stop-on-unhealthy` | Argument |  |
| `stop-signal` | Argument |  |
| `stop-time` | Argument |  |
| `swap-current` | Read-only Argument |  |
| `swap-max` | Argument |  |
| `tag` | Read-only Argument |  |
| `tmpfs` | Argument |  |
| `user` | Argument |  |
| `workdir` | Argument |  |

### `/container/config`

| Field | Kind | Description |
|---|---|---|
| `assumed-registry-url` | Read-only Argument |  |
| `layer-dir` | Argument |  |
| `memory-current` | Read-only Argument |  |
| `memory-high` | Argument |  |
| `memory-max` | Argument |  |
| `password` | Argument |  |
| `registry-url` | Argument |  |
| `swap-current` | Read-only Argument |  |
| `swap-max` | Argument |  |
| `tmpdir` | Argument |  |
| `username` | Argument |  |

### `/container/envs`

| Field | Kind | Description |
|---|---|---|
| `key` | Argument |  |
| `list` | Argument |  |
| `value` | Argument |  |

### `/container/kill`

| Field | Kind | Description |
|---|---|---|
| `signal` | Argument |  |

### `/container/layers`

| Field | Kind | Description |
|---|---|---|
| `containers` | Read-only Argument |  |
| `layer-dir` | Read-only Argument |  |
| `name` | Read-only Argument |  |
| `size` | Read-only Argument |  |
| `type` | Read-only Argument |  |

### `/container/log`

| Field | Kind | Description |
|---|---|---|
| `container` | Read-only Argument |  |
| `message` | Read-only Argument |  |
| `time` | Read-only Argument |  |

### `/container/mounts`

| Field | Kind | Description |
|---|---|---|
| `dst` | Argument |  |
| `list` | Argument |  |
| `mode` | Argument |  |
| `src` | Argument |  |

### `/container/repull`

| Field | Kind | Description |
|---|---|---|
| `file` | Argument |  |
| `remote-image` | Argument |  |

### `/container/save`

| Field | Kind | Description |
|---|---|---|
| `commit` | Argument |  |
| `file` | Argument |  |
| `name` | Argument |  |

### `/interface/bridge/port`

| Field | Kind | Description |
|---|---|---|
| `actual-path-cost` | Read-only Argument |  |
| `auto-isolate` | Argument |  |
| `bpdu-guard` | Argument |  |
| `bridge` | Argument |  |
| `broadcast-flood` | Argument |  |
| `debug-info` | Read-only Argument |  |
| `declared-vlan-ids` | Read-only Argument |  |
| `designated-bridge-id` | Read-only Argument |  |
| `designated-cost` | Read-only Argument |  |
| `designated-port-id` | Read-only Argument |  |
| `discard-transitions` | Read-only Argument |  |
| `edge` | Argument |  |
| `edge-port` | Read-only Argument |  |
| `edge-port-discovery` | Read-only Argument |  |
| `external-fdb-status` | Read-only Argument |  |
| `fast-leave` | Argument |  |
| `forward-transitions` | Read-only Argument |  |
| `forwarding` | Read-only Argument |  |
| `frame-types` | Argument |  |
| `horizon` | Argument |  |
| `hw` | Argument |  |
| `hw-offload` | Read-only Argument |  |
| `hw-offload-group` | Read-only Argument |  |
| `ingress-filtering` | Argument |  |
| `interface` | Argument |  |
| `internal-path-cost` | Argument |  |
| `internal-root-path-cost` | Read-only Argument |  |
| `last-topology-change` | Read-only Argument |  |
| `learn` | Argument |  |
| `learning` | Read-only Argument |  |
| `multicast-router` | Argument |  |
| `multicast-router` | Read-only Argument |  |
| `mvrp-applicant-state` | Argument |  |
| `mvrp-registrar-state` | Argument |  |
| `parent` | Read-only Argument |  |
| `path-cost` | Argument |  |
| `point-to-point` | Argument |  |
| `point-to-point-port` | Read-only Argument |  |
| `port-id` | Read-only Argument |  |
| `priority` | Argument |  |
| `pvid` | Argument |  |
| `registered-vlan-ids` | Read-only Argument |  |
| `restricted-role` | Argument |  |
| `restricted-tcn` | Argument |  |
| `role` | Read-only Argument |  |
| `root-path-cost` | Read-only Argument |  |
| `rx-bpdu` | Read-only Argument |  |
| `rx-tc` | Read-only Argument |  |
| `sending-rstp` | Read-only Argument |  |
| `status` | Read-only Argument |  |
| `tag-stacking` | Argument |  |
| `topology-changes` | Read-only Argument |  |
| `trusted` | Argument |  |
| `trusted-arp` | Argument |  |
| `trusted-dhcpv6` | Argument |  |
| `trusted-ra` | Argument |  |
| `tx-bpdu` | Read-only Argument |  |
| `tx-tc` | Read-only Argument |  |
| `unknown-multicast-flood` | Argument |  |
| `unknown-unicast-flood` | Argument |  |

### `/interface/bridge/port/monitor`

| Field | Kind | Description |
|---|---|---|
| `actual-path-cost` | Read-only Argument |  |
| `declared-vlan-ids` | Read-only Argument |  |
| `designated-bridge-id` | Read-only Argument |  |
| `designated-cost` | Read-only Argument |  |
| `designated-internal-cost` | Read-only Argument |  |
| `designated-max-age` | Read-only Argument |  |
| `designated-message-age` | Read-only Argument |  |
| `designated-port-id` | Read-only Argument |  |
| `designated-remaining-hops` | Read-only Argument |  |
| `discard-transitions` | Read-only Argument |  |
| `edge-port` | Read-only Argument |  |
| `edge-port-discovery` | Read-only Argument |  |
| `external-fdb` | Read-only Argument |  |
| `forward-transitions` | Read-only Argument |  |
| `forwarding` | Read-only Argument |  |
| `hw-offload-group` | Read-only Argument |  |
| `interface` | Read-only Argument |  |
| `internal-root-path-cost` | Read-only Argument |  |
| `last-topology-change` | Read-only Argument |  |
| `learning` | Read-only Argument |  |
| `multicast-router` | Read-only Argument |  |
| `point-to-point-port` | Read-only Argument |  |
| `port-id` | Read-only Argument |  |
| `registered-vlan-ids` | Read-only Argument |  |
| `role` | Read-only Argument |  |
| `root-path-cost` | Read-only Argument |  |
| `sending-rstp` | Read-only Argument |  |
| `status` | Read-only Argument |  |
| `topology-changes` | Read-only Argument |  |
| `tx-rx-bpdu` | Read-only Argument |  |
| `tx-rx-tc` | Read-only Argument |  |

### `/interface/bridge/port/mst-override`

| Field | Kind | Description |
|---|---|---|
| `debug-info` | Read-only Argument |  |
| `identifier` | Argument |  |
| `interface` | Argument |  |
| `internal-path-cost` | Argument |  |
| `priority` | Argument |  |

### `/interface/bridge/port/mst-override/monitor`

| Field | Kind | Description |
|---|---|---|
| `designated-bridge-id` | Read-only Argument |  |
| `designated-cost` | Read-only Argument |  |
| `designated-internal-cost` | Read-only Argument |  |
| `designated-port-id` | Read-only Argument |  |
| `designated-remaining-hops` | Read-only Argument |  |
| `discard-transitions` | Read-only Argument |  |
| `forward-transitions` | Read-only Argument |  |
| `forwarding` | Read-only Argument |  |
| `identifier` | Read-only Argument |  |
| `internal-root-path-cost` | Read-only Argument |  |
| `last-topology-change` | Read-only Argument |  |
| `learning` | Read-only Argument |  |
| `port` | Read-only Argument |  |
| `port-id` | Read-only Argument |  |
| `role` | Read-only Argument |  |
| `status` | Read-only Argument |  |
| `topology-changes` | Read-only Argument |  |
| `tx-rx-bpdu` | Read-only Argument |  |
| `tx-rx-tc` | Read-only Argument |  |

### `/interface/list/member`

| Field | Kind | Description |
|---|---|---|
| `dynamic` | Read-only Argument | Whether the member was added dynamically. |
| `interface` | Argument | Name of the interface that is a member of the list. |
| `list` | Argument | Name of the interface list to which the member belongs. |

### `/log`

| Field | Kind | Description |
|---|---|---|
| `buffer` | Read-only Argument | Buffer the entry belongs to: `memory` for the default buffer, or the name of another memory action or of a disk action. A disk action's newest entries show here, and after a reboot the entries of its active file. `/log/print` without a filter lists every buffer, so a message passed to several actions shows once per action. |
| `extra-info` | Read-only Argument | Extra `key=value` fields that some messages carry, for example a login: `app=ssh duser=admin outcome=success src=192.0.2.1`. `print with-extra-info` appends them to the message, and the `cef` remote log format sends them after `msg=`. |
| `message` | Read-only Argument | Text of the entry, with the rule's `prefix` in front when the rule has one. |
| `time` | Read-only Argument | Date and time the entry was added. |
| `topics` | Read-only Argument | Topics of the entry, for example `system,info,account`. The rules in `/system/logging` select messages by these topics. |

### `/system/device-mode/update`

| Field | Kind | Description |
|---|---|---|
| `activation-timeout` | Argument | How long to wait for the physical confirmation (button press or power cycle) before the update is canceled. Also sets the length of the `attempt-count` reset window when an update is refused after three unsuccessful attempts. Range: 00:00:10 to 1d00:00:00. Default: 5m. |
| `bandwidth-test` | Argument | Allow or block `/tool/bandwidth-test`, `/tool/bandwidth-server` and `/tool/speed-test`. |
| `container` | Argument | Allow or block container functionality. |
| `email` | Argument | Allow or block `/tool/e-mail`. |
| `fetch` | Argument | Allow or block `/tool/fetch`. |
| `flagged` | Argument | Set to `no` to clear the flagged state, after inspecting the configuration for unauthorized changes. Requires physical confirmation. |
| `flagging-enabled` | Argument | Enable or disable the configuration analysis for signs of unauthorized access. Default: yes. |
| `hotspot` | Argument | Allow or block `/ip/hotspot`. |
| `install-any-version` | Argument | Allow or block downgrading to RouterOS versions outside the allowed-versions list. |
| `ipsec` | Argument | Allow or block `/ip/ipsec`. |
| `l2tp` | Argument | Allow or block L2TP client and server interfaces. |
| `mode` | Argument | Device mode to apply. Specifying `mode` replaces the entire device-mode configuration except the other parameters given in the same command; omitted features get the new mode's defaults. - `advanced` - Previously called `enterprise`. - `basic` - For most other devices. - `home` - For home routers. - `rose` - For RDS and similar devices with wide disk use. |
| `partitions` | Argument | Allow or block changing partition count. |
| `pptp` | Argument | Allow or block PPTP client and server interfaces. |
| `proxy` | Argument | Allow or block `/ip/proxy`. |
| `romon` | Argument | Allow or block `/tool/romon`. |
| `routerboard` | Argument | Allow or block `/system/routerboard/settings` (except auto-upgrade) and SwOS/RouterOS transition on dual-boot devices. |
| `scheduler` | Argument | Allow or block `/system/scheduler`. |
| `smb` | Argument | Allow or block `/ip/smb`. |
| `sniffer` | Argument | Allow or block `/tool/sniffer`. |
| `socks` | Argument | Allow or block `/ip/socks`. |
| `traffic-gen` | Argument | Allow or block `/tool/traffic-generator`, `/tool/flood-ping`, and `/tool/ping-speed`. |
| `update` | Read-only Argument | Status of a pending update with the time left to confirm it; empty when no update is pending. |
| `zerotier` | Argument | Allow or block `/zerotier`. |

### `/system/package/apply-changes`

| Field | Kind | Description |
|---|---|---|
| `ignore-missing` | Argument | Upgrade only the RouterOS main package, omitting packages that are missing or not uploaded. |

### `/system/package/update`

| Field | Kind | Description |
|---|---|---|
| `channel` | Argument | Upgrade channel to use when checking for new versions. |
| `check-certificate` | Argument | Whether and how to validate the server SSL certificate. Always use `yes` to ensure a secure connection. `yes-without-crl` can be used to skip CRL validation. |
| `installed-version` | Read-only Argument | Currently installed RouterOS version. |
| `ip-version` | Argument | IP version preference for connecting to the MikroTik download server. |
| `latest-version` | Read-only Argument | Latest available RouterOS version in the selected channel. |
| `mode` | Argument | Protocol for connecting to the MikroTik download server. Use `http` only if your network blocks HTTPS. HTTPS is recommended. |
| `status` | Read-only Argument | Current status of the update process (for example, `New version is available`). |

### `/system/package/update/check-for-updates`

| Field | Kind | Description |
|---|---|---|
| `changelog` | Read-only Argument | Changelog text for the latest available version. |
| `fetch-changelog` | Argument | Whether to fetch the changelog along with the update check. |

### `/system/package/update/download`

| Field | Kind | Description |
|---|---|---|
| `ignore-missing` | Argument | Download only the RouterOS main package, omitting packages that are missing or not uploaded. |

### `/system/package/update/install`

| Field | Kind | Description |
|---|---|---|
| `ignore-missing` | Argument | Install only the RouterOS main package, omitting packages that are missing or not uploaded. |

### `/system/resource`

| Field | Kind | Description |
|---|---|---|
| `architecture-name` | Read-only Argument | CPU architecture of this build (arm, arm64, x86, tile ...) |
| `bad-blocks` | Read-only Argument | Percentage of bad blocks on the NAND |
| `board-name` | Read-only Argument | RouterBOARD model name |
| `build-time` | Read-only Argument | Installed RouterOS version build-time |
| `cpu` | Read-only Argument | CPU model that is on the board |
| `cpu-count` | Read-only Argument | Number of CPUs present on the system; each core is a separate CPU, Intel HT also counts as one CPU |
| `cpu-frequency` | Read-only Argument | Current CPU frequency |
| `cpu-load` | Read-only Argument | Percentage of used CPU resources, combined for all CPUs; per-core values are in `/system/resource/cpu` |
| `free-hdd-space` | Read-only Argument | Free space on the hard drive or NAND |
| `free-memory` | Read-only Argument | The unused amount of RAM |
| `minimum-version` | Read-only Argument | Minimum RouterOS version the board allows downgrading to (was factory-software) |
| `platform` | Read-only Argument | Platform name |
| `total-hdd-space` | Read-only Argument | Size of the hard drive or NAND |
| `total-memory` | Read-only Argument | Amount of installed RAM |
| `uptime` | Read-only Argument | Time interval passed since boot-up |
| `version` | Read-only Argument | Installed RouterOS version number |
| `write-sect-since-reboot` | Read-only Argument | The number of sector writes to the drive/NAND since the router was last rebooted |
| `write-sect-total` | Read-only Argument | The number of sector writes in total |

### `/system/resource/cpu`

| Field | Kind | Description |
|---|---|---|
| `cpu` | Read-only Argument | Identification number of the CPU whose usage is shown |
| `disk` | Read-only Argument | Disk usage in percent |
| `irq` | Read-only Argument | IRQ usage in percent |
| `load` | Read-only Argument | CPU usage in percent |

### `/system/resource/hardware`

| Field | Kind | Description |
|---|---|---|
| `category` | Read-only Argument | Device category |
| `device-id` | Read-only Argument | Device identifier (PID / Device ID) |
| `device-name` | Read-only Argument | Name of the device as reported by its firmware (name column refinement) |
| `device-path` | Read-only Argument | Device path from root bus to endpoint |
| `io` | Read-only Argument | I/O window assigned to the device |
| `irq` | Read-only Argument | Assigned interrupt number |
| `location` | Read-only Argument | Device location in the system topology |
| `manufacturer-reported-max-power` | Read-only Argument | Maximum power draw reported by the device (for example a USB modem) |
| `memory` | Read-only Argument | Memory window assigned to the device |
| `name` | Read-only Argument | Device name or model |
| `owner` | Read-only Argument | Subsystem or driver owning the device |
| `parent` | Read-only Argument | Parent bus or controller |
| `ports` | Read-only Argument | Number of ports provided by the device |
| `serial-number` | Read-only Argument | Device serial number |
| `speed` | Read-only Argument | Negotiated device speed |
| `type` | Read-only Argument | Bus type of the device: `usb`, `pci`, `scsi` or `serial` |
| `usb-version` | Read-only Argument | Supported USB version |
| `vendor` | Read-only Argument | Device vendor name |
| `vendor-id` | Read-only Argument | Vendor identifier (VID) |

### `/system/resource/hardware/authorize`

| Field | Kind | Description |
|---|---|---|
| `allow` | Argument | Authorize the USB device (`yes`) or keep it unusable (`no`) |

### `/system/resource/hardware/usb-power-reset`

| Field | Kind | Description |
|---|---|---|
| `bus` | Argument | USB bus number (as shown by `/system/resource/hardware`) |
| `duration` | Argument | Power-off duration before re-enabling USB |
| `slot` | Argument | USB slot number on the bus |

### `/system/resource/hardware/usb-settings`

| Field | Kind | Description |
|---|---|---|
| `authorization` | Argument | Require per-device authorization before USB devices become usable (`authorization=yes`) |

### `/system/resource/irq`

| Field | Kind | Description |
|---|---|---|
| `active-cpu` | Read-only Argument | The CPU currently serving the IRQ on multicore systems |
| `count` | Read-only Argument | The number of interrupts handled (on ethernet interfaces interrupt = packet) |
| `cpu` | Argument | The CPU the IRQ is pinned to; `auto` lets the scheduler balance by interrupt counts |
| `irq` | Read-only Argument | IRQ identification number |
| `per-cpu-count` | Read-only Argument | Per-CPU interrupt counts as a list |
| `users` | Read-only Argument | Process/driver bound to the IRQ |

### `/system/resource/monitor`

| Field | Kind | Description |
|---|---|---|
| `cpu-used` | Read-only Argument | Total CPU usage across cores |
| `cpu-used-per-core` | Read-only Argument | One line per core with its percent usage |
| `free-memory` | Read-only Argument | Free memory in KiB |
