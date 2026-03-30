---
name: tikoci-github-pages-spa
description: "Client-side GitHub Pages SPA patterns for static tool sites. Use when: building a static single-page app on GitHub Pages, fetching data from GitHub REST/GraphQL API client-side, handling GitHub API rate limits from browser JS, implementing localStorage caching, preventing async race conditions, building shareable deep-link URLs with query params, or when the user mentions GitHub Pages static site, client-side SPA, or rate-limited API fetching."
---

# GitHub Pages SPA — Client-Side Architecture Patterns

Patterns for building static single-page applications served by GitHub Pages, using the
GitHub REST/GraphQL API for dynamic data with no backend.

## Constraints

- **No backend** — GitHub Pages is static file hosting. All logic runs in the browser.
- **No build tools for client JS** — no webpack, Vite, or bundlers. Single `.html` files with inline JS. (Build scripts may use bun for data fetching and page generation at deploy time.)
- **No web frameworks** — no React, Vue, Svelte. Vanilla JavaScript only.
- **60 req/hr** — unauthenticated GitHub API rate limit shared across all pages on the same origin.

## Two Shared Libraries — Same Patterns, Independent Projects

Two tikoci projects implement these SPA patterns independently:

| | **tikoci.github.io** (`shared.js`) | **restraml** (`restraml-shared.js`) |
|---|---|---|
| Scope | Portfolio site + tools | RouterOS schema tools |
| Constants | `TIKOCI` (owner, pagesUrl) | `RESTRAML` (owner, repo, pagesUrl, apiContentsUrl) |
| Version parsing | Not needed | `parseVersion()`, `compareVersions()`, `isPreRelease()`, `rebuildSelect()` |
| Data fetching | `fetchGitHubContents()`, `fetchGitHubPagesFile()` | `fetchVersionList()` with localStorage cache |
| Event utilities | Extracted: `debounce()`, `createCancelToken()` | Inline per-page |
| Query params | Extracted: `readQueryParams()`, `writeQueryParams()` | Inline per-page |
| Share | `initShareButton()` (new) + `initShareModal()` (legacy) | `initShareModal()` |
| Nav | `SITE_TOOLS` + `initToolsDropdown()` | Not present |
| Changelog | Not present | `initChangelogModal()`, `renderChangelogContent()` |
| Init timing | `<script>` at body end (no DOMContentLoaded) | `DOMContentLoaded` in `initThemeSwitcher` |

Both share identical: brand gradient system, theme switcher icons/logic, `escapeHtml()`,
`initGitHubDropdown()`, and the companion CSS file (font stacks, code tightening, logo swap,
page guide, share modal, utility classes).

The patterns in this skill apply to **both** libraries. Code examples use generic names —
each project may extract helpers differently or keep the logic inline.

## GitHub API Fetching with Rate-Limit Resilience

### The Problem

Static sites that consume the GitHub API (directory listings, file contents, etc.) hit the
60 requests/hour limit quickly. Users see blank pages or cryptic 403 errors.

### The Solution: localStorage Cache with Stale Fallback

```javascript
const CACHE_KEY = 'myapp_data';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// In-memory promise dedup — concurrent calls within the same page share one request
let _dataPromise = null;

function fetchData() {
    if (_dataPromise) return _dataPromise;
    _dataPromise = _fetchDataInner();
    _dataPromise.finally(() => { _dataPromise = null }); // Clear after settling
    return _dataPromise;
}

function _fetchDataInner() {
    // 1. Check localStorage cache (fresh)
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (raw) {
            const cached = JSON.parse(raw);
            if (cached?.ts && Date.now() - cached.ts < CACHE_TTL) {
                return Promise.resolve(cached.data);
            }
        }
    } catch { /* ignore corrupted cache */ }

    // 2. Fetch from GitHub API
    return fetch('https://api.github.com/repos/owner/repo/contents/path')
        .then(r => {
            if (r.status === 403) {
                // Rate limited — try stale cache regardless of TTL
                const stale = readStaleCache();
                if (stale) return stale;
                throw new Error('GitHub API rate limited — no cached data available');
            }
            if (!r.ok) throw new Error(`GitHub API returned ${r.status}`);
            return r.json();
        })
        .then(data => {
            // 3. Persist to localStorage
            try {
                localStorage.setItem(CACHE_KEY, JSON.stringify({
                    ts: Date.now(),
                    data: data
                }));
            } catch { /* storage full */ }
            return data;
        });
}

function readStaleCache() {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (raw) {
            const cached = JSON.parse(raw);
            if (cached?.data) return cached.data;
        }
    } catch { /* ignore */ }
    return null;
}
```

