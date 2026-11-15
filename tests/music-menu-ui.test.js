import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { setupMidiLibrary } from "../src/midi-library.js";
import { designCss } from "../src/design.js";

const read = file => readFileSync(new URL("../src/" + file, import.meta.url), "utf8");

test("music controls form one compact row on both game screens", () => {
  for (const file of ["solo.html", "multiplayer.html"]) {
    const html = read(file);
    assert.match(html, /class="musicControl"[^>]*>[\s\S]*?class="musicRow"[\s\S]*?id="midiSelect"[\s\S]*?id="midiImport"[^>]*>\+ MIDI<\/button>/);
    assert.match(html, /id="songStatus" role="status" aria-live="polite"/);
    assert.doesNotMatch(html, />IMPORT MIDI<\/button>/);
  }
  assert.match(designCss, /#hud #hudMenu \.musicControl\{[\s\S]*?grid-column:1\/-1/);
  assert.match(designCss, /grid-template-columns:minmax\(0,1fr\) 76px/);
  assert.match(designCss, /#hud #hudMenu #songStatus\[data-notice\]/);
});

test("selector names the current board song without duplicating a visible status line", () => {
  const listeners = {};
  const option = (text, value) => ({ textContent: text, value });
  const select = {
    options: [], value: "", title: "",
    replaceChildren(o) { this.options = [o]; this.value = o.value; },
    add(o) { this.options.push(o); },
    addEventListener(name, callback) { listeners["select:" + name] = callback; }
  };
  const status = {
    textContent: "", attributes: {},
    setAttribute(name, value) { this.attributes[name] = value; },
    removeAttribute(name) { delete this.attributes[name]; }
  };
  const input = { addEventListener() {} };
  const button = { addEventListener() {} };
  const toggle = { addEventListener(name, callback) { listeners["toggle:" + name] = callback; } };
  const elements = { midiUpload: input, midiSelect: select, midiImport: button, songStatus: status, hudMenuToggle: toggle };
  const oldDocument = globalThis.document, oldOption = globalThis.Option, oldStorage = globalThis.localStorage;
  const music = {
    name: "Fur Elise",
    setCustomTrack(track) { this.name = track.name; },
    useBoardTrack() { this.name = "Fur Elise"; }
  };
  try {
    globalThis.document = { getElementById: id => elements[id] };
    globalThis.Option = class { constructor(name, value) { return option(name, value); } };
    globalThis.localStorage = { getItem: () => JSON.stringify({ tracks: [{ name: "Imported Theme", notes: [[0, 60, .5]] }], selected: "" }), setItem() {} };
    setupMidiLibrary(music);
    assert.equal(select.options[0].textContent, "BOARD · Fur Elise");
    assert.equal(status.textContent, "MELODY · Fur Elise");
    music.name = "Another Board Track";
    listeners["toggle:click"]();
    assert.equal(select.options[0].textContent, "BOARD · Another Board Track");
    select.value = "Imported Theme";
    listeners["select:change"]();
    assert.equal(select.options[0].textContent, "BOARD MELODY");
    assert.equal(select.title, "Imported Theme");
    select.value = "";
    listeners["select:change"]();
    assert.equal(select.options[0].textContent, "BOARD · Fur Elise");
  } finally {
    globalThis.document = oldDocument;
    globalThis.Option = oldOption;
    globalThis.localStorage = oldStorage;
  }
});
