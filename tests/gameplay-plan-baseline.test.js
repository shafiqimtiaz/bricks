import assert from "node:assert/strict";
import test from "node:test";
import { arenaLayout, bricks } from "../src/game-core.js";

test("V4 generates 100 deterministic nonempty seeds for phone and wide layouts", () => {
  for (const ratio of [9 / 16, 16 / 9]) {
    const arena=arenaLayout(ratio);
    for(let n=0;n<100;n++){
      const seed="pacing"+String(n).padStart(3,"0");
      const a=bricks(seed,1,arena),b=bricks(seed,1,arena);
      assert.equal(a.hp.length,arena.rows*arena.cols);
      assert.ok(a.remaining>0,seed);
      assert.equal(a.hp,b.hp,seed+" must be deterministic");
      assert.equal(a.powerups,b.powerups,seed+" must keep the same power-ups");
    }
  }
});
