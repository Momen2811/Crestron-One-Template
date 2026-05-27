/* page1.js — Smart Home Control (4 Widgets) — PAGE 1
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  JOIN NUMBERS ARE NOT IN THIS FILE                              ║
 * ║  All Crestron join numbers are defined in joins1.js              ║
 * ║  and accessed here via the global constant object   J1           ║
 * ║                                                                  ║
 * ║  To reassign a join:  edit joins1.js only.                       ║
 * ║  Never write a raw number like pulse('60') in this file.         ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  HOW TO COPY THIS FILE FOR ANOTHER PAGE                              │
 * │  ------------------------------------------------------------------  │
 * │  1.  Save as `page<N>.js`  (e.g. page2.js).                          │
 * │  2.  Find-and-replace IN THAT NEW FILE only:                         │
 * │           J1               →   J<N>            (e.g. J2)             │
 * │           window.J1        →   window.J1<N>     (e.g. window.J2)      │
 * │           joins1.js        →   joins<N>.js     (e.g. joins2.js)      │
 * │           page1            →   page<N>         (e.g. page2)          │
 * │           page1Module      →   page<N>Module   (e.g. page2Module)    │
 * │           Page 1 Initialized → Page <N> Initialized                  │
 * │  3.  Adjust AREA_JOIN_SECTION / SHADE_JOIN_PREFIX maps if your       │
 * │      new page has different rooms / shades.                          │
 * │  4.  Adjust the data-area / data-shade strings in the HTML to        │
 * │      match the new map.                                              │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * LOAD ORDER (page1.html — MUST be in this order):
 *   1. joins1.js    ← sets window.J1
 *   2. page1.js     ← reads window.J1
 */

