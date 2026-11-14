import assert from "node:assert/strict";
import test from "node:test";
import { brickEngine } from "../src/engine.js";

test("Rain is absent from every power-up set and starter capsule", () => {
  const engine = brickEngine();
  for (const [set, powers] of Object.entries(engine.PU_SETS)) {
    assert.equal(powers.length, 10, `${set} retains 10 power-up slots`);
    for (let kind = 1; kind <= 11; kind++) {
      const power = engine.puDef(set, kind);
      assert.ok(power, `${set} capsule ${kind} resolves to a power-up`);
      assert.notEqual(power.id, "rain");
    }
  }
  assert.equal(engine.puDef("vintage", 8).id, "slow");
  assert.equal(engine.puDef("vintage", 11).id, "slow");
  assert.equal(engine.puDef("vintage", 11, "versus").id, "slow");
});

const crtArena = { cols: 13, rows: 13, cell: 6, width: 584, height: 584, gridX: 100, gridY: 100, square: true };
const crtBoard = { hp: "1".repeat(169), colors: "1".repeat(169), powerups: "0".repeat(169), remaining: 169, total: 169 };

function collectVintage(kind) {
  const E = brickEngine(() => 0.5);
  const S = E.create({ arena: crtArena, board: crtBoard, mode: "solo", set: "vintage",
    players: [{ id: "player", seat: 0 }] });
  assert.equal(E.launch(S, "player"), true);
  S.pups.push({ x: S.players[0].c, y: 535, k: kind, c: 6, r: 6, owner: "player" });
  const events = E.step(S, 1 / 60);
  assert.ok(events.some(e => e.t === "power"), "the player must collect the capsule");
  return { E, S };
}

test("CRT keeps valid capsule slots without SOFTEN", () => {
  const E = brickEngine();
  assert.equal(E.PU_SETS.vintage.length, 10);
  for (const set of Object.keys(E.PU_SETS)) {
    for (let kind = 1; kind <= 11; kind++) {
      for (const mode of ["solo", "coop", "versus"]) {
        const power = E.puDef(set, kind, mode);
        assert.ok(power);
        assert.notEqual(power.id, "soften");
      }
    }
  }
  assert.equal(E.puDef("vintage", 9).id, "life");
});

test("CRT MITOSIS lasts five seconds", () => {
  const { S } = collectVintage(1);
  assert.equal(S.players[0].fx.mitosis, 5);
});

test("CRT MITOSIS duplicates a ball on a brick bounce only while active", () => {
  const E = brickEngine(() => .5);
  const hp = "1" + "0".repeat(168);
  const board = { hp, colors: "1".repeat(169), powerups: "0".repeat(169), remaining: 1, total: 1 };
  const S = E.create({ arena: crtArena, board, mode: "solo", set: "vintage", players: [{ id: "player", seat: 0 }] });
  S.players[0].fx.mitosis = 5;
  S.balls = [{ x: 97, y: 103, vx: 300, vy: 0, owner: "player", source: "player" }];
  E.step(S, 1 / 60);
  assert.equal(S.balls.length, 2, "a brick bounce creates one extra ball");
  assert.equal(S.remaining, 0);

  S.players[0].fx.mitosis = 0;
  S.hp[1] = 1;
  S.remaining = 1;
  S.rowCount[0]++;
  S.colCount[1]++;
  S.balls = [{ x: 103, y: 103, vx: 300, vy: 0, owner: "player", source: "player" }];
  E.step(S, 1 / 60);
  assert.equal(S.balls.length, 1, "the effect stops duplicating after it expires");
});

test("CRT NUKE hits only a 5 by 5 brick area", () => {
  const { S } = collectVintage(2);
  assert.equal(S.remaining, 169 - 25);
  assert.equal(S.hp[6 * 13 + 6], 0);
  assert.equal(S.hp[3 * 13 + 6], 1, "bricks outside the radius remain untouched");
});

test("CRT ROW SWEEP clears exactly one line", () => {
  const { S } = collectVintage(4);
  assert.equal(S.remaining, 169 - 13);
  assert.equal(S.rowCount.filter(n => n === 0).length, 1);
});

test("CRT former SOFTEN slot now grants one life", () => {
  const { S } = collectVintage(9);
  assert.equal(S.pool, 6);
});
