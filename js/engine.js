// ============================================================
// GODSPARK — engine: game state, ticking, recipe matching,
// completion, events, menace fusion, endings, save/load.
// No DOM access here; ui.js observes state and renders it.
// ============================================================

const SAVE_KEY = "godspark-save-v1";
const GRIMOIRE_KEY = "godspark-grimoire-v1"; // survives restarts on purpose

const TICK_MS = 100;

const state = {
  cards: [],        // { uid, defId, decay (seconds left, or null), heldBy (verbId or null) }
  nextUid: 1,
  verbs: {},        // verbId -> { unlocked, slots: [uid|null, ...], running, complete }
                    // running:  { recipeId, remaining, total }
                    // complete: { recipeId, producedDefIds, returnedUids }
  usedOnce: {},     // recipeId -> true
  counters: {},     // recipeId -> completion count this run
  eventsFired: {},  // eventId -> true
  elapsed: 0,       // unpaused seconds this run
  paused: false,
  ended: null,      // null | "victory" | "despair" | "bargain"
  muted: false,
};

// grimoire lives outside `state`: it persists across runs.
let grimoire = []; // [{ recipeId, verb, name, text }]

// ---- listeners the UI hooks into -------------------------------------------

const listeners = { change: [], toast: [], autopause: [], ending: [], newrun: [] };
function on(event, fn) { listeners[event].push(fn); }
function emit(event, arg) { listeners[event].forEach((fn) => fn(arg)); }

// ---- helpers ---------------------------------------------------------------

function cardByUid(uid) {
  return state.cards.find((c) => c.uid === uid) || null;
}

function defOf(card) {
  return CARD_DEFS[card.defId];
}

function trayCards() {
  return state.cards.filter((c) => !c.heldBy);
}

function spawnCard(defId) {
  const def = CARD_DEFS[defId];
  const card = {
    uid: state.nextUid++,
    defId,
    decay: def.lifespan != null ? def.lifespan : null,
    heldBy: null,
  };
  state.cards.push(card);
  return card;
}

function removeCard(uid) {
  state.cards = state.cards.filter((c) => c.uid !== uid);
}

function aspectTotals(cards) {
  const totals = {};
  for (const card of cards) {
    for (const [aspect, n] of Object.entries(defOf(card).aspects)) {
      totals[aspect] = (totals[aspect] || 0) + n;
    }
  }
  return totals;
}

// ---- recipe matching -------------------------------------------------------

function matchRecipeForCards(verbId, cards) {
  const totals = aspectTotals(cards);
  const candidates = RECIPES
    .filter((r) => r.verb === verbId)
    .filter((r) => !(r.once && state.usedOnce[r.id]))
    .sort((a, b) => b.priority - a.priority);

  for (const recipe of candidates) {
    const meetsMin = Object.entries(recipe.requires)
      .every(([aspect, n]) => (totals[aspect] || 0) >= n);
    if (!meetsMin) continue;
    if (recipe.maxAspects) {
      const underMax = Object.entries(recipe.maxAspects)
        .every(([aspect, n]) => (totals[aspect] || 0) <= n);
      if (!underMax) continue;
    }
    return recipe;
  }
  return null;
}

function matchRecipe(verbId, cards) {
  return matchRecipeForCards(verbId, cards);
}

// ---- slotting --------------------------------------------------------------

function verbState(verbId) {
  return state.verbs[verbId];
}

function slotCard(verbId, slotIndex, uid) {
  const verb = verbState(verbId);
  if (verb.running || verb.complete) return false;
  const card = cardByUid(uid);
  if (!card || card.heldBy) return false;
  if (verb.slots[slotIndex] !== null) return false;
  verb.slots[slotIndex] = uid;
  card.heldBy = verbId;
  emit("change");
  return true;
}

function unslotCard(verbId, slotIndex) {
  const verb = verbState(verbId);
  if (verb.running || verb.complete) return;
  const uid = verb.slots[slotIndex];
  if (uid === null) return;
  verb.slots[slotIndex] = null;
  const card = cardByUid(uid);
  if (card) card.heldBy = null;
  emit("change");
}

function slottedCards(verbId) {
  return verbState(verbId).slots
    .filter((uid) => uid !== null)
    .map(cardByUid)
    .filter(Boolean);
}

function previewRecipe(verbId) {
  const verb = verbState(verbId);
  if (verb.running || verb.complete) return null;
  return matchRecipe(verbId, slottedCards(verbId));
}

// Would adding this tray card to the verb's current slots change the outcome?
// Powers the gold "this card matters here" glow in the tray.
function cardChangesOutcome(verbId, card) {
  const verb = verbState(verbId);
  if (verb.running || verb.complete) return false;
  if (!verb.slots.includes(null)) return false;
  const current = matchRecipe(verbId, slottedCards(verbId));
  const withCard = matchRecipe(verbId, [...slottedCards(verbId), card]);
  if (!withCard) return false;
  return !current || withCard.id !== current.id;
}

// ---- running verbs ---------------------------------------------------------

