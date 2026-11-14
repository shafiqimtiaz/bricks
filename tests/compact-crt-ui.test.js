import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { soloHtml } from "./helpers.js";

const rankings=readFileSync(new URL("../src/leaderboard.html",import.meta.url),"utf8");

test("Solo menu keeps horror identity across both columns and uses compact touch targets",()=>{
 const css=soloHtml.slice(soloHtml.indexOf("<style>"),soloHtml.indexOf("</style>"));
 assert.match(soloHtml,/class="menuIdentity"/);
 assert.match(soloHtml,/<strong>BRICKS<\/strong>/);
 const menu=soloHtml.slice(soloHtml.indexOf('<div class="menuIdentity">'),soloHtml.indexOf('</div>',soloHtml.indexOf('<div class="menuIdentity">')));
 assert.doesNotMatch(menu,/Brick Rooms Induce Claustrophobia/);
 assert.match(css,/#hud #hudMenu \.menuIdentity\s*\{\s*grid-column:1\/-1/);
 assert.match(css,/width:min\(82vw,320px\);min-width:0;box-sizing:border-box/);
 assert.match(css,/min-height:42px/);
 assert.match(css,/max-height:min\(75vh,520px\)/);
 assert.match(soloHtml,/id="score" class="score"/);
 assert.match(soloHtml,/MULTIPLAYER/);
 assert.match(css,/#hud>#score\{flex:0 1 auto;min-width:0;max-width:52%;overflow:hidden;text-overflow:ellipsis/);
});

test("high scores show rankings above the fold and keep a three-column mobile strip",()=>{
 const css=rankings.slice(rankings.indexOf("<style>"),rankings.indexOf("</style>"));
 assert.match(rankings,/BRICKS — BRICK ROOMS INDUCE CLAUSTROPHOBIA\. KEEP SMILING\./);
 assert.match(css,/\.hero\{padding:clamp\(22px,4vh,36px\) 0 16px/);
 assert.match(css,/\.hero\{padding:22px 0 12px\}/);
 assert.match(css,/@media\(max-width:420px\)\{\s*\.stats\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(css,/grid-template-columns:34px minmax\(0,1fr\) 84px/);
 assert.doesNotMatch(css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.doesNotMatch(rankings,/ARCHIVE · /);
});

test("first visit folds the BRICKS reveal into the existing seed card",()=>{
 assert.match(soloHtml,/const BRAND_INTRO_SEEN_KEY=/);
 assert.match(soloHtml,/prefers-reduced-motion: reduce/);
 assert.match(soloHtml,/BRICK ROOMS INDUCE/);
 assert.match(soloHtml,/CLAUSTROPHOBIA\. KEEP SMILING\./);
 assert.match(soloHtml,/introT=0/);
 assert.match(soloHtml,/ctx\.fillText\('BRICK ROOMS INDUCE'/);
 assert.match(soloHtml,/ctx\.fillText\('CLAUSTROPHOBIA\. KEEP SMILING\.'/);
 assert.match(soloHtml,/introBrand\?2\.4:1\.8/);
 assert.match(soloHtml,/function launch\(\)\{\s*if \(state !== 'aim'\) return;\s*introT=0;\s*E\.launch/);
 assert.match(soloHtml,/window\.addEventListener\('keydown', e => \{\s*if\(!document\.getElementById\('panel'\)\.hidden\|\|!document\.getElementById\('hudMenu'\)\.hidden\)return;\s*if\(introT>0\)introT=0;/);
 const links=soloHtml.match(/function setLinks\(\)\{[^}]+\}/)?.[0];
 assert.ok(links,"result leaderboard links exist");
 const values={};
 const P=id=>({set href(value){values[id]=value;},set textContent(value){values[id]=value;}});
 new Function("P","panelMode","W","seed","myName","previewName",links+";setLinks()") (P,"over",1280,"face123","Player","Preview");
 assert.equal(values.pfull,"/leaderboard?metric=score&arena=1280&seed=face123");
 new Function("P","panelMode","W","seed","myName","previewName",links+";setLinks()") (P,"clear",320,"daily", "Player","Preview");
 assert.equal(values.pfull,"/leaderboard?metric=time&arena=320&seed=daily");
 const menuLink=soloHtml.match(/P\('top'\)\.onclick=\(\)=>\{location\.href=[^;]+;\};/)?.[0];
 assert.ok(menuLink,"menu scores action exists");
 let onTopClick;
 const location={};
 new Function("P","soloMode","W","seed","location",menuLink)(id=>({set onclick(fn){onTopClick=fn;}}),"infinite",1280,"face123",location);
 onTopClick();
 assert.equal(location.href,"/leaderboard?metric=score&arena=1280&seed=face123");
});
