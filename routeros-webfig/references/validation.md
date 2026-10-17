# WebFig validation record

## Contents

- [Scope and provenance](#scope-and-provenance)
- [Observed behavior](#observed-behavior)
- [Source inspection](#source-inspection)
- [Reproduce](#reproduce)
- [Service toggle check](#service-toggle-check)
- [Limits](#limits)

## Scope and provenance

Independently checked **2026-10-17** using disposable quickchr x86 CHRs,
centrs for RouterOS reads/setup, and Playwright Core 1.64.1 driving an isolated
headless Google Chrome 155 profile. Router-reported versions were **7.24.5
(stable)** and **7.26beta1**; only the latter had the optional `cmr` package.
No existing hardware/router configuration was changed.

Adapted from an external draft proposal. The large 7.24.5 catalog is retained
as structural reference, with explicit caveats and known action types marked.
The draft's independent Python crypto implementation was not repeated and is
not claimed as this validation's result.

A same-day ARM64 cross-check compared a disposable quickchr ARM64 CHR on 7.24.5
against a matching x86 CHR, at base and with all packages installed. Note a
quickchr behavior found while doing this: boolean provisioning flags passed to
`add` (such as `--install-all-packages`) are silently dropped by a later plain
`start <name>` — the CLI's `flagBool` yields `false` for an absent flag, which
defeats the `?? existing` fallback in `QuickCHR.start`. Passing the flag to
`start` instead provisions correctly. The base-to-base comparison therefore
used single-`routeros`-bundle CHRs on both architectures; a third ARM64 machine took
all 18 extra packages (including `ups`) via `start --install-all-packages`.
See [Observed behavior](#observed-behavior).

Served bundle identifiers and SHA-256 digests:

| Version | Resource | SHA-256 |
|---|---|---|
| 7.24.5 | `/webfig/master-552972428261.js` | `4d3b2638fa1a83a48f074bfd2091f3de0cb874f9c2b3cf706410e80e8002913c` |
| 7.24.5 | `/assets/script-582e5506ba67.js` | `a95f92a1d7a66968393f83ee9db14b2ce132cbcb6cbb43ced180794f7679d38b` |
| 7.26beta1 | `/webfig/master-e50b1171994ecb44.js` | `b628c0d3bbd5f3dcbc616ce58370e91775f41256a4de28d3ea28e2fe88fcd74e` |

## Observed behavior

| Check | Result |
|---|---|
| Fresh 7.24.5 browser opens `/webfig/#IP:Firewall.Connections` | Redirected to `/#IP:Firewall.Connections` |
| Wrong password, 7.24.5 | `/jsproxy` returned 403; authentication error; login hash preserved |
| Valid, non-expired lab user, 7.24.5 | Landed on Firewall / Connections with requested hash |
| IPv4 addresses/routes, interface VLANs, bridge ports/VLANs, filter/NAT rules and users | Rendered expected view on both versions |
| Bridge list | Rendered on both versions |
| Unknown service `#Definitely_Unknown`, both versions | Rendered Interfaces; unknown hash remained |
| Unknown tab `#IP:Firewall.Definitely_Unknown`, both versions | Rendered Filter Rules; unknown hash remained |
| Open existing `ether1` row, both versions | UI generated `#Interfaces.Interface.2`; direct reload reopened ether1 form |
| Reload token login, both versions | Token remained identical, length 32; browser cookie jar empty |
| Second tab and `logout()` helper, 7.24.5 | Both tabs returned to login, each retaining its own hash |
| Default expired admin, 7.24.5 | Password login opened `#System:Password.Change_Now` instead of requested view |
| `/` and `/webfig/` headers, 7.24.5 | `X-Frame-Options: sameorigin` |
| `/webfig/list`, 7.24.5 | Manifest available without login |
| `/webfig/list`, ARM64 vs x86 7.24.5 base | Identical except x86-only `ups.jg` (crc 1617938236); all other resources share crc/size |
| `/system/ups`, x86 base vs ARM64 base | Present but empty on x86; `validation/unknown-path` rejection on ARM64 (offline `explain` passes, so the path is well-formed but device-absent) |
| `/system/package`, ARM64 with `start --install-all-packages` | 19 packages: base `routeros` plus all 18 extras, `ups` enabled |
| `/system/ups`, ARM64 with `ups` package | Present but empty — the CLI path is not arch-excluded |
| `/webfig/list`, ARM64 with all packages | Still no `ups.jg`; `#System:UPS` has no ARM64 WebFig menu on 7.24.5 |
| Independent WebFig toggle, fresh 7.26beta1 CHR | `/ip/service/webserver` exposed `webfig-plain`; setting it to `no` made `/webfig/` return 403 while REST `/system/resource` still succeeded |
| Named `.jg` request without a live WebFig login | 406; authenticated browser's menu-resource loads were 200 |
| `/jsproxy` browser traffic, both versions | `Content-Type: msg`; 40-byte handshake responses |
| CMR dashboard, 7.26beta1 + cmr | `#CMR_Dashboard.Dashboard` rendered Dashboard |
| CMR inventory, 7.26beta1 + cmr | `#CMR_Devices.Devices` rendered CMR Devices |
| CMR client, 7.26beta1 + cmr | `#System:CMR_Client` rendered CMR Client |
| Guessed `#CMR`, `#CMR.Devices`, `#CMR.Client`, 7.26beta1 | Rendered Interfaces instead of CMR |

The CMR controller was not enabled and no fleet was paired. These tests prove
navigation to the controller's UI, not live topology or device data. Other CMR
fragments in the catalog were copied from visible menu links, not opened.

## Source inspection

On 7.24.5, inspected `normalize`, `findContainer`, `selectService`,
`updateContent`, `container.*.createPane`, `Session`, `request`, `fetchFile`,
`autoLogin`, `doAuth`, `logout`, `start`, and the login-page submit handler.
This grounds the grammar, object/action suffix handling, one-shot credential
storage, token storage, 410 handling and key-exchange layout.

Compared the original catalog with the authenticated 7.24.5 app's normalized
menu metadata: **754 of the 760 catalog entries** matched. The six OpenFlow
entries were absent from this CHR's app metadata. Two additional runtime Status
entries were present. Matching is structural evidence only; it does not establish
visibility, direct-navigation success or lack of side effects.

The 7.26beta1 master script is loaded as `type="module"`; its internals are
not page globals. An initial harness using 7.24.5's `currentCont` global timed
out despite a rendered UI. Switching that check to rendered DOM/title verified
the newer UI without modifying RouterOS code. Do not build integrations around
these internal globals.

Corrected two proposal claims directly contradicted by the served source:
`container.map.createPane()` consumes object suffixes, and `keyExchange()` reads
the server public key at offset 8, not offset 4.

## Reproduce

Use **routeros-quickchr-cli** to boot an isolated router, and **routeros-centrs**
to read its note/version before setup. Example with synthetic lab credentials:

```sh
quickchr add --name webfig-check --version 7.24.5 --arch x86 --add-network user
quickchr start webfig-check --bg
centrs retrieve --quickchr webfig-check /system/note --json
centrs retrieve --quickchr webfig-check /system/resource --json
centrs execute --quickchr webfig-check --yes \
  '/user/add name=webfig-lab password="replace-this-lab-password" group=full' --json
```

Use the printed **HTTP host-forward port**, not a fixed port from this report.
In a fresh browser profile, open `/webfig/#IP:Firewall.Connections`, check the
redirect, try a wrong password, then log in with the lab user. Check the rendered
title and active tab for the fragments above. Open ether1 from Interfaces and
reload its generated object URL. Check only the token's presence/length and
equality across reloads; do not publish the token. Open another tab and log out
to check storage sharing.

For CMR, create a separate machine:

```sh
quickchr add --name webfig-cmr-check --version 7.26beta1 --arch x86 \
  --add-network user --add-package cmr
quickchr start webfig-cmr-check --bg
```

Repeat the note/version reads and lab-user setup above with `--quickchr
webfig-cmr-check`, then the login check and the three CMR fragments. Menu
resources and the master script can be identified in browser network tools;
inspect those exact versioned resources rather than assuming filenames.

Stop/remove only the disposable machines created for the check:

```sh
quickchr stop webfig-check
quickchr remove webfig-check
quickchr stop webfig-cmr-check
quickchr remove webfig-cmr-check
```

## Service toggle check

The separate 7.26beta1 toggle check used a fresh CHR without extra packages:

```sh
quickchr add --name webfig-service-check --version 7.26beta1 --arch x86 --add-network user
quickchr start webfig-service-check --bg
centrs retrieve --quickchr webfig-service-check /system/note --json
centrs retrieve --quickchr webfig-service-check /ip/service/webserver --json
centrs execute --quickchr webfig-service-check --yes \
  '/ip/service/webserver/set webfig-plain=no' --json
centrs retrieve --quickchr webfig-service-check /ip/service/webserver --json
centrs retrieve --quickchr webfig-service-check /system/resource --json
```

The first settings read reported `webfig-plain=true` and `rest-plain=true`.
The write returned `ok: true`. The second settings read reported
`webfig-plain=false` while `rest-plain=true`. The final centrs read (a REST
GET of `/rest/system/resource`) still returned `ok: true` and
`version: "7.26beta1"`.

The host HTTP port printed by this particular start was 9230. Replace it with
the port from your own start output before running the UI request:

```sh
WEBFIG_LAB_ORIGIN='http://127.0.0.1:9230'
curl --max-time 10 -sS -o /dev/null -w '%{http_code}\n' "$WEBFIG_LAB_ORIGIN/webfig/"
```

That GET returned **403**, establishing that REST stayed available while WebFig
was disabled. The test did not change `www` itself or `rest-plain`.
Remove this additional disposable router after the check:

```sh
quickchr stop webfig-service-check
quickchr remove webfig-service-check
```

## Limits

No HTTPS login, native WKWebView/Android WebView, mobile layout, hardware switch
pages, custom skins, restricted-user matrix, server idle timeout, token expiry,
token revocation or restart persistence was tested. Native embedding guidance
combines observed WebFig requirements with browser origin/storage rules, and
requires validation in the host app's actual engine. No blanket compatibility
claim is made for other RouterOS versions or all catalog fragments. The ARM64
cross-check covered the 7.24.5 menu manifest, `/system/package` and
`/system/ups` only; ARM64 rendering of individual fragments was not
browser-tested, and the `ups.jg` absence is manifest-level evidence.