**Key design decisions:**
- **In-memory dedup** (`_dataPromise`): If 3 components call `fetchData()` before the first
  resolves, only one HTTP request is made. The promise is cleared after settling so retries work.
- **Stale fallback on 403**: When rate-limited, return expired cache instead of failing. Stale
  data is better than no data.
- **Shared origin cache**: All pages on `*.github.io/repo` share the same `localStorage`,
  so navigating between pages uses the same cache.
- **TTL tuning**: 5 minutes balances freshness with rate-limit budget. Adjust based on how
  often upstream data changes.

### GitHub API: Useful Endpoints

```javascript
// Directory listing (returns array of {name, type, path, sha, ...})
fetch('https://api.github.com/repos/owner/repo/contents/docs')

// File contents (returns {content: base64string, encoding: 'base64', ...})
fetch('https://api.github.com/repos/owner/repo/contents/docs/file.json')

// Raw file (redirect to raw.githubusercontent.com — not rate-limited!)
// Use for large files or when you don't need metadata
fetch('https://raw.githubusercontent.com/owner/repo/main/docs/file.json')

// GitHub Pages URL (not API — serves the actual published file)
// Not rate-limited, perfect for published content
fetch('https://owner.github.io/repo/path/to/file.json')
```

**Prefer GitHub Pages URLs** (`*.github.io`) over the GitHub API for fetching published content.
The API endpoint is needed for directory listings and metadata, but raw file contents can be
fetched from Pages directly with no rate limit.

## Async Race Condition Prevention

### The Problem

User types in a search box. Each keystroke triggers a fetch. If response #2 arrives before
response #3, stale results overwrite current results.

### Cancellation Tokens

```javascript
let currentRequestId = 0;

async function doSearch(query) {
    const myId = ++currentRequestId;

    const results = await fetch(`...?q=${encodeURIComponent(query)}`).then(r => r.json());

    // Stale check — a newer search was started while we were awaiting
    if (myId !== currentRequestId) return;

    // Safe to update the DOM
    renderResults(results);
}
```

**How it works:** Each call increments the counter and captures its value. After each `await`,
check if the counter still matches. If a newer call started, bail out silently.

**Important:** Check the token after **every** `await`, not just the final one:

```javascript
async function complexSearch(query) {
    const myId = ++currentRequestId;

    const versions = await fetchVersionList();
    if (myId !== currentRequestId) return;  // Check after each await

    const data = await fetch(`.../${versions[0]}/data.json`).then(r => r.json());
    if (myId !== currentRequestId) return;  // Check again

    renderResults(data);
}
```

## Event-Driven UI (No Submit Buttons)

### Pattern: Debounce Text, Immediate Select/Checkbox

```javascript
// Text input: debounce 400ms (user is still typing)
let debounceTimer;
textInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => doSearch(), 400);
});

// Checkbox: fire immediately (discrete state change)
checkbox.addEventListener('change', () => doSearch());

// Select: fire immediately (discrete selection)
select.addEventListener('change', () => doSearch());
```

**Why no submit button?** Static tool pages feel more responsive when results update as the
user interacts. The 400ms debounce prevents excessive API calls while typing, but selects
and checkboxes fire immediately because they represent a single discrete state change.

## Shareable URLs with Query Parameters

The core logic: read URL search params into a plain object, apply to controls; after
interaction, write control state back to the URL. **`replaceState` not `pushState`** — every
control change updates the URL, and `pushState` would fill browser history with junk.

tikoci.github.io extracts these as `readQueryParams()` / `writeQueryParams()` helpers;
restraml does the same logic inline per page. Either approach works.

### Reading and Writing Query Params

```javascript
// Read: URL search params → plain object
function readQueryParams() {
    const obj = {};
    for (const [k, v] of new URLSearchParams(location.search)) {
        obj[k] = v;
    }
    return obj;
}

// Write: object → URL. Falsy values omitted. Returns void.
function writeQueryParams(params) {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
        if (v) sp.set(k, v);
    }
    const qs = sp.toString();
    const url = qs ? `${location.pathname}?${qs}` : location.pathname;
    history.replaceState({}, '', url);  // replaceState — NOT pushState
}
```

