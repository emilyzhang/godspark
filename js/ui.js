// ============================================================
// GODSPARK — UI: rendering, drag & drop, panels.
// Reads engine state, calls engine functions, never mutates state directly.
// Sound & particles live in fx.js.
// ============================================================

let selectedVerbId = null;

const $ = (sel) => document.querySelector(sel);

// ---- small builders --------------------------------------------------------

function aspectChips(aspects) {
  const wrap = document.createElement("div");
  wrap.className = "aspect-chips";
  for (const [aspect, n] of Object.entries(aspects)) {
    const info = ASPECTS[aspect];
    if (!info) continue;
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.style.borderColor = info.color;
    chip.style.color = info.color;
    chip.appendChild(iconEl(info.icon));
    chip.appendChild(document.createTextNode(`${info.label}${n > 1 ? " " + n : ""}`));
    wrap.appendChild(chip);
  }
  return wrap;
}

// The small colored gems on a card's face: its aspects, readable at a glance.
function aspectGems(aspects) {
  const row = document.createElement("div");
  row.className = "gem-row";
  for (const [aspect, n] of Object.entries(aspects)) {
    const info = ASPECTS[aspect];
    if (!info) continue;
    const gem = document.createElement("span");
    gem.className = "gem";
    gem.style.color = info.color;
    gem.appendChild(iconEl(info.icon));
    if (n > 1) {
      const count = document.createElement("span");
      count.className = "gem-n";
      count.textContent = n;
      gem.appendChild(count);
    }
    gem.title = `${info.label}${n > 1 ? " " + n : ""}`;
    row.appendChild(gem);
  }
  return row;
}

function dominantAspectColor(def) {
  const first = Object.keys(def.aspects)[0];
  return (first && ASPECTS[first]) ? ASPECTS[first].color : "#3a3145";
}

function cardEl(card, { draggable = true } = {}) {
  const def = CARD_DEFS[card.defId];
  const el = document.createElement("div");
  el.className = "card";
  if (def.menace) el.classList.add("menace");
  if (card.defId.startsWith("spark")) el.classList.add("radiant");
  el.dataset.uid = card.uid;
  el.draggable = draggable;
  el.style.setProperty("--aspect-color", dominantAspectColor(def));

  const ribbon = document.createElement("div");
  ribbon.className = "card-ribbon";
  el.appendChild(ribbon);

  // the card's art: its constellation-sigil, with the icon at its heart
  const art = document.createElement("div");
  art.className = "card-art";
  art.appendChild(cardSigil(card.defId, dominantAspectColor(def)));
  const icon = document.createElement("div");
  icon.className = "card-icon";
  icon.appendChild(iconEl(def.icon));
  art.appendChild(icon);

  const name = document.createElement("div");
  name.className = "card-name";
  name.textContent = def.name;

  el.appendChild(art);
  el.appendChild(name);
  el.appendChild(aspectGems(def.aspects));

  if (card.decay !== null && !card.heldBy) {
    const decay = document.createElement("div");
    decay.className = "card-decay";
    decay.textContent = `${Math.ceil(card.decay)}s`;
    if (card.decay < 30) decay.classList.add("urgent");
    el.appendChild(decay);
  }

  const tip = document.createElement("div");
  tip.className = "card-tip";
  const tipName = document.createElement("strong");
  tipName.textContent = def.name;
  const tipDesc = document.createElement("p");
  tipDesc.textContent = def.desc;
  tip.appendChild(tipName);
  tip.appendChild(tipDesc);
  tip.appendChild(aspectChips(def.aspects));
  el.appendChild(tip);

  if (draggable) {
    el.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", String(card.uid));
      e.dataTransfer.effectAllowed = "move";
      el.classList.add("dragging");
      document.body.classList.add("dragging-card");
    });
    el.addEventListener("dragend", () => {
      el.classList.remove("dragging");
      document.body.classList.remove("dragging-card");
    });
    el.addEventListener("dblclick", () => {
      if (selectedVerbId === null) return;
      const verb = verbState(selectedVerbId);
      if (verb.running || verb.complete) return;
      const free = verb.slots.indexOf(null);
      if (free !== -1) slotCard(selectedVerbId, free, card.uid);
    });
  }
  return el;
}

// ---- verb row --------------------------------------------------------------

