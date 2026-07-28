# GODSPARK

*a small game about carrying what remains of a god*

A [Cultist Simulator](https://weatherfactory.biz/cultist-simulator/)-inspired card-and-verb game: drag cards onto actions, let timers run, and discover recipes through experimentation. You carry the ember of a murdered god through a gaslit city — work, study, and dream your way toward crowning it before the creeping Dread snuffs you out.

The city acts on its own: public acts breed **Suspicion**, and the grey-hatted **Ashen Order** comes knocking when it gathers. The **Widow of Lantern Row** — who attended the same funeral you did — trades in dreams, and knows more about what you carry than she first admits. Under the deeper lore there is a name, and the name is the **Mother of Hollows**, and she pays fairly, which is the trap. Return often to the Ash Garden and it will give up, hour by buried hour, the story of how a god was unmade — and by whom. Four endings: ambition, bargain, despair, and mercy.

Every graphic is generated at runtime: each card bears a constellation-sigil drawn deterministically from its name, an aurora breathes behind the city, stars twinkle among the drifting embers, and a vast working turns slowly beneath the whole table.

## Playing

Open `index.html` in a browser. That's it.

Or, if you prefer serving it properly:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

- Click a verb tile (Work / Study / Dream / …) to open it.
- Drag cards into its slots — or double-click a card to slot it.
- With a verb open, tray cards that would **change the outcome glow gold**; irrelevant ones dim.
- The panel tells you what recipe the combination would begin. Hit **Begin**.
- The game **auto-pauses** whenever an action finishes. Space toggles pause.
- Hover a card for its description; every card wears its aspect gems on its face.
- The **Grimoire** (📖) records every recipe you discover — permanently. It survives death. Recipes you know also appear in the verb panel as "workings you know," ingredients included.

Progress autosaves to your browser's localStorage.

## Design pillars

Built as "Cultist Simulator, minus the gripes":

1. **Autopause** — real-time, but the game stops the moment a result is ready. No plate-spinning.
2. **Anti-opacity** — discoveries are recorded in-game with plain-language hints; combinations preview their recipe before you commit.
3. **Gentle failure** — losing a run costs your position, never your knowledge. The Grimoire persists across runs.

## Code

Zero dependencies, deliberately: hand-written HTML/CSS/JS, no npm, no CDNs, no network calls of any kind.

| File | Role |
|---|---|
| `js/data.js` | All game content — cards, verbs, recipes, events, endings |
| `js/engine.js` | Game state, clock, recipe matching, events, save/load (no DOM) |
| `js/ui.js` | Rendering, drag & drop, panels |
| `js/fx.js` | Synthesized sound (reverb included), ember & star particles |
| `js/art.js` | Procedural art — per-card constellation-sigils, the aurora, the great sigil |
| `js/main.js` | Bootstrap wiring |
| `style.css` | Gaslit occult styling |

The engine has no DOM dependencies, so it can be driven headlessly from Node for testing.
