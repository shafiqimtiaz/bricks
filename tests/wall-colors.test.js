import assert from "node:assert/strict";
import test from "node:test";
import { arenaLayout, squareArena, bricks, drawBrickTile } from "../src/game-core.js";
import { brickEngine } from "../src/engine.js";

test("reinforced V4 bricks use a seeded color in Solo and every multiplayer layout", () => {
 const layouts = [[1, arenaLayout(9/16)], [2, arenaLayout(9/16)], [3, squareArena()], [4, squareArena()]];
 for (const [players, arena] of layouts) {
  const board = bricks("BRICKS", players, arena);
  for (const life of [1, 2, 3]) {
   const match = /^hsl\(([\d.]+),([\d.]+)%,([\d.]+)%\)$/.exec(board.wallColors[life]);
   assert.ok(match, "wall color has a valid seeded HSL value");
   assert.ok(Number(match[2]) >= 30, "wall color is visibly tinted, not grey");
  }
  const index = [...board.hp].findIndex((hp, i) => hp === "3" && board.colors[i] === "0");
  assert.ok(index >= 0, "a reinforced wall exists");
  let fillStyle = "", firstColor;
  const context = {
   clearRect() {},
   fillRect() { firstColor ??= fillStyle; },
   get fillStyle() { return fillStyle; },
   set fillStyle(value) { fillStyle = value; }
  };
  drawBrickTile(context, 0, 0, 8, 3, 0, board.palette, board.wallColors);
  assert.equal(firstColor, board.wallColors[3], "the shared renderer uses the tinted wall palette");
 }
});

test("generated multiplayer Infinite reinforced bricks inherit the same tinted palette", () => {
 const arena = arenaLayout(9/16), board = bricks("9K7YBR", 2, arena);
 const E = brickEngine(() => 0);
 const S = E.create({ arena, board, players: [{ id: "host", seat: 0 }, { id: "guest", seat: 2 }],
  mode: "coop", set: "vintage", lives: 6, server: "host", infinite: true });
 S.descent.t = S.descent.interval;
 E.step(S, 1/60);
 assert.ok(S.hp.some((hp, i) => hp === 3 && S.col[i] === 0 && board.hp[i] === "0"),
  "the Infinite refill includes newly generated reinforced bricks");
 const saturation = Number(/,([\d.]+)%,/.exec(board.wallColors[3])?.[1]);
 assert.ok(saturation >= 30, "new reinforced bricks render in the same tinted color");
});
