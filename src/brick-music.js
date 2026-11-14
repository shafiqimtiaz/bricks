export function createBrickMusic() {
  // MIDI pitches are scheduled on brick hits, so the songs keep the arcade's hit-triggered feel.
  const tunes = [
    {
      name: "Billie Jean — Michael Jackson", wave: "square", step: .075, duration: .12,
      notes: [61,61,61,59,57,59,57,61,57,57,59,57,61,61,61,61,61,59,57,59,57,61,59,57,56,54,54,56,54,54,56,54]
    },
    {
      name: "Beat It — Michael Jackson", wave: "square", step: .075, duration: .12,
      notes: [70,68,70,70,70,68,70,71,70,68,68,70,68,70,70,70,68,70,68,66,68,66,68,70,68,66,63,61,63,61,63,65]
    },
    {
      name: "Thriller — Michael Jackson", wave: "triangle", step: .085, duration: .15,
      notes: [58,60,62,63,60,58,55,55,58,60,60,58,60,58,60,63,60,58,55,58,60,62,63,60,58,55,55,58,60,60,58,60]
    },
    {
      name: "Like a Prayer — Madonna", wave: "triangle", step: .09, duration: .16,
      notes: [62,65,64,67,62,65,60,64,64,67,62,65,64,60,64,67,65,69,70,67,72,69,67,72,70,69,65,72,74,69,72,67]
    },
    {
      name: "Like a Virgin — Madonna", wave: "triangle", step: .09, duration: .16,
      notes: [61,61,61,68,68,68,66,66,61,61,61,68,68,68,70,66,68,68,68,68,68,66,66,61,63,66,61,61,56,61,63,68]
    },
    {
      name: "Numb — Linkin Park", wave: "square", step: .075, duration: .13,
      notes: [61,61,61,61,62,61,61,59,57,61,61,59,57,59,54,61,61,59,57,59,54,61,61,61,61,62,61,61,59,57,54,61]
    },
    {
      name: "Toxic — Britney Spears", wave: "square", step: .075, duration: .12,
      notes: [60,63,62,63,60,60,63,63,60,63,62,60,60,60,63,60,63,63,60,55,55,59,59,63,63,62,60,60,63,63,60,63]
    },
    {
      name: "Blinding Lights — The Weeknd", wave: "triangle", step: .085, duration: .15,
      notes: [65,65,67,65,63,63,60,63,60,63,70,67,65,63,70,67,65,63,65,65,67,63,65,65,67,65,63,63,60,63,60,63]
    },
    {
      name: "Dancing Queen — ABBA", wave: "triangle", step: .09, duration: .16,
      notes: [86,84,83,81,79,77,76,74,72,71,69,67,65,64,62,60,59,57,55,53,52,50,48,45,69,85,88,93,93,85,88,69]
    },
    {
      name: "I Want It That Way — Backstreet Boys", wave: "triangle", step: .09, duration: .16,
      notes: [77,75,74,72,70,69,70,77,75,74,72,70,69,70,70,69,67,67,77,75,74,72,70,72,74,67,70,74,72,70,70,67]
    },
    {
      name: "We Are the Champions — Queen", wave: "triangle", step: .095, duration: .17,
      notes: [41,46,53,58,62,72,70,72,70,72,70,65,72,62,60,62,52,60,70,65,69,70,69,67,69,63,68,65,46,53,58,62]
    },
    {
      name: "In the End — Linkin Park", wave: "square", step: .075, duration: .13,
      notes: [58,58,59,58,58,59,58,58,58,59,58,66,68,70,61,61,63,65,65,65,61,61,61,61,63,65,63,65,63,65,66,65]
    }
  ];

  let tune = tunes[0], position = 0, nextAt = 0, lifePitchDrop = 0, depthPitchDrop = 0;

  function reset(seed = "") {
    let hash = 2166136261;
    const key = String(seed);
    for (let i = 0; i < key.length; i++) hash = Math.imul(hash ^ key.charCodeAt(i), 16777619);
    tune = tunes[(hash >>> 0) % tunes.length];
    position = 0;
    nextAt = 0;
    lifePitchDrop = depthPitchDrop = 0;
    return tune.name;
  }

  function setLives(lives, maxLives) {
    const total = Math.max(1, maxLives);
    lifePitchDrop = Math.round(12 * (1 - Math.max(0, Math.min(lives, total)) / total));
  }

  function setDepth(rows) {
    depthPitchDrop = Math.min(8, Math.max(0, rows) / 2);
  }

  function next() {
    let pitch = tune.notes[position++ % tune.notes.length];
    while (pitch < 55) pitch += 12;
    while (pitch > 88) pitch -= 12;
    return {
      frequency: 440 * Math.pow(2, (pitch - Math.min(18, lifePitchDrop + depthPitchDrop) - 69) / 12),
      volume: tune.wave === "square" ? .085 : tune.wave === "sine" ? .18 : .17,
      duration: tune.duration,
      wave: tune.wave
    };
  }

  function hit(soundKit, pan = 0) {
    if (!soundKit) return false;
    const now = soundKit.context.currentTime;
    const delay = Math.max(0, nextAt - now);
    if (delay > .15 + 1e-9) return false;
    const note = next();
    soundKit.blip(note.frequency, note.volume, note.duration, note.wave, delay, pan);
    nextAt = now + delay + tune.step;
    return true;
  }

  function clearQueue() { nextAt = 0; }

  return {
    reset, setLives, setDepth, next, hit, clearQueue,
    get name() { return tune.name; },
    get length() { return tune.notes.length; },
    get count() { return tunes.length; }
  };
}
