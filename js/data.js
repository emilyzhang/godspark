// ============================================================
// GODSPARK — game content: aspects, cards, verbs, recipes, events.
// All data, no logic. Everything the player can discover is here.
// ============================================================

const ASPECTS = {
  flame:      { icon: "flame", label: "Flame",      color: "#e2703a" },
  veil:       { icon: "crescent",  label: "Veil",       color: "#8f7fd4" },
  lore:       { icon: "book", label: "Lore",       color: "#b8a06a" },
  spark:      { icon: "spark4",  label: "Spark",      color: "#ffcf5c" },
  story:      { icon: "key", label: "Story",      color: "#7fb7a3" },
  text:       { icon: "lines",  label: "Text",       color: "#a9a9a9" },
  tome:       { icon: "tome",  label: "Tome",       color: "#c98a5a" },
  funds:      { icon: "coin",  label: "Funds",      color: "#c9b458" },
  vigor:      { icon: "heart",  label: "Vigour",     color: "#b5544e" },
  clarity:    { icon: "gem",  label: "Clarity",    color: "#6f9fc8" },
  fervor:     { icon: "emberheart",  label: "Fervour",    color: "#c76fa0" },
  wonder:     { icon: "sparkle",  label: "Wonder",     color: "#e9d98a" },
  dread:      { icon: "dread",  label: "Dread",      color: "#5c5470" },
  despair:    { icon: "ring",  label: "Despair",    color: "#3a3644" },
  soul:       { icon: "halo",  label: "Soul",       color: "#cfa47f" },
  suspicion:  { icon: "eye", label: "Suspicion",  color: "#8f9a6f" },
  listener:   { icon: "person", label: "Listener",   color: "#9a8fa8" },
  devotee:    { icon: "candle", label: "Devotee",    color: "#d4a75f" },
  widow:      { icon: "wiltedrose", label: "The Widow",  color: "#a06f8f" },
  hollows:    { icon: "hollowring",  label: "Hollows",    color: "#6f5a8f" },
  invitation: { icon: "envelope",  label: "Invitation", color: "#7a6f9a" },
  offer:      { icon: "asterism",  label: "Offer",      color: "#8a7a5a" },
  godmemory:  { icon: "blossom",  label: "God-Memory", color: "#d8a8b8" },
  blessing:   { icon: "leaf",  label: "Blessing",   color: "#a8c8a0" },
  inquisitor: { icon: "scales",  label: "Inquisitor", color: "#8f9a8f" },
  annotation: { icon: "quill",  label: "Annotation", color: "#a9a06f" },
  position:   { icon: "tome",  label: "Position",   color: "#7a8fa8" },
  ledger:     { icon: "lines", label: "Ledger",     color: "#c9b458" },
  market:     { icon: "asterism", label: "Market",  color: "#6fa8a0" },
  emissary:   { icon: "halo",  label: "Emissary",   color: "#e6d9a8" },
  craving:    { icon: "emberheart", label: "Craving", color: "#e2905a" },
  curio:      { icon: "asterism",   label: "Curio",   color: "#9ab0c8" },
};

const PROLOGUE = {
  title: "GODSPARK",
  passages: [
    "A god died in this city, nine nights ago. You know this because you were there when they buried what was left of him — a pauper's plot behind the gasworks, no stone, no song — and because, when the grave-lantern guttered, something small and warm crawled up out of the turned earth and into your open, astonished mouth.",
    "You swallowed. It was that, or drown in light.",
    "You are nobody in particular: a lodger, an odd-jobber, a reader of cheap pamphlets. But under your sternum something sleeps that was worshipped once, and this city is full of powers — grey-hatted, veiled, and hollow — who would open you like a letter to take it back.",
    "Work. Study. Dream. And be quiet about it.",
  ],
  button: "Light the Lamp",
};