function renderVerbRow() {
  const row = $("#verb-row");
  row.innerHTML = "";
  for (const [verbId, def] of Object.entries(VERB_DEFS)) {
    const verb = verbState(verbId);
    if (!verb.unlocked) continue;

    const tile = document.createElement("button");
    tile.className = "verb-tile";
    tile.dataset.verb = verbId;
    if (verbId === selectedVerbId) tile.classList.add("selected");

    const icon = document.createElement("div");
    icon.className = "verb-icon";
    icon.appendChild(iconEl(def.icon));
    const name = document.createElement("div");
    name.className = "verb-name";
    name.textContent = def.name;
    tile.appendChild(icon);
    tile.appendChild(name);

    const status = document.createElement("div");
    status.className = "verb-status";
    if (verb.running) {
      const recipe = RECIPES.find((r) => r.id === verb.running.recipeId);
      status.textContent = `${recipe.name} — ${Math.ceil(verb.running.remaining)}s`;
      const bar = document.createElement("div");
      bar.className = "verb-progress";
      const fill = document.createElement("div");
      fill.className = "verb-progress-fill";
      fill.style.width = `${(1 - verb.running.remaining / verb.running.total) * 100}%`;
      bar.appendChild(fill);
      tile.appendChild(bar);
    } else {
      status.textContent = verb.repeat ? "repeating" : "idle";
    }
    if (verb.repeat) {
      const loop = iconEl("restart");
      loop.classList.add("repeat-mark");
      tile.appendChild(loop);
    }
    tile.appendChild(status);

    tile.addEventListener("click", () => {
      selectedVerbId = selectedVerbId === verbId ? null : verbId;
      render();
    });
    row.appendChild(tile);
  }
}

// ---- verb panel ------------------------------------------------------------

function slotEl(verbId, slotIndex) {
  const verb = verbState(verbId);
  const uid = verb.slots[slotIndex];
  const slot = document.createElement("div");
  slot.className = "slot";

  if (uid !== null) {
    const card = cardByUid(uid);
    if (card) {
      const el = cardEl(card, { draggable: false });
      el.classList.add("in-slot");
      el.addEventListener("click", () => unslotCard(verbId, slotIndex));
      el.title = "Click to return to your possessions";
      slot.appendChild(el);
      slot.classList.add("filled");
    }
  } else {
    slot.textContent = "＋";
    slot.classList.add("open");
  }

  slot.addEventListener("dragover", (e) => {
    if (verb.running || uid !== null) return;
    e.preventDefault();
    slot.classList.add("drop-ok");
  });
  slot.addEventListener("dragleave", () => slot.classList.remove("drop-ok"));
  slot.addEventListener("drop", (e) => {
    e.preventDefault();
    slot.classList.remove("drop-ok");
    document.body.classList.remove("dragging-card");
    const dropped = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (!Number.isNaN(dropped)) slotCard(verbId, slotIndex, dropped);
  });
  return slot;
}

// Discovered recipes for this verb, with their ingredient aspects shown:
// the transparency you earn in the Grimoire, laid out at the table.
function knownWorkingsEl(verbId) {
  const known = grimoire
    .filter((e) => e.verb === verbId)
    .map((e) => RECIPES.find((r) => r.id === e.recipeId))
    .filter(Boolean)
    .filter((r) => Object.keys(r.requires).length > 0);
  if (known.length === 0) return null;

  const wrap = document.createElement("div");
  wrap.className = "known-workings";
  const label = document.createElement("h4");
  label.appendChild(iconEl("leaf"));
  label.appendChild(document.createTextNode("workings you know"));
  wrap.appendChild(label);

  for (const recipe of known) {
    const row = document.createElement("div");
    row.className = "working-row";
    const name = document.createElement("span");
    name.className = "working-name";
    name.textContent = recipe.name;
    row.appendChild(name);
    row.appendChild(aspectChips(recipe.requires));
    wrap.appendChild(row);
  }
  return wrap;
}

