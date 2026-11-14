---
name: gameplay-qa
description: Release-gate verification for Bricks ASMR Solo, multiplayer lobbies, live rooms, and visual parity
---

# Gameplay QA

Use this skill when a change affects board generation, animation, input, physics, multiplayer room state, or player navigation.

1. Read the diff and `docs/MULTIPLAYER_REDESIGN.md`. Identify affected user-visible journeys, expected state transitions, and regression risks.
2. Run `npm ci && npm test && npm run build`. Treat a nonzero exit as a blocker.
3. Use two isolated Playwright browser contexts against local Wrangler. Verify a host and guest can join, wait, start, control their own paddles, and reconnect without losing the room or loading a match when visiting the base lobby URL.
4. Validate a 2-player host-ratio arena and 3–4-player square arena, rotated player POV, no stretched tiles, CRT colors, and no uncaught browser errors. Check narrow phones and wide desktops.
5. Capture screenshots and logs for failures, add focused regression tests in `tests/`, and rerun the complete suite.
6. Do not merge or deploy until the required workflow passes. Report any tests that could not be executed instead of guessing success.

Production D1, Durable Object storage, and live player rooms must not be reset as part of QA.
