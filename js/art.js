// ============================================================
// GODSPARK — procedural art: every graphic is generated at runtime.
// Each card bears a small constellation-sigil, unique to its kind,
// drawn deterministically from a hash of its definition id.
// ============================================================

const SVG_NS = "http://www.w3.org/2000/svg";

// deterministic per-card randomness: same card kind, same sigil, always
function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function svgEl(tag, attrs) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

// a tiny four-pointed star sparkle
function sparklePath(cx, cy, r) {
  return `M ${cx} ${cy - r} Q ${cx} ${cy} ${cx + r} ${cy} Q ${cx} ${cy} ${cx} ${cy + r} Q ${cx} ${cy} ${cx - r} ${cy} Q ${cx} ${cy} ${cx} ${cy - r} Z`;
}

// The card's sigil: a hazy glow, a broken ring that slowly turns,
// and a small constellation whose shape belongs to this card alone.
function cardSigil(defId, color) {
  const rng = mulberry32(hashString(defId));
  const svg = svgEl("svg", { viewBox: "0 0 100 64", class: "sigil" });
  const cx = 50, cy = 32;

  // layered haze
  for (const [r, op] of [[24, 0.05], [16, 0.08], [9, 0.12]]) {
    svg.appendChild(svgEl("circle", { cx, cy, r, fill: color, opacity: op }));
  }

  // the turning ring, broken into arcs
  const ring = svgEl("g", { class: "sigil-ring" });
  const dashA = 8 + Math.floor(rng() * 26);
  const dashB = 4 + Math.floor(rng() * 12);
  ring.appendChild(svgEl("circle", {
    cx, cy, r: 26, fill: "none", stroke: color, "stroke-width": 0.7,
    opacity: 0.4, "stroke-dasharray": `${dashA} ${dashB}`,
  }));
  ring.appendChild(svgEl("circle", {
    cx, cy, r: 22.5, fill: "none", stroke: color, "stroke-width": 0.4,
    opacity: 0.22, "stroke-dasharray": `${dashB} ${dashA}`,
  }));
  svg.appendChild(ring);

  // the constellation
  const n = 5 + Math.floor(rng() * 4);
  const points = [];
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2 + rng() * 0.9;
    const radius = 12 + rng() * 13;
    points.push([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius * 0.82]);
  }
  const lines = svgEl("g", { stroke: color, "stroke-width": 0.5, opacity: 0.4 });
  for (let i = 0; i < n; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % n];
    if (rng() < 0.75) lines.appendChild(svgEl("line", { x1, y1, x2, y2 }));
  }
  // a chord or two across the middle
  if (n > 5) {
    const [x1, y1] = points[0];
    const [x2, y2] = points[Math.floor(n / 2)];
    lines.appendChild(svgEl("line", { x1, y1, x2, y2, opacity: 0.6 }));
  }
  svg.appendChild(lines);
  for (const [x, y] of points) {
    svg.appendChild(svgEl("circle", { cx: x, cy: y, r: 0.9, fill: color, opacity: 0.85 }));
  }

  // stray sparkles in the dark around it
  for (let i = 0; i < 3; i++) {
    const sx = 6 + rng() * 88;
    const sy = 5 + rng() * 54;
    svg.appendChild(svgEl("path", {
      d: sparklePath(sx, sy, 1.4 + rng() * 1.6),
      fill: "#e9d98a",
      opacity: 0.25 + rng() * 0.35,
      class: rng() < 0.5 ? "twinkle" : "twinkle twinkle-late",
    }));
  }

  return svg;
}

