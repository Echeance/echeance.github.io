/* Contenu de la bobine : photogrammes, narration, pellicule de navigation, amorce. */
(() => {
  const { D, esc, $, $$, sleep, reduce, img, chapterOf, isWip } = PF;
  const P = D.person;
  const world = $("#world");
  const frags = [];

  function add(html, meta) {
    const el = document.createElement("div");
    el.className = "frag"; el.innerHTML = html; world.appendChild(el);
    frags.push({ el, ...meta });
  }
  add(`<div class="opening"><p class="who">${esc(P.status)}, ${esc(P.city)}</p><h1>${esc(P.first)} <i>${esc(P.last)}</i></h1><p>${esc(P.hook)}</p></div>`,
    { side: 0, label: "Générique", narr: { idx: "Bobine 1", h: P.role, kind: P.school, sum: P.pitch } });

  D.projects.forEach((p, i) => {
    const n = String(i + 1).padStart(2, "0");
    const shot = p.images.length
      ? `<img src="${img(p.images[0])}" alt="${esc(p.title)}" loading="lazy">`
      : `<div class="blank"><div><b>${esc(p.title)}</b><small>${esc(p.kind)}</small></div></div>`;
    add(`<div class="frame"><div class="film"><span class="edge t"><span>NG 2026</span><span>▸ ${n}A</span><span>${esc(p.year)}</span></span>
        <div class="shot">${shot}</div><span class="edge b"><span>${n}</span><span>${esc(p.title.toUpperCase())}</span><span>${n}A ◂</span></span></div>
        <p class="note">${esc(p.hook)}</p></div>`,
      { side: i % 2 ? 1 : -1, roll: (i % 3 - 1) * 1.2, label: p.title, p, n });
  });
  add(`<div class="ending"><p class="who">la suite de la bobine…</p><h2>Le prochain souvenir, <i>on le tourne ensemble&nbsp;?</i></h2><p>${esc(P.looking)}</p>
    <div class="acts"><a href="mailto:${P.email}">${esc(P.email)}</a><a href="${P.links.github}" target="_blank" rel="noopener">GitHub</a><a href="${P.links.linkedin}" target="_blank" rel="noopener">LinkedIn</a></div></div>`,
    { side: 0, label: "Fin", narr: { idx: "Fin de bobine", h: "Ce que j'emporte", kind: P.soft.join(" · "), sum: P.languages.join(" · ") } });

  // mots : les compétences dérivent entre les souvenirs
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const words = [];
  D.skills.forEach(c => {
    const mk = (t, cls) => { const el = document.createElement("div"); el.className = "word " + cls; el.textContent = t; world.appendChild(el); return el; };
    c.items.forEach(n => words.push({ el: mk(n, ""), x: rnd() * 2 - 1, y: rnd() * 2 - 1, r: rnd(), max: .16 + rnd() * .22 }));
    words.push({ el: mk(c.cat, "cat"), x: (rnd() * 2 - 1) * .7, y: (rnd() * 2 - 1) * .7, r: rnd(), max: .6 });
  });

  /* pellicule de navigation */
  const strip = $("#strip");
  frags.forEach((f, i) => {
    const b = document.createElement("button");
    b.textContent = f.n || (i ? "FIN" : "▶"); b.dataset.t = f.label; b.setAttribute("aria-label", f.label);
    b.onclick = () => Tunnel.goTo(i); strip.appendChild(b); f.btn = b;
  });

  /* narration */
  const narr = $("#narr");
  function narrate(i) {
    const f = frags[i];
    frags.forEach((x, k) => { x.el.classList.toggle("on", k === i); x.btn.classList.toggle("on", k === i); if (k < i) x.btn.classList.add("seen"); });
    narr.classList.add("swap");
    setTimeout(() => {
      if (f.p) {
        const p = f.p, ch = chapterOf(p);
        narr.innerHTML = `<div><p class="idx">Photogramme ${f.n}${ch ? " · " + esc(ch.title) : ""}${isWip(p) ? " · en tournage" : ""}</p>
          <h2>${esc(p.title)}</h2><p class="kind">${esc(p.kind)} · ${esc(p.year)}</p><p class="sum">${esc(p.summary)}</p>
          ${p.numbers.length ? `<div class="nums">${p.numbers.map(([a, b]) => `<div><b>${esc(a)}</b><span>${esc(b)}</span></div>`).join("")}</div>` : ""}
          ${p.stack.length ? `<p class="kit">${p.stack.map(esc).join(" / ")}</p>` : ""}
          ${p.links.github ? `<a class="link" href="${p.links.github}" target="_blank" rel="noopener">voir le code →</a>` : ""}</div>`;
      } else {
        const n = f.narr;
        narr.innerHTML = `<div><p class="idx">${esc(n.idx)}</p><h2>${esc(n.h)}</h2><p class="kind">${esc(n.kind)}</p><p class="sum">${esc(n.sum)}</p></div>`;
      }
      narr.classList.remove("swap");
    }, narr.innerHTML ? 420 : 0);
    history.replaceState(null, "", i ? "#photogramme-" + i : location.pathname);
  }

  $("#reelName").textContent = `${P.first} ${P.last} — souvenirs de projets`;
  Tunnel.setup(frags, words, {
    onActive: narrate,
    onDepth: k => {
      const s = Math.round(k * 4 * 60);
      $("#timer").textContent = `Bobine 1 · ${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
      $("#hint").style.opacity = k > .02 ? 0 : 1;
      document.body.classList.toggle("leaking", k > .02);
    },
  });
  addEventListener("keydown", e => {
    if (["ArrowDown", "PageDown", "ArrowRight"].includes(e.key)) { e.preventDefault(); Tunnel.goTo(Math.min(frags.length - 1, Tunnel.nearest() + 1)); }
    if (["ArrowUp", "PageUp", "ArrowLeft"].includes(e.key)) { e.preventDefault(); Tunnel.goTo(Math.max(0, Tunnel.nearest() - 1)); }
  });

  /* amorce 3-2-1 */
  const leader = $("#leader");
  let done = false;
  const finish = () => { if (done) return; done = true; leader.classList.add("gone"); };
  async function countdown() {
    if (reduce || location.hash) return finish();
    const sweep = $(".sweep"), count = $("#count");
    for (const n of [3, 2, 1]) {
      if (done) return; count.textContent = n;
      await PF.tween(900, k => sweep.style.setProperty("--a", k * 360 + "deg"), t => t);
    }
    if (done) return;
    $(".dial").style.visibility = "hidden";
    const line = $("#leaderLine");
    line.innerHTML = "Tout commence par une ligne de code.".split(" ").map(w => `<span>${esc(w)} </span>`).join("");
    for (const s of $$("span", line)) { if (done) return; s.classList.add("v"); await sleep(220); }
    await sleep(1300); finish();
  }
  $("#skip").onclick = finish;
  addEventListener("wheel", finish, { passive: true });
  addEventListener("touchstart", finish, { passive: true });
  addEventListener("keydown", finish);

  history.scrollRestoration = "manual";
  const m = location.hash.match(/^#photogramme-(\d+)$/);
  requestAnimationFrame(() => {
    if (m && frags[+m[1]]) Tunnel.jump(+m[1]); else scrollTo(0, 0);
    Tunnel.start(); countdown();
  });
})();
