import assert from "node:assert/strict";
import test from "node:test";
import { soloHtml, multiHtml } from "./helpers.js";
import { manifest } from "../src/pwa.js";
import { readFileSync } from "node:fs";

const read = name => readFileSync(new URL("../src/" + name, import.meta.url), "utf8");
const tagline = "Brick Rooms Induce Claustrophobia. Keep Smiling.";

test("BRICKS title and sinister subtitle appear in both multiplayer lobby states", () => {
  assert.match(multiHtml, /<h1>BRICKS<\/h1>/);
  assert.match(multiHtml, /<h2>BRICKS<\/h2>/);
  assert.equal(multiHtml.split(tagline).length - 1, 2);
  assert.doesNotMatch(multiHtml, /by Shafiq|BRICKS ASMR/i);
});

test("solo, leaderboard, share text, and install metadata use BRICKS", () => {
  const board = read("leaderboard.html");
  assert.match(soloHtml, /<title>BRICKS · Single Player<\/title>/);
  assert.match(board, /class="brand pixel">BRICKS<\/span>/);
  assert.match(soloHtml, /BRICKS · /);
  assert.equal(JSON.parse(manifest).name, "BRICKS");
  assert.equal(JSON.parse(manifest).short_name, "BRICKS");
  for (const text of [soloHtml, board, read("pwa.js")]) assert.doesNotMatch(text, /Bricks ASMR|BRICKS ASMR|by Shafiq/i);
});

test("the Solo startup and leaderboard carry the horror warning while the menu stays compact", () => {
  const warning="BRICK ROOMS INDUCE";
  assert.match(soloHtml, /class="menuIdentity"/);
  assert.ok(soloHtml.includes(warning));
  assert.doesNotMatch(soloHtml.slice(soloHtml.indexOf('<div class="menuIdentity">'),soloHtml.indexOf('</div>',soloHtml.indexOf('<div class="menuIdentity">'))),/BRICK ROOMS INDUCE/);
  const board=read("leaderboard.html");
  assert.ok(board.includes("BRICKS — BRICK ROOMS INDUCE CLAUSTROPHOBIA. KEEP SMILING."));
  assert.equal(multiHtml.split("Brick Rooms Induce Claustrophobia. Keep Smiling.").length - 1, 2);
});

