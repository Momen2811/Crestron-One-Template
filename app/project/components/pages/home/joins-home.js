/* ============================================================================
 * joins-home.js  —  CRESTRON JOIN MAP for the Home Hub
 * ============================================================================
 *
 *   Suggested join range for the hub:
 *       D  10–29  (digital)
 *       A   1–9   (analog)
 *
 *   Renumber freely to match your CP4 SIMPL program.
 *
 *   Naming follows the same convention as joins<N>.js for the room pages:
 *     SECTION.KEY = 'joinNumber'
 *
 *   The hub's HOUSE_MODES joins are SEPARATE from each room's
 *   page<N>.HOUSE_MODES joins. If you want them to drive the same SIMPL
 *   logic, just give them the same number here as in joins1.js
 *   (e.g. JHOME.HOUSE_MODES.MORNING = '120' === J1.HOUSE_MODES.MORNING).
 *
 *   JOIN TYPE LEGEND
 *     D  = Digital  — boolean
 *     A  = Analog   — number
 *
 * ============================================================================ */

const JHOME = {

    /* SYSTEM
     * ----------------------------------------------------------------
     * Hub-level housekeeping signals.                                 */
    SYSTEM: {
        // D -> Pulse on hub init to ask CP4 to re-broadcast all state.
        REQUEST_REFRESH: '10',
        // S <- "Active page" feedback. Subscribed by other widgets that
        //      need to know which room the user is currently viewing.
        ACTIVE_PAGE:     '11',
        // D <- Heartbeat from the CP4. Wire SIMPL to TOGGLE this digital
        //      join every 2 seconds (an OSC pulse with a 50% duty cycle
        //      works fine). The panel watches the time between toggles —
        //      if it stops changing for >5 s, the .conn pill flips to
        //      "warn" (yellow); if >12 s it flips to "bad" (red).
        //      Leave as '' to disable the heartbeat entirely.
        HEARTBEAT:       '12'
    },

    /* HOUSE_MODES
     * ----------------------------------------------------------------
     * Six whole-house scenes. Each pulses one digital join.           */
    HOUSE_MODES: {
        MORNING: '3081',
        GUEST:   '3082',
        NIGHT:   '3084',
        AWAY:    '3083',
        PARTY:   '',
        RELAX:   ''
    },

    /* SENSORS
     * ----------------------------------------------------------------
     * The "Sensors" card on the home hub opens a popup with two
     * buttons; each pulses one of these digital joins.                */
    SENSORS: {
        ON:  '1375',   // D -> Pulse to enable all sensors
        OFF: '1376'    // D -> Pulse to disable all sensors
    },

    /* HOUSE_FUNCTIONS
     * ----------------------------------------------------------------
     * Per-floor on/off toggles for Lights, AC, Shades.
     * Convention: <FLOOR>_<SYSTEM>_<ON|OFF>                            */
    HOUSE_FUNCTIONS: {
        FIRST_LIGHTS_ON:    '', FIRST_LIGHTS_OFF:   '',
        FIRST_AC_ON:        '', FIRST_AC_OFF:       '',
        FIRST_SHADES_ON:    '', FIRST_SHADES_OFF:   '',

        GROUND_LIGHTS_ON:   '', GROUND_LIGHTS_OFF:  '',
        GROUND_AC_ON:       '', GROUND_AC_OFF:      '',
        GROUND_SHADES_ON:   '', GROUND_SHADES_OFF:  '',

        BASEMENT_LIGHTS_ON: '', BASEMENT_LIGHTS_OFF:'',
        BASEMENT_AC_ON:     '', BASEMENT_AC_OFF:    '',
        BASEMENT_SHADES_ON: '', BASEMENT_SHADES_OFF:''
    },

    /* SHUTDOWN
     * ----------------------------------------------------------------
     * Per-floor and whole-house shutdown pulses.
     * Convention: <FLOOR>_<SYSTEM> for floors,  ALL_<SYSTEM> for global,
     *             ALL_SYSTEMS = master one-tap kill switch.            */
    SHUTDOWN: {
        FIRST_LIGHTS:    '3212', FIRST_AV:    '3213', FIRST_SHADES:    '3215', FIRST_ALL:    '3211',
        GROUND_LIGHTS:   '3222', GROUND_AV:   '3223', GROUND_SHADES:   '3225', GROUND_ALL:   '3221',
        BASEMENT_LIGHTS: '3242', BASEMENT_AV: '3243', BASEMENT_SHADES: '3245', BASEMENT_ALL: '3241',
        ALL_LIGHTS:      '3232', ALL_AV:      '3233', ALL_SHADES:      '3235', ALL_AC:      '',
        ALL_SYSTEMS:     '3231'
    },

    /* WEATHER  (top-of-hub info card)
     * ----------------------------------------------------------------
     * Drive these from the CP4 with a weather driver, a REST call, or
     * any outdoor sensor/gateway you have. All joins are FEEDBACK only
     * (panel never writes). Leave any key as '' to hide its value on
     * the hub UI.
     *                                                                  */
    WEATHER: {
        TEMPERATURE: '3',                // A <- current outdoor temp  (integer °C)
        FEELS_LIKE:  '3',                // A <- "feels like" temp     (integer °C)
        HUMIDITY:    '2',                // A <- humidity              (0-100 %)
        WIND_SPEED:  '1',                // A <- wind speed            (km/h)
        CONDITION:   'weather_condition', // S <- "Sunny" / "Cloudy" / …
        ICON:        'weather_icon',      // S <- emoji or text glyph
        CITY:        'weather_city'       // S <- "Cairo"
    }

};

if (typeof window !== 'undefined') {
    window.JHOME = JHOME;
}