function renderVerbPanel() {
  const panel = $("#verb-panel");
  if (selectedVerbId === null) {
    panel.classList.add("hidden");
    panel.innerHTML = "";
    return;
  }
  panel.classList.remove("hidden");
  panel.innerHTML = "";
  const verbId = selectedVerbId;
  const def = VERB_DEFS[verbId];
  const verb = verbState(verbId);

  const head = document.createElement("div");
  head.className = "panel-head";
  const title = document.createElement("h3");
  title.appendChild(iconEl(def.icon));
  title.appendChild(document.createTextNode(def.name));
  const desc = document.createElement("p");
  desc.className = "verb-desc";
  desc.textContent = def.desc;
  head.appendChild(title);
  head.appendChild(desc);
  panel.appendChild(head);

  const slots = document.createElement("div");
  slots.className = "slot-row";
  for (let i = 0; i < verb.slots.length; i++) slots.appendChild(slotEl(verbId, i));
  panel.appendChild(slots);

  const footer = document.createElement("div");
  footer.className = "panel-footer";

  if (verb.running) {
    const recipe = RECIPES.find((r) => r.id === verb.running.recipeId);
    const running = document.createElement("p");
    running.className = "running-label";
    running.textContent = `${recipe.name} — ${Math.ceil(verb.running.remaining)}s remaining…`;
    footer.appendChild(running);
  } else {
    const preview = previewRecipe(verbId);
    const label = document.createElement("p");
    label.className = "preview-label";
    if (preview) {
      label.textContent = `You could begin: “${preview.name}” (${preview.duration}s)`;
    } else {
      label.textContent = "Nothing would come of this combination.";
    }
    footer.appendChild(label);

    const start = document.createElement("button");
    start.className = "primary";
    start.textContent = "Begin";
    start.disabled = !preview;
    start.addEventListener("click", () => {
      startVerb(verbId);
      if (state.paused && !state.ended) setPaused(false); // starting an action resumes time
      render();
    });
    footer.appendChild(start);
  }

  const repeat = document.createElement("button");
  repeat.className = "repeat-toggle" + (verb.repeat ? " on" : "");
  repeat.appendChild(iconEl("restart"));
  repeat.appendChild(document.createTextNode(verb.repeat ? "Repeating" : "Repeat"));
  repeat.title = "When this working finishes, gather the same kinds of cards and begin it again";
  repeat.addEventListener("click", () => {
    verb.repeat = !verb.repeat;
    save();
    render();
  });
  footer.appendChild(repeat);
  panel.appendChild(footer);

  const workings = knownWorkingsEl(verbId);
  if (workings) panel.appendChild(workings);
}

// ---- tray ------------------------------------------------------------------

// Possessions shelve themselves by kind, menaces last.
const TRAY_GROUPS = [
  { key: "ember", label: "The Ember" },
  { key: "means", label: "Means" },
  { key: "lore", label: "Lore & Letters" },
  { key: "stories", label: "Stories & Memories" },
  { key: "company", label: "Company" },
  { key: "curiosities", label: "Curiosities" },
  { key: "burdens", label: "Burdens" },
];

function trayGroupOf(def) {
  const a = def.aspects;
  if (a.spark) return "ember";
  if (def.menace) return "burdens";
  if (a.lore || a.text || a.tome || a.annotation || a.ledger) return "lore";
  if (a.story || a.godmemory) return "stories";
  if (a.listener || a.devotee || a.widow || a.hollows || a.inquisitor || a.emissary) return "company";
  if (a.funds || a.vigor || a.clarity || a.fervor || a.wonder || a.soul || a.position) return "means";
  return "curiosities";
}

