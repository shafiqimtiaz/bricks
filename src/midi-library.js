export function setupMidiLibrary(music) {
  const input = document.getElementById("midiUpload");
  const select = document.getElementById("midiSelect");
  const button = document.getElementById("midiImport");
  const status = document.getElementById("songStatus");
  if (!input || !select || !button || !status) return;
  const key = "bricks-local-midi-v1";
  let tracks = [], selected = "";
  try {
    const saved = JSON.parse(localStorage.getItem(key) || "{}");
    if (Array.isArray(saved.tracks)) tracks = saved.tracks.filter(t => t?.name && Array.isArray(t.notes) && t.notes.length).slice(0, 12);
    if (typeof saved.selected === "string") selected = saved.selected;
  } catch {}

  function refreshLabel() {
    const option = select.options[0];
    if (option) option.textContent = selected ? "BOARD MELODY" : "BOARD · " + music.name;
    select.title = selected ? music.name : "Board melody: " + music.name;
  }

  function render() {
    select.replaceChildren(new Option("BOARD MELODY", ""));
    for (const track of tracks) select.add(new Option(track.name, track.name));
    select.value = tracks.some(track => track.name === selected) ? selected : "";
  }

  function apply() {
    const track = tracks.find(t => t.name === select.value);
    if (track) {
      selected = track.name;
      music.setCustomTrack(track);
    } else {
      selected = "";
      music.useBoardTrack();
    }
    status.textContent = "MELODY · " + music.name;
    status.removeAttribute?.("data-notice");
    refreshLabel();
  }

  function save() {
    try {
      localStorage.setItem(key, JSON.stringify({ tracks, selected }));
      return true;
    } catch {
      return false;
    }
  }

  render();
  apply();
  button.addEventListener("click", () => input.click());
  document.getElementById("hudMenuToggle")?.addEventListener("click", refreshLabel);
  select.addEventListener("change", () => { apply(); save(); });
  input.addEventListener("change", async () => {
    const files = Array.from(input.files || []).slice(0, 12);
    input.value = "";
    if (!files.length) return;
    let loaded = 0, error = "";
    for (const file of files) {
      try {
        const track = selectMidiMelody(new Uint8Array(await file.arrayBuffer()), file.name);
        const index = tracks.findIndex(item => item.name === track.name);
        if (index >= 0) tracks[index] = track;
        else if (tracks.length < 12) tracks.push(track);
        else throw new Error("Library full (12 tracks)");
        selected = track.name;
        loaded++;
      } catch (failure) {
        error = failure.message || "Invalid MIDI";
      }
    }
    render();
    apply();
    const saved = save();
    if (error) {
      status.textContent = "MIDI ERROR · " + error;
      status.setAttribute?.("data-notice", "");
    } else if (loaded && !saved) {
      status.textContent = "MIDI LOADED · SESSION ONLY";
      status.setAttribute?.("data-notice", "");
    }
  });
}
