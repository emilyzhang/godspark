// ============================================================
// GODSPARK — game content: aspects, cards, verbs, recipes.
// All data, no logic. Everything the player can discover is here.
// ============================================================

const ASPECTS = {
  flame:   { icon: "🜂", label: "Flame",   color: "#e2703a" },
  veil:    { icon: "☾",  label: "Veil",    color: "#8f7fd4" },
  lore:    { icon: "📖", label: "Lore",    color: "#b8a06a" },
  spark:   { icon: "✦",  label: "Spark",   color: "#ffcf5c" },
  story:   { icon: "🗝", label: "Story",   color: "#7fb7a3" },
  text:    { icon: "¶",  label: "Text",    color: "#a9a9a9" },
  funds:   { icon: "⛀",  label: "Funds",   color: "#c9b458" },
  vigor:   { icon: "♥",  label: "Vigour",  color: "#b5544e" },
  clarity: { icon: "◆",  label: "Clarity", color: "#6f9fc8" },
  fervor:  { icon: "♠",  label: "Fervour", color: "#c76fa0" },
  wonder:  { icon: "✧",  label: "Wonder",  color: "#e9d98a" },
  dread:   { icon: "●",  label: "Dread",   color: "#5c5470" },
  despair: { icon: "○",  label: "Despair", color: "#3a3644" },
  soul:    { icon: "☺",  label: "Soul",    color: "#cfa47f" },
};

// lifespan is in seconds of unpaused game time; cards with no lifespan endure.
const CARD_DEFS = {
  spark1: {
    name: "The Godspark", icon: "🔥",
    desc: "A coal of something that should not have died. It sleeps beneath your sternum, and it is warm.",
    aspects: { spark: 1 },
  },
  spark2: {
    name: "The Godspark, Woken", icon: "🔥",
    desc: "It turns in its sleep now, and dreams in your voice. Cities have burned for less.",
    aspects: { spark: 2 },
  },
  spark3: {
    name: "The Ember Crowned", icon: "👑",
    desc: "Not a god reborn. Something new, wearing the warmth of the old one. It knows your name, because it is your name.",
    aspects: { spark: 3 },
  },
  funds: {
    name: "Coin", icon: "⛀",
    desc: "It spends. It always spends.",
    aspects: { funds: 1 },
  },
  vigor: {
    name: "Vigour", icon: "♥",
    desc: "Your back is strong, for now.",
    aspects: { vigor: 1, soul: 1 },
  },
  clarity: {
    name: "Clarity", icon: "◆",
    desc: "A cold, well-lit room in the mind.",
    aspects: { clarity: 1, soul: 1 },
  },
  fervor: {
    name: "Fervour", icon: "♠",
    desc: "Something in you insists.",
    aspects: { fervor: 1, soul: 1 },
  },
  wonder: {
    name: "Wonder", icon: "✧",
    desc: "A bright impossible thing. It will not stay.",
    aspects: { wonder: 1 },
    lifespan: 180,
    expireText: "The wonder fades, as wonders do.",
  },
  dread: {
    name: "Dread", icon: "●",
    desc: "Something is behind the door of the world. You have begun to hear it breathing.",
    aspects: { dread: 1 },
  },
  despair: {
    name: "Despair", icon: "○",
    desc: "The lamps have gone out, one by one, and you cannot remember lighting them.",
    aspects: { despair: 1 },
  },
  pamphlet: {
    name: "A Creased Pamphlet", icon: "📜",
    desc: "'THE NEW DAWN CONGREGATION WELCOMES ALL.' Cheap ink — and under it, heat.",
    aspects: { text: 1 },
  },
  lore_flame1: {
    name: "Lore: A Spark of the First Flame", icon: "📕",
    desc: "Every fire remembers the first fire.",
    aspects: { lore: 1, flame: 1 },
  },
  lore_flame2: {
    name: "Lore: The Unquenched", icon: "📕",
    desc: "What burned, before there was anything to burn?",
    aspects: { lore: 1, flame: 2 },
  },
  lore_veil1: {
    name: "Lore: A Fold in the Veil", icon: "📘",
    desc: "The world has a lining, like a coat.",
    aspects: { lore: 1, veil: 1 },
  },
  lore_veil2: {
    name: "Lore: What Walks Behind", icon: "📘",
    desc: "It does not follow you. It precedes you, walking backwards, watching.",
    aspects: { lore: 1, veil: 2 },
  },
  whisper: {
    name: "A Whisper from the Ember", icon: "🗝",
    desc: "Not words. Not yet. But it wants, very much, to be words.",
    aspects: { story: 1 },
  },
  memory_garden: {
    name: "Memory: The Ash Garden", icon: "🗝",
    desc: "You stood where a god died. The roses were still warm.",
    aspects: { story: 1 },
  },
  dream_door: {
    name: "Dream of the Grey Door", icon: "🗝",
    desc: "A door with no house. It was ajar.",
    aspects: { story: 1 },
  },
  listener: {
    name: "A Listener", icon: "👤",
    desc: "They stayed after the others laughed and left.",
    aspects: { listener: 1 },
  },
  devotee: {
    name: "A Devotee", icon: "🕯",
    desc: "They would do things for you. Perhaps they already have.",
    aspects: { devotee: 1 },
  },
};

