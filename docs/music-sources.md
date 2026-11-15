# BRICKS music sources

The game uses note events extracted from real MIDI tracks rather than the former unverified 32-note sequences. **Each destroyed brick immediately plays exactly one note**, advancing the melody by one step; no further notes play without additional brick hits. MIDI pitches and individual note lengths are retained, but note onset times and rests do not control when sounds start—the player's hits do. Pitches are never octave-folded or transposed by life count or Infinite descent.

## Shipped tracks

The current six tracks come from public-domain **Mutopia Project** editions, copied with their provenance at [wustep/jev-playground reference MIDI](https://github.com/wustep/jev-playground/tree/main/docs/ref-midi/public). Each entry in `src/music-tracks.js` records the **exact Git blob SHA**, chosen MIDI track index, extraction method and source URL. These are actual sequenced editions, but only one voice is rendered, not a full piano performance.

| Game title | MIDI source | Track used |
| --- | --- | --- |
| Für Elise — Beethoven | [Mutopia edition](https://github.com/wustep/jev-playground/blob/main/docs/ref-midi/public/beethoven-woo59-fur-elise.mid) | 1 |
| Prelude in C — J. S. Bach | [Mutopia edition](https://github.com/wustep/jev-playground/blob/main/docs/ref-midi/public/bach-bwv846-wtk1-prelude1.mid) | 2 |
| Prelude Op. 28 No. 4 — Chopin | [Mutopia edition](https://github.com/wustep/jev-playground/blob/main/docs/ref-midi/public/chopin-op28-4-prelude.mid) | 1 |
| Clair de lune — Debussy | [Mutopia edition](https://github.com/wustep/jev-playground/blob/main/docs/ref-midi/public/debussy-l75-clair-de-lune.mid) | 1 (highest simultaneous pitch) |
| Pathétique Adagio — Beethoven | [Mutopia edition](https://github.com/wustep/jev-playground/blob/main/docs/ref-midi/public/beethoven-op13-pathetique-2.mid) | 1 (highest simultaneous pitch) |
| Première Arabesque — Debussy | [Mutopia edition](https://github.com/wustep/jev-playground/blob/main/docs/ref-midi/public/debussy-l66-arabesque-1.mid) | 1 (highest simultaneous pitch) |

Mutopia's source pages document the public-domain status of these six specific MIDI editions. Other Mutopia editions may use Creative Commons Attribution or ShareAlike licences and must not be assumed public domain. This repository does not distribute the source MIDI binary; it distributes extracted note events from those editions.

## Pop songs not yet cleared

The former 12 pop-song labels (Michael Jackson, Madonna, Linkin Park, ABBA, and others) were attached to **unverified** 32-note arrays. Those arrays have been removed instead of being advertised as authentic melodies. A free MIDI download from BitMidi or another site does **not** establish permission to include its song, transcription or arrangement in a public game.

To add a song once a suitable MIDI and permissions are available:

1. Identify the correct melody track/channel in the MIDI, and listen to it. Do not guess from the filename.
2. Run `node scripts/extract-midi.mjs licensed.mid --track 1 --name "Track title" --source "https://..." --license "Documented permission" > track.json`. For chordal piano tracks, `--top` selects the highest pitch at simultaneous onsets; **audition the result**, since highest voice does not automatically equal the melody.
3. Add the resulting object to `src/music-tracks.js`, recording its checksum/source and reviewing the first phrase against the source.
4. Run `npm test && npm run build`, and verify the audio on mobile and desktop.

The extracted melody is intentionally not accompanied by the source MIDI's instruments or its other tracks. Some pieces are more recognizable with accompaniment; additional voices would need a separately tested playback design.
