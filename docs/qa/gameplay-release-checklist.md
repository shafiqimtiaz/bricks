# Gameplay release gate — PR #54

- [x] Code review and baseline gaps documented.
- [x] Fixed 40-ball default, Mitosis recollection budget, and stuck pointer releases.
- [x] Infinite three-row cue, bounded visual effects and 150 ms musical scheduling.
- [x] Distinct RETRY, NEW ROOM, CHALLENGE with seed, mode and score.
- [ ] Run `npm test` in a verified execution environment.
- [ ] Run `npm run build` and `git diff --check`.
- [ ] Smoke Classic/Infinite at 360×800, 390×844, 768×1024, 1366×768, 1920×1080, and landscape.
- [ ] Run 15-minute Classic and Infinite soaks, plus two-client multiplayer (reconnect/rotation/pause/restart).
- [ ] Measure real midrange Android p95 frame times and max-ball trackability.
- [ ] Conduct five new-player sessions assessing launches, understanding, retry and sharing.
- [ ] Verify Cloudflare deployment and served code without fake leaderboard submissions.

Never call emulated viewport tests physical device QA. Never merge without passing automated tests and build.
