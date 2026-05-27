/* ============================================================================
 * joins9.js  —  CRESTRON JOIN MAP for PAGE 9  (Garden)
 * ============================================================================
 *
 *   Every join number used by page9 is declared here. To wire your SIMPL
 *   program: replace the numeric strings (e.g. '3300') with the join number
 *   from your SIMPL Windows program. Keep the KEY NAMES exactly as written
 *   — page9.js looks them up by name.
 *
 *   Recommended page-N ranges:
 *     page9: 100–499   page2: 500–899   page3: 900–1299   …
 *   Shift each pageN by +400 from the previous to leave room.
 *
 *   ANALOG vs DIGITAL: there's no syntactic distinction in the map — both
 *   are just join-number strings. The TYPE is determined by HOW page9.js
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
 *   ▸▸▸ EDIT-FOR-PAGE-N: rename J9 → J<N> AND window.J9 → window.J<N>.
 *                         Also shift every join number to the new page's
 *                         range (e.g. page2 = (joinN + 400)).
 * ============================================================================ */

const J9 = {

    /* ─── SYSTEM ─────────────────────────────────────────────────────────
     * Page-level housekeeping signals.                                  */
    SYSTEM: {
        REQUEST_STATUS: '3300',  // D -> Pulse on init to ask CP4 to re-broadcast all FB
        PAGE_ACTIVE:    '3301',  // D -> True while this page is the visible page
        SHUTDOWN:               '143',  // D -> Pulse when user confirms shutdown (without shutter)
        SHUTDOWN_WITH_SHUTTER:  '143',  // D -> Pulse when user confirms shutdown (with shutter)
        ACTIVE_WIDGET:  'page9_active_widget',  // S -> Currently visible tab name
        ACTIVE_AREA:    'page9_active_area'     // S -> Currently open area-popup label
    },

    /* ─── LIGHTS_GLOBAL ──────────────────────────────────────────────────
     * Whole-room lighting scenes, surfaced as the green pill bar at the
     * top of the Lights widget. Each pulse triggers ONE digital join.   */
    LIGHTS_GLOBAL: {
        MORNING:  '2870',   // D -> Whole-room "Morning" preset
        RELAX:    '2875',   // D -> "Relax"
        DRESSING: '2786',   // D -> "Dressing"
        SLEEP:    ''    // D -> "Sleep"
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

    /* ── LANDSCAPE sub-widget ─────────────────────────────────────── */
    LIGHTS_LANDSCAPE: {
        ON: '3265', DIM: '3266', RELAX: '3267', OFF: '3268'
    },
    LIGHTS_TERRACE: {
        ON: '3259', DIM: '', RELAX: '', OFF: '3262'
    },
    LIGHTS_PERGOLA: {
        ON: '3253', DIM: '3254', RELAX: '', OFF: '3256'
    },
    LIGHTS_FANS: {
        ON: '3250', DIM: '', RELAX: '', OFF: '3251'
    },
    LIGHTS_POOL: {
        ON: '3486', DIM: '', RELAX: '', OFF: '3489'
    },

    /* ── VILLA sub-widget ─────────────────────────────────────────── */

    LIGHTS_GROUND_OUTDOOR_ENTRANCE: {
        ON: '3491', DIM: '3492', RELAX: '3493', OFF: '3494'
    },
    LIGHTS_GARAGE: {
        ON: '3541', DIM: '3542', RELAX: '3543', OFF: '3544'
    },
    LIGHTS_BASEMENT_OUTDOOR_ENTRANCE: {
        ON: '3272', DIM: '', RELAX: '', OFF: '3275'
    },
    LIGHTS_MAIN_ENTRANCE_STAIRS: {
        ON: '3615', DIM: '', RELAX: '', OFF: '3616'
    },
    LIGHTS_LEFT_STAIRS: {
        ON: '3399', DIM: '', RELAX: '', OFF: '3400'
    },
    LIGHTS_RIGHT_STAIRS: {
        ON: '3618', DIM: '', RELAX: '', OFF: '3619'
    },

    /* ── STREET sub-widget ────────────────────────────────────────── */

    LIGHTS_STREET_ENTRANCE: {
        ON: '3100', DIM: '', RELAX: '', OFF: '3101'
    },
    LIGHTS_STREET_GARAGE_GATE: {
        ON: '3567', DIM: '', RELAX: '', OFF: '3568'
    },

    /* ─── SHADES ─────────────────────────────────────────────────────────
     * Each shade group needs OPEN / CLOSE / STOP digital joins, optional
     * POS analog (panel writes target position) and FB analog (panel
     * reads current position 0-100). Section keys must match
     * SHADE_JOIN_PREFIX in page9.js.                                     */
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
    },

    /* ─── APPS  (streaming app launchers + in-app remote) ────────────────
     * Each app key (e.g. NETFLIX) gets its own dpad + keypad joins so
     * the app-specific remote in the popup can talk to the right driver. */
    APPS: {
    },

    /* ─── APP LAUNCHERS  (quick-grid buttons in the TV widget) ───────────
     * One digital join per launcher button in the .quick-grid above the
     * TV controls. Pulsed when the user taps OSN / Apple TV / BeIN —
     * fires BEFORE the receiver-remote view is shown, so SIMPL can switch
     * the AV matrix to that source. Per-page; leave '' for UI-only.     */
    LAUNCHERS: {
        OSN:     '',   // D -> tapping OSN launcher
        APPLETV: '',   // D -> tapping Apple TV launcher
        BEIN:    ''    // D -> tapping BeIN launcher
    },

    /* ─── MUSIC WIDGET ───────────────────────────────────────────────────
     * Five-button audio control. Each pulses one digital join.          */
    MUSIC: {
        LANDSCAPE: {
            AIRPLAY:   '470',
            VOL_UP:    '474',
            VOL_DOWN:  '475',
            MUTE:      '476',
            POWER_OFF: '477'
        },
        TERRACE: {
            AIRPLAY:   '515',
            VOL_UP:    '519',
            VOL_DOWN:  '520',
            MUTE:      '521',
            POWER_OFF: '522'
        }
    }
};


/* ---- Expose the map globally ---------------------------------------------
 * `const J9 = {...}` declared at top-level of a classic <script> creates a
 * binding in the shared script-scope — it IS visible to page9.js loaded
 * after this file with a plain <script src="page9.js"></script>.
 * We ALSO assign it to window.J9 so:
 *   - you can probe it in the browser console as window.J9
 *   - page9.js's `typeof window.J9` safety check finds it even in odd scopes
 *
 * ▸▸▸ EDIT-FOR-PAGE-N: rename J9 → J<N> AND window.J9 → window.J<N>.
 * ------------------------------------------------------------------------- */
if (typeof window !== 'undefined') window.J9 = J9;

/* ---- Module export (future-proofing for ES-module / webpack / vite) ----- */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = J9;
}
