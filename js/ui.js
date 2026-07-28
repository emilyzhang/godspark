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
    chip.textContent = `${info.icon} ${info.label}${n > 1 ? " " + n : ""}`;
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
    gem.textContent = info.icon + (n > 1 ? n : "");
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
  el.dataset.uid = card.uid;
  el.draggable = draggable;
  el.style.setProperty("--aspect-color", dominantAspectColor(def));

  const ribbon = document.createElement("div");
  ribbon.className = "card-ribbon";
  el.appendChild(ribbon);

  const icon = document.createElement("div");
  icon.className = "card-icon";
  icon.textContent = def.icon;

  const name = document.createElement("div");
  name.className = "card-name";
  name.textContent = def.name;

  el.appendChild(icon);
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
    slot.classList.add("open");
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
  label.textContent = "❦ workings you know";
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
  panel.appendChild(footer);

  const workings = knownWorkingsEl(verbId);
  if (workings) panel.appendChild(workings);
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

  // When a verb lies open and idle, light up the cards that would matter to it.
  const verbOpen = selectedVerbId !== null
    && !verbState(selectedVerbId).running
    && !verbState(selectedVerbId).complete;

  for (const card of cards) {
    const el = cardEl(card);
    if (verbOpen) {
      if (cardChangesOutcome(selectedVerbId, card)) el.classList.add("useful");
      else el.classList.add("inert");
    }
    tray.appendChild(el);
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
      const recipe = RECIPES.find((r) => r.id === entry.recipeId);
      if (recipe && Object.keys(recipe.requires).length > 0) {
        div.appendChild(aspectChips(recipe.requires));
      }
      container.appendChild(div);
    }
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