### Applying Params to Controls

Query params populate controls, and control changes write params back:

```javascript
const params = readQueryParams();
if (params.version) versionSelect.value = params.version;
if (params.q) textInput.value = params.q;
if (params.extra === 'true') extraCheckbox.checked = true;

// After user interaction, update the URL:
writeQueryParams({
    version: versionSelect.value,
    q: textInput.value,
    extra: extraCheckbox.checked ? 'true' : '',
});
```

### Timing is Critical — Read Params After Async Data

```javascript
// WRONG: Reading params before async data loads
const params = readQueryParams();
versionSelect.value = params.version;  // ❌ <select> has no options yet!

// RIGHT: Read params AFTER async data populates the <select>
fetchVersionList().then(versions => {
    populateSelect(versionSelect, versions);   // Now <select> has options
    const params = readQueryParams();
    if (params.version) versionSelect.value = params.version;
    if (hasInitialParams(params)) doSearch();   // Trigger from deep link
});
```

`fetchVersionList` and `populateSelect` are placeholders — restraml has these as real shared
functions; tikoci.github.io uses `fetchGitHubContents()` and inline option creation. The
pattern is identical: **populate controls from async data, then apply query params.**

**Why timing matters:** If the URL has `?version=7.22`, but the `<select>` hasn't been
populated from the async API call yet, `select.value = '7.22'` silently fails.

### Set select defensively (validate option exists)

```javascript
if (params.version) {
    const v = params.version;
    if ([...versionSelect.options].some(o => o.value === v)) {
        versionSelect.value = v;
    }
    // Silently ignore invalid values — don't break on stale URLs
}
```

### Share Button Patterns

**Inline share button** (tikoci.github.io `initShareButton()`):

```javascript
btn.addEventListener('click', () => {
    writeQueryParams({ version: versionSelect.value, q: textInput.value });
    navigator.clipboard.writeText(location.href).then(() => {
        btn.textContent = '✓ Copied!';
        setTimeout(() => { btn.textContent = 'Share'; }, 1800);
    }).catch(() => { /* fallback */ });
});
```

**Share modal** (both projects use `initShareModal()`):

```javascript
initShareModal({
    modalId: 'share-modal',
    linkId: 'share-link',
    closeId: 'share-close',
    copyId: 'share-copy-btn',
    urlId: 'share-url',
    beforeShow: () => writeQueryParams({ version, q }),
});
```

The modal approach uses a `<dialog>` with a URL input and copy button. The inline button
approach is simpler — prefer it for new pages.

## Version Parsing

For version parsing, comparison, and pre-release detection patterns (including the
`rebuildSelect()` Safari workaround), see
[routeros-fundamentals/references/version-parsing.md](../../routeros-fundamentals/references/version-parsing.md).
The key patterns: `parseVersion()` returns a comparable structure, `compareVersions()` sorts
newest-first, and `isPreRelease()` detects beta/rc versions. Safari doesn't support
`option.hidden`, so rebuild `<select>` options by removing and re-adding instead of hiding.

## In-Memory Response Cache

When a page fetches the same resource multiple times (e.g., switching back to a previous
version), cache responses in a JS object to avoid redundant fetches:

```javascript
const cache = {};

async function fetchWithCache(url) {
    if (cache[url]) return cache[url];
    const data = await fetch(url).then(r => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
    });
    cache[url] = data;
    return data;
}
```

For versioned content, include the version in the cache key:
```javascript
const key = `${version}/${subdir}`;
```

## Page Architecture — Putting It Together

```
Page Load
  │
  ├─ <head>: Pico CSS, shared.css, page <style>
  │    └─ shared.js runs immediately (IIFE at top):
  │         ├─ Set random --brand-gradient (CSS custom property)
  │         └─ Project constants defined
  │
  ├─ <body> content renders
  │
  ├─ <script src="shared.js"> loaded at body end
  ├─ Page init (inline <script> or DOMContentLoaded):
  │    ├─ initThemeSwitcher()
  │    ├─ Bind event listeners (input, change)
  │    └─ fetchVersionList() / fetchData()  ──→  GitHub API (+ cache)
  │         │
  │         ├─ populate controls (selects, etc.)
  │         ├─ apply query params  ← timing-critical: after controls populated
  │         └─ if (has params) doSearch()  ← auto-trigger from deep link
  │
  └─ User Interaction Loop
       │
       ├─ Text input → debounce ~400ms → handler()
       ├─ Select change → immediate → handler()
       ├─ Checkbox change → immediate → handler()
       │
       └─ handler()
            ├─ id = cancel.next()               (cancellation token)
            ├─ data = await fetch(...)           (cache check first)
            ├─ if (id !== cancel.current) return (stale check)
            ├─ render results
            └─ update URL query params           (replaceState)
```