// lifespan is in seconds of unpaused game time; cards with no lifespan endure.
const CARD_DEFS = {
  spark1: {
    name: "The Godspark", icon: "flame",
    desc: "A coal of something that should not have died. It sleeps beneath your sternum, and it is warm.",
    aspects: { spark: 1 },
  },
  spark2: {
    name: "The Godspark, Woken", icon: "flame",
    desc: "It turns in its sleep now, and dreams in your voice. Cities have burned for less.",
    aspects: { spark: 2 },
  },
  spark3: {
    name: "The Ember Crowned", icon: "crown",
    desc: "Not a god reborn. Something new, wearing the warmth of the old one. It knows your name, because it is your name.",
    aspects: { spark: 3 },
  },
  funds: {
    name: "Coin", icon: "coin",
    desc: "It spends. It always spends.",
    aspects: { funds: 1 },
  },
  vigor: {
    name: "Vigour", icon: "heart",
    desc: "Your back is strong, for now.",
    aspects: { vigor: 1, soul: 1 },
  },
  clarity: {
    name: "Clarity", icon: "gem",
    desc: "A cold, well-lit room in the mind.",
    aspects: { clarity: 1, soul: 1 },
  },
  fervor: {
    name: "Fervour", icon: "emberheart",
    desc: "Something in you insists.",
    aspects: { fervor: 1, soul: 1 },
  },
  wonder: {
    name: "Wonder", icon: "sparkle",
    desc: "A bright impossible thing. It will not stay.",
    aspects: { wonder: 1 },
    lifespan: 180,
    expireText: "The wonder fades, as wonders do.",
  },
  dread: {
    name: "Dread", icon: "dread",
    desc: "Something is behind the door of the world. You have begun to hear it breathing.",
    aspects: { dread: 1 },
    menace: true,
  },
  despair: {
    name: "Despair", icon: "ring",
    desc: "The lamps have gone out, one by one, and you cannot remember lighting them.",
    aspects: { despair: 1 },
    menace: true,
  },
  suspicion: {
    name: "Suspicion", icon: "eye",
    desc: "Someone repeated what you said on the corner. Someone else wrote it down.",
    aspects: { suspicion: 1 },
    menace: true,
    lifespan: 240,
    expireText: "The city forgets, eventually. It has so much to remember.",
  },
  pamphlet: {
    name: "A Creased Pamphlet", icon: "scroll",
    desc: "'THE NEW DAWN CONGREGATION WELCOMES ALL.' Cheap ink — and under it, heat.",
    aspects: { text: 1 },
  },
  kindled_heart: {
    name: "The Kindled Heart", icon: "tome",
    desc: "Bound in scorched leather. Banned in three principalities, burned in a fourth — which only proved its point.",
    aspects: { tome: 1 },
  },
  lore_flame1: {
    name: "Lore: A Spark of the First Flame", icon: "book",
    desc: "Every fire remembers the first fire.",
    aspects: { lore: 1, flame: 1 },
  },
  lore_flame2: {
    name: "Lore: The Unquenched", icon: "book",
    desc: "What burned, before there was anything to burn?",
    aspects: { lore: 1, flame: 2 },
  },
  lore_veil1: {
    name: "Lore: A Fold in the Veil", icon: "book",
    desc: "The world has a lining, like a coat.",
    aspects: { lore: 1, veil: 1 },
  },
  lore_veil2: {
    name: "Lore: What Walks Behind", icon: "book",
    desc: "It does not follow you. It precedes you, walking backwards, watching.",
    aspects: { lore: 1, veil: 2 },
  },
  whisper: {
    name: "A Whisper from the Ember", icon: "key",
    desc: "Not words. Not yet. But it wants, very much, to be words.",
    aspects: { story: 1 },
  },
  memory_garden: {
    name: "Memory: The Ash Garden", icon: "blossom",
    desc: "You stood where a god died. The roses were still warm.",
    aspects: { story: 1, godmemory: 1 },
  },
  memory_funeral: {
    name: "Memory: The Longest Funeral", icon: "blossom",
    desc: "Rain that fell upward. Mourners with too many shadows. And at the graveside, apart from all the rest, a woman who did not lift her veil.",
    aspects: { story: 1, godmemory: 1 },
  },
  memory_choir: {
    name: "Memory: The Quiet Choir", icon: "blossom",
    desc: "You saw their faces at last — His own brothers and sisters, singing Him closed with perfect harmony and dry eyes. They called it mercy. The Ember remembers it differently.",
    aspects: { story: 1, godmemory: 1 },
  },
  choir_hymn: {
    name: "A Hymn Above the Rooftops", icon: "note",
    desc: "Sung at dusk by nothing visible, in a harmony with too many voices. The city hears weather. You hear a question, patiently repeated: where is he. where is he. where is he.",
    aspects: { story: 1 },
  },
  widow_blessing: {
    name: "The Widow's Blessing", icon: "leaf",
    desc: "'If you must carry him, carry him gently. And if you can, little thief — let him sleep.' Her veil, a square of ash-grey lace, folded small into your hand.",
    aspects: { blessing: 1 },
  },
  ash_rest: {
    name: "The Garden, At Rest", icon: "rose",
    desc: "Grey roses, going green at the root.",
    aspects: {},
  },
  dream_door: {
    name: "Dream of the Grey Door", icon: "key",
    desc: "A door with no house. It was ajar.",
    aspects: { story: 1 },
  },
  listener: {
    name: "A Listener", icon: "person",
    desc: "They stayed after the others laughed and left.",
    aspects: { listener: 1 },
  },
  devotee: {
    name: "A Devotee", icon: "candle",
    desc: "They would do things for you. Perhaps they already have.",
    aspects: { devotee: 1 },
  },
  watcher: {
    name: "A Watcher in Grey", icon: "hat",
    desc: "He reads the same page of the same newspaper at the same corner, every day. The Ashen Order trains them not to blink. You could learn something from him — carefully.",
    aspects: { story: 1 },
  },
  widow_card: {
    name: "The Widow of Lantern Row", icon: "wiltedrose",
    desc: "Her mourning-veil is ash-grey, and she does not lift it. 'We attended the same funeral, I think, you and I. Mine was longer.'",
    aspects: { widow: 1 },
  },
  widow_warning: {
    name: "The Widow's Note", icon: "wiltedrose",
    desc: "Violet ink, unsigned: 'They felt that, you know. All of them felt it. Be quick now, or be quiet.'",
    aspects: { story: 1 },
  },
  hollow_invitation: {
    name: "A Name, Written Under the World", icon: "envelope",
    desc: "It was on the underside of the lore all along, the way an address is on the underside of an envelope. MOTHER OF HOLLOWS. To speak it aloud, bring what frightens you.",
    aspects: { invitation: 1 },
  },
  mother_hollows: {
    name: "The Mother of Hollows", icon: "hollowring",
    desc: "She is shaped like an absence where a queen should be. She is fond of you, the way you are fond of a meal that is not finished yet. She trades fairly. That is the trap.",
    aspects: { hollows: 1 },
  },
  hollow_pact: {
    name: "The Pact, Signed", icon: "nib",
    desc: "Your signature, in something warmer than ink.",
    aspects: {},
  },
  inquisitor_vellum: {
    name: "Inquisitor T. Vellum", icon: "scales",
    desc: "Of the Ashen Order. He has burned forty-one books and wept over nine of them, which is nine more than his superiors know. He takes his tea black, his heresies seriously, and his time.",
    aspects: { inquisitor: 1 },
  },
  vellum_secret: {
    name: "The Inquisitor's Annotations", icon: "quill",
    desc: "Marginalia from the one surviving copy of 'On the Warmth of the Word' — the commentary Vellum himself wrote, twenty years ago, before his own Order suppressed it. The handwriting in the margins is younger, and it is on fire with joy.",
    aspects: { story: 1, annotation: 1 },
  },
  vellum_ally: {
    name: "Vellum, Unmade and Remade", icon: "candle",
    desc: "He still wears the grey hat — it is useful — but the warrant he carries now is blank, and the reports he files are beautiful fictions. The Order's own veil, folded over you by the Order's own hand.",
    aspects: { devotee: 1, veil: 1 },
  },
  position_card: {
    name: "A Position at the Counting-House", icon: "tome",
    desc: "A high stool, a brass nameplate, a key to the side door. Respectability: the best veil of all.",
    aspects: { position: 1 },
  },
  ledger_card: {
    name: "Ledger 41", icon: "lines",
    desc: "It will not balance. It is out by exactly one, in a column that has no name, and the error repeats every seventh page like a heartbeat.",
    aspects: { ledger: 1 },
  },
  market_card: {
    name: "The Grey Market", icon: "asterism",
    desc: "It convenes behind sleep, under the stairs, behind the rain: stalls of smoke, lamplight sold by the yard, and a fair price for anything you'd rather not keep.",
    aspects: { market: 1 },
  },
  emissary_card: {
    name: "An Emissary of the Quiet Choir", icon: "halo",
    desc: "It wears a borrowed face, neatly. When it speaks you hear a chord, and the chord means: give him back, little door, and be forgiven.",
    aspects: { emissary: 1 },
  },
  craving_story: {
    name: "The Ember Craves a Story", icon: "emberheart",
    desc: "A pang beneath the sternum. It was worshipped in stories once; it misses being told. Bring it one at the Rite, before the wanting sours.",
    aspects: { craving: 1, c_story: 1 },
    lifespan: 180,
    expireText: "The wanting sours, unanswered. Something in you goes hungrier.",
    expireSpawn: ["dread"],
  },
  craving_wonder: {
    name: "The Ember Craves Brightness", icon: "emberheart",
    desc: "It remembers being the brightest thing in every room of the world. Bring it something that shines, at the Rite, before envy curdles.",
    aspects: { craving: 1, c_wonder: 1 },
    lifespan: 180,
    expireText: "The wanting sours, unanswered. Something in you goes hungrier.",
    expireSpawn: ["dread"],
  },
  craving_dread: {
    name: "The Ember Craves What Frightens You", icon: "emberheart",
    desc: "Gods ate fear before they ate anything else. Old appetites survive the grave. Bring it yours, at the Rite — you weren't using it well anyway.",
    aspects: { craving: 1, c_dread: 1 },
    lifespan: 180,
    expireText: "The wanting sours, unanswered. Something in you goes hungrier.",
    expireSpawn: ["dread"],
  },
  curio_locket: {
    name: "A Tarnished Locket", icon: "heart",
    desc: "Shut fast. Warm, though. Lockets keep what faces forget.",
    aspects: { curio: 1 },
  },
  curio_button: {
    name: "A Sea-Glass Button", icon: "gem",
    desc: "Smoothed by forty years of tide. It remembers a coat that drowned.",
    aspects: { curio: 1 },
  },
  curio_key: {
    name: "A Left-Handed Key", icon: "key",
    desc: "Cut mirror-wise. Somewhere in this city there is a left-handed door.",
    aspects: { curio: 1 },
  },
  curio_eye: {
    name: "A Doll's Porcelain Eye", icon: "eye",
    desc: "It watches nothing now, very attentively.",
    aspects: { curio: 1 },
  },
  curio_die: {
    name: "A Bone Die With Seven Faces", icon: "gem",
    desc: "You have counted its faces four times. You get a different number each time.",
    aspects: { curio: 1 },
  },
  floorboard_offer: {
    name: "A Murmur at the Counter", icon: "asterism",
    desc: "The pamphlet-seller glances at the floor by the till, then at you, then at the floor again. 'For a regular customer,' he says, 'there is also the other stock.'",
    aspects: { offer: 1 },
  },
};

