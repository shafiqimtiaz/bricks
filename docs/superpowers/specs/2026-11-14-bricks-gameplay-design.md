# BRICKS gameplay design

Status: direction approved; numerical tuning below is proposed for playtesting.

## Intent
Precise controls, controlled chaos, subtle horror. A good shot turns a creepy room into a musical chain reaction. Spectacle should be earned through aiming; reliable control and understandable losses should make another attempt appealing. Sharing should invite a comparable seed challenge. Virality is a hypothesis, not a promised outcome.

## Approaches considered
- Precision arcade emphasizes difficult returns and sparse powers; less immediate spectacle.
- Controlled chaos emphasizes bounded cascades and recoverable pressure; needs performance and balance work.
- Survival horror emphasizes scarcity and oppressive tension; risks exhausting casual players.
The user approved controlled chaos supported by precise controls and horror atmosphere.

## Constraints
- Keep JavaScript, Cloudflare Workers, Durable Objects, D1, and the existing shared engine.
- Keep V4 procedural boards and multiplayer's single shared board and player-relative viewpoints.
- Keep CRT graphics, pixel typography, minimal copy, and no creator branding.
- Support phones first, plus tablets, desktop, landscape, keyboard, and reduced motion.
- No new dependencies, accounts, monetization, streak pressure, or artificial rewards.
- Do not change global leaderboard rules without versioning incompatible results.
- Gameplay must not vary with a device's graphics quality.
- Deliver small validated releases; no production gameplay edits during planning.

## Experience
1. Launch: one brief, dismissible introduction; obvious serve action and touch zones.
2. Opening: a reachable starter offers a satisfying cascade early, without automatically playing the game.
3. Momentum: readable ball trajectories, localized impacts, short musical responses, bounded power-up combinations.
4. Pressure: Classic descends on misses; Infinite keeps continuous descent. Danger is visible before defeat.
5. End: explain score, personal best, and outcome; retry the same seed or choose a new room explicitly.
6. Share: share seed, mode, and score; recipients enter that challenge without overwriting their name/settings.

## Proposed tuning experiments
Measure first. Start with a 40-ball total cap in both modes, matching current multiplayer. Compare 24/40/64 in isolated tests; retain 40 unless phone measurements and playtesting justify another fixed value. Mitosis retains five seconds and six new balls per activation. Recollecting it while active refreshes time but does not replenish the split budget. Do not remove existing balls when a cap is reached.

Keep current scoring and 0.7-second combo rule for the first release. Clarify the visible multiplier and breakdown. Separately assess whether paddle returns deserve a new rally mechanic; that is outside this plan because it changes ranking semantics.

Use a deterministic sample of 100 seeds across phone and desktop layouts to evaluate opening access and long endings. Preserve existing starter placement if it passes. If opening access fails, adjust only starter assignment within existing V4 geometry. Do not add homing balls or automatic final-brick destruction.

For Infinite, evaluate descent warning at a gap of three brick rows from the existing crush boundary. Display a steady edge cue; optional mild pulse respects reduced motion. No changes to initial descent speed without observed difficulty evidence.

## Acceptance
- Zero uncaught errors during power-up combinations and 15-minute play/soak sessions.
- On an identified midrange Android device: target p95 frame interval <= 20 ms during normal play and <= 33 ms during maximum-power stress; report hardware and actual results, never equate emulation to real-device validation.
- Five new-player sessions: at least four launch and return a ball without coaching, understand why their run ended, and can retry unaided. Small-sample evidence is directional.
- At least four of five players can keep tracking the ball during a power burst; no repeated input-obstruction complaint.
- Same seed, mode, viewport geometry, and rules reproduce the same opening. Shared seeds are not claimed to be identical geometry across aspect ratios.
- No fake score submissions during production QA. Local/staging fixtures test result persistence.

## Scope limits
No new modes, extensive shader rewrite, new music catalogue, or wholesale UI refactor. Baseline and follow-up playtesting evaluate enjoyment and voluntary retry/share intent; analytics infrastructure is not included.
