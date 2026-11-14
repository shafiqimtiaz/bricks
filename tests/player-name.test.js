import assert from "node:assert/strict";
import test from "node:test";
import { soloHtml, multiHtml, serverSource } from "./helpers.js";

test("only confirmed player names persist across Solo and Multiplayer", () => {
 assert.match(soloHtml, /localStorage\.getItem\('brick-asmr-name-confirmed'\)==='1'/);
 assert.doesNotMatch(soloHtml, /localStorage\.setItem\('brick-asmr-player-name',myName\)/);
 assert.match(multiHtml, /const NAME_KEY="brick-asmr-player-name",CONFIRMED_KEY="brick-asmr-name-confirmed"/);
 assert.doesNotMatch(multiHtml, /bricksPlayerName/);
 assert.match(multiHtml, /return n\|\|randomPlayerName\(\)/);
 assert.match(multiHtml, /\$\("playerName"\)\.value=profileName/);
});

test("scored matches request an identity but unscored ones do not", () => {
 assert.match(soloHtml, /mode==='clear'\|\|mode==='over'&&lastScore>0\)\)openNameModal\(true\)/);
 assert.match(soloHtml, /if\(lastScore<1\|\|!myName\)return;/);
 assert.match(soloHtml, /showPanel\('clear'\);\s*if\(!myName\)return;/);
 assert.match(multiHtml, /s.status==="finished"&&me.score>0&&!profileName/);
 assert.match(multiHtml, /lastPromptedRound!==completed/);
 assert.match(multiHtml, /openNicknamePrompt\(true\)/);
});

test("saving a name stores it once and updates the multiplayer room", () => {
 assert.match(soloHtml, /localStorage\.setItem\('brick-asmr-name-confirmed','1'\)/);
 assert.match(multiHtml, /localStorage\.setItem\(CONFIRMED_KEY,"1"\)/);
 assert.match(multiHtml, /\$\("playerName"\)\.value=result.name;rememberName\(result.name\)/);
 assert.match(serverSource, /action==="rename"/);
 assert.match(serverSource, /nameOf\(body.name\)/);
 assert.match(serverSource, /2–24 characters/);
});