const VERB_DEFS = {
  work: {
    name: "Work", icon: "hammer",
    desc: "The world demands its portion.",
    unlockedAtStart: true, slots: 3,
  },
  study: {
    name: "Study", icon: "book",
    desc: "Understanding is not free. But it is for sale.",
    unlockedAtStart: true, slots: 3,
  },
  dream: {
    name: "Dream", icon: "crescent",
    desc: "Every night, the door.",
    unlockedAtStart: true, slots: 3,
  },
  rite: {
    name: "Rite", icon: "candle",
    desc: "Some words change the weather of the world.",
    unlockedAtStart: false, slots: 4,
  },
};

// ------------------------------------------------------------
// RECIPES
// Matching: highest `priority` recipe on the verb whose `requires`
// (summed aspect totals across slotted cards) are all met, and whose
// `maxAspects` (if any) are not exceeded, wins.
// `consumes` counts CARDS bearing an aspect (not aspect totals),
// and consumes up to that many of the slotted cards.
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
    consumes: { fervor: 1 }, produces: ["funds", "listener", "suspicion"],
    text: "This time the words have heat in them, and the crowd feels it. Most hurry on. One does not. And somewhere at the back, a grey hat turns your way.",
    grimoire: "Preach with Flame-lore in hand, and someone will stay to listen. Someone else will take notes.",
  },
  {
    id: "work_spark", verb: "work", priority: 5, duration: 15,
    name: "The Work of Warm Hands",
    requires: { spark: 1 },
    consumes: {}, produces: ["funds", "funds", "wonder"],
    text: "You take the ember to work the way other men take a flask. Everything you mend today mends better than it should — hinges stop complaining, kettles remember how to sing. Your handiwork hums, faintly, afterward. Customers pay double and could not tell you why.",
    grimoire: "The Spark, carried to Work, makes warm hands: double coin and Wonder.",
  },
  {
    id: "work_errands", verb: "work", priority: 5, duration: 18,
    name: "Discreet Errands",
    requires: { veil: 1 },
    consumes: {}, produces: ["funds", "funds", "funds", "dread"],
    text: "The city's veiled folk pay handsomely for a courier who knows what not to know. You carry unmarked parcels along unmarked routes. You don't look in the parcels. All night you have the feeling the parcels are looking in you.",
    grimoire: "Veil-lore at Work opens Discreet Errands: triple coin, and a little Dread.",
  },
  {
    id: "work_position", verb: "work", priority: 6, duration: 15,
    name: "A Day at the High Stool",
    requires: { position: 1 },
    consumes: {}, produces: ["funds", "funds", "funds"],
    text: "Columns, carried ones, the small civic music of arithmetic. From the high stool you can see the whole floor, and the whole floor can see that you belong. It is almost peace. It pays like peace never does.",
    grimoire: "A Position at the Counting-House: steady triple coin, no questions asked. Yet.",
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
    id: "study_floorboards", verb: "study", priority: 6, duration: 15,
    name: "The Other Stock",
    requires: { offer: 1, funds: 2 },
    consumes: { offer: 1, funds: 2 }, produces: ["kindled_heart"],
    text: "He locks the shop door first. Under the floorboards, wrapped in oilcloth against the damp: a book that seems faintly, pleasantly warm, like a loaf. 'You didn't buy this here. This shop doesn't exist. Good day.'",
    grimoire: "The pamphlet-seller's OTHER stock: two Coins, and the Offer, for a true Tome.",
  },
  {
    id: "study_tome", verb: "study", priority: 5, duration: 18,
    name: "Read What Was Buried",
    requires: { tome: 1 },
    consumes: { tome: 1 }, produces: ["lore_flame2", "wonder", "suspicion"],
    text: "It is everything the pamphlets were trying to misremember. You read it in one sitting, curtains drawn — but a lit window at three in the morning is its own kind of confession.",
    grimoire: "A true Tome yields refined Flame-lore at a single stroke — and lit windows are noticed.",
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
    id: "study_ledger", verb: "study", priority: 5, duration: 18,
    name: "Audit the Impossible",
    requires: { ledger: 1 },
    consumes: { ledger: 1 }, produces: ["funds", "funds", "lore_veil1", "suspicion"],
    text: "You audit Ledger 41 by candlelight, and the truth arrives like cold water: the Counting-House does not count money. Money is merely the notation. What is truly carried, column to column, page to page, is something older and softer, and the missing figure in the nameless column is a soul. You copy the true arithmetic, pocket the discrepancy, and close the book very, very quietly.",
    grimoire: "Ledger 41, audited at Study: coin, Veil-lore — and the Counting-House's attention.",
  },
  {
    id: "study_emissary", verb: "study", priority: 5, duration: 15, once: true,
    name: "Regard the Borrowed Face",
    requires: { emissary: 1 },
    consumes: {}, produces: ["wonder", "dread"],
    text: "You study it as it studies you. The face it wears belonged to someone; the patience it wears belonged to no one, ever — patience like that has to be older than faces. Its offer is never spoken aloud, which is how you know the terms are real: surrender the ember, and be forgiven so thoroughly you will forget there was ever anything to forgive.",
    grimoire: "The Emissary's offer, understood at Study: forgiveness, in exchange for everything.",
  },
  {
    id: "study_vellum", verb: "study", priority: 5, duration: 15, once: true,
    name: "Research the Researcher",
    requires: { inquisitor: 1 },
    consumes: {}, produces: ["vellum_secret", "wonder"],
    text: "The newspaper morgue remembers what the Order would prefer forgotten: twenty years ago, one T. Vellum published a commentary called 'On the Warmth of the Word.' His own Order burned the print run. He lit the fire himself, they say — and wept, they don't say, but the one surviving copy has marginalia, and you have found it, and the margins are weeping still.",
    grimoire: "Inquisitor Vellum wrote a burned book once. His Annotations survive — and can be found at Study.",
  },
  {
    id: "study_vellum_again", verb: "study", priority: 4, duration: 10,
    name: "Consider the Inquisitor",
    requires: { inquisitor: 1 },
    consumes: {}, produces: [],
    text: "You watch him a while from the window. He is exactly what he appears to be. That is the most frightening thing about him, and also — you begin to suspect — the saddest.",
    grimoire: null,
  },
  {
    id: "study_curio", verb: "study", priority: 3, duration: 12,
    name: "Appraise the Trinket",
    requires: { curio: 1 },
    consumes: { curio: 1 }, produces: [],
    randomProduces: [
      ["funds", "funds"], ["wonder"], ["lore_veil1"], ["lore_flame1"],
      ["pamphlet"], ["funds", "funds", "funds", "dread"],
    ],
    text: "Under a strong lamp and a stronger suspicion, the trinket gives up its small secret. The city does not explain itself. It only pays — in whatever it happens to be carrying.",
    grimoire: "Curios yield what they yield: coin, lore, wonder — or a fright with interest. The seven-faced die decides.",
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
    randomProduces: [[], [], [], ["wonder"]],
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
    id: "dream_clarity", verb: "dream", priority: 2, duration: 12,
    name: "Lucid",
    requires: { clarity: 1 },
    consumes: {}, produces: ["wonder"],
    text: "Tonight you remember, mid-dream, that you are dreaming — and the dream, caught pretending, holds still. You fold it like paper into a bird. It is still flying somewhere behind your eyes when you wake.",
    grimoire: "Clarity carried into Dream makes it Lucid: Wonder, on demand.",
  },
  {
    id: "dream_fervor", verb: "dream", priority: 2, duration: 15,
    name: "A Dream of Burning",
    requires: { fervor: 1 },
    consumes: { fervor: 1 }, produces: ["lore_flame1"],
    text: "You dream you are the pamphlet, and someone is reading you by firelight, and the fire leans closer to see. You wake with scorched margins on your thoughts and one true thing written in them.",
    grimoire: "Fervour, spent in Dream, burns down to Flame-lore.",
  },
  {
    id: "dream_market_find", verb: "dream", priority: 4, duration: 18, once: true,
    name: "Follow the Rolling Coin",
    requires: { veil: 1, funds: 1 },
    consumes: { funds: 1 }, produces: ["market_card", "wonder"],
    text: "Every city keeps a second economy for what can't be sold by daylight. You follow a coin rolling downhill through your sleep — under the stairs, behind the rain — and there it convenes: the Grey Market. Stalls of smoke. Lamplight by the yard. A proprietor with too many hands makes room for you without being asked.",
    grimoire: "Veil-lore and a Coin, followed into Dream, found the GREY MARKET. It remembers its customers.",
  },
  {
    id: "dream_market_dread", verb: "dream", priority: 6, duration: 15,
    name: "Sell What Frightens You",
    requires: { market: 1, dread: 1 },
    consumes: { dread: 1 }, produces: ["funds", "funds"],
    text: "They buy fear here. Everyone needs a little — watchmen, poets, the recently bereaved — and yours, says the proprietor, weighing it with two of his hands, is of excellent vintage. He pays in coin that is cold for a day.",
    grimoire: "The Grey Market buys Dread: two coins, no questions.",
  },
  {
    id: "dream_market_wonder", verb: "dream", priority: 5, duration: 15,
    name: "Spend the Bright Coin",
    requires: { market: 1, wonder: 1 },
    consumes: { wonder: 1 }, produces: ["lore_veil1"],
    text: "Wonder is currency here — the only one that doesn't clip, tarnish, or lie. You spend yours at a stall that sells folded darkness, and come away knowing one more thing the daylight doesn't.",
    grimoire: "The Grey Market changes Wonder into Veil-lore.",
  },
  {
    id: "dream_market_funds", verb: "dream", priority: 5, duration: 15,
    name: "An Hour of Someone Else's Rest",
    requires: { market: 1, funds: 2 },
    consumes: { funds: 2 }, produces: ["vigor"],
    text: "Sleep can be bottled, it turns out, though never one's own. You buy an hour of somebody's Sunday afternoon — sun through a window, a dog asleep against their leg — and drink it. You wake stronger, carrying a borrowed peace, and briefly miss a dog you never owned.",
    grimoire: "Two coins at the Grey Market buys bottled rest: Vigour.",
  },
  {
    id: "dream_excess", verb: "dream", priority: 3, duration: 15,
    name: "A Night of Splendid Excess",
    requires: { funds: 2 },
    consumes: { funds: 2 }, produces: ["fervor", "wonder"],
    text: "Wine the colour of garnets, music, a stranger's laughter, the city's ten thousand lamps. You wake poorer and more alive.",
    grimoire: "Two Coins, spent on a splendid night, become Fervour and Wonder.",
  },
  {
    id: "dream_widow_funds", verb: "dream", priority: 5, duration: 15,
    name: "Tea With the Widow",
    requires: { widow: 1, funds: 2 },
    consumes: { funds: 2 }, produces: ["lore_veil1"],
    text: "Her parlour exists only while you are asleep, which does wonders for the rent. She sells what she remembers, and she remembers what the veil is for. The tea is grey, and excellent.",
    grimoire: "The Widow, visited in Dream with two Coins, sells Veil-lore.",
  },
  {
    id: "dream_widow_reveal", verb: "dream", priority: 6, duration: 20, once: true,
    name: "Show Her What the Garden Gave You",
    requires: { widow: 1, godmemory: 1 },
    consumes: { godmemory: 1 }, produces: ["widow_blessing", "lore_veil1"],
    text: "You lay the memory on her tea-table, between the grey cups. For a long moment she is entirely still. Then she lifts her veil — and you understand, finally, whose funeral was longer than yours. 'You have been carrying my husband,' says the Widow of Lantern Row, 'in your chest, like a stolen watch.' She does not take him back. She gives you something instead.",
    grimoire: "The Widow buried the Unmade God. Shown one of His memories in Dream, she gives her BLESSING.",
  },
  {
    id: "dream_quench", verb: "dream", priority: 7, duration: 30,
    name: "The Quenching",
    requires: { spark: 2, blessing: 1 },
    consumes: { spark: 1, blessing: 1 }, produces: ["ash_rest"],
    text: "You carry the woken ember down the stairs, through the door, into the garden — and she walks with you, veil lifted, naming every rose. You kneel where the absence is deepest and open your chest like a lantern. He goes out the way a long day does: slowly, warmly, without regret. The last thing the warmth says, in your own voice: thank you for carrying me home.",
    grimoire: "THE QUENCHING: the woken Spark, carried into Dream with the Widow's Blessing, may be laid to rest.",
  },
  {
    id: "dream_widow_story", verb: "dream", priority: 5, duration: 18,
    name: "A Memory for a Memory",
    requires: { widow: 1, story: 1 },
    consumes: { story: 1 }, produces: ["lore_veil2", "wonder"],
    text: "'Stories are the only coin that doesn't clip,' she says, and lifts her veil just enough to take yours. What she gives you in exchange is older, and colder, and true. You will miss the memory you paid. You will not remember why.",
    grimoire: "The Widow trades deep Veil-lore for a Story. The rate is fair. The rate is the trap.",
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
    id: "rite_feed_story", verb: "rite", priority: 5, duration: 12,
    name: "Tell It a Story",
    requires: { c_story: 1, story: 1 },
    consumes: { craving: 1, story: 1 }, produces: ["lore_veil1", "wonder"],
    text: "You tell it the story, down the stairs of yourself, the old way: aloud, alone, with the candles listening. It is quiet for a long while after. Then it dreams the story back to you — richer, and stranger, and true in a way it wasn't before.",
    grimoire: "A craved Story, fed at Rite, is dreamed back richer: Veil-lore and Wonder.",
  },
  {
    id: "rite_feed_wonder", verb: "rite", priority: 5, duration: 12,
    name: "Bring It Something That Shines",
    requires: { c_wonder: 1, wonder: 1 },
    consumes: { craving: 1, wonder: 1 }, produces: ["clarity", "fervor"],
    text: "You hold the bright impossible thing over your own sternum and let go. The warmth takes it the way a hearth takes a dry log — a flare, a settling — and for a while your mind is lit like a reading-room and your blood insists on something splendid.",
    grimoire: "Craved brightness, fed as Wonder at Rite, returns as Clarity and Fervour.",
  },
  {
    id: "rite_feed_dread", verb: "rite", priority: 5, duration: 12,
    name: "Feed It What Frightens You",
    requires: { c_dread: 1, dread: 1 },
    consumes: { craving: 1, dread: 1 }, produces: ["wonder", "funds"],
    text: "You bring your fear to the circle like a live thing in a sack, and the warmth eats it, and purrs like a hearth. You sleep better than you have in weeks. In the morning there is coin on the table you do not remember earning. You decide not to ask.",
    grimoire: "Craved fear, fed as Dread at Rite, becomes Wonder — and unexplained coin.",
  },
  {
    id: "rite_veiling", verb: "rite", priority: 3, duration: 12,
    name: "The Veiling",
    requires: { veil: 1, suspicion: 1 },
    consumes: { suspicion: 3 }, produces: [],
    text: "You fold the district's attention the way the Widow folds her veil. For a while, eyes slide off your door like rain off glass. The grey hats read their newspapers and remember nothing.",
    grimoire: "THE VEILING: Veil-lore at Rite folds away Suspicion — up to three eyes at once.",
  },
  {
    id: "rite_vellum_convert", verb: "rite", priority: 6, duration: 25, once: true,
    name: "Return His Words to Him",
    requires: { inquisitor: 1, annotation: 1, flame: 1 },
    consumes: { inquisitor: 1, annotation: 1 }, produces: ["vellum_ally", "wonder"],
    text: "You invite him in — it is that, or the Knock — and across the circle you lay his own marginalia, with the true fire burning beside them. He reads for a long time. The candles are very patient. Then Inquisitor Vellum takes off his grey hat, feeds his warrant to the flame, and asks, in the voice of a man who has not asked anything in twenty years: 'Does it remember me too?'",
    grimoire: "Even an Inquisitor may be converted: show Vellum his own Annotations at Rite, with Flame-lore burning.",
  },
  {
    id: "rite_emissary_refuse", verb: "rite", priority: 5, duration: 20, once: true,
    name: "Refuse It in Fire",
    requires: { emissary: 1, flame: 1 },
    consumes: { emissary: 1 }, produces: ["lore_flame2", "wonder", "dread"],
    text: "You invite it into the circle, politely, and then you show it the warmth it renounced when it sang with the others. For one broken measure the borrowed face remembers being a face. Then it is gone — but the chord it makes on leaving cracks every pane of glass in the room, and what it leaves seared into the floorboards is lore no book carries: what the fire was FOR.",
    grimoire: "The Emissary, refused in Fire at Rite, leaves deep Flame-lore behind — and a grudge.",
  },
  {
    id: "rite_kindle", verb: "rite", priority: 6, duration: 25,
    name: "The Kindling Rite",
    requires: { spark: 1, flame: 2, fervor: 1 },
    maxAspects: { spark: 1 },
    consumes: { spark: 1, lore: 1, fervor: 1 }, produces: ["spark2", "suspicion"],
    text: "You feed it the refined flame, and your own insistence, and it WAKES — not with a roar but with a long, satisfied exhalation, like someone returning to a beloved house. The warmth under your sternum is no longer sleeping. The neighbours heard the chanting.",
    grimoire: "THE KINDLING RITE: the Spark, fed refined Flame-lore and Fervour, wakes. Loudly.",
  },
  {
    id: "rite_hollow", verb: "rite", priority: 5, duration: 20,
    name: "Speak the Name Under the World",
    requires: { invitation: 1, dread: 1 },
    consumes: { invitation: 1, dread: 1 }, produces: ["mother_hollows", "wonder", "dread"],
    text: "You bring what frightens you, as instructed, and speak the name downward, into the floor. The candle-flames bend the wrong way. Where the circle's centre was, there is now a patient, queenly absence. 'Little ember-bearer,' she says. 'Let us do business.'",
    grimoire: "The Name Under the World, spoken at Rite with Dread in hand, summons the MOTHER OF HOLLOWS.",
  },
  {
    id: "rite_mother_story", verb: "rite", priority: 4, duration: 15,
    name: "Feed Her a Memory",
    requires: { hollows: 1, story: 1 },
    consumes: { story: 1 }, produces: ["funds", "funds", "funds", "dread"],
    text: "She eats the memory delicately, the way a duchess eats a quail. She pays in coin found in drowned men's pockets. It spends like any other. That is the worst thing about it.",
    grimoire: "The Mother of Hollows buys Stories: three Coins each, and a little more Dread.",
  },
  {
    id: "rite_mother_clarity", verb: "rite", priority: 4, duration: 15,
    name: "Sell Her the Cold Room",
    requires: { hollows: 1, clarity: 1 },
    consumes: { clarity: 1 }, produces: ["fervor", "fervor", "dread"],
    text: "She takes the cold, well-lit room in your mind and fills it with singing. You are warmer now. You are so much warmer now. It is harder to think, and easier to want.",
    grimoire: "The Mother of Hollows trades Clarity for double Fervour — and a little more Dread.",
  },
  {
    id: "rite_bargain_end", verb: "rite", priority: 8, duration: 30,
    name: "The Hollow Bargain",
    requires: { hollows: 1, spark: 2 },
    consumes: { spark: 1 }, produces: ["hollow_pact"],
    text: "'Name your price,' she says, and the terrible thing is that she means it. You lift the woken ember out of your chest — it comes easily, it always came easily, that was the secret — and set it in the absence where her heart should be. She fills, like a lamp.",
    grimoire: "THE HOLLOW BARGAIN: the woken Spark may be sold to the Mother of Hollows. Once.",
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

// ------------------------------------------------------------
// EVENTS — the city acts on its own. Checked while time runs and
// whenever results are collected; each fires once unless `repeatable`.
// Conditions (all must hold): minElapsed (unpaused seconds this run),
// usedOnce (a once-recipe has fired), cardExists, counterAtLeast
// (recipe completions), aspectAtLeast (tray totals).
// Effects: spawn, removeByAspect (tray only), clearDef (tray only), toast.
// kind: "omen" (violet, soft chime) or "dark" (low chime).
// ------------------------------------------------------------

const EVENTS = [
  {
    id: "ev_watcher",
    when: { aspectAtLeast: { suspicion: 2 } },
    effects: {
      title: "A Watcher in Grey",
      spawn: ["watcher"],
      toast: "A man in a grey hat has taken up residence at the corner of your street. He is very good at reading the same page.",
      kind: "omen",
    },
  },
  {
    id: "ev_vellum",
    when: { aspectAtLeast: { suspicion: 3 } },
    effects: {
      title: "A Bone-White Calling-Card",
      spawn: ["inquisitor_vellum"],
      toast: "A calling-card, bone-white, its edges singed as a courtesy: INQ. T. VELLUM, OF THE ASHEN ORDER, WILL CALL AT A CONVENIENT HOUR. All hours, you understand, are convenient to him.",
      kind: "omen",
    },
  },
  {
    id: "ev_knock", repeatable: true,
    when: { aspectAtLeast: { suspicion: 4 } },
    effects: {
      title: "The Knock at the Door",
      removeByAspect: { lore: 1 },
      clearDef: "suspicion",
      spawn: ["dread"],
      toast: "THE KNOCK AT THE DOOR. Three raps, unhurried, official. The Ashen Order is polite, thorough, and gone within the hour — along with something you had written down.",
      kind: "dark",
    },
  },
  {
    id: "ev_widow_intro",
    when: { usedOnce: "study_spark_first", minElapsed: 90 },
    effects: {
      title: "A Mourning-Card",
      spawn: ["widow_card"],
      toast: "A mourning-card has been slipped under your door. Ash-grey paper, violet ink, an address on Lantern Row that is only legible at night.",
      kind: "omen",
    },
  },
  {
    id: "ev_widow_kindle",
    when: { usedOnce: "rite_kindle", cardExists: "widow_card" },
    effects: {
      title: "The Widow's Note",
      spawn: ["widow_warning", "suspicion"],
      toast: "A note in violet ink, delivered by no one: the Widow felt what you did.",
      kind: "omen",
    },
  },
  {
    id: "ev_hollow_name",
    when: { cardExists: "lore_veil2" },
    effects: {
      title: "A Name, Underneath",
      spawn: ["hollow_invitation"],
      toast: "As you shelve the deeper lore, you notice writing on the underside of it — the way an address is on the underside of an envelope.",
      kind: "omen",
    },
  },
  {
    id: "ev_memory_funeral",
    when: { counterAtLeast: { recipe: "dream_spark_again", n: 2 } },
    effects: {
      title: "The Garden Remembers",
      spawn: ["memory_funeral"],
      toast: "On this visit, the Ash Garden gives up a buried hour: a funeral you did not attend, and yet remember.",
      kind: "omen",
    },
  },
  {
    id: "ev_memory_choir",
    when: { counterAtLeast: { recipe: "dream_spark_again", n: 4 } },
    effects: {
      title: "The Singers, Seen",
      spawn: ["memory_choir", "dread"],
      toast: "The garden shows you the singers. You wake with your jaw aching, as if you had been harmonizing in your sleep.",
      kind: "dark",
    },
  },
  {
    id: "ev_choir_hymn",
    when: { cardExists: "spark2" },
    effects: {
      title: "A Hymn Above the Rooftops",
      spawn: ["choir_hymn", "dread"],
      toast: "At dusk, a hymn above the rooftops, sung by nothing visible. The Quiet Choir has noticed that something is awake.",
      kind: "dark",
    },
  },
  {
    id: "ev_promotion",
    when: { counterAtLeast: { recipe: "work_clerk", n: 3 } },
    effects: {
      title: "The High Stool Offered",
      spawn: ["position_card"],
      toast: "The chief clerk has retired to the seaside, to die respectably. The Counting-House offers you his stool, his brass nameplate, and his key to the side door.",
      kind: "omen",
    },
  },
  {
    id: "ev_ledger",
    when: { counterAtLeast: { recipe: "work_position", n: 2 } },
    effects: {
      title: "Ledger 41 Will Not Balance",
      spawn: ["ledger_card"],
      toast: "From the high stool, you notice what the chief clerk must have noticed before he retired so suddenly seaward: Ledger 41 will not balance. You are the only clerk who has looked twice.",
      kind: "omen",
    },
  },
  {
    id: "ev_emissary",
    when: { usedOnce: "rite_kindle", minElapsed: 240 },
    effects: {
      title: "A Knock at the Window",
      spawn: ["emissary_card"],
      toast: "A knock. Not at the door — at the window. You live on the fourth floor. Through the glass, a borrowed face smiles with borrowed patience, and waits to be regarded.",
      kind: "dark",
    },
  },
  {
    id: "ev_craving", repeatable: true,
    when: { everySeconds: 240, usedOnce: "study_spark_first" },
    effects: {
      title: "The Ember Craves",
      spawnOneOf: ["craving_story", "craving_wonder", "craving_dread"],
      toast: "A pang beneath the sternum: the ember misses something it cannot name. Read the wanting closely, and answer it at the Rite — before it sours.",
      kind: "omen",
    },
  },
  {
    id: "ev_flotsam", repeatable: true,
    when: { everySeconds: 300, minElapsed: 90 },
    effects: {
      title: "The City's Flotsam",
      spawnOneOf: ["funds", "pamphlet", "wonder", "curio_locket", "curio_button", "curio_key", "curio_eye", "curio_die"],
      toast: "Something has been left on your doorstep, or your windowsill, or tucked into your coat pocket. The city gives as it takes: sideways, and without explanation.",
      kind: "omen",
    },
  },
  {
    id: "ev_floorboards",
    when: { counterAtLeast: { recipe: "study_buy", n: 3 } },
    effects: {
      title: "A Murmur at the Counter",
      spawn: ["floorboard_offer"],
      toast: "The pamphlet-seller has begun to greet you by name. Today, he does not ring up your purchase right away.",
      kind: "omen",
    },
  },
];

// ------------------------------------------------------------
// WHISPERS — when the player seems stuck, the ember murmurs one
// gentle nudge (shown atop the Chronicle). First match wins; each
// predicate receives a small context of state helpers. Nudges, not
// recipes: they point at doors without opening them.
// ------------------------------------------------------------

const WHISPERS = [
  // time-sensitive murmurs outrank leisurely ones
  { id: "w_craving", text: "The ember's wanting has a shape. Match the shape, at Rite, before it sours.",
    when: (c) => c.aspectTotal("craving") >= 1 },
  { id: "w_pamphlet", text: "The pamphlet is more than it appears. Read it closely, at Study.",
    when: (c) => c.has("pamphlet") && !c.done("study_text") },
  { id: "w_spark", text: "You carry something no pamphlet mentions. It could be Studied. Once.",
    when: (c) => !c.done("study_spark_first") },
  { id: "w_refine", text: "Two small flames, studied together, make a greater.",
    when: (c) => !c.done("rite_kindle") && !c.done("study_flame_combine") && c.aspectTotal("flame") >= 2 && c.aspectTotal("lore") >= 2 },
  { id: "w_kindle", text: "The whisper spoke of a Kindling: flame refined, and your own insistence, offered together at Rite.",
    when: (c) => c.unlocked("rite") && !c.done("rite_kindle") },
  { id: "w_dread", text: "What frightens you need not be kept. Dreams have uses for it. So, later, do certain markets.",
    when: (c) => c.count("dread") >= 2 },
  { id: "w_garden", text: "The Ash Garden remembers more than one buried hour. Keep returning.",
    when: (c) => c.done("dream_spark_first") && c.counter("dream_spark_again") < 4 },
  { id: "w_widow_memory", text: "The Widow buried someone too. Show her what the garden gave you, over tea.",
    when: (c) => c.has("widow_card") && c.aspectTotal("godmemory") >= 1 && !c.done("dream_widow_reveal") },
  { id: "w_veil_deep", text: "What is woken must be hidden, or surrendered, or laid to rest. All three roads go through the deeper Veil.",
    when: (c) => c.has("spark2") && c.aspectTotal("veil") < 2 },
  { id: "w_crown", text: "A crowning wants the woken ember, the deeper Veil, and one bright impossible thing — before it fades.",
    when: (c) => c.has("spark2") && c.aspectTotal("veil") >= 2 },
  { id: "w_default", text: "The ember is patient. Try what has never been tried; the Grimoire will remember it for you.",
    when: () => true },
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
    text: "You are not a god. You are what comes after gods — something small and warm and self-made, wearing a crown of your own kindling. The city below lights its lamps, not knowing who it lights them for now.",
    button: "Begin a New Story",
  },
  despair: {
    title: "THE LONG DARK",
    text: "The lamps went out one by one, and one by one you forgot that you had ever lit them. The ember passes to other hands — but what you LEARNED does not. Your Grimoire remembers, even here.",
    button: "Begin Again, Remembering",
  },
  quenched: {
    title: "THE GENTLE ASH",
    text: "For the first time since you swallowed the spark, your chest is only warm the way anyone's is. The Choir's hymn moves on to other rooftops, searching for something that no longer exists to be found. The Widow visits, some evenings, and you drink grey tea and speak of nothing important, which is everything. The door at the bottom of the stairs is still there. But these days it is only a door — and the roses, at last, are only roses.",
    button: "Begin a New Story",
  },
  bargain: {
    title: "THE HOLLOW BARGAIN",
    text: "She keeps her word: you have everything you asked for, and you will want none of it for long. Some nights you feel warmth from far below, like a lamp in a deep house, and you think — that was mine, once. I carried that. The thought is almost enough. The Mother of Hollows pays fairly. That was always the trap.",
    button: "Begin Again, Lighter",
  },
};
