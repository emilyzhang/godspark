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
  eventTimers: {},  // periodic eventId -> game-seconds of next firing
  chronicle: [],    // newest-first log of deeds, omens and fadings (capped)
  elapsed: 0,       // unpaused seconds this run
  paused: false,
  ended: null,      // null | "victory" | "despair" | "bargain"
  muted: false,
};

// grimoire lives outside `state`: it persists across runs.
let grimoire = []; // [{ recipeId, verb, name, text }]

// ---- listeners the UI hooks into -------------------------------------------

// "change" = structure changed, rebuild the view.
// "tick" = only timers moved; update countdowns in place (rebuilding every
// tick destroys the element under the cursor and makes hover states flicker).
// "completed" = an action finished and self-collected (idle flow).
const listeners = { change: [], tick: [], toast: [], autopause: [], ending: [], newrun: [], completed: [] };
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
  if (verb.running) return;
  const recipe = matchRecipe(verbId, slottedCards(verbId));
  if (!recipe) return;
  verb.lastWorking = { recipeId: recipe.id, defIds: slottedCards(verbId).map((c) => c.defId) };
  verb.running = { recipeId: recipe.id, remaining: recipe.duration, total: recipe.duration };
  emit("change");
}

// Gather the same kinds of cards and begin the same working again.
function attemptRestart(verbId, working) {
  const verb = verbState(verbId);
  const picked = [];
  for (const defId of working.defIds) {
    const card = trayCards().find((c) => c.defId === defId && !picked.includes(c));
    if (!card) return false;
    picked.push(card);
  }
  if (matchRecipe(verbId, picked)?.id !== working.recipeId) return false;
  picked.forEach((card, i) => { verb.slots[i] = card.uid; card.heldBy = verbId; });
  const recipe = RECIPES.find((r) => r.id === working.recipeId);
  verb.running = { recipeId: recipe.id, remaining: recipe.duration, total: recipe.duration };
  return true;
}

// Idle flow: an action that finishes collects itself — consumed cards go,
// returned cards come home, gains appear, and the deed enters the Chronicle.
// Time keeps flowing; only dark turns stop the world.
function finishVerb(verbId) {
  const verb = verbState(verbId);
  const recipe = RECIPES.find((r) => r.id === verb.running.recipeId);
  verb.running = null;

  const slotted = slottedCards(verbId);
  const slottedDefIds = slotted.map((c) => c.defId);

  // Decide which slotted cards are consumed. `consumes` counts CARDS
  // bearing an aspect; each card can satisfy only one consumption.
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
  verb.slots = verb.slots.map(() => null);
  for (const card of slotted) {
    if (!consumedUids.has(card.uid)) card.heldBy = null;
  }
  const produced = [...recipe.produces];
  if (recipe.randomProduces && recipe.randomProduces.length > 0) {
    produced.push(...recipe.randomProduces[Math.floor(Math.random() * recipe.randomProduces.length)]);
  }
  for (const defId of produced) spawnCard(defId);

  if (recipe.once) state.usedOnce[recipe.id] = true;
  state.counters[recipe.id] = (state.counters[recipe.id] || 0) + 1;
  if (recipe.unlocksVerb) {
    state.verbs[recipe.unlocksVerb].unlocked = true;
    emit("toast", `A new action is available: ${VERB_DEFS[recipe.unlocksVerb].name.toUpperCase()}.`);
  }
  recordInGrimoire(recipe);
  logChronicle({ kind: "deed", title: recipe.name, body: recipe.text, gains: produced });

  const wasRepeating = verb.repeat;
  checkMenaceFusion();
  checkEvents();
  checkEndings();
  if (wasRepeating && !state.ended) tryRepeat(verbId, recipe, slottedDefIds);

  emit("completed", verbId);
  emit("change");
  save();
}

// Repeat: gather the same kinds of cards again and begin the same working.
// Halts gracefully (and says so) when the cards for another round are gone.
function tryRepeat(verbId, recipe, defIds) {
  const verb = verbState(verbId);
  if (attemptRestart(verbId, { recipeId: recipe.id, defIds })) return;
  verb.repeat = false;
  logChronicle({
    kind: "halt",
    title: `${VERB_DEFS[verbId].name} rests`,
    body: `The cards for another round of “${recipe.name}” were not at hand.`,
    gains: [],
  });
}

// ---- attendants: devotees who keep a verb's vigil ---------------------------

function assignAttendant(verbId) {
  const verb = verbState(verbId);
  if (verb.attendantUid) return false;
  const card = trayCards().find((c) => (defOf(c).aspects.devotee || 0) > 0);
  if (!card) return false;
  verb.attendantUid = card.uid;
  card.heldBy = `tend:${verbId}`;
  logChronicle({
    kind: "omen",
    title: `A vigil begins`,
    body: `${defOf(card).name} takes up the ${VERB_DEFS[verbId].name} vigil: whenever the working can be begun again, it will be.`,
    gains: [],
  });
  emit("change");
  save();
  return true;
}

