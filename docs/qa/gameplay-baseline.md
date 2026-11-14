# Gameplay baseline — c54a246

Status: **incomplete**. The starting commit contains the approved plan but no gameplay changes.

- Code review confirmed Solo default `2500` balls, server default `40`, and device-dependent mutation of Solo's `S.maxBalls`.
- Mitosis power-up recollection resets its spent six-split budget even while active.
- Two-zone touch control already exists; both clients have pointer-cancel handlers, but not lost-capture or drag release on focus loss/rotation.
- Actual `npm test` count, Cloudflare dry-run build, browser viewport play (360×800, 390×844, 768×1024, 1366×768, 1920×1080), frame measurements, physical phones, two-client sessions, 15-minute sessions, and five-user observations: **not measured from this environment**.
- This release adds reproducible automated tests; no synthetic performance or human-play results are claimed.

Before merging: run repository tests and build in CI; perform manual browser and multiplayer checks, or explicitly record their absence.