**Init timing:** tikoci.github.io uses `<script>` at body end (DOM already parsed, no
`DOMContentLoaded` needed). restraml uses `DOMContentLoaded` inside `initThemeSwitcher()`.
Both work — the key invariant is that DOM elements exist when JS references them.

## Shared Helpers Available in Both Libraries

### Brand Gradient System

Both shared.js files pick a random MikroTik-inspired gradient and set `--brand-gradient`
on `<html>` immediately (IIFE, no DOM needed). Same 10 color pairs, same gradient format.
Used by `.brand-reverse` class for brand styling across hero sections and nav elements.

### Lazy-Loaded GitHub Dropdown

`initGitHubDropdown(listId)` — both libraries. Fetches repos with 3+ stars on first
`<details>` open, avoiding unnecessary API hits on page load. Falls back to a static
"All repositories" link.

### HTML Escaping

`escapeHtml(str)` — both libraries. Escapes `&`, `<`, `>` for safe `innerHTML` insertion.

## tikoci.github.io-Specific Additions

These helpers exist only in tikoci.github.io's `shared.js` (not restraml):

- **`SITE_TOOLS` + `initToolsDropdown(listId)`** — central tools list array; populates nav
  `<ul>` and auto-marks current page with `aria-current="page"`.
- **`fetchGitHubContents(repo, path)`** — generic GitHub Contents API directory listing.
- **`fetchGitHubPagesFile(repo, path)`** — fetch raw files from Pages (no rate limit).
- **`debounce(fn, ms)`** / **`createCancelToken()`** — extracted event utilities.
- **`readQueryParams()`** / **`writeQueryParams(params)`** — extracted URL helpers.
- **`initShareButton(buttonId, beforeCopy, label)`** — inline share (no modal).

## restraml-Specific Additions

These helpers exist only in restraml's `restraml-shared.js` (not tikoci.github.io):

- **`parseVersion()`** / **`compareVersions()`** / **`isPreRelease()`** — RouterOS version
  parsing, comparison, and pre-release detection.
- **`rebuildSelect(sel, versions, showAll)`** — rebuilds `<select>` options (Safari fix:
  remove-and-readd instead of `option.hidden`).
- **`fetchVersionList()`** — localStorage-cached version directory listing with stale
  fallback on 403. Includes concurrent-call deduplication.
- **`initChangelogModal()`** / **`renderChangelogContent()`** — MikroTik changelog viewer
  dialog with search, font sizing, and diff-link generation.

## Build-Time GitHub API Token Resolution

For build scripts that fetch GitHub data at build time (not client-side), the token
resolution order avoids hardcoded secrets:

1. `GITHUB_TOKEN` environment variable — available in CI (GitHub Actions provides this)
2. `gh auth token` — auto-detected if [GitHub CLI](https://cli.github.com/) is installed locally
3. Anonymous — falls back to cached data on rate-limit failure (60 req/hr)

```typescript
function resolveGitHubToken(): string | null {
    if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
    try {
        return execSync('gh auth token', { encoding: 'utf8' }).trim();
    } catch { return null; }
}
```

This pattern ensures builds work everywhere without manual token setup.

## Common Mistakes

1. **Using `pushState`** instead of `replaceState` — fills browser history with junk.
2. **Reading query params before async data loads** — select values silently fail.
3. **No cancellation tokens** — stale async results overwrite current results.
4. **No stale cache fallback on 403** — users see blank pages when rate-limited.
5. **Fetching via GitHub API when Pages URL works** — wastes rate-limit budget.
6. **Not deduplicating concurrent fetches** — 3 components trigger 3 identical HTTP requests.
7. **Using `option.hidden`** — Safari doesn't support it. Remove and re-add options instead.
