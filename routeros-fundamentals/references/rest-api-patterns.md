# RouterOS REST API Patterns

## Verb Mapping

RouterOS REST maps HTTP verbs differently from typical REST APIs:

| HTTP Verb | RouterOS Action | CLI Equivalent | Notes |
|---|---|---|---|
| `GET` | print (list/read) | `/path/print` | Returns array of objects |
| `PUT` | add (create) | `/path/add` | **Not** update — this creates |
| `PATCH` | set (update) | `/path/set` | Requires `/*ID` in URL |
| `DELETE` | remove | `/path/remove` | Requires `/*ID` in URL |
| `POST` | command (execute) | `/path/command` | For actions like reboot, flush |

## Common Endpoints

```typescript
// Health check (no auth needed — WebFig returns HTTP 200)
const alive = await fetch("http://HOST:PORT/").then(r => r.ok);

// System identity
const id = await fetch("http://HOST:PORT/rest/system/identity", auth);

// System resource (CPU, memory, uptime, version, architecture)
const res = await fetch("http://HOST:PORT/rest/system/resource", auth);

// All interfaces
const ifaces = await fetch("http://HOST:PORT/rest/interface", auth);

// IP addresses
const addrs = await fetch("http://HOST:PORT/rest/ip/address", auth);

// Firewall filter rules
const rules = await fetch("http://HOST:PORT/rest/ip/firewall/filter", auth);

// DNS cache
const dns = await fetch("http://HOST:PORT/rest/ip/dns/cache", auth);

// Files on the router
const files = await fetch("http://HOST:PORT/rest/file", auth);

// Installed packages
const pkgs = await fetch("http://HOST:PORT/rest/system/package", auth);
```

## Filtering and Query Parameters

```typescript
// Filter by property value
await fetch(`${base}/interface?type=ether`, auth);

// Multiple filters (AND)
await fetch(`${base}/ip/address?interface=ether1&disabled=false`, auth);

// Proplist — select specific properties (reduces response size)
await fetch(`${base}/interface?.proplist=name,type,running`, auth);
```

## POST Commands (Actions)

Some RouterOS operations are actions, not CRUD:

```typescript
// Reboot
await fetch(`${base}/system/reboot`, { method: "POST", ...auth });

// Check for updates
await fetch(`${base}/system/package/update/check-for-updates`, { method: "POST", ...auth });

// Flush DNS cache
await fetch(`${base}/ip/dns/cache/flush`, { method: "POST", ...auth });

// Run a script
await fetch(`${base}/system/script/run`, {
  method: "POST",
  ...auth,
  body: JSON.stringify({ ".id": "*1" }),
});
```

## Error Handling

```typescript
// RouterOS returns structured errors
// { "error": 400, "message": "no such command prefix", "detail": "..." }

const response = await fetch(`${base}/ip/nonexistent`, auth);
if (!response.ok) {
  const err = await response.json();
  // err.message contains the RouterOS error
  // err.detail may contain additional context
}
```

**Scope:** this is the resource-endpoint contract. `/rest/execute` reports command
failures differently — see below.

### `/rest/execute` can return HTTP 200 for a rejected command

A command RouterOS rejects can still come back **HTTP 200**, with the error text
as the `ret` string — the same envelope a successful call returns:

| Request body (`POST /rest/execute`) | Response | Status |
|---|---|---|
| `{"script":":put 1","as-string":""}` | `{"ret":"1"}` | `200` |
| `{"script":"/ip/service/set www-ssl certificate=nope","as-string":""}` | `{"ret":"input does not match any value of certificate (/ip/service/set (certificate); line 1)"}` | `200` |

The same operation via the resource endpoint reports it as an error. Look the
`.id` up rather than hardcoding it — internal IDs are per-router and change when
a record is removed and re-added:

```http
GET /rest/ip/service?name=www-ssl&.proplist=.id,name

200 [{".id":"*6","name":"www-ssl"}]
```

```http
PATCH /rest/ip/service/*6
{"certificate":"nope"}

400 {"detail":"input does not match any value of certificate","error":400,"message":"Bad Request"}
```

So an `!response.ok` check does not catch this class of failure on the execute
path. Where an equivalent resource operation exists it may give a clearer error
contract, but confirm it for the operation at hand rather than trusting the
status alone — a 200 from a resource endpoint is not proof of effect either (see
the self-disable no-op in [Users REST reference](./routeros-users-rest.md)).

In the case tested here the `ret` text was the only thing separating rejection
from success, since the status and envelope were identical. Treat that as one
grounded case rather than a contract for the whole execute path: transport
failures, timeouts, empty results, and the asynchronous job-ID form were not
exercised, and there is no documented general rule for telling a rejection from
legitimate output.

Verified on RouterOS 7.23.3 (x86 CHR), synchronous `as-string` form only.

## Authentication Patterns

```typescript
// Basic auth — empty password (fresh install)
const auth = {
  headers: { Authorization: `Basic ${btoa("admin:")}` },
};

// With password
const auth = {
  headers: { Authorization: `Basic ${btoa("admin:mypassword")}` },
};
```

## /console/inspect — Command Tree Introspection

RouterOS exposes its entire command tree via `/console/inspect`. This is how tools like `restraml` and `rosetta` build their command databases. For full details on tree traversal, node types, and schema generation, see the **`routeros-command-tree`** skill.

```typescript
// List child paths under /ip
await fetch(`${base}/console/inspect`, {
  method: "POST",
  ...auth,
  body: JSON.stringify({
    request: "child",
    path: "ip",
  }),
});
// Returns: [{type: "child", name: "address", "node-type": "path"}, ...]

// Get syntax description for an argument
await fetch(`${base}/console/inspect`, {
  method: "POST",
  ...auth,
  body: JSON.stringify({
    request: "syntax",
    path: "ip,address,add,address",   // comma-separated, NOT dot or slash
  }),
});
// Returns: [{type: "syntax", text: "IP address"}]
```

**Request types:** `child` (enumerate children), `syntax` (help text), `highlight` (syntax coloring), `completion` (tab-completion)

**Path format:** Comma-separated segments — `"ip,address,add"` (not `"ip.address.add"` or `"/ip/address/add"`).

**Node types:** `dir` (directory), `path` (navigable level), `cmd` (executable command), `arg` (parameter).

**Dangerous paths to skip:** `where`, `do`, `else`, `rule`, `command`, `on-error` — these crash the REST server when inspected.

**CLI→REST mapping:** `get`→GET, `add`→PUT (creates!), `set`→PATCH, `remove`→DELETE, others→POST.

## Known Version Differences

- **7.21+**: `/app` path exists (built-in app listing); `/app/add` with YAML creation from 7.22
- **7.18+**: `!empty` sentence type in API protocol (indicates zero results, vs `!done` which may have data)
- **7.20.8+**: Minimum for reliable API protocol streaming
