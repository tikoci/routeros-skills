---
name: tikoci-pico-css-spa
description: "Pico CSS v2 patterns for static single-page apps. Use when: building HTML pages with Pico CSS, debugging dark mode issues with Pico CSS, integrating third-party components (Monaco Editor, diff2html, CodeMirror) with Pico CSS, using Pico semantic HTML elements, or when the user mentions Pico CSS, data-theme, classless CSS, or building a static SPA."
---

# Pico CSS v2 — Patterns for Static SPAs

## What Pico CSS Is

[Pico CSS](https://picocss.com/) (v2) is a **classless-first CSS framework** — it styles semantic HTML
elements directly without requiring utility classes. It provides a complete design system (colors, spacing,
typography, forms, buttons, cards, modals) from `<article>`, `<nav>`, `<details>`, `<dialog>`, etc.

**Why Pico:** Minimal footprint (~10 KB gzipped), no build tools, no JavaScript, semantic HTML encouraged,
built-in dark mode, responsive by default. Ideal for static GitHub Pages SPAs with no framework.

## Loading Pico

```html
<!-- CDN — latest v2 -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css">

<!-- Optional: load custom fonts BEFORE Pico overrides -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Manrope:wght@200..800&display=swap">

<!-- Then your CSS overrides (after Pico) -->
<style>
  :root {
    --pico-font-family: "JetBrains Mono", var(--pico-font-family-sans-serif);
  }
</style>
```

## Dark Mode

### The Critical `data-theme="auto"` Gotcha

**`data-theme="auto"` is NOT a valid Pico CSS v2 value.** Setting it silently forces light mode.

Pico v2 supports only two explicit values:
- `data-theme="light"` — force light mode
- `data-theme="dark"` — force dark mode
- **(no attribute)** — follow OS preference via `@media (prefers-color-scheme: dark)`

To implement an "auto" / OS-following mode, **remove the `data-theme` attribute entirely**:

```javascript
// Three-state theme cycle: auto → light → dark → auto
function setTheme(state) {
  const html = document.documentElement;
  if (state === 'light') {
    html.setAttribute('data-theme', 'light');
  } else if (state === 'dark') {
    html.setAttribute('data-theme', 'dark');
  } else {
    // "auto" — remove the attribute so Pico follows OS
    html.removeAttribute('data-theme');
  }
}
```

### Dark Mode CSS for Third-Party Components

When a third-party library (diff2html, Monaco, CodeMirror, chart libraries) needs dark-mode
overrides, you need **two CSS rules** to cover both scenarios:

```css
/* 1. Auto mode + OS-is-dark — no data-theme attribute on <html> */
@media (prefers-color-scheme: dark) {
    :root:not([data-theme=light]) .my-component { /* dark styles */ }
}

/* 2. Explicit dark mode — user toggled to dark */
[data-theme=dark] .my-component { /* dark styles */ }
```

Why both? With `data-theme="dark"`, the media query might not match (user's OS could be light).
With no attribute + OS dark, `[data-theme=dark]` doesn't match. You need both rules.

**Anti-pattern:** `[data-theme=dark] .component, @media (prefers-color-scheme: dark) { .component {} }`
misses the case where OS is dark but user hasn't set explicit dark. Use `:root:not([data-theme=light])`
inside the media query.

### Dark/Light Image Swap

Show different images based on theme state:

```html
<img data-theme="light" src="logo-dark.svg" alt="Logo">
<img data-theme="dark" src="logo-light.svg" alt="Logo">
```

```css
/* Default: show light-theme image */
img[data-theme=dark] { display: none; }

/* Explicit dark */
[data-theme=dark] img[data-theme=dark] { display: inline; }
[data-theme=dark] img[data-theme=light] { display: none; }

/* Explicit light */
[data-theme=light] img[data-theme=dark] { display: none; }

/* Auto + OS dark */
@media (prefers-color-scheme: dark) {
    :root:not([data-theme=light]) img[data-theme=dark] { display: inline; }
    :root:not([data-theme=light]) img[data-theme=light] { display: none; }
}
```

## Semantic HTML Patterns

Pico styles these elements directly — no classes needed:

| Element / Pattern | Pico Rendering | Use For |
|---|---|---|
| `<article>` | Card with padding, border, rounded corners | Content cards, callouts |
| `<article>` + `<header>` / `<footer>` | Card with distinct header/footer | Structured panels |
| `<details>` / `<summary>` | Accordion with arrow indicator | Collapsible sections |
| `<details>` + `name="group"` | Exclusive accordion (one open at a time) | Tabbed groups |
| `<summary role="button">` | Summary looks like a button | Prominent toggles |
| `<dialog>` | Modal overlay (use `.showModal()`) | Modals, share dialogs |
| `<mark>` | Yellow/primary highlight | Key terms, search matches |
| `<kbd>` | Keyboard-key inset style | Keyboard shortcuts, tags |
| `<ins>` / `<del>` | Green / red inline text | Diff showing, changes |
| `<hr>` inside `<article>` | Subtle content divider | Separating sections |
| `<nav>` with `<ul>` | Horizontal flex layout (no bullets) | Toolbars, control bars |
| `<figure>` + `<figcaption>` | Captioned content block | Examples with notes |
| `role="switch"` on `<input type="checkbox">` | Toggle switch appearance | On/off controls |
| `aria-busy="true"` on any element | Loading spinner | Async content |
| `<progress>` (no `value`) | Indeterminate progress bar | Loading state |

### Pico Containers

Pico uses `<main class="container">` for centered content width. Options:
- `class="container"` — standard max-width (~1200px)
- `class="container-fluid"` — full width with padding
- No class on `<main>` — full width, no padding

### Form Controls

```html
<!-- Pico styles all form elements by default -->
<input type="text" placeholder="Search...">
<select><option>Choose</option></select>
<textarea></textarea>

<!-- Toggle switch (no JavaScript needed for styling) -->
<label>
  <input type="checkbox" role="switch">
  Enable feature
</label>

<!-- Inline validation states -->
<input type="email" aria-invalid="true">   <!-- Red border -->
<input type="email" aria-invalid="false">  <!-- Green border -->
```

### Dropdown Navigation

```html
<details class="dropdown">
    <summary>Menu</summary>
    <ul dir="rtl">  <!-- dir="rtl" for right-alignment -->
        <li><a href="page1.html">Page 1</a></li>
        <li><a href="page2.html">Page 2</a></li>
    </ul>
</details>
```

**Gotcha:** When `dir="rtl"` is used for right-alignment, menu items with leading special
characters (like `/app`) display incorrectly (slash moves to end). Fix with CSS:
```css
details.dropdown ul li { direction: ltr; }
```

## Pico CSS Overrides — Common Patterns

### Font Override

Pico defines emoji and system-font CSS variables. Mirror the **full fallback stack** so fonts
degrade gracefully across platforms:

```css
:root {
    --pico-font-family-sans-serif: Manrope, system-ui, "Segoe UI", Roboto,
        Oxygen, Ubuntu, Cantarell, Helvetica, Arial, "Helvetica Neue",
        sans-serif, var(--pico-font-family-emoji);
    --pico-font-family-monospace: "JetBrains Mono", ui-monospace, SFMono-Regular,
        "SF Mono", Menlo, Consolas, "Liberation Mono", monospace,
        var(--pico-font-family-emoji);
    --pico-font-family: "JetBrains Mono", var(--pico-font-family-sans-serif);
}
```

**`var(--pico-font-family-emoji)`** — Pico defines this variable with the platform emoji stack.
Append it to your overrides so emoji render natively.

### Inline Code Line-Height Fix

Pico adds vertical padding to `<code>` and `<kbd>` that inflates line-height in paragraph text:

```css
:not(pre) > code,
:not(pre) > kbd {
    padding: 0.05em 0.3em;
    vertical-align: baseline;
}
```

### Table / Grid Resets (for Third-Party Libraries)

Pico aggressively styles **all** `<td>`, `<th>`, `<table>` elements globally. When embedding
a library that generates tables (diff2html, data grids), Pico's padding, borders, and background
bleed into the library's DOM. Fix by scoping resets to the library's container:

```css
#my-library-container td,
#my-library-container th {
    padding: 0;           /* Reset Pico's padding */
    border: none;         /* Reset Pico's borders */
    background: none;     /* Reset Pico's striping */
    color: inherit;
}
```

## Third-Party Library Integration

### The General Problem

Pico CSS uses **low-specificity global selectors** (`button {}`, `[role="button"] {}`, `td {}`,
`a {}`) that style bare elements. Third-party libraries that create DOM elements get Pico's
styles applied to their internals, causing visual breakage.

**The fix:** CSS resets scoped to the library's container with **just enough specificity** to
beat Pico but not override the library's own rules.

### Monaco Editor + Pico CSS

Pico's `button {}` and `[role="button"] {}` rules leak into Monaco's widgets (hover tooltips,
zone widgets, problem panels). The fix requires a **specificity sandwich**:

| Rule | Specificity | Purpose |
|---|---|---|
| Pico `button {}` | `(0,0,1)` | Gets overridden |
| Pico `[role="button"] {}` | `(0,1,0)` | Gets overridden |
| **Our reset** `.monaco-editor :is(button, a[role="button"])` | **`(0,2,1)`** | Neutralizes Pico |
| Monaco's own `.zone-widget button` etc. | `(0,2,1)+` | Still wins (same or higher) |

```css
/* Box model reset — covers both <button> and <a role="button"> */
.monaco-editor :is(button, a[role="button"]) {
    padding: 0; border: 0; background: transparent;
    box-shadow: none; width: auto; inline-size: auto;
    min-height: 0; margin: 0; border-radius: 0;
}

/* Font reset — ONLY for <a role="button"> (not <button>)
   Monaco controls icon font-size on <button>.codicon */
.monaco-editor a[role="button"] {
    font-size: inherit;
    line-height: inherit;
    font-weight: inherit;
}
```

**Anti-patterns:**
- `#container :is(...)` — ID specificity `(1,x,x)` overrides Monaco's own widget styles
- `appearance: auto` — OS-native button chrome creates visual artifacts in dark mode
- `font: inherit` — breaks codicon icon glyphs that need `font-family: codicon`
- `color: inherit` — conflicts with Monaco's dark/light icon colors
- Putting `font-size` on the `:is(button, a)` rule — breaks codicon sizing on `<button>`

### diff2html + Pico CSS

```css
/* Reset Pico's table styling inside diff output */
#diffoutput td, #diffoutput th {
    padding: 0;
    border: none;
    background: transparent;
    color: inherit;
}

/* diff2html sets opaque white backgrounds — make transparent for dark mode */
#diffoutput .d2h-file-wrapper,
#diffoutput .d2h-code-wrapper {
    background: transparent;
}
```

**Gotchas:**
- `colorScheme` option in `Diff2Html.html()` is a no-op — dark mode requires CSS overrides
- Context lines are a **jsdiff** option (patch generation), not diff2html (rendering)

### General Library Reset Template

```css
/* Replace .my-lib with the library's container class */
.my-lib button,
.my-lib [role="button"],
.my-lib a {
    padding: revert;
    border: revert;
    background: revert;
    color: revert;
    font-size: revert;
    line-height: revert;
    width: auto;
    box-shadow: none;
}

.my-lib td, .my-lib th {
    padding: revert;
    border: revert;
    background: revert;
}
```

## Page Architecture Pattern

### Single-File SPA

```html
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>My Tool</title>

    <!-- 1. Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="stylesheet" href="...fonts...">

    <!-- 2. Pico CSS -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css">

    <!-- 3. Shared CSS (after Pico, before page styles) -->
    <link rel="stylesheet" href="shared.css">

    <!-- 4. Page-specific CSS (overrides) -->
    <style>
        /* page-specific styles here */
    </style>
</head>
<body>
    <header class="container">
        <nav>
            <ul><li><strong>My App</strong></li></ul>
            <ul>
                <li>
                    <details class="dropdown">
                        <summary>Tools</summary>
                        <ul dir="rtl">
                            <li><a href="page1.html" aria-current="page">Page 1</a></li>
                            <li><a href="page2.html">Page 2</a></li>
                        </ul>
                    </details>
                </li>
                <li><a href="#" id="theme_switcher" role="button">🌓</a></li>
            </ul>
        </nav>
    </header>

    <main class="container">
        <!-- Content here — semantic HTML, no div soup -->
    </main>

    <footer class="container">
        <small>Footer text</small>
    </footer>

    <!-- Shared JS utilities (at body end, or use DOMContentLoaded) -->
    <script src="shared.js"></script>
    <script>
        // Page-specific JS — inline, no build tools
        initThemeSwitcher();
        // ... wire event listeners, fetch data, etc.
    </script>
</body>
</html>
```

For JavaScript SPA patterns used alongside Pico (event-driven UI, debouncing, cancellation
tokens, shareable URLs, share buttons), see the companion
[tikoci-github-pages-spa](../tikoci-github-pages-spa/SKILL.md) skill.

## Pico CSS Variable Reference (Commonly Overridden)

| Variable | Default | Controls |
|---|---|---|
| `--pico-font-family` | System stack | Body text font |
| `--pico-font-family-monospace` | Monospace stack | `<code>`, `<pre>`, `<kbd>` |
| `--pico-font-size` | `1rem` | Base font size |
| `--pico-border-radius` | `0.25rem` | Border radius everywhere |
| `--pico-primary` | Blue | Primary accent color |
| `--pico-color` | Dark/light text | Main text color |
| `--pico-muted-color` | Gray | Secondary text |
| `--pico-muted-border-color` | Light gray | Subtle borders |
| `--pico-code-background-color` | Light gray | `<code>`, `<pre>` background |
| `--pico-code-color` | Dark | `<code>`, `<pre>` text |
| `--pico-del-color` | Red | `<del>` text color |
| `--pico-mark-background-color` | Yellow | `<mark>` background |
| `--pico-form-element-background-color` | White/dark | Input backgrounds |
| `--pico-form-element-border-color` | Gray | Input borders |

## Collapsible Guide Pattern

In-page help using Pico's native `<details>`:

```html
<details class="page-guide">
    <summary><b>How to use this tool?</b></summary>
    <article>
        <header><strong>Getting Started</strong></header>
        <p>Explanation of controls...</p>
        <hr>
        <p>Notation reference...</p>
        <hr>
        <div class="behind-curtain">
            <small><b>Behind the curtain</b> — implementation notes</small>
        </div>
        <footer>
            <small>Bug reports: <a href="...">Issues</a></small>
        </footer>
    </article>
</details>
```

The `.behind-curtain` class provides styling for implementation/technical notes at the
bottom of the guide — typically lighter/smaller text that reveals how the tool works.

## Brand Gradient System

Randomized MikroTik-inspired accent gradient, set once per page load via JS:

```javascript
// shared.js sets --brand-gradient on <html> immediately
const GRADIENTS = [
    'linear-gradient(135deg, #0066cc 0%, #00aaff 100%)',
    'linear-gradient(135deg, #cc3300 0%, #ff6633 100%)',
    // ... array of brand-safe gradients
];
document.documentElement.style.setProperty('--brand-gradient',
    GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)]);
```

Use with the `.brand-reverse` utility class. Two variants exist:

```css
/* Variant A: gradient text (tikoci.github.io hero sections) */
.brand-reverse {
    background: var(--brand-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

/* Variant B: white-on-gradient pill (restraml nav brand) */
.brand-reverse {
    display: inline-block;
    background: var(--brand-gradient, linear-gradient(135deg, #3660B9, #5F2965));
    color: #fff;
    padding: 0.05em 0.4em;
    border-radius: var(--pico-border-radius);
    font-weight: 800;
    letter-spacing: 0.06em;
}
```

Pickone per project — both use the same `--brand-gradient` CSS custom property.

## Nav Brand Link with Dark/Light Logo Swap

Combine Pico nav with responsive logo images that swap for dark mode:

```html
<nav>
    <ul>
        <li>
            <a href="/" class="nav-brand-link">
                <img data-theme="light" src="logos/mikrotik-dark.svg" alt="MikroTik">
                <img data-theme="dark" src="logos/mikrotik-light.svg" alt="MikroTik">
                <span class="brand-text">TIKOCI</span>
            </a>
        </li>
    </ul>
    <!-- ... dropdown menus, theme switcher ... -->
</nav>
```

On mobile, hide the logos and show a compact symbol via `@media` queries.

## Category Badges with `<mark>`

Pico styles `<mark>` as highlighted inline text. Use for category tags:

```html
<mark>containers</mark> <mark>dev-tools</mark>
```

Customize colors per category by overriding `--pico-mark-background-color` in scoped rules.

## Project Card Grid

```css
.project-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
}
```

Cards are `<article>` elements inside the grid — Pico handles all card styling.

## Plausible Analytics Integration

Include in `<head>` before any other scripts:

```html
<script async src="https://plausible.io/js/pa-ubWop5eYckoDPVbIjXU4_.js"></script>
<script>window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)};
plausible.init=plausible.init||function(i){plausible.o=i||{}};plausible.init()</script>
```

Track custom events: `plausible('Event Name', { props: { key: value } })`.
The stub ensures calls don't throw if the script hasn't loaded or is blocked.

## Switch Label Consistency

When a `<nav>` has multiple `role="switch"` toggles, keep all labels consistent:

```css
#my-switches label {
    font-size: 0.88rem;
    font-style: italic;
}
#my-switches label code {
    font-style: normal;  /* technical terms stay upright */
}
```

This avoids per-label `<i>` tags — let CSS handle italic uniformly.

## Common Mistakes with Pico

1. **Using `data-theme="auto"`** — forces light mode silently. Remove the attribute instead.
2. **Adding CSS framework classes** — Pico is classless-first. Use semantic elements, not `.card`, `.btn`.
3. **Wrapping everything in `<div>`** — use `<article>`, `<section>`, `<nav>`, `<details>` instead.
4. **Forgetting dark mode dual-rule** — need both `@media` and `[data-theme=dark]` selectors.
5. **Not scoping third-party resets** — Pico bleeds into Monaco, diff2html, etc. Always scope resets.
6. **Using JS to toggle `role="switch"` appearance** — Pico v2 styles `role="switch"` via the
   `:checked` CSS pseudo-class on `<input type="checkbox">`, so the visual toggle works without
   JavaScript. You do NOT need JS to set `aria-checked`. Just use a standard checkbox with
   `role="switch"` and Pico handles the rest.
7. **Overriding with too-high specificity** — IDs break the library's own internal styles.
