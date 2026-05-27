# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project type

Crestron CH5 (HTML5) **shell-template** project — a vanilla-JS touchpanel UI built on `@crestron/ch5-crcomlib`, `@crestron/ch5-theme`, and `@crestron/ch5-webxpanel`. Targets Crestron TSW panels (packaged as `.ch5z`) and runs in a browser via WebXPanel against a real control system. There is no TypeScript, no test runner, and no linter configured.

**Project name (in `project-config.json`):** `aya-hesham-sadek`

## Commands

All workflow runs through npm scripts (which delegate to `ch5-shell-cli` / `ch5-cli` and webpack). There is no test or lint script.

### Dev / build

```sh
npm run start                    # validate project-config, clean dist/dev, run webpack.dev.js (watch + BrowserSync on http://localhost:3000)
npm run build:prod               # production build into dist/prod
npm run build:archive            # build:prod + package into dist/prod/project-one.ch5z (uses config/contract.cse2j)
npm run build:deploy             # deploy the .ch5z to the TSW host (no password prompt)
npm run build:deploywithpassword # deploy with an interactive password prompt
npm run build:onestep            # archive + deploy in one step
npm run build:onestepwithpassword# archive + deploy with password prompt
```

### Validation & scaffolding

```sh
npm run val:pc           # validate app/project-config.json
npm run gen:p            # scaffold a new page via ch5-shell-cli  (alias: generate:page)
npm run gen:w            # scaffold a new widget                  (alias: generate:widget)
npm run update:project   # pull upstream shell-template updates into the project
npm run copy:fonts       # copy Sora + JetBrains Mono WOFF2 from @fontsource/* into app/template/assets/fonts/
                         # (runs automatically as `postinstall`, so a fresh `npm install` self-populates)
```

### Clean

```sh
npm run clean            # delete entire dist/ folder
npm run clean:start      # delete dist/dev/ only
npm run clean:prod       # delete dist/prod/ only
```

### Export / import (component library management)

```sh
npm run export:all        # exp:a shorthand — export assets + components + library
npm run export:assets     # exp:a  — export static assets
npm run export:components # exp:c  — export custom components
npm run export:library    # exp:l  — export shared library files
npm run export:project    # exp:p  — export full project bundle
npm run import:all        # import assets + components + library
npm run import:assets     # imp:a  — import static assets
npm run import:components # imp:c  — import custom components
npm run import:library    # imp:l  — import shared library files
npm run delete:components # del:c  — delete generated component scaffolding
```

The deploy host is **hardcoded** in `package.json` (`build:deploy` / `build:deploywithpassword`) — currently `ayman-zidan.mycrestron.com`. Change it there, not as a CLI flag.

`npm run start` exits the dev server when `app/project-config.json` changes (BrowserSync `match` handler in [webpack.dev.js](webpack.dev.js)) — restart it manually after editing that file.

## High-level architecture

### Two-tree source layout: `template` vs `project`

[app/template/](app/template/) is the stock Crestron shell (header/footer/loader/theme widgets, SCSS framework, libraries like `navigation.js`, `project-config.js`, `webxpanel.js`). [app/project/](app/project/) is where this app's content lives (the room-control pages). [webpack.common.js](webpack.common.js) builds `templateList` and `projectList` copy rules in parallel — keep new app code under `app/project/` so it stays cleanly separated from upstream shell code.

[app.config.js](app.config.js) globs both trees for JS/SCSS and exposes the lists; [webpack.dev.js](webpack.dev.js) and [webpack.prod.js](webpack.prod.js) concat them into `dist/<env>/Shell/libraries/component.js` and `cr-com-lib.[hash].js`. The shell HTML entry is [app/index.html](app/index.html), processed by `HtmlWebpackPlugin` with `inject: false`.

### Page registration is config-driven, not file-discovery

[app/project-config.json](app/project-config.json) is the source of truth: `content.pages[]` lists every page (name, full path, html filename, navigation label/icon, preload/cache flags) and `content.$defaultView` picks the start page. Adding a page on disk does nothing until you register it here. After editing this file, restart `npm run start` (the dev server self-exits on changes to it). Validate with `npm run val:pc`.

### Per-page convention (critical — read before editing any page)

Each page lives in `app/project/components/pages/page<N>/` and contains:

- `joins<N>.js` — declares `window.J<N>` with all Crestron join numbers grouped by section (e.g. `J1.TV.POWER`, `J1.AC.SP_SEND`)
- `page<N>.js` — the page logic IIFE (`page<N>Module`); reads `window.J<N>` and uses helpers like `pulse(J1.TV.POWER)`
- `page<N>.html` — markup; `<script>` tags **must** load `joins<N>.js` BEFORE `page<N>.js`
- `page<N>.scss`
- `page<N>-emulator.json` — CH5 emulator cues for browser testing

Hard rules enforced by the code style in [page1.js](app/project/components/pages/page1/page1.js) and [joins1.js](app/project/components/pages/page1/joins1.js):

1. **Never write a raw join number** in page logic — always go through `J<N>.SECTION.KEY`. Reassigning a join means editing `joins<N>.js` only. Page HTML attributes (`data-join-open`, `data-join-on`, …) are auto-filled from the join map at init by `applyJoinsToHtml()`.
2. **Joins are namespaced per page** to avoid collisions with the SIMPL program. Each page's base starts 400 above the previous: page1 = 100, page2 = 500, page3 = 900, page4 = 1300, page5 = 1700, page6 = 2100, page7 = 2500, page8 = 2900, page9 = 3300. Receiver / music joins that are shared across pages keep the same numbers everywhere (see APPS and MUSIC sections in any joins file).
3. **DOM IDs are namespaced** with `PAGE_SUFFIX` (e.g. `'-page1'`). Use the file's `_gid('foo')` / `_qs('.foo')` / `_qsa('.foo')` helpers — they look up `id="foo-page1"` and scope queries to `PAGE_ROOT` (`#page1-page`). `PAGE_ROOT` is resolved **lazily** because on a real CH5 panel, page scripts can run before the page section is injected into the DOM — capturing it once at IIFE init would silently fall back to `document` and bleed event handlers across pages.
4. **Copying a page to a new one** is a mechanical find-and-replace (`page1`→`page<N>`, `J1`→`J<N>`, `joins1.js`→`joins<N>.js`, `id="page1-page"`→`id="page<N>-page"`, `PAGE_SUFFIX = '-page1'`→`-page<N>'`). Each spot to edit is flagged with a `▸▸▸ EDIT-FOR-PAGE-N` comment in the source.

### WebXPanel connection

`useWebXPanel: true` in `project-config.json` enables browser-mode connection to the control system. The WebXPanel connection is initialized once by the shell template (`app/template/libraries/webxpanel.js`) — room pages must **not** call `WebXPanel.default.initialize()` themselves. CrComLib shares one connection across all pages.

### SCSS