function renderTray() {
  const tray = $("#card-tray");
  tray.innerHTML = "";
  const cards = trayCards();
  if (cards.length === 0) {
    const empty = document.createElement("p");
    empty.className = "tray-empty";
    empty.textContent = "You possess nothing. This is either a beginning or an ending.";
    tray.appendChild(empty);
    return;
  }
  // stable display: sort by definition id then uid
  cards.sort((a, b) => a.defId.localeCompare(b.defId) || a.uid - b.uid);

  // When a verb lies open and idle, light up the cards that would matter to it.
  const verbOpen = selectedVerbId !== null && !verbState(selectedVerbId).running;

  const grouped = {};
  for (const card of cards) {
    (grouped[trayGroupOf(CARD_DEFS[card.defId])] ||= []).push(card);
  }

  for (const group of TRAY_GROUPS) {
    const members = grouped[group.key];
    if (!members) continue;
    const section = document.createElement("div");
    section.className = "tray-group";
    const label = document.createElement("h3");
    label.className = "tray-group-label";
    label.textContent = group.label;
    section.appendChild(label);
    const row = document.createElement("div");
    row.className = "tray-group-cards";
    // identical possessions pile into one stack; drag takes one off the top.
    const stacks = {};
    for (const card of members) (stacks[card.defId] ||= []).push(card);
    for (const stack of Object.values(stacks)) {
      // the representative is the soonest-to-fade (its timer is the honest one)
      stack.sort((a, b) => ((a.decay ?? Infinity) - (b.decay ?? Infinity)) || a.uid - b.uid);
      const rep = stack[0];
      const el = cardEl(rep);
      if (stack.length > 1) {
        el.classList.add("stacked");
        const badge = document.createElement("div");
        badge.className = "card-count";
        badge.textContent = `×${stack.length}`;
        badge.title = `${stack.length} of these`;
        el.appendChild(badge);
      }
      if (verbOpen) {
        if (cardChangesOutcome(selectedVerbId, rep)) el.classList.add("useful");
        else el.classList.add("inert");
      }
      row.appendChild(el);
    }
    section.appendChild(row);
    tray.appendChild(section);
  }
}

// ---- grimoire --------------------------------------------------------------

function renderGrimoire() {
  const container = $("#grimoire-entries");
  container.innerHTML = "";
  if (grimoire.length === 0) {
    const p = document.createElement("p");
    p.className = "grimoire-empty";
    p.textContent = "Its pages are blank. Act, and they will not stay so.";
    container.appendChild(p);
    return;
  }
  const byVerb = {};
  for (const entry of grimoire) (byVerb[entry.verb] ||= []).push(entry);
  for (const [verbId, entries] of Object.entries(byVerb)) {
    const h = document.createElement("h3");
    h.appendChild(iconEl(VERB_DEFS[verbId].icon));
    h.appendChild(document.createTextNode(VERB_DEFS[verbId].name.toUpperCase()));
    container.appendChild(h);
    for (const entry of entries) {
      const div = document.createElement("div");
      div.className = "grimoire-entry";
      const name = document.createElement("strong");
      name.textContent = entry.name;
      const text = document.createElement("p");
      text.textContent = entry.text;
      div.appendChild(name);
      div.appendChild(text);
      const recipe = RECIPES.find((r) => r.id === entry.recipeId);
      if (recipe && Object.keys(recipe.requires).length > 0) {
        div.appendChild(aspectChips(recipe.requires));
      }
      container.appendChild(div);
    }
  }
}

// ---- the chronicle ---------------------------------------------------------

const CHRONICLE_KINDS = {
  deed: "deed", omen: "omen", dark: "dark", fade: "fade",
  grimoire: "grimoire", halt: "fade",
};

function renderChronicle() {
  const container = $("#chronicle-entries");
  container.innerHTML = "";
  const whisperText = state.ended ? null : currentWhisper();
  if (whisperText) {
    const whisper = document.createElement("div");
    whisper.className = "whisper";
    const label = document.createElement("h3");
    label.className = "whisper-label";
    label.textContent = "the ember whispers";
    const text = document.createElement("p");
    text.textContent = whisperText;
    whisper.appendChild(label);
    whisper.appendChild(text);
    container.appendChild(whisper);
  }
  if (!state.chronicle || state.chronicle.length === 0) {
    const p = document.createElement("p");
    p.className = "chronicle-empty";
    p.textContent = "Nothing yet. Act, and it will be witnessed.";
    container.appendChild(p);
    return;
  }
  for (const entry of state.chronicle) {
    const details = document.createElement("details");
    details.className = `chron-entry chron-${CHRONICLE_KINDS[entry.kind] || "deed"}`;
    const summary = document.createElement("summary");
    const title = document.createElement("span");
    title.className = "chron-title";
    title.textContent = entry.title + (entry.count > 1 ? ` ×${entry.count}` : "");
    summary.appendChild(title);
    if (entry.gains && entry.gains.length > 0) {
      const gains = document.createElement("span");
      gains.className = "chron-gains";
      for (const defId of entry.gains) {
        const def = CARD_DEFS[defId];
        if (!def) continue;
        const gain = iconEl(def.icon);
        gain.classList.add("chron-gain");
        gain.style.color = dominantAspectColor(def);
        const tip = def.name;
        gain.setAttribute("aria-label", tip);
        gains.appendChild(gain);
        gains.title = entry.gains.map((id) => CARD_DEFS[id]?.name).filter(Boolean).join(", ");
      }
      summary.appendChild(gains);
    }
    details.appendChild(summary);
    if (entry.body) {
      const body = document.createElement("p");
      body.className = "chron-body";
      body.textContent = entry.body;
      details.appendChild(body);
    }
    container.appendChild(details);
  }
}

