# BRICKS Gameplay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or superpowers:subagent-driven-development to implement task-by-task. Track steps with checkboxes.

**Goal:** Make BRICKS immediately understandable, satisfying under pressure, visually distinctive, and easy to replay and challenge friends.

**Architecture:** Keep physics and power-up rules in the shared engine. Keep rendering and input in the existing Solo and Multiplayer clients, sharing helpers through the existing browser-source mechanism. Tune existing systems before adding mechanics.

**Tech Stack:** JavaScript, Canvas/WebGL, Web Audio, Node test runner, Cloudflare Workers, Durable Objects, D1.

**Spec:** `docs/superpowers/specs/2026-11-14-bricks-gameplay-design.md`

## Global constraints
- Keep JavaScript, Cloudflare Workers, Durable Objects, D1, and the existing shared engine.
- Keep V4 procedural boards and multiplayer's single shared board and player-relative viewpoints.
- Keep CRT graphics, pixel typography, minimal copy, and no creator branding.
- Support phones first, plus tablets, desktop, landscape, keyboard, and reduced motion.
- No new dependencies, accounts, monetization, streak pressure, or artificial rewards.
- Do not change global leaderboard rules without versioning incompatible results.
- Gameplay must not vary with a device's graphics quality.
- Deliver small validated releases; no production gameplay edits during planning.

## Review focus
1. Serialized browser code must contain every constant/helper used during power-up collisions. Covered by Task 2.
2. Touch cancellation, focus loss, and rotation must release controls without a jump or stuck drag. Covered by Task 3.
3. Repeated powers and mixed owners must respect caps without deleting balls or awarding extra lives. Covered by Task 2.
4. A slow device must reduce cosmetic cost without changing simulation or competitive rules. Covered by Tasks 2 and 5.
5. Shared URLs and result retries must preserve identity, mode, and intentional seed selection. Covered by Task 7.

## Delivery structure
Release A: Tasks 1–3, reliability and control.
Release B: Task 4, opening and danger pacing, only where evidence supports changes.
Release C: Tasks 5–7, readable spectacle and replay/sharing.
Task 8 gates every release. Each release uses a short-lived branch and PR. Avoid mixing unrelated cleanup into these changes.

## Task 1: Establish the baseline
**Files:** Read `src/engine.js`, `src/game-core.js`, `src/level-v4.js`, both client HTML files, `tests/browser-smoke.js`; create `docs/qa/gameplay-baseline.md`.
**Interfaces:** Existing `brickEngine().create(options)`, `step(state, dt)`, and `bricks(seed, playerCount, arena)`; no new runtime API.

- [ ] Run `npm test` and `npm run build`; record counts and failures with current commit.
- [ ] Inspect real browser play at 360x800, 390x844, 768x1024, 1366x768, and 1920x1080, including phone landscape. Record browser/device and distinguish physical hardware from viewport emulation.
- [ ] Play Classic, Infinite, and two-player multiplayer. Check launch, both touch zones, menu pause, resume, miss, game over, retry, names, and ranking.
- [ ] Record frame intervals and console errors during normal play and maximum-power bursts. Use temporary QA instrumentation, not a permanent debug UI.
- [ ] Observe five first-time players if available. Record time to independent launch, confusing controls, ball visibility, perceived fairness, and voluntary retry/share intent. If unavailable, mark this gate unverified rather than inventing results.
- [ ] Commit baseline evidence and prioritize only observed defects within this plan.

## Task 2: Bound chaos without changing rules by device
**Files:** Modify `src/engine.js`, `src/game-core.js`, `src/solo.html`, `src/multi.js`; extend `tests/powerups.test.js`, `tests/browser-core-bundle.test.js`, `tests/multiplayer-modes.test.js`.
**Interfaces:** Retain `create({maxBalls,...})`, `step(state,dt)`, `player.fx.mitosis`, and `player.mitosisSplits`. Add shared `GAME_MAX_BALLS = 40` only if it can be included in the existing browser bundles; test its actual serialization.

