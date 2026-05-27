# Bundle speedup — local fonts + production minification — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cut several seconds off the Crestron One "Connecting to Jung" cold-connect time on the user's RMC4 by embedding Google Fonts locally (no internet round-trip on every page load) and minifying the production `component.js` + `cr-com-lib.js` bundles.

**Architecture:** Pure build-pipeline changes. Two new Node.js scripts under `scripts/`, three new npm-script entries (`copy:fonts`, `minify:bundles`, `postinstall`), and one modified script (`build:prod` chains the minify step). The existing webpack config, page JS, page HTML logic, and runtime boot flow are untouched. Sora + JetBrains Mono WOFF2 files are sourced from the `@fontsource` npm packages and copied into the existing `app/template/assets/fonts/` directory next to the Roboto files that are already there.

**Tech Stack:** Node.js (for build scripts), Terser (JS minifier), `@fontsource/sora` + `@fontsource/jetbrains-mono` (npm-published fonts). Sass (existing). Webpack 5 (existing, no changes).

**Project realities to know:**

- **No test runner, no linter.** Verification is manual: `npm run start` + browser, plus comparing bundle sizes before/after.
- **Sass uses legacy `@import` syntax** (not `@use`) throughout the codebase. The existing `_fonts.scss` is auto-imported by `_main.scss` (line 8) — no new import wiring required.
- **`$font-path = "./../fonts/"`** is defined in `app/template/assets/scss/custom/_variables-custom.scss` (line 39). It resolves from the compiled CSS location to the existing `app/template/assets/fonts/` directory. We reuse it.
- **The `app/template/assets/fonts/` directory already exists** and contains all the Roboto WOFF/WOFF2/TTF/EOT/SVG files. We drop Sora + JetBrains Mono WOFF2 files into the same flat directory.
- **Git identity may not be configured** on this machine (commit failed in a previous session). If a commit step fails with `Author identity unknown`, **stop and ask the user** — do not run `git config` autonomously. CLAUDE.md / system rules forbid it.
- **`npm run start` self-exits when `project-config.json` changes** — we don't touch that file in this plan, so the dev server stays up.
- **The dev server output is `dist/dev/Shell/`**, the prod output is `dist/prod/Shell/`. Both contain a `libraries/` subdirectory with the bundled JS files.

**Spec:** `docs/superpowers/specs/2026-05-20-bundle-speedup-design.md`

---

## File Structure

| File | Action |
|------|--------|
| `package.json` | Modify — add 3 devDependencies (`@fontsource/sora`, `@fontsource/jetbrains-mono`, `terser`) and 3 npm scripts (`copy:fonts`, `minify:bundles`, `postinstall`); update `build:prod`. |
| `scripts/copy-fonts.js` | Create — Node.js script that copies the needed WOFF2 files from `node_modules/@fontsource/*/files/` to `app/template/assets/fonts/`. |
| `scripts/minify-bundles.js` | Create — Node.js script that runs Terser in-place on the hashed `component.*.js` + `cr-com-lib.*.js` files in `dist/prod/Shell/libraries/`. |
| `app/template/assets/fonts/sora-300.woff2` | Create (via script) — 1 of 5 Sora weight files. |
| `app/template/assets/fonts/sora-400.woff2` | Create (via script). |
| `app/template/assets/fonts/sora-500.woff2` | Create (via script). |
| `app/template/assets/fonts/sora-600.woff2` | Create (via script). |
| `app/template/assets/fonts/sora-700.woff2` | Create (via script). |
| `app/template/assets/fonts/jetbrainsmono-400.woff2` | Create (via script). |
| `app/template/assets/fonts/jetbrainsmono-500.woff2` | Create (via script). |
| `app/template/assets/fonts/jetbrainsmono-600.woff2` | Create (via script). |
| `app/template/assets/scss/custom/_fonts.scss` | Modify — append 8 `@font-face` blocks for Sora (5 weights) + JetBrains Mono (3 weights). |
| `app/project/components/pages/home/home.html` | Modify — remove the single `<link rel="stylesheet" href="https://fonts.googleapis.com/...">` line. |
| `app/project/components/pages/page1/page1.html` through `page9/page9.html` | Modify — remove the same `<link>` line in each (9 files). |

**Not touched:** any `page<N>.js`, any `joins<N>.js`, `home.js`, `webxpanel.js`, the template tree's JS, any `.scss` in pages, `webpack.common.js`, `webpack.dev.js`, `webpack.prod.js`, `project-config.json`, `index.html`, the splash code.

