import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { extractMidi, selectMidiMelody } from "../src/midi-parser.js";
import { createBrickMusic } from "../src/brick-music.js";
import { soloCoreSource, browserCoreSource } from "../src/game-core.js";

const variable = value => {
  const out = [value & 127];
  while (value >>= 7) out.unshift((value & 127) | 128);
  return out;
};
const chunk = (name, bytes) => {
  const n = bytes.length;
  return Buffer.from([...Buffer.from(name), n >>> 24 & 255, n >>> 16 & 255, n >>> 8 & 255, n & 255, ...bytes]);
};
function fixture() {
  const melody = [];
  for (let i = 0; i < 20; i++) {
    const pitch = 69 + i % 5;
    melody.push(0, 144, pitch, 75, ...variable(120), 128, pitch, 0);
  }
  return Buffer.concat([
    chunk("MThd", [0, 1, 0, 2, 1, 224]),
    chunk("MTrk", [0, 255, 47, 0]),
    chunk("MTrk", [...melody, 0, 255, 47, 0])
  ]);
}

test("local MIDI parser identifies a melody track and keeps source pitches", () => {
  const data = fixture();
  assert.deepEqual(selectMidiMelody(data, "Popular song.mid").notes, extractMidi(data, 1, true).notes);
  assert.equal(selectMidiMelody(data, "Popular song.mid").name, "Popular song");
  assert.equal(selectMidiMelody(data, "Popular song.mid").source.track, 1);
  assert.throws(() => selectMidiMelody(Buffer.from("not midi"), "bad.mid"), /Not a MIDI file/);
});

test("custom MIDI replaces only the local board melody and uses one note per hit", () => {
  const music = createBrickMusic(), seed = "test-seed";
  const boardName = music.reset(seed);
  const custom = selectMidiMelody(fixture(), "Imported song.mid");
  assert.equal(music.setCustomTrack(custom), "Imported song");
  assert.equal(music.reset("another-board"), "Imported song");
  const sounds = [];
  const kit = { context: { currentTime: 0 }, blip: (...args) => sounds.push(args) };
  for (let i = 0; i < 5; i++) {
    assert.equal(music.hit(kit), true);
    assert.equal(sounds.length, i + 1);
    assert.equal(sounds[i][4], 0);
  }
  assert.equal(sounds.length, 5);
  music.useBoardTrack();
  assert.equal(music.reset(seed), boardName);
});

test("both game modes expose local MIDI controls and the browser parser", () => {
  for (const [path, script] of [["solo.html", soloCoreSource], ["multiplayer.html", browserCoreSource]]) {
    const html = readFileSync(new URL("../src/" + path, import.meta.url), "utf8");
    assert.match(html, /id="midiImport"/);
    assert.match(html, /id="midiSelect"/);
    assert.match(html, /id="midiUpload"/);
    assert.match(html, /setupMidiLibrary\(brickMusic\)/);
    assert.equal(runInNewContext(script + "\ntypeof extractMidi"), "function");
    assert.equal(runInNewContext(script + "\ntypeof selectMidiMelody"), "function");
    assert.equal(runInNewContext(script + "\ntypeof setupMidiLibrary"), "function");
  }
});
