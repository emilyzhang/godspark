// ============================================================
// GODSPARK — bootstrap: wire engine to UI, start the clock.
// ============================================================

(function init() {
  // engine -> ui
  on("change", render);
  on("toast", showToast);
  on("autopause", (verbId) => {
    chime();
    if (verbId) selectedVerbId = verbId; // jump the panel to the finished action
    render();
  });
  on("ending", (kind) => {
    render();
    showEnding(kind);
  });

  // header controls
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

  load();
  render();
  setInterval(tick, TICK_MS);
  setInterval(save, 5000); // autosave
})();
