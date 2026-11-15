import test from 'node:test';
import assert from 'node:assert/strict';
import {runInNewContext} from 'node:vm';
import {soloHtml} from './helpers.js';
import {brickEngine} from '../src/engine.js';
import {arenaLayout,bricks} from '../src/game-core.js';

test('clearing a room opens only the winning result flow',()=>{
 const calls=[];
 const source=soloHtml.slice(soloHtml.indexOf('function react(e)'),soloHtml.indexOf('\nfunction mkGlow'));
 runInNewContext(source+"\nreact({t:'end',reason:'cleared'})",{timerOn:true,brickMusic:{clearQueue(){}},showMsg(){},onClear(){calls.push('clear')},onRunOver(){calls.push('over')},runTime:1000,flashW:0,vib(){},style:'vintage',introReducedMotion:true,conf:[],setTimeout(){}});
 assert.deepEqual(calls,['clear']);
});

test('side paddle center returns stay straight in the owning player frame',()=>{
 for(const seat of [1,3]){
 const E=brickEngine(()=>.5),arena=arenaLayout(1);
 const S=E.create({arena,board:bricks('side-center',2,arena),players:[{id:'me',seat},{id:'other',seat:seat===1?3:1}],mode:'versus'});
 const p=S.players[0];
 S.balls=[{x:seat===1?30:arena.width-30,y:p.c,vx:seat===1?-300:300,vy:0,owner:'me',source:'me'}];
 for(let frame=0;frame<5;frame++)E.step(S,1/60);
 assert.ok(Math.abs(S.balls[0].vy)<.001,'center return must not drift sideways');
 assert.ok(seat===1?S.balls[0].vx>0:S.balls[0].vx<0);
 }
});

test('power strip shows only live owner/global effects with bounded timer bars',async()=>{
 const {drawPowerStatus}=await import('../src/game-core.js');
 const E=brickEngine(),texts=[],bars=[];
 const ctx={save(){},restore(){},fillText(t){texts.push(t)},fillRect(...a){bars.push(a)}};
 drawPowerStatus(ctx,E.PU_BY_ID,{slow:4},{mitosis:2.2,wide:0},256,580);
 assert.deepEqual(texts,['S 4s','M 3s']);
 assert.equal(bars.length,4);
 assert.ok(bars.every(b=>b[2]>=0&&b[2]<=100));
 texts.length=0;
 drawPowerStatus(ctx,E.PU_BY_ID,{},{mitosis:0},256,580);
 assert.equal(texts.length,0);
});

test('clearing music cancels scheduled voices rather than only resetting a counter',async()=>{
 const {createBrickMusic}=await import('../src/brick-music.js');
 const music=createBrickMusic();let stopped=0,scheduled=0;
 const kit={context:{currentTime:0},blip(){scheduled++;return ()=>stopped++}};
 music.hit(kit);music.hit(kit);music.clearQueue();
 assert.ok(scheduled>2);
 assert.equal(stopped,scheduled);
 music.clearQueue();assert.equal(stopped,scheduled);
});