---

## Task 1: Install dependencies

**Files:**
- Modify: `package.json` (the `devDependencies` block; npm does this automatically).

- [ ] **Step 1.1: Install runtime fonts and Terser as devDependencies**

Run from the project root:

```
npm install --save-dev @fontsource/sora@^5.0.0 @fontsource/jetbrains-mono@^5.0.0 terser@^5.36.0
```

Expected output: npm prints `added N packages` and updates `package.json` + `package-lock.json` with the three new entries under `devDependencies`. If this fails with a network error, retry once; if it still fails, stop and report — we cannot proceed without these packages.

- [ ] **Step 1.2: Verify the packages installed**

Run:

```
node -e "console.log(require('@fontsource/sora/package.json').version); console.log(require('@fontsource/jetbrains-mono/package.json').version); console.log(require('terser/package.json').version);"
```

Expected: Three version numbers printed (e.g. `5.1.0`, `5.1.0`, `5.36.0`). If any errors with `Cannot find module`, the install in Step 1.1 didn't complete — re-run it.

- [ ] **Step 1.3: Verify the WOFF2 source files exist in node_modules**

Run:

```
node -e "const fs=require('fs');console.log(fs.readdirSync('node_modules/@fontsource/sora/files').filter(f=>f.includes('latin-400-normal')).slice(0,5));console.log(fs.readdirSync('node_modules/@fontsource/jetbrains-mono/files').filter(f=>f.includes('latin-400-normal')).slice(0,5));"
```

Expected: prints two arrays containing entries like `'sora-latin-400-normal.woff2'` and `'jetbrains-mono-latin-400-normal.woff2'`. If empty, the @fontsource v5 file-naming convention has changed — stop and ask the user before continuing.

- [ ] **Step 1.4: Commit (optional — skip if user opts out)**

```
git add package.json package-lock.json
git commit -m "build: install @fontsource/sora, @fontsource/jetbrains-mono, terser as devDependencies"
```

If git identity fails: stop and ask. Do NOT run `git config`.

---

## Task 2: Create the `scripts/copy-fonts.js` Node.js script

**Files:**
- Create: `scripts/copy-fonts.js`.

- [ ] **Step 2.1: Verify the `scripts/` directory does not yet exist**

Run:

```
node -e "console.log(require('fs').existsSync('scripts'))"
```

Expected: `false` (we create it in the next step). If `true`, that's fine — the script will just be added inside it.

- [ ] **Step 2.2: Create `scripts/copy-fonts.js` with this exact content**

Create the file `scripts/copy-fonts.js` with:

```js
#!/usr/bin/env node
/**
 * Copies the specific Sora + JetBrains Mono WOFF2 files we use from the
 * @fontsource packages into app/template/assets/fonts/ so the panel runs
 * without depending on fonts.googleapis.com at runtime.
 *
 * Wired as a postinstall hook in package.json — runs automatically after
 * `npm install`. Also exposed as `npm run copy:fonts` for manual re-runs.
 *
 * Idempotent: re-running overwrites the destination files cleanly.
 * Safe on a fresh clone: if @fontsource packages aren't installed yet
 * (e.g. running before npm install completes), exits 0 with a warning.
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const DEST_DIR = path.join(__dirname, '..', 'app', 'template', 'assets', 'fonts');

const COPIES = [
    { src: '@fontsource/sora',           name: 'sora',           weights: [300, 400, 500, 600, 700] },
    { src: '@fontsource/jetbrains-mono', name: 'jetbrainsmono',  weights: [400, 500, 600] }
];

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyOne(family) {
    let pkgFilesDir;
    try {
        const pkgJson = require.resolve(family.src + '/package.json');
        pkgFilesDir = path.join(path.dirname(pkgJson), 'files');
    } catch (e) {
        console.warn(`[copy-fonts] ${family.src} not installed yet; skipping (run after npm install).`);
        return;
    }
    if (!fs.existsSync(pkgFilesDir)) {
        console.warn(`[copy-fonts] ${pkgFilesDir} does not exist; @fontsource layout changed?`);
        return;
    }

    ensureDir(DEST_DIR);

    family.weights.forEach((w) => {
        // @fontsource v5 file pattern: <family-key>-latin-<weight>-normal.woff2
        // where <family-key> is the npm package name minus the @fontsource/ prefix.
        const familyKey = family.src.replace('@fontsource/', '');
        const srcFile   = path.join(pkgFilesDir, `${familyKey}-latin-${w}-normal.woff2`);
        const destFile  = path.join(DEST_DIR,    `${family.name}-${w}.woff2`);

        if (!fs.existsSync(srcFile)) {
            console.warn(`[copy-fonts] missing source: ${srcFile}`);
            return;
        }
        fs.copyFileSync(srcFile, destFile);
        console.log(`[copy-fonts] ${family.name}-${w}.woff2   (${fs.statSync(destFile).size} bytes)`);
    });
}

console.log('[copy-fonts] copying WOFF2 files into', DEST_DIR);
COPIES.forEach(copyOne);
console.log('[copy-fonts] done.');
```

