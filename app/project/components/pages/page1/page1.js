/* page1.js — Smart Home Control (4 Widgets)
 * v5 changes (pill card + long-press):
 *   - Area cards are now horizontal PILLS: circular lamp button on the
 *     left, room name on the right.
 *   - The lamp icon IS the ON/OFF toggle. Tapping it pulses the 'on' or
 *     'off' preset and flips the amber-glow visual state. It stays in
 *     sync with preset buttons and feedback from CP4.
 *   - HOLDING the card body for LONG_PRESS_MS ms opens the detail popup
 *     (default 2000ms). Taps on the lamp don't trigger the long-press;
 *     moving the finger > 10px or releasing early cancels it. A blue
 *     progress fill sweeps across the card during the hold (CSS).
 *
 * v4 (kept):
 *   - Preset system is CATALOG-DRIVEN via window.LIGHT_PRESETS and each
 *     card's data-presets + data-join-<key> attributes.
 *   - 13 preset keys supported by default (on/off/dim/relax/tv/guest/
 *     service/p10..p15). Popup builds buttons dynamically per room.
 *
 * v3 (kept):
 *   - Popup is a SHARED modal, position:fixed, centered in the current
 *     viewport. Portaled to <body> on first open to survive CH5
 *     ancestor transforms.
 */

