/* ============================================================================
 * joins2.js  —  CRESTRON JOIN MAP for PAGE 2  (Living Room)
 * ============================================================================
 *
 *   Every join number used by page2 is declared here. To wire your SIMPL
 *   program: replace the numeric strings (e.g. '500') with the join number
 *   from your SIMPL Windows program. Keep the KEY NAMES exactly as written
 *   — page2.js looks them up by name.
 *
 *   Recommended page-N ranges:
 *     page2: 100–499   page2: 500–899   page3: 900–1299   …
 *   Shift each pageN by +400 from the previous to leave room.
 *
 *   ANALOG vs DIGITAL: there's no syntactic distinction in the map — both
 *   are just join-number strings. The TYPE is determined by HOW page2.js
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
 *   ▸▸▸ EDIT-FOR-PAGE-N: rename J2 → J<N> AND window.J2 → window.J<N>.
 *                         Also shift every join number to the new page's
 *                         range (e.g. page2 = (joinN + 400)).
 * ============================================================================ */

const J2 = {

    /* ─── SYSTEM ─────────────────────────────────────────────────────────
     * Page-level housekeeping signals.                                  */
    SYSTEM: {
        REQUEST_STATUS: '',  // D -> Pulse on init to ask CP4 to re-broadcast all FB
        PAGE_ACTIVE:    '',  // D -> True while this page is the visible page
        SHUTDOWN: '295', //without shutter  D -> Pulse when user confirms shutdown (without shutter)
        SHUTDOWN_WITH_SHUTTER:  '294',  // D -> Pulse when user confirms shutdown (with shutter)
        ACTIVE_WIDGET:  'page2_active_widget',  // S -> Currently visible tab name
        ACTIVE_AREA:    'page2_active_area'     // S -> Currently open area-popup label
    },

    /* ─── LIGHTS_GLOBAL ──────────────────────────────────────────────────
     * Whole-room lighting scenes, surfaced as the green pill bar at the
     * top of the Lights widget. Each pulse triggers ONE digital join.   */
    LIGHTS_GLOBAL: {
        MORNING:  '2881',   // D -> Whole-room "Morning" preset
        RELAX:    '2880',   // D -> "Relax"
        DRESSING: '2883',   // D -> "Dressing"
        SLEEP:    '2885'    // D -> "Sleep"
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

    LIGHTS_LIVING: {
        ON:    '3553', DIM:   '3554', RELAX: '3555', OFF:   '3556',
        DIMMER_SEND: '',  DIMMER_FB:    '',
        CHANNELS: [
            { label: 'Side Frame 2 Spots', ON: '2641', OFF: '2642' },
            { label: 'Living Spots',     ON: '2657', OFF: '2658' },
            { label: 'Inside Cove',       ON: '2651', OFF: '2652' },
            { label: 'Outside Cove',       ON: '2655', OFF: '2656'},
            { label: 'Chandeliers',      DIM_SEND: '247', DIM_FB: '247' }
            ]
    },
    LIGHTS_TERRACE: {
        ON:    '3586', DIM:   '3587', RELAX: '3588', OFF:   '3589',
        DIMMER_SEND: '',  DIMMER_FB:    '',
    },
    LIGHTS_CORRIDOR: {
        ON:    '3496', DIM:   '', RELAX: '', OFF:   '3499',
        DIMMER_SEND: '',  DIMMER_FB:    '',
    },
    

    /* ─── SHADES ─────────────────────────────────────────────────────────
     * Each shade group needs OPEN / CLOSE / STOP digital joins, optional
     * POS analog (panel writes target position) and FB analog (panel
     * reads current position 0-100). Section keys must match
     * SHADE_JOIN_PREFIX in page2.js.                                     */
    SHADES: {
        // Living Room shutter
        LIVING_ROOM_OPEN:  '3180',  // D -> raise
        LIVING_ROOM_CLOSE: '3181',  // D -> lower
        LIVING_ROOM_STOP:  '3183',  // D -> stop
        LIVING_ROOM_POS:   '',   // A -> target position 0-100
        LIVING_ROOM_FB:    '',   // A <- current position 0-100
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
        POWER:    '882',  //SOURCE:   '701',
        VOL_UP:   '883',  VOL_DOWN: '884',  MUTE:     '885',
        CH_UP:    '1145',  CH_DOWN:  '1146',
        DPAD_UP:  '1901',  DPAD_DOWN:'1902',  DPAD_LEFT:'1903',
        DPAD_RIGHT:'1904', DPAD_OK:  '1905',
        KEY_BACK: '1154',  KEY_HOME: '1156',  KEY_MENU: '1155',
        KEY_ENTER:'1905',  KEY_CHLIST:'1157',  LAUNCH:   '1158', //Exit: '1158'
        KEYPAD_BASE: 1906, // numeric — KEYPAD_BASE+0..9 → joins '730'-'739'
        //FAV_BASE:    740  // numeric — FAV_BASE+0..9   → joins '740'-'749'
    },

    /* ─── APPS  (satellite / streaming receivers) ────────────────────────
     * GLOBAL JOINS — these join numbers are identical on every page.
     * There is one physical OSN box, one BeIN box, one Freesat box in the
     * house, so their IR/driver joins do NOT change per room.
     * DO NOT shift these numbers when copying to another page.
     *
     * Ranges: OSN 5000-5027 | BEIN 5030-5057 | FREESAT 5060-5087       */
    APPS: {
        // -- OSN -------------------------------------------------------------------
        OSN: {
            POWER:    '880',  //SOURCE:   '5001',
            VOL_UP:   '887',  VOL_DOWN: '888',  MUTE:     '889',
            CH_UP:    '1308',  CH_DOWN:  '1307',
            DPAD_UP:  '544',   DPAD_DOWN:'545',   DPAD_LEFT:'546',
            DPAD_RIGHT:'547',  DPAD_OK:  '548',
            KEY_0: '558', KEY_1: '549', KEY_2: '550', KEY_3: '551',
            KEY_4: '552', KEY_5: '553', KEY_6: '554', KEY_7: '555',
            KEY_8: '556', KEY_9: '557',
            KEY_HOME: '1306', KEY_MENU: '1311', KEY_BACK: '1309',
            KEY_CHLIST: '', LAUNCH: ''
        },
        // -- BeIN Sports -----------------------------------------------------------
        BEIN: {
            POWER:    '880',  //SOURCE:   '5031',
            VOL_UP:   '887',  VOL_DOWN: '888',  MUTE:     '889',
            CH_UP:    '1248',  CH_DOWN:  '1249',
            DPAD_UP:  '577',   DPAD_DOWN:'578',   DPAD_LEFT:'579',
            DPAD_RIGHT:'580',  DPAD_OK:  '581',
            KEY_0: '591', KEY_1: '582', KEY_2: '583', KEY_3: '584',
            KEY_4: '585', KEY_5: '586', KEY_6: '587', KEY_7: '588',
            KEY_8: '589', KEY_9: '590',
            KEY_HOME: '1247', KEY_MENU: '1251', KEY_BACK: '1250',
            KEY_CHLIST: ''
        },
        // -- Freesat ---------------------------------------------------------------
        FREESAT: {
            POWER:    '880',     //SOURCE:   '',
            VOL_UP:   '887',   VOL_DOWN: '888',   MUTE:     '889',
            CH_UP:    '560',   CH_DOWN:  '561',
            DPAD_UP:  '560',   DPAD_DOWN:'561',   DPAD_LEFT:'562',
            DPAD_RIGHT:'563',  DPAD_OK:  '564',
            KEY_0: '574', KEY_1: '565', KEY_2: '566', KEY_3: '567',
            KEY_4: '568', KEY_5: '569', KEY_6: '570', KEY_7: '571',
            KEY_8: '572', KEY_9: '573',
            KEY_HOME: '1486', KEY_MENU: '1487', KEY_BACK: '1478'
        }
    },

    /* ─── APP LAUNCHERS  (quick-grid buttons in the TV widget) ───────────
     * One digital join per launcher button in the .quick-grid above the
     * TV controls. Pulsed when the user taps OSN / BeIN / Freesat — fires
     * BEFORE the receiver-remote view is shown, so SIMPL can switch the
     * AV matrix to that source. Per-page; leave '' for UI-only.         */
    LAUNCHERS: {
        OSN:     '896',   // D -> tapping OSN launcher
        BEIN:    '898',   // D -> tapping BeIN launcher
        FREESAT: '895'    // D -> tapping Freesat launcher
    },

    /* ─── MUSIC WIDGET ───────────────────────────────────────────────────
     * Five-button audio control. Each pulses one digital join.          */
    MUSIC: {
        AIRPLAY:   '',
        VOL_UP:    '',
        VOL_DOWN:  '',
        MUTE:      '',
        POWER_OFF: ''
    }

};


/* ---- Expose the map globally ---------------------------------------------
 * `const J2 = {...}` declared at top-level of a classic <script> creates a
 * binding in the shared script-scope — it IS visible to page2.js loaded
 * after this file with a plain <script src="page2.js"></script>.
 * We ALSO assign it to window.J2 so:
 *   - you can probe it in the browser console as window.J2
 *   - page2.js's `typeof window.J2` safety check finds it even in odd scopes
 *
 * ▸▸▸ EDIT-FOR-PAGE-N: rename J2 → J<N> AND window.J2 → window.J<N>.
 * ------------------------------------------------------------------------- */
if (typeof window !== 'undefined') window.J2 = J2;

/* ---- Module export (future-proofing for ES-module / webpack / vite) ----- */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = J2;
}
