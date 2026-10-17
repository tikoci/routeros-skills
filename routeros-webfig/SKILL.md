---
name: routeros-webfig
description: "Build RouterOS WebFig deep links for human review of connections, addresses, VLANs, bridges, firewall rules and CMR. Covers the hash-fragment URL scheme, object links, login redirects, browser token storage, and embedding the router UI in a native WebView. Use when linking a human to RouterOS views or integrating WebFig into an app. Grounded on CHR 7.24.5 and version-specific CMR checks; use routeros-centrs for machine configuration."
---

# RouterOS WebFig links and embedded views

Use WebFig to let a human inspect the router's own UI alongside an agent's
work. Give them a link plus what to check, for example:

> Review the bridge's tagged and untagged VLAN membership:
> <https://router.example/webfig/#Bridge.VLANs>

WebFig can edit configuration too; opening its UI does not make an agent's
changes approved. Use **routeros-centrs** for machine configuration and verification.
This skill covers navigation and session behavior.[^manual]

## Build a link

Use a router web origin reachable from the human's browser or embedded view,
plus `/webfig/` and a fragment:

```text
https://router.example:8443/webfig/#IP:Firewall.Connections
https://router.example:8443/webfig/#IP:Addresses
https://router.example:8443/webfig/#Bridge.VLANs
```

Get the actual service and port from `/ip/service` through centrs. `www` serves
HTTP (default 80); `www-ssl` serves HTTPS (default 443) and needs a valid
certificate. A quickchr host-forward port belongs in the URL instead of the
guest's service port. Prefer trusted HTTPS for deployed routers. A working REST
endpoint proves that the corresponding web service is reachable from that
client. Check the human's browser separately when the agent uses a tunnel or
loopback address on another machine. On releases
exposing `/ip/service/webserver`, `webfig-plain` and `webfig-secure` can disable
WebFig independently of REST. Check `/webfig/` and its rendered view too.[^services]

The common grammar is `#`[`group`:`]`service`[`.`container`]. Names are
case-sensitive. The served `normalize()` function replaces whitespace and dots
in service/container names with underscores; it leaves the group literal.
Thus IP → Firewall → Filter Rules is `#IP:Firewall.Filter_Rules`.
**CLI paths are not WebFig fragments**: `/ip/address` maps to `#IP:Addresses`,
not `#ip:address`.[^router]

### Frequently useful views

These views were opened in Chrome against x86 CHR 7.24.5 and 7.26beta1; see the
[validation record](references/validation.md) for versions and limits.

| Human should review | Fragment |
|---|---|
| Connection tracking | `#IP:Firewall.Connections` |
| IPv4 addresses | `#IP:Addresses` |
| IPv4 routes | `#IP:Routes` |
| Firewall filter rules | `#IP:Firewall.Filter_Rules` |
| NAT rules | `#IP:Firewall.NAT` |
| Interfaces | `#Interfaces.Interface` |
| VLAN interfaces | `#Interfaces.VLAN` |
| Bridges | `#Bridge.Bridge` |
| Bridge ports | `#Bridge.Ports` |
| Bridge VLAN membership | `#Bridge.VLANs` |
| RouterOS users | `#System:Users` |

CMR was checked separately on **7.26beta1 with the optional `cmr` package**:

| Human should review | Fragment |
|---|---|
| Controller dashboard | `#CMR_Dashboard.Dashboard` |
| Controller device inventory | `#CMR_Devices.Devices` |
| Router's own CMR client settings/status | `#System:CMR_Client` |

`#CMR` and `#CMR.Devices` did not open CMR in that lab; they silently fell
back to Interfaces. Use the UI's names rather than guessing from `/cmr`.

For other views, use the
[fragment catalog and discovery guidance](references/webfig-url-scheme.md).
Menu availability depends on RouterOS version, installed packages, hardware
(including CHR architecture: ARM64 7.24.5 did not advertise `ups.jg` in its
menu manifest even with the `ups` package installed), user policy and skins. Copy the URL from
the target UI when possible.[^router]

### Object links and fallback

Additional components can select an object: the UI generated
`#Interfaces.Interface.2` when opening the lab's `ether1`, and reopening that
URL opened its form. MikroTik also documents
`#IP:Firewall.Filter_Rules.17` as an object URL. Copy the actual UI-generated
fragment; suffixes are router-local object identifiers, not portable row numbers
or interface names. Do not blindly append a REST `.id` such as `*1`.[^objects]

Unknown services or containers can silently fall back to another view while
leaving the requested hash in the address bar. Verify the rendered title and
selected tab, not just the URL or HTTP 200. Do not bulk-open generated fragments:
the menu definitions include action containers as well as tables and forms, and
some `doit` containers dispatch an operation when opened.[^router]

### Skins

