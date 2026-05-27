# Shades widget — timed motion & Stop-percentage

**Date:** 2026-05-20
**Scope:** All room pages with a Shades widget (page1–page9).
**Status:** Approved for implementation.

## Goal

Make every shade card on every page visibly track its motion over time, so that:

- Pressing **Open** flips the status to `Opening…` and animates the % from current value up to 100% over 20 s, then settles on `Opened`.
- Pressing **Close** flips the status to `Closing…` and animates the % from current value down to 0% over 20 s, then settles on `Closed`.
- Pressing **Stop** freezes the % at its current estimated value and shows `Stopped at NN%`.

No SIMPL feedback is required — the panel models position locally using a fixed travel time.

## Background — current behaviour

`buildShadeCard()` in each page's IIFE already renders a card with:

- `.sc-pct` — the % badge (top-right of the card)
- `.sc-bar-fill` — the horizontal fill bar
- `.sc-status` + `#sstat-txt-<key>-page<N>` — the status text line
- Three buttons: `.sc-btn-open`, `.sc-btn-stop`, `.sc-btn-close`

Today the Open / Close handlers just pulse the join, set the status text to `Opening…` / `Closing…` once, and apply the `sc-s-moving` class. The status text and `%` never advance from that point unless SIMPL publishes an analog position-feedback (`<NAME>_FB`) join — and most shades do not have one wired (see [joins1.js:91-92](app/project/components/pages/page1/joins1.js#L91-L92)).

## Decisions (from brainstorming)

| Decision | Value | Reason |
|---|---|---|
| Feedback source | Local timer | No SIMPL position-FB wired on most shades. |
| Travel time | 20 s for a full 0→100 traverse | Matches typical shutter motors in this install. |
| Mid-motion same-direction tap | No-op (animation continues) | Avoids restart jitter. |
| Mid-motion opposite-direction tap | Reverse proportionally from current % | Realistic motion model. |
| Stop press | Freeze % at current estimate, show `Stopped at NN%` | Always-visible % badge. |
| % display | Always visible — existing badge + fill bar are updated every frame | Matches existing layout. |
| SIMPL FB-join override | Preserved | If a `<NAME>_FB` analog join is later wired, its values still flow through `subAnalog()` and override the timer estimate. |

## Design

### Per-shade state object

Inside each page IIFE, `shadeState[key]` is extended from `{ pos, isOpen }` to:

```js
shadeState[key] = {
    pos:        0,      // current estimated % (0-100)
    isOpen:     false,  // derived: pos > 5
    direction:  null,   // null | 'opening' | 'closing'
    startedAt:  0,      // performance.now() when current motion began
    startPos:   0,      // pos at startedAt
    rafId:      null    // requestAnimationFrame handle
};
```

### Constants

```js
const SHADE_TRAVEL_MS = 20000;   // 20 s for 0 → 100
```

### New helper functions (added inside each page IIFE)

**`startShadeMotion(key, dir)`** — begin or reverse motion.

- Look up `st = shadeState[key]`.
- Guards:
  - if `dir === 'opening'` and `st.pos >= 100` and `st.direction === null` → return (already open).
  - if `dir === 'closing'` and `st.pos <= 0` and `st.direction === null` → return (already closed).
  - if `st.direction === dir` → return (already moving same way, do not restart).
- Cancel any pending `requestAnimationFrame(st.rafId)`.
- Set `st.direction = dir`, `st.startedAt = performance.now()`, `st.startPos = st.pos`.
- Update status text: `"Opening…"` or `"Closing…"`.
- Apply card state `moving`.
- Kick `tickShade(key)`.

**`tickShade(key)`** — single RAF step.

- Look up `st`. If `!st.direction` return.
- Compute `elapsed = performance.now() - st.startedAt`, `delta = elapsed / SHADE_TRAVEL_MS * 100`.
- If opening: `pos = min(100, st.startPos + delta)`.
- If closing: `pos = max(0, st.startPos - delta)`.
- Write `st.pos = pos`, `st.isOpen = pos > 5`.
- Call `renderShadeVisual(key, Math.round(pos))` and `updateShadesOpenCount()`.
- Termination check:
  - opening && pos >= 100 → clear `direction`/`rafId`, set status `"Opened"`, card state `open`. Return.
  - closing && pos <= 0 → clear `direction`/`rafId`, set status `"Closed"`, card state `closed`. Return.
- Otherwise: `st.rafId = requestAnimationFrame(() => tickShade(key))`.

**`stopShadeMotion(key)`** — freeze motion.

- Cancel `st.rafId`, clear `direction`.
- Set status `"Stopped at " + Math.round(st.pos) + "%"`.
- Apply card state `stopped`.

### Button handler changes inside `buildShadeCard()`

Replace the existing three `addEventListener('click', …)` blocks with:

```js
openBtn.addEventListener('click', () => {
    pulse(joinOpen);
    startShadeMotion(key, 'opening');
    flashBtn(openBtn);
});
closeBtn.addEventListener('click', () => {
    pulse(joinClose);
    startShadeMotion(key, 'closing');
    flashBtn(closeBtn);
});
stopBtn.addEventListener('click', () => {
    pulse(joinStop);
    stopShadeMotion(key);
    flashBtn(stopBtn);
});
```

The SIMPL pulse still fires on every tap — even on no-ops — because SIMPL may want to know the user pressed the button regardless of the panel-side animation state.

### SIMPL feedback preservation

The existing `subAnalog(joinFb, val => …)` block stays in `buildShadeCard()`. When a real FB join is wired:

- Each incoming analog value overwrites `st.pos` and re-renders.
- The timer animation is essentially overridden by the real values, since `tickShade` reads `st.startPos` at motion start but `subAnalog` rewrites `st.pos` continuously. To prevent the timer from fighting the real FB, the `subAnalog` callback should also clear `st.direction` and cancel `st.rafId` when it fires. This keeps timer and FB mutually exclusive: if FB is wired, FB wins; otherwise, timer drives.

### State-class mapping (existing CSS, unchanged)

| `direction` / outcome | Card class | Status text |
|---|---|---|
| `'opening'` (in flight) | `sc-s-moving` | `Opening…` |
| `'closing'` (in flight) | `sc-s-moving` | `Closing…` |
| reached 100 | `sc-s-open` | `Opened` |
| reached 0 | `sc-s-closed` | `Closed` |
| Stop pressed | `sc-s-stopped` | `Stopped at NN%` |

## Files touched

| File | Change |
|---|---|
| `app/project/components/pages/page1/page1.js` | Replace shade button handlers, add `SHADE_TRAVEL_MS`, `startShadeMotion`, `tickShade`, `stopShadeMotion`. Extend `shadeState[key]` shape. Add `direction = null; rafId = null;` clearing inside the existing `subAnalog(joinFb, …)` callback. |
| `app/project/components/pages/page2/page2.js` | Same. |
| `app/project/components/pages/page3/page3.js` | Same. |
| `app/project/components/pages/page4/page4.js` | Same. |
| `app/project/components/pages/page5/page5.js` | Same. |
| `app/project/components/pages/page6/page6.js` | Same. |
| `app/project/components/pages/page7/page7.js` | Same. |
| `app/project/components/pages/page8/page8.js` | Same. |
| `app/project/components/pages/page9/page9.js` | Same. |

No HTML, SCSS, or joinsN.js changes.

## Walk-through (acceptance scenario)

1. Card starts at `0% · Closed`.
2. Tap **Open** → pulses OPEN join. Status changes to `Opening…`, % animates 0→100 over 20 s, ends at `100% · Opened`.
3. Tap **Close** at 100% → pulses CLOSE join. Animates 100→0, ends at `0% · Closed`.
4. Tap **Open**, then tap **Stop** at ~7 s elapsed → STOP join pulses, animation freezes around 35%, status reads `Stopped at 35%`, card class `sc-s-stopped`.
5. From that frozen `35%`, tap **Close** → animates 35→0 over ~7 s, ends at `0% · Closed`.
6. Tap **Open** twice in quick succession → first tap starts motion at startPos=0; second tap pulses again (SIMPL receives 2 pulses) but the animation continues uninterrupted.
7. Tap **Open** then **Close** mid-flight at 40% → animation reverses with startPos=40, direction=closing, reaches 0 in ~8 s.

## Non-goals

- No analog `<NAME>_POS` send. The panel does not push position to SIMPL; it only consumes feedback if present.
- No per-shade travel-time override (single constant for all 9 pages, all shades).
- No UI changes to the shade card layout (buttons, badge, fill bar, status text element are all already there).
- No new joins added to any `joinsN.js`.