Page SCSS files are webpack entries (one per page, found via glob in [webpack.common.js](webpack.common.js) `getEntry()`). Theme overrides for the whole shell live in [app/template/assets/scss/custom/](app/template/assets/scss/custom/) (`_theme-additions.scss`, `_layout.scss`, `_components.scss`); the bootstrap-derived framework is in `app/template/assets/scss/library/` and should generally be left alone.

### Build outputs

- `dist/dev/Shell/` — dev server root (BrowserSync serves from here)
- `dist/prod/Shell/` — production build
- `dist/prod/project-one.ch5z` — packaged archive for TSW deploy (uses `config/contract.cse2j`)

`appName = 'Shell'` is set in [app.config.js](app.config.js) and is referenced by the `cleanjs:*` and `build:archive` scripts in package.json — the comment block at the top of `app.config.js` lists the npm scripts that must be updated together if `appName` or `distPath` ever change.

---

## What has been built (edits made in this project)

### Theme

The hub topbar has a **theme dropdown** (`.theme-dd` in [home.html](app/project/components/pages/home/home.html)) that exposes three palettes (blue / dark / light) applied as `data-theme` on `<html>`. By default the active theme follows the OS / phone `prefers-color-scheme` (see "OS theme detection" below); dropdown picks override in-session but are not persisted. All semantic CSS tokens (`--bg`, `--card`, `--accent`, `--text`, etc.) resolve from the `--t-*` raw tokens in [_theme-additions.scss](app/template/assets/scss/custom/_theme-additions.scss), so adding a new palette is one block of `--t-*` declarations — no rule in `page1.scss` or `home.scss` needs to change.

**Palettes (single source of truth: `_theme-additions.scss`):**

| Theme   | Background       | Cards     | Text                | Accent (single)        | Accent-2 (gradient end) |
|---------|------------------|-----------|---------------------|------------------------|-------------------------|
| `blue`  | `#0a0e1a`        | dark-blue | `#e4e9f7`           | `#2dd4bf` (teal)       | `#a78bfa` (purple)      |
| `dark`  | `#0a0c10` (cool) | cool dark-grey | `#ebeef5`      | **`#2563eb` (blue)**   | `#3b82f6` (lighter blue) |
| `light` | `#f4f6f9` (white)| `#ffffff` | `#18181b` (near-blk)| **`#2563eb` (blue)**   | `#3b82f6` (lighter blue) |

The accent and accent-2 inside a single palette are intentionally the **same hue family** (dark & light both blue→blue; blue keeps teal→purple) so the `linear-gradient(135deg, var(--accent2), var(--accent))` used everywhere stays single-toned and never produces a clashing two-colour gradient. The dark theme was originally "amber on warm-black" but is now "blue on cool-black" — same accent hue as the light theme, just inverted surfaces.

**Preview swatches.** The three round swatches in the theme dropdown (`.hub-theme-swatch--blue` / `--dark` / `--light` in `home.scss`) are hardcoded mini-gradients designed to *preview* the active accent. Keep them in sync with `_theme-additions.scss` — when an accent changes, both files need to update. Since the dark theme's accent was switched from amber to blue, the `--dark` swatch now uses the same blue gradient as `--light` over a black centre disc.

