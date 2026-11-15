import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

export function extractMidi(bytes, trackIndex, topVoice = false) {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let cursor = 0;
  function take(count) {
    if (cursor + count > data.length) throw new Error("Truncated MIDI file");
    const part = data.slice(cursor, cursor + count);
    cursor += count;
    return part;
  }
  function number(count) {
    return take(count).reduce((value, byte) => value * 256 + byte, 0);
  }
  function label() {
    return String.fromCharCode(...take(4));
  }
  function variable() {
    let value = 0;
    for (let i = 0; i < 4; i++) {
      const byte = number(1);
      value = (value << 7) | (byte & 127);
      if (!(byte & 128)) return value;
    }
    throw new Error("Invalid variable-length MIDI value");
  }
  if (label() !== "MThd") throw new Error("Invalid MIDI header");
  const headerLength = number(4);
  if (headerLength < 6) throw new Error("Invalid MIDI header length");
  number(2);
  const trackCount = number(2), ticksPerBeat = number(2);
  if (ticksPerBeat & 0x8000) throw new Error("SMPTE MIDI timing unsupported");
  if (!Number.isInteger(trackIndex) || trackIndex < 0 || trackIndex >= trackCount) throw new Error("Invalid MIDI track index");
  take(headerLength - 6);

  const tempos = [{ tick: 0, micros: 500000 }];
  const tracks = [];
  for (let track = 0; track < trackCount; track++) {
    if (label() !== "MTrk") throw new Error("Missing MIDI track");
    const length = number(4);
    const end = cursor + length;
    let tick = 0, runningStatus = 0;
    const active = new Map(), notes = [];
    while (cursor < end) {
      tick += variable();
      let status = number(1);
      if (status < 128) {
        if (!runningStatus) throw new Error("MIDI running status missing");
        cursor--;
        status = runningStatus;
      } else if (status < 240) {
        runningStatus = status;
      }
      if (status === 255) {
        const kind = number(1), length = variable();
        const value = take(length);
        if (kind === 81 && length === 3) tempos.push({ tick, micros: value[0] * 65536 + value[1] * 256 + value[2] });
        continue;
      }
      if (status === 240 || status === 247) {
        take(variable());
        continue;
      }
      const op = status & 240, channel = status & 15;
      const pitch = number(1), velocity = op === 192 || op === 208 ? 0 : number(1);
      const key = channel + ":" + pitch;
      if (op === 144 && velocity > 0) {
        if (!active.has(key)) active.set(key, []);
        active.get(key).push(tick);
      } else if (op === 128 || op === 144 && velocity === 0) {
        const starts = active.get(key);
        if (starts?.length) {
          const start = starts.shift();
          if (tick > start) notes.push([start, pitch, tick - start]);
        }
      }
    }
    if (cursor !== end) throw new Error("Invalid MIDI track length");
    tracks.push(notes.sort((a, b) => a[0] - b[0] || b[1] - a[1]));
  }

  tempos.sort((a, b) => a.tick - b.tick);
  const changes = [];
  for (const tempo of tempos) {
    if (changes.length && changes[changes.length - 1].tick === tempo.tick) changes[changes.length - 1] = tempo;
    else changes.push(tempo);
  }
  const timeline = [{ tick: 0, seconds: 0, micros: changes[0].micros }];
  for (let i = 1; i < changes.length; i++) {
    const prev = timeline[timeline.length - 1], next = changes[i];
    timeline.push({ tick: next.tick, seconds: prev.seconds + (next.tick - prev.tick) * prev.micros / 1e6 / ticksPerBeat, micros: next.micros });
  }
  function seconds(tick) {
    let i = timeline.length - 1;
    while (i && timeline[i].tick > tick) i--;
    const tempo = timeline[i];
    return tempo.seconds + (tick - tempo.tick) * tempo.micros / 1e6 / ticksPerBeat;
  }
  let selected = tracks[trackIndex];
  if (!selected.length) throw new Error("The selected MIDI track has no notes");
  if (topVoice) selected = selected.filter((event, index) => !index || event[0] !== selected[index - 1][0]);
  const initial = seconds(selected[0][0]);
  const round = value => Math.round(value * 10000) / 10000;
  const notes = selected.map(([at, pitch, duration]) => [round(seconds(at) - initial), pitch, round(seconds(at + duration) - seconds(at))]);
  return { notes, loop: round(notes[notes.length - 1][0] + notes[notes.length - 1][2] + .5) };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [file, ...args] = process.argv.slice(2);
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    if (flag === "--top") flags.top = true;
    else if (flag.startsWith("--")) flags[flag.slice(2)] = args[++i];
  }
  if (!file || !flags.track || !flags.name || !flags.source || !flags.license) {
    console.error("Usage: node scripts/extract-midi.mjs input.mid --track 1 --name 'Song title' --source URL --license LICENCE [--top]");
    process.exitCode = 1;
  } else {
    const input = readFileSync(file);
    const extracted = extractMidi(input, Number(flags.track), Boolean(flags.top));
    const track = {
      name: flags.name, wave: flags.wave || "triangle", ...extracted,
      source: { url: flags.source, sha256: createHash("sha256").update(input).digest("hex"), track: Number(flags.track), license: flags.license, selection: flags.top ? "highest pitch at each simultaneous onset" : "full selected MIDI track" }
    };
    process.stdout.write(JSON.stringify(track) + "\n");
  }
}
