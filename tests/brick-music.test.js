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
  assert.equal(melodyTracks.length, 6);
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

test("each brick hit plays exactly one MIDI note immediately, with no autoplay", () => {
  const music = choose("Für Elise"), output = [];
  const kit = { context: { currentTime: 3 }, blip: (...args) => output.push(args) };
  const tune = melodyTracks.find(t => t.name.startsWith("Für Elise"));
  assert.equal(music.hit(null), false, "muted hits must not advance the melody");
  assert.equal(output.length, 0);
  for (let i = 0; i < 5; i++) {
    assert.equal(music.hit(kit), true);
    assert.equal(output.length, i + 1, "one hit must trigger only one note");
    const [frequency, , duration, , delay] = output[i];
    approximate(frequency, 440 * Math.pow(2, (tune.notes[i][1] - 69) / 12));
    approximate(duration, tune.notes[i][2]);
    assert.equal(delay, 0, "the note starts on its corresponding brick hit");
  }
  kit.context.currentTime += 20;
  assert.equal(output.length, 5, "no automatic notes after hits stop");
  assert.equal(music.hit(kit), true);
  assert.equal(output.length, 6, "a later hit still plays exactly one note");
  assert.equal(output[5][4], 0, "MIDI rests must not delay the player's hit");
});

test("rapid hits are not throttled, and clearing music cancels voices and resets playback", () => {
  const music = choose("Für Elise"), output = [];
  let canceled = 0;
  const kit = { context: { currentTime: 7 }, blip: (...args) => { output.push(args); return () => canceled++; } };
  for (let i = 0; i < 60; i++) assert.equal(music.hit(kit), true);
  assert.equal(output.length, 60, "every brick in a combo must sound");
  assert.ok(output.every(note => note[4] === 0), "no MIDI notes are queued for later");
  const firstFrequency = output[0][0];
  music.clearQueue();
  assert.equal(canceled, output.length);
  music.hit(kit);
  approximate(output.at(-1)[0], firstFrequency);
  assert.equal(output.at(-1)[4], 0);
  music.reset("retry");
  const beforeRetry = output.length;
  assert.equal(music.hit(kit), true);
  assert.equal(output.length, beforeRetry + 1);
  assert.equal(output.at(-1)[4], 0);
  const beforeMute = output.length;
  assert.equal(music.hit(null), false);
  assert.equal(output.length, beforeMute);
});

test("the melody loops back to its first pitch after the last note", () => {
  const music = choose("Für Elise");
  const expected = music.next().frequency;
  for (let i = 1; i < music.length; i++) music.next();
  approximate(music.next().frequency, expected);
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