const page1Module = (() => {
    'use strict';

    /* ──────────────────────────────────────────────────────────────
     * MULTI-PAGE NAMESPACE — every id in page1.html is suffixed
     * with PAGE_SUFFIX so duplicate ids across pages do not collide.
     *   Use  _gid('foo')   instead of  document.getElementById('foo')
     *   Use  _qsa('.foo')  instead of  document.querySelectorAll('.foo')
     *   Use  _qs('.foo')   instead of  document.querySelector('.foo')
     * (querySelectorAll/querySelector variants are scoped to PAGE_ROOT.)
     * PAGE_ROOT is the ONLY id that is NOT suffixed (it's already unique
     * per page), so we look it up with the raw browser API.
     * ▸▸▸ EDIT-FOR-PAGE-N: change '-page1' to '-page<N>' on copy.
     * ────────────────────────────────────────────────────────────── */
    const PAGE_SUFFIX = '-page1';
    // Resolved LAZILY — on the CH5 panel this script can run before
    // the page section has been injected into the DOM. If we captured
    // the root once at IIFE init time it would be null, _qsa/_qs would
    // fall back to `document`, and this page's onInit would attach its
    // openAreaPanel handler (and other listeners) to other pages' cards
    // too — causing every page's popup to fire on a single long-press.
    const PAGE_ROOT = () => document.getElementById('page1-page') || document;
    const _gid = (id)  => document.getElementById(id + PAGE_SUFFIX);
    const _qsa = (sel) => PAGE_ROOT().querySelectorAll(sel);
    const _qs  = (sel) => PAGE_ROOT().querySelector(sel);

    // ====================== JOIN MAP ALIAS ======================
    //  Pull the map exported by joins1.js (window.J1) into a local
    //  const so the rest of the file just writes  J1.SECTION.KEY
    //  ▸▸▸ EDIT-FOR-PAGE-N: rename both J1 and window.J1 to J<N> /
    //                       window.J1<N> on this single line.
    const J1 = (typeof window !== 'undefined' && window.J1)
        ? window.J1
        : (typeof J1 !== 'undefined' ? J1 : null);

    // ====================== GUARD ======================
    if (!J1) {
        console.error(
            '[page1.js] window.J1 is not defined.\n' +
            'joins1.js must be loaded BEFORE page1.js.\n' +
            'Fix load order in page1.html / project-config.json.'
        );
        // Build a safe stub so page still boots — every J1.X.Y returns ''
        // and pulse()/sendAnalog() will no-op for empty joins.
        if (typeof window !== 'undefined') {
            window.J1 = new Proxy({}, { get: () => new Proxy({}, { get: () => '' }) });
        }
    }
    // After the guard, J1 is always usable (real map or proxy stub).
    const JOINS = J1 || window.J1;

    // ====================== CrComLib SAFE HELPERS ======================
    const hasCrestron = () => typeof CrComLib !== 'undefined';

    // Repeat-safe momentary pulse. Each press forces the join LOW before the
    // new HIGH (and tracks a per-join timer), so pressing the SAME button again
    // — e.g. typing channel 1112 — always yields a fresh rising edge instead of
    // merging into one long HIGH that the IR driver sees as a single press.
    const _pulseTimers = Object.create(null);
    function pulse(join, ms = 100) {
        if (!hasCrestron() || !join) return;
        if (_pulseTimers[join]) clearTimeout(_pulseTimers[join]);
        CrComLib.publishEvent('b', join, false);  // clean LOW first
        CrComLib.publishEvent('b', join, true);   // rising edge -> fires
        _pulseTimers[join] = setTimeout(() => {
            CrComLib.publishEvent('b', join, false);
            delete _pulseTimers[join];
        }, ms);
    }

    function sendAnalog(join, value) {
        if (!hasCrestron() || !join) return;
        CrComLib.publishEvent('n', join, value);
    }

    function sendSerial(join, text) {
        if (!hasCrestron() || !join) return;
        CrComLib.publishEvent('s', join, text);
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

    /* ====================== GENERIC INLINE-ONCLICK BRIDGE ======================
     *
     * Lets ANY button anywhere on the page wire to a Crestron join with one
     * line of HTML — no per-button wrapper, no edit to this .js file.
     *
     *   <button onclick="tap_page1('TV.POWER')">          → digital pulse
     *   <button onclick="set_page1('AC.POWER', true)">    → digital set
     *   <button onclick="send_page1('AC.SP_SEND', 22)">   → analog (number)
     *   <button onclick="send_page1('NOTES.MSG', 'Hi')">  → serial (string)
     *
     * The first arg is a dot-path into the J1 map declared in joins1.js
     * (e.g. 'AC.SP_SEND' resolves J1.AC.SP_SEND). If the path does not
     * resolve, a console warning is emitted and the call is a safe no-op.
     *
     * To rename a join: edit joins1.js. The HTML string just has to match
     * the new path — no other code change.
     *
     * ▸▸▸ EDIT-FOR-PAGE-N: rename `_page1` → `_page<N>` and `J1` → `J<N>`
     *                       on every occurrence in this block. */
    function _resolveJoin_page1(joinPath) {
        if (typeof joinPath !== 'string' || !joinPath) return null;
        return joinPath.split('.').reduce((o, k) => (o ? o[k] : null), J1);
    }
    window.tap_page1 = function (joinPath, ms) {
        const join = _resolveJoin_page1(joinPath);
        if (!join) { console.warn('[tap_page1] no join for', joinPath); return; }
        pulse(join, typeof ms === 'number' ? ms : 100);
    };
    window.set_page1 = function (joinPath, value) {
        const join = _resolveJoin_page1(joinPath);
        if (!join) { console.warn('[set_page1] no join for', joinPath); return; }
        if (!hasCrestron()) return;
        CrComLib.publishEvent('b', join, !!value);
    };
    window.send_page1 = function (joinPath, value) {
        const join = _resolveJoin_page1(joinPath);
        if (!join) { console.warn('[send_page1] no join for', joinPath); return; }
        if (typeof value === 'number')      sendAnalog(join, value);
        else if (typeof value === 'boolean') CrComLib && CrComLib.publishEvent('b', join, value);
        else                                sendSerial(join, String(value));
    };

    // ====================== PRESET CATALOG ======================
    const DEFAULT_CATALOG = {
        on:      { label: 'All On',    icon: '💡', color: 'on'      },
        off:     { label: 'All Off',   icon: '🌙', color: 'off'     },
        dim:     { label: 'Dim',       icon: '⭐', color: 'dim'     },
        relax:   { label: 'Relax',     icon: '🌅', color: 'relax'   },
        tv:      { label: 'TV',        icon: '📺', color: 'tv'      },
        guest:   { label: 'Guest',     icon: '👥', color: 'guest'   },
        service: { label: 'Service',   icon: '🧹', color: 'service' },
        sunset:  { label: 'Sunset', icon: '☀️',  color: 'sunset' },
        p11:     { label: 'Preset 11', icon: '②',  color: 'generic' },
        p12:     { label: 'Preset 12', icon: '③',  color: 'generic' },
        p13:     { label: 'Preset 13', icon: '④',  color: 'generic' },
        p14:     { label: 'Preset 14', icon: '⑤',  color: 'generic' },
        p15:     { label: 'Preset 15', icon: '⑥',  color: 'generic' }
    };

    function catalog() {
        return (typeof window !== 'undefined' && window.LIGHT_PRESETS) || DEFAULT_CATALOG;
    }

    function presetInfo(key) {
        const cat = catalog();
        return cat[key] || { label: key, icon: '•', color: 'generic' };
    }

    function capitalize(s) {
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    // ====================== LONG-PRESS HELPER ======================
    const LONG_PRESS_MS        = 600;   // ms hold before popup opens
    const LONG_PRESS_CANCEL_PX = 10;    // px movement that cancels the hold

    function attachLongPress(el, callback, ms) {
        let timer = null, startX = 0, startY = 0, didFire = false, pressActive = false;

        function clear() {
            if (timer) { clearTimeout(timer); timer = null; }
            el.classList.remove('lp-holding');
            pressActive = false;
        }

        el.addEventListener('pointerdown', (e) => {
            // Don't start the long-press timer when the user is interacting with
            // the on/off toggle itself — the slider has its own click handler.
            if (e.target.closest('.acard-switch')) return;
            if (e.button !== undefined && e.button !== 0) return;
            didFire = false; pressActive = true;
            startX = e.clientX; startY = e.clientY;
            el.classList.add('lp-holding');
            timer = setTimeout(() => {
                timer = null;
                if (!pressActive) return;
                didFire = true;
                el.classList.remove('lp-holding');
                try { callback(el); } catch (err) { console.error(err); }
            }, ms);
        });

        el.addEventListener('pointermove', (e) => {
            if (!pressActive) return;
            if (Math.abs(e.clientX - startX) > LONG_PRESS_CANCEL_PX ||
                Math.abs(e.clientY - startY) > LONG_PRESS_CANCEL_PX) clear();
        });

        ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => el.addEventListener(ev, clear));

        el.addEventListener('contextmenu', (e) => {
            if (didFire || pressActive) e.preventDefault();
        });
    }

    // ====================== STATE ======================
    const areaState = {};
    let currentPanelArea = null;
    let panelPortalDone  = false;

    // ────── HTML → joins1 MAP resolvers ──────────────────────────────────
    // Maps on-screen keys (data-area="bedroom", data-shade="livingroom", …)
    // to the section names used in joins1.js.
    // ▸▸▸ EDIT-FOR-PAGE-N: if your new page has different rooms/shades,
    //                      add or remove entries here AND update the
    //                      matching data-area / data-shade strings in
    //                      pageN.html, then add matching sections in
    //                      joinsN.js.
    const AREA_JOIN_SECTION = {
        bedroom:  'LIGHTS_BEDROOM',
        bathroom: 'LIGHTS_BATHROOM',
        dressing: 'LIGHTS_DRESSING',
        reading:  'LIGHTS_READING',
    };
    const SHADE_JOIN_PREFIX = {
        livingroom: 'LIVING_ROOM',
        bedroom:    'BEDROOM',
        curtain:    'CURTAIN',
        balcony:    'BALCONY'
    };
    // AC mode/fan "data-mode"/"data-fan" → key name inside J1.AC
    const AC_MODE_KEY = { auto:'MODE_AUTO', cool:'MODE_COOL', heat:'MODE_HEAT',
                          dry:'MODE_DRY',   fan:'MODE_FAN_ONLY' };
    const AC_FAN_KEY  = { auto:'FAN_AUTO',  low:'FAN_LOW',    med:'FAN_MED',
                          high:'FAN_HIGH' };

    /* Mirror the joins1.js map onto HTML data-* attributes so colleagues only
     * have to edit joins1.js — never the HTML. Runs once, at the top of
     * onInit(), BEFORE buildAreaState()/setupShades()/setupAC() read the
     * attributes. Safe to call more than once (idempotent). */
    function applyJoinsToHtml() {
        if (!JOINS) return;

        // ── Light area cards / rows ───────────────────────────────────────
        _qsa('.area-card, .area-row[data-area]').forEach(card => {
            // Normalize to lowercase so the map works whether HTML uses
            // data-area="Bedroom", "bedroom", or "BEDROOM".
            const areaKey = (card.dataset.area || '').toLowerCase();
            const section = AREA_JOIN_SECTION[areaKey];
            const J_      = section && JOINS[section];
            if (!J_) return;

            const presetKeys = (card.dataset.presets || '').trim()
                .split(',').map(s => s.trim()).filter(Boolean);

            presetKeys.forEach(pk => {
                // Match preset key like 'on' / 'relax' / 'tv' / 'p10'
                // against joins1.js keys like 'ON' / 'RELAX' / 'TV_SCENE' / 'P10'
                const candidates = [
                    pk.toUpperCase(),                 // on → ON
                    pk.toUpperCase() + '_SCENE',      // tv → TV_SCENE
                    pk.toUpperCase() + '_ALL'         // dim → DIM_ALL (for LIGHTS_GLOBAL)
                ];
                const val = candidates.map(k => J_[k]).find(v => v);
                // joins1.js is the source of truth — ALWAYS overwrite any
                // hardcoded value in HTML so editing joins1.js takes effect.
                // (val is falsy when the key is missing from joins1.js, in
                //  which case we leave the HTML default alone.)
                if (val) {
                    card.setAttribute('data-join-' + pk, val);
                }
            });

            // Same rule for analog joins: joins1.js overwrites HTML defaults.
            // The "Main" channel still uses data-analog/data-fb for backward
            // compatibility; Accent + Wall channels get their own attrs.
            if (J_.DIMMER_SEND)         card.setAttribute('data-analog',         J_.DIMMER_SEND);
            if (J_.DIMMER_FB)           card.setAttribute('data-fb',             J_.DIMMER_FB);
            if (J_.DIMMER_ACCENT_SEND)  card.setAttribute('data-dim-accent',     J_.DIMMER_ACCENT_SEND);
            if (J_.DIMMER_ACCENT_FB)    card.setAttribute('data-dim-accent-fb',  J_.DIMMER_ACCENT_FB);
            if (J_.DIMMER_WALL_SEND)    card.setAttribute('data-dim-wall',       J_.DIMMER_WALL_SEND);
            if (J_.DIMMER_WALL_FB)      card.setAttribute('data-dim-wall-fb',    J_.DIMMER_WALL_FB);
        });

        // ── Shade cards ─────────────────────────────────────────────────
        _qsa('.shade-card').forEach(card => {
            // Normalize to lowercase so the lookup is case-insensitive.
            const shadeKey = (card.dataset.shade || '').toLowerCase();
            const prefix   = SHADE_JOIN_PREFIX[shadeKey];
            if (!prefix || !JOINS.SHADES) return;
            const set = (attr, key) => {
                // joins1.js always wins — overwrite any value already in HTML.
                if (JOINS.SHADES[key])
                    card.setAttribute('data-' + attr.replace(/([A-Z])/g, '-$1').toLowerCase(),
                                      JOINS.SHADES[key]);
            };
            set('joinOpen',  prefix + '_OPEN');
            set('joinClose', prefix + '_CLOSE');
            set('joinStop',  prefix + '_STOP');
            set('joinPos',   prefix + '_POS');
            set('joinFb',    prefix + '_FB');
        });

        // ── AC mode & fan buttons ───────────────────────────────────────
        _qsa('.ac-mode-btn').forEach(btn => {
            const key = AC_MODE_KEY[btn.dataset.mode];
            if (key && JOINS.AC && JOINS.AC[key]) btn.dataset.join = JOINS.AC[key];
        });
        _qsa('.ac-fan-btn').forEach(btn => {
            const key = AC_FAN_KEY[btn.dataset.fan];
            if (key && JOINS.AC && JOINS.AC[key]) btn.dataset.join = JOINS.AC[key];
        });
    }


    /* ── Hub-link + heartbeat-driven .conn pill ────────────────────────────
     * Wires the back-home button to navigate to the hub via the same shell
     * APIs the hub itself uses for room navigation, and subscribes to the
     * shared JHOME.SYSTEM.HEARTBEAT join so the room's .conn pill flips
     * Online / Reconnecting / Offline based on CP4 liveness. */
    let _hbLast_page1 = 0;
    let _hbTicker_page1 = null;
    function setupHubLink() {
        // 1. Back-home button onclick handler (exposed for inline onclick).
        window.goHome_page1 = function () {
            const target = 'home';
            let activeIndex = -1;
            try {
                if (typeof projectConfigModule !== 'undefined' &&
                    typeof projectConfigModule.getNavigationPages === 'function') {
                    const navPages = projectConfigModule.getNavigationPages();
                    for (let i = 0; i < navPages.length; i++) {
                        if (navPages[i].pageName === target) { activeIndex = i; break; }
                    }
                }
            } catch (_) {}
            if (activeIndex >= 0) {
                const tv = document.querySelector('.triggerview') ||
                           document.querySelector('ch5-triggerview');
                try { tv && tv.setActiveView(activeIndex); } catch (_) {}
            }
            try {
                if (typeof navigationModule !== 'undefined' &&
                    typeof navigationModule.goToPage === 'function') {
                    navigationModule.goToPage(target);
                }
            } catch (_) {}
        };

        // 2. Heartbeat-driven .conn pill. The HEARTBEAT join lives in
        //    JHOME (window.JHOME.SYSTEM.HEARTBEAT) so all pages share the
        //    same join number — wire it ONCE in SIMPL.
        const conn = _gid('connStatus');
        if (!conn) return;
        const setConnState = (state, label) => {
            conn.classList.remove('conn--ok', 'conn--warn', 'conn--bad');
            conn.classList.add('conn--' + state);
            const lbl = conn.querySelector('.conn-label');
            if (lbl) lbl.textContent = label;
        };

        const hb = (typeof window !== 'undefined' && window.JHOME &&
                    window.JHOME.SYSTEM && window.JHOME.SYSTEM.HEARTBEAT) || '';
        if (!hasCrestron()) { setConnState('warn', 'Local Preview'); return; }
        if (!hb)            { setConnState('ok',   'Online'); return; }

        _hbLast_page1 = Date.now();
        subBool(hb, () => { _hbLast_page1 = Date.now(); });

        if (_hbTicker_page1) clearInterval(_hbTicker_page1);
        _hbTicker_page1 = setInterval(() => {
            const age = (Date.now() - _hbLast_page1) / 1000;
            if      (age < 5)  setConnState('ok',   'Online');
            else if (age < 12) setConnState('warn', 'Reconnecting');
            else               setConnState('bad',  'Offline');
        }, 1000);
    }

    // ====================== INIT ======================
    function onInit() {
        // ▸▸▸ EDIT-FOR-PAGE-N: change the log label to match your page.
        console.log('✅ Page 1 Initialized');
        applyJoinsToHtml();           // stamp data-join-* attrs from joins1.js
        ensurePanelClosed();
                                      // position:fixed escapes the CH5
                                      // import-snippet's transform context
                                      // dialog
        buildAreaState();
        setupWidgetNav();
        setupGlobalLightsPresets();
        setupAreaPanelControls();
        setupShades();
        setupAC();
        setupTV();
        setupMusic();
        setupFeedbackSubscriptions();
        setupHubLink();
        requestCurrentStatus();
        notifyActivePage();
    }

    // ====================== HOME OVERLAY (Modes / Functions / Shutdown / Weather) ======================


    function ensurePanelClosed() {
        _gid('areaPanel')       ?.classList.remove('open');
        _gid('areaPanelOverlay')?.classList.remove('open');
    }

    function portalPanelToBody() {
        if (panelPortalDone) return;
        const panel   = _gid('areaPanel');
        const overlay = _gid('areaPanelOverlay');
        if (!panel || !overlay) return;
        document.body.appendChild(overlay);
        document.body.appendChild(panel);
        panelPortalDone = true;
    }

    let areaShutdownPortalDone = false;
    // ====================== WIDGET MANAGEMENT ======================
    /* Persist the last-chosen widget GLOBALLY across all pages.
     *
     * The user wants: pick TV on page1, navigate to page3 — page3 also
     * shows TV. So the storage key is shared (NOT page-suffixed) and
     * every pageN.js reads/writes the same slot.
     *
     * Three layers of persistence (any one is enough):
     *   1) window.__activeWidget — survives so long as the browser
     *      session/tab is alive (not cleared by snippet reloads or
     *      DOM rebuilds).
     *   2) localStorage (key = "activeWidget") — survives full reloads
     *      and panel restarts.
     *   3) sessionStorage — fallback for environments where localStorage
     *      is blocked.
     *
     * The active widget is re-applied EVERY time the page's import-snippet
     * fires its `loaded` event, not just on first init (see bootstrap at
     * the bottom of this file).
     *
     * ▸▸▸ EDIT-FOR-PAGE-N: nothing to change — this code is identical
     *                       in every pageN.js so all pages share the
     *                       same global slot.
     */
    const WIDGET_STORAGE_KEY = 'activeWidget';   // GLOBAL — no page suffix.

    function _safeStoreGet(key) {
        try {
            if (window.localStorage) {
                const v = window.localStorage.getItem(key);
                if (v) return v;
            }
        } catch (e) { /* localStorage disabled */ }
        try {
            if (window.sessionStorage) return window.sessionStorage.getItem(key);
        } catch (e) { /* sessionStorage disabled */ }
        return null;
    }
    function _safeStoreSet(key, value) {
        try { if (window.localStorage)   window.localStorage.setItem(key, value); }
        catch (e) { /* ignore */ }
        try { if (window.sessionStorage) window.sessionStorage.setItem(key, value); }
        catch (e) { /* ignore */ }
    }

    function getStoredWidget() {
        // Prefer the window cache (most up-to-date in current session),
        // then localStorage / sessionStorage for cross-reload durability.
        if (typeof window !== 'undefined' && window.__activeWidget) {
            return window.__activeWidget;
        }
        return _safeStoreGet(WIDGET_STORAGE_KEY);
    }

    function setupWidgetNav() {
        applyStoredWidget(/*fallbackToHtmlActive*/ true);
    }

    /* Re-applies whichever widget the user last chose. Called from
     * setupWidgetNav() at first init AND from the bootstrap whenever
     * the page snippet finishes loading (so re-entries to page1
     * restore the right tab even if CH5 reset the DOM classes). */
    function applyStoredWidget(fallbackToHtmlActive) {
        const stored = getStoredWidget();
        let target = null;
        if (stored) target = _qs('.tab-btn[data-widget="' + stored + '"]');
        if (!target && fallbackToHtmlActive) {
            target = _qs('.tab-btn.active') || _qs('.tab-btn');
        }
        if (!target) return;
        const widgetName = target.getAttribute('data-widget') || 'lights';
        // Skip the work if the right widget is already active — avoids
        // pointless re-renders / network sends on every navigation.
        const widgetEl = document.getElementById('widget-' + widgetName + PAGE_SUFFIX);
        if (widgetEl && widgetEl.classList.contains('active') && target.classList.contains('active')) {
            return;
        }
        window.switchWidget_page1(widgetName, target);
    }

    window.switchWidget_page1 = function (widgetName, clickedBtn) {
        _qsa('.tab-btn').forEach(b => b.classList.remove('active'));
        if (clickedBtn) clickedBtn.classList.add('active');
        _qsa('.widget').forEach(w => w.classList.remove('active'));
        const active = document.getElementById('widget-' + widgetName + PAGE_SUFFIX);
        if (active) active.classList.add('active');
        // Remember the choice GLOBALLY so the same widget tab follows the
        // user across every page in the app, not just this page.
        if (typeof window !== 'undefined') window.__activeWidget = widgetName;
        _safeStoreSet(WIDGET_STORAGE_KEY, widgetName);
        // J1.SYSTEM.ACTIVE_WIDGET — serial: currently visible tab name
        sendSerial(JOINS.SYSTEM.ACTIVE_WIDGET, widgetName);
    };

    window.switchTVSubWidget_page1 = function (subwidgetName, clickedBtn) {
        // Scope queries to the TV widget so we don't accidentally
        // de-activate the AC widget's sub-tab buttons (they share the
        // .sub-tab-btn class) while switching between TV Controls and
        // Favorites.
        const tvRoot = _gid('widget-tv');
        const scope  = tvRoot || PAGE_ROOT();
        scope.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
        if (clickedBtn) clickedBtn.classList.add('active');
        scope.querySelectorAll('.tv-subwidget').forEach(w => w.classList.remove('active'));
        // The HTML calls this with 'tv-controls' / 'tv-favorites' (no
        // suffix); the real ids are 'tv-controls-page1' / 'tv-favorites-page1'.
        // _gid() adds PAGE_SUFFIX so we look up the right element.
        const el = _gid(subwidgetName);
        if (el) el.classList.add('active');
    };

    window.toggleTile_page1 = function (name, cls) {
        const tog  = document.getElementById('tog-' + name);
        const tile = document.getElementById('tile-' + name);
        const lbl  = document.getElementById('lbl-' + name);
        if (!tog || !tile || !lbl) return;
        const isOn = tog.checked;
        tile.classList.toggle(cls, isOn);
        lbl.textContent = isOn ? 'ON' : 'OFF';
    };

    // ====================== LIGHTS: BUILD STATE FROM DOM ======================
    function buildAreaState() {
        _qsa('.area-card, .area-row[data-area]').forEach(card => {
            const key = card.dataset.area;
            if (!key) return;

            const presetKeys = (card.dataset.presets || '').trim()
                .split(',').map(s => s.trim()).filter(Boolean);

            // Build join map from data-join-<key> attributes.
            // These attribute values must match J1.LIGHTS_<AREA>.<PRESET> in joins1.js.
            const presetJoinMap = {};
            presetKeys.forEach(pk => {
                const j = (card.dataset['join' + capitalize(pk)] || '').trim();
                if (j) presetJoinMap[pk] = j;
            });

            const overrideLabels = {};
            presetKeys.forEach(pk => {
                const v = (card.dataset['label' + capitalize(pk)] || '').trim();
                if (v) overrideLabels[pk] = v;
            });

            // Build the dimmer-channels list. Each room may have up to 3:
            //   • Main   — uses data-analog / data-fb (= J1.LIGHTS_<AREA>.DIMMER_SEND/FB)
            //   • Accent — uses data-dim-accent / data-dim-accent-fb
            //   • Wall   — uses data-dim-wall   / data-dim-wall-fb
            // A channel is "present" only when its send attr is set; missing
            // channels are simply not rendered in the popup.
            const channels = [];
            if (card.dataset.analog) {
                channels.push({ key: 'main',   label: 'Main',   send: card.dataset.analog,    fb: card.dataset.fb || null });
            }
            if (card.dataset.dimAccent) {
                channels.push({ key: 'accent', label: 'Accent', send: card.dataset.dimAccent, fb: card.dataset.dimAccentFb || null });
            }
            if (card.dataset.dimWall) {
                channels.push({ key: 'wall',   label: 'Wall',   send: card.dataset.dimWall,   fb: card.dataset.dimWallFb || null });
            }
            // Per-channel level cache. Updated by user input AND by feedback
            // subscriptions in setupLightsFeedback().
            const levels = {};
            channels.forEach(ch => { levels[ch.key] = 0; });

            areaState[key] = {
                element: card,
                label:   card.dataset.label || key,
                icon:    card.dataset.icon  || '💡',
                presets: presetKeys,
                joins:   presetJoinMap,
                labelOverrides: overrideLabels,
                analog:  card.dataset.analog || null,
                fb:      card.dataset.fb     || null,
                level:   0,
                channels: channels,
                levels:   levels,
                isOn:    false,
                preset:  'off',
                chLevels: {},  // per-channel dimmer level cache for the detail popup
                chStates: {}   // per-channel on/off state ('on' | 'off' | null)
            };

            attachLongPress(card, (el) => window.openAreaPanel_page1(el, null), LONG_PRESS_MS);

            // Optimistic preset-button highlight — no SIMPL round-trip needed.
            // Fires AFTER the inline onclick pulse, so the visual is instant.
            const btnsDiv = card.querySelector('.area-row-btns');
            if (btnsDiv) {
                btnsDiv.addEventListener('click', (e) => {
                    const btn = e.target.closest('.area-btn');
                    if (!btn) return;
                    const preset = btn.classList.contains('ab-on')    ? 'on'
                                 : btn.classList.contains('ab-dim')   ? 'dim'
                                 : btn.classList.contains('ab-relax') ? 'relax'
                                 : btn.classList.contains('ab-off')   ? 'off'
                                 : null;
                    if (!preset) return;
                    btnsDiv.querySelectorAll('.area-btn').forEach(b => b.classList.remove('ab-active'));
                    btn.classList.add('ab-active');
                    setAreaVisual(key, preset);
                });
            }

            // Visibly start every card in the OFF state so the slider thumb,
            // border tint, and on-count badge all reflect the initial truth
            // (isOn:false). Without this, cards render "blank" until the
            // first user tap or feedback message arrives.
            setAreaVisual(key, 'off');
        });
        updateOnCountBadge();
    }

    function labelFor(areaKey, presetKey) {
        const st = areaState[areaKey];
        if (st?.labelOverrides?.[presetKey]) return st.labelOverrides[presetKey];
        return presetInfo(presetKey).label;
    }

    // ====================== LIGHTS: GLOBAL PRESET BAR ======================
    function setupGlobalLightsPresets() {

        // ── visually highlight the active room mode ───────────────────
        // Adds .lglobal-active to one of the 4 mode buttons; per-button
        // colour styling lives in page1.scss
        // (.lglobal-morning/relax/dressing/sleep  + .lglobal-active).
        // Only one button is "lit" at a time.
        //   Morning  → green   • Dressing → orange (vivid)
        //   Relax    → orange (warm amber – different scale) • Sleep → red
        function setGlobalLightActive_(activeId) {
            ['globalMorning','globalRelax','globalDressing','globalSleep'].forEach(id => {
                const el = _gid(id);
                if (el) el.classList.toggle('lglobal-active', id === activeId);
            });
        }

        // J1.LIGHTS_GLOBAL.MORNING — digital: Morning Mode
        // Standalone room-mode pulse — does NOT touch the per-room area
        // cards (Bedroom / Bathroom / Dressing / Reading Light). Only
        // the global join is fired and the mode button itself lights up.
        _gid('globalMorning')?.addEventListener('click', () => {
            pulse(JOINS.LIGHTS_GLOBAL.MORNING);
            setGlobalLightActive_('globalMorning');
        });

        // J1.LIGHTS_GLOBAL.RELAX — digital: Relax Mode
        _gid('globalRelax')?.addEventListener('click', () => {
            pulse(JOINS.LIGHTS_GLOBAL.RELAX);
            setGlobalLightActive_('globalRelax');
        });

        // J1.LIGHTS_GLOBAL.DRESSING — digital: Dressing Mode
        _gid('globalDressing')?.addEventListener('click', () => {
            pulse(JOINS.LIGHTS_GLOBAL.DRESSING);
            setGlobalLightActive_('globalDressing');
        });

        // J1.LIGHTS_GLOBAL.SLEEP — digital: Sleep Mode
        _gid('globalSleep')?.addEventListener('click', () => {
            pulse(JOINS.LIGHTS_GLOBAL.SLEEP);
            setGlobalLightActive_('globalSleep');
        });

        // D ← global preset feedback — SIMPL holds the same join HIGH while active
        if (hasCrestron()) {
            subBool(JOINS.LIGHTS_GLOBAL.MORNING,  (v) => { const el = _gid('globalMorning');  if (el) el.classList.toggle('lglobal-active', !!v); });
            subBool(JOINS.LIGHTS_GLOBAL.RELAX,    (v) => { const el = _gid('globalRelax');    if (el) el.classList.toggle('lglobal-active', !!v); });
            subBool(JOINS.LIGHTS_GLOBAL.DRESSING, (v) => { const el = _gid('globalDressing'); if (el) el.classList.toggle('lglobal-active', !!v); });
            subBool(JOINS.LIGHTS_GLOBAL.SLEEP,    (v) => { const el = _gid('globalSleep');    if (el) el.classList.toggle('lglobal-active', !!v); });
        }
    }

    // ====================== LIGHTS: VISUAL STATE ======================
    function applyAllAreas(preset) {
        // Pulse each room's individual preset join AND update its visual,
        // so the global bar works even if the SIMPL program does not
        // fan out the LIGHTS_GLOBAL signal to every room. The global pulse
        // (J*.LIGHTS_GLOBAL.<preset>) was already fired by the click handler.
        Object.keys(areaState).forEach(k => {
            const st = areaState[k];
            if (!st.presets.includes(preset)) return;
            const j = st.joins[preset];
            if (j) pulse(j);             // per-room digital pulse to CP4
            setAreaVisual(k, preset);    // local UI update
        });
    }

    function setAreaVisual(key, preset) {
        const st = areaState[key];
        if (!st) return;
        st.preset = preset;
        st.isOn   = (preset !== 'off');
        const card = st.element;
        // Clear every preset-related class so we can re-apply just one.
        card.classList.remove(
            'alit', 'arelax',
            'apreset-on', 'apreset-dim', 'apreset-relax', 'apreset-off'
        );
        // Colour-coded tint for the four core presets — matches the
        // global lights bar (green / orange / amber / red).
        if (preset === 'on' || preset === 'dim' || preset === 'relax' || preset === 'off') {
            card.classList.add('apreset-' + preset);
        } else {
            // Other presets (tv, guest, service, p10..p15) keep the
            // generic amber "lit" look.
            card.classList.add('alit');
        }
        // .aon drives the slider-thumb position in page1.scss — independent of
        // which preset is active, just a binary on/off cue.
        card.classList.toggle('aon', st.isOn);
        const sw = document.getElementById('abulb-' + key + PAGE_SUFFIX);
        if (sw) sw.setAttribute('aria-checked', st.isOn ? 'true' : 'false');
        if (currentPanelArea === key) refreshPanelStatus();
        updateOnCountBadge();

        // Sync every channel dimmer bar to the preset level so the popup
        // always reflects the area's current state.
        const PRESET_DIM_LEVELS = { on: 100, dim: 50, relax: 30, off: 0 };
        if (PRESET_DIM_LEVELS[preset] !== undefined) {
            const lvl     = PRESET_DIM_LEVELS[preset];
            const chState = lvl === 0 ? 'off' : 'on';
            const section = AREA_JOIN_SECTION[key];
            const J_      = section && JOINS[section];
            const chCount = ((J_ && J_.CHANNELS) || []).length;
            if (chCount > 0) {
                if (!st.chLevels) st.chLevels = {};
                if (!st.chStates) st.chStates = {};
                for (let i = 0; i < chCount; i++) {
                    st.chLevels[i] = lvl;
                    st.chStates[i] = chState;
                }
                if (currentPanelArea === key) {
                    const wrap = _gid('panelChannels');
                    for (let i = 0; i < chCount; i++) {
                        updateChRowVisual(i, lvl);
                        if (wrap) updateChBtnVisual(wrap, i, chState);
                    }
                }
            }
        }
    }

    function updateOnCountBadge() {
        const badge = _gid('lightsOnCount');
        if (badge) badge.textContent = Object.values(areaState).filter(s => s.isOn).length + ' on';
    }

    // ====================== LIGHTS: AREA PANEL ======================
    function renderPanelPresets(areaKey) {
        const grid = _gid('panelPresetGrid');
        if (!grid) return;
        grid.innerHTML = '';
        const st = areaState[areaKey];
        if (!st) return;
        st.presets.forEach(pk => {
            const info = presetInfo(pk);
            const btn  = document.createElement('button');
            btn.type = 'button';
            btn.className = 'preset-btn preset-' + (info.color || 'generic');
            btn.dataset.preset = pk;
            btn.innerHTML =
                '<span class="preset-ico">' + (info.icon || '•') + '</span>' +
                '<span class="preset-lbl">' + labelFor(areaKey, pk) + '</span>';
            btn.addEventListener('click', () => sendAreaPreset(pk));
            grid.appendChild(btn);
        });
    }

    window.openAreaPanel_page1 = function (cardEl, event) {
        if (event?.target?.closest('.acard-switch')) return;
        const key = cardEl.dataset.area;
        const st  = areaState[key];
        if (!st) return;

        portalPanelToBody();
        currentPanelArea = key;

        _gid('panelIco').textContent   = st.icon;
        _gid('panelTitle').textContent = st.label;
        _gid('panelSub').textContent   = 'Lighting Control';

        renderPanelChannels(key);

        refreshPanelStatus();
        _gid('areaPanelOverlay').classList.add('open');
        _gid('areaPanel').classList.add('open');
        document.body.style.overflow = 'hidden';

        // J1.SYSTEM.ACTIVE_AREA — serial: name of open lighting area popup
        sendSerial(JOINS.SYSTEM.ACTIVE_AREA, st.label);
    };

    /* Render one .dim-row per available channel into #panelDimmers-page1.
     * Each row carries the channel key + send-join in data-* attributes so
     * the single delegated 'input' listener (in setupAreaPanelControls)
     * doesn't need closures over per-channel state. */
    function renderPanelDimmers(areaKey) {
        const wrap = _gid('panelDimmers');
        if (!wrap) return;
        wrap.innerHTML = '';
        const st = areaState[areaKey];
        if (!st || !st.channels || st.channels.length === 0) {
            wrap.classList.add('hidden');
            return;
        }
        wrap.classList.remove('hidden');
        st.channels.forEach(ch => {
            const lvl = st.levels[ch.key] || 0;
            const row = document.createElement('div');
            row.className = 'dim-row';
            row.dataset.channel = ch.key;
            row.innerHTML = `
              <div class="dim-row-head">
                <span class="dim-row-label">${ch.label}</span>
                <span class="dim-row-value" data-channel="${ch.key}">${lvl}%</span>
              </div>
              <div class="dim-row-track">
                <div class="dim-row-fill" data-channel="${ch.key}" style="width: ${lvl}%"></div>
                <input type="range" class="dim-row-slider"
                       data-channel="${ch.key}"
                       data-send="${ch.send}"
                       min="0" max="100" value="${lvl}"
                       aria-label="${ch.label} dimmer">
              </div>
            `;
            wrap.appendChild(row);
        });
    }

    // ── Channel-name persistence ─────────────────────────────────────────
    function _chLblKey(areaKey, idx) { return 'ch_lbl_' + areaKey + '_' + idx; }
    function getSavedChLabel(areaKey, idx, fallback) {
        try { return localStorage.getItem(_chLblKey(areaKey, idx)) || fallback; }
        catch (e) { return fallback; }
    }
    function saveChLabel(areaKey, idx, label) {
        try { localStorage.setItem(_chLblKey(areaKey, idx), label); }
        catch (e) { /* storage unavailable */ }
    }
    // Escape a string for use inside an HTML attribute value (double-quoted).
    function escAttr(s) {
        return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;')
                        .replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    /* Render one .ch-row per entry in JOINS[section].CHANNELS.
     * Each row has an ON button, an OFF button, and a dimmer slider.
     * To add/remove channels: edit joins1.js → LIGHTS_<AREA>.CHANNELS. */
    function renderPanelChannels(areaKey) {
        const wrap = _gid('panelChannels');
        if (!wrap) return;
        wrap.innerHTML = '';
        const section  = AREA_JOIN_SECTION[areaKey];
        const J_       = section && JOINS[section];
        const channels = (J_ && J_.CHANNELS) || [];
        const st       = areaState[areaKey];

        channels.forEach((ch, i) => {
            const lvl     = (st && st.chLevels && st.chLevels[i] != null) ? st.chLevels[i] : 0;
            const chState = (st && st.chStates) ? (st.chStates[i] || null) : null;
            const row = document.createElement('div');
            row.className = 'ch-row';
            row.dataset.chIndex = String(i);
            row.innerHTML =
                '<div class="ch-row-top">' +
                  '<input type="text" class="ch-name-input"' +
                         ' value="' + escAttr(getSavedChLabel(areaKey, i, ch.label)) + '"' +
                         ' placeholder="Ch ' + (i + 1) + '">' +
                  '<div class="ch-onoff">' +
                    '<button class="ch-btn ch-on-btn' + (chState === 'on'  ? ' ch-btn-active' : '') + '" type="button"' +
                            ' data-ch-on="' + (ch.ON || '') + '"' +
                            ' aria-label="' + ch.label + ' on">ON</button>' +
                    '<button class="ch-btn ch-off-btn' + (chState === 'off' ? ' ch-btn-active ch-off-active' : '') + '" type="button"' +
                            ' data-ch-off="' + (ch.OFF || '') + '"' +
                            ' aria-label="' + ch.label + ' off">OFF</button>' +
                  '</div>' +
                '</div>' +
                '<div class="ch-dim-wrap">' +
                  '<div class="ch-dim-track">' +
                    '<div class="ch-dim-fill" data-ch-fill="' + i + '"' +
                         ' style="width:' + lvl + '%"></div>' +
                    '<input type="range" class="ch-dim-slider"' +
                           ' data-ch-send="' + (ch.DIM_SEND || '') + '"' +
                           ' data-ch-idx="' + i + '"' +
                           ' min="0" max="100" value="' + lvl + '"' +
                           ' aria-label="' + ch.label + ' dimmer">' +
                  '</div>' +
                  '<span class="ch-dim-value" data-ch-val="' + i + '">' + lvl + '%</span>' +
                '</div>';
            wrap.appendChild(row);
        });
    }

    function updateChRowVisual(idx, v) {
        const wrap = _gid('panelChannels');
        if (!wrap) return;
        const fill   = wrap.querySelector('[data-ch-fill="' + idx + '"]');
        const valEl  = wrap.querySelector('[data-ch-val="'  + idx + '"]');
        const slider = wrap.querySelector('[data-ch-idx="'  + idx + '"]');
        if (fill)   fill.style.width = v + '%';
        if (valEl)  valEl.textContent = v + '%';
        if (slider && document.activeElement !== slider) slider.value = v;
    }

    /* Toggle the ON/OFF button active highlight for one channel row. */
    function updateChBtnVisual(wrap, idx, state) {
        const row = wrap.querySelector('.ch-row[data-ch-index="' + idx + '"]');
        if (!row) return;
        const onBtn  = row.querySelector('.ch-on-btn');
        const offBtn = row.querySelector('.ch-off-btn');
        if (onBtn)  onBtn.classList.toggle('ch-btn-active', state === 'on');
        if (offBtn) {
            offBtn.classList.toggle('ch-btn-active',  state === 'off');
            offBtn.classList.toggle('ch-off-active',  state === 'off');
        }
    }

    /* Update state cache + DOM for a single channel's ON/OFF button pair. */
    function setChButtonState(idx, state) {
        if (!currentPanelArea) return;
        const st = areaState[currentPanelArea];
        if (!st) return;
        if (!st.chStates) st.chStates = {};
        st.chStates[idx] = state;
        const wrap = _gid('panelChannels');
        if (wrap) updateChBtnVisual(wrap, idx, state);
    }

    window.closeAreaPanel_page1 = function () {
        _gid('areaPanelOverlay').classList.remove('open');
        _gid('areaPanel').classList.remove('open');
        document.body.style.overflow = '';
        currentPanelArea = null;
    };

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && currentPanelArea) window.closeAreaPanel_page1();
    });

    function refreshPanelStatus() {
        if (!currentPanelArea) return;
        const st  = areaState[currentPanelArea];
        const pill = _gid('panelStatusPill');
        const txt  = _gid('panelStatusText');
        if (!pill || !txt || !st) return;
        pill.className = 'spill';
        if      (st.preset === 'on')  pill.classList.add('sp-on');
        else if (st.preset === 'off') pill.classList.add('sp-off');
        else                          pill.classList.add('sp-dim');
        txt.textContent = (labelFor(currentPanelArea, st.preset) || st.preset).toUpperCase();
    }

    // ====================== LIGHTS: PANEL CONTROLS ======================
    /* Single delegated 'input' listener on #panelDimmers — handles every
     * dimmer channel. Each .dim-row-slider carries its channel key + send
     * join in data-* so the listener can route updates without per-row
     * closures (cleaner when rows are dynamically rebuilt by openAreaPanel). */
    function setupAreaPanelControls() {
        const wrap = _gid('panelChannels');
        if (!wrap) return;

        // Channel name editing — save to localStorage on blur / Enter
        wrap.addEventListener('change', (e) => {
            const inp = e.target.closest('.ch-name-input');
            if (!inp || !currentPanelArea) return;
            const idx = parseInt(inp.closest('.ch-row').dataset.chIndex, 10);
            const label = inp.value.trim() || inp.placeholder;
            inp.value = label;
            saveChLabel(currentPanelArea, idx, label);
        });

        // ON / OFF button taps — delegate from the container
        wrap.addEventListener('click', (e) => {
            const onBtn  = e.target.closest('.ch-on-btn');
            const offBtn = e.target.closest('.ch-off-btn');
            if (onBtn && onBtn.dataset.chOn) {
                const idx = parseInt(onBtn.closest('.ch-row').dataset.chIndex, 10);
                pulse(onBtn.dataset.chOn);
                setChButtonState(idx, 'on');
                if (currentPanelArea && areaState[currentPanelArea]) {
                    if (!areaState[currentPanelArea].chLevels) areaState[currentPanelArea].chLevels = {};
                    areaState[currentPanelArea].chLevels[idx] = 100;
                    updateChRowVisual(idx, 100);
                }
            }
            if (offBtn && offBtn.dataset.chOff) {
                const idx = parseInt(offBtn.closest('.ch-row').dataset.chIndex, 10);
                pulse(offBtn.dataset.chOff);
                setChButtonState(idx, 'off');
                if (currentPanelArea && areaState[currentPanelArea]) {
                    if (!areaState[currentPanelArea].chLevels) areaState[currentPanelArea].chLevels = {};
                    areaState[currentPanelArea].chLevels[idx] = 0;
                    updateChRowVisual(idx, 0);
                }
            }
        });

        // Dimmer slider — delegate from the container
        wrap.addEventListener('input', (e) => {
            const slider = e.target.closest('.ch-dim-slider');
            if (!slider || !currentPanelArea) return;
            const st = areaState[currentPanelArea];
            if (!st) return;
            if (!st.chLevels) st.chLevels = {};
            const send = slider.dataset.chSend;
            const idx  = parseInt(slider.dataset.chIdx, 10);
            const v    = Math.max(0, Math.min(100, parseInt(slider.value, 10) || 0));
            st.chLevels[idx] = v;
            updateChRowVisual(idx, v);
            if (send) sendAnalog(send, v);
        });
    }

    /* Reflect a channel's value back to its row UI (text + fill + slider).
     * Called both on user input and on feedback subscriptions. */
    function updateDimRowVisual(channelKey, level) {
        const wrap = _gid('panelDimmers');
        if (!wrap) return;
        const valueEl = wrap.querySelector('.dim-row-value[data-channel="' + channelKey + '"]');
        if (valueEl) valueEl.textContent = level + '%';
        const fillEl = wrap.querySelector('.dim-row-fill[data-channel="' + channelKey + '"]');
        if (fillEl) fillEl.style.width = level + '%';
        const slider = wrap.querySelector('.dim-row-slider[data-channel="' + channelKey + '"]');
        if (slider && document.activeElement !== slider) slider.value = level;
    }

    function sendAreaPreset(preset) {
        if (!currentPanelArea) return;
        const st   = areaState[currentPanelArea];
        const join = st?.joins[preset];
        if (join) {
            pulse(join); // join = data-join-<preset> on card = J1.LIGHTS_<AREA>.<PRESET>
        } else {
            console.warn('[lights] No join for preset "' + preset + '" on area "' + currentPanelArea + '"');
        }
        setAreaVisual(currentPanelArea, preset);
    }

    // ====================== LIGHTS: LAMP TOGGLE ======================
    window.handleAreaLampToggle_page1 = function (key, event) {
        if (event) event.stopPropagation();
        const st = areaState[key];
        if (!st) return;
        const preset = st.isOn ? 'off' : 'on';
        const join   = st.joins[preset];
        if (join) {
            pulse(join); // join = data-join-on/off on card = J1.LIGHTS_<AREA>.ON/OFF
        } else {
            console.warn('[lights] No data-join-' + preset + ' on area "' + key + '"');
        }
        setAreaVisual(key, preset);
    };

    // ====================== LIGHTS: PANEL ARC DIAL ======================
    function updatePanelDial(pct) {
        const fill  = _gid('panel-arc-fill');
        const label = _gid('panel-arc-label');
        if (!fill) return;
        const cx = 100, cy = 105, r = 76;
        const rad = (-180 + pct * 1.8) * Math.PI / 180;
        const ex = cx + r * Math.cos(rad);
        const ey = cy + r * Math.sin(rad);
        if      (pct <= 0)   fill.setAttribute('d', 'M 24 105 A 76 76 0 0 1 24.001 105');
        else if (pct >= 100) fill.setAttribute('d', 'M 24 105 A 76 76 0 0 1 176 105');
        else {
            fill.setAttribute('d',
                `M 24 105 A 76 76 0 ${pct > 50 ? 1 : 0} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`);
        }
        if (label) label.textContent = pct + '%';
    }

    // ====================== LIGHTS: FEEDBACK SUBSCRIPTIONS ======================
    function setupLightsFeedback() {
        if (!hasCrestron()) return;
        Object.keys(areaState).forEach(key => {
            const st = areaState[key];

            // A ← per-channel dimmer feedback. Subscribes to every channel
            // declared on the card (Main / Accent / Wall — only the ones
            // actually present, since channels[] only contains those).
            (st.channels || []).forEach(ch => {
                if (!ch.fb) return;
                subAnalog(ch.fb, (val) => {
                    const v = Math.max(0, Math.min(100, parseInt(val, 10) || 0));
                    st.levels[ch.key] = v;
                    if (ch.key === 'main') st.level = v;
                    if (currentPanelArea === key) updateDimRowVisual(ch.key, v);
                });
            });

            // D ← preset feedback (join = send join + 100, per convention in joins1.js)
            const FB_OFFSET = 100;
            st.presets.forEach(preset => {
                const sendJoin = st.joins[preset];
                if (!sendJoin) return;
                const fbJoin = String(parseInt(sendJoin, 10) + FB_OFFSET);
                subBool(fbJoin, (isHigh) => {
                    if (isHigh) setAreaVisual(key, preset);
                });
            });
        });
    }

    // ====================== SHADES ======================
    // New design: animated window preview + arrow control buttons.
    // Joins come from data-join-* attributes on each .shade-card in page1.html
    // and must match the J1.SHADES.* constants in joins1.js.
    const SHADE_TRAVEL_MS = 38000;   // full 0 → 100 traverse time (38 s per real motor speed)
    const shadeState = {};

    function setupShades() {
        _qsa('.shade-card').forEach(card => buildShadeCard(card));
        updateShadesOpenCount();
    }

    function buildShadeCard(card) {
        const key      = card.dataset.shade;
        const label    = card.dataset.label       || 'Shade';
        const icon     = card.dataset.icon        || '🪟';
        const joinOpen = card.dataset.joinOpen;   // = J1.SHADES.<n>_OPEN
        const joinClose= card.dataset.joinClose;  // = J1.SHADES.<n>_CLOSE
        const joinStop = card.dataset.joinStop;   // = J1.SHADES.<n>_STOP
        const joinFb   = card.dataset.joinFb;     // = J1.SHADES.<n>_FB
        const isVert   = (card.dataset.orientation || 'vertical') === 'vertical';

        shadeState[key] = {
            pos:       0,
            isOpen:    false,
            direction: null,   // null | 'opening' | 'closing'
            startedAt: 0,
            startPos:  0,
            rafId:     null
        };

        card.innerHTML = `
          <div class="sc-top">
            <span class="sc-icon">${icon}</span>
            <div class="sc-info">
              <div class="sc-name">${label}</div>
              <div class="sc-status" id="sstat-${key}${PAGE_SUFFIX}">
                <span class="sc-dot"></span>
                <span id="sstat-txt-${key}${PAGE_SUFFIX}">Closed</span>
              </div>
            </div>
            <span class="sc-pct" id="spct-${key}${PAGE_SUFFIX}">0%</span>
          </div>
          <div class="sc-bar">
            <div class="sc-bar-fill" id="sbar-${key}${PAGE_SUFFIX}"></div>
          </div>
          <div class="sc-actions">
            <button class="sc-btn sc-btn-open" id="sopen-${key}${PAGE_SUFFIX}">
              <span class="sc-btn-ico">▲</span>
              <span class="sc-btn-lbl">Open</span>
            </button>
            <button class="sc-btn sc-btn-stop" id="sstop-${key}${PAGE_SUFFIX}">
              <span class="sc-btn-ico">■</span>
              <span class="sc-btn-lbl">Stop</span>
            </button>
            <button class="sc-btn sc-btn-close" id="sclose-${key}${PAGE_SUFFIX}">
              <span class="sc-btn-ico">▼</span>
              <span class="sc-btn-lbl">Close</span>
            </button>
          </div>
        `;

        // Wire up control buttons
        const openBtn  = document.getElementById('sopen-'  + key + PAGE_SUFFIX);
        const stopBtn  = document.getElementById('sstop-'  + key + PAGE_SUFFIX);
        const closeBtn = document.getElementById('sclose-' + key + PAGE_SUFFIX);

        if (openBtn) openBtn.addEventListener('click', () => {
            pulse(joinOpen);
            startShadeMotion(key, 'opening');
            flashBtn(openBtn);
        });
        if (closeBtn) closeBtn.addEventListener('click', () => {
            pulse(joinClose);
            startShadeMotion(key, 'closing');
            flashBtn(closeBtn);
        });
        if (stopBtn) stopBtn.addEventListener('click', () => {
            pulse(joinStop);
            stopShadeMotion(key);
            flashBtn(stopBtn);
        });

        // Initial visual at pos 0 (closed)
        renderShadeVisual(key, 0, isVert);

        // A ← J1.SHADES.<n>_FB — position feedback 0–100
        // If a real FB join is wired, it overrides the local timer estimate:
        // any incoming value clears direction + rafId so tickShade stops fighting it.
        if (joinFb && hasCrestron()) {
            subAnalog(joinFb, (val) => {
                const v = Math.max(0, Math.min(100, parseInt(val, 10) || 0));
                const st = shadeState[key];
                if (st && st.rafId) { cancelAnimationFrame(st.rafId); st.rafId = null; }
                if (st) {
                    st.direction = null;
                    st.pos       = v;
                    st.isOpen    = v > 5;
                }
                renderShadeVisual(key, v, isVert);
                updateShadeFeedback(key, v);
                updateShadesOpenCount();
            });
        }
    }

    function flashBtn(btn) {
        btn.classList.add('sc-btn-flash');
        setTimeout(() => btn.classList.remove('sc-btn-flash'), 220);
    }

    function renderShadeVisual(key, pos /*, isVert */) {
        // pos: 0 = fully closed, 100 = fully open. The bar fill represents how open it is.
        const bar = document.getElementById('sbar-' + key + PAGE_SUFFIX);
        if (bar) bar.style.width = pos + '%';
        const pct = document.getElementById('spct-' + key + PAGE_SUFFIX);
        if (pct) pct.textContent = pos + '%';
    }

    function setShadeStatusText(key, text) {
        const el = document.getElementById('sstat-txt-' + key + PAGE_SUFFIX);
        if (el) el.textContent = text;
    }

    function setShadeCardState(card, state) {
        card.classList.remove('sc-s-open', 'sc-s-closed', 'sc-s-moving', 'sc-s-stopped');
        if (state) card.classList.add('sc-s-' + state);
    }

    function startShadeMotion(key, dir) {
        const st = shadeState[key];
        if (!st) return;
        // Already at the destination? No-op.
        if (dir === 'opening' && st.pos >= 100 && st.direction === null) return;
        if (dir === 'closing' && st.pos <= 0   && st.direction === null) return;
        // Already moving the same direction? Let the existing animation continue.
        if (st.direction === dir) return;

        if (st.rafId) cancelAnimationFrame(st.rafId);

        st.direction = dir;
        st.startedAt = performance.now();
        st.startPos  = st.pos;

        setShadeStatusText(key, dir === 'opening' ? 'Opening…' : 'Closing…');
        const card = _qs(`[data-shade="${key}"]`);
        if (card) setShadeCardState(card, 'moving');

        tickShade(key);
    }

    function tickShade(key) {
        const st = shadeState[key];
        if (!st || !st.direction) return;

        const elapsed = performance.now() - st.startedAt;
        const delta   = (elapsed / SHADE_TRAVEL_MS) * 100;
        let pos;
        if (st.direction === 'opening') pos = Math.min(100, st.startPos + delta);
        else                            pos = Math.max(0,   st.startPos - delta);

        st.pos    = pos;
        st.isOpen = pos > 5;
        renderShadeVisual(key, Math.round(pos));
        updateShadesOpenCount();

        const done = (st.direction === 'opening' && pos >= 100)
                  || (st.direction === 'closing' && pos <= 0);

        if (done) {
            st.direction = null;
            st.rafId     = null;
            const card = _qs(`[data-shade="${key}"]`);
            if (card) setShadeCardState(card, pos >= 100 ? 'open' : 'closed');
            setShadeStatusText(key, pos >= 100 ? 'Opened' : 'Closed');
            return;
        }

        st.rafId = requestAnimationFrame(() => tickShade(key));
    }

    function stopShadeMotion(key) {
        const st = shadeState[key];
        if (!st) return;
        if (st.rafId) cancelAnimationFrame(st.rafId);
        st.rafId     = null;
        st.direction = null;

        const pct  = Math.round(st.pos);
        const card = _qs(`[data-shade="${key}"]`);
        if (card) setShadeCardState(card, 'stopped');
        setShadeStatusText(key, `Stopped at ${pct}%`);
    }

    function updateShadeFeedback(key, pos) {
        const card = _qs(`[data-shade="${key}"]`);
        if (card) {
            if      (pos >= 95) setShadeCardState(card, 'open');
            else if (pos <= 5)  setShadeCardState(card, 'closed');
            else                setShadeCardState(card, 'moving');
        }
        setShadeStatusText(key, pos >= 95 ? 'Open' : pos <= 5 ? 'Closed' : pos + '%');
    }

    function updateShadesOpenCount() {
        const badge = _gid('shadesOpenCount');
        if (badge) badge.textContent = Object.values(shadeState).filter(s => s.isOpen).length + ' open';
    }

    // ====================== CLIMATE: AC + HEATER ======================

    window.switchACSubWidget_page1 = function (subwidgetName, clickedBtn) {
        const root = _gid('widget-ac');
        if (!root) return;
        root.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
        if (clickedBtn) clickedBtn.classList.add('active');
        root.querySelectorAll('.ac-subwidget').forEach(w => w.classList.remove('active'));
        // HTML calls this with 'ac-ac' / 'ac-heater' (no suffix); the real
        // ids are 'ac-ac-page1' / 'ac-heater-page1'. _gid() applies
        // PAGE_SUFFIX so the lookup actually finds the element.
        const el = _gid(subwidgetName);
        if (el) el.classList.add('active');
    };

    function setupAC() {

        /* Shared arc-dial factory for AC and Heater.
         * All joins are passed in by the caller via analogSendJoin / analogFbJoin
         * which are set to J1.AC.* or J1.HEATER.* values below.
         *   analogSendJoin   panel -> SIMPL  (setpoint write)
         *   analogSpFbJoin   panel <- SIMPL  (setpoint echo / current SP)
         *   analogFbJoin     panel <- SIMPL  (room temp)
         *   powerFbJoin      panel <- SIMPL  (digital, true = power on)
         */
        function makeDialController({ trackBgId, arcPathId, ticksId, dialTempId,
                                      MIN, MAX, getTemp, setTemp,
                                      analogSendJoin, analogSpFbJoin, analogFbJoin,
                                      powerBtnId, powerFbJoin,
                                      cardSel, statusBadgeId, statusLabel }) {

            const CX = 110, CY = 110, R = 88;
            const START_DEG = 145, TOTAL_DEG = 250;

            // All these ids are page-suffixed in the HTML
            // (e.g. acArcPath-page1) so we MUST go through _gid() — using
            // raw document.getElementById() returns null and the dial,
            // ticks, temperature read-out and power-button click handler
            // all silently no-op (= "the line bar disappeared, the
            // enable / +/- buttons do nothing").
            const card        = _qs(cardSel);
            const powerBtn    = _gid(powerBtnId);
            const arcPath     = _gid(arcPathId);
            const trackBg     = _gid(trackBgId);
            const ticksG      = _gid(ticksId);
            const dialTemp    = _gid(dialTempId);
            const statusBadge = statusBadgeId ? _gid(statusBadgeId) : null;
            let isOn = true;

            const degToRad = d => d * Math.PI / 180;
            function polarPoint(deg) {
                return { x: CX + R * Math.cos(degToRad(deg)), y: CY + R * Math.sin(degToRad(deg)) };
            }
            function arcD(fromDeg, toDeg) {
                const s = polarPoint(fromDeg), e = polarPoint(toDeg);
                let sweep = toDeg - fromDeg; if (sweep < 0) sweep += 360;
                return `M ${s.x} ${s.y} A ${R} ${R} 0 ${sweep > 180 ? 1 : 0} 1 ${e.x} ${e.y}`;
            }
            function buildTicks() {
                if (!ticksG) return;
                ticksG.innerHTML = '';
                for (let i = 0; i <= 15; i++) {
                    const deg = START_DEG + (i / 15) * TOTAL_DEG;
                    const pt  = polarPoint(deg);
                    const ln  = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    ln.setAttribute('x1', pt.x); ln.setAttribute('y1', pt.y);
                    ln.setAttribute('x2', CX + (R - 8) * Math.cos(degToRad(deg)));
                    ln.setAttribute('y2', CY + (R - 8) * Math.sin(degToRad(deg)));
                    ln.setAttribute('stroke', 'rgba(255,255,255,0.25)');
                    ln.setAttribute('stroke-width', i % 5 === 0 ? '2' : '1');
                    ln.setAttribute('stroke-linecap', 'round');
                    ticksG.appendChild(ln);
                }
            }
            function updateDial() {
                if (!arcPath || !trackBg) return;
                const endDeg = START_DEG + ((getTemp() - MIN) / (MAX - MIN)) * TOTAL_DEG;
                trackBg.setAttribute('d', arcD(START_DEG, START_DEG + TOTAL_DEG));
                arcPath.setAttribute('d', arcD(START_DEG, endDeg));
                if (dialTemp) dialTemp.textContent = getTemp() + '°';
            }
            function updatePowerUI() {
                if (!powerBtn) return;
                powerBtn.dataset.on = isOn ? 'true' : 'false';
                if (card) card.classList.toggle('ac-is-off', !isOn);
                if (statusBadge) statusBadge.textContent = (statusLabel || 'Master Robe') + ' • ' + (isOn ? 'ON' : 'OFF');
            }
            function flashBtn(btn) {
                if (!btn) return;
                btn.classList.remove('ac-flash');
                void btn.offsetWidth;
                btn.classList.add('ac-flash');
                setTimeout(() => btn.classList.remove('ac-flash'), 400);
            }

            // Local-tap toggle (optimistic UI). The real source of truth is powerFbJoin
            // below — when SIMPL echoes the new state, it overrides our optimistic flip.
            powerBtn?.addEventListener('click', () => { isOn = !isOn; updatePowerUI(); });

            // D ← power state feedback (e.g. J1.AC.POWER_FB / J1.HEATER.POWER_FB).
            // Lets SIMPL drive the panel UI when power is changed externally
            // (house-mode scene, all-off, voice control, etc.).
            if (powerFbJoin) {
                subBool(powerFbJoin, (val) => {
                    isOn = !!val;
                    updatePowerUI();
                });
            }

            // A ← room temp feedback — analogFbJoin = J1.AC.ROOM_TEMP_FB or J1.HEATER.ROOM_TEMP_FB
            if (analogFbJoin) {
                subAnalog(analogFbJoin, (val) => {
                    const el = dialTempId === 'acDialTemp'
                        ? _gid('acCurrentTemp')
                        : _gid('htrCurrentTemp');
                    if (el) el.textContent = Math.round(val) + '°';
                });
            }

            // A ← setpoint feedback. Defaults to analogSendJoin so AC (which has
            // SP_SEND === SP_FB) still works without an explicit analogSpFbJoin.
            const spFbToWatch = analogSpFbJoin || analogSendJoin;
            if (spFbToWatch) {
                subAnalog(spFbToWatch, (val) => {
                    setTemp(Math.max(MIN, Math.min(MAX, Math.round(val))));
                    updateDial();
                });
            }

            buildTicks(); updateDial(); updatePowerUI();
            return { updateDial, flashBtn, isOnRef: () => isOn };
        }

        /* ── AC sub-widget ──────────────────────────────────────────────────── */
        let acSetTemp = 17, acMode = 'cool', acFan = 'high';
        const AC_MIN = 16, AC_MAX = 30;

        const acCtrl = makeDialController({
            trackBgId: 'acTrackBg', arcPathId: 'acArcPath',
            ticksId:   'acTicks',   dialTempId: 'acDialTemp',
            MIN: AC_MIN, MAX: AC_MAX,
            getTemp: () => acSetTemp,
            setTemp: (v) => { acSetTemp = v; },
            analogSendJoin: JOINS.AC.SP_SEND,       // A → target temp
            analogSpFbJoin: JOINS.AC.SP_FB,         // A ← setpoint echo (same join here, but explicit)
            analogFbJoin:   JOINS.AC.ROOM_TEMP_FB,  // A ← room temp
            powerBtnId:    'acPowerBtn',
            powerFbJoin:   JOINS.AC.POWER_FB,       // D ← power state from SIMPL
            cardSel:       '#ac-ac-page1 .ac-card',
            statusBadgeId: 'acStatusBadge',
            statusLabel:   'Master Robe'
        });

        // D → J1.AC.POWER — AC power toggle
        _gid('acPowerBtn')?.addEventListener('click', () => pulse(JOINS.AC.POWER));

        // AC setpoint − / +
        const acDecBtn = _gid('acDecBtn');
        const acIncBtn = _gid('acIncBtn');
        acDecBtn?.addEventListener('click', () => {
            if (!acCtrl.isOnRef() || acSetTemp <= AC_MIN) return;
            acSetTemp--;
            acCtrl.updateDial();
            sendAnalog(JOINS.AC.SP_SEND, acSetTemp); // A → J1.AC.SP_SEND
            acCtrl.flashBtn(acDecBtn);
        });
        acIncBtn?.addEventListener('click', () => {
            if (!acCtrl.isOnRef() || acSetTemp >= AC_MAX) return;
            acSetTemp++;
            acCtrl.updateDial();
            sendAnalog(JOINS.AC.SP_SEND, acSetTemp); // A → J1.AC.SP_SEND
            acCtrl.flashBtn(acIncBtn);
        });

        // AC mode buttons — data-join on each button must match J1.AC.MODE_* in joins1.js
        _qsa('.ac-mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!acCtrl.isOnRef()) return;
                acMode = btn.dataset.mode;
                _qsa('.ac-mode-btn').forEach(b =>
                    b.classList.toggle('ac-mode-active', b.dataset.mode === acMode));
                pulse(btn.dataset.join); // data-join = J1.AC.MODE_*
            });
        });

        // D ← AC mode feedback — sync active highlight when SIMPL changes mode
        const AC_MODE_FB = {
            auto: JOINS.AC.MODE_AUTO_FB,    cool: JOINS.AC.MODE_COOL_FB,
            heat: JOINS.AC.MODE_HEAT_FB,    dry:  JOINS.AC.MODE_DRY_FB,
            fan:  JOINS.AC.MODE_FAN_ONLY_FB
        };
        Object.entries(AC_MODE_FB).forEach(([modeKey, join]) => {
            if (!join) return;
            subBool(join, (val) => {
                if (!val) return;        // only react to TRUE — the active mode pulse
                acMode = modeKey;
                _qsa('.ac-mode-btn').forEach(b =>
                    b.classList.toggle('ac-mode-active', b.dataset.mode === modeKey));
            });
        });

        // AC fan buttons — data-join on each button must match J1.AC.FAN_* in joins1.js
        _qsa('.ac-fan-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!acCtrl.isOnRef()) return;
                acFan = btn.dataset.fan;
                _qsa('.ac-fan-btn').forEach(b =>
                    b.classList.toggle('ac-fan-active', b.dataset.fan === acFan));
                pulse(btn.dataset.join); // data-join = J1.AC.FAN_*
            });
        });

        // D ← AC fan feedback — sync active highlight when SIMPL changes fan speed
        const AC_FAN_FB = {
            auto: JOINS.AC.FAN_AUTO_FB,  low:  JOINS.AC.FAN_LOW_FB,
            med:  JOINS.AC.FAN_MED_FB,   high: JOINS.AC.FAN_HIGH_FB
        };
        Object.entries(AC_FAN_FB).forEach(([fanKey, join]) => {
            if (!join) return;
            subBool(join, (val) => {
                if (!val) return;
                acFan = fanKey;
                _qsa('.ac-fan-btn').forEach(b =>
                    b.classList.toggle('ac-fan-active', b.dataset.fan === fanKey));
            });
        });

        /* ── Heater sub-widget ─────────────────────────────────────────────── */
        let htrSetTemp = 22;
        const HTR_MIN = 16, HTR_MAX = 35;

        const htrCtrl = makeDialController({
            trackBgId: 'htrTrackBg', arcPathId: 'htrArcPath',
            ticksId:   'htrTicks',   dialTempId: 'htrDialTemp',
            MIN: HTR_MIN, MAX: HTR_MAX,
            getTemp: () => htrSetTemp,
            setTemp: (v) => { htrSetTemp = v; },
            analogSendJoin: JOINS.HEATER.SP_SEND,       // A → target temp
            analogSpFbJoin: JOINS.HEATER.SP_FB,         // A ← setpoint feedback (different join!)
            analogFbJoin:   JOINS.HEATER.ROOM_TEMP_FB,  // A ← room temp
            powerBtnId:    'htrPowerBtn',
            powerFbJoin:   JOINS.HEATER.POWER_FB,       // D ← power state from SIMPL
            cardSel:       '#ac-heater-page1 .ac-card',
            statusBadgeId: null
        });

        // D → J1.HEATER.POWER — heater power toggle
        _gid('htrPowerBtn')?.addEventListener('click', () => pulse(JOINS.HEATER.POWER));

        // Heater setpoint − / +
        const htrDecBtn = _gid('htrDecBtn');
        const htrIncBtn = _gid('htrIncBtn');
        htrDecBtn?.addEventListener('click', () => {
            if (!htrCtrl.isOnRef() || htrSetTemp <= HTR_MIN) return;
            htrSetTemp--;
            htrCtrl.updateDial();
            sendAnalog(JOINS.HEATER.SP_SEND, htrSetTemp); // A → J1.HEATER.SP_SEND
            htrCtrl.flashBtn(htrDecBtn);
        });
        htrIncBtn?.addEventListener('click', () => {
            if (!htrCtrl.isOnRef() || htrSetTemp >= HTR_MAX) return;
            htrSetTemp++;
            htrCtrl.updateDial();
            sendAnalog(JOINS.HEATER.SP_SEND, htrSetTemp); // A → J1.HEATER.SP_SEND
            htrCtrl.flashBtn(htrIncBtn);
        });
    }

    // ====================== TV ======================
    function setupTV() {
        // The TV-remote (tv-controls) UI was removed; the main TV view now
        // only shows the receiver launchers (inline onclick -> openAppPanel_page1).
        // Wire the app-remote view buttons (joins resolved per active receiver).
        wireAppPanelButtons();
    }

    // ====================== APP REMOTE POPUP ======================
    /* The 5 quick-grid buttons (OSN / Apple TV / BeIN / Shahid / Netflix)
     * all open the same .app-panel modal. The dpad + keypad buttons inside
     * the modal have generic ids (e.g. appDpadUp-page1, appKey1-page1) and
     * a single click handler that reads window.__activeApp_page1 and pulses
     * the matching join from J1.APPS.<APP_KEY>. This keeps the DOM small
     * (one set of buttons, not 5×) and means new apps are added by editing
     * ONLY (a) the quick-grid in page1.html and (b) joins1.js → APPS. */
    const APP_META = {
        osn:     { label: 'OSN',         icon: '🛰️', joinKey: 'OSN'     },
        bein:    { label: 'BeIN Sports', icon: '⚽', joinKey: 'BEIN'    },
        freesat: { label: 'Freesat',     icon: '📡', joinKey: 'FREESAT' },
    };
    let _activeApp = null;

    function appJoin(key) {
        // Look up a join name (e.g. 'DPAD_UP') in the active app's section.
        if (!_activeApp) return null;
        const meta = APP_META[_activeApp];
        const sec  = meta && JOINS.APPS && JOINS.APPS[meta.joinKey];
        return sec ? sec[key] : null;
    }

    function wireAppPanelButtons() {
        // Dpad
        _gid('appDpadUp')   ?.addEventListener('click', () => pulse(appJoin('DPAD_UP')));
        _gid('appDpadDown') ?.addEventListener('click', () => pulse(appJoin('DPAD_DOWN')));
        _gid('appDpadLeft') ?.addEventListener('click', () => pulse(appJoin('DPAD_LEFT')));
        _gid('appDpadRight')?.addEventListener('click', () => pulse(appJoin('DPAD_RIGHT')));
        _gid('appDpadOk')   ?.addEventListener('click', () => pulse(appJoin('DPAD_OK')));

        // Numeric keys 0..9
        for (let i = 0; i <= 9; i++) {
            const btn = document.getElementById('appKey' + i + PAGE_SUFFIX);
            if (btn) btn.addEventListener('click', () => pulse(appJoin('KEY_' + i)));
        }

        // Function keys
        _gid('appBack')     ?.addEventListener('click', () => pulse(appJoin('KEY_BACK')));
        _gid('appHome')     ?.addEventListener('click', () => pulse(appJoin('KEY_HOME')));
        _gid('appMenu')     ?.addEventListener('click', () => pulse(appJoin('KEY_MENU')));
        _gid('appExitBtn')?.addEventListener('click', () => pulse(appJoin('EXIT')));

        // Power, source, vol, ch, mute — each receiver has its own joins.
        _gid('appPowerBtn')  ?.addEventListener('click', () => pulse(appJoin('POWER')));
        _gid('appSourceBtn') ?.addEventListener('click', () => pulse(appJoin('SOURCE')));
        _gid('appVolUpBtn')  ?.addEventListener('click', () => pulse(appJoin('VOL_UP')));
        _gid('appVolDownBtn')?.addEventListener('click', () => pulse(appJoin('VOL_DOWN')));
        _gid('appMuteBtn')   ?.addEventListener('click', () => pulse(appJoin('MUTE')));
        _gid('appChUpBtn')   ?.addEventListener('click', () => pulse(appJoin('CH_UP')));
        _gid('appChDownBtn') ?.addEventListener('click', () => pulse(appJoin('CH_DOWN')));
    }

    /* Swap the TV widget content: hide the main TV view, show the per-app
     * remote view in its place. No overlay, no popup — both views are
     * siblings inside #widget-tv-page1 and toggle via the [hidden] attr. */
    window.openAppPanel_page1 = function(appKey) {
        const meta = APP_META[appKey];
        if (!meta) { console.warn('[apps] Unknown app key:', appKey); return; }
        _activeApp = appKey;
        // Pulse the per-room launcher join (see JOINS.LAUNCHERS in joins1.js).
        const launchJoin = JOINS.LAUNCHERS && JOINS.LAUNCHERS[appKey.toUpperCase()];
        if (launchJoin) pulse(launchJoin);
        const titleEl = _gid('appPanelTitle');
        const icoEl   = _gid('appPanelIco');
        const subEl   = _gid('appPanelSub');
        if (titleEl) titleEl.textContent = meta.label;
        if (icoEl)   icoEl.textContent   = meta.icon;
        if (subEl)   subEl.textContent   = meta.label + ' Remote';
        _gid('tvMainView')?.setAttribute('hidden', '');
        _gid('tvAppView') ?.removeAttribute('hidden');
    };

    window.closeAppPanel_page1 = function() {
        _gid('tvAppView') ?.setAttribute('hidden', '');
        _gid('tvMainView')?.removeAttribute('hidden');
        _activeApp = null;
    };

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && _activeApp) window.closeAppPanel_page1();
    });

    // ====================== MUSIC WIDGET ======================
    /* Five buttons:
     *   • Air Play  (centred)  → J1.MUSIC.AIRPLAY
     *   • Vol +                → J1.MUSIC.VOL_UP
     *   • Vol −                → J1.MUSIC.VOL_DOWN
     *   • Mute                 → J1.MUSIC.MUTE
     *   • Power Off            → J1.MUSIC.POWER_OFF
     * Each click pulses one digital join. Edit joins1.js → MUSIC to
     * change a join number; do NOT hardcode numbers here. */
    function setupMusic() {
        const M = JOINS && JOINS.MUSIC;
        if (!M) return;

        const wire = (id, joinName, label) => {
            const btn  = _gid(id);
            const join = M[joinName];
            if (!btn || !join) return;
            btn.addEventListener('click', () => {
                pulse(join);
                console.log(`[Music] ${label} → Digital Join ${join}`);
            });
        };

        wire('musicAirPlayBtn', 'AIRPLAY',   'Air Play');
        wire('musicVolUpBtn',   'VOL_UP',    'Vol +');
        wire('musicVolDownBtn', 'VOL_DOWN',  'Vol −');
        wire('musicMuteBtn',    'MUTE',      'Mute');
        wire('musicPowerBtn',   'POWER_OFF', 'Power Off');

        // NOTE: do NOT subscribe to MUSIC.MUTE here. MUTE (join 706) is a
        // GLOBAL momentary join that every page's mute button publishes.
        // Subscribing to it registers a native feedback subscription in
        // CrComLib's shared signal state; because Ch5SignalBridge.publish()
        // calls unsubscribe() on the join each time it is published, that
        // subscription swallows the first press's rising edge — forcing a
        // second tap before the mute reaches SIMPL, on EVERY page (volume
        // joins, which are never subscribed, work on a single press). Mute
        // must stay a pure publisher like Vol+/Vol−/Power Off.
    }

    // ====================== LIGHTS: AREA ROW FEEDBACK ======================
    // Subscribe to every area-row button's join (same join number that the
    // button pulses). SIMPL echoes it HIGH while that preset is active.
    // No HTML changes needed — join paths are parsed from the onclick attr.
    function setupAreaRowFeedback() {
        if (!hasCrestron()) return;
        _qsa('.area-btn').forEach(btn => {
            const oc   = btn.getAttribute('onclick') || '';
            const m    = oc.match(/tap_page\d+\('([^']+)'\)/);
            if (!m) return;
            const join = _resolveJoin_page1(m[1]);
            if (!join) return;
            const rowBtns = btn.closest('.area-row-btns');
            // Derive preset + area key from the button's classes / parent
            const areaRow = btn.closest('.area-row[data-area]');
            const areaKey = areaRow ? areaRow.dataset.area : null;
            const preset  = btn.classList.contains('ab-on')    ? 'on'
                          : btn.classList.contains('ab-dim')   ? 'dim'
                          : btn.classList.contains('ab-relax') ? 'relax'
                          : btn.classList.contains('ab-off')   ? 'off'
                          : null;
            subBool(join, (val) => {
                // Only react to HIGH — removing on LOW would fight the
                // optimistic highlight set by the click listener above.
                if (!val) return;
                if (rowBtns) rowBtns.querySelectorAll('.area-btn').forEach(b => b.classList.remove('ab-active'));
                btn.classList.add('ab-active');
                // Also sync channel bars + states when SIMPL drives the change
                if (areaKey && preset) setAreaVisual(areaKey, preset);
            });
        });
    }

    // ====================== LIGHTS: CHANNEL FEEDBACK ======================
    // Two subscriptions per channel:
    //   D ← ch.ON  (SAME join the ON button pulses) — SIMPL holds HIGH while
    //               the channel is on, LOW when off.  Drives button state.
    //   A ← ch.DIM_FB — dimmer level 0-100.  Drives the slider bar.
    function setupChannelFeedback() {
        if (!hasCrestron()) return;
        Object.keys(areaState).forEach(areaKey => {
            const section  = AREA_JOIN_SECTION[areaKey];
            const J_       = section && JOINS[section];
            const channels = J_ && J_.CHANNELS;
            if (!channels) return;
            const st = areaState[areaKey];
            if (!st.chLevels) st.chLevels = {};
            if (!st.chStates) st.chStates = {};

            channels.forEach((ch, i) => {
                // D ← ON join feedback — same number as the ON button.
                // HIGH = channel on, LOW = channel off.
                if (ch.ON) {
                    subBool(ch.ON, (val) => {
                        const state = val ? 'on' : 'off';
                        st.chStates[i] = state;
                        if (!val) {
                            // SIMPL went LOW → channel is off → zero the bar
                            st.chLevels[i] = 0;
                            if (currentPanelArea === areaKey) updateChRowVisual(i, 0);
                        } else if (!ch.DIM_FB) {
                            // No dimmer join — show full bar when on
                            st.chLevels[i] = 100;
                            if (currentPanelArea === areaKey) updateChRowVisual(i, 100);
                        }
                        if (currentPanelArea === areaKey) {
                            const wrap = _gid('panelChannels');
                            if (wrap) updateChBtnVisual(wrap, i, state);
                        }
                    });
                }

                // A ← DIM_FB — dimmer level 0-100.  Also syncs button state
                // when SIMPL dims a channel to 0 without pulsing the OFF join.
                if (ch.DIM_FB) {
                    subAnalog(ch.DIM_FB, (val) => {
                        const v = Math.max(0, Math.min(100, parseInt(val, 10) || 0));
                        st.chLevels[i] = v;
                        if (currentPanelArea === areaKey) updateChRowVisual(i, v);
                        // Derive on/off state from level so buttons stay in sync
                        const state = v > 0 ? 'on' : 'off';
                        if (st.chStates[i] !== state) {
                            st.chStates[i] = state;
                            if (currentPanelArea === areaKey) {
                                const wrap = _gid('panelChannels');
                                if (wrap) updateChBtnVisual(wrap, i, state);
                            }
                        }
                    });
                }
            });
        });
    }

    // ====================== FEEDBACK: GLOBAL ======================
    function setupFeedbackSubscriptions() {
        if (!hasCrestron()) return;
        setupLightsFeedback();
        setupAreaRowFeedback();
        setupChannelFeedback();
    }

    function requestCurrentStatus() {
        // D → J1.SYSTEM.REQUEST_STATUS — ask CP4 to resend all feedback
        pulse(JOINS.SYSTEM.REQUEST_STATUS);
    }

    function notifyActivePage() {
        if (!hasCrestron()) return;
        // D → J1.SYSTEM.PAGE_ACTIVE — tell CH5 shell page1 is the active page
        CrComLib.publishEvent('b', JOINS.SYSTEM.PAGE_ACTIVE, true);
    }

    // ====================== CLOCK ======================
    // ====================== BOOTSTRAP ======================
    // ▸▸▸ EDIT-FOR-PAGE-N: change 'page1-import-page' to 'page<N>-import-page'
    //                      so the shell's loaded-event matches this page's
    //                      ch5-import-htmlsnippet id (auto-generated by
    //                      `npm run generate:page`).
    if (hasCrestron()) {
        // IMPORTANT: do NOT unsubscribe after the first fire. CH5's
        // import-snippet republishes `{loaded:true}` every time the user
        // navigates back to page1, and we need to re-apply the saved
        // active widget on each return. We keep the subscription alive
        // and use a one-shot guard so the heavy onInit() (which wires
        // event listeners, builds AC dials, etc.) only runs once.
        let initDone = false;
        CrComLib.subscribeState(
            'o',
            'ch5-import-htmlsnippet:page1-import-page',
            (value) => {
                if (!value || !value['loaded']) return;
                if (!initDone) {
                    onInit();
                    initDone = true;
                } else {
                    // Subsequent returns to page1 — restore the widget
                    // the user had selected last time.
                    applyStoredWidget(/*fallbackToHtmlActive*/ false);
                }
            }
        );
    } else {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', onInit);
        } else {
            onInit();
        }
    }

    return {};
})();
