---
name: tikoci-github-pages-spa
description: "Client-side GitHub Pages SPA patterns for static tool sites. Use when: building a static single-page app on GitHub Pages, fetching data from GitHub REST/GraphQL API client-side, handling GitHub API rate limits from browser JS, implementing localStorage caching, preventing async race conditions, building shareable deep-link URLs with query params, or when the user mentions GitHub Pages static site, client-side SPA, or rate-limited API fetching."
---

# GitHub Pages SPA — Client-Side Architecture Patterns

Patterns for building static single-page applications served by GitHub Pages, using the
GitHub REST/GraphQL API for dynamic data with no backend.

## Constraints

- **No backend** — GitHub Pages is static file hosting. All logic runs in the browser.
- **No build tools** — no webpack, Vite, npm scripts. Single `.html` files with inline JS.
- **No web frameworks** — no React, Vue, Svelte. Vanilla JavaScript only.
- **60 req/hr** — unauthenticated GitHub API rate limit shared across all pages on the same origin.

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

### Writing Query Params

```javascript
function writeQueryParams() {
    const params = new URLSearchParams();
    if (textInput.value) params.set('q', textInput.value);
    if (versionSelect.value) params.set('version', versionSelect.value);
    if (extraCheckbox.checked) params.set('extra', 'true');
    // Only include non-default values to keep URLs short
    const qs = params.toString();
    const url = qs ? `${location.pathname}?${qs}` : location.pathname;
    history.replaceState(null, '', url);  // replaceState — NOT pushState
    return new URL(url, location.href).href;
}
```

**`replaceState` not `pushState`**: Every keystroke or checkbox toggle updates the URL.
Using `pushState` would fill the browser history with junk entries — back button becomes useless.

### Reading Query Params (Timing is Critical)

```javascript
// WRONG: Reading params before async data loads
readQueryParams();  // <select> has no options yet!

// RIGHT: Read params AFTER version list populates the <select>
fetchVersionList().then(versions => {
    populateSelect(versions);     // Now <select> has options
    readQueryParams();             // Now we can set select.value
    if (hasInitialParams()) {
        doSearch();                // Trigger initial search from URL
    }
});
```

**Why timing matters:** If the URL has `?version=7.22`, but the `<select>` hasn't been
populated from the async API call yet, `select.value = '7.22'` silently fails. Always
read params **after** async data loads.

### Reading Params — Defensive Pattern

```javascript
function readQueryParams() {
    const params = new URLSearchParams(location.search);

    if (params.has('q')) textInput.value = params.get('q');

    // Set select only if the value exists as an option
    if (params.has('version')) {
        const v = params.get('version');
        if ([...versionSelect.options].some(o => o.value === v)) {
            versionSelect.value = v;
        }
        // Silently ignore invalid values
    }

    // Boolean params: only set if explicitly 'true'
    if (params.get('extra') === 'true') extraCheckbox.checked = true;
}
```

### Inline "Copied!" Share Button

```javascript
shareBtn.addEventListener('click', async () => {
    const url = writeQueryParams();
    try {
        await navigator.clipboard.writeText(url);
        shareBtn.textContent = '✓ Copied!';
        setTimeout(() => { shareBtn.textContent = 'Share'; }, 1800);
    } catch {
        // Fallback for non-HTTPS or denied permission
        prompt('Copy this URL:', url);
    }
});
```

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
  ├─ Set random brand gradient (CSS custom property)
  ├─ Load shared CSS + JS
  │
  ├─ DOMContentLoaded
  │    ├─ initThemeSwitcher()
  │    ├─ Bind event listeners (input, change)
  │    │
  │    └─ fetchVersionList()  ──→  GitHub API (cached)
  │         │
  │         ├─ populateSelects()
  │         ├─ readQueryParams()  ← timing-critical: after selects populated
  │         └─ if (hasParams) doSearch()  ← auto-trigger from deep link
  │
  └─ User Interaction Loop
       │
       ├─ Text input → debounce 400ms → doSearch()
       ├─ Select change → immediate → doSearch()
       ├─ Checkbox change → immediate → doSearch()
       │
       └─ doSearch()
            ├─ myId = ++requestId  (cancellation token)
            ├─ fetch data (in-memory cache check first)
            ├─ if (myId !== requestId) return  (stale check)
            ├─ render results
            └─ writeQueryParams()  (update URL)
```

## Common Mistakes

1. **Using `pushState`** instead of `replaceState` — fills browser history with junk.
2. **Reading query params before async data loads** — select values silently fail.
3. **No cancellation tokens** — stale async results overwrite current results.
4. **No stale cache fallback on 403** — users see blank pages when rate-limited.
5. **Fetching via GitHub API when Pages URL works** — wastes rate-limit budget.
6. **Not deduplicating concurrent fetches** — 3 components trigger 3 identical HTTP requests.
7. **Using `option.hidden`** — Safari doesn't support it. Remove and re-add options instead.
