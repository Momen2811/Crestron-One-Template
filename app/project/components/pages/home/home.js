/* ============================================================================
 * home.js  —  Home Hub (landing page) logic
 * ============================================================================
 *
 * Wires up:
 *   • Time-aware salutation + live clock + date
 *   • House Modes buttons (pulse JHOME.HOUSE_MODES.*)
 *   • Room cards (navigate via navigationModule.goToPage('pageN'))
 *   • Connection indicator (flips conn--ok / conn--bad off CrComLib state)
 *
 * Joins live in joins-home.js (window.JHOME). Loaded BEFORE this file.
 *
 * EXPOSED GLOBALS (so inline onclick="…" works):
 *   window.hubMode(modeKey, btnEl)   — pulse a house-mode join
 *   window.hubGoRoom(pageName)       — navigate to a room
 * ============================================================================ */

const homeModule = (() => {
    'use strict';

    const HUB_ROOT = () => document.getElementById('home-page') || document;
    const _gid     = (id)  => document.getElementById(id);
    const _qsa     = (sel) => HUB_ROOT().querySelectorAll(sel);

    // Resolve the join map LAZILY. Every page script is concatenated into a
    // single component.js, and home.js sorts BEFORE joins-home.js (h < j) —
    // so window.JHOME does not exist yet when this IIFE first runs. Capturing
    // it now would freeze J to null and every pulse would silently no-op.
    // Reading window.JHOME at call time (button tap / init) guarantees
    // joins-home.js has already run.
    const J = () => (typeof window !== 'undefined' ? window.JHOME : null);

    // ────────────── CrComLib safe helpers (stub when running in dev browser) ──
    const hasCrestron = () => typeof CrComLib !== 'undefined';
    function pulse(join, ms = 100) {
        if (!hasCrestron() || !join) return;
        CrComLib.publishEvent('b', join, true);
        setTimeout(() => CrComLib.publishEvent('b', join, false), ms);
    }
    function sendSerial(join, text) {
        if (!hasCrestron() || !join) return;
        CrComLib.publishEvent('s', join, String(text));
    }
    function subBool(join, cb) {
        if (!hasCrestron() || !join) return;
        CrComLib.subscribeState('b', join, cb);
    }
    function subAnalog(join, cb) {
        if (!hasCrestron() || !join) return;
        CrComLib.subscribeState('n', join, cb);
    }
    function subSerial(join, cb) {
        if (!hasCrestron() || !join) return;
        CrComLib.subscribeState('s', join, cb);
    }

    /* ─── Inline-onclick bridge (mirrors the pattern in page1.js) ───────────
     * Lets inline HTML wire any button to a JHOME path with one line:
     *   <button onclick="tap_home('HOUSE_MODES.PARTY')">…</button>
     * Useful if you add buttons to home.html later. */
    function _resolve(joinPath) {
        const map = J();
        if (typeof joinPath !== 'string' || !joinPath || !map) return null;
        return joinPath.split('.').reduce((o, k) => (o ? o[k] : null), map);
    }
    window.tap_home = function (joinPath, ms) {
        const j = _resolve(joinPath);
        if (!j) { console.warn('[tap_home] no join for', joinPath); return; }
        pulse(j, typeof ms === 'number' ? ms : 100);
    };

    // ────────────── House Modes ──────────────────────────────────────────────
    // Map data-mode → JHOME.HOUSE_MODES.<KEY>
    const MODE_KEY = {
        morning: 'MORNING', guest: 'GUEST', night: 'NIGHT',
        away: 'AWAY',       party: 'PARTY', relax: 'RELAX'
    };
    // Metadata for the confirmation popup — icon, readable label, description, accent colour.
    const MODE_META = {
        morning: { label: 'Morning Mode', icon: '🌅', msg: 'Adjust all systems for a bright, energetic start to your day.',   rgb: '251, 191, 36'  },
        guest:   { label: 'Guest Mode',   icon: '👥', msg: 'Prepare the home for a comfortable guest experience.',             rgb: '45, 212, 191'  },
        night:   { label: 'Night Mode',   icon: '🌙', msg: 'Dim lights and set a quiet, sleep-friendly atmosphere.',            rgb: '79, 142, 247'  },
        away:    { label: 'Away Mode',    icon: '🏠', msg: 'Secure the home and optimise energy while you are away.',          rgb: '249, 107, 107' },
        party:   { label: 'Party Mode',   icon: '🎉', msg: 'Set the mood for entertaining — lights, music, and ambiance.',     rgb: '167, 139, 250' },
        relax:   { label: 'Relax Mode',   icon: '🛋️', msg: 'Create a calm, cosy atmosphere for winding down.',                 rgb: '251, 146, 60'  }
    };

    let _modeDialogEls = null;
    let _modeDialogCb  = null;

    function buildModeConfirmDialog() {
        if (_modeDialogEls) return _modeDialogEls;

        const overlay = document.createElement('div');
        overlay.className = 'hmc-overlay';

        const wrap = document.createElement('div');
        wrap.className = 'hmc-dialog';
        wrap.setAttribute('role', 'alertdialog');
        wrap.setAttribute('aria-modal', 'true');

        const inner = document.createElement('div');
        inner.className = 'hmc-dialog-inner';
        inner.innerHTML =
            '<span class="hmc-icon"></span>' +
            '<div class="hmc-title"></div>' +
            '<div class="hmc-msg"></div>' +
            '<div class="hmc-actions">' +
              '<button type="button" class="hmc-btn hmc-btn-cancel">Cancel</button>' +
              '<button type="button" class="hmc-btn hmc-btn-confirm">Activate</button>' +
            '</div>';
        wrap.appendChild(inner);
        document.body.appendChild(overlay);
        document.body.appendChild(wrap);

        const close = () => {
            overlay.classList.remove('open');
            wrap.classList.remove('open');
            _modeDialogCb = null;
        };
        inner.querySelector('.hmc-btn-cancel').addEventListener('click', close);
        inner.querySelector('.hmc-btn-confirm').addEventListener('click', () => {
            if (typeof _modeDialogCb === 'function') _modeDialogCb();
            close();
        });
        overlay.addEventListener('click', close);
        // .hmc-dialog covers the full viewport with pointer-events:all while open,
        // so clicks on the dimmed background actually land on it, not on .hmc-overlay.
        // Close when the click target is the wrap itself (i.e. the empty flex area
        // around .hmc-dialog-inner, not a click that bubbled up from the card body).
        wrap.addEventListener('click', (e) => {
            if (e.target === wrap) close();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && wrap.classList.contains('open')) close();
        });

        _modeDialogEls = { overlay, wrap, inner, close };
        return _modeDialogEls;
    }

    window.hubMode = function (modeKey, btnEl) {
        const key  = MODE_KEY[modeKey];
        if (!key) { console.warn('[hubMode] unknown mode:', modeKey); return; }

        const meta = MODE_META[modeKey] || { label: modeKey, icon: '🏠', msg: '', rgb: '167, 139, 250' };
        const els  = buildModeConfirmDialog();
        const inner = els.inner;

        inner.style.setProperty('--hmc-rgb', meta.rgb);
        inner.querySelector('.hmc-icon').textContent  = meta.icon;
        inner.querySelector('.hmc-title').textContent = 'Activate ' + meta.label + '?';
        inner.querySelector('.hmc-msg').textContent   = meta.msg;

        _modeDialogCb = () => {
            const map  = J();
            const join = map && map.HOUSE_MODES && map.HOUSE_MODES[key];
            pulse(join);
            if (btnEl && btnEl.classList) {
                btnEl.classList.remove('hub-mode-pulsed');
                void btnEl.offsetWidth;
                btnEl.classList.add('hub-mode-pulsed');
            }
        };

        els.overlay.classList.add('open');
        els.wrap.classList.add('open');
    };

    // ────────────── Sensors popup (Sensors On / Sensors Off) ─────────────────
    // The "Sensors" card on the hub opens this dialog. Each button pulses
    // one of the JHOME.SENSORS digital joins (ON / OFF) and closes.
    // Dialog is built once lazily and portaled to <body> so position:fixed
    // escapes the ch5-import-htmlsnippet transform context.
    let _sensorsDialogEls = null;

    function buildSensorsDialog() {
        if (_sensorsDialogEls) return _sensorsDialogEls;

        const overlay = document.createElement('div');
        overlay.className = 'hmc-overlay';

        const wrap = document.createElement('div');
        wrap.className = 'hmc-dialog';
        wrap.setAttribute('role', 'alertdialog');
        wrap.setAttribute('aria-modal', 'true');

        const inner = document.createElement('div');
        inner.className = 'hmc-dialog-inner';
        // Reuses the .hmc-* classes from the mode dialog for visual parity.
        // The two action buttons drop the Cancel/Activate semantics — they
        // are themselves the two actions.
        inner.innerHTML =
            '<span class="hmc-icon">📡</span>' +
            '<div class="hmc-title">Sensors</div>' +
            '<div class="hmc-msg">Turn the house sensors on or off.</div>' +
            '<div class="hmc-actions">' +
              '<button type="button" class="hmc-btn hmc-btn-cancel"  data-act="off">Sensors Off</button>' +
              '<button type="button" class="hmc-btn hmc-btn-confirm" data-act="on">Sensors On</button>' +
            '</div>';
        // Purple tint for the icon-ring (same token the AWAY/PARTY modes use).
        inner.style.setProperty('--hmc-rgb', '167, 139, 250');

        wrap.appendChild(inner);
        document.body.appendChild(overlay);
        document.body.appendChild(wrap);

        const close = () => {
            overlay.classList.remove('open');
            wrap.classList.remove('open');
        };

        // ON / OFF — pulse the matching SENSORS join (resolved LAZILY,
        // see comment on `J` at the top of this file).
        inner.querySelector('[data-act="on"]').addEventListener('click', () => {
            const map  = J();
            const join = map && map.SENSORS && map.SENSORS.ON;
            if (join) pulse(join);
            else      console.warn('[hubSensors] no join for SENSORS.ON');
            close();
        });
        inner.querySelector('[data-act="off"]').addEventListener('click', () => {
            const map  = J();
            const join = map && map.SENSORS && map.SENSORS.OFF;
            if (join) pulse(join);
            else      console.warn('[hubSensors] no join for SENSORS.OFF');
            close();
        });
        overlay.addEventListener('click', close);
        // See note in buildModeConfirmDialog — .hmc-dialog sits on top of
        // .hmc-overlay and eats clicks on the dimmed area, so we also need
        // a close handler here, scoped to clicks on the wrap itself.
        wrap.addEventListener('click', (e) => {
            if (e.target === wrap) close();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && wrap.classList.contains('open')) close();
        });

        _sensorsDialogEls = { overlay, wrap, inner, close };
        return _sensorsDialogEls;
    }

    // Exposed for the inline onclick="hubSensors(this)" on the Sensors card.
    window.hubSensors = function (btnEl) {
        const els = buildSensorsDialog();
        els.overlay.classList.add('open');
        els.wrap.classList.add('open');
        // Same just-pulsed flash as the mode buttons get.
        if (btnEl && btnEl.classList) {
            btnEl.classList.remove('hub-mode-pulsed');
            void btnEl.offsetWidth;
            btnEl.classList.add('hub-mode-pulsed');
        }
    };

    /* Master "shutdown all rooms" exposed as a single global so every
     * room page's topbar shutdown button can call it without each
     * page<N>.js needing its own copy. Home preloads, so window.shutdownAll
     * is always defined before any room page is shown.
     *
     * Pulses JHOME.SHUTDOWN.ALL_SYSTEMS only after the user confirms in a
     * Yes/No dialog. The dialog is built once (lazily) and appended to
     * <body> so position:fixed escapes the ch5-import-htmlsnippet's
     * transform context — the same trick the old area-shutdown popup used. */
    let _confirmEls = null;
    let _pendingShutdownJoin = null;
    let _pendingShutdownShutterJoin = null;
    function buildConfirmDialog() {
        if (_confirmEls) return _confirmEls;
        const overlay = document.createElement('div');
        overlay.className = 'ash-overlay';
        const dialog = document.createElement('div');
        dialog.className = 'ash-dialog';
        dialog.setAttribute('role', 'alertdialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.innerHTML =
            '<div class="ash-icon">⏻</div>' +
            '<div class="ash-title">Shutdown All Rooms?</div>' +
            '<div class="ash-msg">Every system in every room will be turned off.</div>' +
            '<div class="ash-actions">' +
              '<div class="ash-yes-row">' +
                '<button type="button" class="ash-btn ash-btn-yes-shutter"> Yes, with Shutter</button>' +
                '<button type="button" class="ash-btn ash-btn-yes">Yes, without Shutter</button>' +
              '</div>' +
              '<button type="button" class="ash-btn ash-btn-no">No, Not Now</button>' +
            '</div>';
        document.body.appendChild(overlay);
        document.body.appendChild(dialog);

        const btnNo          = dialog.querySelector('.ash-btn-no');
        const btnYes         = dialog.querySelector('.ash-btn-yes');
        const btnYesShutter  = dialog.querySelector('.ash-btn-yes-shutter');
        const close = () => {
            overlay.classList.remove('open');
            dialog.classList.remove('open');
            _pendingShutdownJoin = null;
            _pendingShutdownShutterJoin = null;
        };

        overlay.addEventListener('click', close);
        btnNo.addEventListener('click', close);
        btnYes.addEventListener('click', () => {
            if (_pendingShutdownJoin) pulse(_pendingShutdownJoin);
            else console.warn('[shutdownAll] No shutdown join configured for this page');
            close();
        });
        btnYesShutter.addEventListener('click', () => {
            if (_pendingShutdownShutterJoin) pulse(_pendingShutdownShutterJoin);
            else console.warn('[shutdownAll] No shutdown-with-shutter join configured for this page');
            close();
        });
        // Escape closes the dialog without firing.
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && dialog.classList.contains('open')) close();
        });

        _confirmEls = { overlay, dialog, close };
        return _confirmEls;
    }
    window.shutdownAll = function (join, shutterJoin) {
        _pendingShutdownJoin        = join        || null;
        _pendingShutdownShutterJoin = shutterJoin || null;
        const els = buildConfirmDialog();

        // Adapt the dialog to whether a shutter join was supplied.
        //   • With shutter    → 3 buttons: "Yes, with Shutter" /
        //                                  "Yes, without Shutter" / "No, Not Now"
        //   • Without shutter → 2 buttons: "Yes, Shutdown" / "No, Not Now"
        // Pages that don't have a shutter pulse just omit the 2nd arg in their
        // onclick, e.g. shutdownAll(J8.SYSTEM.SHUTDOWN).
        const dialog     = els.dialog;
        const btnShutter = dialog.querySelector('.ash-btn-yes-shutter');
        const btnYes     = dialog.querySelector('.ash-btn-yes');
        const hasShutter = !!_pendingShutdownShutterJoin;
        if (btnShutter) btnShutter.style.display = hasShutter ? '' : 'none';
        if (btnYes)     btnYes.textContent       = hasShutter ? 'Yes, without Shutter' : 'Yes, Shutdown';

        els.overlay.classList.add('open');
        els.dialog .classList.add('open');
    };

    // ────────────── House Modes — feedback subscriptions ─────────────────────
    // Subscribe to each mode join. SIMPL holds the same join HIGH while the
    // mode is active, so hub-mode-active is toggled on/off in real time.
    function setupModeFeedback() {
        if (!hasCrestron()) return;
        const modes = J() && J().HOUSE_MODES;
        Object.entries(MODE_KEY).forEach(([modeKey, joinKey]) => {
            const join = modes && modes[joinKey];
            if (!join) return;
            const btn = HUB_ROOT().querySelector('[data-mode="' + modeKey + '"]');
            if (!btn) return;
            subBool(join, (val) => { btn.classList.toggle('hub-mode-active', !!val); });
        });
    }

    // ────────────── House Functions  (per-floor on/off) ─────────────────────
    // floor ∈ {first, ground, basement}
    // sys   ∈ {lights, ac, shades}
    // act   ∈ {on, off}
    // Build the JHOME.HOUSE_FUNCTIONS key, e.g. ('first','lights','on') → 'FIRST_LIGHTS_ON'.
    window.hubFunc = function (floor, sys, act) {
        const key  = (floor + '_' + sys + '_' + act).toUpperCase();
        const map  = J();
        const join = map && map.HOUSE_FUNCTIONS && map.HOUSE_FUNCTIONS[key];
        if (!join) { console.warn('[hubFunc] no join for', key); return; }
        pulse(join);
    };

    // ────────────── Shutdown House  (per-floor + whole-house + master) ───────
    // floor ∈ {first, ground, basement, all}
    // sys   ∈ {lights, av, shades, ac, all}
    // ('all','all') → master kill (JHOME.SHUTDOWN.ALL_SYSTEMS)
    // ('all','<sys>') → JHOME.SHUTDOWN.ALL_<SYS>
    // ('<floor>','<sys>') → JHOME.SHUTDOWN.<FLOOR>_<SYS>
    window.hubShutdown = function (floor, sys) {
        const key  = (floor === 'all' && sys === 'all')
            ? 'ALL_SYSTEMS'
            : (floor + '_' + sys).toUpperCase();
        const map  = J();
        const join = map && map.SHUTDOWN && map.SHUTDOWN[key];
        if (!join) { console.warn('[hubShutdown] no join for', key); return; }
        pulse(join);
    };

    // ────────────── Room navigation ──────────────────────────────────────────
    // The shell exposes two coordinated APIs we need to mirror — both are
    // declared as top-level `const` in the shell scripts (lexical script
    // scope, NOT on `window`), so we access them as bare identifiers via
    // typeof guards (typeof on an undeclared name is the only safe check).
    //
    //   1. ch5-triggerview.setActiveView(index)  → visually swaps the page
    //   2. navigationModule.goToPage(pageName)   → handles load + cache + diags
    //
    // The shell's footer does BOTH (template-page.js:89 + :109) — so we do
    // the same here, in the same order.
    window.hubGoRoom = function (pageName) {
        if (!pageName) return;

        // Optional hook: tell CP4 which room is being entered. Useful for
        // SIMPL logic like "auto-play room music on entry".
        const sysMap = J() && J().SYSTEM;
        if (sysMap && sysMap.ACTIVE_PAGE) {
            sendSerial(sysMap.ACTIVE_PAGE, pageName);
        }

        // 1) Resolve index from the live nav-page list. This survives
        //    reordering pages in project-config.json — never hardcode.
        let activeIndex = -1;
        try {
            if (typeof projectConfigModule !== 'undefined' &&
                typeof projectConfigModule.getNavigationPages === 'function') {
                const navPages = projectConfigModule.getNavigationPages();
                for (let i = 0; i < navPages.length; i++) {
                    if (navPages[i].pageName === pageName) { activeIndex = i; break; }
                }
            }
        } catch (e) { console.warn('[hubGoRoom] could not resolve index:', e); }

        // 2) Swap the visible view. .triggerview matches the active one
        //    (horizontal / vertical / none — only one is rendered).
        if (activeIndex >= 0) {
            const tv = document.querySelector('.triggerview') ||
                       document.querySelector('ch5-triggerview');
            try { tv && tv.setActiveView(activeIndex); }
            catch (e) { console.warn('[hubGoRoom] setActiveView failed:', e); }
        }

        // 3) Fire the shell's full goToPage flow (loading indicator, cache
        //    handling, diagnostics, page-show events). Bare identifier
        //    because navigationModule is `const`, not on window.
        try {
            if (typeof navigationModule !== 'undefined' &&
                typeof navigationModule.goToPage === 'function') {
                navigationModule.goToPage(pageName);
                return;
            }
        } catch (e) { console.error('[hubGoRoom] navigationModule.goToPage failed:', e); }

        if (activeIndex < 0) {
            console.warn('[hubGoRoom] page not found in navigation list:', pageName);
        }
    };

    // ────────────── Connection indicator ─────────────────────────────────────
    function setConn(state /* 'ok' | 'warn' | 'bad' */, label) {
        const el = _gid('connStatus-home');
        if (!el) return;
        el.classList.remove('conn--ok', 'conn--warn', 'conn--bad');
        el.classList.add('conn--' + state);
        const lbl = el.querySelector('.conn-label');
        if (lbl) lbl.textContent = label || (state === 'ok' ? 'Online' :
                                             state === 'warn' ? 'Reconnecting' : 'Offline');
    }

    /* Heartbeat-driven connection indicator.
     *  CP4 must TOGGLE JHOME.SYSTEM.HEARTBEAT every ~2 s. We watch the
     *  time since the last edge and flip the .conn pill:
     *    < 5 s   → ok    (Online)
     *    5-12 s  → warn  (Reconnecting)
     *    > 12 s  → bad   (Offline)
     *  No heartbeat join → keep optimistic Online forever (legacy mode). */
    let _lastHeartbeat = 0;
    let _heartbeatTicker = null;
    function bindConnState() {
        if (!hasCrestron()) {
            setConn('warn', 'Local Preview');
            return;
        }
        const hb = J() && J().SYSTEM && J().SYSTEM.HEARTBEAT;
        if (!hb) { setConn('ok', 'Online'); return; }

        _lastHeartbeat = Date.now();
        subBool(hb, () => { _lastHeartbeat = Date.now(); });

        // Tick every 1 s — cheap, predictable.
        if (_heartbeatTicker) clearInterval(_heartbeatTicker);
        _heartbeatTicker = setInterval(() => {
            const age = (Date.now() - _lastHeartbeat) / 1000;
            if      (age < 5)  setConn('ok',   'Online');
            else if (age < 12) setConn('warn', 'Reconnecting');
            else               setConn('bad',  'Offline');
        }, 1000);
    }

    // ────────────── Time / date / salutation ─────────────────────────────────
    function pad(n) { return n < 10 ? '0' + n : '' + n; }

    function tickClock() {
        const now   = new Date();
        const hour  = now.getHours();
        const min   = now.getMinutes();
        const time  = pad(hour) + ':' + pad(min);

        const dayName   = now.toLocaleDateString(undefined, { weekday: 'long' });
        const dateLong  = now.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
        const yearShort = now.getFullYear();
        const dateText  = dayName + ' · ' + dateLong + ', ' + yearShort;

        let salute;
        if      (hour < 5)  salute = 'Good Night';
        else if (hour < 12) salute = 'Good Morning';
        else if (hour < 17) salute = 'Good Afternoon';
        else if (hour < 22) salute = 'Good Evening';
        else                salute = 'Good Night';

        const tEl = _gid('hubTime');   if (tEl) tEl.textContent = time;
        const dEl = _gid('hubDate');   if (dEl) dEl.textContent = dateText;
        const sEl = _gid('hubSalute'); if (sEl) sEl.textContent = salute + ', Welcome Home';
    }

    // Retry-until-ready wrapper for tickClock. The CH5 page loader injects
    // home.html ASYNCHRONOUSLY after the page-script IIFEs run, so the very
    // first tickClock() call on boot can race the injection: #hubTime /
    // #hubDate / #hubSalute don't yet exist, the lookups return null, the
    // `if (tEl)` guards silently no-op, and the user stares at the literal
    // defaults ("Welcome Home" / "—" / "—") for up to ~60 s until the
    // setInterval(60000) fallback fires. Retrying with growing gaps over
    // ~2.65 s catches the elements as soon as CH5 finishes injecting,
    // then stops.
    function tickClockWhenReady() {
        const gaps = [50, 100, 200, 400, 700, 1200];  // gaps in ms; total ~2.65 s
        let attempt = 0;
        (function step() {
            if (_gid('hubTime')) { tickClock(); return; }
            if (attempt < gaps.length) {
                setTimeout(step, gaps[attempt++]);
            }
        })();
    }

    // ────────────── Theme switcher ───────────────────────────────────────────
    // Sets data-theme on <html>, persists the choice to localStorage, and
    // re-applies it. CH5 pages share one document, so the attribute also
    // sticks across in-app navigation; index.html re-applies it on a full
    // reload (it boots to this hub page). Colours themselves live in
    // _theme-additions.scss :root / [data-theme="…"] blocks.
    const THEME_KEY = 'app-theme';
    const THEMES    = ['blue', 'dark', 'light'];

    function applyTheme(name) {
        const theme = THEMES.indexOf(name) >= 0 ? name : 'blue';
        document.documentElement.setAttribute('data-theme', theme);
        return theme;
    }
    // Read the OS / phone color scheme via prefers-color-scheme. Returns
    // 'dark' or 'light'; falls back to 'blue' (the brand default) only if
    // the browser doesn't expose a preference or matchMedia isn't supported.
    function osTheme() {
        try {
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)  return 'dark';
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
        } catch (e) { /* matchMedia unavailable */ }
        return 'blue';
    }
    // OS / phone is the source of truth for the theme — every load and
    // every OS flip re-applies it. The dropdown still works in-session
    // (for picking Blue, or a temporary preview) but does not pin the
    // theme: the next OS flip overrides it. localStorage is intentionally
    // ignored here so the behaviour is identical on every fresh load.
    function storedTheme() {
        return osTheme();
    }
    const THEME_LABELS = { blue: 'Blue', dark: 'Dark', light: 'Light' };

    // Reflect the active theme in the topbar dropdown (trigger + menu marks).
    function updateThemeUI(theme) {
        const lbl = _gid('themeDDLabel');
        if (lbl) lbl.textContent = THEME_LABELS[theme] || 'Blue';
        const sw = _gid('themeDDSwatch');
        if (sw) sw.className = 'theme-dd-sw hub-theme-swatch--' + theme;
        _qsa('.theme-dd-item').forEach((b) => {
            b.classList.toggle('active', b.getAttribute('data-theme-opt') === theme);
        });
    }

    function closeThemeMenu() {
        const dd = _gid('themeDD');
        if (!dd) return;
        dd.classList.remove('open');
        const trg = dd.querySelector('.theme-dd-trigger');
        if (trg) trg.setAttribute('aria-expanded', 'false');
    }

    // Exposed for the inline onclick="toggleThemeMenu()" on the dropdown trigger.
    window.toggleThemeMenu = function () {
        const dd = _gid('themeDD');
        if (!dd) return;
        const open = dd.classList.toggle('open');
        const trg = dd.querySelector('.theme-dd-trigger');
        if (trg) trg.setAttribute('aria-expanded', open ? 'true' : 'false');
    };

    // Exposed for the inline onclick="setTheme('…')" on the dropdown items.
    window.setTheme = function (name) {
        const theme = applyTheme(name);
        try { window.localStorage.setItem(THEME_KEY, theme); } catch (e) {}
        updateThemeUI(theme);
        closeThemeMenu();
    };

    function initTheme() {
        updateThemeUI(applyTheme(storedTheme()));
        // Close the dropdown when tapping anywhere outside it.
        // Bound once — on a CH5 panel the page script can re-run when the
        // page is re-injected, which would otherwise stack duplicate listeners.
        if (!window.__themeOutsideClickBound) {
            window.__themeOutsideClickBound = true;
            document.addEventListener('click', (e) => {
                const dd = _gid('themeDD');
                if (dd && !dd.contains(e.target)) closeThemeMenu();
            });
        }
        // Live-follow OS theme flips — UNCONDITIONALLY. A dropdown pick
        // only applies until the next OS change, so the user never gets
        // stuck in a theme that disagrees with their phone's mode.
        if (!window.__themeOSFollowBound) {
            window.__themeOSFollowBound = true;
            try {
                const mql = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
                if (mql) {
                    const onOSChange = (e) => {
                        updateThemeUI(applyTheme(e.matches ? 'dark' : 'light'));
                    };
                    if (mql.addEventListener) mql.addEventListener('change', onOSChange);
                    else if (mql.addListener) mql.addListener(onOSChange);  // Safari < 14
                }
            } catch (e) { /* matchMedia unavailable */ }
        }
    }

    // ────────────── Init ────────────────────────────────────────────────────
    function onInit() {
        console.log('🏠 Home Hub Initialized');
        initTheme();
        tickClockWhenReady();
        // Re-tick on the next minute boundary, then every minute.
        const ms = 60000 - ((Date.now()) % 60000);
        setTimeout(() => { tickClock(); setInterval(tickClock, 60000); }, ms);

        bindConnState();
        setupModeFeedback();

        // Optional: ask CP4 to refresh its state for any subscribers on
        // the hub (today: none — kept here so the hook exists for later).
        const sysMap = J() && J().SYSTEM;
        if (sysMap && sysMap.REQUEST_REFRESH) {
            pulse(sysMap.REQUEST_REFRESH);
        }
    }

    // CH5 import-htmlsnippet runs scripts after injecting the DOM, so the
    // hub elements should already exist when this file runs. But to be
    // safe on dev/browser, defer to after DOMContentLoaded if needed.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', onInit);
    } else {
        onInit();
    }

    return { onInit, tickClock, setConn };
})();
