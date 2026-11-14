import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { soloHtml } from "./helpers.js";

const rankings=readFileSync(new URL("../src/leaderboard.html",import.meta.url),"utf8");

test("Solo menu keeps horror identity across both columns and uses compact touch targets",()=>{
 const css=soloHtml.slice(soloHtml.indexOf("<style>"),soloHtml.indexOf("</style>"));
 assert.match(soloHtml,/class="menuIdentity"/);
 assert.match(soloHtml,/Brick Rooms Induce Claustrophobia\. Keep Smiling\./);
 assert.match(css,/#hud #hudMenu \.menuIdentity\s*\{\s*grid-column:1\/-1/);
 assert.match(css,/width:min\(82vw,320px\);min-width:0;box-sizing:border-box/);
 assert.match(css,/min-height:42px/);
 assert.match(css,/max-height:min\(75vh,520px\)/);
});

test("high scores show rankings above the fold and keep a three-column mobile strip",()=>{
 const css=rankings.slice(rankings.indexOf("<style>"),rankings.indexOf("</style>"));
 assert.match(css,/\.hero\{padding:clamp\(34px,7vh,64px\) 0 24px/);
 assert.match(css,/\.hero\{padding:36px 0 18px\}/);
 assert.match(css,/@media\(max-width:420px\)\{\s*\.stats\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(css,/grid-template-columns:34px minmax\(0,1fr\) 84px/);
 assert.doesNotMatch(css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.doesNotMatch(rankings,/ARCHIVE · /);
});
