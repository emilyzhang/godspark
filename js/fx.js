// ============================================================
// GODSPARK — atmosphere: sound and ambient embers.
// Everything is synthesized or drawn at runtime; no assets, no network.
// ============================================================

// ---- sound -----------------------------------------------------------------

let audioCtx = null;
let reverbNode = null;

function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    // A synthesized cathedral: two seconds of exponentially-decaying noise
    // makes a perfectly serviceable reverb impulse.
    const len = Math.floor(audioCtx.sampleRate * 2.2);
    const impulse = audioCtx.createBuffer(2, len, audioCtx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.5);
      }
    }
    reverbNode = audioCtx.createConvolver();
    reverbNode.buffer = impulse;
    const reverbGain = audioCtx.createGain();
    reverbGain.gain.value = 0.6;
    reverbNode.connect(reverbGain).connect(audioCtx.destination);
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

// One shimmering, slightly-detuned bell tone with slow attack and long tail.
function etherealTone(freq, when, dur, peak) {
  const ctx = ensureAudio();
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(peak, when + 0.12);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  gain.connect(ctx.destination);
  gain.connect(reverbNode);
  for (const detune of [-4, 3]) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    osc.detune.value = detune;
    osc.connect(gain);
    osc.start(when);
    osc.stop(when + dur + 0.1);
  }
}

// Completion: rising stacked fifths — open, glassy, unhurried.
function chime() {
  if (state.muted) return;
  try {
    const now = ensureAudio().currentTime + 0.03;
    etherealTone(523.25, now, 2.4, 0.045);        // C5
    etherealTone(784.0,  now + 0.22, 2.2, 0.038); // G5
    etherealTone(1174.7, now + 0.46, 2.6, 0.03);  // D6
  } catch (e) { /* audio unavailable; play on in silence */ }
}

// Omens and menaces: a low tolling pair, far away.
function darkChime() {
  if (state.muted) return;
  try {
    const now = ensureAudio().currentTime + 0.03;
    etherealTone(110.0,  now, 3.2, 0.06);         // A2
    etherealTone(155.56, now + 0.4, 3.0, 0.045);  // Eb3 — the tritone tolls
    etherealTone(440.0,  now + 0.9, 2.0, 0.012);  // a faint harmonic ghost
  } catch (e) { /* audio unavailable */ }
}

// ---- ambient embers --------------------------------------------------------

function startEmbers() {
  const canvas = document.getElementById("embers");
  if (!canvas) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    canvas.remove();
    return;
  }
  const ctx = canvas.getContext("2d");
  let w, h;
  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  const COLORS = ["#e2703a", "#c9a84c", "#8f7fd4"];
  const embers = Array.from({ length: 26 }, () => spawnEmber(true));

  function spawnEmber(anywhere) {
    return {
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : h + 10,
      r: 0.6 + Math.random() * 1.7,
      speed: 6 + Math.random() * 14,        // px/sec upward
      sway: 8 + Math.random() * 22,
      phase: Math.random() * Math.PI * 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: 0.12 + Math.random() * 0.3,
    };
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < embers.length; i++) {
      const e = embers[i];
      e.y -= e.speed * dt;
      e.phase += dt * 0.7;
      const x = e.x + Math.sin(e.phase) * e.sway;
      if (e.y < -10) embers[i] = spawnEmber(false);
      const flicker = 0.75 + 0.25 * Math.sin(e.phase * 3.1);
      ctx.globalAlpha = e.alpha * flicker;
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.arc(x, e.y, e.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
