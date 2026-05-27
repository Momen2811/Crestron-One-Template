# Bundle speedup — local fonts + production minification

**Date:** 2026-05-20
**Scope:** Build pipeline only. Reduces the size of the JS payload and removes the runtime dependency on Google Fonts so that the Crestron One mobile app's "Connecting to Jung" wait shrinks.
**Status:** Approved for implementation.

## Goal

Cut several seconds off the cold-connect time of Crestron One on the user's RMC4 by:

1. Embedding the Google Fonts (Sora + JetBrains Mono) locally so the WebView no longer waits on `fonts.googleapis.com` requests that can stall or fail on the controller's network.
2. Running Terser on the concatenated `component.js` + `cr-com-lib.js` bundles so the prod `.ch5z` archive ships roughly half the size it does today.

## Background

When the user taps their RMC4 ("Jung") in Crestron One, the app shows a native "Connecting to Jung" spinner for ~15 s before the home page appears. We have already established (separate conversation, not in scope here) that:

- The connection is LAN (same Wi-Fi, IP-addressed) — internet/DNS is not the bottleneck.
- Auth is automatic — no login round-trip.
- The bulk of the 15 s is download + parse of the CH5 bundle plus initial-state replay of join feedback.
- Crestron One holds its native spinner until the CH5 project signals "session ready," so the existing splash in `index.html` is never visible on mobile.

Two findings make this a real fix:

### Finding 1 — Production bundles are not minified

`webpack.prod.js` sets `mode: 'production'`, but it uses `@mcler/webpack-concat-plugin` to build both `component.js` and `cr-com-lib.js`. That plugin concatenates files raw and bypasses webpack's optimization pipeline (Terser, tree-shaking, dead-code elimination). Current sizes in `dist/prod/Shell/libraries/`:

| File | Current size |
|------|------|
| `cr-com-lib.<hash>.js` | 1,904 KB |
| `component.<hash>.js`  | 341 KB |
| **Total JS payload**   | **~2.25 MB** |

With Terser compression + mangling this typically drops to 45–55 % of the original.

### Finding 2 — Google Fonts loaded from the public CDN on every page

Every one of the 10 HTML files (`home.html` and `page1.html` … `page9.html`) has a `<link>` tag fetching Sora + JetBrains Mono from `fonts.googleapis.com` at runtime. On a controller LAN that may have restricted internet, these requests either succeed slowly (extra WAN round-trip per page boot) or time out before falling back to system fonts. Either path costs seconds.

## Decisions (from brainstorming)

| Decision | Value | Reason |
|---|---|---|
| Scope | B3-1 (fonts) + B3-2 (minification) only | Largest practical wins for least risk. |
| Font source | Fontsource npm packages (`@fontsource/sora`, `@fontsource/jetbrains-mono`) | Reproducible, MIT-licensed, ships exact same WOFF2 files as Google CDN. |
| Font format | WOFF2 only | Universal support on all target devices (iOS Safari, Android Chromium WebView, modern desktop browsers). No need for WOFF/TTF fallbacks. |
| `font-display` strategy | `swap` | Match current behavior (avoid FOIT — flash of invisible text). System font shows during the ~10–50 ms it takes to decode the WOFF2 file. |
| Minifier | Terser | Modern, handles ES2020+, well-maintained. UglifyJS (the alternative built into `WebpackConcatPlugin`) is deprecated. |
| When minify runs | After `webpack --config webpack.prod.js` finishes, before `build:archive` packs the `.ch5z` | Keeps webpack pipeline untouched. Dev build (`npm run start`) skips minification for faster iteration. |
| Minify output | Overwrite the hashed files in place | Avoids changing the filenames that webpack's `HtmlWebpackPlugin` already wrote into `dist/prod/Shell/index.html`. |
| Mangle scope | Local variables only (no property mangling) | CrComLib expects specific property names — `pulse`, `subBool`, `JOINS.HOUSE_MODES.MORNING`, etc. — that must stay intact. |
| Source maps | Disabled in prod | Smaller output, no need to debug minified prod on a TSW panel. |
| Splash code | Keep as-is | Never visible on mobile, useful on desktop browser. No code touched there. |

## Design

### File layout

```
project-one/
├── scripts/                                     ← NEW
│   ├── copy-fonts.js                            ← NEW (Node.js)
│   └── minify-bundles.js                        ← NEW (Node.js)
├── app/template/assets/
│   ├── fonts/                                   ← NEW directory
│   │   ├── sora/
│   │   │   ├── sora-latin-300-normal.woff2     ← copied by script
│   │   │   ├── sora-latin-400-normal.woff2
│   │   │   ├── sora-latin-500-normal.woff2
│   │   │   ├── sora-latin-600-normal.woff2
│   │   │   └── sora-latin-700-normal.woff2
│   │   └── jetbrains-mono/
│   │       ├── jetbrains-mono-latin-400-normal.woff2
│   │       ├── jetbrains-mono-latin-500-normal.woff2
│   │       └── jetbrains-mono-latin-600-normal.woff2
│   └── scss/custom/
│       └── _fonts.scss                          ← NEW
├── package.json                                 ← modified (deps, scripts)
└── app/project/components/pages/{home,page1..page9}/{home,pageN}.html
                                                 ← modified (remove <link> tag)
```

