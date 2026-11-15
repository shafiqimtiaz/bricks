import { melodyTracks } from "./music-tracks.js";

export function createBrickMusic() {
  const tunes = melodyTracks;
  let tune = tunes[0], position = 0;
  let voices = [];

  function clearQueue() {
    for (const voice of voices) voice.cancel();
    voices = [];
    position = 0;
  }

  function reset(seed = "") {
    clearQueue();
    let hash = 2166136261;
    const key = String(seed);
    for (let i = 0; i < key.length; i++) hash = Math.imul(hash ^ key.charCodeAt(i), 16777619);
    tune = tunes[(hash >>> 0) % tunes.length];
    return tune.name;
  }

  function currentEvent() {
    return tune.notes[position];
  }

  function advance() {
    position++;
    if (position >= tune.notes.length) position = 0;
  }

  function noteParams(event) {
    return {
      frequency: 440 * Math.pow(2, (event[1] - 69) / 12),
      volume: tune.wave === "square" ? .085 : .15,
      duration: event[2],
      wave: tune.wave,
      at: event[0]
    };
  }

  function next() {
    const note = noteParams(currentEvent());
    advance();
    return note;
  }

  function hit(soundKit, pan = 0) {
    if (!soundKit) return false;
    const now = soundKit.context.currentTime;
    voices = voices.filter(voice => voice.until > now);
    const note = next();
    const cancel = soundKit.blip(note.frequency, note.volume, note.duration, note.wave, 0, pan);
    if (typeof cancel === "function") voices.push({ cancel, until: now + note.duration + .02 });
    return true;
  }

  return {
    reset, clearQueue, next, hit,
    setLives() {}, setDepth() {},
    get name() { return tune.name; },
    get length() { return tune.notes.length; },
    get count() { return tunes.length; }
  };
}
