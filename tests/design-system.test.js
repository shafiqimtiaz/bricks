import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { designCss, withDesign } from "../src/design.js";
import { withPwa } from "../src/pwa.js";

const read = name => readFileSync(new URL("../src/" + name, import.meta.url), "utf8");

test("all game pages receive one centrally managed CRT design", () => {
 for(const file of ["solo.html", "multiplayer.html", "leaderboard.html"]){
  const raw = read(file), html = withPwa(raw);
  assert.doesNotMatch(raw, /crtGlassRoll/);
  assert.equal((html.match(/id="bricks-design"/g) || []).length, 1);
  assert.ok(html.indexOf('<style id="bricks-design">') > html.indexOf("</style>"));
  assert.match(html, /--bricks-font:'Press Start 2P'/);
  assert.match(html, /crtGlassRoll 13s linear infinite/);
  assert.match(html, /prefers-reduced-motion:reduce/);
 }
 const shell = "<html><head></head><body></body></html>";
 assert.equal(withDesign(withDesign(shell)), withDesign(shell));
});

test("central tokens are used by the existing screen layouts", () => {
 assert.match(designCss, /--bricks-panel:#070b0aec/);
 assert.match(designCss, /--bricks-accent:#b8d9c9/);
 assert.match(read("solo.html"), /#panel\{background:var\(--bricks-panel\)/);
 assert.match(read("multiplayer.html"), /#panel\{background:var\(--bricks-panel\)!important/);
 assert.match(read("leaderboard.html"), /--bg:var\(--bricks-bg\)/);
});

test("world rankings keep player identity without a side highlight bar", () => {
 const html = read("leaderboard.html");
 assert.doesNotMatch(html, /\.entry\.mine\{[^}]*border-left/);
 assert.doesNotMatch(html, /\.entry\.mine\{[^}]*padding-left/);
 assert.match(html, /if\(r\.playerId===playerId\)user\.append\(cell\('me-tag','YOU'\)\)/);
 assert.match(html, /r\.playerId===playerId\?' mine'/);
});