- [ ] Add failing behavioral tests: cap-reaching powers never exceed 40; existing balls remain; five-second Mitosis produces at most six clones; active recollection cannot reset that budget; fresh activation after expiry resets it.
- [ ] Add serialized Solo and Multiplayer tests executing collisions, effect expiration, and combined powers. Include separate owners and ball losses near the cap.
- [ ] Run `node --test tests/powerups.test.js tests/browser-core-bundle.test.js tests/multiplayer-modes.test.js`; confirm failures are the intended missing behavior.
- [ ] Apply a fixed 40-ball default consistently and remove device-dependent mutation of `S.maxBalls`. Make recollection refresh the timer without resetting an active split budget.
- [ ] Compare caps 24/40/64 in temporary benchmarks. Keep 40 unless measured evidence supports another fixed cap; document any change before committing.
- [ ] Rerun focused tests and stress play for 15 minutes, checking console errors, finite coordinates, ownership, lives, and bounded balls. Commit the complete fix.

## Task 3: Make input dependable
**Files:** Modify `src/solo.html`, `src/multiplayer.html`, and `src/game-core.js` only where a shared input defect requires it; extend `tests/multitouch-control.test.js`, `tests/paddle-control.test.js`, `tests/engine.test.js`.
**Interfaces:** Keep `setPaddle(state,id,centre)`, `setAim(state,id,angle)`, `launch(state,id)` and existing sensitivity storage.

- [ ] Reproduce any baseline defect with a failing input or engine test. Exercise pointercancel, lost capture, blur, two simultaneous fingers, rotation during drag, and each player's rotated viewpoint.
- [ ] Fix stuck inputs or unexpected jumps with the smallest existing-handler change; preserve separate aiming and paddle zones.
- [ ] Verify center and edge paddle hits return predictable trajectories for all four seats. Diagnose shallow loops before changing velocity normalization.
- [ ] Run `node --test tests/multitouch-control.test.js tests/paddle-control.test.js tests/engine.test.js` and manually repeat touch and keyboard flows.
- [ ] Commit fixes, or record no change if the existing behavior passes. Do not retune sensitivity solely on speculation.

## Task 4: Improve opening access and readable danger
**Files:** `src/level-v4.js`, `src/engine.js`, `src/solo.html`, `src/multiplayer.html`; tests in `tests/original-symmetry.test.js`, `tests/pareidolia.test.js`, `tests/infinite.test.js`; create `docs/qa/board-pacing.md`.
**Interfaces:** Preserve V4 board shape and `crushGap(state,seat)`. Both clients consume the existing gap in world units; warning threshold is `3 * state.CS` from the crush boundary.

- [ ] Evaluate 100 fixed seeds across phone and desktop layouts. Record reachable starter placement, closed pockets, long final-brick periods, and first meaningful power-up timing. Use repeated launch angles as a diagnostic, not proof of human difficulty.
- [ ] If starter access is poor, write failing deterministic placement/symmetry tests, then adjust only power-up assignment on existing lower exposed bricks. Keep geometry and breakable counts unchanged.
- [ ] Add threshold tests for the Infinite danger cue: off beyond three rows, on inside three rows, correct player edge, and no cue once the round ends.
- [ ] Render a quiet steady warning; use motion only when allowed. Keep current descent timing pending playtest evidence.
- [ ] Run board and Infinite tests; manually play representative good and bad seeds. Commit only evidence-supported changes and record deferred tuning.

## Task 5: Make spectacle readable
**Files:** `src/solo.html`, `src/multiplayer.html`, `src/game-core.js`; tests in `tests/ux-game-feel.test.js`, `tests/multiplayer-gamefeel-ux.test.js`.
**Interfaces:** Consume existing engine events such as `hit`, `break`, `paddle`, `power`, and `milestone`; add no simulation side effects.

- [ ] Capture identical busy-board states before changes. Identify where debris, flashes, ball trails, text, or CRT distortion mask the ball.
- [ ] Add behavioral checks that effects respect reduced motion and do not mutate engine state. Avoid relying only on source-string assertions.
- [ ] Give the ball and paddle highest contrast; localize brick flashes and cap cosmetic particles. Reduce cosmetic work under load while keeping physics, timers, and cap rules fixed.
- [ ] Keep face motifs in V4 and put stronger CRT disturbances around transitions, not live collision geometry. Do not add hit-stop to multiplayer simulation.
- [ ] Compare screenshots and playable sequences across the Task 1 sizes, normal/reduced motion, and maximum ball load. Record p95 frame intervals and trackability observations; commit the smallest successful pass.

