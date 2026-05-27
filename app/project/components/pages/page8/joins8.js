/* ============================================================================
 * joins8.js  —  CRESTRON JOIN MAP for PAGE 8  (Bathroom)
 * ============================================================================
 *
 *   Every join number used by page8 is declared here. To wire your SIMPL
 *   program: replace the numeric strings (e.g. '2900') with the join number
 *   from your SIMPL Windows program. Keep the KEY NAMES exactly as written
 *   — page8.js looks them up by name.
 *
 *   Recommended page-N ranges:
 *     page8: 100–499   page2: 500–899   page3: 900–1299   …
 *   Shift each pageN by +400 from the previous to leave room.
 *
 *   ANALOG vs DIGITAL: there's no syntactic distinction in the map — both
 *   are just join-number strings. The TYPE is determined by HOW page8.js
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
 *   ▸▸▸ EDIT-FOR-PAGE-N: rename J8 → J<N> AND window.J8 → window.J<N>.
 *                         Also shift every join number to the new page's
 *                         range (e.g. page2 = (joinN + 400)).
 * ============================================================================ */

const J8 = {

    /* ─── SYSTEM ─────────────────────────────────────────────────────────
     * Page-level housekeeping signals.                                  */
    SYSTEM: {
        REQUEST_STATUS: '2900',  // D -> Pulse on init to ask CP4 to re-broadcast all FB
        PAGE_ACTIVE:    '2901',  // D -> True while this page is the visible page
        SHUTDOWN:               '263',  // D -> Pulse when user confirms shutdown (without shutter)
        SHUTDOWN_WITH_SHUTTER:  '263',  // D -> Pulse when user confirms shutdown (with shutter)
        ACTIVE_WIDGET:  'page8_active_widget',  // S -> Currently visible tab name
        ACTIVE_AREA:    'page8_active_area'     // S -> Currently open area-popup label
    },

    /* ─── LIGHTS_GLOBAL ──────────────────────────────────────────────────
     * Whole-room lighting scenes, surfaced as the green pill bar at the
     * top of the Lights widget. Each pulse triggers ONE digital join.   */
    LIGHTS_GLOBAL: {
        MORNING:  '2783',   // D -> Whole-room "Morning" preset
        RELAX:    '2784',   // D -> "Relax"
        DRESSING: '2785',   // D -> "Dressing"
        SLEEP:    '2786'    // D -> "Sleep"
    },

    /* ─── LIGHTS_<AREA> ──────────────────────────────────────────────────
     * One section per lighting area. The Lights widget renders ONE row
     * per area, each with 4 inline buttons that pulse the joins below:
     *      All On  → ON      Dim   → DIM
     *      Relax   → RELAX   All Off → OFF
     *
     * DIMMER_SEND / DIMMER_FB are kept for future use (wire them up if
     * you re-add a per-area dimmer slider). They are NOT used by the
     * current 4-button row.                                          */

    LIGHTS_BASEMENT: {
        ON:    '3420', DIM:   '3421', RELAX: '3424', OFF:   '3423',
    },
    LIGHTS_CORRIDOR: {
        ON:    '3286', DIM:   '', RELAX: '', OFF:   '3289',
    },
    LIGHTS_ENTRANCE_INDOOR: {
        ON:    '3279', DIM:   '3281', RELAX: '', OFF:   '3282',
    },
    LIGHTS_ENTRANCE_OUTDOOR: {
        ON:    '3272', DIM:   '', RELAX: '', OFF:   '3275',
    },

    /* ─── SHADES ─────────────────────────────────────────────────────────
     * Each shade group needs OPEN / CLOSE / STOP digital joins, optional
     * POS analog (panel writes target position) and FB analog (panel
     * reads current position 0-100). Section keys must match
     * SHADE_JOIN_PREFIX in page8.js.                                     */
    SHADES: {
    },


    /* ─── AC (Air Conditioner) ───────────────────────────────────────────
     * Mode / fan buttons are mutually-exclusive; the FB joins drive the
     * "active" highlight on the matching button.                        */
    AC: {

    },

    /* ─── HEATER ─────────────────────────────────────────────────────────
     * Same shape as AC but for an underfloor / radiator heater.         */
    HEATER: {
    },

    /* ─── TV ─────────────────────────────────────────────────────────────
     * Transport + dpad + keypad + favorites. KEYPAD_BASE and FAV_BASE
     * are NUMBERS (not strings) because the JS adds an index offset:
     *     FAV_BASE + i   →  one join per favorite slot
     *     KEYPAD_BASE + i → one join per number 0-9                     */
    TV: {
        POWER:    '989', // SOURCE:   '3101',
        VOL_UP:   '986',  VOL_DOWN: '987',  MUTE:     '988',
        CH_UP:    '1205',  CH_DOWN:  '1206',
        DPAD_UP:  '760',  DPAD_DOWN:'761',  DPAD_LEFT:'762',
        DPAD_RIGHT:'763', DPAD_OK:  '764',
        KEY_BACK: '1214',  KEY_HOME: '1216',  KEY_MENU: '1215',
        KEY_ENTER:'764',  KEY_CHLIST:'1217',
        KEYPAD_BASE: 766, // numeric — KEYPAD_BASE+0..9 → joins '3130'-'3139'
       // FAV_BASE:    3140  // numeric — FAV_BASE+0..9   → joins '3140'-'3149'
    },

    /* ─── APPS  (streaming app launchers + in-app remote) ────────────────
     * Each app key (e.g. NETFLIX) gets its own dpad + keypad joins so
     * the app-specific remote in the popup can talk to the right driver. */
    APPS: {
        // -- OSN -------------------------------------------------------------------
        OSN: {
            POWER:    '989',  //SOURCE:   '5001',
            VOL_UP:   '986',  VOL_DOWN: '987',  MUTE:     '988',
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
            POWER:    '989',  //SOURCE:   '5031',
            VOL_UP:   '986',  VOL_DOWN: '987',  MUTE:     '988',
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
            POWER:    '989',     //SOURCE:   '',
            VOL_UP:   '986',   VOL_DOWN: '987',   MUTE:     '988',
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
        OSN:     '996',   // D -> tapping OSN launcher
        BEIN:    '998',   // D -> tapping BeIN launcher
        FREESAT: '995'    // D -> tapping Freesat launcher
    },

    /* ─── MUSIC WIDGET ───────────────────────────────────────────────────
     * Five-button audio control. Each pulses one digital join.          */
    MUSIC: {
        AIRPLAY:   '1718',
        VOL_UP:    '1719',
        VOL_DOWN:  '1721',
        MUTE:      '1720',
        POWER_OFF: '1722'
    }

};


/* ---- Expose the map globally ---------------------------------------------
 * `const J8 = {...}` declared at top-level of a classic <script> creates a
 * binding in the shared script-scope — it IS visible to page8.js loaded
 * after this file with a plain <script src="page8.js"></script>.
 * We ALSO assign it to window.J8 so:
 *   - you can probe it in the browser console as window.J8
 *   - page8.js's `typeof window.J8` safety check finds it even in odd scopes
 *
 * ▸▸▸ EDIT-FOR-PAGE-N: rename J8 → J<N> AND window.J8 → window.J<N>.
 * ------------------------------------------------------------------------- */
if (typeof window !== 'undefined') window.J8 = J8;

/* ---- Module export (future-proofing for ES-module / webpack / vite) ----- */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = J8;
}
