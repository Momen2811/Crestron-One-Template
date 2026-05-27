/* ============================================================================
 * joins3.js  —  CRESTRON JOIN MAP for PAGE 3  (Reception)
 * ============================================================================
 *
 *   Every join number used by page3 is declared here. To wire your SIMPL
 *   program: replace the numeric strings (e.g. '900') with the join number
 *   from your SIMPL Windows program. Keep the KEY NAMES exactly as written
 *   — page3.js looks them up by name.
 *
 *   Recommended page-N ranges:
 *     page3: 100–499   page2: 500–899   page3: 900–1299   …
 *   Shift each pageN by +400 from the previous to leave room.
 *
 *   ANALOG vs DIGITAL: there's no syntactic distinction in the map — both
 *   are just join-number strings. The TYPE is determined by HOW page3.js
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
 *   ▸▸▸ EDIT-FOR-PAGE-N: rename J3 → J<N> AND window.J3 → window.J<N>.
 *                         Also shift every join number to the new page's
 *                         range (e.g. page2 = (joinN + 400)).
 * ============================================================================ */

const J3 = {

    /* ─── SYSTEM ─────────────────────────────────────────────────────────
     * Page-level housekeeping signals.                                  */
    SYSTEM: {
        REQUEST_STATUS: '',  // D -> Pulse on init to ask CP4 to re-broadcast all FB
        PAGE_ACTIVE:    '',  // D -> True while this page is the visible page
        SHUTDOWN:               '1804', // D -> Pulse when user confirms shutdown (without shutter)
        SHUTDOWN_WITH_SHUTTER:  '1803', // D -> Pulse when user confirms shutdown (with shutter)
        ACTIVE_WIDGET:  'page3_active_widget',  // S -> Currently visible tab name
        ACTIVE_AREA:    'page3_active_area'     // S -> Currently open area-popup label
    },

    /* ─── LIGHTS_GLOBAL ──────────────────────────────────────────────────
     * Whole-room lighting scenes, surfaced as the green pill bar at the
     * top of the Lights widget. Each pulse triggers ONE digital join.   */
    LIGHTS_GLOBAL: {
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
    },
                                                              
                       
     /* ─── SHADES ─────────────────────────────────────────────────────────
     * Each shade group needs OPEN / CLOSE / STOP digital joins, optional
     * POS analog (panel writes target position) and FB analog (panel
     * reads current position 0-100). Section keys must match
     * SHADE_JOIN_PREFIX in page3.js.                                    */ 
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
        AIRPLAY:   '740',   // D -> AirPlay device list (also triggers AirPlay popup)
        VOL_UP:    '744',   // D -> volume up
        VOL_DOWN:  '745',   // D -> volume down
        MUTE:      '746',   // D -> mute
        POWER_OFF: '747'    // D -> power off
    }

};


/* ---- Expose the map globally ---------------------------------------------
 * `const J3 = {...}` declared at top-level of a classic <script> creates a
 * binding in the shared script-scope — it IS visible to page3.js loaded
 * after this file with a plain <script src="page3.js"></script>.
 * We ALSO assign it to window.J3 so:
 *   - you can probe it in the browser console as window.J3
 *   - page3.js's `typeof window.J3` safety check finds it even in odd scopes
 *
 * ▸▸▸ EDIT-FOR-PAGE-N: rename J3 → J<N> AND window.J3 → window.J<N>.
 * ------------------------------------------------------------------------- */
if (typeof window !== 'undefined') window.J3 = J3;

/* ---- Module export (future-proofing for ES-module / webpack / vite) ----- */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = J3;
}
