// ============================================================
// GODSPARK — bootstrap: wire engine to UI, start the clock.
// ============================================================

(function init() {
  // engine -> ui
  on("change", render);
  on("tick", renderTick);
  on("toast", showToast);
  on("completed", () => blip()); // a soft tick: the work goes on
  on("autopause", () => {
    darkChime(); // only dark turns stop the world now
    render();
  });
  on("ending", (kind) => {
    if (kind === "victory" || kind === "quenched") chime();
    else darkChime();
    render();
    showEnding(kind);
  });
  on("newrun", showPrologue); // every new story opens at the graveside

  // header controls
  buttonContent(document.querySelector("#btn-grimoire"), "book", "Grimoire");
  buttonContent(document.querySelector("#btn-restart"), "restart", "Begin Again");
  document.querySelector("#btn-pause").addEventListener("click", () => {
    if (!state.ended) setPaused(!state.paused);
  });
  document.querySelector("#btn-grimoire").addEventListener("click", () => {
    document.querySelector("#grimoire").classList.toggle("hidden");
  });
  document.querySelector("#btn-grimoire-close").addEventListener("click", () => {
    document.querySelector("#grimoire").classList.add("hidden");
  });
  document.querySelector("#btn-mute").addEventListener("click", () => {
    state.muted = !state.muted;
    save();
    render();
  });
  document.querySelector("#btn-restart").addEventListener("click", () => {
    const sure = confirm(
      "Begin again? Your current run will be lost — but your Grimoire remembers everything you have learned."
    );
    if (sure) {
      newRun();
      selectedVerbId = null;
      render();
    }
  });

  // spacebar toggles pause (unless typing in an input someday)
  document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && e.target === document.body) {
      e.preventDefault();
      if (!state.ended) setPaused(!state.paused);
    }
  });

  calibrateIcons(); // measure the icon set so each sits centered in its frame
  load();
  render();
  startDreamscape();
  startEmbers();
  // Time follows the wall clock, not timer firings: when the browser
  // throttles a background tab, the game catches up rather than crawling.
  let lastFrame = performance.now();
  setInterval(() => {
    const now = performance.now();
    const delta = (now - lastFrame) / 1000;
    lastFrame = now;
    if (delta > 0.25) advance(delta);
    else tick();
  }, TICK_MS);
  setInterval(save, 5000); // autosave
})();