function dismissAttendant(verbId) {
  const verb = verbState(verbId);
  const card = cardByUid(verb.attendantUid);
  if (card) card.heldBy = null;
  verb.attendantUid = null;
  emit("change");
  save();
}

// Once a second, attendants glance at their idle verbs and, unlike the
// repeat toggle, simply wait when the cards are missing.
let attendantClock = 0;
function attendAllVigils(dt) {
  attendantClock += dt;
  if (attendantClock < 1) return false;
  attendantClock = 0;
  let started = false;
  for (const [verbId, verb] of Object.entries(state.verbs)) {
    if (!verb.attendantUid || verb.running || !verb.lastWorking) continue;
    if (!cardByUid(verb.attendantUid)) { verb.attendantUid = null; continue; }
    if (attemptRestart(verbId, verb.lastWorking)) started = true;
  }
  return started;
}

function logChronicle(entry) {
  // a loop's repeated deeds coalesce into one entry with a count,
  // so the chronicle reads as history rather than a metronome
  const head = state.chronicle[0];
  if (head && head.kind === entry.kind && head.title === entry.title) {
    head.count = (head.count || 1) + 1;
    head.at = Math.round(state.elapsed);
    return;
  }
  state.chronicle.unshift({ ...entry, at: Math.round(state.elapsed) });
  if (state.chronicle.length > 60) state.chronicle.length = 60;
}

// ---- grimoire --------------------------------------------------------------

function recordInGrimoire(recipe) {
  if (!recipe.grimoire) return;
  if (grimoire.some((e) => e.recipeId === recipe.id)) return;
  grimoire.push({ recipeId: recipe.id, verb: recipe.verb, name: recipe.name, text: recipe.grimoire });
  try { localStorage.setItem(GRIMOIRE_KEY, JSON.stringify(grimoire)); } catch (e) { /* storage unavailable */ }
  logChronicle({ kind: "grimoire", title: `Recorded: ${recipe.name}`, body: recipe.grimoire, gains: [] });
  emit("toast", `Recorded in your Grimoire: “${recipe.name}”.`);
}

// ---- events: the city acts on its own --------------------------------------