- [ ] **Step 2.3: Run the script once manually**

```
node scripts/copy-fonts.js
```

Expected output (filenames + byte sizes):
```
[copy-fonts] copying WOFF2 files into <…>\app\template\assets\fonts
[copy-fonts] sora-300.woff2   (… bytes)
[copy-fonts] sora-400.woff2   (… bytes)
[copy-fonts] sora-500.woff2   (… bytes)
[copy-fonts] sora-600.woff2   (… bytes)
[copy-fonts] sora-700.woff2   (… bytes)
[copy-fonts] jetbrainsmono-400.woff2   (… bytes)
[copy-fonts] jetbrainsmono-500.woff2   (… bytes)
[copy-fonts] jetbrainsmono-600.woff2   (… bytes)
[copy-fonts] done.
```

Each byte size should be in the 30 000 – 90 000 byte range. If any `[copy-fonts] missing source:` warning appears, stop and verify the @fontsource v5 file-naming convention is still `<family-key>-latin-<weight>-normal.woff2`.

- [ ] **Step 2.4: Verify the files are on disk**

```
node -e "console.log(require('fs').readdirSync('app/template/assets/fonts').filter(f=>f.startsWith('sora')||f.startsWith('jetbrainsmono')))"
```

Expected: `[ 'sora-300.woff2', 'sora-400.woff2', 'sora-500.woff2', 'sora-600.woff2', 'sora-700.woff2', 'jetbrainsmono-400.woff2', 'jetbrainsmono-500.woff2', 'jetbrainsmono-600.woff2' ]` (8 files).

- [ ] **Step 2.5: Commit (optional — skip if user opts out)**

```
git add scripts/copy-fonts.js "app/template/assets/fonts/sora-*.woff2" "app/template/assets/fonts/jetbrainsmono-*.woff2"
git commit -m "build: add copy-fonts script and bundle Sora + JetBrains Mono WOFF2 locally"
```

---

## Task 3: Append Sora + JetBrains Mono `@font-face` declarations to `_fonts.scss`

**Files:**
- Modify: `app/template/assets/scss/custom/_fonts.scss` — append 8 blocks at the end (after line 163).

- [ ] **Step 3.1: Read the current end of `_fonts.scss` to confirm the anchor**

Use Read on `app/template/assets/scss/custom/_fonts.scss` from line 155 to the end (~163). Confirm the file ends with the `roboto-900italic` `@font-face` block followed by a single blank line (or close-brace + EOF).

- [ ] **Step 3.2: Append the 8 new `@font-face` blocks to the end of the file**

Open `app/template/assets/scss/custom/_fonts.scss` and append the following EXACTLY to the end of the file (after the last `}` of the Roboto-900italic block; preserve a single blank line before the new content):