// ---- toasts, pause banner, overlay -----------------------------------------

function showToast(message) {
  const { text, kind } = typeof message === "string" ? { text: message, kind: null } : message;
  const toasts = $("#toasts");
  const toast = document.createElement("div");
  toast.className = "toast" + (kind ? ` toast-${kind}` : "");
  toast.textContent = text;
  toasts.appendChild(toast);
  setTimeout(() => toast.classList.add("visible"), 20);
  setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => toast.remove(), 600);
  }, kind ? 9000 : 6000);
}

function buttonContent(btn, iconName, label) {
  btn.innerHTML = "";
  btn.appendChild(iconEl(iconName));
  if (label) btn.appendChild(document.createTextNode(label));
}

function renderPauseState() {
  $("#paused-banner").classList.toggle("hidden", !state.paused || !!state.ended);
  document.body.classList.toggle("is-paused", state.paused);
  buttonContent($("#btn-pause"), state.paused ? "play" : "pause", state.paused ? "Resume" : "Pause");
  buttonContent($("#btn-mute"), state.muted ? "bellOff" : "bell", "");
}

function showEnding(kind) {
  const ending = ENDINGS[kind];
  $("#overlay-title").textContent = ending.title;
  $("#overlay-text").textContent = ending.text;
  const btn = $("#overlay-btn");
  btn.textContent = ending.button;
  btn.onclick = () => {
    $("#overlay").classList.add("hidden");
    newRun();
    selectedVerbId = null;
    render();
  };
  $("#overlay").classList.remove("hidden");
}

// ---- prologue --------------------------------------------------------------

function showPrologue() {
  $("#prologue-title").textContent = PROLOGUE.title;
  const passages = $("#prologue-passages");
  passages.innerHTML = "";
  for (const passage of PROLOGUE.passages) {
    const p = document.createElement("p");
    p.textContent = passage;
    passages.appendChild(p);
  }
  const btn = $("#prologue-btn");
  btn.textContent = PROLOGUE.button;
  btn.onclick = () => {
    $("#prologue").classList.add("hidden");
    setPaused(false);
  };
  setPaused(true);
  $("#prologue").classList.remove("hidden");
}

// ---- master render ---------------------------------------------------------

function render() {
  renderVerbRow();
  renderVerbPanel();
  renderTray();
  renderChronicle();
  renderGrimoire();
  renderPauseState();
}

// Timers moved but nothing structural changed: update countdowns in place,
// leaving the DOM (and whatever the cursor is hovering) untouched.
function renderTick() {
  for (const [verbId, verb] of Object.entries(state.verbs)) {
    if (!verb.running) continue;
    const recipe = RECIPES.find((r) => r.id === verb.running.recipeId);
    const tile = document.querySelector(`.verb-tile[data-verb="${verbId}"]`);
    if (tile) {
      const status = tile.querySelector(".verb-status");
      if (status) status.textContent = `${recipe.name} — ${Math.ceil(verb.running.remaining)}s`;
      const fill = tile.querySelector(".verb-progress-fill");
      if (fill) fill.style.width = `${(1 - verb.running.remaining / verb.running.total) * 100}%`;
    }
    if (verbId === selectedVerbId) {
      const label = document.querySelector("#verb-panel .running-label");
      if (label) label.textContent = `${recipe.name} — ${Math.ceil(verb.running.remaining)}s remaining…`;
    }
  }
  for (const card of trayCards()) {
    if (card.decay === null) continue;
    const decay = document.querySelector(`.card[data-uid="${card.uid}"] .card-decay`);
    if (decay) {
      decay.textContent = `${Math.ceil(card.decay)}s`;
      decay.classList.toggle("urgent", card.decay < 30);
    }
  }
}
