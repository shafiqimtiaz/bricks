import assert from "node:assert/strict";
import test from "node:test";
import { soloHtml, multiHtml } from "./helpers.js";

const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} !== ${expected}`);

test("solo: two fingers move aim and paddle independently across the two zones", () => {
  const start = soloHtml.indexOf("// Touching the lower zone never jumps");
  const end = soloHtml.indexOf("const keys = {};", start);
  assert.ok(start > 0 && end > start);
  const listeners = {}, captured = [];
  const wrap = {
    addEventListener(type, callback) { listeners[type] = callback; },
    getBoundingClientRect() { return { width: 360 }; },
    setPointerCapture(id) { captured.push(id); },
  };
  const me = { target: 180, aim: 0 };
  let launches = 0;
  const engine = {
    setPaddle(_state, _id, x) { me.target = x; },
    setAim(_state, _id, angle) { me.aim = Math.max(-1.15, Math.min(1.15, angle)); },
  };
  new Function("wrap", "audioInit", "toLogical", "paused", "aimAng", "E", "S", "me", "px", "pw",
    "W", "SZONE", "fx", "sensitivity", "state", "launch", "newBoard", "aimDragAngle",
    "let introT=0;"+soloHtml.slice(start, end)
  )(wrap, () => {}, e => [e.clientX, e.clientY], false, 0, engine, {}, me, 180, 64, 360, 550,
    { invert: 0 }, () => .65, "aim", () => launches++, () => {}, (aim, dx, width) => aim + dx / width * 2.3);
  const e = (id, x, y, pointerType = "touch") =>
    ({ pointerId: id, clientX: x, clientY: y, pointerType, buttons: pointerType === "mouse" ? 0 : 1,
      target: { tagName: "CANVAS" } });
  listeners.pointerdown(e(1, 40, 220));
  listeners.pointerdown(e(2, 260, 580));
  assert.deepEqual(captured, [1, 2]);
  near(me.target, 180);
  near(me.aim, 0);
  listeners.pointermove(e(2, 310, 580));
  near(me.target, 212.5);
  near(me.aim, 0);
  listeners.pointermove(e(1, 100, 220));
  near(me.aim, 60 / 360 * 2.3);
  near(me.target, 212.5);
  listeners.pointercancel(e(2, 310, 580));
  listeners.pointermove(e(1, 130, 220));
  near(me.aim, 90 / 360 * 2.3);
  listeners.pointerup(e(1, 130, 220));
  assert.equal(launches, 0, "dragging to aim must not launch");
  listeners.pointermove(e(3, 320, 220, "mouse"));
  near(me.aim, (320 / 360 - .5) * 2.3);
  listeners.pointermove(e(3, 20, 580, "mouse"));
  near(me.aim, (320 / 360 - .5) * 2.3, "mouse below the divider cannot change aim");
  near(me.target, 212.5, "entering the lower zone cannot jump the paddle");
  listeners.pointermove(e(3, 60, 580, "mouse"));
  near(me.target, 238.5, "moving the mouse below the divider glides the paddle");
  listeners.pointerleave();
  listeners.pointermove(e(3, 300, 580, "mouse"));
  near(me.target, 238.5, "re-entering the lower zone cannot jump the paddle");
  listeners.pointerdown(e(4, 80, 220));
  listeners.pointerup(e(4, 80, 220));
  assert.equal(launches, 1, "a short tap above the divider launches");
});

test("multiplayer: aim and paddle respond to separate concurrent touches on the same canvas", () => {
  const start = multiHtml.indexOf("let controlDrag=");
  const end = multiHtml.indexOf("const MOVE_KEYS=", start);
  assert.ok(start > 0 && end > start);
  const listeners = {}, captured = [];
  const canvas = {
    addEventListener(type, callback) { listeners[type] = callback; },
    getBoundingClientRect() { return { width: 360 }; },
    setPointerCapture(id) { captured.push(id); },
  };
  let aim = 0, launches = 0;
  const getPosition = new Function("cv", "gcv", "state", "$", "audioInit", "boardPointer", "viewH",
    "viewW", "sensitivity", "setAim", "aimDragAngle", "launch",
    "let localPos=.5,drag=null,aimAng=0;const send=pos=>{localPos=pos;};" +
    multiHtml.slice(start, end) + "return () => localPos;"
  )(canvas, canvas, { status: "playing" }, () => ({ hidden: true }), () => {},
    event => ({ x: event.clientX, y: event.clientY }), 640, 360, () => .65,
    angle => { aim = angle; }, (startAim, dx, width) => startAim + dx / width * 2.3, () => launches++);
  const e = (id, x, y, pointerType = "touch") =>
    ({ pointerId: id, currentTarget: canvas, clientX: x, clientY: y, pointerType,
      buttons: pointerType === "mouse" ? 0 : 1 });
  listeners.pointerdown(e(11, 60, 160));
  listeners.pointerdown(e(22, 260, 590));
  assert.deepEqual(captured, [11, 22]);
  near(getPosition(), .5);
  near(aim, 0);
  listeners.pointermove(e(22, 300, 590));
  near(getPosition(), .5 + 40 / 360 * .65);
  listeners.pointermove(e(11, 150, 160));
  near(aim, 90 / 360 * 2.3);
  near(getPosition(), .5 + 40 / 360 * .65);
  listeners.pointerup(e(11, 150, 160));
  assert.equal(launches, 0, "aim drags must not launch");
  listeners.pointermove(e(22, 330, 590));
  near(getPosition(), .5 + 70 / 360 * .65);
  listeners.pointercancel(e(22, 330, 590));
  listeners.pointermove(e(33, 280, 260, "mouse"));
  near(aim, (280 / 360 - .5) * 2.3);
  listeners.pointermove(e(33, 10, 600, "mouse"));
  near(aim, (280 / 360 - .5) * 2.3);
  near(getPosition(), .5 + 70 / 360 * .65, "entering below cannot jump the paddle");
  listeners.pointermove(e(33, 50, 600, "mouse"));
  near(getPosition(), .5 + 110 / 360 * .65);
  listeners.pointerleave();
  listeners.pointermove(e(33, 250, 600, "mouse"));
  near(getPosition(), .5 + 110 / 360 * .65, "re-entering below cannot jump");
  listeners.pointerdown(e(44, 100, 180));
  listeners.pointerup(e(44, 100, 180));
  assert.equal(launches, 1);
});
