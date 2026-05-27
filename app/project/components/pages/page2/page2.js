/* page2.js — Smart Home Control Page 2 (4 Widgets)
 * Mirror of page1.js architecture with the following changes:
 *  - Module namespace : page2Module
 *  - All DOM IDs      : p2- prefixed (e.g. p2-areaPanel, p2-clockDisplay …)
 *  - Digital joins    : 200–299 range
 *  - Analog joins     : 200+ range (details below)
 *  - CH5 snippet      : 'ch5-import-htmlsnippet:page2-import-page'
 *  - Active-page join : active_state_class_page2
 *
 * ── JOIN MAP SUMMARY ──────────────────────────────────────────────────────
 *  Global Lights presets : 200 (All On) · 201 (Relax) · 202 (Dim) · 203 (All Off)
 *  Per-area presets      : defined in HTML data-joins (e.g. {"on":"210","dim":"211",…})
 *  Per-area analog send  : data-analog attribute on .area-card  (e.g. "236")
 *  Per-area analog fb    : data-fb    attribute on .area-card  (e.g. "237")
 *  Digital fb offset     : send join + 100  (same convention as page 1)
 *  Shades analog send    : 236  |  Shades analog fb : 235
 *  Shades Up/Stop/Down   : 250 / 252 / 251
 *  AC setpoint analog    : 241  |  AC room-temp fb  : 240
 *  AC Power toggle       : 270
 *  AC Modes Cool/Heat/Auto/Dry/Fan : 271-275
 *  AC Fan Low/Med/High/Auto        : 276-279
 *  AC Swing              : 281
 *  TV Power              : 260
 *  TV Netflix/HDMI       : 261 / 262
 *  TV D-Pad Up/Dn/L/R/OK : 263-267
 *  TV Source             : 268
 *  TV Num 0-9            : 200-209  (mapped as p2 keypad range)
 *  TV Vol Up/Dn/Mute     : 290 / 291 / 292  (NOTE: also used by global presets,
 *                          adjust in HTML if collision — page 1 reused 100-103)
 *  TV Ch Up/Dn           : 293 / 294
 *  TV Favorites          : 295+
 *  Request current state : pulse 299
 * ─────────────────────────────────────────────────────────────────────────
 */

