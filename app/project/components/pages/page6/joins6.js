/* ============================================================================
 * joins6.js  —  CRESTRON JOIN MAP for PAGE 6  (Office)
 * ============================================================================
 *
 *   Every join number used by page6 is declared here. To wire your SIMPL
 *   program: replace the numeric strings (e.g. '2100') with the join number
 *   from your SIMPL Windows program. Keep the KEY NAMES exactly as written
 *   — page6.js looks them up by name.
 *
 *   Recommended page-N ranges:
 *     page6: 100–499   page2: 500–899   page3: 900–1299   …
 *   Shift each pageN by +400 from the previous to leave room.
 *
 *   ANALOG vs DIGITAL: there's no syntactic distinction in the map — both
 *   are just join-number strings. The TYPE is determined by HOW page6.js
 *   calls them (pulse/subBool = digital; sendAnalog/subAnalog = analog;
 *   sendSerial/subSerial = serial). Comments below mark which is which:
 *     D  = Digital  (boolean — pulse / on / off)
 *     A  = Analog   (number  — level 0-100, temperature, volume, …)
 *     S  = Serial   (string  — text)
 *
 *   DIRECTION:
 *     ->  panel publishes to CP4   (pulse / sendAnalog / sendSerial)
 *     <-  panel subscribes from CP4 (subBool / subAnalog / subSerial)
 *
 *   ▸▸▸ EDIT-FOR-PAGE-N: rename J6 → J<N> AND window.J6 → window.J<N>.
 *                         Also shift every join number to the new page's
 *                         range (e.g. page2 = (joinN + 400)).
 * ============================================================================ */