## Task 6: Keep musical feedback immediate
**Files:** `src/brick-music.js`, both client HTML files; extend `tests/brick-music.test.js`.
**Interfaces:** Preserve the existing music player API and seeded melody selection; inspect actual exported names before modifying callers.

- [ ] Test a burst of 40 hit events followed by silence using a controlled audio clock. Check scheduled notes are bounded and a long queue does not keep playing after pause/end.
- [ ] If the current scheduler fails, limit pending hit-note scheduling to a proposed 150 ms horizon and drop overflow notes. Do not delay gameplay or replace existing melodies.
- [ ] Test mute, resume after backgrounding, and ended rounds. Ensure deferred sounds cannot leak into the next run.
- [ ] Run `node --test tests/brick-music.test.js`; listen on phone speakers/headphones and verify distinct paddle, brick, and lost-life feedback. Commit only necessary changes.

## Task 7: Make retry and seed challenges obvious
**Files:** `src/solo.html`, `src/leaderboard.html`, `src/index.js` only if existing routing needs adjustment; tests in `tests/scoring-identity.test.js`, `tests/player-name.test.js`, `tests/leaderboard-global.test.js`, `tests/compact-crt-ui.test.js`.
**Interfaces:** Reuse existing seed/mode URL parsing, result saving, confirmed-name storage, and share action. Do not create a second score schema or challenge backend.

- [ ] Document current score math and result fields. Add tests that displayed score equals the stored ranking score; distinguish broken-brick count from points and combo peak without changing the scoring formula.
- [ ] Add tests for explicit same-seed retry and new-seed play, including retaining mode and confirmed name. Keep game-over navigation to one action per choice.
- [ ] Add share-link round-trip tests for seed and mode, encoded input, malformed values, and fallback behavior. Verify sharing does not submit a score or overwrite recipient identity.
- [ ] Present compact result actions: `RETRY`, `NEW ROOM`, `CHALLENGE`. Reuse the existing share mechanism and clipboard fallback with clear success/failure feedback.
- [ ] Share text includes seed, mode, score, and link. Same-seed competition is approximate across aspect ratios; do not claim identical boards across screens or introduce forced geometry without a separate decision.
- [ ] Test persistence with local/staging fixtures; validate shared URLs on phone and desktop. Commit after focused tests and browser checks pass.

## Task 8: Validate and ship each release
**Files:** Create/update `docs/qa/gameplay-release-checklist.md`; no unrelated code changes.

- [ ] Run `npm test`, `npm run build`, and `git diff --check` on the final branch. All must pass.
- [ ] Review actual diffs and serialized served scripts. Run browser collision/power combinations as well as engine tests, specifically guarding against the previous Mitosis missing-constant failure.
- [ ] Complete 15-minute Classic/Infinite stress sessions and a real two-client multiplayer session with join, disconnect, reconnect, rotation, pause, and round restart.
- [ ] Check physical-phone performance where hardware is available. Explicitly report unavailable hardware or user studies; do not treat emulation as confirmation.
- [ ] Compare against baseline: errors, frame intervals, control confusion, visibility, understanding of outcomes, and voluntary retry intent. If tuning makes the game less fair/readable, revert that tuning independently.
- [ ] Open PR with evidence; merge only after validation, confirm Cloudflare build/deploy success, and verify production's served code and basic navigation without polluting leaderboards.
- [ ] Keep the previous known-good deployment available for rollback. Delete only this release's merged working branch.

## Execution recommendation
Implement sequentially with one independent review per release. These tasks share game state and client files; parallel implementation would add conflict risk. This document authorizes no implementation by itself. The next request to execute should start with Task 1 and preserve all recorded constraints.

## Plan self-review
Coverage: controls Tasks 2–3; opening and pressure Task 4; visual atmosphere Task 5; music Task 6; scoring/replay/sharing Task 7; platform and regression validation Tasks 1/8. All five review-focus conditions have owners. Numerical tuning is explicitly proposed rather than presented as measured. No new dependency, analytics system, mode, or unrelated refactor is required.