function eventConditionMet(ev) {
  const w = ev.when;
  // periodic events arm themselves on first sight, then fire on a jittered clock
  if (w.everySeconds != null) {
    const next = state.eventTimers[ev.id];
    if (next == null) {
      state.eventTimers[ev.id] = state.elapsed + w.everySeconds;
      return false;
    }
    if (state.elapsed < next) return false;
  }
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
  const spawned = [];
  if (fx.spawn) for (const defId of fx.spawn) { spawnCard(defId); spawned.push(defId); }
  if (fx.spawnOneOf && fx.spawnOneOf.length > 0) {
    const defId = fx.spawnOneOf[Math.floor(Math.random() * fx.spawnOneOf.length)];
    spawnCard(defId);
    spawned.push(defId);
  }
  if (ev.when.everySeconds != null) {
    // reschedule with jitter, so the city never becomes a metronome
    state.eventTimers[ev.id] = state.elapsed + ev.when.everySeconds * (0.7 + Math.random() * 0.6);
  }

  logChronicle({ kind: fx.kind || "omen", title: fx.title || "An omen", body: fx.toast || "", gains: spawned });
  if (fx.toast) emit("toast", { text: fx.toast, kind: fx.kind || "omen" });
  // Only dark turns stop the world; omens drift by in the Chronicle.
  if (fx.kind === "dark") {
    state.paused = true;
    emit("autopause", null);
  }
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

// ---- whispers: one gentle hint for the stuck --------------------------------

function currentWhisper() {
  const ctx = {
    has: (defId) => state.cards.some((c) => c.defId === defId),
    count: (defId) => trayCards().filter((c) => c.defId === defId).length,
    done: (recipeId) => (state.counters[recipeId] || 0) > 0 || !!state.usedOnce[recipeId],
    counter: (recipeId) => state.counters[recipeId] || 0,
    unlocked: (verbId) => !!state.verbs[verbId]?.unlocked,
    aspectTotal: (aspect) => aspectTotals(trayCards())[aspect] || 0,
  };
  const whisper = WHISPERS.find((w) => { try { return w.when(ctx); } catch (e) { return false; } });
  return whisper ? whisper.text : null;
}

// ---- menace & endings ------------------------------------------------------

function checkMenaceFusion() {
  let dreads = trayCards().filter((c) => c.defId === "dread");
  while (dreads.length >= DREAD_FUSE_COUNT) {
    dreads.slice(0, DREAD_FUSE_COUNT).forEach((c) => removeCard(c.uid));
    spawnCard("despair");
    const text = "Your dreads gather, and fuse, and go quiet. That is worse. DESPAIR settles in.";
    logChronicle({ kind: "dark", title: "Despair settles in", body: text, gains: ["despair"] });
    emit("toast", { text, kind: "dark" });
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
  let timersMoved = false;
  let structural = false;

  for (const [verbId, verb] of Object.entries(state.verbs)) {
    if (verb.running) {
      verb.running.remaining -= dt;
      timersMoved = true;
      if (verb.running.remaining <= 0) finishVerb(verbId); // emits its own change
    }
  }

  // Decay only bites cards sitting in the tray; slotted cards are safe.
  for (const card of [...state.cards]) {
    if (card.decay !== null && !card.heldBy) {
      card.decay -= dt;
      timersMoved = true;
      if (card.decay <= 0) {
        removeCard(card.uid);
        structural = true;
        const def = defOf(card);
        const expireText = def.expireText || `${def.name} is gone.`;
        const left = def.expireSpawn || [];
        for (const defId of left) spawnCard(defId);
        logChronicle({
          kind: left.length > 0 ? "dark" : "fade",
          title: left.length > 0 ? `${def.name} sours` : `${def.name} fades`,
          body: expireText,
          gains: left,
        });
        emit("toast", left.length > 0 ? { text: expireText, kind: "dark" } : expireText);
      }
    }
  }

  if (attendAllVigils(dt)) structural = true;
  checkEvents();
  if (structural) emit("change");
  else if (timersMoved && !batchAdvancing) emit("tick");
}

// Advance many steps at once: catch-up after browser throttling, or the
// city keeping its own hours while the page was closed. Dark turns and
// endings stop the clock mid-catch-up, exactly as they would have live.
let batchAdvancing = false;
function advance(seconds) {
  const capped = Math.min(seconds, 3600); // at most an hour passes unattended
  let steps = Math.floor(capped / (TICK_MS / 1000));
  batchAdvancing = steps > 50;
  while (steps-- > 0 && !state.paused && !state.ended) tick();
  batchAdvancing = false;
  emit("change");
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
    eventTimers: state.eventTimers,
    chronicle: state.chronicle,
    elapsed: state.elapsed,
    ended: state.ended,
    muted: state.muted,
    savedAt: Date.now(),
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
      repeat: false,
      attendantUid: null,
      lastWorking: null,
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
  state.eventTimers = {};
  state.chronicle = [];
  state.elapsed = 0;
  state.ended = null;
  state.paused = false;
  for (const defId of STARTING_CARDS) spawnCard(defId);
  save();
  emit("newrun");
  emit("change");
}

// Older saves may predate verbs, slot counts, or the idle flow; patch them up.
function migrate(snapshot) {
  for (const [id, def] of Object.entries(VERB_DEFS)) {
    if (!snapshot.verbs[id]) {
      snapshot.verbs[id] = {
        unlocked: def.unlockedAtStart, slots: new Array(def.slots).fill(null),
        running: null, repeat: false, attendantUid: null, lastWorking: null,
      };
    }
    const verb = snapshot.verbs[id];
    while (verb.slots.length < def.slots) verb.slots.push(null);
    verb.repeat ||= false;
    verb.attendantUid ||= null;
    verb.lastWorking ||= null;
  }
  snapshot.usedOnce ||= {};
  snapshot.counters ||= {};
  snapshot.eventsFired ||= {};
  snapshot.eventTimers ||= {};
  snapshot.chronicle ||= [];
  snapshot.elapsed ||= 0;
  return snapshot;
}

// Saves from before the idle flow may hold uncollected results; deliver them.
function collectLegacyResults() {
  for (const verb of Object.values(state.verbs)) {
    if (!verb.complete) continue;
    for (const uid of verb.complete.returnedUids || []) {
      const card = cardByUid(uid);
      if (card) card.heldBy = null;
    }
    for (const defId of verb.complete.producedDefIds || []) spawnCard(defId);
    delete verb.complete;
  }
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
    state.eventTimers = snapshot.eventTimers;
    state.chronicle = snapshot.chronicle;
    state.elapsed = snapshot.elapsed;
    state.ended = snapshot.ended || null;
    state.muted = snapshot.muted || false;
    collectLegacyResults();
    // The city kept its own hours while the page was closed (idle progress) —
    // but only if time was actually flowing when the player left.
    const away = snapshot.savedAt ? (Date.now() - snapshot.savedAt) / 1000 : 0;
    if (!state.ended && !snapshot.paused && away > 30) {
      const mins = Math.round(Math.min(away, 3600) / 60);
      logChronicle({
        kind: "omen",
        title: "While you were away",
        body: `The city kept its own hours: ${mins < 1 ? "a little while" : mins + (mins === 1 ? " minute" : " minutes")} passed without you.`,
        gains: [],
      });
      state.paused = false;
      advance(away);
    }
    state.paused = true; // load paused so returning players can look around
    if (state.ended) newRun(); // a finished run restarts fresh (grimoire kept)
  } catch (e) {
    newRun();
  }
  emit("change");
}