**OS theme detection.** [home.js → `initTheme()`](app/project/components/pages/home/home.js) reads `window.matchMedia('(prefers-color-scheme: dark)')` and applies `dark` or `light` accordingly. A `change` listener (guarded by `window.__themeOSFollowBound` so it can't stack on page re-injects) re-applies the theme every time the OS flips — **unconditionally**, even after a dropdown pick. The dropdown still works for the current session (and lets the user reach `blue`, which has no OS equivalent), but the next OS change overrides it. `storedTheme()` deliberately ignores `localStorage` so behaviour is identical on every fresh load. If `matchMedia` is unavailable (very old WebViews), it falls back to `blue`. On iOS / Android the WebXPanel WebView inherits the system colour scheme, so the phone's dark-mode toggle drives this directly.

**Theme-adaptive widgets.** Buttons that previously had hardcoded colours (red shutdown, green Vol+, amber Mute, light-text on dark cards, etc.) were refactored to consume `var(--t-accent-rgb)` / `var(--text)` / `var(--on-accent)` so they re-skin with the theme. Specific examples:

- TV media-row hover (Vol+/Vol−/Mute/CH+/CH−) — was per-button hardcoded green/purple/red/amber, now one shared accent hover. Same for the receiver-remote (`appVolUp…` etc.) — see the comment block at the top of [page1.scss](app/project/components/pages/page1/page1.scss#L874).
- Hub shutdown buttons (`.hub-sd-btn`, `.hub-shutdown-allrow`, `.hub-master-btn`) — was hardcoded red/maroon, now accent-tinted.
- Music Mute (`.music-ctrl-btn.music-mute`) — gets a **light-theme override** to match Vol+/Vol− (accent), instead of the default amber.
- Topbar (`.topbar`) and greeting (`.greeting--modern`) — re-declare `--room-rgb`/`--room-rgb-2` to the theme accent so they look the *same* on every room page (the per-room `bg-mesh` aurora still tints uniquely). See the comment block at the end of [page1.scss](app/project/components/pages/page1/page1.scss).

**Light-theme readable text.** Buttons whose `color` was hardcoded for the dark UI (`.tv-power-btn`, `.dpad-btn`, `.keypad-btn`, `.media-btn`, `.music-ctrl-btn`, `.music-airplay-btn`, `.qbtn.app-launcher`, and the function keypad keys `tvKeyEnter`/`tvBack`/`tvHome`/`tvMenu`/`tvChList`/`tvExit` + their `app*` siblings) get an `[data-theme="light"]` override forcing `color: #18181b`. Lives in the appended TV/MUSIC REFINEMENTS block at the bottom of `page1.scss`.

**Unified press feedback.** `.dpad-btn:active`, `.media-btn:active`, `.tv-power-btn:active`, `.music-ctrl-btn:active`, `.music-airplay-btn:active` all flash the accent gradient on tap. Lives in the same appended block.

**Theme-cohesive popups & topbar (light / dark only).** A second appended block at the very bottom of [page1.scss](app/project/components/pages/page1/page1.scss) (scoped to `[data-theme="light"]` and `[data-theme="dark"]`, leaving the `blue` theme's original per-mode / per-room tints alone) re-skins the four places that previously had hardcoded amber/red/light-grey colours so they harmonize with the active theme accent:

- **House-Modes confirm popup** (`.hmc-*`) — the inline `--hmc-rgb` set by `home.js → hubMode()` per mode is overridden with `var(--t-accent-rgb) !important`, so the icon ring / glow / Activate button all use the theme accent regardless of which mode was tapped (Morning / Guest / Night / Away / Sensors).
- **Lights "individuals" channel popup** (`.area-panel` + `.ch-*`) — `.ch-name` colour, `.ch-dim-fill` track gradient, `.ch-dim-slider` thumb gradient, focus ring, and `.ch-dim-value` % colour all flip from hardcoded `#c8d4ec` / amber to the theme accent.
- **Shutdown-All confirm popup** (`.ash-*`) — the dialog border / shadow, the ⏻ icon ring, both yes-buttons, and the "No, Not Now" text colour all swap their hardcoded red for the theme accent.
- **Topbar room-tag + greeting icon** (`.room-tag` / `.greeting--modern .gr-icon`) — `--room-rgb` / `--room-rgb-2` are re-declared to the theme accent, so the house pill in the topbar and the colored badge in the greeting read uniformly across every room page (blue in both light and dark, since both themes now share the same blue accent).

Inline `style="…"` declarations beat plain selectors for custom-property declarations, which is why the `.hmc-*` override uses `!important` — the rest don't need it.

**Uniform d-pad arrows.** The raw `◀` / `▶` glyphs render at a different weight than `▲` / `▼` in Chromium. The d-pad uses a CSS-only trick: hide the inline glyph (`font-size: 0`), draw one `▲` via `::after` on each `.dpad-up/-down/-left/-right`, and rotate per direction. All four arrows look pixel-identical in TV controls and the OSN/BeIN/Freesat remotes on every page.

### Fonts & background

- Font: **Sora** (weights 300, 400, 500, 600, 700) + **JetBrains Mono** (weights 400, 500, 600). **Bundled locally** — the panel does NOT depend on `fonts.googleapis.com` at runtime. WOFF2 files live in [app/template/assets/fonts/](app/template/assets/fonts/) (`sora-300.woff2` … `sora-700.woff2`, `jetbrainsmono-400.woff2` … `jetbrainsmono-600.woff2`) alongside the original Roboto files. Loaded via `@font-face` declarations at the bottom of [_fonts.scss](app/template/assets/scss/custom/_fonts.scss), all with `font-display: swap` so the system font shows during the brief WOFF2 decode (no FOIT). `_fonts.scss` is auto-imported by `_main.scss`, so no other SCSS wiring is needed. **Do NOT add `<link href="https://fonts.googleapis.com/…">` to any page HTML** — the CDN fetch was a real boot-time cost on the controller's restricted LAN (timed-out requests added seconds per page) and was the reason this work was done.
- **Where the WOFF2 files come from.** Sourced from the `@fontsource/sora` and `@fontsource/jetbrains-mono` npm devDependencies. [scripts/copy-fonts.js](scripts/copy-fonts.js) copies the latin/normal weights we use from `node_modules/@fontsource/*/files/` into `app/template/assets/fonts/`. It runs automatically as `postinstall` after every `npm install`, and can be re-run manually with `npm run copy:fonts`. Idempotent — safe to re-run. Renames the source filenames (`sora-latin-400-normal.woff2`) to the short flat convention (`sora-400.woff2`) that the `@font-face` URLs use.
- Background: animated mesh gradient (`bg-mesh bg-mesh--room`) on every page, tinted per-room via `--room-rgb`/`--room-rgb-2` (declared on each `#page<N>-page` in the modernization layer of `page1.scss`).

### Home page (`home`) — new, `$defaultView`

**Files:** [app/project/components/pages/home/](app/project/components/pages/home/)
(`home.html`, `home.js`, `home.scss`, `joins-home.js`, `home-emulator.json`)

The home hub is the landing page. It shows:

1. **Hero greeting + live clock/date** — time-aware salutation updated every minute.
2. **Weather card** — driven by the **Open-Meteo API** (no key required) directly from JS, not Crestron joins. Default location is Cairo (`lat 30.04, lon 31.24`); change `WEATHER_LOCATION` at the top of the weather block in `home.js`. Refreshes every 15 minutes; on network failure the card stays at its last values. The `WEATHER` section in `joins-home.js` is intentionally **unused** (left in place for documentation only) — see `bindWeather()` in [home.js](app/project/components/pages/home/home.js). Requires the panel to have outbound internet access.
3. **House Modes** — 4 active whole-house scene buttons (Morning / Guest / Night / Away) + **Sensors** card (new). Each scene pulses `JHOME.HOUSE_MODES.*` via `hubMode(key, btnEl)` and shows a Cancel/Activate confirm dialog. The **Sensors** card opens its own 2-button popup (Sensors Off / Sensors On) via `hubSensors(btnEl)` that pulses `JHOME.SENSORS.ON` / `JHOME.SENSORS.OFF`. Feedback joins highlight the currently-active mode via `subBool` in `setupModeFeedback()`.
4. **House Functions** *(joins reserved, no buttons currently rendered in `home.html`)* — per-floor (First / Ground / Basement) ON/OFF for Lights, AC, Shades. Pulses `JHOME.HOUSE_FUNCTIONS.<FLOOR>_<SYS>_<ON|OFF>` via `hubFunc(floor, sys, act)` if you re-add the UI.
5. **Shutdown House** — per-floor rows (Lights / A/V / Shades) + a whole-house row + one master **Shutdown All Systems** button. Per-floor and whole-house buttons pulse `JHOME.SHUTDOWN.<KEY>` immediately via `hubShutdown(floor, sys)`. The **master button** now routes through the shared `shutdownAll(JHOME.SHUTDOWN.ALL_SYSTEMS)` 2-button confirm popup (No, Not Now / Yes, Shutdown) — the same `.ash-*` dialog the room topbars use, single-arg form which auto-hides the "with Shutter" button. It pulses `JHOME.SHUTDOWN.ALL_SYSTEMS` (`'3231'`) only after explicit confirmation; tapping the overlay or pressing Escape dismisses with no pulse.

> **Room grid removed.** Users navigate to room pages via the footer navigation bar (project-config.json), not from the home page.

`window.LIGHT_PRESETS` catalog is defined here (and mirrored in page1.html as a fallback) so it is available before any room page loads.

**Globals exposed by home.js:** `hubMode(key, btnEl)`, `hubFunc(floor, sys, act)`, `hubShutdown(floor, sys)`, `hubSensors(btnEl)`, `hubGoRoom(pageName)`, `shutdownAll(join [, shutterJoin])`.

#### Lazy join-map resolution (critical — fixes a bundle-order bug)

[webpack.common.js](webpack.common.js) concatenates **every** page's JS into a single `component.js` in **alphabetical filename order**. For room pages this lines up correctly (`joins1.js` < `page1.js`, j < p). But for the home it's the *opposite*: **`home.js` sorts before `joins-home.js`** (h < j), so `window.JHOME` is `undefined` when `home.js`'s IIFE first executes.

To work around this, `home.js` resolves the join map **lazily** at call time, not at init:

```js
// In home.js — DO NOT change to `const J = window.JHOME`.
const J = () => (typeof window !== 'undefined' ? window.JHOME : null);
```

Every consumer reads `J()` fresh inside the click handler (`hubMode`, `hubShutdown`, `hubFunc`, `hubSensors`, `setupModeFeedback`, weather subs, heartbeat, REQUEST_REFRESH, etc.). By the time a button is tapped, `joins-home.js` has long since run and `window.JHOME` exists.

**If you copy this pattern to a new "home-like" file:** make sure the joins file alphabetically *precedes* the logic file, OR use the same `J()` lazy getter. Capturing `J = window.JHOME` at IIFE init silently freezes it to `null` and every pulse no-ops without any error — the worst kind of bug.

#### Shutdown popup — 2-button vs 3-button variant

`window.shutdownAll(join, shutterJoin)` adapts its dialog at open time:

- **With** a `shutterJoin` (most pages): three buttons — *Yes, with Shutter* / *Yes, without Shutter* / *No, Not Now*.
- **Without** a `shutterJoin` (pages whose topbar calls `shutdownAll(J<N>.SYSTEM.SHUTDOWN)` — currently **page8 and page9**): the "Yes, with Shutter" button is hidden via `style.display='none'` and the remaining yes-button is relabelled to "Yes, Shutdown". Result: two buttons — *No, Not Now* / *Yes, Shutdown*.

To switch a page between variants, edit only the inline `onclick` of its `.shutdown-all` button in `page<N>.html` — no JS or CSS change needed.

### Room pages (pages 1–9)

All nine room pages share an identical **4-widget tab layout** (`💡 Lights`, `🪟 Shades`, `📺 TV`, `🎵 Music`) built from the same template. Page 10 has been removed.

| Page | Nav label | Room name |
|------|-----------|-----------|
| page1 | MB | Master Bedroom |
| page2 | Living Room | Living Room |
| page3 | Omar | Omar's Bedroom |
| page4 | Hassan | Hassan's Bedroom |
| page5 | Layla | Layla's Bedroom |
| page6 | Reception | Reception |
| page7 | Kitchen | Kitchen |
| page8 | Basement | Basement |
| page9 | All Outdoor | All Outdoor |

All pages have `cachePage: true`. **Only `home` has `preloadPage: true`** — `page1` was changed from `preloadPage: true` to `false` so the cold-boot "Connecting…" screen is shorter (page1's ~50–80 join subscriptions used to register at boot even though the app opens to `home`; now they register on the first tap of the "MB" nav button). Pages 2–9 were already `preloadPage: false`. Each page's `onInit()` (all its `subscribeState` calls) only runs when the CH5 import-snippet fires `{loaded:true}`, which the framework does per the `preloadPage` flag — so deferring a page defers its subscriptions. This is the only safe boot-time lever that needs no code change; the deeper "unsubscribe on navigate-away so reconnect re-registers only the visible page" refactor was considered and **not** done (it risks feedback-teardown regressions).

#### Topbar

Replaced the original fake phone status bar (hardcoded "9:41" clock + battery icons) with a real **topbar** containing:
- **Back to Home** button (`goHome_page<N>()` navigates to the home hub).
- **Room tag** (house SVG icon + room name).
- **Shutdown All** button — calls `shutdownAll(J<N>.SYSTEM.SHUTDOWN, J<N>.SYSTEM.SHUTDOWN_WITH_SHUTTER)` on most pages, or `shutdownAll(J<N>.SYSTEM.SHUTDOWN)` (single arg) on pages 8 and 9. No join is pulsed on the button click itself; instead a confirmation dialog (`.ash-overlay` + `.ash-dialog`, built once lazily in `home.js` and appended to `<body>`) is shown. The dialog adapts: with a shutter join it shows three buttons (*Yes, with Shutter* / *Yes, without Shutter* / *No, Not Now*); without a shutter join it shows two (*Yes, Shutdown* / *No, Not Now*). "Not Now" / Escape / overlay-click dismiss without firing.

Each page's shutdown join lives in `joins<N>.js → SYSTEM.SHUTDOWN`:

| Page | `SYSTEM.SHUTDOWN` join |
|------|------------------------|
| page1 | `102` |
| page2 | `502` |
| page3 | `902` |
| page4 | `1302` |
| page5 | `1702` |
| page6 | `2102` |
| page7 | `2502` |
| page8 | `2902` |
| page9 | `3302` |

#### Greeting strip

Replaced the old hardcoded "Hello, Aya Hisham" / fabricated device count with a simple room-focused greeting (`gr-room` + `gr-sub`).

**Per-room `.gr-icon` SVGs.** The big colored badge to the left of the greeting used to be a generic house glyph on every page. Each page now carries a room-appropriate inline SVG instead (24×24 viewBox, 1.8 stroke width, round joins, inheriting `stroke: currentColor` from the global `.svg-ico svg` rule so the theme-accent gradient on `.gr-icon` shows through). The small house icon inside the `.room-tag` pill is a separate SVG and is **unchanged** — it represents "room" generically and stays the same on every page.

| Page | Room | `.gr-icon` glyph |
|------|------|------------------|
| 1 | Master Bedroom | bed (top-down, two pillows) |
| 2 | Living Room | sofa (backrest + seat + legs) |
| 3 | Omar's Bedroom | bed |
| 4 | Hassan's Bedroom | bed |
| 5 | Layla's Bedroom | bed |
| 6 | Reception | sofa |
| 7 | Kitchen | stove (oven + 2 burners + handle) |
| 8 | Basement | sofa |
| 9 | All Outdoor | house (unchanged) |

#### Lights widget

- **Global presets bar**: Morning Mode / Relax Mode / Dressing Mode / Sleep Mode.
- **Lighting areas grid**: one row per area; each row has `All On`, `Dim`, `Relax`, `All Off` buttons (some areas have only `All On` / `All Off`).
- **Area detail popup** (`openAreaPanel_page<N>()`): a slide-in panel showing per-channel controls. Channels are defined in `joins<N>.js → LIGHTS_<AREA>.CHANNELS` and rendered by `renderPanelChannels()` in `page<N>.js`.
- Live `X on` count badge updated by `setAreaVisual()`.

**Channel rendering rules (implemented in page2 — apply the same pattern when porting to other pages):**

Each channel object in `CHANNELS[]` can have `ON`, `OFF`, `DIM_SEND`, `DIM_FB`. Rendering is conditional — only present joins get UI:

| Field | Rendered element | Condition |
|-------|-----------------|-----------|
| `ch.label` | `.ch-name` div (full-width text) | always |
| `ch.ON` / `ch.OFF` | `.ch-onoff` with ON + OFF buttons | only if `ch.ON \|\| ch.OFF` |
| `ch.DIM_SEND` | `.ch-dim-wrap` slider + value % | only if `ch.DIM_SEND` |

Examples from joins2.js:
```js
{ label: 'Side Frame 2 Spots', ON: '2641', OFF: '2642', DIM_SEND: '2000', DIM_FB: '2000' }
// → name + ON/OFF buttons + dimmer slider

{ label: 'Chandeliers', ON: '', OFF: '', DIM_SEND: '247', DIM_FB: '247' }
// → name + dimmer slider only (no ON/OFF buttons)
```

**Layout (page1.scss — applies globally):**
- `.ch-row-top`: `display: grid; grid-template-columns: 1fr auto` — name always fills remaining space, buttons never squish it.
- `.ch-name`: plain `<div>` (not an editable `<input>`), gets label text directly from `ch.label`.
- `.ch-onoff .ch-btn`: `flex: 1` — ON and OFF share equal width inside the button row.

**To port to page<N>.js:** In `renderPanelChannels()`, apply the same conditional rendering — wrap `.ch-onoff` with `(ch.ON || ch.OFF ? '...' : '')` and wrap `.ch-dim-wrap` with `(ch.DIM_SEND ? '...' : '')`. The CSS in page1.scss already applies globally so no SCSS changes are needed per page.

Page 1 areas: Bedroom, Bathroom, Dressing, Reading Light.

#### Shades widget

Each card (`shade-card`) declares:
- `data-shade` / `data-label` / `data-icon` / `data-orientation` (`"vertical"` or `"horizontal"`).
- Join attributes (`data-join-open/close/stop/pos/fb`) auto-injected at init from `joins<N>.js → SHADES.*`.

The rendered card has three big buttons (▲ Open / ■ Stop / ▼ Close), a status text line (`#sstat-txt-<key>-page<N>`), a 0–100% fill bar (`.sc-bar-fill`), and a % badge (`.sc-pct`). The buttons pulse the `OPEN` / `CLOSE` / `STOP` digital joins; the panel models the resulting shade position locally over a fixed travel time.

**Local timer model — `SHADE_TRAVEL_MS = 20000`.** Most shades in this install do not publish an analog position-feedback join, so the percentage shown on the card is a panel-side estimate of how long the motor has been running, not a measurement. The state machine inside each page IIFE lives on `shadeState[key] = { pos, isOpen, direction, startedAt, startPos, rafId }`:

- Tap **Open** → pulses OPEN, sets `direction = 'opening'`, captures `startPos = current pos` and `startedAt = performance.now()`, kicks a `requestAnimationFrame` loop that linearly interpolates `pos` from `startPos` toward 100 over `SHADE_TRAVEL_MS` ms.
- Tap **Close** → mirror image: interpolates toward 0.
- Tap **Stop** → pulses STOP, cancels the RAF, freezes `pos` wherever it is, status text becomes `Stopped at NN%`.
- **Mid-motion reversal is proportional** — tapping Close at 40% open captures `startPos = 40`, flips `direction = 'closing'`, and lands at 0 in ~8 s (40% of `SHADE_TRAVEL_MS`).
- **Tapping the same direction while already moving in that direction is a no-op for the animation** (the join still pulses — SIMPL is the source of truth for the physical motor; the panel-side animation is purely cosmetic).
- On completion: `direction = null`, status text flips to `Opened` (or `Closed`), card class flips to `sc-s-open` / `sc-s-closed`.

The three helpers live inside each page IIFE in `page<N>.js`, in this exact slot between `setShadeCardState` and `updateShadeFeedback`: `startShadeMotion(key, dir)`, `tickShade(key)`, `stopShadeMotion(key)`. Status-text strings used at runtime: `Opening…`, `Opened`, `Closing…`, `Closed`, `Stopped at NN%`. Card classes used: `sc-s-moving` (in flight), `sc-s-open` / `sc-s-closed` (at rest at extremes), `sc-s-stopped` (frozen by user mid-travel). The change is replicated identically across all 9 room pages — same `SHADE_TRAVEL_MS`, same helpers, same handler shape.

**SIMPL feedback takes priority if wired.** Each `buildShadeCard` still subscribes to the analog `joinFb` if present. When SIMPL publishes a real position, the `subAnalog` callback **cancels the active RAF and clears `direction`** before applying the value, so live FB always wins over the timer estimate. If you wire a `<NAME>_FB` analog join in `joins<N>.js → SHADES` for a given shade (e.g. uncomment `BEDROOM_FB` in joins1.js and point it at a real SIMPL analog out), the timer model becomes a one-shot bootstrap and the rest of the motion is driven by real feedback. Until then, the timer is the only thing the user sees.

**Key naming — must be UPPERCASE.** `page<N>.js` builds the lookup as `SHADE_JOIN_PREFIX[<lowercase-data-shade>]` (which returns an UPPERCASE prefix like `'BEDROOM'`) + `'_OPEN'`/`'_CLOSE'`/`'_STOP'`. Object keys are case-sensitive in JS, so a TitleCase key like `Bedroom_OPEN` in joins<N>.js will silently miss the lookup, no `data-join-*` attribute gets set, and tapping the card pulses `undefined`. Always declare the section keys as **`<PREFIX>_OPEN` / `_CLOSE` / `_STOP` / `_POS` / `_FB`** with the prefix matching the uppercased value in `SHADE_JOIN_PREFIX`.

Page 1 shades: Living Room (vertical), Bedroom (vertical), Curtain (horizontal), Balcony (vertical).

Design notes: [docs/superpowers/specs/2026-05-20-shades-timed-motion-design.md](docs/superpowers/specs/2026-05-20-shades-timed-motion-design.md), [docs/superpowers/plans/2026-05-20-shades-timed-motion.md](docs/superpowers/plans/2026-05-20-shades-timed-motion.md).

#### TV widget

Two-view layout (no popup/overlay — inline swap):

**Main TV view** — its content now depends on the page:
- 3 **Receiver launcher** buttons (OSN, BeIN Sports, Freesat) — tap to switch to the receiver's remote view. **Present on every TV page.**
- **TV Remote sub-widget (`tv-controls` / `.tv-subwidget`)** — Power, Vol+/−, Mute, CH+/−, D-Pad (▲◀OK▶▼), numeric keypad (0–9 + Home/Menu/CHlist/Back/Enter), all pulsing `J<N>.TV.*`. **REMOVED from page1, page2, page8** (their main TV view is now just the 3 receiver launchers — these rooms control the TV only through the receivers). Still present on pages 3, 4, 5, 6, 7, 9. When `tv-controls` is removed, `setupTV()` on that page is trimmed to only call `wireAppPanelButtons()` (no orphan `_gid('tvPowerBtn2')`/digit-loop/dpad wiring left behind).
- **Sub-tab nav** (`TV Controls` ↔ `Favorites`) — was already vestigial (single "TV Controls" button, no Favorites sub-widget); removed from page2 along with `tv-controls`.
- The numeric **keypad is now flexbox** (`.keypad { display:flex; flex-wrap:wrap }`, `.keypad-btn { flex: 1 1 calc(25% - 7.5px) }`) instead of CSS grid, so adding/removing keys reflows automatically — change the `25%` in `page1.scss` to alter keys-per-row. See "Keypad layout" under Known structural notes.

**Receiver Remote view** (shown when a launcher is tapped) — controls the receiver box, not the TV:
- Back-to-TV button + receiver title/icon.
- **Every button is receiver-specific**: Power, Source, Vol+/−, Mute, CH+/−, D-Pad, numeric keypad all pulse joins from `J<N>.APPS.<RECEIVER_KEY>.*`. No TV joins are used in this view.
- The numeric keypad digits (`KEY_0`–`KEY_9`) fire one IR command **per tap**, including repeated taps of the same digit (e.g. channel `1112`) — this relies on the repeat-safe `pulse()` (see Known wiring gotchas → "`pulse()` is repeat-safe"). They are momentary pulses, not toggles.

**Receiver joins are GLOBAL** — OSN, BeIN, and Freesat each control one physical box in the house, so their join numbers are identical across pages. The `APPS.OSN` / `APPS.BEIN` / `APPS.FREESAT` blocks were **reconciled to be byte-identical across `joins1.js`, `joins2.js`, `joins6.js`, and `joins8.js`** (a single canonical block written into all four). Before this, the four files had drifted: several keypad keys (`KEY_HOME` / `KEY_MENU` / `KEY_BACK`) were commented-out in some files, so the app-remote Home/Menu/Back buttons silently did nothing on some receivers; **`joins6.js`'s entire `APPS` section was empty** (page6's receiver remotes pulsed nothing). All keypad keys are now active in all four.

| Receiver | Key in APPS | KEY_HOME |
|----------|-------------|----------|
| OSN      | `OSN`       | `1306` (chosen value; also equals OSN `KEY_BACK`) |
| BeIN Sports | `BEIN`   | `5054` |
| Freesat  | `FREESAT`   | `5084` |

Each receiver block contains: `POWER`, `SOURCE` (commented), `VOL_UP`, `VOL_DOWN`, `MUTE`, `CH_UP`, `CH_DOWN`, `DPAD_*`, `KEY_0`–`KEY_9`, `KEY_HOME`, `KEY_MENU`, `KEY_BACK` (+ `KEY_CHLIST` / `LAUNCH` on OSN/BeIN, kept but no longer driven by any button). The app-remote keypad buttons that consume these are digits `KEY_0`–`KEY_9` + `appHome`(KEY_HOME) / `appMenu`(KEY_MENU) / `appBack`(KEY_BACK) — the old `appKeyEnter` / `appLaunchBtn` / `appKeyExit` buttons were deleted, so `KEY_ENTER` is no longer needed.

> **`joins6.js` TV section is still blank.** Only the GLOBAL `APPS` receivers could be filled in joins6 (they're shared). The **`TV.*` section (page6-specific numbers: `POWER`, `VOL_*`, `DPAD_*`, `KEY_*`, `KEYPAD_BASE`) is still all `''`** — those map to page6's SIMPL signals and were never invented. page6's *receiver remotes* work; its *main TV keypad* won't until those numbers are filled (the commented hint is `KEYPAD_BASE: 2330`). per-page `KEYPAD_BASE`: page1=780, page2=1906, page8=766.

**Active on pages:** 1 (Master Bedroom), 2 (Living Room), 6 (Reception), 8 (Basement). All other pages keep the TV widget without the receiver remote.

**`wireAppPanelButtons()` convention (page1/page2/page6/page8 must all match):** inside the receiver-remote view every Power / Source / Vol / Mute / CH / D-pad / numeric / function button pulses `appJoin('<KEY>')` — *not* `JOINS.TV.*`. `appJoin()` reads `_activeApp` (set by `openAppPanel_page<N>()`) and looks up the join inside `JOINS.APPS.<RECEIVER>.<KEY>`. If a page wires its app-panel Vol/Mute/CH to `JOINS.TV.*` instead, the receiver remote silently controls the TV (this was the page8 bug — fixed). `APP_META` must also list only the receivers that exist as `.qbtn.app-launcher` buttons in that page's HTML (3 entries: OSN / BEIN / FREESAT).

**Per-room `LAUNCHERS` joins.** Every `joins<N>.js` carries a top-level `LAUNCHERS` section right above `MUSIC`. It holds one digital join per quick-grid launcher button (`OSN` / `BEIN` / `FREESAT` on pages 1, 2, 6, 8 — `OSN` / `APPLETV` / `BEIN` on pages 3, 4, 5, 7, 9), keyed by the button's `data-app` value uppercased. Each `openAppPanel_page<N>(appKey)` pulses `JOINS.LAUNCHERS[appKey.toUpperCase()]` right after setting `_activeApp`, **before** the receiver-remote view is shown, so SIMPL can flip the AV matrix / select the IR driver before the user starts pressing remote buttons. Empty-string entries are skipped silently — leave a launcher `''` to keep the tap UI-only. Unlike the GLOBAL receiver joins (5000-range), launcher joins are **per-page** since "which room asked for which source" needs to be unique. The wiring lives inline in each `openAppPanel_page<N>`:

```js
window.openAppPanel_pageN = function(appKey) {
    /* … */
    _activeApp = appKey;
    const launchJoin = JOINS.LAUNCHERS && JOINS.LAUNCHERS[appKey.toUpperCase()];
    if (launchJoin) pulse(launchJoin);
    /* … */
};
```

#### AC widget (Climate Control)

Sub-tab nav: `❄️ Air Conditioner` ↔ `🔥 Heater`.

Both sub-widgets share the same card layout:
- Power button (`acPowerBtn` / `htrPowerBtn`).
- Current temperature readout (analog join feedback).
- SVG arc **dial** with + / − buttons to set target temperature (sends analog join).
- Mode row (AC only): Auto / Cool / Heat / Dry / Fan.
- Fan speed row (AC only): Auto / Low / Med / High.

#### Music widget

- Centred **Air Play** button.
- 4 control buttons in a grid: Vol+ / Vol− / Mute / Power Off.
- All buttons pulse digital joins from `joins<N>.js → MUSIC.*`.
- **Mute is a pure publisher — do NOT subscribe to `MUSIC.MUTE`.** `setupMusic()` used to also `subBool(M.MUTE, …)` (to toggle a `.music-active` highlight). Because `MUSIC.MUTE` (join `706`) is a GLOBAL join every page's mute button publishes, that single subscription (only in page1) lived in CrComLib's shared signal state — and `Ch5SignalBridge.publish()` calls `unsubscribe()` on any join it publishes, so the first mute tap on **any** page was consumed tearing the subscription down instead of delivering the rising edge → the classic "press Mute twice" bug. Removing the subscription made Mute behave like Vol+/Vol−/Power (which were never subscribed and always worked on one press). Trade-off: the page1 mute button no longer lights up to show muted state.

### Known structural notes

- **AC widget has no tab button.** The `#widget-ac-page<N>` div exists in every room page HTML (with its Climate Control markup) but there is no corresponding `<button data-widget="ac">` in the tab nav. The widget is present but unreachable via the UI. Add a tab button with `onclick="switchWidget_page<N>('ac', this)"` if you want to expose it.
- **Shades widget closing div.** A missing `</div>` after the `.shades-grid` in page HTML files would cause the AC and Music widget divs to be nested inside the shades widget, hiding them when shades loses its `active` class. Fixed in page1. If adding new pages, verify the shades section closes properly before the AC div.
- **Keypad layout is flexbox.** `.keypad` is `display:flex; flex-wrap:wrap; gap:10px` and `.keypad-btn` is `flex: 1 1 calc(25% - 7.5px)` (a quarter minus its share of the three 10px gaps) — so 4 keys per row, and adding/removing a `<button>` reflows automatically with no column tracks to manage. To change keys-per-row, edit the single `25%` in `.keypad-btn` in `page1.scss` (which applies globally). The full-width "0" on the app-remote keypad uses `.keypad-btn--wide { flex-basis: 100% }` (added as a class on every `appKey0-page<N>`); the old `[id^="appKey0"] { grid-column: span 1 }` override that silently defeated it was removed.

### Known wiring gotchas (past bugs, kept here so they don't recur)

- **`home.js` runs BEFORE `joins-home.js`** because all page JS is concatenated into `component.js` alphabetically and `h < j`. `home.js` resolves `J` lazily via `J = () => window.JHOME` for exactly this reason — see the "Lazy join-map resolution" subsection of the Home page. Capturing `J` at IIFE init silently freezes it to `null`; every pulse no-ops with no error. Same pitfall waits for any future hub-like script whose name sorts before its joins file.
- **`SHADES.*` keys must be UPPERCASE** (`BEDROOM_OPEN`, not `Bedroom_OPEN`) — the lookup in `applyJoinsToHtml()` is case-sensitive. See the Shades widget section.
- **page8 receiver-remote bug** — the app-panel Vol/Mute/CH/Power/Source must pulse `appJoin('<KEY>')`, not `JOINS.TV.<KEY>`. See the TV widget section. `APP_META` must list only the receivers that exist as launchers in the page's HTML.
- **`pulse()` is repeat-safe** (all 9 pages). It forces the join LOW, then HIGH, then LOW again after `ms`, and tracks a per-join `setTimeout` in `_pulseTimers`. Pressing the *same* button again cancels the pending LOW and re-pulses, so rapid repeats (e.g. typing channel **1112** on a receiver keypad) each produce a distinct rising edge. The old `pulse()` only did `true` → (100ms) → `false`; pressing the same digit again before the `false` fired merged the two into one continuous HIGH, so the IR driver saw a single press ("digit only registers once"). Applies to every momentary button (digits, dpad, transport, lights presets, shades) — all benefit, none regress (the extra leading LOW is a no-op for rising-edge logic).
- **Never subscribe to a GLOBAL momentary join you also publish.** `MUSIC.MUTE` (706) is the canonical example — see the Music widget "Mute is a pure publisher" note. CrComLib's `Ch5SignalBridge.publish()` calls `unsubscribe()` on the published join, so a button that both publishes and subscribes to the same global join eats its own first press → "press twice" bug, and it manifests on *every* page because the subscription is shared signal state, not page-scoped.
- **Commented-out HTML must not swallow a structural `</div>`.** page1's app-keypad once read `…ChList</button>\n</div>-->` — the comment that hid the unused keys also swallowed the keypad's closing `</div>`, leaving `#widget-tv-page1` unclosed so the **Shades / AC / Music** widgets parsed as children of the TV widget and were hidden whenever TV wasn't the active tab (looked like "Shades and Music don't render"). Fix: the `-->` must close *before* the `</div>`. Sanity check after editing page HTML: strip comments and confirm `<div` count == `</div>` count (balance 0).
- **`tvExit` had no join and is gone.** There is **no `TV.KEY_EXIT`** in any joins file (TV section has only `KEY_HOME/MENU/CHLIST/ENTER/BACK` + `KEYPAD_BASE`). The old `tvExit` "Exit" key therefore pulsed `undefined`; it was deleted from the main keypad (it lived inside the now-removed `tv-controls` on pages 1/2/8 anyway). Don't re-add an Exit key without first defining a real `KEY_EXIT` join.
- **Bulk multi-file edits: do NOT use broad/greedy regex.** A `<!--[^]*?MARKER[^]*?-->` cleanup regex matched from the file's *header* comment to a mid-file marker and deleted the entire `<head>`/`<body>`/widgets of page1/2/8 in one shot. Recovered from the intact `dist/prod/Shell/app/.../page<N>.html` copies, then re-applied changes with exact-string edits. Lessons: (1) for structural HTML removal use *balanced-tag* matching (count `<div`/`</div>`), never `[^]*?` across the file; (2) after any scripted multi-file edit, immediately re-check div balance + `node --check`; (3) `dist/prod` (and `dist/dev`) hold copy-plugin'd page HTML and are a viable recovery source when git can't isolate a single change.
- **`BASEMENT_SHADES` join** in `joins-home.js → SHUTDOWN` was empty in the original scaffold; set to `3245` to follow the per-floor `<x>1=ALL / <x>2=LIGHTS / <x>3=AV / <x>5=SHADES` pattern (FIRST=321x, GROUND=322x, BASEMENT=324x). `ALL_AC` is still empty by design — no button references it.
- **Outside-click listener guard.** `home.js → initTheme()` binds a `document` click listener once via `window.__themeOutsideClickBound`. On a CH5 panel a page script can re-run when the page is re-injected, which would otherwise stack duplicate listeners. Apply the same pattern when adding any other one-shot global listener (same trick is used for the OS-theme `matchMedia` listener via `window.__themeOSFollowBound`).
- **`JOINS.LAUNCHERS` keys must match `data-app` uppercased.** `openAppPanel_page<N>` does `appKey.toUpperCase()` to look up the launcher join. So a button with `data-app="osn"` looks for `LAUNCHERS.OSN`, `data-app="appletv"` looks for `LAUNCHERS.APPLETV` (single word, all caps), and `data-app="bein"` looks for `LAUNCHERS.BEIN`. Mistypes silently no-op (the `if (launchJoin) pulse(...)` guard skips falsy values), so verify the key casing if a launcher tap doesn't reach SIMPL.
- **Webpack production mode already minifies the WebpackConcatPlugin output — do NOT add a manual Terser step.** [webpack.prod.js](webpack.prod.js) declares `mode: 'production'`, which engages webpack 5's built-in TerserPlugin on every emitted JS asset. That includes the two files produced by `@mcler/webpack-concat-plugin` (`component.<hash>.js` and `cr-com-lib.<hash>.js`). Empirically: when an additional post-step Terser was bolted on after `cleanjs:prod`, it produced 0.0 % size reduction on `component.js` and `-0.0 %` (slightly larger) on `cr-com-lib.js` — confirming the input was already minified. The ~341 KB / ~1.9 MB final sizes are the floor for these bundles given the current source set. Source for `cr-com-lib.js` is mostly pre-minified Crestron npm packages (`@crestron/ch5-crcomlib`, `@crestron/ch5-webxpanel`, `@crestron/ch5-theme`) and won't shrink further without dropping features. Source for `component.js` is the 9 page IIFEs (~908 KB unminified) plus template glue; webpack already squeezes that to ~341 KB. **If you want real boot-time wins past the font fix, the next levers are *lazy* module splitting / lazy subscription registration (A1 / A2 from the design history), not further minification.**
- **Crestron One holds its native "Connecting to <hostname>" spinner until CrComLib reports session-ready.** Unlike a desktop browser (which paints the WebView as soon as it parses), the Crestron One mobile app keeps its own opaque spinner over the WebView for the *entire* CH5 boot — bundle download + WebView startup + all 9 page IIFEs running + subscription registration + initial-state replay. Consequence: the custom splash markup at [index.html:41-322](app/index.html#L41-L322) (DigitalCom logo + glassmorphism splash + dual-ring loader) **is never seen on Crestron One** — the native spinner is dismissed only after the splash's own 4-second auto-hide timer would have already fired. The splash *is* visible on desktop browsers serving the dev panel at `http://localhost:3000` (where there is no native spinner). Leave the splash code in place — it's useful for the desktop boot, and it costs nothing on mobile.
- **Shade % is a panel-side estimate, not a measurement.** The fill bar and badge animate over `SHADE_TRAVEL_MS = 20000` ms via `requestAnimationFrame` — no analog join is sent. If a `<NAME>_FB` analog join is wired in `joins<N>.js → SHADES`, the `subAnalog` callback cancels the RAF + clears `direction` and the live value wins. Two operational consequences: (1) if the physical motor takes longer or shorter than 20 s, the % visibly drifts from reality until you wire an FB join — change the constant per page if 20 s is wrong for that room; (2) reloading the page resets every shade's `pos` to 0 with status `Closed` even if the real shade is open, because there's nothing telling the panel otherwise. See the "Shades widget" subsection and `docs/superpowers/specs/2026-05-20-shades-timed-motion-design.md`.

### WebXPanel connection on iOS (cert trust)

The panel HTML loads over HTTP/HTTPS but the **joins flow over a separate `wss://<host>:49200` WebSocket**. iOS Safari and the Add-to-Home-Screen WebView reject self-signed certs *silently* — page loads, no joins pulse. Three resolutions (in order of robustness):

1. **Install the controller's cert as a trusted device profile**: AirDrop/email the `.crt` to the iPhone → tap it → Settings → General → VPN & Device Management → install → then **Settings → General → About → Certificate Trust Settings → toggle the cert ON** (this last step is hidden and mandatory). After this, every browser and every PWA on the device trusts the cert.
2. **Run the panel over plain HTTP/WS instead of HTTPS/WSS** — disable SSL on the controller (Crestron Toolbox → Web Configuration), access via `http://<host>/projectName/index.html?ipid=06`, and `WebXPanel` auto-switches to `ws://`. Simpler, less secure, fine for an internal LAN.
3. **Put a Let's Encrypt cert on the controller** (or terminate TLS at a reverse proxy like Caddy with a real cert and forward to the controller). Zero per-device configuration.

**Port-forward gotcha.** If you reach the panel over a public domain, the router must forward **both** port 443/80 (HTML) **and** port 49200 (WebSocket). Forwarding only 443 leaves you with "page loads, joins don't pulse" — exactly the same symptom as an untrusted cert.

**Auto-auth.** [webxpanel.js](app/template/libraries/webxpanel.js) has a `fetchCrestronToken(host, username, password)` step that POSTs to `https://<host>/cws/api/v1/authentication/token` *before* `WebXPanel.default.initialize()`, so the user is not shown the login dialog. Credentials are read from the `connectParams` object at the top of `webxpanel.js` (empty by default — fill in `username` / `password` for your controller; do NOT commit real credentials to a public repo). If the fetch fails (CORS, untrusted cert, mismatched password) the code falls back to the normal manual auth dialog. Verify in Safari/Chrome Web Inspector via the console messages `[WebXPanel] auto-auth succeeded — connecting with token` vs `[WebXPanel] auto-auth skipped (...)`.

### Removed

- **page10** — files and `project-config.json` entry both deleted.
- **Fake status bar** (hardcoded clock + battery) — replaced by topbar on every page.
- **Hardcoded greeting** ("Hello, Aya Hisham" + fabricated device count) — replaced by room-focused greeting.
- **Inline WebXPanel initialization** in page HTML files — moved to shell template (`webxpanel.js`).
- **Global shutdown join** (`JHOME.SHUTDOWN.ALL_SYSTEMS`) — no longer used by per-room `shutdownAll()`; replaced by per-page `J<N>.SYSTEM.SHUTDOWN` joins. The home page master button still uses `ALL_SYSTEMS` but now routes through the shared `shutdownAll()` 2-button confirm popup (not an immediate pulse).
- **localStorage theme persistence** — the dropdown choice used to persist across reloads. It no longer does: the active theme is re-derived from the OS `prefers-color-scheme` on every load and every OS flip. `setTheme()` still writes to `localStorage` for backwards-compat but `storedTheme()` ignores the value on read.
- **Room grid on home page** — removed from `home.html`; room navigation moved to footer nav.
- **Per-room hardcoded hover colours on the TV media row** — replaced by one shared accent hover (see Theme-adaptive widgets).
- **Per-room tint on the topbar/greeting** — replaced by a single theme-accent override on `.topbar` and `.greeting--modern`.
- **WEATHER joins as the weather data source** — replaced by an Open-Meteo `fetch()` call (see Home page → Weather).
- **TV Remote sub-widget (`tv-controls`) on page1, page2, page8** — the main TV view on these three pages is now just the 3 receiver launchers; the direct TV remote (power/vol/dpad/keypad) was removed (these rooms drive the TV via the receivers). page2's vestigial single-button TV sub-tab-nav went with it. `setupTV()` on these pages is trimmed to `wireAppPanelButtons()` only. Still present on pages 3/4/5/6/7/9.
- **`tvExit` keypad button** — removed from pages 1/2/6/8; there was never a `TV.KEY_EXIT` join for it to pulse.
- **App-remote keypad extras (`appKeyEnter` / `appLaunchBtn` / `appKeyExit`)** — deleted from all pages' app-remote keypad (they were left commented after the full-width-"0" change) plus their orphan JS wires. The app keypad is now digits + Home/Menu/Back only.
- **Music `MUTE` feedback subscription** — removed (see Music widget / gotchas); it caused the "press Mute twice" bug. Mute is now a pure publisher.
- **`page1` `preloadPage`** — flipped `true → false`; only `home` preloads now (faster cold boot).
