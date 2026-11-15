import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { extractMidi } from "../src/midi-parser.js";

export { extractMidi };


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