const VERB_DEFS = {
  work: {
    name: "Work", icon: "⚒",
    desc: "The world demands its portion.",
    unlockedAtStart: true,
  },
  study: {
    name: "Study", icon: "📖",
    desc: "Understanding is not free. But it is for sale.",
    unlockedAtStart: true,
  },
  dream: {
    name: "Dream", icon: "🌙",
    desc: "Every night, the door.",
    unlockedAtStart: true,
  },
  rite: {
    name: "Rite", icon: "🕯",
    desc: "Some words change the weather of the world.",
    unlockedAtStart: false,
  },
};

// ------------------------------------------------------------
// RECIPES
// Matching: highest `priority` recipe on the verb whose `requires`
// (summed aspect totals across slotted cards) are all met, and whose
// `maxAspects` (if any) are not exceeded, wins.
// `consumes` counts CARDS bearing an aspect (not aspect totals).
// `once: true` recipes fire a single time per run, then step aside.
// `grimoire` is the line recorded forever in the player's Grimoire.
// ------------------------------------------------------------

const RECIPES = [
  // ---------------- WORK ----------------
  {
    id: "work_default", verb: "work", priority: 0, duration: 20,
    name: "Odd Jobs",
    requires: {},
    consumes: {}, produces: ["funds"],
    text: "You haul, you sweep, you say 'yes sir' to men worth less than you. A coin, for your trouble.",
    grimoire: "Work, empty-handed, is still worth a coin.",
  },
  {
    id: "work_labor", verb: "work", priority: 2, duration: 15,
    name: "Honest Labour",
    requires: { vigor: 1 },
    consumes: {}, produces: ["funds", "funds"],
    text: "Sweat, splinters, and a small stack of coins. Your body remembers being only a body.",
    grimoire: "Vigour put to Work earns double.",
  },
  {
    id: "work_clerk", verb: "work", priority: 2, duration: 15,
    name: "Clerk for the Counting-House",
    requires: { clarity: 1 },
    consumes: {}, produces: ["funds", "funds", "funds"],
    text: "Columns of figures, obedient as soldiers. The counting-house pays well for a tidy mind.",
    grimoire: "Clarity put to Work earns triple.",
  },
  {
    id: "work_preach", verb: "work", priority: 3, duration: 15,
    name: "Preach on the Corner of Ash Street",
    requires: { fervor: 1 },
    consumes: { fervor: 1 }, produces: ["funds", "wonder"],
    text: "You don't remember deciding to speak. The words were just there, warm in your mouth. A few coins land in your hat.",
    grimoire: "Fervour, spent preaching, becomes coin and Wonder.",
  },
  {
    id: "work_preach_flame", verb: "work", priority: 4, duration: 15,
    name: "Preach What You Have Learned",
    requires: { fervor: 1, flame: 1 },
    consumes: { fervor: 1 }, produces: ["funds", "listener"],
    text: "This time the words have heat in them, and the crowd feels it. Most hurry on. One does not.",
    grimoire: "Preach with Flame-lore in hand, and someone will stay to listen.",
  },
  {
    id: "work_devotee", verb: "work", priority: 3, duration: 20,
    name: "The Faithful Provide",
    requires: { devotee: 1 },
    consumes: {}, produces: ["funds", "funds"],
    text: "You did not ask. That is the terrible thing. You did not have to ask.",
    grimoire: "A Devotee, sent to Work, provides.",
  },

  // ---------------- STUDY ----------------
  {
    id: "study_default", verb: "study", priority: 0, duration: 8,
    name: "Idle Contemplation",
    requires: {},
    consumes: {}, produces: [],
    text: "You shuffle your notes. Nothing new arranges itself.",
    grimoire: null,
  },
  {
    id: "study_text", verb: "study", priority: 3, duration: 12,
    name: "Read Closely",
    requires: { text: 1 },
    consumes: { text: 1 }, produces: ["lore_flame1", "wonder"],
    text: "Between the cheap lines, something burns. You copy it out. Your hand shakes only a little.",
    grimoire: "Study a Text to extract its lore.",
  },
  {
    id: "study_buy", verb: "study", priority: 2, duration: 12,
    name: "A Visit to the Pamphlet-Seller",
    requires: { funds: 2 },
    consumes: { funds: 2 }, produces: ["pamphlet"],
    text: "The pamphlet-seller on Lantern Row keeps the strange ones under the counter. He has more. He always has more.",
    grimoire: "Two Coins at Study buys another Text.",
  },
  {
    id: "study_flame_combine", verb: "study", priority: 5, duration: 15,
    name: "Combine What Burns",
    requires: { lore: 2, flame: 2 },
    consumes: { lore: 2 }, produces: ["lore_flame2"],
    text: "Two small truths, struck together. The spark that leaps between them is a larger truth, and it is hungry.",
    grimoire: "Two Flame-lores, studied together, refine into one greater.",
  },
  {
    id: "study_veil_combine", verb: "study", priority: 5, duration: 15,
    name: "Fold the Fold",
    requires: { lore: 2, veil: 2 },
    consumes: { lore: 2 }, produces: ["lore_veil2"],
    text: "You lay one secret over the other, and where they overlap, the world goes conveniently thin.",
    grimoire: "Two Veil-lores, studied together, refine into one greater.",
  },
  {
    id: "study_spark_first", verb: "study", priority: 6, duration: 15, once: true,
    name: "Examine the Thing You Carry",
    requires: { spark: 1 },
    consumes: {}, produces: ["whisper", "wonder", "dread"],
    unlocksVerb: "rite",
    text: "You sit very still and turn your attention inward, the way one looks at the sun through smoked glass. It notices. Something like a voice presses against the underside of your thoughts — and you understand, suddenly, how a RITE might be performed.",
    grimoire: "Studying the Spark woke it. This can only happen once. It unlocked the Rite.",
  },
  {
    id: "study_spark_again", verb: "study", priority: 4, duration: 10,
    name: "Consult the Ember",
    requires: { spark: 1 },
    consumes: {}, produces: ["wonder"],
    text: "The ember keeps its counsel now. But its warmth is a kind of answer.",
    grimoire: "The Spark, studied again, gives only Wonder.",
  },
  {
    id: "study_story", verb: "study", priority: 4, duration: 15,
    name: "Set It Down in Ink",
    requires: { story: 1 },
    consumes: { story: 1 }, produces: ["lore_veil1", "dread"],
    text: "You write it down and it resolves into words you rather wish you could unread. Still — it is knowledge now, and it is yours.",
    grimoire: "A Story, studied, yields Veil-lore — and a little Dread.",
  },
  {
    id: "study_wonder", verb: "study", priority: 1, duration: 10,
    name: "Pin the Moth",
    requires: { wonder: 1 },
    consumes: { wonder: 1 }, produces: ["clarity"],
    text: "You pin the wonder to the page like a moth. It is smaller now, and stiller, and it is yours: a fact.",
    grimoire: "Wonder, studied before it fades, becomes Clarity.",
  },

  // ---------------- DREAM ----------------
  {
    id: "dream_first", verb: "dream", priority: 1, duration: 12, once: true,
    name: "Sleep",
    requires: {},
    consumes: {}, produces: ["dream_door"],
    text: "Grey dreams of stairs, descending. And at the bottom of them — a door with no house.",
    grimoire: "The first dream brought the Grey Door.",
  },
  {
    id: "dream_default", verb: "dream", priority: 0, duration: 12,
    name: "Sleep",
    requires: {},
    consumes: {}, produces: [],
    text: "Grey dreams of stairs, descending. The door is there, as always. As always, you do not open it.",
    grimoire: null,
  },
  {
    id: "dream_spark_first", verb: "dream", priority: 6, duration: 15, once: true,
    name: "Carry the Ember Through the Door",
    requires: { spark: 1 },
    consumes: {}, produces: ["memory_garden", "lore_veil1", "wonder"],
    text: "With the ember warm in your chest, the Grey Door opens at a touch. Beyond it: a garden of ash, roses of cinder, and the enormous absence of someone recently gone. You know this place. It knew you first.",
    grimoire: "The Spark, carried into Dream, opened the Grey Door onto the Ash Garden.",
  },
  {
    id: "dream_spark_again", verb: "dream", priority: 4, duration: 12,
    name: "Return to the Ash Garden",
    requires: { spark: 1 },
    consumes: {}, produces: ["wonder"],
    text: "The garden again. The roses hold their shape until you breathe on them. You wake with your hands full of nothing bright.",
    grimoire: "The Ash Garden may be revisited for Wonder.",
  },
  {
    id: "dream_dread", verb: "dream", priority: 5, duration: 15,
    name: "Turn and Face It",
    requires: { dread: 1 },
    consumes: { dread: 1 }, produces: ["lore_veil1"],
    text: "In the dream you stop running. You turn. You look at it — and it is not a wall of teeth, it is a lesson. What frightens you, teaches you.",
    grimoire: "Dread, faced in Dream, becomes Veil-lore. What frightens you, teaches you.",
  },
  {
    id: "dream_despair", verb: "dream", priority: 6, duration: 20,
    name: "Light, Admitted",
    requires: { despair: 1, wonder: 1 },
    consumes: { despair: 1, wonder: 1 }, produces: ["clarity"],
    text: "You carry the bright impossible thing down the stairs, into the dark that has been growing there. The dark does not survive the introduction.",
    grimoire: "Despair, met in Dream with Wonder, dissolves into Clarity.",
  },
  {
    id: "dream_excess", verb: "dream", priority: 3, duration: 15,
    name: "A Night of Splendid Excess",
    requires: { funds: 2 },
    consumes: { funds: 2 }, produces: ["fervor", "wonder"],
    text: "Wine the colour of garnets, music, a stranger's laughter, the city's ten thousand lamps. You wake poorer and more alive.",
    grimoire: "Two Coins, spent on a splendid night, become Fervour and Wonder.",
  },

  // ---------------- RITE ----------------
  {
    id: "rite_default", verb: "rite", priority: 0, duration: 10,
    name: "Trace the Circle",
    requires: {},
    consumes: {}, produces: [],
    text: "You trace the circle and speak the words. Nothing attends. The candles burn politely, like guests at a dull party.",
    grimoire: null,
  },
  {
    id: "rite_listener", verb: "rite", priority: 3, duration: 15,
    name: "Speak of Fire",
    requires: { listener: 1, flame: 1 },
    consumes: { listener: 1 }, produces: ["devotee"],
    text: "You speak of the first fire, and what it remembers. They kneel. You did not ask them to kneel.",
    grimoire: "A Listener, shown Flame-lore at Rite, becomes a Devotee.",
  },
  {
    id: "rite_kindle", verb: "rite", priority: 6, duration: 25,
    name: "The Kindling Rite",
    requires: { spark: 1, flame: 2, fervor: 1 },
    maxAspects: { spark: 1 },
    consumes: { spark: 1, lore: 1, fervor: 1 }, produces: ["spark2"],
    text: "You feed it the refined flame, and your own insistence, and it WAKES — not with a roar but with a long, satisfied exhalation, like someone returning to a beloved house. The warmth under your sternum is no longer sleeping.",
    grimoire: "THE KINDLING RITE: the Spark, fed refined Flame-lore and Fervour, wakes.",
  },
  {
    id: "rite_crown", verb: "rite", priority: 7, duration: 30,
    name: "The Crowning of the Ember",
    requires: { spark: 2, veil: 2, wonder: 1 },
    consumes: { spark: 1, lore: 1, wonder: 1 }, produces: ["spark3"],
    text: "Behind the veil, where the other Powers cannot yet see, you set the woken ember in the socket of your heart and speak the coronation the dead god never finished. Somewhere above, something vast turns its head. Too late.",
    grimoire: "THE CROWNING: the woken Spark, veiled from watching Powers and fed Wonder, is crowned.",
  },
];

// Cards the player starts a run with.
const STARTING_CARDS = ["spark1", "vigor", "clarity", "fervor", "funds", "funds", "pamphlet"];

// Menace: this many Dread cards fuse into one Despair.
const DREAD_FUSE_COUNT = 3;
// This many Despair cards end the run.
const DESPAIR_LIMIT = 3;

const ENDINGS = {
  victory: {
    title: "THE EMBER CROWNED",
    text: "You are not a god. You are what comes after gods — something small and warm and self-made, wearing a crown of your own kindling. The city below lights its lamps, not knowing who it lights them for now. (This is the end of the prototype. Thank you for playing.)",
    button: "Begin a New Story",
  },
  despair: {
    title: "THE LONG DARK",
    text: "The lamps went out one by one, and one by one you forgot that you had ever lit them. The ember passes to other hands — but what you LEARNED does not. Your Grimoire remembers, even here.",
    button: "Begin Again, Remembering",
  },
};
