// ============================================================
// GODSPARK — UI: rendering, drag & drop, panels, sound.
// Reads engine state, calls engine functions, never mutates state directly.
// ============================================================

let selectedVerbId = null;

const $ = (sel) => document.querySelector(sel);

// ---- tiny chime (Web Audio, no assets, no network) -------------------------

let audioCtx = null;
function chime() {
  if (state.muted) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;
    [523.25, 783.99].forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.08, now + i * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.6);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.7);
    });
  } catch (e) { /* audio unavailable; play on in silence */ }
}

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
    chip.textContent = `${info.icon} ${info.label}${n > 1 ? " " + n : ""}`;
    wrap.appendChild(chip);
  }
  return wrap;
}

function cardEl(card, { draggable = true } = {}) {
  const def = CARD_DEFS[card.defId];
  const el = document.createElement("div");
  el.className = "card";
  el.dataset.uid = card.uid;
  el.draggable = draggable;

  const icon = document.createElement("div");
  icon.className = "card-icon";
  icon.textContent = def.icon;

  const name = document.createElement("div");
  name.className = "card-name";
  name.textContent = def.name;

  el.appendChild(icon);
  el.appendChild(name);

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
    });
    el.addEventListener("dragend", () => el.classList.remove("dragging"));
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
    if (verbId === selectedVerbId) tile.classList.add("selected");
    if (verb.complete) tile.classList.add("complete");

    const icon = document.createElement("div");
    icon.className = "verb-icon";
    icon.textContent = def.icon;
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
    } else if (verb.complete) {
      status.textContent = "✦ finished — click to see";
    } else {
      status.textContent = "idle";
    }
    tile.appendChild(status);

    tile.addEventListener("click", () => {
      selectedVerbId = selectedVerbId === verbId && !verb.complete ? null : verbId;
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
  }

  slot.addEventListener("dragover", (e) => {
    if (verb.running || verb.complete || uid !== null) return;
    e.preventDefault();
    slot.classList.add("drop-ok");
  });
  slot.addEventListener("dragleave", () => slot.classList.remove("drop-ok"));
  slot.addEventListener("drop", (e) => {
    e.preventDefault();
    slot.classList.remove("drop-ok");
    const dropped = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (!Number.isNaN(dropped)) slotCard(verbId, slotIndex, dropped);
  });
  return slot;
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
  title.textContent = `${def.icon} ${def.name}`;
  const desc = document.createElement("p");
  desc.className = "verb-desc";
  desc.textContent = def.desc;
  head.appendChild(title);
  head.appendChild(desc);
  panel.appendChild(head);

  if (verb.complete) {
    const recipe = RECIPES.find((r) => r.id === verb.complete.recipeId);
    const result = document.createElement("div");
    result.className = "result-block";

    const rname = document.createElement("h4");
    rname.textContent = recipe.name;
    result.appendChild(rname);

    const rtext = document.createElement("p");
    rtext.className = "flavor";
    rtext.textContent = recipe.text;
    result.appendChild(rtext);

    if (verb.complete.producedDefIds.length > 0) {
      const gained = document.createElement("div");
      gained.className = "gained-row";
      for (const defId of verb.complete.producedDefIds) {
        const ghost = document.createElement("span");
        ghost.className = "gained-card";
        ghost.textContent = `${CARD_DEFS[defId].icon} ${CARD_DEFS[defId].name}`;
        gained.appendChild(ghost);
      }
      result.appendChild(gained);
    }

    const collect = document.createElement("button");
    collect.className = "primary";
    collect.textContent = "Collect";
    collect.addEventListener("click", () => {
      collectVerb(verbId);
      render();
    });
    result.appendChild(collect);
    panel.appendChild(result);
    return;
  }

  const slots = document.createElement("div");
  slots.className = "slot-row";
  for (let i = 0; i < 3; i++) slots.appendChild(slotEl(verbId, i));
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
  panel.appendChild(footer);
}

// ---- tray ------------------------------------------------------------------

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
  // stable, grouped display: sort by definition id then uid
  cards.sort((a, b) => a.defId.localeCompare(b.defId) || a.uid - b.uid);
  for (const card of cards) tray.appendChild(cardEl(card));
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
    h.textContent = `${VERB_DEFS[verbId].icon} ${VERB_DEFS[verbId].name.toUpperCase()}`;
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
      container.appendChild(div);
    }
  }
}

// ---- toasts, pause banner, overlay -----------------------------------------

function showToast(message) {
  const toasts = $("#toasts");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  toasts.appendChild(toast);
  setTimeout(() => toast.classList.add("visible"), 20);
  setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => toast.remove(), 600);
  }, 6000);
}

function renderPauseState() {
  $("#paused-banner").classList.toggle("hidden", !state.paused || !!state.ended);
  $("#btn-pause").textContent = state.paused ? "▶ Resume" : "⏸ Pause";
  $("#btn-mute").textContent = state.muted ? "🔕" : "🔔";
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

// ---- master render ---------------------------------------------------------

function render() {
  renderVerbRow();
  renderVerbPanel();
  renderTray();
  renderGrimoire();
  renderPauseState();
}