// The vast, faint working inscribed behind the whole table.
function buildVeilSigil() {
  const holder = document.createElement("div");
  holder.id = "veil-sigil";
  holder.setAttribute("aria-hidden", "true");
  const svg = svgEl("svg", { viewBox: "0 0 600 600" });

  const g = svgEl("g", { class: "veil-turn" });
  for (const [r, w, op] of [[288, 1.2, 0.5], [272, 0.5, 0.35], [206, 0.8, 0.4], [122, 0.5, 0.3]]) {
    g.appendChild(svgEl("circle", {
      cx: 300, cy: 300, r, fill: "none", stroke: "#c9a84c", "stroke-width": w, opacity: op,
    }));
  }
  // interlocked triangles — the old geometry
  g.appendChild(svgEl("polygon", {
    points: "300,110 464,395 136,395", fill: "none",
    stroke: "#8f7fd4", "stroke-width": 0.8, opacity: 0.35,
  }));
  g.appendChild(svgEl("polygon", {
    points: "300,490 136,205 464,205", fill: "none",
    stroke: "#8f7fd4", "stroke-width": 0.8, opacity: 0.35,
  }));
  // glyphs of the great aspects, stationed around the wheel
  const glyphs = ["🜂", "☾", "✦", "◌", "✧", "●", "♠", "◆", "♥", "⛀", "🗝", "¶"];
  glyphs.forEach((glyph, i) => {
    const angle = (i / glyphs.length) * Math.PI * 2 - Math.PI / 2;
    const x = 300 + Math.cos(angle) * 240;
    const y = 300 + Math.sin(angle) * 240;
    const t = svgEl("text", {
      x, y, "text-anchor": "middle", "dominant-baseline": "central",
      "font-size": 20, fill: "#c9a84c", opacity: 0.55,
      transform: `rotate(${(angle * 180 / Math.PI) + 90} ${x} ${y})`,
    });
    t.textContent = glyph;
    g.appendChild(t);
  });
  svg.appendChild(g);
  holder.appendChild(svg);
  return holder;
}

// The city itself: two silhouette ridges of rooftops, chimneys and spires,
// with a scatter of warm windows still lit at this hour. Some of them flicker.
function skylineLayer(seedName, color, withWindows) {
  const rng = mulberry32(hashString(seedName));
  const svg = svgEl("svg", {
    viewBox: "0 0 1200 240",
    preserveAspectRatio: "xMidYMax slice",
    class: `skyline ${seedName}`,
  });
  let x = -10;
  while (x < 1210) {
    const w = 34 + rng() * 72;
    const h = withWindows ? 34 + rng() * 100 : 70 + rng() * 130;
    const y = 240 - h;
    svg.appendChild(svgEl("rect", { x, y, width: w, height: h, fill: color }));

    // chimneys and stovepipes
    const chimneys = Math.floor(rng() * 3);
    for (let i = 0; i < chimneys; i++) {
      const cw = 4 + rng() * 5;
      svg.appendChild(svgEl("rect", {
        x: x + 4 + rng() * (w - 12), y: y - 8 - rng() * 12,
        width: cw, height: 24, fill: color,
      }));
    }
    // the occasional spire or gable
    if (rng() < 0.22) {
      const px = x + w / 2;
      const ph = 18 + rng() * 34;
      svg.appendChild(svgEl("polygon", {
        points: `${x + 2},${y} ${px},${y - ph} ${x + w - 2},${y}`, fill: color,
      }));
    }
    // lit windows, front ridge only
    if (withWindows) {
      const cols = Math.floor((w - 8) / 11);
      const rows = Math.floor((h - 14) / 16);
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          if (rng() < 0.13) {
            const win = svgEl("rect", {
              x: x + 6 + c * 11, y: y + 8 + r * 16,
              width: 4, height: 6, fill: "#ecca7a",
              opacity: 0.3 + rng() * 0.45,
            });
            if (rng() < 0.3) {
              win.setAttribute("class", "win-flicker");
              win.style.animationDelay = `${(rng() * 7).toFixed(2)}s`;
            }
            svg.appendChild(win);
          }
        }
      }
    }
    x += w + (rng() < 0.25 ? 5 + rng() * 12 : 0);
  }
  return svg;
}

function buildCityscape() {
  const holder = document.createElement("div");
  holder.id = "cityscape";
  holder.setAttribute("aria-hidden", "true");
  holder.appendChild(skylineLayer("ridge-back", "#1c1629", false));
  holder.appendChild(skylineLayer("ridge-front", "#0d0a15", true));
  const fog = document.createElement("div");
  fog.className = "city-fog";
  holder.appendChild(fog);
  return holder;
}

// A patient moon, hazed with its own halo.
function buildMoon() {
  const moon = document.createElement("div");
  moon.id = "moon";
  moon.setAttribute("aria-hidden", "true");
  return moon;
}

// The aurora: three slow-breathing veils of colour behind the city.
function buildAurora() {
  const aurora = document.createElement("div");
  aurora.id = "aurora";
  aurora.setAttribute("aria-hidden", "true");
  for (let i = 1; i <= 3; i++) {
    const blob = document.createElement("div");
    blob.className = `aurora-blob aurora-${i}`;
    aurora.appendChild(blob);
  }
  return aurora;
}

function startDreamscape() {
  // painted back-to-front: aurora, moon, the great sigil, then the city
  const layers = [buildAurora(), buildMoon(), buildVeilSigil(), buildCityscape()];
  for (const layer of layers.reverse()) document.body.prepend(layer);
}
