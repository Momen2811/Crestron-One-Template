/* ============================================================================
 * joins1.js  —  CRESTRON JOIN MAP for PAGE 1  (Master Bedroom)
 * ============================================================================
 *
 *   Every join number used by page1 is declared here. To wire your SIMPL
 *   program: replace the numeric strings (e.g. '100') with the join number
 *   from your SIMPL Windows program. Keep the KEY NAMES exactly as written
 *   — page1.js looks them up by name.
 *
 *   Recommended page-N ranges:
 *     page1: 100–499   page2: 500–899   page3: 900–1299   …
 *   Shift each pageN by +400 from the previous to leave room.
 *
 *   ANALOG vs DIGITAL: there's no syntactic distinction in the map — both
 *   are just join-number strings. The TYPE is determined by HOW page1.js
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
 *   ▸▸▸ EDIT-FOR-PAGE-N: rename J1 → J<N> AND window.J1 → window.J<N>.
 *                         Also shift every join number to the new page's
 *                         range (e.g. page2 = (joinN + 400)).
 * ============================================================================ */

const J1 = {

    /* ─── SYSTEM ─────────────────────────────────────────────────────────
     * Page-level housekeeping signals.                                  */
    SYSTEM: {
        REQUEST_STATUS: '100',  // D -> Pulse on init to ask CP4 to re-broadcast all FB
        PAGE_ACTIVE:    '101',  // D -> True while this page is the visible page
        SHUTDOWN:               '25',  // D -> Pulse when user confirms shutdown (without shutter)
        SHUTDOWN_WITH_SHUTTER:  '24',  // D -> Pulse when user confirms shutdown (with shutter)
        ACTIVE_WIDGET:  'page1_active_widget',  // S -> Currently visible tab name
        ACTIVE_AREA:    'page1_active_area'     // S -> Currently open area-popup label
    },

    /* ─── LIGHTS_GLOBAL ──────────────────────────────────────────────────
     * Whole-room lighting scenes, surfaced as the green pill bar at the
     * top of the Lights widget. Each pulse triggers ONE digital join.   */
    LIGHTS_GLOBAL: {
        MORNING:  '2801',   // D -> Whole-room "Morning" preset
        RELAX:    '2800',   // D -> "Relax"
        DRESSING: '2803',   // D -> "Dressing"
        SLEEP:    '2806'    // D -> "Sleep"
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

    LIGHTS_BEDROOM: {
        ON:    '3511', DIM:   '3512', RELAX: '3513', OFF:   '3515',
                // Detail-popup channels — assign actual SIMPL joins; delete unused rows freely.
        // D = Digital (ON/OFF pulse)   A = Analog (dimmer send/feedback 0-100)
         },
    LIGHTS_BATHROOM: {
        ON:    '3521', DIM:   '3522', RELAX: '3523', OFF:   '3524',
    },
    LIGHTS_DRESSING: {
        ON:    '3516', DIM:   '3517', RELAX: '3518', OFF:   '3519',
    },
    LIGHTS_READING: {
        ON:    '2498',  OFF:   '2499',
    },

   
    /* ─── SHADES ─────────────────────────────────────────────────────────
     * Each shade group needs OPEN / CLOSE / STOP digital joins, optional
     * POS analog (panel writes target position) and FB analog (panel
     * reads current position 0-100). Section keys must match
     * SHADE_JOIN_PREFIX in page1.js.                                     */
    SHADES: {
        // Bedroom shutter — keys MUST be UPPERCASE: page1.js builds the
        // lookup as SHADE_JOIN_PREFIX['bedroom'] ('BEDROOM') + '_OPEN'.
        BEDROOM_OPEN:  '3174',  // D -> raise
        BEDROOM_CLOSE: '3175',  // D -> lower
        BEDROOM_STOP:  '3177',  // D -> stop
        //BEDROOM_POS:   '1',   // A -> target position 0-100
        //BEDROOM_FB:    '1',   // A <- current position 0-100
    },

    /* ─── AC (Air Conditioner) ───────────────────────────────────────────
     * Mode / fan buttons are mutually-exclusive; the FB joins drive the
     * "active" highlight on the matching button.                        */
    AC: {
        POWER:         '',   // D -> on / off pulse  ← fill in real join
        POWER_FB:      '',   // D <- current power state
        MODE_AUTO:     '',   MODE_AUTO_FB:     '',
        MODE_COOL:     '',   MODE_COOL_FB:     '',
        MODE_HEAT:     '',   MODE_HEAT_FB:     '',
        MODE_DRY:      '',   MODE_DRY_FB:      '',
        MODE_FAN_ONLY: '',   MODE_FAN_ONLY_FB: '',
        FAN_AUTO:      '',   FAN_AUTO_FB:      '',
        FAN_LOW:       '',   FAN_LOW_FB:       '',
        FAN_MED:       '',   FAN_MED_FB:       '',
        FAN_HIGH:      '',   FAN_HIGH_FB:      '',
        SP_SEND:       '',   SP_FB:            '',
        ROOM_TEMP_FB:  ''
    },

    /* ─── HEATER ─────────────────────────────────────────────────────────
     * Same shape as AC but for an underfloor / radiator heater.         */
    HEATER: {
        POWER:        '',   // D -> on / off pulse  ← fill in real join
        POWER_FB:     '',   // D <- current power state
        SP_SEND:      '',   // A -> setpoint
        SP_FB:        '',   // A <- setpoint feedback
        ROOM_TEMP_FB: ''    // A <- current room temp
    },

    /* ─── TV ─────────────────────────────────────────────────────────────
     * Transport + dpad + keypad + favorites. KEYPAD_BASE and FAV_BASE
     * are NUMBERS (not strings) because the JS adds an index offset:
     *     FAV_BASE + i   →  one join per favorite slot
     *     KEYPAD_BASE + i → one join per number 0-9                     */
    TV: {
        POWER:    '802',  //SOURCE:   '301',
        VOL_UP:   '807',  VOL_DOWN: '808',  MUTE:     '809',
        CH_UP:    '1025',  CH_DOWN:  '1026',
        DPAD_UP:  '794',  DPAD_DOWN:'795',  DPAD_LEFT:'796',
        DPAD_RIGHT:'797', DPAD_OK:  '798',
        KEY_BACK: '1034',  KEY_HOME: '1036',  KEY_MENU: '1035',
        KEY_ENTER:'798',  KEY_CHLIST:'1037',
        KEYPAD_BASE: 780, // numeric — KEYPAD_BASE+0..9 → joins '780'-'789'
      //  FAV_BASE:    340  // numeric — FAV_BASE+0..9   → joins '340'-'349'
    },

    /* ─── APPS  (satellite / streaming receivers) ────────────────────────
     * GLOBAL JOINS — these join numbers are identical on every page.
     * There is one physical OSN box, one BeIN box, one Freesat box in the
     * house, so their IR/driver joins do NOT change per room.
     * DO NOT shift these numbers when copying to another page.
     *
     * Ranges: OSN 5000-5027 | BEIN 5030-5057 | FREESAT 5060-5087       */
    APPS: {
        // -- OSN ----------------------------------------------------------
        OSN: {
            POWER:    '802',  //SOURCE:   '5001',
            VOL_UP:   '807',  VOL_DOWN: '808',  MUTE:     '809',
            CH_UP:    '1308',  CH_DOWN:  '1307',
            DPAD_UP:  '544',   DPAD_DOWN:'545',   DPAD_LEFT:'546',
            DPAD_RIGHT:'547',  DPAD_OK:  '548',
            KEY_0: '558', KEY_1: '549', KEY_2: '550', KEY_3: '551',
            KEY_4: '552', KEY_5: '553', KEY_6: '554', KEY_7: '555',
            KEY_8: '556', KEY_9: '557',
            KEY_HOME: '1306', KEY_MENU: '1311', KEY_BACK: '1309',
            KEY_CHLIST: '', LAUNCH: ''
        },
        // -- BeIN Sports --------------------------------------------------
        BEIN: {
            POWER:    '802',  //SOURCE:   '5031',
            VOL_UP:   '807',  VOL_DOWN: '808',  MUTE:     '809',
            CH_UP:    '1248',  CH_DOWN:  '1249',
            DPAD_UP:  '577',   DPAD_DOWN:'578',   DPAD_LEFT:'579',
            DPAD_RIGHT:'580',  DPAD_OK:  '581',
            KEY_0: '591', KEY_1: '582', KEY_2: '583', KEY_3: '584',
            KEY_4: '585', KEY_5: '586', KEY_6: '587', KEY_7: '588',
            KEY_8: '589', KEY_9: '590',
            KEY_HOME: '1247', KEY_MENU: '1251', KEY_BACK: '1250',
            KEY_CHLIST: ''
        },
        // -- Freesat ------------------------------------------------------
        FREESAT: {
            POWER:    '802',     //SOURCE:   '',
            VOL_UP:   '807',   VOL_DOWN: '808',   MUTE:     '809',
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
        OSN:     '816',   // D -> tapping OSN launcher
        BEIN:    '818',   // D -> tapping BeIN launcher
        FREESAT: '815'    // D -> tapping Freesat launcher
    },

    /* ─── MUSIC WIDGET ───────────────────────────────────────────────────
     * Five-button audio control. Each pulses one digital join.          */
    MUSIC: {
        AIRPLAY:   '700',
        VOL_UP:    '704',
        VOL_DOWN:  '705',   
        MUTE:      '706',
        POWER_OFF: '707'
    }

};


/* ---- Expose the map globally ---------------------------------------------
 * `const J1 = {...}` declared at top-level of a classic <script> creates a
 * binding in the shared script-scope — it IS visible to page1.js loaded
 * after this file with a plain <script src="page1.js"></script>.
 * We ALSO assign it to window.J1 so:
 *   - you can probe it in the browser console as window.J1
 *   - page1.js's `typeof window.J1` safety check finds it even in odd scopes
 *
 * ▸▸▸ EDIT-FOR-PAGE-N: rename J1 → J<N> AND window.J1 → window.J<N>.
 * ------------------------------------------------------------------------- */
if (typeof window !== 'undefined') window.J1 = J1;

/* ---- Module export (future-proofing for ES-module / webpack / vite) ----- */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = J1;
}
