/* page6.js */
const page6Module = (() => {
    'use strict';

    function onInit() {
        console.log('✅ Page 1 Initialized with 4 Widgets');

        setupButtonEventListeners();
        setupSliders();
        setupFeedbackSubscriptions();
        requestCurrentStatus();
        setupTopNavigation();
        initializeWidgets();
    }

    // ====================== WIDGET MANAGEMENT ======================
    function initializeWidgets() {
        const firstTab = document.querySelector('.tab-btn.active');
        if (firstTab) {
            const widgetName = firstTab.getAttribute('data-widget') || 'lights';
            switchWidget(widgetName, firstTab);
        }
    }

    window.switchWidget = function(widgetName, clickedBtn) {
        // Update active tab
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        if (clickedBtn) clickedBtn.classList.add('active');

        // Switch visible widget
        document.querySelectorAll('.widget').forEach(w => w.classList.remove('active'));
        const activeWidget = document.getElementById('widget-' + widgetName);
        if (activeWidget) activeWidget.classList.add('active');

        // Optional: Send to Crestron
        if (typeof CrComLib !== 'undefined') {
            CrComLib.publishEvent('s', 'active_widget_name', widgetName);
        }
    };

    window.switchTVSubWidget = function(subwidgetName, clickedBtn) {
        document.querySelectorAll('.sub-tab-btn').forEach(btn => btn.classList.remove('active'));
        clickedBtn.classList.add('active');
        
        document.querySelectorAll('.tv-subwidget').forEach(w => w.classList.remove('active'));
        document.getElementById(subwidgetName).classList.add('active');
    };

    // ====================== SHARED FUNCTIONS ======================
    function toggleTile(name, cls) {
        const tog = document.getElementById('tog-' + name);
        const tile = document.getElementById('tile-' + name);
        const lbl = document.getElementById('lbl-' + name);
        if (!tog || !tile || !lbl) return;

        const isOn = tog.checked;
        tile.classList.toggle(cls, isOn);
        lbl.textContent = isOn ? 'ON' : 'OFF';

        if (name === 'lights') setStatus(isOn ? 'on' : 'off');
    }

    function setStatus(s) {
        const pill = document.getElementById('statusPill');
        const text = document.getElementById('lightingStatus');
        if (!pill || !text) return;

        pill.className = 'spill';
        if (s === 'on')  { pill.classList.add('sp-on');  text.textContent = 'Lights: ON'; }
        if (s === 'off') { pill.classList.add('sp-off'); text.textContent = 'Lights: OFF'; }
        if (s === 'dim') { pill.classList.add('sp-dim'); text.textContent = 'Lights: DIMMED'; }
    }

    function updateDial(pct) {
        const fill = document.getElementById('arc-fill');
        const label = document.getElementById('arc-label');
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
            fill.setAttribute('d', `M 24 105 A 76 76 0 ${pct > 50 ? 1 : 0} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`);
        }
        if (label) label.textContent = pct + '%';
    }

    // ====================== SLIDERS & BUTTONS ======================
    function setupSliders() {
        // Dimmer Slider (Lights Widget)
        const dimSlider = document.getElementById('dimLevelSlider');
        if (dimSlider) {
            dimSlider.addEventListener('input', (e) => {
                const v = parseInt(e.target.value, 10);
                document.getElementById('dimValue').textContent = v;
                document.getElementById('dimPercentage').textContent = v + '%';
                updateDial(v);
                if (typeof CrComLib !== 'undefined') CrComLib.publishEvent('n', '31', v);
            });
        }

        // Shades Slider
        const shadeSlider = document.getElementById('shadeSlider');
        if (shadeSlider) {
            shadeSlider.addEventListener('input', (e) => {
                const v = parseInt(e.target.value, 10);
                document.getElementById('shadeValue').textContent = v;
                if (typeof CrComLib !== 'undefined') CrComLib.publishEvent('n', '36', v);
            });
        }

        // ==================== NEW: AC Setpoint Slider ====================
        const acSlider = document.getElementById('acSetpointSlider');
        if (acSlider) {
            acSlider.addEventListener('input', (e) => {
                const v = parseInt(e.target.value, 10);
                const display = document.getElementById('acSetValue');
                if (display) display.textContent = v;
                if (typeof CrComLib !== 'undefined') CrComLib.publishEvent('n', '41', v);
            });
        }
    }

    function setupButtonEventListeners() {
        // Lights Quick Buttons
        document.getElementById('lightsOnBtn')?.addEventListener('click', () => {
            setStatus('on');
            const t = document.getElementById('tog-lights');
            if (t) { t.checked = true; toggleTile('lights', 'd-active'); }
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '10', true);
                setTimeout(() => CrComLib.publishEvent('b', '10', false), 100);
            }
        });

        document.getElementById('lightsOffBtn')?.addEventListener('click', () => {
            setStatus('off');
            const t = document.getElementById('tog-lights');
            if (t) { t.checked = false; toggleTile('lights', 'd-active'); }
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '11', true);
                setTimeout(() => CrComLib.publishEvent('b', '11', false), 100);
            }
        });

        document.getElementById('lightsDimBtn')?.addEventListener('click', () => {
            const slider = document.getElementById('dimLevelSlider');
            if (slider) {
                slider.value = 50;
                const v = 50;
                document.getElementById('dimValue').textContent = v;
                document.getElementById('dimPercentage').textContent = v + '%';
                updateDial(v);
                if (typeof CrComLib !== 'undefined') {
                    CrComLib.publishEvent('n', '31', v);
                    CrComLib.publishEvent('b', '12', true);
                    setTimeout(() => CrComLib.publishEvent('b', '12', false), 100);
                }
            }
        });

        

        // Shades Buttons
        document.getElementById('shadeUpBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '50', true);
                setTimeout(() => CrComLib.publishEvent('b', '50', false), 100);
            }
        });
        document.getElementById('shadeStopBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '52', true);
                setTimeout(() => CrComLib.publishEvent('b', '52', false), 100);
            }
        });
        document.getElementById('shadeDownBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '51', true);
                setTimeout(() => CrComLib.publishEvent('b', '51', false), 100);
            }
        });

        // ==================== NEW: AC CONTROLS ====================
        // AC Power Toggle (pulses on every change - matches Crestron toggle behavior)
        const acToggle = document.getElementById('tog-ac');
        if (acToggle) {
            acToggle.addEventListener('change', () => {
                if (typeof CrComLib !== 'undefined') {
                    CrComLib.publishEvent('b', '70', true);
                    setTimeout(() => CrComLib.publishEvent('b', '70', false), 100);
                }
            });
        }

        // AC Modes
        document.getElementById('acCoolBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '71', true);
                setTimeout(() => CrComLib.publishEvent('b', '71', false), 100);
            }
        });
        document.getElementById('acHeatBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '72', true);
                setTimeout(() => CrComLib.publishEvent('b', '72', false), 100);
            }
        });
        document.getElementById('acAutoBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '73', true);
                setTimeout(() => CrComLib.publishEvent('b', '73', false), 100);
            }
        });
        document.getElementById('acDryBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '74', true);
                setTimeout(() => CrComLib.publishEvent('b', '74', false), 100);
            }
        });
        document.getElementById('acFanBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '75', true);
                setTimeout(() => CrComLib.publishEvent('b', '75', false), 100);
            }
        });

        // AC Fan Speeds
        document.getElementById('acFanLowBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '76', true);
                setTimeout(() => CrComLib.publishEvent('b', '76', false), 100);
            }
        });
        document.getElementById('acFanMedBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '77', true);
                setTimeout(() => CrComLib.publishEvent('b', '77', false), 100);
            }
        });
        document.getElementById('acFanHighBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '78', true);
                setTimeout(() => CrComLib.publishEvent('b', '78', false), 100);
            }
        });
        document.getElementById('acFanAutoBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '79', true);
                setTimeout(() => CrComLib.publishEvent('b', '79', false), 100);
            }
        });

        // AC Swing
        document.getElementById('acSwingBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '81', true);
                setTimeout(() => CrComLib.publishEvent('b', '81', false), 100);
            }
        });

        // ====================== TV BUTTONS & REMOTE ======================

        // Quick Action Buttons (Top of TV Widget)
        document.getElementById('tvPowerBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '60', true);
                setTimeout(() => CrComLib.publishEvent('b', '60', false), 100);
            }
        });

        document.getElementById('tvNetflixBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '61', true);
                setTimeout(() => CrComLib.publishEvent('b', '61', false), 100);
            }
        });

        document.getElementById('tvHdmiBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '62', true);
                setTimeout(() => CrComLib.publishEvent('b', '62', false), 100);
            }
        });

        // ==================== TV REMOTE CONTROLS (Inside TV Controls Sub-Widget) ====================

        // Power & Source Buttons (inside remote)
        document.getElementById('tvPowerBtn2')?.addEventListener('click', () => {   // tvPowerBtn2 is the one in remote
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '60', true);
                setTimeout(() => CrComLib.publishEvent('b', '60', false), 100);
            }
        });

        document.getElementById('tvSourceBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '68', true);   // You can change join number
                setTimeout(() => CrComLib.publishEvent('b', '68', false), 100);
            }
        });

        // ==================== D-PAD ====================
        document.getElementById('tvDpadUp')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '63', true);
                setTimeout(() => CrComLib.publishEvent('b', '63', false), 100);
            }
        });

        document.getElementById('tvDpadDown')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '64', true);
                setTimeout(() => CrComLib.publishEvent('b', '64', false), 100);
            }
        });

        document.getElementById('tvDpadLeft')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '65', true);
                setTimeout(() => CrComLib.publishEvent('b', '65', false), 100);
            }
        });

        document.getElementById('tvDpadRight')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '66', true);
                setTimeout(() => CrComLib.publishEvent('b', '66', false), 100);
            }
        });

        document.getElementById('tvDpadOk')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '67', true);
                setTimeout(() => CrComLib.publishEvent('b', '67', false), 100);
            }
        });

        // ==================== NUMERIC KEYPAD (0-9 + Enter) ====================
        for (let i = 0; i <= 9; i++) {
            const keyBtn = document.getElementById('tvKey' + i);
            if (keyBtn) {
                keyBtn.addEventListener('click', () => {
                    if (typeof CrComLib !== 'undefined') {
                        // Joins 90 to 99 for digits
                        CrComLib.publishEvent('b', '9' + String(i).padStart(2, '0'), true);
                        setTimeout(() => CrComLib.publishEvent('b', '9' + String(i).padStart(2, '0'), false), 100);
                    }
                });
            }
        }

        document.getElementById('tvKeyEnter')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '100', true);   // Enter button join
                setTimeout(() => CrComLib.publishEvent('b', '100', false), 100);
            }
        });

        // ==================== VOLUME & CHANNEL CONTROLS ====================
        document.getElementById('tvVolUpBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '101', true);
                setTimeout(() => CrComLib.publishEvent('b', '101', false), 100);
            }
        });

        document.getElementById('tvVolDownBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '102', true);
                setTimeout(() => CrComLib.publishEvent('b', '102', false), 100);
            }
        });

        document.getElementById('tvMuteBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '103', true);
                setTimeout(() => CrComLib.publishEvent('b', '103', false), 100);
            }
        });

        document.getElementById('tvChUpBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '104', true);
                setTimeout(() => CrComLib.publishEvent('b', '104', false), 100);
            }
        });

        document.getElementById('tvChDownBtn')?.addEventListener('click', () => {
            if (typeof CrComLib !== 'undefined') {
                CrComLib.publishEvent('b', '105', true);
                setTimeout(() => CrComLib.publishEvent('b', '105', false), 100);
            }
        });

        // ==================== FAVORITES GRID (Dynamic) ====================
        // Example: Assign joins starting from 110 onwards
        const favButtons = document.querySelectorAll('.fav-btn');
        favButtons.forEach((btn, index) => {
            const joinNumber = 110 + index;   // 110, 111, 112 ...
        
            btn.addEventListener('click', () => {
                if (typeof CrComLib !== 'undefined') {
                    CrComLib.publishEvent('b', String(joinNumber), true);
                    setTimeout(() => CrComLib.publishEvent('b', String(joinNumber), false), 100);
                }
                console.log(`Favorite ${index + 1} pressed → Digital Join ${joinNumber}`);
            });
        });
        

    function setupFeedbackSubscriptions() {
        // Existing dimmer feedback
        CrComLib.subscribeState('n', '30', (val) => {
            const slider = document.getElementById('dimLevelSlider');
            if (slider) slider.value = val;
            document.getElementById('dimValue').textContent = val;
            document.getElementById('dimPercentage').textContent = val + '%';
            updateDial(val);
        });

        // ==================== NEW: AC Feedback ====================
        CrComLib.subscribeState('n', '40', (val) => {
            const currentEl = document.getElementById('acCurrentTemp');
            if (currentEl) currentEl.textContent = Math.round(val) + '°C';
        });
    }

    function requestCurrentStatus() {
        if (typeof CrComLib !== 'undefined') {
            CrComLib.publishEvent('b', '99', true);
            setTimeout(() => CrComLib.publishEvent('b', '99', false), 100);
        }
    }

    function setupTopNavigation() {
        CrComLib.publishEvent("b", "active_state_class_page6", true);
    }

    // Clock
    function tick() {
        const el = document.getElementById('clockDisplay');
        if (!el) return;
        const n = new Date();
        el.textContent = n.getHours() + ':' + String(n.getMinutes()).padStart(2, '0');
    }
    setInterval(tick, 15000);
    tick();

    // Page Load Handler
    let loadedSubId = CrComLib.subscribeState('o', 'ch5-import-htmlsnippet:page6-import-page', (value) => {
        if (value && value['loaded']) {
            onInit();
            setTimeout(() => CrComLib.unsubscribeState('o', 'ch5-import-htmlsnippet:page6-import-page', loadedSubId), 100);
        }
    });

    return {};
}})();