const page1Module = (() => {
    'use strict';

    // ====================== CrComLib SAFE HELPERS ======================
    const hasCrestron = () => typeof CrComLib !== 'undefined';

    function pulse(join, ms = 100) {
        if (!hasCrestron() || !join) return;
        CrComLib.publishEvent('b', join, true);
        setTimeout(() => CrComLib.publishEvent('b', join, false), ms);
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

    // ====================== PRESET CATALOG ======================
    // Fallback if the HTML didn't define window.LIGHT_PRESETS. The real
    // catalog lives in page1.html <head> so it's easy to edit.
    const DEFAULT_CATALOG = {
        on:      { label: 'All On',    icon: '💡', color: 'on'      },
        off:     { label: 'All Off',   icon: '🌙', color: 'off'     },
        dim:     { label: 'Dim',       icon: '⭐', color: 'dim'     },
        relax:   { label: 'Relax',     icon: '🌅', color: 'relax'   },
        tv:      { label: 'TV',        icon: '📺', color: 'tv'      },
        guest:   { label: 'Guest',     icon: '👥', color: 'guest'   },
        service: { label: 'Service',   icon: '🧹', color: 'service' },
        p10:     { label: 'Preset 10', icon: '①',  color: 'generic' },
        p11:     { label: 'Preset 11', icon: '②',  color: 'generic' },
        p12:     { label: 'Preset 12', icon: '③',  color: 'generic' },
        p13:     { label: 'Preset 13', icon: '④',  color: 'generic' },
        p14:     { label: 'Preset 14', icon: '⑤',  color: 'generic' },
        p15:     { label: 'Preset 15', icon: '⑥',  color: 'generic' }
    };

    function catalog() {
        return (typeof window !== 'undefined' && window.LIGHT_PRESETS) ||
               DEFAULT_CATALOG;
    }

    function presetInfo(key) {
        const cat = catalog();
        return cat[key] || { label: key, icon: '•', color: 'generic' };
    }

    // "tv" → "Tv" (so data-join-tv → dataset.joinTv)
    function capitalize(s) {
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    // ====================== LONG-PRESS HELPER ======================
    // How long the user must hold an area-card body before the popup opens.
    // Change this value (milliseconds) to tune the hold duration. The CSS
    // progress-fill animation (.area-card::before) MUST match — see
    // `transition: transform <LONG_PRESS_MS>` in page1.css.
    const LONG_PRESS_MS = 600;

    // Movement (in pixels) that cancels the hold. Prevents accidental
    // long-presses when the user is scrolling.
    const LONG_PRESS_CANCEL_PX = 10;

    /**
     * Attach a long-press handler to an element.
     *   callback(element)  fires after `ms` ms of sustained press
     * Cancels on pointerup / pointercancel / pointerleave, on movement
     * beyond the threshold, or when the user starts on the lamp button.
     *
     * Uses Pointer Events so it works uniformly on touch + mouse + pen.
     */
    function attachLongPress(el, callback, ms) {
        let timer       = null;
        let startX      = 0;
        let startY      = 0;
        let didFire     = false;
        let pressActive = false;

        function clear() {
            if (timer) { clearTimeout(timer); timer = null; }
            el.classList.remove('lp-holding');
            pressActive = false;
        }

        el.addEventListener('pointerdown', (e) => {
            // Don't trigger long-press when the user taps the lamp icon
            // (it's the ON/OFF toggle) or any explicit inner button.
            if (e.target.closest('.acard-bulb') ||
                e.target.closest('button.acard-bulb')) return;
            if (e.button !== undefined && e.button !== 0) return;

            didFire     = false;
            pressActive = true;
            startX = e.clientX;
            startY = e.clientY;
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
            const dx = Math.abs(e.clientX - startX);
            const dy = Math.abs(e.clientY - startY);
            if (dx > LONG_PRESS_CANCEL_PX || dy > LONG_PRESS_CANCEL_PX) {
                clear();
            }
        });

        ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => {
            el.addEventListener(ev, clear);
        });

        // Suppress the browser's native long-press context menu on touch
        // devices so our own progress-fill is what the user sees.
        el.addEventListener('contextmenu', (e) => {
            if (didFire || pressActive) e.preventDefault();
        });
    }

    // ====================== STATE ======================
    const areaState = {};          // key → { element, presets, joins, analog, fb, ... }
    let   currentPanelArea = null;
    let   panelPortalDone  = false;

    // ====================== INIT ======================
    function onInit() {
        console.log('✅ Page 1 Initialized (v5 — pill cards + long-press)');

        ensurePanelClosed();
        buildAreaState();
        setupWidgetNav();
        setupGlobalLightsPresets();
        setupAreaPanelControls();
        setupShades();
        setupAC();
        setupTV();
        setupFeedbackSubscriptions();
        startClock();
        requestCurrentStatus();
        notifyActivePage();
    }

    function ensurePanelClosed() {
        document.getElementById('areaPanel')       ?.classList.remove('open');
        document.getElementById('areaPanelOverlay')?.classList.remove('open');
    }

    /**
     * Move the panel + overlay to become direct children of <body>.
     * This ensures position:fixed always works, even if some ancestor
     * (common in CH5 shells) has a transform/filter/perspective that would
     * otherwise make it positioned relative to that ancestor instead of
     * the viewport.  Done once, on first open.
     */
    function portalPanelToBody() {
        if (panelPortalDone) return;
        const panel   = document.getElementById('areaPanel');
        const overlay = document.getElementById('areaPanelOverlay');
        if (!panel || !overlay) return;
        document.body.appendChild(overlay);
        document.body.appendChild(panel);
        panelPortalDone = true;
    }

    // ====================== WIDGET MANAGEMENT ======================
    function setupWidgetNav() {
        const firstTab = document.querySelector('.tab-btn.active');
        if (firstTab) {
            const name = firstTab.getAttribute('data-widget') || 'lights';
            switchWidget(name, firstTab);
        }
    }

    window.switchWidget = function (widgetName, clickedBtn) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        if (clickedBtn) clickedBtn.classList.add('active');

        document.querySelectorAll('.widget').forEach(w => w.classList.remove('active'));
        const active = document.getElementById('widget-' + widgetName);
        if (active) active.classList.add('active');

        sendSerial('active_widget_name', widgetName);
    };

    window.switchTVSubWidget = function (subwidgetName, clickedBtn) {
        document.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
        if (clickedBtn) clickedBtn.classList.add('active');

        document.querySelectorAll('.tv-subwidget').forEach(w => w.classList.remove('active'));
        const el = document.getElementById(subwidgetName);
        if (el) el.classList.add('active');
    };

    // ====================== SHARED: TOGGLE TILES (AC) ======================
    window.toggleTile = function (name, cls) {
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
        const cards = document.querySelectorAll('.area-card');
        cards.forEach(card => {
            const key = card.dataset.area;
            if (!key) return;

            // 1) Which presets does this room offer?
            const presetsAttr = (card.dataset.presets || '').trim();
            const presetKeys = presetsAttr
                ? presetsAttr.split(',').map(s => s.trim()).filter(Boolean)
                : [];

            // 2) Build the join map for those presets.
            //    data-join-<key>  →  card.dataset.join<Key>
            const joins = {};
            presetKeys.forEach(pk => {
                const attr = 'join' + capitalize(pk);
                const j = (card.dataset[attr] || '').trim();
                if (j) joins[pk] = j;
            });

            // 3) Optional per-card label override: data-label-<key>="My Name"
            const overrideLabels = {};
            presetKeys.forEach(pk => {
                const attr = 'label' + capitalize(pk);
                const v = (card.dataset[attr] || '').trim();
                if (v) overrideLabels[pk] = v;
            });

            areaState[key] = {
                element: card,
                label:   card.dataset.label || key,
                icon:    card.dataset.icon  || '💡',
                presets: presetKeys,
                joins:   joins,
                labelOverrides: overrideLabels,
                analog:  card.dataset.analog || null,
                fb:      card.dataset.fb     || null,
                isOn:    false,
                preset:  'off',
                level:   0
            };

            // 4) Long-press on the card body → open the detail popup.
            attachLongPress(card, (el) => {
                window.openAreaPanel(el, null);
            }, LONG_PRESS_MS);
        });
        updateOnCountBadge();
    }

    /** Return the display label for a preset, honoring per-card overrides. */
    function labelFor(areaKey, presetKey) {
        const st = areaState[areaKey];
        if (st && st.labelOverrides && st.labelOverrides[presetKey]) {
            return st.labelOverrides[presetKey];
        }
        return presetInfo(presetKey).label;
    }

    // ====================== LIGHTS: GLOBAL PRESET BAR ======================
    function setupGlobalLightsPresets() {
        document.getElementById('globalAllOn')?.addEventListener('click', () => {
            pulse('100');
            applyAllAreas('on');
        });
        document.getElementById('globalRelax')?.addEventListener('click', () => {
            pulse('101');
            applyAllAreas('relax');
        });
        document.getElementById('globalDim')?.addEventListener('click', () => {
            pulse('102');
            applyAllAreas('dim');
        });
        document.getElementById('globalAllOff')?.addEventListener('click', () => {
            pulse('103');
            applyAllAreas('off');
        });
    }

    // ====================== LIGHTS: VISUAL STATE ======================
    /** Apply a preset visually to every area that supports it. */
    function applyAllAreas(preset) {
        Object.keys(areaState).forEach(k => {
            const st = areaState[k];
            if (!st.presets.includes(preset)) return;
            setAreaVisual(k, preset);
        });
    }

    function setAreaVisual(key, preset) {
        const st = areaState[key];
        if (!st) return;

        st.preset = preset;
        st.isOn   = (preset !== 'off');

        const card = st.element;

        // Visual class: on/dim styles brighter, everything-not-off uses "alit",
        // relax is a warmer tint kept for backward-compat.
        card.classList.remove('alit', 'arelax');
        if (preset === 'off') {
            /* no highlight */
        } else if (preset === 'relax') {
            card.classList.add('arelax');
        } else {
            card.classList.add('alit');
        }

        // Reflect on/off on the lamp button for a11y (pressed state)
        const bulb = document.getElementById('abulb-' + key);
        if (bulb) bulb.setAttribute('aria-pressed', st.isOn ? 'true' : 'false');

        // If the panel is currently showing this area, sync it too
        if (currentPanelArea === key) refreshPanelStatus();

        updateOnCountBadge();
    }

    function updateOnCountBadge() {
        const badge = document.getElementById('lightsOnCount');
        if (!badge) return;
        const count = Object.values(areaState).filter(s => s.isOn).length;
        badge.textContent = count + ' on';
    }

    // ====================== LIGHTS: AREA PANEL ======================

    /** Build the preset buttons for the currently-open area. */
    function renderPanelPresets(areaKey) {
        const grid = document.getElementById('panelPresetGrid');
        if (!grid) return;
        grid.innerHTML = '';

        const st = areaState[areaKey];
        if (!st) return;

        st.presets.forEach(pk => {
            const info = presetInfo(pk);
            const btn = document.createElement('button');
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

    /**
     * Open the shared popup for the area whose card was long-pressed.
     * Positioning: fixed + centered in the current viewport.
     *
     * v5: this is now invoked ONLY by the long-press handler, not from a
     * direct click. The `event` parameter is kept for backward compat (some
     * callers still pass a click event) and to allow guarding against taps
     * on the lamp icon.
     */
    window.openAreaPanel = function (cardEl, event) {
        // Ignore triggers that came from the lamp toggle itself
        if (event && event.target &&
            event.target.closest('.acard-bulb')) {
            return;
        }

        const key = cardEl.dataset.area;
        const st = areaState[key];
        if (!st) return;

        portalPanelToBody();
        currentPanelArea = key;

        // Header
        document.getElementById('panelIco').textContent   = st.icon;
        document.getElementById('panelTitle').textContent = st.label;
        document.getElementById('panelSub').textContent   = 'Lighting Control';

        // Preset buttons — built fresh from this area's preset list
        renderPanelPresets(key);

        // Dimmer visibility + join labels
        const dimmerEl = document.getElementById('panelDimmer');
        if (st.analog) {
            dimmerEl.classList.remove('hidden');
            document.getElementById('panelDimJoin').textContent = 'Analog Join ' + st.analog;
            document.getElementById('panelDimHint').textContent =
                'Feedback ← Analog Join ' + (st.fb || '—');

            const level  = st.level || 0;
            const slider = document.getElementById('panelDimSlider');
            if (slider) slider.value = level;
            document.getElementById('panelDimValue').textContent = level;
            updatePanelDial(level);
        } else {
            dimmerEl.classList.add('hidden');
        }

        refreshPanelStatus();

        document.getElementById('areaPanelOverlay').classList.add('open');
        document.getElementById('areaPanel').classList.add('open');

        document.body.style.overflow = 'hidden';

        sendSerial('active_area_name', st.label);
    };

    window.closeAreaPanel = function () {
        document.getElementById('areaPanelOverlay').classList.remove('open');
        document.getElementById('areaPanel').classList.remove('open');
        document.body.style.overflow = '';
        currentPanelArea = null;
    };

    // Escape key closes the panel
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && currentPanelArea) {
            window.closeAreaPanel();
        }
    });

    function refreshPanelStatus() {
        if (!currentPanelArea) return;
        const st = areaState[currentPanelArea];
        if (!st) return;

        const pill = document.getElementById('panelStatusPill');
        const txt  = document.getElementById('panelStatusText');
        if (!pill || !txt) return;

        // Status pill styling: on=green, off=red, everything-else=warm
        pill.className = 'spill';
        if (st.preset === 'on')       pill.classList.add('sp-on');
        else if (st.preset === 'off') pill.classList.add('sp-off');
        else                          pill.classList.add('sp-dim');

        txt.textContent = (labelFor(currentPanelArea, st.preset) || st.preset).toUpperCase();

        // Highlight the active preset button (if it's in the current grid)
        document.querySelectorAll('#panelPresetGrid .preset-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.preset === st.preset);
        });
    }

    // ====================== LIGHTS: PANEL CONTROLS ======================
    function setupAreaPanelControls() {
        // Preset buttons are attached dynamically in renderPanelPresets().
        // Only the dimmer slider is wired here (static DOM element).
        const slider = document.getElementById('panelDimSlider');
        slider?.addEventListener('input', (e) => {
            if (!currentPanelArea) return;
            const st = areaState[currentPanelArea];
            if (!st || !st.analog) return;

            const v = parseInt(e.target.value, 10);
            st.level = v;
            document.getElementById('panelDimValue').textContent = v;
            updatePanelDial(v);
            sendAnalog(st.analog, v);
        });
    }

    function sendAreaPreset(preset) {
        if (!currentPanelArea) return;
        const st = areaState[currentPanelArea];
        if (!st) return;

        const join = st.joins[preset];
        if (join) {
            pulse(join);
        } else {
            console.warn('[lights] No join configured for preset "' + preset +
                         '" on area "' + currentPanelArea + '"');
        }

        // Optimistic UI (reconciled by feedback sub if configured)
        setAreaVisual(currentPanelArea, preset);
    }

    // ====================== LIGHTS: LAMP-ICON ON/OFF TOGGLE ======================
    /**
     * v5 — the lamp icon IS the on/off toggle. Tapping it flips between
     * the 'on' and 'off' presets for that room and updates the visual.
     * `event.stopPropagation()` prevents the tap from being interpreted
     * as the start of a long-press on the card body.
     */
    window.handleAreaLampToggle = function (key, event) {
        if (event) event.stopPropagation();

        const st = areaState[key];
        if (!st) return;

        const wantOn = !st.isOn;
        const preset = wantOn ? 'on' : 'off';

        const join = st.joins[preset];
        if (join) {
            pulse(join);
        } else {
            console.warn('[lights] Lamp tapped but no data-join-' + preset +
                         ' on area "' + key + '"');
        }

        setAreaVisual(key, preset);
    };

    // ====================== LIGHTS: PANEL ARC DIAL ======================
    function updatePanelDial(pct) {
        const fill  = document.getElementById('panel-arc-fill');
        const label = document.getElementById('panel-arc-label');
        if (!fill) return;

        const cx = 100, cy = 105, r = 76;
        const deg = -180 + pct * 1.8;
        const rad = deg * Math.PI / 180;
        const ex = cx + r * Math.cos(rad);
        const ey = cy + r * Math.sin(rad);

        if (pct <= 0) {
            fill.setAttribute('d', 'M 24 105 A 76 76 0 0 1 24.001 105');
        } else if (pct >= 100) {
            fill.setAttribute('d', 'M 24 105 A 76 76 0 0 1 176 105');
        } else {
            const largeArc = pct > 50 ? 1 : 0;
            fill.setAttribute('d', `M 24 105 A 76 76 0 ${largeArc} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`);
        }
        if (label) label.textContent = pct + '%';
    }

    // ====================== LIGHTS: FEEDBACK SUBSCRIPTIONS ======================
    function setupLightsFeedback() {
        if (!hasCrestron()) return;

        Object.keys(areaState).forEach(key => {
            const st = areaState[key];

            // Analog dimmer feedback (0-100)
            if (st.fb) {
                subAnalog(st.fb, (val) => {
                    const v = Math.max(0, Math.min(100, parseInt(val, 10) || 0));
                    st.level = v;
                    if (currentPanelArea === key) {
                        const slider = document.getElementById('panelDimSlider');
                        if (slider) slider.value = v;
                        document.getElementById('panelDimValue').textContent = v;
                        updatePanelDial(v);
                    }
                });
            }

            // Digital feedback — for EVERY preset this room supports.
            // Convention: feedback join = send join + 100.
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
    /**
     * Custom drag-thumb control — no <input type="range">.
     * The thumb IS the stop button:
     *   • TAP  (< STOP_MARGIN px movement)  → pulse stop join
     *   • DRAG UP / RIGHT past DEAD_ZONE    → pulse open join (once per drag)
     *   • DRAG DOWN / LEFT past DEAD_ZONE   → pulse close join (once per drag)
     *   • RELEASE                           → thumb springs back to centre
     */
    const STOP_MARGIN = 8;   // px — max movement still treated as a tap
    const DEAD_ZONE   = 22;  // px from start before direction fires

    const shadeState = {};

    function setupShades() {
        document.querySelectorAll('.shade-card').forEach(card => buildShadeCard(card));
        updateShadesOpenCount();
    }

    function buildShadeCard(card) {
        const key         = card.dataset.shade;
        const label       = card.dataset.label       || 'Shade';
        const icon        = card.dataset.icon        || '🪟';
        const joinOpen    = card.dataset.joinOpen;
        const joinClose   = card.dataset.joinClose;
        const joinStop    = card.dataset.joinStop;
        const joinPos     = card.dataset.joinPos;
        const joinFb      = card.dataset.joinFb;
        const isVert      = (card.dataset.orientation || 'vertical') === 'vertical';

        shadeState[key] = { pos: 0, isOpen: false };

        card.innerHTML = `
          <div class="sc-top">
            <span class="sc-icon">${icon}</span>
            <div class="sc-info">
              <div class="sc-name">${label}</div>
              <div class="sc-status" id="sstat-${key}">
                <span class="sc-dot"></span>
                <span id="sstat-txt-${key}">–</span>
              </div>
            </div>
            
          </div>

          <div class="sc-track-wrap sc-orient-${isVert ? 'vert' : 'horz'}" id="strack-${key}">
            <div class="sc-track-bg">
              <div class="sc-track-fill" id="sfill-${key}"></div>
            </div>
            <div class="sc-labels ${isVert ? 'sc-labels-vert' : 'sc-labels-horz'}">
              <span>${isVert ? '↑ Open' : '← Close'}</span>
              <span>${isVert ? '↓ Close' : '→ Open'}</span>
            </div>
            <div class="sc-thumb" id="sthumb-${key}">
              <span class="sc-thumb-label">STOP</span>
            </div>
          </div>

          <div class="sc-hint-row">
            <span class="sc-hint">${isVert ? 'drag ↑↓ · tap = stop' : 'drag ←→ · tap = stop'}</span>
            <span class="sc-join-hint">FB ← J${joinFb || '–'}</span>
          </div>
        `;

        wireShadeControl(card, key, isVert, joinOpen, joinClose, joinStop, joinPos, joinFb);

        if (joinFb && hasCrestron()) {
            subAnalog(joinFb, (val) => {
                const v = Math.max(0, Math.min(100, parseInt(val, 10) || 0));
                shadeState[key].pos    = v;
                shadeState[key].isOpen = v > 5;
                updateShadeFeedback(key, v);
                updateShadesOpenCount();
            });
        }
    }

    function wireShadeControl(card, key, isVert, joinOpen, joinClose, joinStop, joinPos, joinFb) {
        const thumb = document.getElementById('sthumb-' + key);
        const fill  = document.getElementById('sfill-'  + key);
        const wrap  = document.getElementById('strack-' + key);

        let dragStart = null;
        let hasFired  = false;
        let pointerId = null;

        thumb.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            thumb.setPointerCapture(e.pointerId);
            pointerId  = e.pointerId;
            dragStart  = { x: e.clientX, y: e.clientY };
            hasFired   = false;
            thumb.style.transition = '';
            thumb.classList.add('sc-thumb-active');
        });

        thumb.addEventListener('pointermove', (e) => {
            if (!dragStart || e.pointerId !== pointerId) return;
            e.preventDefault();

            const dx   = e.clientX - dragStart.x;
            const dy   = e.clientY - dragStart.y;
            const dist = isVert ? -dy : dx;   // positive = open direction

            const trackLen  = isVert ? wrap.offsetHeight : wrap.offsetWidth;
            const maxTravel = Math.min(trackLen * 0.38, 80);
            const clamped   = Math.max(-maxTravel, Math.min(maxTravel, dist));

            // Move thumb — keep both centring axes
            thumb.style.transform = isVert
                ? `translateX(-50%) translateY(calc(-50% + ${-clamped}px))`
                : `translateX(calc(-50% + ${clamped}px)) translateY(-50%)`;

            // Animated fill from centre
            const fillPct = Math.abs(clamped) / maxTravel * 44;
            fill.style.transition = 'none';
            if (isVert) {
                fill.style.width  = '100%';
                fill.style.left   = '0';
                fill.style.right  = 'auto';
                if (clamped >= 0) {
                    fill.style.bottom = '50%'; fill.style.top = 'auto';
                    fill.style.height = fillPct + '%';
                } else {
                    fill.style.top = '50%'; fill.style.bottom = 'auto';
                    fill.style.height = fillPct + '%';
                }
            } else {
                fill.style.height = '100%';
                fill.style.top    = '0';
                fill.style.bottom = 'auto';
                if (clamped >= 0) {
                    fill.style.left  = '50%'; fill.style.right = 'auto';
                    fill.style.width = fillPct + '%';
                } else {
                    fill.style.right = '50%'; fill.style.left = 'auto';
                    fill.style.width = fillPct + '%';
                }
            }

            // Colour hint on thumb
            if (clamped > DEAD_ZONE / 2) {
                thumb.classList.add('sc-thumb-toward-open');
                thumb.classList.remove('sc-thumb-toward-close');
            } else if (clamped < -DEAD_ZONE / 2) {
                thumb.classList.add('sc-thumb-toward-close');
                thumb.classList.remove('sc-thumb-toward-open');
            } else {
                thumb.classList.remove('sc-thumb-toward-open', 'sc-thumb-toward-close');
            }

            // Fire direction once past dead-zone
            if (!hasFired && Math.abs(dist) > DEAD_ZONE) {
                hasFired = true;
                if (dist > 0) {
                    pulse(joinOpen);
                    setShadeStatusText(key, '▲ Opening…');
                    setShadeCardState(card, 'moving');
                } else {
                    pulse(joinClose);
                    setShadeStatusText(key, '▼ Closing…');
                    setShadeCardState(card, 'moving');
                }
            }
        });

        const onUp = (e) => {
            if (!dragStart || e.pointerId !== pointerId) return;

            const dx       = e.clientX - dragStart.x;
            const dy       = e.clientY - dragStart.y;
            const moveDist = Math.sqrt(dx * dx + dy * dy);

            if (moveDist < STOP_MARGIN) {
                pulse(joinStop);
                setShadeStatusText(key, '⏹ Stopped');
                setShadeCardState(card, 'stopped');
            }

            // Spring back — both axes
            thumb.style.transition = 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)';
            thumb.style.transform  = 'translateX(-50%) translateY(-50%)';

            fill.style.transition = 'height 0.2s ease, width 0.2s ease';
            fill.style.height = '0';
            fill.style.width  = '0';

            thumb.classList.remove('sc-thumb-active', 'sc-thumb-toward-open', 'sc-thumb-toward-close');

            setTimeout(() => {
                thumb.style.transition = '';
                fill.style.transition  = '';
            }, 380);

            dragStart = null;
            hasFired  = false;
            pointerId = null;
        };

        thumb.addEventListener('pointerup',     onUp);
        thumb.addEventListener('pointercancel', onUp);
    }

    function setShadeStatusText(key, text) {
        const el = document.getElementById('sstat-txt-' + key);
        if (el) el.textContent = text;
    }

    function setShadeCardState(card, state) {
        card.classList.remove('sc-s-open', 'sc-s-closed', 'sc-s-moving', 'sc-s-stopped');
        if (state) card.classList.add('sc-s-' + state);
    }

    function updateShadeFeedback(key, pos) {
        const badge = document.getElementById('spos-' + key);
        if (badge) badge.textContent = pos + '%';
        const card = document.querySelector(`[data-shade="${key}"]`);
        if (card) {
            if      (pos >= 95) setShadeCardState(card, 'open');
            else if (pos <= 5)  setShadeCardState(card, 'closed');
        }
        setShadeStatusText(key, pos >= 95 ? 'Open' : pos <= 5 ? 'Closed' : pos + '%');
    }

    function updateShadesOpenCount() {
        const badge = document.getElementById('shadesOpenCount');
        if (!badge) return;
        const n = Object.values(shadeState).filter(s => s.isOpen).length;
        badge.textContent = n + ' open';
    }

    // ====================== AC ======================
    function setupAC() {
        // ── State ──
        let acOn       = true;
        let acSetTemp  = 17;   // default target temp
        let acMode     = 'cool';
        let acFan      = 'high';
        const AC_MIN   = 16;
        const AC_MAX   = 30;

        // ── Elements ──
        const card       = document.querySelector('.ac-card');
        const powerBtn   = document.getElementById('acPowerBtn');
        const dialTemp   = document.getElementById('acDialTemp');
        const arcPath    = document.getElementById('acArcPath');
        const trackBg    = document.getElementById('acTrackBg');
        const ticksG     = document.getElementById('acTicks');
        const decBtn     = document.getElementById('acDecBtn');
        const incBtn     = document.getElementById('acIncBtn');
        const modeBtns   = document.querySelectorAll('.ac-mode-btn');
        const fanBtns    = document.querySelectorAll('.ac-fan-btn');
        const statusBadge = document.getElementById('acStatusBadge');

        // ── SVG Arc geometry ──
        const CX = 110, CY = 110, R = 88;
        const START_DEG = 145;   // bottom-left
        const END_DEG   = 35;    // bottom-right  (going clockwise the short way)
        const TOTAL_DEG = 360 - START_DEG + END_DEG; // = 250°

        function degToRad(d) { return (d * Math.PI) / 180; }

        function polarPoint(deg) {
            const rad = degToRad(deg);
            return { x: CX + R * Math.cos(rad), y: CY + R * Math.sin(rad) };
        }

        function arcD(fromDeg, toDeg) {
            // Always draw clockwise from fromDeg to toDeg
            const s = polarPoint(fromDeg);
            const e = polarPoint(toDeg);
            // Determine large-arc: if sweep > 180 in the clockwise direction
            let sweep = toDeg - fromDeg;
            if (sweep < 0) sweep += 360;
            const largeArc = sweep > 180 ? 1 : 0;
            return `M ${s.x} ${s.y} A ${R} ${R} 0 ${largeArc} 1 ${e.x} ${e.y}`;
        }

        function buildTicks() {
            if (!ticksG) return;
            ticksG.innerHTML = '';
            const STEPS = 15; // one tick per degree step
            for (let i = 0; i <= STEPS; i++) {
                const pct  = i / STEPS;
                const deg  = START_DEG + pct * TOTAL_DEG;
                const pt   = polarPoint(deg);
                const inner = { x: CX + (R - 8) * Math.cos(degToRad(deg)),
                                 y: CY + (R - 8) * Math.sin(degToRad(deg)) };
                const line = document.createElementNS('http://www.w3.org/2000/svg','line');
                line.setAttribute('x1', pt.x);
                line.setAttribute('y1', pt.y);
                line.setAttribute('x2', inner.x);
                line.setAttribute('y2', inner.y);
                line.setAttribute('stroke', 'rgba(255,255,255,0.25)');
                line.setAttribute('stroke-width', i % 5 === 0 ? '2' : '1');
                line.setAttribute('stroke-linecap', 'round');
                ticksG.appendChild(line);
            }
        }

        function updateDial() {
            if (!arcPath || !trackBg) return;
            const pct    = (acSetTemp - AC_MIN) / (AC_MAX - AC_MIN);
            const endDeg = START_DEG + pct * TOTAL_DEG;

            trackBg.setAttribute('d', arcD(START_DEG, START_DEG + TOTAL_DEG));
            arcPath.setAttribute('d', arcD(START_DEG, endDeg));

            if (dialTemp) dialTemp.textContent = acSetTemp + '°';
        }

        function updatePowerUI() {
            if (!card || !powerBtn) return;
            powerBtn.dataset.on = acOn ? 'true' : 'false';
            card.classList.toggle('ac-is-off', !acOn);
            if (statusBadge) statusBadge.textContent = 'Master Robe • ' + (acOn ? 'ON' : 'OFF');
        }

        function updateModeUI() {
            modeBtns.forEach(b => {
                b.classList.toggle('ac-mode-active', b.dataset.mode === acMode);
            });
        }

        function updateFanUI() {
            fanBtns.forEach(b => {
                b.classList.toggle('ac-fan-active', b.dataset.fan === acFan);
            });
        }

        function flashBtn(btn) {
            if (!btn) return;
            btn.classList.remove('ac-flash');
            void btn.offsetWidth; // reflow
            btn.classList.add('ac-flash');
            setTimeout(() => btn.classList.remove('ac-flash'), 400);
        }

        // ── Power ──
        powerBtn?.addEventListener('click', () => {
            acOn = !acOn;
            updatePowerUI();
            pulse('70');
        });

        // ── +/- ──
        decBtn?.addEventListener('click', () => {
            if (!acOn) return;
            if (acSetTemp > AC_MIN) {
                acSetTemp--;
                updateDial();
                sendAnalog('41', acSetTemp);
                flashBtn(decBtn);
            }
        });

        incBtn?.addEventListener('click', () => {
            if (!acOn) return;
            if (acSetTemp < AC_MAX) {
                acSetTemp++;
                updateDial();
                sendAnalog('41', acSetTemp);
                flashBtn(incBtn);
            }
        });

        // ── Modes ──
        modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (!acOn) return;
                acMode = btn.dataset.mode;
                updateModeUI();
                pulse(btn.dataset.join);
            });
        });

        // ── Fan speed ──
        fanBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (!acOn) return;
                acFan = btn.dataset.fan;
                updateFanUI();
                pulse(btn.dataset.join);
            });
        });

        // ── Feedback: current room temp ──
        subAnalog('40', (val) => {
            const el = document.getElementById('acCurrentTemp');
            if (el) el.textContent = Math.round(val) + '°';
        });

        // ── Feedback: setpoint from CP ──
        subAnalog('41', (val) => {
            acSetTemp = Math.max(AC_MIN, Math.min(AC_MAX, Math.round(val)));
            updateDial();
        });

        // ── Init ──
        buildTicks();
        updateDial();
        updatePowerUI();
        updateModeUI();
        updateFanUI();
    }

    // ====================== TV ======================
    function setupTV() {
        document.getElementById('tvPowerBtn')  ?.addEventListener('click', () => pulse('60'));
        document.getElementById('tvNetflixBtn')?.addEventListener('click', () => pulse('61'));
        document.getElementById('tvHdmiBtn')   ?.addEventListener('click', () => pulse('62'));

        document.getElementById('tvPowerBtn2')?.addEventListener('click', () => pulse('60'));
        document.getElementById('tvSourceBtn')?.addEventListener('click', () => pulse('68'));

        document.getElementById('tvDpadUp')   ?.addEventListener('click', () => pulse('63'));
        document.getElementById('tvDpadDown') ?.addEventListener('click', () => pulse('64'));
        document.getElementById('tvDpadLeft') ?.addEventListener('click', () => pulse('65'));
        document.getElementById('tvDpadRight')?.addEventListener('click', () => pulse('66'));
        document.getElementById('tvDpadOk')   ?.addEventListener('click', () => pulse('67'));

        for (let i = 0; i <= 9; i++) {
            const btn = document.getElementById('tvKey' + i);
            if (!btn) continue;
            const join = '9' + String(i).padStart(2, '0');
            btn.addEventListener('click', () => pulse(join));
        }

        document.getElementById('tvKeyEnter')?.addEventListener('click', () => pulse('100'));

        document.getElementById('tvVolUpBtn')  ?.addEventListener('click', () => pulse('101'));
        document.getElementById('tvVolDownBtn')?.addEventListener('click', () => pulse('102'));
        document.getElementById('tvMuteBtn')   ?.addEventListener('click', () => pulse('103'));
        document.getElementById('tvChUpBtn')   ?.addEventListener('click', () => pulse('104'));
        document.getElementById('tvChDownBtn') ?.addEventListener('click', () => pulse('105'));

        document.querySelectorAll('.fav-btn').forEach((btn, i) => {
            const joinNumber = 110 + i;
            btn.addEventListener('click', () => {
                pulse(String(joinNumber));
                console.log(`Favorite ${i + 1} pressed → Digital Join ${joinNumber}`);
            });
        });
    }

    // ====================== FEEDBACK: GLOBAL ======================
    function setupFeedbackSubscriptions() {
        if (!hasCrestron()) return;

        setupLightsFeedback();
    }

    function requestCurrentStatus() {
        pulse('99');
    }

    function notifyActivePage() {
        if (!hasCrestron()) return;
        CrComLib.publishEvent('b', 'active_state_class_page1', true);
    }

    // ====================== CLOCK ======================
    function startClock() {
        tick();
        setInterval(tick, 15000);
    }
    function tick() {
        const el = document.getElementById('clockDisplay');
        if (!el) return;
        const n = new Date();
        el.textContent = n.getHours() + ':' + String(n.getMinutes()).padStart(2, '0');
    }

    // ====================== BOOTSTRAP ======================
    if (hasCrestron()) {
        let loadedSubId = CrComLib.subscribeState(
            'o',
            'ch5-import-htmlsnippet:page1-import-page',
            (value) => {
                if (value && value['loaded']) {
                    onInit();
                    setTimeout(
                        () => CrComLib.unsubscribeState(
                            'o',
                            'ch5-import-htmlsnippet:page1-import-page',
                            loadedSubId
                        ),
                        100
                    );
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