import assert from "node:assert/strict";
import test from "node:test";
import { multiHtml, soloHtml, serverSource } from "./helpers.js";

test("plain multiplayer navigation stays in the lobby instead of resuming an old match", () => {
  assert.match(multiHtml, /if\(invitedPath\)loadInvite\(invitedPath\[1\]\.toUpperCase\(\)\)/);
  assert.doesNotMatch(multiHtml, /bricksLastRoom|enter\(last\)/);
  assert.match(multiHtml, /history\.replaceState\(null,"","\/multiplayer\/"\+code\)/);
});

test("the multiplayer lobby sends the same host viewport ratio used by Solo", () => {
  assert.match(soloHtml, /arenaLayout\(window\.innerWidth \/ window\.innerHeight\)/);
  assert.match(multiHtml, /arenaLayout\(window\.innerWidth\/window\.innerHeight\)/);
  assert.ok(multiHtml.includes('request("",{name:displayName,aspect:window.innerWidth/window.innerHeight,playerId:leaderboardId()})'));
  assert.match(serverSource, /body:JSON\.stringify\(\{name,aspect:body\.aspect\}\)/);
});

test("multiplayer court shares Solo's CRT colors and square-brick painter", () => {
  assert.match(multiHtml, /drawBrickTile\(tileCtx/);
  assert.match(multiHtml, /c\.fillStyle="#151715"/);
  assert.match(multiHtml, /c\.fillStyle="#232323"/);
  assert.match(soloHtml, /ctx\.fillStyle = '#232323'/);
});