```scss

/* ============================================================================
 * Sora + JetBrains Mono — bundled locally so the panel does not depend on
 * fonts.googleapis.com at runtime. Files copied from @fontsource/sora and
 * @fontsource/jetbrains-mono by scripts/copy-fonts.js into the same
 * app/template/assets/fonts/ directory as the Roboto WOFF/WOFF2 files above.
 *
 * $font-path = "./../fonts/" (declared in _variables-custom.scss line 39).
 * font-display: swap → system font shows during the brief WOFF2 decode
 * (~10-50 ms) so users never see a flash of invisible text.
 * ========================================================================= */

/* sora-300 */
@font-face {
  font-family: 'Sora';
  font-style: normal;
  font-weight: 300;
  font-display: swap;
  src: url('#{$font-path}sora-300.woff2') format('woff2');
}
/* sora-400 */
@font-face {
  font-family: 'Sora';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('#{$font-path}sora-400.woff2') format('woff2');
}
/* sora-500 */
@font-face {
  font-family: 'Sora';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url('#{$font-path}sora-500.woff2') format('woff2');
}
/* sora-600 */
@font-face {
  font-family: 'Sora';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url('#{$font-path}sora-600.woff2') format('woff2');
}
/* sora-700 */
@font-face {
  font-family: 'Sora';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('#{$font-path}sora-700.woff2') format('woff2');
}
/* jetbrains-mono-400 */
@font-face {
  font-family: 'JetBrains Mono';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('#{$font-path}jetbrainsmono-400.woff2') format('woff2');
}
/* jetbrains-mono-500 */
@font-face {
  font-family: 'JetBrains Mono';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url('#{$font-path}jetbrainsmono-500.woff2') format('woff2');
}
/* jetbrains-mono-600 */
@font-face {
  font-family: 'JetBrains Mono';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url('#{$font-path}jetbrainsmono-600.woff2') format('woff2');
}
```

- [ ] **Step 3.3: Commit (optional — skip if user opts out)**

```
git add app/template/assets/scss/custom/_fonts.scss
git commit -m "build(scss): declare local @font-face for Sora + JetBrains Mono"
```

---

## Task 4: Remove the Google Fonts `<link>` from all 10 HTML files

**Files:**
- Modify: `app/project/components/pages/home/home.html`
- Modify: `app/project/components/pages/page1/page1.html`
- Modify: `app/project/components/pages/page2/page2.html`
- Modify: `app/project/components/pages/page3/page3.html`
- Modify: `app/project/components/pages/page4/page4.html`
- Modify: `app/project/components/pages/page5/page5.html`
- Modify: `app/project/components/pages/page6/page6.html`
- Modify: `app/project/components/pages/page7/page7.html`
- Modify: `app/project/components/pages/page8/page8.html`
- Modify: `app/project/components/pages/page9/page9.html`

In each of the 10 files there is exactly ONE line (around line 26–27 of each file) that fetches Sora + JetBrains Mono from the Google Fonts CDN. We delete it. After the change there should be zero references to `fonts.googleapis.com` anywhere in `app/`.

- [ ] **Step 4.1: Verify the current state — exactly 10 occurrences**

Run via Grep with `pattern: "fonts\\.googleapis\\.com"`, `path: app/project/components/pages`, `output_mode: count`, `glob: "*.html"`. Expected: 10 files each with 1 hit (total 10). If a different count, stop and investigate before continuing.

- [ ] **Step 4.2: Remove the line from `home.html`**

Use Edit on `app/project/components/pages/home/home.html`:

old_string:
```
  <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">

```
new_string:
```

```

