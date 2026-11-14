import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { soloHtml, multiHtml, soloWorker, loadServer, makeRoom, roomInstance } from "./helpers.js";

const leaderboardHtml = readFileSync(new URL("../src/leaderboard.html", import.meta.url), "utf8");
const api = new Function(soloWorker.slice(soloWorker.indexOf("function json("), soloWorker.indexOf("export default")) + "\nreturn api;")();
const uuid = "123e4567-e89b-12d3-a456-426614174000";

test("a first Solo score requires a chosen name, then subsequent games reuse it", () => {
 assert.match(soloHtml, /async function ensureName\(\)/);
 assert.match(soloHtml, /if\(nameConfirmed&&/);
 assert.match(soloHtml, /nameWaiter=resolve/);
 assert.match(soloHtml, /nameConfirmed=true/);
 assert.match(soloHtml, /NAME_CONFIRMED_KEY,'1'/);
 assert.match(soloHtml, /if\(score<1\)return false/);
 assert.match(soloHtml, /onRunOver\(e.reason\)/);
 assert.match(soloHtml, /async function onClear\(ms\)/);
 assert.match(soloHtml, /await saveScoreRun\(key,score,broken,combo\)/);
 assert.doesNotMatch(soloHtml, /myName=randomPlayerName\(\)/);
 assert.doesNotMatch(multiHtml, /randomPlayerName\(\)/);
 assert.match(multiHtml, /function rememberName\(value\)/);
 assert.match(multiHtml, /playerId:leaderboardId\(\)/);
 assert.match(leaderboardHtml, /let metric=params.get\('metric'\)==='time'\?'time':'score'/);
});

test("world rankings return the stored personal result even outside the first page", async () => {
 const rows=Array.from({length:51},(_,i)=>({
  boardKey:"other"+i+"-v4-vintage",playerId:"other-"+i,name:"Other "+i,score:1000+i,bricksBroken:5,bestCombo:1
 }));
 const saved={boardKey:"mine-v4-vintage",playerId:uuid,name:"Chosen Name",score:35,bricksBroken:3,bestCombo:1};
 const sqls=[];
 const db={withSession(){return this;},prepare(sql){
  sqls.push(sql);
  return {bind(){return this;},async all(){return{results:rows};},async first(){return sql.includes("COUNT(")?{n:52}:saved;}};
 }};
 const url=new URL("https://game.example/api/leaderboard?scope=world&metric=score&playerId="+uuid);
 const response=await api(new Request(url),{DB:db},url);
 assert.equal(response.status,200);
 const data=await response.json();
 assert.equal(data.entries.length,50);
 assert.deepEqual(data.personal,saved);
 assert.equal(data.totalPlayers,52);
 assert.ok(sqls.some(sql=>sql.includes("FROM leaderboard_scores WHERE player_id=?")));
 assert.match(leaderboardHtml, /data\.personal/);
});

test("renaming a player updates both historical time records and scores", async () => {
 const updates=[];
 const db={prepare(sql){return{bind(...args){this.args=args;return this;},async run(){updates.push({sql,args:this.args});}}}};
 const url=new URL("https://game.example/api/leaderboard");
 const response=await api(new Request(url,{method:"POST",headers:{"content-type":"application/json"},
  body:JSON.stringify({metric:"rename",playerId:uuid,name:"My Name"})}),{DB:db},url);
 assert.equal(response.status,200);
 assert.equal(updates.length,2);
 assert.ok(updates[0].sql.includes("UPDATE leaderboard_times"));
 assert.ok(updates[1].sql.includes("UPDATE leaderboard_scores"));
 for(const u of updates)assert.deepEqual(u.args,["My Name",uuid]);
});

test("finished multiplayer room submits authoritative per-player brick scores with their names", async () => {
 const server=loadServer();
 const room=makeRoom(server,"versus",2);
 room.seed="face123";room.arena.width=360;
 const ids=[uuid,"123e4567-e89b-12d3-a456-426614174001"];
 for(let i=0;i<2;i++){
  room.players[i].name=["First Player","Second Player"][i];
  room.players[i].leaderboardId=ids[i];
  room.sim.players[i].brickScore=150+i*30;
  room.sim.players[i].bricksBroken=10+i;
  room.sim.players[i].maxCombo=3+i;
 }
 const calls=[];
 const db={prepare(sql){return{bind(...args){this.args=args;return this;},async run(){calls.push({sql,args:this.args});}}}};
 const handler=roomInstance(server,room);handler.env={DB:db};
 await handler.recordScores();
 assert.equal(room.scoreSavedRound,room.round);
 assert.equal(calls.length,4);
 const saves=calls.filter(c=>c.sql.startsWith("INSERT INTO"));
 assert.equal(saves.length,2);
 assert.deepEqual(saves.map(s=>s.args.slice(1,4)),[[ids[0],"First Player",150],[ids[1],"Second Player",180]]);
 assert.equal(saves[0].args[0],"face123-v4-vintage-a360");
 await handler.recordScores();
 assert.equal(calls.length,4,"already committed rounds are idempotent");
});