const page2Module = (() => {
    'use strict';

    // ====================== CrComLib SAFE HELPERS ======================
    const hasCrestron = () => typeof CrComLib !== 'undefined';

    function pulse(join, ms = 100) {
        if (!hasCrestron()) return;
        CrComLib.publishEvent('b', join, true);
        setTimeout(() => CrComLib.publishEvent('b', join, false), ms);
    }

    function sendAnalog(join, value) {
        if (!hasCrestron()) return;
        CrComLib.publishEvent('n', join, value);
    }

    function sendSerial(join, text) {
        if (!hasCrestron()) return;
        CrComLib.publishEvent('s', join, text);
    }

    function subBool(join, cb) {
        if (!hasCrestron()) return;
        CrComLib.subscribeState('b', join, cb);
    }

    function subAnalog(join, cb) {
        if (!hasCrestron()) return;
        CrComLib.subscribeState('n', join, cb);
    }

    // ====================== STATE ======================
    const areaState = {}; // key → { element, joins, analog, fb, isOn, level, preset }

    // ====================== INIT ======================
    function onInit() {
        console.log('✅ Page 2 Initialized');

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
        document.getElementById('p2-areaPanel')        ?.classList.remove('open');
        document.getElementById('p2-areaPanelOverlay') ?.classList.remove('open');
    }

    // ====================== WIDGET MANAGEMENT ======================
    function setupWidgetNav() {
        const firstTab = document.querySelector('#page2 .tab-btn.active');
        if (firstTab) {
            const name = firstTab.getAttribute('data-widget') || 'lights';
            switchWidget(name, firstTab);
        }
    }

    // Exposed globally — called from HTML onclick on page 2 tabs.
    // Uses p2- prefixed widget IDs to avoid collisions with page 1.
    window.p2SwitchWidget = function (widgetName, clickedBtn) {
        document.querySelectorAll('#page2 .tab-btn').forEach(b => b.classList.remove('active'));
        if (clickedBtn) clickedBtn.classList.add('active');

        document.querySelectorAll('#page2 .widget').forEach(w => w.classList.remove('active'));
        const active = document.getElementById('p2-widget-' + widgetName);
        if (active) active.classList.add('active');

        sendSerial('p2_active_widget_name', widgetName);
    };

    // Internal alias used by setupWidgetNav
    function switchWidget(name, btn) { window.p2SwitchWidget(name, btn); }

    window.p2SwitchTVSubWidget = function (subwidgetName, clickedBtn) {
        document.querySelectorAll('#page2 .sub-tab-btn').forEach(b => b.classList.remove('active'));
        if (clickedBtn) clickedBtn.classList.add('active');

        document.querySelectorAll('#page2 .tv-subwidget').forEach(w => w.classList.remove('active'));
        const el = document.getElementById('p2-' + subwidgetName);
        if (el) el.classList.add('active');
    };

    // ====================== SHARED: TOGGLE TILES (AC) ======================
    window.p2ToggleTile = function (name, cls) {
        const tog  = document.getElementById('p2-tog-'  + name);
        const tile = document.getElementById('p2-tile-' + name);
        const lbl  = document.getElementById('p2-lbl-'  + name);
        if (!tog || !tile || !lbl) return;

        const isOn = tog.checked;
        tile.classList.toggle(cls, isOn);
        lbl.textContent = isOn ? 'ON' : 'OFF';
    };

    // ====================== LIGHTS: BUILD STATE FROM DOM ======================
    function buildAreaState() {
        // Area cards live inside #page2 to avoid clashes with page 1 cards
        const cards = document.querySelectorAll('#page2 .area-card');
        cards.forEach(card => {
            const key = card.dataset.area;
            if (!key) return;

            let joins = {};
            try { joins = JSON.parse(card.dataset.joins || '{}'); }
            catch (e) { console.warn('Bad data-joins on p2', key, e); }

            areaState[key] = {
                element: card,
                label:   card.dataset.label || key,
                icon:    card.dataset.icon  || '💡',
                joins:   joins,
                analog:  card.dataset.analog || null,
                fb:      card.dataset.fb     || null,
                isOn:    false,
                preset:  'off',
                level:   0
            };
        });
        updateOnCountBadge();
    }

    // ====================== LIGHTS: GLOBAL PRESET BAR ======================
    function setupGlobalLightsPresets() {
        document.getElementById('p2-globalAllOn') ?.addEventListener('click', () => {
            pulse('200');
            applyAllAreas('on');
        });
        document.getElementById('p2-globalRelax') ?.addEventListener('click', () => {
            pulse('201');
            applyAllAreas('relax');
        });
        document.getElementById('p2-globalDim')   ?.addEventListener('click', () => {
            pulse('202');
            applyAllAreas('dim');
        });
        document.getElementById('p2-globalAllOff')?.addEventListener('click', () => {
            pulse('203');
            applyAllAreas('off');
        });
    }

    // ====================== LIGHTS: VISUAL STATE ======================
    function applyAllAreas(preset) {
        Object.keys(areaState).forEach(k => setAreaVisual(k, preset));
    }

    function setAreaVisual(key, preset) {
        const st = areaState[key];
        if (!st) return;

        st.preset = preset;
        st.isOn = (preset !== 'off');

        const card    = st.element;
        const stateEl = document.getElementById('p2-astate-' + key);

        card.classList.remove('alit', 'arelax');
        if      (preset === 'on' || preset === 'dim') card.classList.add('alit');
        else if (preset === 'relax')                  card.classList.add('arelax');

        if (stateEl) {
            stateEl.textContent =
                preset === 'on'    ? 'ON'     :
                preset === 'dim'   ? 'DIMMED' :
                preset === 'relax' ? 'RELAX'  :
                                     'OFF';
        }

        if (currentPanelArea === key) refreshPanelStatus();
        updateOnCountBadge();
    }

    function updateOnCountBadge() {
        const badge = document.getElementById('p2-lightsOnCount');
        if (!badge) return;
        const count = Object.values(areaState).filter(s => s.isOn).length;
        badge.textContent = count + ' on';
    }

    // ====================== LIGHTS: AREA PANEL ======================
    let currentPanelArea = null;

    window.p2OpenAreaPanel = function (cardEl) {
        const key = cardEl.dataset.area;
        const st  = areaState[key];
        if (!st) return;

        currentPanelArea = key;

        document.getElementById('p2-panelIco').textContent   = st.icon;
        document.getElementById('p2-panelTitle').textContent = st.label;
        document.getElementById('p2-panelSub').textContent   = 'Lighting Control';

        const dimmerEl = document.getElementById('p2-panelDimmer');
        if (st.analog) {
            dimmerEl?.classList.remove('hidden');
            document.getElementById('p2-panelDimJoin').textContent =
                'Analog Join ' + st.analog;
            document.getElementById('p2-panelDimHint').textContent =
                'Feedback ← Analog Join ' + (st.fb || '—');

            const level  = st.level || 0;
            const slider = document.getElementById('p2-panelDimSlider');
            if (slider) slider.value = level;
            document.getElementById('p2-panelDimValue').textContent = level;
            updatePanelDial(level);
        } else {
            dimmerEl?.classList.add('hidden');
        }

        refreshPanelStatus();

        document.getElementById('p2-areaPanelOverlay').classList.add('open');
        document.getElementById('p2-areaPanel').classList.add('open');
        document.body.style.overflow = 'hidden';

        sendSerial('p2_active_area_name', st.label);
    };

    window.p2CloseAreaPanel = function () {
        document.getElementById('p2-areaPanelOverlay').classList.remove('open');
        document.getElementById('p2-areaPanel').classList.remove('open');
        document.body.style.overflow = '';
        currentPanelArea = null;
    };

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && currentPanelArea) {
            window.p2CloseAreaPanel();
        }
    });

    function refreshPanelStatus() {
        if (!currentPanelArea) return;
        const st = areaState[currentPanelArea];
        if (!st) return;

        const pill = document.getElementById('p2-panelStatusPill');
        const txt  = document.getElementById('p2-panelStatusText');
        if (!pill || !txt) return;

        pill.className = 'spill';
        let label = 'OFF';
        if      (st.preset === 'on')    { pill.classList.add('sp-on');  label = 'ON';    }
        else if (st.preset === 'dim')   { pill.classList.add('sp-dim'); label = 'DIMMED'; }
        else if (st.preset === 'relax') { pill.classList.add('sp-dim'); label = 'RELAX'; }
        else                            { pill.classList.add('sp-off'); label = 'OFF';   }
        txt.textContent = label;

        document.querySelectorAll('#p2-areaPanel .preset-btn').forEach(b => {
            b.classList.remove('p-active-on','p-active-dim','p-active-relax','p-active-off');
        });
        const btnMap = {
            on:    ['p2-panelBtnOn',    'p-active-on'],
            dim:   ['p2-panelBtnDim',   'p-active-dim'],
            relax: ['p2-panelBtnRelax', 'p-active-relax'],
            off:   ['p2-panelBtnOff',   'p-active-off']
        };
        const [id, cls] = btnMap[st.preset] || [];
        if (id) document.getElementById(id)?.classList.add(cls);
    }

    // ====================== LIGHTS: PANEL CONTROLS ======================
    function setupAreaPanelControls() {
        document.getElementById('p2-panelBtnOn')   ?.addEventListener('click', () => sendAreaPreset('on'));
        document.getElementById('p2-panelBtnDim')  ?.addEventListener('click', () => sendAreaPreset('dim'));
        document.getElementById('p2-panelBtnRelax')?.addEventListener('click', () => sendAreaPreset('relax'));
        document.getElementById('p2-panelBtnOff')  ?.addEventListener('click', () => sendAreaPreset('off'));

        const slider = document.getElementById('p2-panelDimSlider');
        slider?.addEventListener('input', (e) => {
            if (!currentPanelArea) return;
            const st = areaState[currentPanelArea];
            if (!st || !st.analog) return;

            const v = parseInt(e.target.value, 10);
            st.level = v;
            document.getElementById('p2-panelDimValue').textContent = v;
            updatePanelDial(v);
            sendAnalog(st.analog, v);
        });
    }

    function sendAreaPreset(preset) {
        if (!currentPanelArea) return;
        const st = areaState[currentPanelArea];
        if (!st) return;

        const join = st.joins[preset];
        if (join) pulse(join);

        setAreaVisual(currentPanelArea, preset);
    }

    // ====================== LIGHTS: PANEL ARC DIAL ======================
    function updatePanelDial(pct) {
        const fill  = document.getElementById('p2-panel-arc-fill');
        const label = document.getElementById('p2-panel-arc-label');
        if (!fill) return;

        const cx = 100, cy = 105, r = 76;
        const deg = -180 + pct * 1.8;
        const rad = deg * Math.PI / 180;
        const ex  = cx + r * Math.cos(rad);
        const ey  = cy + r * Math.sin(rad);

        if (pct <= 0) {
            fill.setAttribute('d', 'M 24 105 A 76 76 0 0 1 24.001 105');
        } else if (pct >= 100) {
            fill.setAttribute('d', 'M 24 105 A 76 76 0 0 1 176 105');
        } else {
            const largeArc = pct > 50 ? 1 : 0;
            fill.setAttribute('d',
                `M 24 105 A 76 76 0 ${largeArc} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`);
        }
        if (label) label.textContent = pct + '%';
    }

    // ====================== LIGHTS: FEEDBACK SUBSCRIPTIONS ======================
    function setupLightsFeedback() {
        if (!hasCrestron()) return;

        Object.keys(areaState).forEach(key => {
            const st = areaState[key];

            if (st.fb) {
                subAnalog(st.fb, (val) => {
                    const v = Math.max(0, Math.min(100, parseInt(val, 10) || 0));
                    st.level = v;
                    if (currentPanelArea === key) {
                        const slider = document.getElementById('p2-panelDimSlider');
                        if (slider) slider.value = v;
                        document.getElementById('p2-panelDimValue').textContent = v;
                        updatePanelDial(v);
                    }
                });
            }

            // Digital feedback — same FB_OFFSET convention as page 1
            const FB_OFFSET = 100;
            ['on','dim','relax','off'].forEach(preset => {
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
    function setupShades() {
        const slider = document.getElementById('p2-shadeSlider');
        slider?.addEventListener('input', (e) => {
            const v = parseInt(e.target.value, 10);
            document.getElementById('p2-shadeValue').textContent = v;
            sendAnalog('236', v);
        });

        document.getElementById('p2-shadeUpBtn')  ?.addEventListener('click', () => pulse('250'));
        document.getElementById('p2-shadeStopBtn')?.addEventListener('click', () => pulse('252'));
        document.getElementById('p2-shadeDownBtn')?.addEventListener('click', () => pulse('251'));
    }

    // ====================== AC ======================
    function setupAC() {
        const acSlider = document.getElementById('p2-acSetpointSlider');
        acSlider?.addEventListener('input', (e) => {
            const v = parseInt(e.target.value, 10);
            const display = document.getElementById('p2-acSetValue');
            if (display) display.textContent = v;
            sendAnalog('241', v);
        });

        document.getElementById('p2-tog-ac')?.addEventListener('change', () => pulse('270'));

        document.getElementById('p2-acCoolBtn')?.addEventListener('click', () => pulse('271'));
        document.getElementById('p2-acHeatBtn')?.addEventListener('click', () => pulse('272'));
        document.getElementById('p2-acAutoBtn')?.addEventListener('click', () => pulse('273'));
        document.getElementById('p2-acDryBtn') ?.addEventListener('click', () => pulse('274'));
        document.getElementById('p2-acFanBtn') ?.addEventListener('click', () => pulse('275'));

        document.getElementById('p2-acFanLowBtn') ?.addEventListener('click', () => pulse('276'));
        document.getElementById('p2-acFanMedBtn') ?.addEventListener('click', () => pulse('277'));
        document.getElementById('p2-acFanHighBtn')?.addEventListener('click', () => pulse('278'));
        document.getElementById('p2-acFanAutoBtn')?.addEventListener('click', () => pulse('279'));

        document.getElementById('p2-acSwingBtn')?.addEventListener('click', () => pulse('281'));
    }

    // ====================== TV ======================
    function setupTV() {
        // Quick Actions
        document.getElementById('p2-tvPowerBtn')  ?.addEventListener('click', () => pulse('260'));
        document.getElementById('p2-tvNetflixBtn')?.addEventListener('click', () => pulse('261'));
        document.getElementById('p2-tvHdmiBtn')   ?.addEventListener('click', () => pulse('262'));

        // Remote Power & Source
        document.getElementById('p2-tvPowerBtn2')?.addEventListener('click', () => pulse('260'));
        document.getElementById('p2-tvSourceBtn')?.addEventListener('click', () => pulse('268'));

        // D-Pad
        document.getElementById('p2-tvDpadUp')   ?.addEventListener('click', () => pulse('263'));
        document.getElementById('p2-tvDpadDown') ?.addEventListener('click', () => pulse('264'));
        document.getElementById('p2-tvDpadLeft') ?.addEventListener('click', () => pulse('265'));
        document.getElementById('p2-tvDpadRight')?.addEventListener('click', () => pulse('266'));
        document.getElementById('p2-tvDpadOk')   ?.addEventListener('click', () => pulse('267'));

        // Numeric Keypad 0-9 → joins 280–289
        for (let i = 0; i <= 9; i++) {
            const btn  = document.getElementById('p2-tvKey' + i);
            if (!btn) continue;
            const join = String(280 + i);
            btn.addEventListener('click', () => pulse(join));
        }

        document.getElementById('p2-tvKeyEnter')?.addEventListener('click', () => pulse('269'));

        // Volume & Channel
        document.getElementById('p2-tvVolUpBtn')  ?.addEventListener('click', () => pulse('290'));
        document.getElementById('p2-tvVolDownBtn')?.addEventListener('click', () => pulse('291'));
        document.getElementById('p2-tvMuteBtn')   ?.addEventListener('click', () => pulse('292'));
        document.getElementById('p2-tvChUpBtn')   ?.addEventListener('click', () => pulse('293'));
        document.getElementById('p2-tvChDownBtn') ?.addEventListener('click', () => pulse('294'));

        // Favorites → joins 295+
        document.querySelectorAll('#page2 .fav-btn').forEach((btn, i) => {
            const joinNumber = 295 + i;
            btn.addEventListener('click', () => {
                pulse(String(joinNumber));
                console.log(`P2 Favorite ${i + 1} pressed → Digital Join ${joinNumber}`);
            });
        });
    }

    // ====================== FEEDBACK: GLOBAL ======================
    function setupFeedbackSubscriptions() {
        if (!hasCrestron()) return;

        setupLightsFeedback();

        // AC room temp feedback
        subAnalog('240', (val) => {
            const el = document.getElementById('p2-acCurrentTemp');
            if (el) el.textContent = Math.round(val) + '°C';
        });

        // Shades position feedback
        subAnalog('235', (val) => {
            const v = parseInt(val, 10);
            if (isNaN(v)) return;
            const slider = document.getElementById('p2-shadeSlider');
            if (slider) slider.value = v;
            const disp = document.getElementById('p2-shadeValue');
            if (disp) disp.textContent = v;
        });
    }

    function requestCurrentStatus() {
        pulse('299');
    }

    function notifyActivePage() {
        if (!hasCrestron()) return;
        CrComLib.publishEvent('b', 'active_state_class_page2', true);
    }

    // ====================== CLOCK ======================
    function startClock() {
        tick();
        setInterval(tick, 15000);
    }

    function tick() {
        const el = document.getElementById('p2-clockDisplay');
        if (!el) return;
        const n = new Date();
        el.textContent = n.getHours() + ':' + String(n.getMinutes()).padStart(2, '0');
    }

    // ====================== BOOTSTRAP ======================
    if (hasCrestron()) {
        let loadedSubId = CrComLib.subscribeState(
            'o',
            'ch5-import-htmlsnippet:page2-import-page',
            (value) => {
                if (value && value['loaded']) {
                    onInit();
                    setTimeout(
                        () => CrComLib.unsubscribeState(
                            'o',
                            'ch5-import-htmlsnippet:page2-import-page',
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