(That is, the `<link>` line plus the trailing newline becomes a single empty line. We collapse to one blank line to preserve the file's spacing pattern.)

- [ ] **Step 4.3: Remove the line from `page1.html` through `page9.html`**

Apply the identical Edit (same `old_string` / `new_string`) to each of:
- `app/project/components/pages/page1/page1.html`
- `app/project/components/pages/page2/page2.html`
- `app/project/components/pages/page3/page3.html`
- `app/project/components/pages/page4/page4.html`
- `app/project/components/pages/page5/page5.html`
- `app/project/components/pages/page6/page6.html`
- `app/project/components/pages/page7/page7.html`
- `app/project/components/pages/page8/page8.html`
- `app/project/components/pages/page9/page9.html`

The `<link>` line and its `rel="stylesheet"` ending are byte-identical across all 10 files — the Edit `old_string` will match.

- [ ] **Step 4.4: Verify zero occurrences remain**

Run via Grep with `pattern: "fonts\\.googleapis\\.com"`, `path: app`, `output_mode: count`. Expected: zero files match. If any remain, identify and fix them.

- [ ] **Step 4.5: Commit (optional — skip if user opts out)**

```
git add app/project/components/pages/home/home.html "app/project/components/pages/page*/page*.html"
git commit -m "build(html): drop Google Fonts CDN link from home + page1-9 (Sora/JetBrains Mono now local)"
```

---

## Task 5: Browser-verify the local fonts work on dev server

**Files:**
- None modified. Verification-only task.

- [ ] **Step 5.1: Start the dev server (or hard-reload if already running)**

Run in a terminal:

```
npm run start
```

Expected: build completes without SCSS errors; `[BrowserSync] Access URLs:` line appears; URL is `http://localhost:3000`.

If the build fails with `Undefined variable: $font-path` or similar, the `_fonts.scss` change in Task 3 was wrong. The variable IS defined in `_variables-custom.scss` and IS imported via the existing main.scss chain, so this should not happen — but if it does, stop and inspect.

- [ ] **Step 5.2: Open the browser at http://localhost:3000 and force-reload**

Open `http://localhost:3000` in Chrome / Edge. Press Ctrl+Shift+R to bypass cache.

- [ ] **Step 5.3: DevTools Network tab — confirm no Google Fonts requests**

Open DevTools (F12) → Network tab → Reload the page. Filter the request list by typing `fonts` in the filter box. Expected:

- **Zero** rows containing `fonts.googleapis.com` or `fonts.gstatic.com`. (Previously there would have been at least 2-3.)
- Several rows containing `sora-` or `jetbrainsmono-` — these are loaded from `http://localhost:3000/app/template/assets/fonts/sora-400.woff2` etc. Each should return HTTP 200 with content-type `font/woff2`.

If `sora-*.woff2` returns 404, the WOFF2 files didn't get into `dist/dev/Shell/app/template/assets/fonts/`. Check that webpack's `Copy` rule picks up the new files (it should — it copies the entire `app/template/assets/` tree). If 404 persists, manually verify the copy by running `ls dist/dev/Shell/app/template/assets/fonts/ | grep sora`.

If Sora `<link>` is missing entirely from the network log but you don't see anything broken visually, it might mean the page already had Sora cached. Hard-reload again with Ctrl+Shift+Delete clearing site data first.

- [ ] **Step 5.4: Visual font check on the home page**

Navigate to the home page at `http://localhost:3000`. The "Master Bedroom / Living Room / …" room cards and the greeting / weather card / mode buttons should render in **Sora** (clean geometric sans-serif, slightly rounded), NOT in the iOS / Windows default system font.

Compare to the previous look — should be visually identical to before this change.

- [ ] **Step 5.5: Visual font check on a room page**

Navigate to **MB** (page1) via the footer nav. Each tab label (Lights / Shades / TV / Music), the room name in the topbar, and the area-card titles in the Lights widget should all be in Sora.

If anything renders in Times New Roman / system default, an `@font-face` declaration is missing or the URL is wrong — re-check Task 3 against the file on disk.

- [ ] **Step 5.6: DevTools console — no SCSS / 404 errors**

DevTools → Console tab. Expected: zero red errors mentioning `font`, `woff2`, `404`, `decoding`, or `cors`. Warnings from CrComLib that pre-existed before this change are fine.

- [ ] **Step 5.7: Commit (optional — skip if user opts out)**

Nothing to commit in this verification-only task.

---

## Task 6: Create the `scripts/minify-bundles.js` Node.js script

**Files:**
- Create: `scripts/minify-bundles.js`.

- [ ] **Step 6.1: Create the script with this exact content**

Create the file `scripts/minify-bundles.js` with:

```js
#!/usr/bin/env node
/**
 * Runs Terser in-place on the production bundles produced by webpack +
 * WebpackConcatPlugin: dist/prod/Shell/libraries/component.<hash>.js and
 * dist/prod/Shell/libraries/cr-com-lib.<hash>.js
 *
 * WebpackConcatPlugin bypasses webpack's optimization pipeline, so even
 * with mode:'production' these files ship un-minified. We minify after
 * webpack finishes by reading each file, running Terser, and overwriting
 * the same path. This keeps the hashed filenames that index.html already
 * references via HtmlWebpackPlugin.
 *
 * Exits non-zero on any Terser error so build:prod fails fast.
 *
 * Crestron-specific Terser options:
 *   - mangle.properties: false   CrComLib reads runtime strings/keys
 *                                ('pulse', 'subBool', 'JOINS.SHADES.…')
 *                                that would break if mangled.
 *   - drop_console: false        Keep console.log/.warn — Crestron
 *                                tooling and debugging rely on them.
 *   - sourceMap: false           Smaller output; no in-panel debugging.
 */
'use strict';

const fs     = require('fs');
const path   = require('path');
const Terser = require('terser');

const LIB_DIR  = path.join(__dirname, '..', 'dist', 'prod', 'Shell', 'libraries');
const TARGETS  = ['component', 'cr-com-lib'];

const TERSER_OPTS = {
    compress: {
        passes: 2,
        drop_console: false,
        drop_debugger: true
    },
    mangle: {
        properties: false
    },
    format: {
        comments: false
    },
    sourceMap: false
};

function findFile(prefix) {
    if (!fs.existsSync(LIB_DIR)) {
        throw new Error(`[minify-bundles] ${LIB_DIR} does not exist — did webpack run?`);
    }
    const matches = fs.readdirSync(LIB_DIR).filter(f =>
        f.startsWith(prefix + '.') && f.endsWith('.js')
    );
    if (matches.length === 0) throw new Error(`[minify-bundles] no ${prefix}.*.js found in ${LIB_DIR}`);
    if (matches.length > 1)  throw new Error(`[minify-bundles] multiple ${prefix}.*.js files: ${matches.join(', ')}`);
    return path.join(LIB_DIR, matches[0]);
}

async function minifyOne(prefix) {
    const file   = findFile(prefix);
    const source = fs.readFileSync(file, 'utf8');
    const before = source.length;

    const result = await Terser.minify(source, TERSER_OPTS);
    if (result.error) throw result.error;
    if (!result.code) throw new Error(`[minify-bundles] Terser returned no code for ${file}`);

    fs.writeFileSync(file, result.code, 'utf8');
    const after = result.code.length;
    const pct   = (100 * (1 - after / before)).toFixed(1);
    console.log(`[minify-bundles] ${path.basename(file).padEnd(36)}  ${before.toLocaleString()}  →  ${after.toLocaleString()} bytes  (${pct}% smaller)`);
}

(async function main() {
    console.log('[minify-bundles] minifying production bundles in', LIB_DIR);
    for (const prefix of TARGETS) {
        await minifyOne(prefix);
    }
    console.log('[minify-bundles] done.');
})().catch((err) => {
    console.error('[minify-bundles] FAILED:', err.message || err);
    process.exit(1);
});
```

- [ ] **Step 6.2: Commit (optional — skip if user opts out)**

```
git add scripts/minify-bundles.js
git commit -m "build: add Terser post-step that minifies the concatenated prod bundles in place"
```

---

## Task 7: Wire the new scripts into `package.json`

**Files:**
- Modify: `package.json` — the `"scripts"` block (around lines 6–43 in the current file).

- [ ] **Step 7.1: Read the current `scripts` block to anchor**

Read `package.json` lines 1–60. The current `"scripts"` block runs from line 6 to roughly line 43. Confirm `"build:prod"` is on line 13 and reads:

```json
"build:prod": "npx ch5-shell-cli val:pc && npm run clean:prod && webpack --config webpack.prod.js && npm run cleanjs:prod",
```

If the line has drifted, stop and re-anchor.

- [ ] **Step 7.2: Replace the `build:prod` line and add three new entries**

Use Edit on `package.json`.

old_string:
```
    "build:prod": "npx ch5-shell-cli val:pc && npm run clean:prod && webpack --config webpack.prod.js && npm run cleanjs:prod",
```

new_string:
```
    "build:prod": "npx ch5-shell-cli val:pc && npm run clean:prod && webpack --config webpack.prod.js && npm run cleanjs:prod && npm run minify:bundles",
    "copy:fonts": "node scripts/copy-fonts.js",
    "minify:bundles": "node scripts/minify-bundles.js",
    "postinstall": "node scripts/copy-fonts.js",
```

The four lines together replace the original one line — the three new entries are placed immediately after the (now-modified) `build:prod` line. `build:prod` now chains `npm run minify:bundles` as its final step.

- [ ] **Step 7.3: Verify the edit**

Run:

```
node -e "const p=require('./package.json');console.log('build:prod =',p.scripts['build:prod']);console.log('copy:fonts =',p.scripts['copy:fonts']);console.log('minify:bundles =',p.scripts['minify:bundles']);console.log('postinstall =',p.scripts['postinstall']);"
```

Expected: 4 lines, each printing the value of the corresponding script. None should be `undefined`. `build:prod` should END with `&& npm run minify:bundles`.

- [ ] **Step 7.4: Commit (optional — skip if user opts out)**

```
git add package.json
git commit -m "build: wire copy:fonts (postinstall) and minify:bundles (after build:prod)"
```

---

## Task 8: Run `npm run build:prod` and verify the size reduction

**Files:**
- None modified. Verification + measurement task.

- [ ] **Step 8.1: Capture the BEFORE size (for reference only — these are the pre-change numbers from the spec)**

For reference:
- `cr-com-lib.<hash>.js`: 1,904,421 bytes (~1.9 MB)
- `component.<hash>.js`: 340,948 bytes (~341 KB)
- Total: ~2.25 MB

This is what we're measuring against after the change.

- [ ] **Step 8.2: Run the production build**

```
npm run build:prod
```

Expected: completes without errors. The last few lines of output should show the minify-bundles script output, ending with something like:
```
[minify-bundles] component.<hash>.js                340,948  →  ~170,000 bytes  (~50% smaller)
[minify-bundles] cr-com-lib.<hash>.js             1,904,421  →  ~900,000 bytes  (~52% smaller)
[minify-bundles] done.
```

Exact numbers will vary but **both files should be under 60 % of their original size**. If the reduction is much smaller (e.g. < 20 %), Terser likely failed silently — check stderr for `WARNING` lines.

If the build fails with `Cannot find module 'terser'`, the install in Task 1 didn't take. Re-run `npm install`.

If the build fails with `[minify-bundles] no component.*.js found`, the webpack step before it didn't run. Stop and inspect.

- [ ] **Step 8.3: Verify the minified files are smaller AND still parseable**

Run:

```
node -e "const fs=require('fs');const dir='dist/prod/Shell/libraries';for(const f of fs.readdirSync(dir)){const sz=fs.statSync(dir+'/'+f).size;console.log(f,sz.toLocaleString(),'bytes');}"
```

Expected: prints the bundle filenames with sizes. Both should be substantially smaller than the BEFORE numbers in Step 8.1.

Then verify the JS files are still syntactically valid (Terser doesn't break the file):

```
node -e "for(const f of require('fs').readdirSync('dist/prod/Shell/libraries')){if(f.endsWith('.js')){try{new Function(require('fs').readFileSync('dist/prod/Shell/libraries/'+f,'utf8'));console.log(f,'OK')}catch(e){console.error(f,'PARSE ERROR:',e.message)}}}"
```

Expected: `component.<hash>.js OK` and `cr-com-lib.<hash>.js OK`. If either prints `PARSE ERROR`, Terser broke the file — stop, do not proceed to deployment.

- [ ] **Step 8.4: Smoke-test the prod build in a browser**

Webpack's prod output isn't served by BrowserSync by default. To open it in a browser, either:

- Use VS Code's "Live Server" extension on `dist/prod/Shell/index.html`, OR
- Run a tiny static server: `npx http-server dist/prod/Shell -p 4000` and open `http://localhost:4000`.

Either way, the page should load without errors and look identical to the dev version. Open DevTools → Console — expected: no new red errors that weren't there in dev.

Click through 2–3 pages (home → MB → Living Room → home) and confirm the UI is interactive (tabs switch, buttons respond). This catches any case where Terser's mangling broke a callback or string-keyed lookup.

- [ ] **Step 8.5: Commit (optional — skip if user opts out)**

Nothing source-controlled changed in this task (only built artifacts, which `.gitignore` excludes). Nothing to commit.

---

## Task 9: Build the `.ch5z` archive, deploy to the RMC4, time the connect

**Files:**
- None modified. End-to-end verification on real hardware.

This task confirms the user-visible payoff — the Crestron One cold-connect is shorter than the previous ~15 s baseline.

- [ ] **Step 9.1: Build the archive**

```
npm run build:archive
```

Expected: completes, produces `dist/prod/project-one.ch5z`. The archive should be noticeably smaller than the previous baseline (it now contains the minified bundles + locally-embedded WOFF2 files instead of un-minified bundles + Google CDN `<link>` tags).

Run to verify the archive exists and check its size:

```
node -e "const s=require('fs').statSync('dist/prod/project-one.ch5z');console.log('project-one.ch5z',s.size.toLocaleString(),'bytes')"
```

Expected: smaller size than whatever the previous `.ch5z` was. (No exact target — depends on a lot of factors — but should be at least 30 % smaller.)

- [ ] **Step 9.2: Deploy to the RMC4**

Use whichever deploy command the user normally uses. Default is:

```
npm run build:deploywithpassword
```

This prompts for the controller password (see `webxpanel.js` for the configured credentials). Or, if you've already configured passwordless deploy:

```
npm run build:deploy
```

Expected: the ch5-cli deploys to `192.168.1.235` (per package.json line 14) and prints success.

If the user's RMC4 is at a different IP, **stop and ask** — do not change the hardcoded deploy IP without explicit instruction.

- [ ] **Step 9.3: Cold-connect timing on Crestron One**

On the user's iPhone, with the device on the same Wi-Fi as the RMC4:

1. **Force-quit** the Crestron One app (swipe up to close it in the iOS app switcher).
2. Re-open Crestron One.
3. Tap "Jung" in the system list.
4. **Time the "Connecting to Jung" spinner** with a stopwatch — start when the spinner appears, stop when the home page becomes interactive (you can tap a control bar tab).

Expected: noticeably faster than the previous ~15 s baseline. Target range from the spec: 8–12 s. Anywhere in 7–13 s is success.

If the time is still ~15 s, the user should:
- Confirm they force-quit the app (otherwise iOS may have cached the old bundle).
- Confirm the deploy actually completed (re-check via Crestron Toolbox).
- Confirm they're on Wi-Fi LAN, not falling back to cellular.

- [ ] **Step 9.4: Functional smoke-test on Crestron One**

Walk through each tab on the home page and one or two rooms to confirm nothing regressed from the bundle change:

1. Home → tap a House Mode (e.g. Morning) → popup opens → tap **outside the dialog** → popup closes (verifies the recent outside-click fix is intact in prod).
2. Home → tap Sensors → popup opens → tap a Sensors On / Sensors Off button → popup closes, pulse fires.
3. Navigate to MB (page1) via footer nav.
4. Open the **Shades** tab → tap Open on the Bedroom shade → status flips to `Opening…`, % climbs (verifies the recent timed-motion change is intact in prod).
5. Tap Stop → status reads `Stopped at NN%`.
6. Open the **Lights** tab → tap one All-On / All-Off button on any area row → pulse fires (LED status or feedback if visible).

Expected: all behaviors identical to dev. No console errors in Crestron One (if you have a way to inspect — Safari → Develop → device WebView, only on a Mac).

If any control silently fails to pulse, Terser most likely mangled a string-keyed property despite `mangle.properties: false`. Revert by rebuilding without `npm run minify:bundles` (run `webpack --config webpack.prod.js && npm run cleanjs:prod && npm run build:archive` manually), re-deploy, confirm the regression goes away, and stop to report.

- [ ] **Step 9.5: Report final connect time to the user**

Tell the user the timed result (e.g. "was 15 s, now 9 s — 6 s shaved"). Note in the report whether the time matched the spec's 8–12 s target.

- [ ] **Step 9.6: Commit (optional — skip if user opts out)**

Nothing source-controlled changed in this task. Nothing to commit.

---

## Done criteria

- `node_modules/@fontsource/sora/` and `node_modules/@fontsource/jetbrains-mono/` and `node_modules/terser/` exist (installed in Task 1).
- 8 WOFF2 files exist in `app/template/assets/fonts/`: `sora-300.woff2`, `sora-400.woff2`, `sora-500.woff2`, `sora-600.woff2`, `sora-700.woff2`, `jetbrainsmono-400.woff2`, `jetbrainsmono-500.woff2`, `jetbrainsmono-600.woff2`.
- `app/template/assets/scss/custom/_fonts.scss` has 8 new `@font-face` blocks at the end.
- All 10 HTML files (`home.html` + `page1.html`..`page9.html`) have ZERO references to `fonts.googleapis.com`. (`grep` confirms.)
- `package.json` has the 3 new devDependencies, 3 new scripts (`copy:fonts`, `minify:bundles`, `postinstall`), and the updated `build:prod`.
- `scripts/copy-fonts.js` and `scripts/minify-bundles.js` exist and run cleanly.
- `npm run start` builds and serves; dev panel uses local fonts (verified via Network tab — zero `fonts.googleapis.com` requests).
- `npm run build:prod` produces minified `cr-com-lib.<hash>.js` and `component.<hash>.js` that are at least 40 % smaller than the pre-change baseline.
- `npm run build:archive` produces a `.ch5z`; deployed to RMC4; the user's Crestron One cold-connect is in the 7–13 s range (down from ~15 s).
- All UI behaviors (theme dropdown, House Modes popup, Sensors popup, shutdown popup, room navigation, shade timed-motion, lights, AC dial, music, TV controls) work identically to before in both dev and the deployed `.ch5z`.
