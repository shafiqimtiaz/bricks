import assert from "node:assert/strict";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { createBrickMusic } from "../src/brick-music.js";
import { melodyTracks } from "../src/music-tracks.js";
import { browserCoreSource, soloCoreSource } from "../src/game-core.js";
import { soloHtml, multiHtml, serverSource, loadServer, makeRoom, roomInstance } from "./helpers.js";

const approximate = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-4, actual + " !== " + expected);

function choose(name) {
  const music = createBrickMusic();
  for (let i = 0; i < 100; i++) {
    if (music.reset("seed-" + i).startsWith(name)) return music;
  }
  throw new Error("No board selected " + name);
}

test("only source-traceable public-domain MIDI tracks are displayed", () => {
  assert.equal(melodyTracks.length, 8);
  assert.equal(createBrickMusic().count, melodyTracks.length);
  for (const tune of melodyTracks) {
    assert.ok(tune.name && tune.source.url && tune.source.blobSha);
    assert.match(tune.source.license, /Public Domain/);
    assert.ok(tune.notes.length > 32, tune.name);
    assert.ok(tune.loop > tune.notes.at(-1)[0]);
    assert.ok(tune.notes.every(([at, pitch, duration]) => at >= 0 && pitch >= 0 && pitch <= 127 && duration > 0));
    for (let i = 1; i < tune.notes.length; i++) assert.ok(tune.notes[i][0] >= tune.notes[i - 1][0]);
  }
});

test("Für Elise opening follows the source MIDI's pitches and timing", () => {
  const tune = melodyTracks.find(t => t.name.startsWith("Für Elise"));
  assert.deepEqual(tune.notes.slice(0, 9).map(note => note[1]), [76,75,76,75,76,71,74,72,69]);
  approximate(tune.notes[1][0], .2083);
  approximate(tune.notes[8][0], 1.6667);
  approximate(tune.notes[8][2], .4167);
  const prelude = melodyTracks.find(t => t.name.startsWith("Prelude in C"));
  assert.ok(prelude.notes.some((note, i) => i && note[0] - prelude.notes[i - 1][0] - prelude.notes[i - 1][2] > .2), "MIDI rests are preserved");
});

test("lives and descent never transpose the actual composition", () => {
  const music = choose("Für Elise");
  music.reset("unused");
  const baseline = () => {
    const selected = choose("Für Elise");
    return selected.next();
  };
  const expected = baseline();
  for (const lives of [5, 4, 3, 2, 1, 0]) {
    const selected = choose("Für Elise");
    selected.setLives(lives, 5);
    selected.setDepth(100);
    assert.deepEqual(selected.next(), expected);
  }
});

test("seeded board and round selection remains deterministic with variation", () => {
  const first = createBrickMusic(), second = createBrickMusic(), choices = new Set();
  for (let i = 0; i < 100; i++) {
    const seed = "board-" + i + ":round-1";
    assert.equal(first.reset(seed), second.reset(seed));
    assert.deepEqual(first.next(), second.next());
    choices.add(first.name);
  }
  assert.equal(choices.size, melodyTracks.length);
});

test("a brick hit plays a short phrase on the MIDI clock instead of one hit per note", () => {
  const music = choose("Für Elise"), output = [];
  const kit = { context: { currentTime: 3 }, blip: (...args) => output.push(args) };
  assert.equal(music.hit(kit), true);
  assert.ok(output.length >= 5, "first hit must trigger several notes");
  approximate(output[0][4], 0);
  approximate(output[1][4], .2083);
  approximate(output[2][4], .4167);
  assert.ok(output.every(n => n[2] > 0 && n[4] >= 0));
  const start = output.length;
  assert.equal(music.hit(kit), true);
  assert.ok(output.length > start, "rapid hits extend the existing phrase");
  assert.ok(output[start][4] >= output.at(start - 1)[4], "phrase continuation retains original timing");
});

test("dense combos stay bounded, pause cancels audio, and replay resets the melody", () => {
  const music = choose("Für Elise"), output = [];
  let canceled = 0;
  const kit = { context: { currentTime: 7 }, blip: (...args) => { output.push(args); return () => canceled++; } };
  for (let i = 0; i < 60; i++) music.hit(kit);
  assert.ok(output.length > 5 && output.length < 40);
  assert.ok(output.at(-1)[4] < 5);
  for (let i = 1; i < output.length; i++) assert.ok(output[i][4] >= output[i - 1][4]);
  music.clearQueue();
  assert.equal(canceled, output.length);
  music.hit(kit);
  approximate(output.at(-output.length + canceled)[4], 0);
  music.reset("retry");
  assert.equal(music.hit(kit), true);
  approximate(output.at(-7)[4], 0);
  const before = output.length;
  assert.equal(music.hit(null), false);
  assert.equal(output.length, before);
});

test("solo and multiplayer display the actual selected tune and bundle the same music engine", () => {
  for (const html of [soloHtml, multiHtml]) {
    assert.doesNotMatch(html, /id="musicTrack"|id="midiFile"|id="loadMidi"|midiPick|LOAD LICENSED MIDI/);
    assert.match(html, /brickMusic\.hit\((?:soundKit|soundOn\?soundKit:null)(?:,pan)?\)/);
    assert.match(html, /brickMusic\.reset\(/);
    assert.match(html, /songStatus/);
  }
  assert.match(soloHtml, /brickMusic\.reset\(seed\)/);
  assert.match(multiHtml, /brickMusic\.reset\(s\.seed/);
  assert.match(serverSource, /descentRows:S\?\.descent\?\.rows\|\|0/);
  for (const bundle of [soloCoreSource, browserCoreSource]) {
    assert.equal(runInNewContext(bundle + "\ntypeof createBrickMusic"), "function");
    assert.equal(runInNewContext(bundle + "\ncreateBrickMusic().count"), melodyTracks.length);
    assert.equal(runInNewContext(bundle + "\ncreateBrickMusic().reset('seed-1')"), createBrickMusic().reset("seed-1"));
  }
});

test("multiplayer snapshots retain real infinite descent progress", () => {
  const server = loadServer();
  const room = makeRoom(server, "infinite", 2);
  const instance = roomInstance(server, room);
  assert.equal(instance.snapshot(false).descentRows, 0);
  room.sim.descent.rows = 6;
  assert.equal(instance.snapshot(false).descentRows, 6);
});
