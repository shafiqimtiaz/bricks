import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { soloHtml, multiHtml, soloWorker, loadServer, makeRoom, roomInstance } from "./helpers.js";

const leaderboard = readFileSync(new URL("../src/leaderboard.html", import.meta.url), "utf8");
const api = new Function(soloWorker.slice(soloWorker.indexOf("function json("), soloWorker.indexOf("export default")) + "\nreturn api;")();
const uuid="123e4567-e89b-12d3-a456-426614174000";

test("Solo Classic and Infinite save broken-brick scores with the confirmed player name",()=>{
 assert.match(soloHtml,/onRunOver\(e.reason\)/);
 assert.match(soloHtml,/if\(lastScore<1\|\|!myName\)return/);
 assert.match(soloHtml,/if\(lastScore>0\)try/);
 assert.match(soloHtml,/if\(!myName&&\(mode==='clear'\|\|mode==='over'&&lastScore>0\)\)openNameModal\(true\)/);
 assert.match(soloHtml,/localStorage\.setItem\('brick-asmr-name-confirmed','1'\)/);
 assert.match(multiHtml,/lastPromptedRound/);
 assert.match(multiHtml,/profileName/);
});

test("a player's saved result appears even if it is not in the first page of world rankings",async()=>{
 const rows=Array.from({length:51},(_,i)=>({boardKey:"other"+i+"-v4-vintage",playerId:"other-"+i,name:"Someone",score:1000+i,bricksBroken:5,bestCombo:1}));
 const mine={boardKey:"mine-v4-vintage",playerId:uuid,name:"My Name",score:35,bricksBroken:3,bestCombo:1};
 const sqls=[];
 const db={withSession(){return this;},prepare(sql){sqls.push(sql);return{bind(){return this;},async all(){return{results:rows};},async first(){return sql.includes("COUNT(")?{n:52}:mine;}};}};
 const url=new URL("https://game.example/api/leaderboard?scope=world&metric=score&playerId="+uuid);
 const response=await api(new Request(url),{DB:db},url);
 assert.equal(response.status,200);
 const data=await response.json();
 assert.equal(data.entries.length,50);
 assert.equal(data.totalPlayers,52);
 assert.deepEqual(data.personal,mine);
 assert.match(leaderboard,/data\.personal/);
 assert.ok(sqls.some(s=>s.includes("WHERE player_id=?")));
});

test("manual name changes update previous worldwide times and scores",async()=>{
 const calls=[];
 const db={prepare(sql){return {bind(...args){this.args=args;return this;},async run(){calls.push({sql,args:this.args});}};}};
 const url=new URL("https://game.example/api/leaderboard");
 const response=await api(new Request(url,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({metric:"rename",playerId:uuid,name:"New Name"})}),{DB:db},url);
 assert.equal(response.status,200);
 assert.equal(calls.length,2);
 assert.ok(calls.some(x=>x.sql.includes("UPDATE leaderboard_times")));
 assert.ok(calls.some(x=>x.sql.includes("UPDATE leaderboard_scores")));
 for(const c of calls)assert.deepEqual(c.args,["New Name",uuid]);
});

test("multiplayer room saves only confirmed named players and records later confirmation",async()=>{
 const server=loadServer(),room=makeRoom(server,"versus",2);
 room.status="finished";room.seed="face123";room.arena.width=360;
 const ids=[uuid,"123e4567-e89b-12d3-a456-426614174001"];
 for(let i=0;i<2;i++){
  room.players[i].leaderboardId=ids[i];
  room.players[i].name=["Named Player","Temporary Guest"][i];
  room.players[i].confirmed=i===0;
  room.sim.players[i].brickScore=120+i*30;
  room.sim.players[i].bricksBroken=8+i;
  room.sim.players[i].maxCombo=3+i;
 }
 const calls=[],db={prepare(sql){return {bind(...args){this.args=args;return this;},async run(){calls.push({sql,args:this.args});}};}};
 const handler=roomInstance(server,room);handler.env={DB:db};
 await handler.recordScores();
 assert.equal(calls.length,2);
 assert.deepEqual(calls[0].args.slice(1,4),[ids[0],"Named Player",120]);
 room.players[1].confirmed=true;room.players[1].name="Chosen Second";
 await handler.recordScores();
 assert.equal(calls.length,6);
 assert.deepEqual(calls[4].args.slice(1,4),[ids[1],"Chosen Second",150]);
 assert.equal(calls[4].args[0],"face123-v4-vintage-a360");
});

test("result sharing preserves seed and mode without sharing player identity",()=>{
 const source=soloHtml.match(/const shareURL = \(\) => \{[\s\S]*?\n\};/)?.[0];
 assert.ok(source);
 const share=new Function("location","W","seed","soloMode",source+"\nreturn shareURL();");
 for(const mode of ["solo","infinite"]){
  const url=new URL(share({origin:"https://bricks.shafq.dev",pathname:"/"},360,"abc123",mode));
  assert.equal(url.searchParams.get("mode"),mode);
  assert.equal(url.searchParams.get("arena"),"360");
  assert.equal(url.hash,"#abc123");
  assert.doesNotMatch(url.href,/player|name|identity|score=/i);
 }
 assert.match(soloHtml,/incomingMode === 'solo' \|\| incomingMode === 'infinite'/);
 assert.match(soloHtml,/P\('pretry'\)\.onclick=\(\)=>startBoard\(\)/);
 assert.match(soloHtml,/P\('pnext'\)\.onclick=\(\)=>newBoard\(\)/);
 assert.match(soloHtml,/lastScore\+' · '\+lastBricks/);
});
