/* Génère l'atlas : îles (une par chapitre), courbes de niveau, mer hachurée, parcours et étapes. */
window.World = (() => {
  const { D, esc } = PF;
  const NS = "http://www.w3.org/2000/svg";
  const W = 2600, H = 1600;

  function rng(seed) {
    return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  const REG = {
    etincelle: { x: 560, y: 1090, r: 250, name: "Rives de l'Étincelle", seed: 11 },
    serveurs: { x: 830, y: 470, r: 320, name: "Archipel des Serveurs", seed: 23 },
    ecole: { x: 1450, y: 830, r: 300, name: "Plateau de l'Atelier", seed: 37, below: true },
    arene: { x: 1990, y: 1250, r: 210, name: "L'Arène", seed: 41 },
    avenoir: { x: 2170, y: 440, r: 240, name: "Terra Incognita", seed: 59, unknown: true },
  };

  function blob(cx, cy, R, seed, n = 64) {
    const r = rng(seed);
    const harm = [...Array(6)].map((_, i) => ({ f: i + 2, a: (r() * .15) / (1 + i * .45), p: r() * 6.28 }));
    return [...Array(n)].map((_, i) => {
      const t = i / n * Math.PI * 2; let k = 1;
      harm.forEach(h => (k += h.a * Math.sin(h.f * t + h.p)));
      return [cx + Math.cos(t) * R * k * 1.2, cy + Math.sin(t) * R * k * .85];
    });
  }
  function smooth(pts, closed = true) {
    const n = pts.length, g = i => pts[closed ? (i + n) % n : Math.max(0, Math.min(n - 1, i))];
    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < (closed ? n : n - 1); i++) {
      const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
      d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return d + (closed ? "Z" : "");
  }
  const scale = (pts, cx, cy, k) => pts.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k]);

  let s = `<rect x="-3000" y="-3000" width="${W + 6000}" height="${H + 6000}" fill="url(#sea)" opacity=".85"/>`;
  // graticule
  for (let x = 0; x <= W; x += 260) s += `<line class="ink" x1="${x}" y1="-300" x2="${x}" y2="${H + 300}" stroke="#c3b597" stroke-width="1"/><text class="t-grid" x="${x + 6}" y="-14">${(4 + x / 1300).toFixed(1).replace(".", ",")}° E</text>`;
  for (let y = 0; y <= H; y += 260) s += `<line class="ink" x1="-300" y1="${y}" x2="${W + 300}" y2="${y}" stroke="#c3b597" stroke-width="1"/><text class="t-grid" x="-110" y="${y - 6}">${(43.9 - y / 1300).toFixed(1).replace(".", ",")}° N</text>`;
  // cadre
  s += `<rect x="-40" y="-60" width="${W + 80}" height="${H + 120}" fill="none" stroke="#2b2420" stroke-width="3"/><rect x="-52" y="-72" width="${W + 104}" height="${H + 144}" fill="none" stroke="#2b2420" stroke-width="1"/>`;

  const islands = [];
  Object.entries(REG).forEach(([id, g]) => {
    const coast = blob(g.x, g.y, g.r, g.seed);
    let isle = `<g class="isle">`;
    // lignes d'eau autour de la côte
    for (let k = 4; k >= 1; k--) isle += `<path class="ink" d="${smooth(scale(coast, g.x, g.y, 1 + k * .045))}" fill="none" stroke="#7f8d86" stroke-opacity="${.55 - k * .1}" stroke-width="1"/>`;
    isle += `<path class="ink coast" d="${smooth(coast)}" fill="#f7f0df" stroke="#2b2420" stroke-width="2.2"/>`;
    // courbes de niveau
    for (let k = 1; k < 7; k++) {
      const pts = blob(g.x + Math.sin(k + g.seed) * k * 7, g.y + Math.cos(k * 1.4) * k * 6, g.r * (1 - k * .13), g.seed + k * 5);
      isle += `<path class="ink" d="${smooth(pts)}" fill="none" stroke="#8a6a46" stroke-opacity="${.35 + k * .06}" stroke-width="${k % 3 === 0 ? 1.4 : .8}"/>`;
    }
    if (g.unknown) isle += `<path d="${smooth(scale(coast, g.x, g.y, .98))}" fill="url(#cross)" opacity=".55"/><text class="t-note" x="${g.x}" y="${g.y + 70}" text-anchor="middle">ici, la carte reste à écrire</text>`;
    const ch = D.chapters.find(c => c.id === id);
    const ly = g.below ? g.y + g.r * 1.02 : g.y - g.r * 1.0;
    isle += `<text class="t-region ink-t" x="${g.x}" y="${ly}" text-anchor="middle">${esc(g.name)}</text>`;
    if (ch) isle += `<text class="t-sub ink-t" x="${g.x}" y="${ly + 30}" text-anchor="middle">Chapitre ${ch.n} · ${esc(ch.years)}</text>`;
    s += isle + `</g>`;
    islands.push({ id, ...g, coast });
  });

  // rose des vents à 16 branches
  const rose = (() => {
    let r = `<g class="ink-t" transform="translate(250 270)">`;
    for (let i = 0; i < 16; i++) {
      const a = i * Math.PI / 8, L = i % 4 === 0 ? 120 : i % 2 === 0 ? 80 : 54, w = i % 4 === 0 ? 13 : 8;
      const x = Math.sin(a) * L, y = -Math.cos(a) * L, px = Math.cos(a) * w, py = Math.sin(a) * w;
      r += `<path d="M0 0 L${px} ${py} L${x} ${y}Z" fill="#2b2420"/><path d="M0 0 L${-px} ${-py} L${x} ${y}Z" fill="#f7f0df" stroke="#2b2420" stroke-width="1"/>`;
    }
    r += `<circle r="92" fill="none" stroke="#2b2420"/><circle r="98" fill="none" stroke="#2b2420" stroke-width=".6"/><text class="t-region" style="font-size:26px;letter-spacing:0" y="-132" text-anchor="middle">N</text></g>`;
    return r;
  })();
  s += rose;
  // échelle
  s += `<g class="ink-t" transform="translate(${W - 520} ${H - 70})">${[0, 1, 2, 3, 4].map(i => `<rect x="${i * 80}" y="0" width="80" height="10" fill="${i % 2 ? "#f7f0df" : "#2b2420"}" stroke="#2b2420"/>`).join("")}
    <text class="t-grid" x="0" y="34">0</text><text class="t-grid" x="400" y="34" text-anchor="end">5 ans de projets</text></g>`;
  // départ
  s += `<g class="ink-t" transform="translate(330 1330)"><path d="M0 -26 L7 -6 L0 0 L-7 -6Z" fill="#b3341f"/><text class="t-note" x="16" y="-8">Arles, point de départ</text></g>`;

  // étapes : une par projet, posées autour du centre de leur île
  const levels = [];
  const byReg = {};
  D.projects.forEach(p => (byReg[p.chapter] ||= []).push(p));
  Object.entries(byReg).forEach(([rid, ps]) => {
    const g = REG[rid], r = rng(g.seed * 7), a0 = r() * 6.28;
    ps.forEach((p, i) => {
      const a = a0 + i / ps.length * Math.PI * 2, d = ps.length === 1 ? 0 : g.r * (.42 + r() * .12);
      levels.push({ p, rid, x: g.x + Math.cos(a) * d * 1.15, y: g.y + Math.sin(a) * d * .78 + (ps.length === 1 ? 30 : 0) });
    });
  });
  levels.sort((a, b) => D.projects.indexOf(a.p) - D.projects.indexOf(b.p));
  const routeD = smooth(levels.map(L => [L.x, L.y]), false);
  s += `<path id="route" d="${routeD}"/><g id="steps"></g>`;

  const cam = document.getElementById("cam");
  cam.innerHTML = s;
  const stepsG = document.getElementById("steps");
  levels.forEach((L, i) => {
    const g = document.createElementNS(NS, "g");
    g.setAttribute("class", "step ink" + (L.p.featured ? "" : " side") + (PF.isWip(L.p) ? " wip" : ""));
    g.setAttribute("transform", `translate(${L.x.toFixed(1)} ${L.y.toFixed(1)})`);
    g.setAttribute("tabindex", "0"); g.setAttribute("role", "button");
    g.setAttribute("aria-label", `Étape ${i + 1} : ${L.p.title}`);
    g.innerHTML = `<circle class="mark" r="19"/><circle class="core" r="13"/><text class="num">${i + 1}</text>
      <text class="t-step" y="48" text-anchor="middle">${esc(L.p.title)}</text><text class="t-year" y="68" text-anchor="middle">${esc(L.p.year)}</text>`;
    stepsG.appendChild(g); L.el = g;
  });

  return { W, H, REG, islands, levels, routeD, smooth };
})();
