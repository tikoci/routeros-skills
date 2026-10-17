# WebFig authentication and sessions

Read this when hosting the real WebFig UI or debugging login/session problems.
Observations below are pinned to x86 CHR **7.24.5**. The
[validation record](validation.md) distinguishes browser observations, source
inspection and untested behavior. This is WebFig's private protocol, not a
supported configuration API; use **routeros-centrs** for automation.

## Browser login lifecycle

The login form at `/` stores `name` and `password` in `sessionStorage`, remembers
`lastuser` in `localStorage`, and replaces the location with
`/webfig/` plus the current hash. The app's `autoLogin()` consumes those
credentials and clears `sessionStorage`. This is a one-shot handoff within the
same origin and tab, not a URL-based login mechanism.[^source]

Successful authentication stores a 32-character token at
`localStorage["token"]`. Reloading the page creates a fresh transport session
and authenticates again with that token. The lab observed the same token returned
after reload; this does **not** establish its expiration time or behavior after
router restart.[^live]

The tested browser had no cookies after login. Copying a REST Basic Auth header
or a cookie jar is not the WebFig login flow. Conversely, a saved WebFig token is
a credential: do not include it in links, diagnostics or tracked files.[^live]

`logout()` removes the token and returns to `/` with the current hash. Other
WebFig tabs sharing the same origin and storage area observe its removal and
log out too. This does not imply logout across other origins, browser profiles
or devices, or prove server-side token revocation.[^source]

The bundle also accepts `window.name` values shaped like `login=user|password`
or `autologin=user|password`, then clears the name. The login-page script labels
`window.name` deprecated and clears it on load. Treat this as an implementation
detail, not a recommended app integration. Let the human log in normally.[^source]

## Private transport background

The served `Session` implementation uses a Curve25519 key exchange, AES-128-CTR
and HMAC-SHA256. Source inspection found the following binary layout; normal
WebView integrations should let WebFig implement it.[^source]

```text
Initial request: [zero session id: 4BE][zero sequence: 4BE][public key: 32]
Server response: [session id: 4BE][sequence field: 4BE][public key: 32]
Encrypted data:  [session id: 4BE][sequence: 4BE][IV: 16][MAC: 32][ciphertext]
```

`makeInitialRequest()` and `keyExchange()` place the public key at **offset 8**
in both handshake directions. A response description omitting the sequence
field is wrong. Browser traffic observed 40-byte handshake responses.[^live]

`makeKey()` derives separate send/receive encryption and MAC keys from SHA-256
over the shared secret, 40 zero bytes, a direction-specific string and 40 bytes
of `0xF2`. `curve_a2u()` / `curve_u2a()` perform byte-order conversions around
the bundled Curve25519 implementation. Do not transplant this into a standard
crypto library without testing the precise byte representation.[^source]

The MAC covers the header and plaintext. The payload uses `M2` messages with
typed field identifiers; `doAuth()` sends `{s1: user, s3: password}` or
`{s2d: token}`. The returned `s2d` becomes the stored token. This is source
inspection plus browser execution of the shipped client, not independent
validation of a new protocol implementation.[^source]

Binary POSTs to `/jsproxy` use `Content-Type: msg`. The lab observed HTTP 403
for wrong credentials. The bundle also fetches files through encrypted
`GET /jsproxy/?...` URLs, so not all WebFig traffic is a POST. In the inspected
request handler HTTP 410 calls `logout()`; the server idle timeout and the
conditions producing 410 were not measured.[^source][^live]

## Menu resources and embedding

`/webfig/list` lists versioned `.jg` menu resources. Before any WebFig login on
a fresh lab router, a named `.jg` request returned 406; after login it returned
200 without a cookie. This limited observation does **not** prove an IP-only
authorization model, isolation between users behind NAT, or the complete server
session gate.[^live]

Use the actual router origin in a WebView. The application loads additional
scripts, menu resources and `/jsproxy` requests; it is not self-contained HTML.
The tested login/app responses had `X-Frame-Options: sameorigin`. Native top-level
WebViews must still be tested separately from cross-origin iframe embedding.
For HTTPS, use a certificate the host trusts; WebFig's private channel does not
replace authenticated delivery of its code.[^manual]

[^source]: [Validation record](validation.md), served 7.24.5 bundle
    `Session`, `request`, `fetchFile`, `autoLogin`, `doAuth`, `logout`,
    `window.onstorage`, and the login-page `openWebFig` / submit handler.
[^live]: [Browser and HTTP checks](validation.md). Tokens and passwords were
    excluded from the published evidence.
[^manual]: [MikroTik WebFig HTTPS setup](https://help.mikrotik.com/docs/spaces/ROS/pages/328131/WebFig#WebFig-EnableHTTPS)
    and [local validation](validation.md).