function startVerb(verbId) {
  const verb = verbState(verbId);
  if (verb.running || verb.complete) return;
  const recipe = matchRecipe(verbId, slottedCards(verbId));
  if (!recipe) return;
  verb.running = { recipeId: recipe.id, remaining: recipe.duration, total: recipe.duration };
  emit("change");
}

function finishVerb(verbId) {
  const verb = verbState(verbId);
  const recipe = RECIPES.find((r) => r.id === verb.running.recipeId);
  verb.running = null;

  // Decide which slotted cards are consumed. `consumes` counts CARDS
  // bearing an aspect; each card can satisfy only one consumption.
  const slotted = slottedCards(verbId);
  const consumedUids = new Set();
  for (const [aspect, count] of Object.entries(recipe.consumes)) {
    let needed = count;
    for (const card of slotted) {
      if (needed === 0) break;
      if (consumedUids.has(card.uid)) continue;
      if ((defOf(card).aspects[aspect] || 0) > 0) {
        consumedUids.add(card.uid);
        needed--;
      }
    }
  }
  for (const uid of consumedUids) removeCard(uid);

  const returnedUids = slotted.map((c) => c.uid).filter((uid) => !consumedUids.has(uid));

  verb.slots = verb.slots.map(() => null);
  verb.complete = { recipeId: recipe.id, producedDefIds: [...recipe.produces], returnedUids };

  if (recipe.once) state.usedOnce[recipe.id] = true;
  state.counters[recipe.id] = (state.counters[recipe.id] || 0) + 1;
  if (recipe.unlocksVerb) {
    state.verbs[recipe.unlocksVerb].unlocked = true;
    emit("toast", `A new action is available: ${VERB_DEFS[recipe.unlocksVerb].name.toUpperCase()}.`);
  }
  recordInGrimoire(recipe);

  // The heart of the anti-plate-spinning design: results are ready, so stop time.
  state.paused = true;
  emit("autopause", verbId);
  emit("change");
  save();
}

function collectVerb(verbId) {
  const verb = verbState(verbId);
  if (!verb.complete) return;
  const { producedDefIds, returnedUids } = verb.complete;

  for (const uid of returnedUids) {
    const card = cardByUid(uid);
    if (card) card.heldBy = null;
  }
  for (const defId of producedDefIds) spawnCard(defId);

  verb.complete = null;
  checkMenaceFusion();
  checkEvents();
  checkEndings();
  emit("change");
  save();
}

// ---- grimoire --------------------------------------------------------------

function recordInGrimoire(recipe) {
  if (!recipe.grimoire) return;
  if (grimoire.some((e) => e.recipeId === recipe.id)) return;
  grimoire.push({ recipeId: recipe.id, verb: recipe.verb, name: recipe.name, text: recipe.grimoire });
  try { localStorage.setItem(GRIMOIRE_KEY, JSON.stringify(grimoire)); } catch (e) { /* storage unavailable */ }
  emit("toast", `Recorded in your Grimoire: “${recipe.name}”.`);
}

// ---- events: the city acts on its own --------------------------------------

function eventConditionMet(ev) {
  const w = ev.when;
  if (w.minElapsed != null && state.elapsed < w.minElapsed) return false;
  if (w.usedOnce && !state.usedOnce[w.usedOnce]) return false;
  if (w.cardExists && !state.cards.some((c) => c.defId === w.cardExists)) return false;
  if (w.counterAtLeast && (state.counters[w.counterAtLeast.recipe] || 0) < w.counterAtLeast.n) return false;
  if (w.aspectAtLeast) {
    const totals = aspectTotals(trayCards());
    for (const [aspect, n] of Object.entries(w.aspectAtLeast)) {
      if ((totals[aspect] || 0) < n) return false;
    }
  }
  return true;
}

function fireEvent(ev) {
  state.eventsFired[ev.id] = true;
  const fx = ev.effects;

  if (fx.removeByAspect) {
    for (const [aspect, count] of Object.entries(fx.removeByAspect)) {
      let needed = count;
      for (const card of trayCards()) {
        if (needed === 0) break;
        if ((defOf(card).aspects[aspect] || 0) > 0) {
          removeCard(card.uid);
          needed--;
        }
      }
    }
  }
  if (fx.clearDef) {
    for (const card of trayCards().filter((c) => c.defId === fx.clearDef)) {
      removeCard(card.uid);
    }
  }
  if (fx.spawn) for (const defId of fx.spawn) spawnCard(defId);

  state.paused = true;
  if (fx.toast) emit("toast", { text: fx.toast, kind: fx.kind || "omen" });
  emit("autopause", null);
  emit("change");
  save();
}

function checkEvents() {
  if (state.ended) return;
  for (const ev of EVENTS) {
    if (state.eventsFired[ev.id] && !ev.repeatable) continue;
    if (eventConditionMet(ev)) fireEvent(ev);
  }
}

// ---- menace & endings ------------------------------------------------------

