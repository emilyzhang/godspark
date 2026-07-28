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

// ------------------------------------------------------------
// The icon library: every symbol in the game, hand-drawn as
// stroke paths in a 24x24 frame. They inherit currentColor,
// so they print in whatever ink their context wears.
// ------------------------------------------------------------

const ICONS = {
  flame: '<path d="M12 3.5c1 3 4.5 4.6 4.5 8.3a4.5 4.5 0 1 1-9 0c0-2.4 1.4-3.8 2.6-5.2.9-1 1.6-2 1.9-3.1Z"/><path d="M12 19.5a2.6 2.6 0 0 1-2.6-2.6c0-1.4 1.5-2.3 2.6-3.6 1.1 1.3 2.6 2.2 2.6 3.6a2.6 2.6 0 0 1-2.6 2.6Z" fill="currentColor" stroke="none" opacity="0.5"/>',
  crescent: '<path d="M14.5 3.5a9 9 0 1 0 6 12.9 8.2 8.2 0 0 1-6-12.9Z"/>',
  crown: '<path d="M4.5 16.5 3.5 8l4.8 3.2L12 5.5l3.7 5.7L20.5 8l-1 8.5Z"/><path d="M5.5 19.5h13"/>',
  coin: '<circle cx="12" cy="12" r="7.2"/><circle cx="12" cy="12" r="3.8"/><path d="M12 4.8v1.8M12 17.4v1.8M4.8 12h1.8M17.4 12h1.8" opacity="0.7"/>',
  heart: '<path d="M12 19.5C6 15 4.5 11.5 6.3 8.9c1.6-2.3 4.4-1.9 5.7.3 1.3-2.2 4.1-2.6 5.7-.3 1.8 2.6.3 6.1-5.7 10.6Z"/>',
  gem: '<path d="M7.5 4.5h9l4 5L12 20 3.5 9.5Z"/><path d="M3.5 9.5h17M12 20 8.7 9.5 12 4.5l3.3 5L12 20" opacity="0.7"/>',
  emberheart: '<path d="M12 20c-5.2-4-6.6-7-5.1-9.3 1.4-2 3.9-1.7 5.1.3 1.2-2 3.7-2.3 5.1-.3 1.5 2.3.1 5.3-5.1 9.3Z"/><path d="M12 3v2.4M6.3 4.8l1.4 1.9M17.7 4.8l-1.4 1.9"/>',
  sparkle: '<path d="M12 4l1.6 6.4L20 12l-6.4 1.6L12 20l-1.6-6.4L4 12l6.4-1.6Z" fill="currentColor" stroke="none"/><circle cx="18.7" cy="5.3" r="0.9" fill="currentColor" stroke="none"/><circle cx="5.3" cy="18.2" r="0.7" fill="currentColor" stroke="none"/>',
  spark4: '<path d="M12 3.2l1.7 7.1 7.1 1.7-7.1 1.7-1.7 7.1-1.7-7.1L3.2 12l7.1-1.7Z" fill="currentColor" stroke="none"/>',
  dread: '<circle cx="12" cy="12" r="5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="8.4" opacity="0.5"/>',
  ring: '<circle cx="12" cy="12" r="6.8"/>',
  eye: '<path d="M2.8 12C5.4 7.6 8.5 5.6 12 5.6s6.6 2 9.2 6.4c-2.6 4.4-5.7 6.4-9.2 6.4S5.4 16.4 2.8 12Z"/><circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none"/>',
  scroll: '<path d="M6.5 3.8h8.5l3.5 3.5v12.9H6.5Z"/><path d="M15 3.8v3.5h3.5" opacity="0.7"/><path d="M9.5 12h5M9.5 15.2h5" opacity="0.7"/>',
  tome: '<path d="M6 3.5h11a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 19V5A1.5 1.5 0 0 1 6 3.5Z"/><path d="M7.8 3.5v17" opacity="0.7"/><path d="M18.5 11.2h-2.6"/>',
  book: '<path d="M12 6c-2-1.6-4.8-2-7.5-1.3v13.5c2.7-.7 5.5-.3 7.5 1.3 2-1.6 4.8-2 7.5-1.3V4.7C16.8 4 14 4.4 12 6Z"/><path d="M12 6v13.5" opacity="0.7"/>',
  key: '<circle cx="12" cy="7" r="3.2"/><path d="M12 10.2V20M12 15.5h3M12 19h2.3"/>',
  lines: '<path d="M6 6.5h12M6 10.5h12M6 14.5h8.5M6 18.5h5"/>',
  blossom: '<path d="M12 12c-1.4-2.6-1.4-5.7 0-7.8 1.4 2.1 1.4 5.2 0 7.8Z"/><path d="M12 12c-1.4-2.6-1.4-5.7 0-7.8 1.4 2.1 1.4 5.2 0 7.8Z" transform="rotate(72 12 12)"/><path d="M12 12c-1.4-2.6-1.4-5.7 0-7.8 1.4 2.1 1.4 5.2 0 7.8Z" transform="rotate(144 12 12)"/><path d="M12 12c-1.4-2.6-1.4-5.7 0-7.8 1.4 2.1 1.4 5.2 0 7.8Z" transform="rotate(216 12 12)"/><path d="M12 12c-1.4-2.6-1.4-5.7 0-7.8 1.4 2.1 1.4 5.2 0 7.8Z" transform="rotate(288 12 12)"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>',
  note: '<path d="M9.5 17.5V6.5l9-2v11"/><ellipse cx="7.4" cy="17.5" rx="2.1" ry="1.7" fill="currentColor" stroke="none"/><ellipse cx="16.4" cy="15.5" rx="2.1" ry="1.7" fill="currentColor" stroke="none"/>',
  leaf: '<path d="M5.5 18.5C5.5 11 11 5.5 18.5 5.5c0 7.5-5.5 13-13 13Z"/><path d="M5.5 18.5C9.5 14.5 13.5 10.5 18.5 5.5" opacity="0.7"/>',
  rose: '<circle cx="12" cy="10" r="6"/><path d="M12 5.8a4.2 4.2 0 1 1-4.2 4.2" opacity="0.75"/><path d="M12 8a2 2 0 1 1-2 2" opacity="0.55"/><path d="M12 16v5.2M12 19c-1.7-.1-2.8-.9-3.4-2.3M12 20.2c1.6-.4 2.5-1.2 2.9-2.6"/>',
  person: '<circle cx="12" cy="8.2" r="3.4"/><path d="M5.2 20c.8-4 3.4-6 6.8-6s6 2 6.8 6"/>',
  halo: '<ellipse cx="12" cy="3.8" rx="3.4" ry="1.1"/><circle cx="12" cy="9.4" r="3.1"/><path d="M5.6 20c.8-3.7 3.2-5.5 6.4-5.5s5.6 1.8 6.4 5.5"/>',
  candle: '<path d="M9.7 11h4.6v8.5H9.7Z"/><path d="M6.5 19.5h11"/><path d="M12 10.8V9.2"/><path d="M12 3.2c-1.3 1.6-1.3 3 0 4 1.3-1 1.3-2.4 0-4Z" fill="currentColor" stroke="none" opacity="0.8"/>',
  hat: '<path d="M7.8 16.6V7.6c0-1.3 8.4-1.3 8.4 0v9"/><path d="M3.4 16.4c0 1.1 4 2 8.6 2s8.6-.9 8.6-2"/><path d="M7.8 11h8.4" opacity="0.7"/>',
  wiltedrose: '<path d="M11.5 21c.4-4-.2-6.5-3-8.5"/><circle cx="7.2" cy="10" r="3.1"/><path d="M7.2 6.9a3.1 3.1 0 0 1 0 6.2" opacity="0.6"/><path d="M12.5 16.5c1.6-.6 2.6-1.7 3-3.4-1.9.1-3.1 1-3.7 2.8Z" fill="currentColor" stroke="none" opacity="0.6"/>',
  envelope: '<path d="M3.8 6.2h16.4v11.6H3.8Z"/><path d="m3.8 6.6 8.2 6 8.2-6"/>',
  hollowring: '<circle cx="12" cy="12" r="6.8" stroke-dasharray="3.6 3"/>',
  nib: '<path d="M12 3.2 16.6 7.8 12.9 20.5h-1.8L7.4 7.8Z"/><path d="M12 8.6v5.2" opacity="0.7"/><circle cx="12" cy="10.8" r="1" fill="currentColor" stroke="none"/>',
  asterism: '<path d="M12 3.5l1 3 3 1-3 1-1 3-1-3-3-1 3-1Z" fill="currentColor" stroke="none"/><path d="M6.2 13l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8Z" fill="currentColor" stroke="none"/><path d="M17.8 13l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8Z" fill="currentColor" stroke="none"/>',
  scales: '<path d="M4.5 6.5h15M12 4.2V19M8.5 19.5h7"/><path d="M7 6.5 4.4 12.4M7 6.5l2.6 5.9M4.1 12.4a2.9 2.9 0 0 0 5.8 0Z"/><path d="m17 6.5-2.6 5.9M17 6.5l2.6 5.9M14.1 12.4a2.9 2.9 0 0 0 5.8 0Z"/>',
  quill: '<path d="M19.5 4c-5.5.6-9.8 3.6-12.2 8.6L6 18l5.4-1.3C16.4 14.3 19 9.5 19.5 4Z"/><path d="M6.8 17.2 14.5 9" opacity="0.7"/>',
  hammer: '<path d="m13.2 10.8 6.6 6.6-2.4 2.4-6.6-6.6"/><path d="M4.2 5h8.6v6H8.2A4 4 0 0 1 4.2 7Z"/>',
  pause: '<path d="M8.5 5v14M15.5 5v14"/>',
  play: '<path d="M8 5.2 18.8 12 8 18.8Z" fill="currentColor" stroke="none"/>',
  bell: '<path d="M12 3.5a5.5 5.5 0 0 1 5.5 5.5c0 3.6.8 5.4 1.8 6.5H4.7c1-1.1 1.8-2.9 1.8-6.5A5.5 5.5 0 0 1 12 3.5Z"/><path d="M10 18.8a2.1 2.1 0 0 0 4 0"/>',
  bellOff: '<path d="M12 3.5a5.5 5.5 0 0 1 5.5 5.5c0 3.6.8 5.4 1.8 6.5H4.7c1-1.1 1.8-2.9 1.8-6.5A5.5 5.5 0 0 1 12 3.5Z" opacity="0.55"/><path d="M10 18.8a2.1 2.1 0 0 0 4 0" opacity="0.55"/><path d="M4.5 4 20 19.5"/>',
  restart: '<path d="M18.5 12A6.5 6.5 0 1 1 12 5.5"/><path d="M12 2.8 15 5.5 12 8.2"/>',
};