### B3-1 — Local fonts

**Dependencies added (devDependencies):**

```json
"@fontsource/sora": "^5.0.0",
"@fontsource/jetbrains-mono": "^5.0.0"
```

**`scripts/copy-fonts.js`** — small Node.js script. Imports `fs` and `path`. For each `{family, weights, sourcePackage, destDir}` entry in a config array, copies the listed `<sourcePackage>/files/<family>-latin-<weight>-normal.woff2` files into `app/template/assets/fonts/<family>/`. Creates the destination directory if missing. Idempotent — re-running overwrites cleanly. Skips silently if the source package isn't installed yet (so a fresh checkout that hasn't run `npm install` yet doesn't crash).

The script is wired as a **postinstall hook** in `package.json` so any developer running `npm install` ends up with the fonts in place. It is also exposed as `npm run copy:fonts` for manual re-runs.

**`app/template/assets/scss/custom/_fonts.scss`** — 8 `@font-face` declarations, one per weight. Pattern:

```scss
@font-face {
  font-family: 'Sora';
  font-style: normal;
  font-weight: 300;
  font-display: swap;
  src: url('../../fonts/sora/sora-latin-300-normal.woff2') format('woff2');
}
// … same shape for 400, 500, 600, 700 ………
@font-face {
  font-family: 'JetBrains Mono';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('../../fonts/jetbrains-mono/jetbrains-mono-latin-400-normal.woff2') format('woff2');
}
// … same shape for 500, 600 …
```

The relative URL `../../fonts/...` is resolved from `app/template/assets/scss/custom/`, which is where the file lives — `..` → `scss/`, `..` → `assets/`, then `fonts/...`. The webpack pipeline already copies `app/template/assets/**` to `dist/<env>/Shell/app/template/assets/**` so the relative URL keeps resolving in the dist output.

**SCSS import wiring** — `_fonts.scss` is `@use`-d from `_theme-additions.scss` at the top of the file so font-face declarations come before any rule that consumes Sora/JetBrains Mono.

**HTML edits** — delete this single line from each of the 10 HTML files:

```html
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

Files affected:
- `app/project/components/pages/home/home.html`
- `app/project/components/pages/page1/page1.html`
- … `page2.html` through `page9.html` (8 more)

### B3-2 — Bundle minification

**Dependencies added (devDependencies):**

```json
"terser": "^5.36.0"
```

**`scripts/minify-bundles.js`** — Node.js script that:

1. Resolves `dist/prod/Shell/libraries/` (path relative to the repo root).
2. Uses `fs.readdirSync` to find files matching `component.*.js` and `cr-com-lib.*.js` (the hashed filenames produced by WebpackConcatPlugin).
3. For each file: reads contents, calls `terser.minify(source, options)`, writes the minified output back to the same path.
4. Logs before/after byte counts and the reduction percentage so the user can see the impact.
5. Exits non-zero if Terser reports any error (so a CI build fails fast).

Terser options used:

```js
{
  compress: {
    passes: 2,           // run two compress passes for slightly better output
    drop_console: false, // KEEP console.log/.warn — Crestron-tooling diagnostics rely on them
    drop_debugger: true
  },
  mangle: {
    properties: false    // CRITICAL: do not mangle property names — CrComLib + WebXPanel
                         // read 'pulse', 'subBool', 'JOINS.SHADES.BEDROOM_OPEN', etc.
                         // as runtime strings/keys. Mangling them would break wiring.
  },
  format: {
    comments: false
  },
  sourceMap: false
}
```

**`package.json` script changes:**

The existing `build:prod` (from `package.json`) is:

```
"build:prod": "npx ch5-shell-cli val:pc && npm run clean:prod && webpack --config webpack.prod.js && npm run cleanjs:prod"
```

It becomes:

```
"build:prod": "npx ch5-shell-cli val:pc && npm run clean:prod && webpack --config webpack.prod.js && npm run cleanjs:prod && npm run minify:bundles"
```

Three new entries are added to `"scripts"`:

```json
"copy:fonts":     "node scripts/copy-fonts.js",
"minify:bundles": "node scripts/minify-bundles.js",
"postinstall":    "node scripts/copy-fonts.js"
```

Notes:
- `cleanjs:prod` removes top-level `dist/prod/Shell/*.js` (config artifacts); the hashed bundles in `dist/prod/Shell/libraries/` survive that step, so the minify step that follows finds and overwrites them.
- `build:archive` is unchanged. It already does `npm run build:prod && ch5-cli archive …`, so it picks up the minified bundles automatically.
- `npm run start` (the dev server) is unchanged. Dev builds skip minification.
- `postinstall` ensures `copy-fonts.js` runs once after `npm install`, dropping the WOFF2 files into `app/template/assets/fonts/` before webpack first runs.

### What does NOT change

- `webpack.common.js`, `webpack.dev.js`, `webpack.prod.js` — none of the webpack config files are edited. WebpackConcatPlugin still does the concat; we just add a post-step.
- `app/index.html` — unchanged. The custom splash code stays.
- Any `page<N>.js`, `joins<N>.js`, `home.js`, `home.scss`, `page<N>.scss` — unchanged. No runtime logic touched.
- `app/template/libraries/webxpanel.js` — unchanged.
- `project-config.json` — unchanged.

## Acceptance criteria

1. `npm install` completes and at the end, `app/template/assets/fonts/sora/sora-latin-300-normal.woff2` (and 7 sibling files) exist on disk.
2. `npm run start` builds and serves a working dev panel at `http://localhost:3000`. Sora and JetBrains Mono render correctly (visually identical to current state). DevTools → Network shows zero requests to `fonts.googleapis.com` or `fonts.gstatic.com`.
3. `npm run build:prod` finishes, and `dist/prod/Shell/libraries/component.*.js` + `cr-com-lib.*.js` are noticeably smaller than the pre-change baseline (target: ≥ 40 % reduction on `cr-com-lib`). The minify-bundles script logs the actual reduction.
4. `npm run build:archive` produces a `.ch5z` archive that, when deployed to the RMC4 and loaded by Crestron One, still renders all 10 pages correctly. Lamp toggles, shade buttons, AC dial, music controls, theme dropdown — all still work. No console errors that did not exist before.
5. Cold connect time in Crestron One on the user's iPhone, same Wi-Fi as the RMC4, is shorter than the current 15 s. Target: 8–12 s (3–7 s improvement). Exact number depends on whether the previous setup was actually timing out on Google Fonts requests.

## Risks and mitigations

| Risk | Likelihood | Mitigation |
|------|------|------|
| Terser breaks a CrComLib code path despite property-mangling disabled | Low | `compress.passes: 2` + `mangle.properties: false` is the standard safe config. Acceptance criterion 4 covers end-to-end smoke-test on a real RMC4 before declaring done. |
| `@fontsource` packages don't match Google CDN visually | Very low | They are literal copies of Google Fonts WOFF2 binaries, just self-hosted. |
| postinstall hook fails on Windows shells | Low | The script is a plain Node.js `.js` file invoked via `node`. No shell-specific syntax. |
| WOFF2 paths don't resolve in the dist output | Low | The existing webpack copy rules already mirror `app/template/assets/**` into `dist/<env>/Shell/app/template/assets/**`. The relative `url('../../fonts/...')` in SCSS works the same way other existing asset references do. |
| Cellular connect (over `mycrestron.com`) regresses | Low | Cellular path also benefits from smaller bundle + no Google Fonts request. Should improve, not regress. |
| Build fails because `dist/prod/Shell/libraries/` is empty when minify-bundles.js runs | Low | The script handles missing files by logging a clear error and exiting non-zero. The webpack step must run successfully first; `&&` chaining in `build:prod` ensures the order. |

## Non-goals

- No changes to `cr-com-lib`'s functionality. We minify the file but do not strip features.
- No lazy-loading of per-page modules (the A1 optimization from the parent conversation). That's a real refactor; out of scope.
- No lazy subscription registration (A2). Out of scope.
- No changes to the custom splash markup in `index.html`. Out of scope per user decision.
- No fix for the audit findings from earlier in this session (missing shutdown buttons on pages 3/4/5/7, empty APPS sections, page9 stale joins, etc.). Those are separate tickets.

## File summary

| Path | Action |
|------|------|
| `package.json` | Modify — add 3 devDependencies, 3 scripts. |
| `scripts/copy-fonts.js` | Create. |
| `scripts/minify-bundles.js` | Create. |
| `app/template/assets/fonts/sora/*.woff2` | Create (5 files, copied by script). |
| `app/template/assets/fonts/jetbrains-mono/*.woff2` | Create (3 files, copied by script). |
| `app/template/assets/scss/custom/_fonts.scss` | Create. |
| `app/template/assets/scss/custom/_theme-additions.scss` | Modify — one new `@use 'fonts';` import at the top. |
| `app/project/components/pages/home/home.html` | Modify — remove 1 line. |
| `app/project/components/pages/page1/page1.html` through `page9/page9.html` | Modify — remove 1 line each (9 files). |
