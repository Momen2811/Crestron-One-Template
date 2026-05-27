# Shades timed motion + Stop-percentage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a local 20-second travel-time model to every shade card so the % badge animates while opening / closing, settles on `Opened` / `Closed`, and reports `Stopped at NN%` on Stop. Applies to all 9 room pages.

**Architecture:** Pure client-side state machine inside each page's IIFE. A `direction` field on `shadeState[key]` plus a `requestAnimationFrame` loop interpolates `pos` between `startPos` and the target (0 or 100) over `SHADE_TRAVEL_MS = 20000` ms. Open/Close/Stop button handlers update this state machine. The existing SIMPL position-feedback subscription (`subAnalog(joinFb, …)`) is preserved and given priority: any incoming FB value clears the timer and overrides the estimate.

**Tech Stack:** Vanilla JS inside CH5 shell-template IIFEs. No build / test framework changes. Manual verification via `npm run start` (BrowserSync on http://localhost:3000).

**Project realities to know:**

- **No test runner, no linter, no TypeScript.** This codebase ships hand-written JS bundled by webpack. There is no automated test framework. Verification in every task below is **manual interaction in the dev-server browser**.
- **All 9 page IIFEs are byte-identical for the shade code.** Only `J<N>` and `PAGE_SUFFIX = '-page<N>'` differ between pages, but those are referenced through scope-captured locals (`JOINS`, `PAGE_SUFFIX`, `_gid`, `_qs`) so the new code drops in untouched per page.
- **Git identity may not be configured.** If a commit step fails with `Author identity unknown`, **stop and ask the user** how they want to handle it. CLAUDE.md / system rules forbid running `git config` autonomously.
- **`npm run start` self-exits on changes to `app/project-config.json`** — we don't touch that file, so the dev server stays up across all tasks.

**Spec:** `docs/superpowers/specs/2026-05-20-shades-timed-motion-design.md`

---

## File Structure

| File | Change |
|------|--------|
| `app/project/components/pages/page1/page1.js` | Reference implementation. Apply Shared Change Block (below). |
| `app/project/components/pages/page2/page2.js` | Apply Shared Change Block. |
| `app/project/components/pages/page3/page3.js` | Apply Shared Change Block. |
| `app/project/components/pages/page4/page4.js` | Apply Shared Change Block. |
| `app/project/components/pages/page5/page5.js` | Apply Shared Change Block. |
| `app/project/components/pages/page6/page6.js` | Apply Shared Change Block. |
| `app/project/components/pages/page7/page7.js` | Apply Shared Change Block. |
| `app/project/components/pages/page8/page8.js` | Apply Shared Change Block. |
| `app/project/components/pages/page9/page9.js` | Apply Shared Change Block. |

**Not touched:** any `page<N>.html`, any `page<N>.scss`, any `joins<N>.js`, the `home/` or template trees, webpack config, `project-config.json`. The status text element, % badge, fill bar, three buttons, and four state classes (`sc-s-open` / `sc-s-closed` / `sc-s-moving` / `sc-s-stopped`) already exist in the rendered card markup and the SCSS.

---

## Shared Change Block (referenced by every task)

This is the **single source of truth** for what changes inside each page's IIFE. Every per-page task below applies these five edits to that page's `page<N>.js` file. The new code only uses locally-scoped names that already exist inside every page IIFE — there are no per-page substitutions to make. Copy-paste verbatim.

### Edit A — Add `SHADE_TRAVEL_MS` constant

Inside the `// ====================== SHADES ======================` block, find this line:

```js
    const shadeState = {};
```

Replace with:

```js
    const SHADE_TRAVEL_MS = 20000;   // full 0 → 100 traverse time (matches design spec 2026-05-20)
    const shadeState = {};
```

### Edit B — Extend the `shadeState[key]` initializer

Inside `buildShadeCard()`, find this line:

```js
        shadeState[key] = { pos: 0, isOpen: false };
```

Replace with:

```js
        shadeState[key] = {
            pos:       0,
            isOpen:    false,
            direction: null,   // null | 'opening' | 'closing'
            startedAt: 0,
            startPos:  0,
            rafId:     null
        };
```

### Edit C — Replace the three button handlers inside `buildShadeCard()`

Find this block:

```js
        if (openBtn) openBtn.addEventListener('click', () => {
            pulse(joinOpen);
            setShadeStatusText(key, 'Opening…');
            setShadeCardState(card, 'moving');
            flashBtn(openBtn);
        });
        if (closeBtn) closeBtn.addEventListener('click', () => {
            pulse(joinClose);
            setShadeStatusText(key, 'Closing…');
            setShadeCardState(card, 'moving');
            flashBtn(closeBtn);
        });
        if (stopBtn) stopBtn.addEventListener('click', () => {
            pulse(joinStop);
            setShadeStatusText(key, 'Stopped');
            setShadeCardState(card, 'stopped');
            flashBtn(stopBtn);
        });
```

Replace with:

```js
        if (openBtn) openBtn.addEventListener('click', () => {
            pulse(joinOpen);
            startShadeMotion(key, 'opening');
            flashBtn(openBtn);
        });
        if (closeBtn) closeBtn.addEventListener('click', () => {
            pulse(joinClose);
            startShadeMotion(key, 'closing');
            flashBtn(closeBtn);
        });
        if (stopBtn) stopBtn.addEventListener('click', () => {
            pulse(joinStop);
            stopShadeMotion(key);
            flashBtn(stopBtn);
        });
```

The SIMPL pulse is still issued on every press, including no-ops — SIMPL is the source of truth for the physical motor; the panel-side animation is purely cosmetic.

### Edit D — Modify the `subAnalog(joinFb, …)` callback to clear timer state

Find this block (note: the leading comment may say `J1.SHADES`, `J2.SHADES`, etc. depending on the page — that's fine, the body is identical):

```js
        if (joinFb && hasCrestron()) {
            subAnalog(joinFb, (val) => {
                const v = Math.max(0, Math.min(100, parseInt(val, 10) || 0));
                shadeState[key].pos    = v;
                shadeState[key].isOpen = v > 5;
                renderShadeVisual(key, v);
                updateShadeFeedback(key, v);
                updateShadesOpenCount();
            });
        }
```

Replace with:

```js
        // A ← J<N>.SHADES.<n>_FB — position feedback 0–100
        // If a real FB join is wired, it overrides the local timer estimate:
        // any incoming value clears direction + rafId so tickShade stops fighting it.
        if (joinFb && hasCrestron()) {
            subAnalog(joinFb, (val) => {
                const v = Math.max(0, Math.min(100, parseInt(val, 10) || 0));
                const st = shadeState[key];
                if (st && st.rafId) { cancelAnimationFrame(st.rafId); st.rafId = null; }
                if (st) {
                    st.direction = null;
                    st.pos       = v;
                    st.isOpen    = v > 5;
                }
                renderShadeVisual(key, v);
                updateShadeFeedback(key, v);
                updateShadesOpenCount();
            });
        }
```

### Edit E — Add three new helper functions

After the existing `setShadeCardState` function and BEFORE `updateShadeFeedback`, insert:

```js
    function startShadeMotion(key, dir) {
        const st = shadeState[key];
        if (!st) return;
        // Already at the destination? No-op.
        if (dir === 'opening' && st.pos >= 100 && st.direction === null) return;
        if (dir === 'closing' && st.pos <= 0   && st.direction === null) return;
        // Already moving the same direction? Let the existing animation continue.
        if (st.direction === dir) return;

        if (st.rafId) cancelAnimationFrame(st.rafId);

        st.direction = dir;
        st.startedAt = performance.now();
        st.startPos  = st.pos;

        setShadeStatusText(key, dir === 'opening' ? 'Opening…' : 'Closing…');
        const card = _qs(`[data-shade="${key}"]`);
        if (card) setShadeCardState(card, 'moving');

        tickShade(key);
    }

    function tickShade(key) {
        const st = shadeState[key];
        if (!st || !st.direction) return;

        const elapsed = performance.now() - st.startedAt;
        const delta   = (elapsed / SHADE_TRAVEL_MS) * 100;
        let pos;
        if (st.direction === 'opening') pos = Math.min(100, st.startPos + delta);
        else                            pos = Math.max(0,   st.startPos - delta);

        st.pos    = pos;
        st.isOpen = pos > 5;
        renderShadeVisual(key, Math.round(pos));
        updateShadesOpenCount();

        const done = (st.direction === 'opening' && pos >= 100)
                  || (st.direction === 'closing' && pos <= 0);

        if (done) {
            st.direction = null;
            st.rafId     = null;
            const card = _qs(`[data-shade="${key}"]`);
            if (card) setShadeCardState(card, pos >= 100 ? 'open' : 'closed');
            setShadeStatusText(key, pos >= 100 ? 'Opened' : 'Closed');
            return;
        }

        st.rafId = requestAnimationFrame(() => tickShade(key));
    }

    function stopShadeMotion(key) {
        const st = shadeState[key];
        if (!st) return;
        if (st.rafId) cancelAnimationFrame(st.rafId);
        st.rafId     = null;
        st.direction = null;

        const pct  = Math.round(st.pos);
        const card = _qs(`[data-shade="${key}"]`);
        if (card) setShadeCardState(card, 'stopped');
        setShadeStatusText(key, `Stopped at ${pct}%`);
    }
```

### Standard 9-point browser verification sequence

Used by every per-page task. After making the edits, with `npm run start` running and the browser at http://localhost:3000, navigate to the page under test, open the **🪟 Shades** tab, then on one shade card walk through these in order:

1. Card initial state: `0% · Closed` (after a hard reload).
2. Tap **Open**. Within ~250 ms the status flips to `Opening…`, the `%` badge climbs every frame, the fill bar grows.
3. Wait ~20 s. Badge reaches `100%`, status says `Opened`, card has class `sc-s-open` (use DevTools to confirm).
4. Tap **Close**. Status flips to `Closing…`, badge ticks down from 100, fill bar shrinks.
5. Wait ~20 s. Badge reaches `0%`, status says `Closed`, card has class `sc-s-closed`.
6. Tap **Open**, then tap **Stop** at roughly 7 s elapsed. Badge freezes around `35%`, status reads `Stopped at NN%` with the real number (the value depends on your timing — point is it shows a number). Card class `sc-s-stopped`.
7. From that frozen ~35%, tap **Close**. Status flips to `Closing…`, badge animates 35 → 0 in roughly 7 s (proportional). Ends at `0% · Closed`.
8. Tap **Open**, then tap **Close** at ~40% mid-flight. Motion reverses without restarting from 0 — badge counts down from 40 toward 0 in roughly 8 s.
9. Tap **Open** twice in quick succession while at 0%. First tap starts motion; second is a no-op visually (no jump back, no restart). Open DevTools console — confirm there are no errors.

If any step deviates, **stop and fix before moving to the next page**. Pages 2–9 are copies of this code; a bug here is a bug times 9.

---

## Task 1: Reference implementation on page1.js

**Files:**
- Modify: `app/project/components/pages/page1/page1.js` — the `SHADES` block at roughly lines 1152–1282.

- [ ] **Step 1.1: Read the current shade block to anchor exact line ranges**

Read `app/project/components/pages/page1/page1.js` from line 1150 to line 1285. Confirm the section starts with:

```js
// ====================== SHADES ======================
// New design: animated window preview + arrow control buttons.
// Joins come from data-join-* attributes on each .shade-card in page1.html
// and must match the J1.SHADES.* constants in joins1.js.
const shadeState = {};
```

and contains in order: `setupShades`, `buildShadeCard`, `flashBtn`, `renderShadeVisual`, `setShadeStatusText`, `setShadeCardState`, `updateShadeFeedback`, `updateShadesOpenCount`. If the file has drifted, stop and re-anchor by reading more context. Don't blind-edit.

- [ ] **Step 1.2: Apply Edit A** (Shared Change Block → "Edit A — Add `SHADE_TRAVEL_MS` constant")

- [ ] **Step 1.3: Apply Edit B** (Shared Change Block → "Edit B — Extend the `shadeState[key]` initializer")

- [ ] **Step 1.4: Apply Edit C** (Shared Change Block → "Edit C — Replace the three button handlers inside `buildShadeCard()`")

- [ ] **Step 1.5: Apply Edit D** (Shared Change Block → "Edit D — Modify the `subAnalog(joinFb, …)` callback")

- [ ] **Step 1.6: Apply Edit E** (Shared Change Block → "Edit E — Add three new helper functions")

- [ ] **Step 1.7: Start the dev server**

In a separate terminal so it stays running for the rest of the plan:

```
npm run start
```

Expected: ends with `[BrowserSync] Access URLs:` and a Local URL of `http://localhost:3000`. If already running, skip — webpack watch will pick up changes automatically.

- [ ] **Step 1.8: Browser-verify page1 using the standard 9-point sequence**

Open http://localhost:3000. Navigate to **MB** (Master Bedroom = page1) via the footer nav. Tap the **🪟 Shades** tab. The Bedroom shade card is the only one on page1.

Walk through the **Standard 9-point browser verification sequence** from the Shared Change Block section above on the Bedroom card. Fix any failures before continuing.

- [ ] **Step 1.9: Commit**

```
git add app/project/components/pages/page1/page1.js
git commit -m "feat(shades): timed motion + Stop-percentage on page1"
```

If the commit fails with `Author identity unknown`: stop and ask the user. Do NOT run `git config`.

---

## Task 2: page2.js (Living Room)

**Files:**
- Modify: `app/project/components/pages/page2/page2.js` — the `SHADES` block.

- [ ] **Step 2.1: Read the shade block on page2.js**

Read `app/project/components/pages/page2/page2.js`. Use Grep with `pattern: "====================== SHADES"` and `path: app/project/components/pages/page2/page2.js, output_mode: content, -n: true, -A: 5` to locate the section header, then Read from that line through the helper function definitions. Confirm `shadeState`, `setupShades`, `buildShadeCard`, `flashBtn`, `renderShadeVisual`, `setShadeStatusText`, `setShadeCardState`, `updateShadeFeedback`, `updateShadesOpenCount` are all present with the same signatures as page1. If page2 has a different shape (extra fields on `shadeState`, different button HTML in `card.innerHTML`, different helper names), stop and report before editing.

- [ ] **Step 2.2: Apply Edits A, B, C, D, E from the Shared Change Block, in order**

The code in the Shared Change Block contains no `J1` / `J2` / `page1` / `page2` references — every edit drops in verbatim.

- [ ] **Step 2.3: Browser-verify page2 using the standard 9-point sequence**

Navigate to **Living Room** (page2). Tap the **🪟 Shades** tab. Page 2 has multiple shade cards — pick any one and run the Standard 9-point browser verification sequence.

Then, on the same page, confirm **two different shades can move at the same time** without interfering: tap Open on one card, then immediately tap Open on a second card. Both percentages should climb in parallel. They should reach 100% within roughly the same instant (a few hundred ms apart). If one freezes the other, the per-key state isolation is broken — investigate before moving on.

- [ ] **Step 2.4: Commit**

```
git add app/project/components/pages/page2/page2.js
git commit -m "feat(shades): timed motion + Stop-percentage on page2"
```

If the commit fails on identity: stop and ask the user. Do NOT auto-configure.

---

## Task 3: page3.js (Omar's Bedroom)

**Files:**
- Modify: `app/project/components/pages/page3/page3.js` — the `SHADES` block.

- [ ] **Step 3.1: Read and anchor the shade block on page3.js** (same procedure as Step 2.1, with file path swapped)

- [ ] **Step 3.2: Apply Edits A, B, C, D, E from the Shared Change Block, in order**

- [ ] **Step 3.3: Browser-verify page3 using the standard 9-point sequence**

Navigate to **Omar** (page3). Tap the **🪟 Shades** tab. Run the Standard 9-point browser verification sequence on one shade card.

- [ ] **Step 3.4: Commit**

```
git add app/project/components/pages/page3/page3.js
git commit -m "feat(shades): timed motion + Stop-percentage on page3"
```

---

## Task 4: page4.js (Hassan's Bedroom)

**Files:**
- Modify: `app/project/components/pages/page4/page4.js` — the `SHADES` block.

- [ ] **Step 4.1: Read and anchor the shade block on page4.js** (same procedure as Step 2.1, with file path swapped)

- [ ] **Step 4.2: Apply Edits A, B, C, D, E from the Shared Change Block, in order**

- [ ] **Step 4.3: Browser-verify page4 using the standard 9-point sequence**

Navigate to **Hassan** (page4). Tap the **🪟 Shades** tab. Run the Standard 9-point browser verification sequence on one shade card.

- [ ] **Step 4.4: Commit**

```
git add app/project/components/pages/page4/page4.js
git commit -m "feat(shades): timed motion + Stop-percentage on page4"
```

---

## Task 5: page5.js (Layla's Bedroom)

**Files:**
- Modify: `app/project/components/pages/page5/page5.js` — the `SHADES` block.

- [ ] **Step 5.1: Read and anchor the shade block on page5.js** (same procedure as Step 2.1, with file path swapped)

- [ ] **Step 5.2: Apply Edits A, B, C, D, E from the Shared Change Block, in order**

- [ ] **Step 5.3: Browser-verify page5 using the standard 9-point sequence**

Navigate to **Layla** (page5). Tap the **🪟 Shades** tab. Run the Standard 9-point browser verification sequence on one shade card.

- [ ] **Step 5.4: Commit**

```
git add app/project/components/pages/page5/page5.js
git commit -m "feat(shades): timed motion + Stop-percentage on page5"
```

---

## Task 6: page6.js (Reception)

**Files:**
- Modify: `app/project/components/pages/page6/page6.js` — the `SHADES` block.

- [ ] **Step 6.1: Read and anchor the shade block on page6.js** (same procedure as Step 2.1, with file path swapped)

- [ ] **Step 6.2: Apply Edits A, B, C, D, E from the Shared Change Block, in order**

- [ ] **Step 6.3: Browser-verify page6 using the standard 9-point sequence**

Navigate to **Reception** (page6). Tap the **🪟 Shades** tab. Run the Standard 9-point browser verification sequence on one shade card.

- [ ] **Step 6.4: Commit**

```
git add app/project/components/pages/page6/page6.js
git commit -m "feat(shades): timed motion + Stop-percentage on page6"
```

---

## Task 7: page7.js (Kitchen)

**Files:**
- Modify: `app/project/components/pages/page7/page7.js` — the `SHADES` block.

- [ ] **Step 7.1: Read and anchor the shade block on page7.js** (same procedure as Step 2.1, with file path swapped)

- [ ] **Step 7.2: Apply Edits A, B, C, D, E from the Shared Change Block, in order**

- [ ] **Step 7.3: Browser-verify page7 using the standard 9-point sequence**

Navigate to **Kitchen** (page7). Tap the **🪟 Shades** tab. Run the Standard 9-point browser verification sequence on one shade card.

- [ ] **Step 7.4: Commit**

```
git add app/project/components/pages/page7/page7.js
git commit -m "feat(shades): timed motion + Stop-percentage on page7"
```

---

## Task 8: page8.js (Basement)

**Files:**
- Modify: `app/project/components/pages/page8/page8.js` — the `SHADES` block.

- [ ] **Step 8.1: Read and anchor the shade block on page8.js** (same procedure as Step 2.1, with file path swapped)

- [ ] **Step 8.2: Apply Edits A, B, C, D, E from the Shared Change Block, in order**

- [ ] **Step 8.3: Browser-verify page8 using the standard 9-point sequence**

Navigate to **Basement** (page8). Tap the **🪟 Shades** tab. Run the Standard 9-point browser verification sequence on one shade card.

- [ ] **Step 8.4: Commit**

```
git add app/project/components/pages/page8/page8.js
git commit -m "feat(shades): timed motion + Stop-percentage on page8"
```

---

## Task 9: page9.js (All Outdoor)

**Files:**
- Modify: `app/project/components/pages/page9/page9.js` — the `SHADES` block.

- [ ] **Step 9.1: Read and anchor the shade block on page9.js** (same procedure as Step 2.1, with file path swapped)

- [ ] **Step 9.2: Apply Edits A, B, C, D, E from the Shared Change Block, in order**

- [ ] **Step 9.3: Browser-verify page9 using the standard 9-point sequence**

Navigate to **All Outdoor** (page9). Tap the **🪟 Shades** tab. Run the Standard 9-point browser verification sequence on one shade card.

- [ ] **Step 9.4: Commit**

```
git add app/project/components/pages/page9/page9.js
git commit -m "feat(shades): timed motion + Stop-percentage on page9"
```

---

## Task 10: Cross-page smoke test

**Files:**
- None modified. Verification-only task.

This confirms no regressions across the bundle and that per-page state is properly isolated.

- [ ] **Step 10.1: Hard-reload the dev server in the browser**

In the browser tab serving http://localhost:3000, press Ctrl+Shift+R (or Cmd+Shift+R on Mac) to force a full reload. This re-bundles `component.js` cleanly and discards any stale state.

- [ ] **Step 10.2: Walk every page and tap each shade widget at least once**

For each page (page1 → page9), in order:

1. Navigate via the footer nav.
2. Open the **🪟 Shades** tab.
3. Tap **Open** on any one shade card.
4. Wait ~3 seconds, watch the % climb.
5. Tap **Stop**. Confirm status reads `Stopped at NN%` with a real number, not `Stopped at NaN%` or just `Stopped`.
6. Tap **Close**. Wait for it to reach `0% · Closed`.

This is a smoke check — you don't need the full 9-point sequence on every page, just enough to confirm the new behavior shipped on each.

- [ ] **Step 10.3: Cross-page state isolation check**

1. On page1, tap **Open** on the Bedroom shade. Don't wait for it to finish.
2. While it's still moving (status `Opening…`), use the footer nav to jump to page2.
3. Nav back to page1. The % should be at roughly the right value (`(elapsed seconds) * 5%`), not frozen at the value you left it (RAF keeps ticking the IIFE while the page section is offscreen, because the IIFE is page-cached and `requestAnimationFrame` keeps the loop alive).
4. From page2, tap **Open** on one of its shades, then nav back to page1. Both pages should have a moving shade. Neither should freeze the other.

If either page's animation freezes while the other navigates, the per-page `shadeState` / `rafId` isolation is broken — investigate.

- [ ] **Step 10.4: Console check**

Open DevTools → Console. Scroll the log for the entire session. Expected: zero red errors mentioning `shadeState`, `tickShade`, `startShadeMotion`, `stopShadeMotion`, `requestAnimationFrame`, or `cancelAnimationFrame`. Warnings from CrComLib / WebXPanel unrelated to shades are pre-existing and fine.

- [ ] **Step 10.5: Final commit (only if you made a fix during smoke testing)**

If Steps 10.1–10.4 surfaced a bug that needed an edit, commit it. Otherwise nothing to commit; this task is verification-only.

```
git add app/project/components/pages/page<N>/page<N>.js
git commit -m "fix(shades): <describe the fix>"
```

---

## Done criteria

- All 9 `page<N>.js` files have the new constant (`SHADE_TRAVEL_MS`), three helpers (`startShadeMotion`, `tickShade`, `stopShadeMotion`), updated button handlers, extended `shadeState[key]` shape, and FB-clearing `subAnalog` callback.
- Manual verification (9-point sequence) passed on every page.
- Console is clean of new errors.
- No changes outside the 9 page JS files.
- No changes to `joins<N>.js`, page HTML, page SCSS, template tree, webpack config, or `project-config.json`.