// Hand-drawn paths rarely balance perfectly in their frame, so each icon
// is measured once at startup and recentered on (12,12) by its bounding box.
const ICON_OFFSETS = {};

function calibrateIcons() {
  const probe = svgEl("svg", { viewBox: "0 0 24 24", width: 24, height: 24 });
  probe.style.position = "fixed";
  probe.style.left = "-9999px";
  document.body.appendChild(probe);
  for (const [name, markup] of Object.entries(ICONS)) {
    const g = svgEl("g", {});
    g.innerHTML = markup;
    probe.appendChild(g);
    const box = g.getBBox();
    const dx = 12 - (box.x + box.width / 2);
    const dy = 12 - (box.y + box.height / 2);
    ICON_OFFSETS[name] = `translate(${dx.toFixed(2)} ${dy.toFixed(2)})`;
    probe.removeChild(g);
  }
  probe.remove();
}

function centeredIconMarkup(name) {
  const markup = ICONS[name] || ICONS.sparkle;
  const offset = ICON_OFFSETS[name];
  return offset ? `<g transform="${offset}">${markup}</g>` : markup;
}

function iconEl(name) {
  const svg = svgEl("svg", {
    viewBox: "0 0 24 24",
    class: "icon",
    "aria-hidden": "true",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "1.6",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  });
  svg.innerHTML = centeredIconMarkup(name);
  return svg;
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
  const glyphs = ["flame", "crescent", "spark4", "hollowring", "sparkle", "dread",
                  "emberheart", "gem", "heart", "coin", "key", "lines"];
  glyphs.forEach((name, i) => {
    const angle = (i / glyphs.length) * Math.PI * 2 - Math.PI / 2;
    const x = 300 + Math.cos(angle) * 240;
    const y = 300 + Math.sin(angle) * 240;
    const deg = (angle * 180) / Math.PI + 90;
    const station = svgEl("g", {
      transform: `translate(${x} ${y}) rotate(${deg}) scale(1.15) translate(-12 -12)`,
      fill: "none",
      stroke: "#c9a84c",
      color: "#c9a84c",
      "stroke-width": "1.6",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      opacity: 0.55,
    });
    station.innerHTML = centeredIconMarkup(name);
    g.appendChild(station);
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
