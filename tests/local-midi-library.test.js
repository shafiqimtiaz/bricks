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

test("MIDI upload survives the browser bundler renaming the selector function", async () => {
  const bytes = fixture();
  for (const source of [soloCoreSource, browserCoreSource]) {
    const renamed = source.replace(
      "const selectMidiMelody = function selectMidiMelody(",
      "const selectMidiMelody = function selectMidiMelody2("
    );
    assert.notEqual(renamed, source, "selector must have a stable browser binding");
    const listeners = {};
    const status = { textContent: "" };
    const input = {
      files: [{ name: "Naruto Main Theme.mid", arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) }],
      value: "",
      addEventListener: (type, listener) => { listeners[type] = listener; }
    };
    const select = {
      value: "", options: [],
      replaceChildren(option) { this.options = [option]; this.value = option.value; },
      add(option) { this.options.push(option); },
      addEventListener() {}
    };
    const button = { addEventListener() {} };
    const music = {
      name: "BOARD",
      setCustomTrack(track) { this.name = track.name; this.notes = track.notes; },
      useBoardTrack() { this.name = "BOARD"; }
    };
    const controls = { midiUpload: input, midiSelect: select, midiImport: button, songStatus: status };
    const context = {
      document: { getElementById: id => controls[id] },
      Option: class { constructor(label, value) { this.label = label; this.value = value; } },
      localStorage: { getItem: () => null, setItem() {} },
      music
    };
    runInNewContext(renamed + String.fromCharCode(10) + "setupMidiLibrary(music)", context);
    await listeners.change();
    assert.equal(music.name, "Naruto Main Theme");
    assert.equal(music.notes.length, 20);
    assert.equal(status.textContent, "MELODY · Naruto Main Theme");
  }
});
