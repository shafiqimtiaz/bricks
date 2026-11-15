# BRICKS design foundation

BRICKS has one visual identity across Solo, Multiplayer, and High Scores. Its shared styles live in **`src/design.js`**.

## What to edit

- **Palette and typography:** edit the `--bricks-*` CSS custom properties at the top of `designCss`.
- **CRT appearance:** edit the shared `#crt` and `#crt::before/after` rules in the same file. Scanlines, vignette, border curvature, and reduced-motion behavior affect all three screens.
- **Shared surfaces:** use `--bricks-panel`, `--bricks-panel-border`, `--bricks-radius`, and `--bricks-menu-ink` rather than hardcoded copies.
- **Page layout:** keep game-specific sizing and interactions in `src/solo.html` and `src/multiplayer.html`, and leaderboard-specific layout in `src/leaderboard.html`.

`withPwa()` applies `withDesign()` to each served HTML document. The design styles are inlined after the page styles, so no extra network request is needed. The offline fallback stays self-contained.

Do not add selectable board styles or move gameplay physics into the design module. New shared visual rules belong in `design.js`; page-specific rules stay with the page.

## Verify

Run `npm test` and `npm run build`. Check Solo, multiplayer lobby/game, and High Scores on mobile and desktop before merging visual changes.
