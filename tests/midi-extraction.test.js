import assert from "node:assert/strict";
import test from "node:test";
import { extractMidi } from "../scripts/extract-midi.mjs";

const variable = value => {
  const bytes = [value & 127];
  while (value >>= 7) bytes.unshift((value & 127) | 128);
  return bytes;
};
const chunk = (tag, bytes) => {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(bytes.length);
  return Buffer.concat([Buffer.from(tag), length, Buffer.from(bytes)]);
};
const fixture = () => {
  const header = chunk("MThd", [0, 1, 0, 2, 1, 224]);
  const tempo = chunk("MTrk", [
    0, 255, 81, 3, 7, 161, 32,
    ...variable(480), 255, 81, 3, 15, 66, 64,
    0, 255, 47, 0
  ]);
  const melody = chunk("MTrk", [
    0, 144, 60, 90,
    ...variable(240), 60, 0,
    ...variable(240), 62, 90,
    ...variable(240), 62, 0,
    ...variable(240), 64, 90,
    ...variable(120), 64, 0,
    0, 255, 47, 0
  ]);
  return Buffer.concat([header, tempo, melody]);
};

test("MIDI importer retains rests, duration, running status and tempo changes", () => {
  const result = extractMidi(fixture(), 1);
  assert.deepEqual(result.notes, [[0,60,.25],[.5,62,.5],[1.5,64,.25]]);
  assert.equal(result.loop, 2.25);
});

test("invalid MIDI and missing track are rejected, not silently misidentified", () => {
  assert.throws(() => extractMidi(Buffer.from("not midi"), 0), /Invalid MIDI header/);
  assert.throws(() => extractMidi(fixture(), 2), /track index/);
});

test("new importer preserves note pitches and does not fold octaves", () => {
  const data = fixture();
  const notes = extractMidi(data, 1).notes;
  assert.deepEqual(notes.map(event => event[1]), [60,62,64]);
  assert.equal(notes[1][0] - notes[0][0] - notes[0][2], .25);
});