const J6 = {

    /* ─── SYSTEM ─────────────────────────────────────────────────────────
     * Page-level housekeeping signals.                                  */
    SYSTEM: {
        REQUEST_STATUS: '2100',  // D -> Pulse on init to ask CP4 to re-broadcast all FB
        PAGE_ACTIVE:    '2101',  // D -> True while this page is the visible page
        SHUTDOWN:               '115',  // D -> Pulse when user confirms shutdown (without shutter)
        SHUTDOWN_WITH_SHUTTER:  '114',  // D -> Pulse when user confirms shutdown (with shutter)
        ACTIVE_WIDGET:  'page6_active_widget',  // S -> Currently visible tab name
        ACTIVE_AREA:    'page6_active_area'     // S -> Currently open area-popup label
    },

    /* ─── LIGHTS_GLOBAL ──────────────────────────────────────────────────
     * Whole-room lighting scenes, surfaced as the green pill bar at the
     * top of the Lights widget. Each pulse triggers ONE digital join.   */
    LIGHTS_GLOBAL: {
        MORNING:  '2840',   // D -> Whole-room "Morning" preset
        RELAX:    '2841',   // D -> "Relax"
        DRESSING: '2842',   // D -> "Dressing"
        SLEEP:    '2843'    // D -> "Sleep"
    },

    /* ─── LIGHTS_<AREA> ──────────────────────────────────────────────────
     * One section per lighting area. The Lights widget renders ONE row
     * per area, each with 4 inline buttons that pulse the joins below:
     *      All On  → ON      Dim   → DIM
     *      Relax   → RELAX   All Off → OFF
     *
     * DIMMER_SEND / DIMMER_FB are kept for future use (wire them up if
     * you re-add a per-area dimmer slider). They are NOT used by the
     * current 4-button row.                                             */

    LIGHTS_RECEPTION: {
        ON:    '3456', DIM:   '3457', RELAX: '3458', OFF:   '3459',
        CHANNELS: [
            { label: 'Right spots', ON: '2727', OFF: '2728', DIM_SEND: '', DIM_FB: '' },
            { label: 'Left spots',     ON: '2729', OFF: '2730', DIM_SEND: '', DIM_FB: '' },
            { label: 'Covelight',       ON: '2731', OFF: '2732', DIM_SEND: '', DIM_FB: '' },
            { label: 'Left Chandelier',       ON: '', OFF: '', DIM_SEND: '224', DIM_FB: '224' },
            { label: 'Right Chandelier',    ON: '', OFF: '', DIM_SEND: '220', DIM_FB: '220' },
        ]
    },
    LIGHTS_ENTRANCE_INDOOR: {
        ON:    '3107', DIM:   '3108', RELAX: '', OFF:   '3110',
    },
    LIGHTS_VOID: {
        ON:    '3097', DIM:   '', RELAX: '', OFF:   '3098',
    },
    LIGHTS_CORRIDOR: {
        ON:    '3094', DIM:   '', RELAX: '', OFF:   '3095',
    },
    LIGHTS_WC: {
        ON:    '3576', DIM:   '', RELAX: '', OFF:   '3579',
    },
    /* ─── SHADES ─────────────────────────────────────────────────────────
     * Each shade group needs OPEN / CLOSE / STOP digital joins, optional
     * POS analog (panel writes target position) and FB analog (panel
     * reads current position 0-100). Section keys must match
     * SHADE_JOIN_PREFIX in page6.js.                                     */
    SHADES: {
        // Living Room shutter
        ALL_OPEN:  '1755',  // D -> raise
        ALL_CLOSE: '1756',  // D -> lower
        ALL_STOP:  '1758',  // D -> stop
        ALL_POS:   '',   // A -> target position 0-100
        ALL_FB:    '',   // A <- current position 0-100

        // Bedroom shutter
        CHIMNEY_RIGHT_OPEN:  '1768', CHIMNEY_RIGHT_CLOSE: '1769', CHIMNEY_RIGHT_STOP: '1770',
        CHIMNEY_RIGHT_POS:   '', CHIMNEY_RIGHT_FB:    '',

        // Bedroom shutter
        CHIMNEY_LEFT_OPEN:  '1765', CHIMNEY_LEFT_CLOSE: '1766', CHIMNEY_LEFT_STOP: '1767',
        CHIMNEY_LEFT_POS:   '', CHIMNEY_LEFT_FB:    '',

        // Curtain (horizontal drape)
        DINING_OPEN:  '1762', DINING_CLOSE: '1763', DINING_STOP: '1764',
        DINING_POS:   '',  DINING_FB:    '',

        // Balcony shutter
        RECEPTION_OPEN:  '1759', RECEPTION_CLOSE: '1760', RECEPTION_STOP: '1761',
        RECEPTION_POS:   '',  RECEPTION_FB:    ''
    },

    /* ─── AC (Air Conditioner) ───────────────────────────────────────────
     * Mode / fan buttons are mutually-exclusive; the FB joins drive the
     * "active" highlight on the matching button.                        */
    AC: {
        POWER:         '',  // D -> on / off pulse
        POWER_FB:      '',  // D <- current power state
        MODE_AUTO:     '',  MODE_AUTO_FB:     '',
        MODE_COOL:     '',  MODE_COOL_FB:     '',
        MODE_HEAT:     '',  MODE_HEAT_FB:     '',
        MODE_DRY:      '',  MODE_DRY_FB:      '',
        MODE_FAN_ONLY: '',  MODE_FAN_ONLY_FB: '',
        FAN_AUTO:      '',  FAN_AUTO_FB:      '',
        FAN_LOW:       '',  FAN_LOW_FB:       '',
        FAN_MED:       '',  FAN_MED_FB:       '',
        FAN_HIGH:      '',  FAN_HIGH_FB:      '',

        SP_SEND:       '',   // A -> setpoint write (16-30 °C)
        SP_FB:         '',   // A <- setpoint echo from CP4
        ROOM_TEMP_FB:  ''    // A <- live room temperature
    },

    /* ─── HEATER ─────────────────────────────────────────────────────────
     * Same shape as AC but for an underfloor / radiator heater.         */
    HEATER: {
        POWER:        '',  POWER_FB:     '',
        SP_SEND:      '',   SP_FB:        '',  ROOM_TEMP_FB: ''
    },

    /* ─── TV ─────────────────────────────────────────────────────────────
     * Transport + dpad + keypad + favorites. KEYPAD_BASE and FAV_BASE
     * are NUMBERS (not strings) because the JS adds an index offset:
     *     FAV_BASE + i   →  one join per favorite slot
     *     KEYPAD_BASE + i → one join per number 0-9                     */
    TV: {
       
    },

    /* ─── APPS  (satellite / streaming receivers) ────────────────────────
     * GLOBAL JOINS — these join numbers are identical on every page.
     * There is one physical OSN box, one BeIN box, one Freesat box in the
     * house, so their IR/driver joins do NOT change per room.
     * DO NOT shift these numbers when copying to another page.
     *
     * Ranges: OSN 5000-5027 | BEIN 5030-5057 | FREESAT 5060-5087       */
    APPS: {
       
    },

    /* ─── APP LAUNCHERS  (quick-grid buttons in the TV widget) ───────────
     * One digital join per launcher button in the .quick-grid above the
     * TV controls. Pulsed when the user taps OSN / BeIN / Freesat — fires
     * BEFORE the receiver-remote view is shown, so SIMPL can switch the
     * AV matrix to that source. Per-page; leave '' for UI-only.         */
    LAUNCHERS: {
        OSN:     '',   // D -> tapping OSN launcher
        BEIN:    '',   // D -> tapping BeIN launcher
        FREESAT: ''    // D -> tapping Freesat launcher
    },

    /* ─── MUSIC WIDGET ───────────────────────────────────────────────────
     * Five-button audio control. Each pulses one digital join.          */
    MUSIC: {
        AIRPLAY:   '690',
        VOL_UP:    '694',
        VOL_DOWN:  '695',
        MUTE:      '696',
        POWER_OFF: '697'
    }

};


/* ---- Expose the map globally ---------------------------------------------
 * `const J6 = {...}` declared at top-level of a classic <script> creates a
 * binding in the shared script-scope — it IS visible to page6.js loaded
 * after this file with a plain <script src="page6.js"></script>.
 * We ALSO assign it to window.J6 so:
 *   - you can probe it in the browser console as window.J6
 *   - page6.js's `typeof window.J6` safety check finds it even in odd scopes
 *
 * ▸▸▸ EDIT-FOR-PAGE-N: rename J6 → J<N> AND window.J6 → window.J<N>.
 * ------------------------------------------------------------------------- */
if (typeof window !== 'undefined') window.J6 = J6;

/* ---- Module export (future-proofing for ES-module / webpack / vite) ----- */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = J6;
}