For a simplified WebFig UI, use a **skin**, edited in `#SkinDesigner` when
the user's permissions expose the designer and stored as `skins/<name>.json`
on the router. Assign it to a user group
(`/user/group set <group> skin=<skin>` via centrs). MikroTik also documents
WinBox use of the group skin; WinBox was not tested here.
A skin can hide or rename entries, add notes, and apply UI limits or read-only fields;
it is not a security boundary — a user whose group policies allow an action
can still reach it through the CLI or another tool.[^skin]

## Login and human handoff

Send a plain URL with no password or token. On the tested 7.24.5 login flow:

1. `/webfig/#IP:Firewall.Connections` without a token redirects to
   `/#IP:Firewall.Connections`.
2. A failed password login returns to that login URL with the hash intact.
3. Successful login returns to the requested WebFig view.
4. A returning browser uses a token from the router origin's `localStorage`.

An expired password can instead open `#System:Password.Change_Now`; treat login
and any required password change as human steps. Default configuration and other
startup flows may also take precedence. This is tested version behavior, not a
promise for every RouterOS release.[^login]

## Embed in an app

Load the **router's URL as the top-level page of a native WebView**, with
JavaScript and web storage available. Let the human use WebFig's login form.
Keep `/`, `/webfig/`, `/assets/` and `/jsproxy` on the same router origin;
fetching only the WebFig HTML into a local app page does not recreate its
relative requests or storage context.[^embedding]

The tested server sends `X-Frame-Options: sameorigin` for `/` and `/webfig/`.
A cross-origin iframe in an app's web dashboard is therefore blocked; a native
top-level WebView is a different integration. Validate the actual target engine
and RouterOS release before promising an embedded experience.[^embedding]

Choose whether the WebView's website data persists. WebFig stores its token in
`localStorage`, whose storage area is scoped to the scheme/host/port and the
browser's data store. This describes browser storage isolation, not a server-side
restriction on where the token can authenticate. Changing HTTP to HTTPS, changing
the port, or opening another browser profile can require a new login. Reusing
one data store and origin shares the login; independent data stores allow
separate sessions. For example, WKWebView exposes this through
`WKWebsiteDataStore`.[^storage]

Keep privileged native bridges away from untrusted navigation, and validate TLS
normally. WebFig's application encryption does not authenticate the HTML/JS
delivered over plain HTTP. Use the
[auth/session reference](references/webfig-auth-protocol.md) when debugging
login, token persistence, logout or `/jsproxy`; it is background for hosting the
real UI, not a replacement configuration API.[^embedding]

## Related skills

- **routeros-centrs** — validated machine operations and state verification.
- **routeros-cmr** — CMR package/version requirements and configuration.
- **routeros-quickchr-cli** — disposable CHR for reproducing UI behavior.

[^manual]: [MikroTik WebFig manual](https://help.mikrotik.com/docs/spaces/ROS/pages/328131/WebFig)
    describes monitoring, configuration, troubleshooting and skins.
[^services]: [WebFig HTTPS setup](https://help.mikrotik.com/docs/spaces/ROS/pages/328131/WebFig#WebFig-EnableHTTPS),
    [web server settings](https://manual.mikrotik.com/docs/cli-reference/ip/service/webserver/),
    and quickchr's [port-forwarding documentation](https://github.com/tikoci/quickchr).
[^router]: [Validation record](references/validation.md): 7.24.5 served bundle
    `normalize`, `findContainer`, `selectService`, `updateContent` and
    `container.*.createPane`; browser checks of valid and invalid fragments.
[^objects]: [MikroTik's skin alias / URL example](https://help.mikrotik.com/docs/spaces/ROS/pages/328131/WebFig)
    and [live object-link check](references/validation.md).
[^login]: [Validation record](references/validation.md), including browser login,
    wrong-password and expired-password observations; bundle `autoLogin`,
    `doAuth`, `logout`, `start` and login-page `openWebFig`.
[^embedding]: [Validation record](references/validation.md) for headers and source
    inspection. Native WebView guidance is an integration recommendation;
    native engines were not tested. [HTML origin rules](https://html.spec.whatwg.org/multipage/browsers.html#origin)
    explain origin isolation.
[^storage]: [HTML Web Storage standard](https://html.spec.whatwg.org/multipage/webstorage.html)
    and [Apple WKWebsiteDataStore](https://developer.apple.com/documentation/webkit/wkwebsitedatastore),
    plus [observed WebFig token behavior](references/validation.md).
[^skin]: [MikroTik WebFig skins](https://help.mikrotik.com/docs/spaces/ROS/pages/328131/WebFig)
    ("Design Skin … is not a security tool"; group assignment via
    `/user/group set`), served-bundle `loadSkin`/`saveSkin`/`normalizeSkin`
    schema ([validation](references/validation.md)), and live `/user/group`
    `skin` property read on CHR 7.24.5.