function checkMenaceFusion() {
  let dreads = trayCards().filter((c) => c.defId === "dread");
  while (dreads.length >= DREAD_FUSE_COUNT) {
    dreads.slice(0, DREAD_FUSE_COUNT).forEach((c) => removeCard(c.uid));
    spawnCard("despair");
    emit("toast", { text: "Your dreads gather, and fuse, and go quiet. That is worse. DESPAIR settles in.", kind: "dark" });
    state.paused = true;
    emit("autopause", null);
    dreads = trayCards().filter((c) => c.defId === "dread");
  }
}

function checkEndings() {
  if (state.ended) return;
  if (state.cards.some((c) => c.defId === "ash_rest")) {
    state.ended = "quenched";
    state.paused = true;
    emit("ending", "quenched");
  } else if (state.cards.some((c) => c.defId === "hollow_pact")) {
    state.ended = "bargain";
    state.paused = true;
    emit("ending", "bargain");
  } else if (state.cards.some((c) => c.defId === "spark3")) {
    state.ended = "victory";
    state.paused = true;
    emit("ending", "victory");
  } else if (state.cards.filter((c) => c.defId === "despair").length >= DESPAIR_LIMIT) {
    state.ended = "despair";
    state.paused = true;
    emit("ending", "despair");
  }
}

// ---- the clock -------------------------------------------------------------

function tick() {
  if (state.paused || state.ended) return;
  const dt = TICK_MS / 1000;
  state.elapsed += dt;
  let changed = false;

  for (const [verbId, verb] of Object.entries(state.verbs)) {
    if (verb.running) {
      verb.running.remaining -= dt;
      changed = true;
      if (verb.running.remaining <= 0) finishVerb(verbId);
    }
  }

  // Decay only bites cards sitting in the tray; slotted cards are safe.
  for (const card of [...state.cards]) {
    if (card.decay !== null && !card.heldBy) {
      card.decay -= dt;
      changed = true;
      if (card.decay <= 0) {
        removeCard(card.uid);
        const expireText = defOf(card).expireText || `${defOf(card).name} is gone.`;
        emit("toast", expireText);
      }
    }
  }

  checkEvents();
  if (changed) emit("change");
}

function setPaused(value) {
  state.paused = value;
  emit("change");
}

// ---- save / load / new run -------------------------------------------------

function save() {
  const snapshot = {
    cards: state.cards,
    nextUid: state.nextUid,
    verbs: state.verbs,
    usedOnce: state.usedOnce,
    counters: state.counters,
    eventsFired: state.eventsFired,
    elapsed: state.elapsed,
    ended: state.ended,
    muted: state.muted,
  };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot)); } catch (e) { /* storage unavailable */ }
}

function loadGrimoire() {
  try {
    const raw = localStorage.getItem(GRIMOIRE_KEY);
    if (raw) grimoire = JSON.parse(raw);
  } catch (e) { grimoire = []; }
}

function freshVerbs() {
  const verbs = {};
  for (const [id, def] of Object.entries(VERB_DEFS)) {
    verbs[id] = {
      unlocked: def.unlockedAtStart,
      slots: new Array(def.slots).fill(null),
      running: null,
      complete: null,
    };
  }
  return verbs;
}

function newRun() {
  state.cards = [];
  state.nextUid = 1;
  state.verbs = freshVerbs();
  state.usedOnce = {};
  state.counters = {};
  state.eventsFired = {};
  state.elapsed = 0;
  state.ended = null;
  state.paused = false;
  for (const defId of STARTING_CARDS) spawnCard(defId);
  save();
  emit("newrun");
  emit("change");
}

// Older saves may predate verbs or slot counts added since; patch them up.
function migrate(snapshot) {
  for (const [id, def] of Object.entries(VERB_DEFS)) {
    if (!snapshot.verbs[id]) {
      snapshot.verbs[id] = {
        unlocked: def.unlockedAtStart, slots: new Array(def.slots).fill(null),
        running: null, complete: null,
      };
    }
    const verb = snapshot.verbs[id];
    while (verb.slots.length < def.slots) verb.slots.push(null);
  }
  snapshot.usedOnce ||= {};
  snapshot.counters ||= {};
  snapshot.eventsFired ||= {};
  snapshot.elapsed ||= 0;
  return snapshot;
}

function load() {
  loadGrimoire();
  let raw = null;
  try { raw = localStorage.getItem(SAVE_KEY); } catch (e) { /* storage unavailable */ }
  if (!raw) { newRun(); return; }
  try {
    const snapshot = migrate(JSON.parse(raw));
    state.cards = snapshot.cards;
    state.nextUid = snapshot.nextUid;
    state.verbs = snapshot.verbs;
    state.usedOnce = snapshot.usedOnce;
    state.counters = snapshot.counters;
    state.eventsFired = snapshot.eventsFired;
    state.elapsed = snapshot.elapsed;
    state.ended = snapshot.ended || null;
    state.muted = snapshot.muted || false;
    state.paused = true; // load paused so returning players can look around
    if (state.ended) newRun(); // a finished run restarts fresh (grimoire kept)
  } catch (e) {
    newRun();
  }
  emit("change");
}
