/* Mise en page : construit les planches et la liste des cases à suivre, dans l'ordre de lecture. */
window.Layout = (() => {
  const { D, esc, img, chapterOf, isWip } = PF;
  const P = D.person;
  const PW = 1000, M = 34, G = 18, PAGE_GAP = 160;
  const TINTS = ["#f6d75a", "#9cc9e6", "#f3a7b1", "#b9dca0"];
  const comic = document.getElementById("comic");
  const shots = [], pages = [];
  let y0 = 0, tintI = 0;
  const tint = () => TINTS[tintI++ % TINTS.length];

  /* rows : [{h, cells:[{f, html, cls, tint, note, label}]}] */
  function page(rows, folio) {
    const h = M * 2 + rows.reduce((s, r) => s + r.h, 0) + G * (rows.length - 1) + 30;
    const pg = document.createElement("section");
    pg.className = "pg"; pg.style.cssText = `left:0;top:${y0}px;width:${PW}px;height:${h}px`;
    pg.innerHTML = `<p class="folio">— ${folio} —</p>`;
    comic.appendChild(pg);
    pages.push({ x: 0, y: y0, w: PW, h });
    let y = M;
    rows.forEach(r => {
      let x = M; const W = PW - M * 2 - G * (r.cells.length - 1);
      r.cells.forEach(c => {
        const w = Math.round(W * c.f);
        const el = document.createElement("div");
        el.className = "pan " + (c.cls || "");
        el.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${r.h}px;--tint:${c.tint || tint()}`;
        el.innerHTML = c.html;
        pg.appendChild(el);
        shots.push({ el, rect: { x, y: y0 + y, w, h: r.h }, note: c.note, label: c.label });
        x += w + G;
      });
      y += r.h + G;
    });
    y0 += h + PAGE_GAP;
  }
  // visuels sur fond sombre (schémas, terminaux) : inversés pour devenir de l'encre sur papier
  const INK = /schema|300|rewind|archi|scores|procxygen|avenoir-cli/;
  const art = (file, pos = "50% 50%") => `<div class="art${INK.test(file) ? " inv" : ""}"><img src="${file}" alt="" style="object-position:${pos}" loading="lazy"></div>`;
  const cap = (t, style, cls = "", d = 0) => `<p class="cap pop ${cls}" style="${style};--d:${d}">${t}</p>`;
  const bub = (who, t, style, cls = "", d = 300) => `<p class="bub pop ${cls}" style="${style};--d:${d}">${who ? `<i>${esc(who)}</i>` : ""}${esc(t)}</p>`;
  const sfx = (big, small, style, d = 550) => `<p class="sfx pop" style="${style};--d:${d}">${esc(big)}${small ? `<small>${esc(small)}</small>` : ""}</p>`;
  const noteOf = p => ({ title: p.title, kind: `${p.kind} · ${p.year}`, sum: p.summary, details: p.details, stack: p.stack, link: p.links.github, learn: p.learnings });

  /* ---------- Couverture ---------- */
  page([
    { h: 1060, cells: [{ f: 1, cls: "cover", tint: "#f3a7b1", label: "Couverture",
      html: `${art(PF.ROOT + "assets/people/nathan.webp", "50% 25%")}
        <div class="mast pop"><h1>${esc(P.first)}<br>${esc(P.last)}</h1><p class="iss">N°<b>1</b>Arles<br>2026</p></div>
        <p class="tagline pop" style="--d:400">Dans : <em>« ${esc(P.hook)} »</em></p>`,
      note: { title: "Au sommaire", sum: `${P.status}, ${P.school}. ${P.looking}`, details: D.chapters.map(c => `Chapitre ${c.n} : ${c.title} (${c.years})`) } }] },
    { h: 300, cells: [
      { f: .58, cls: "flat", tint: "#9cc9e6", label: "Précédemment",
        html: `<div class="speed"></div>${cap("Précédemment…", "left:18px;top:18px")}${bub("Nathan", P.hook, "right:22px;bottom:26px;max-width:80%;font-size:19px")}`,
        note: { title: "Le héros", sum: P.pitch } },
      { f: .42, cls: "flat", tint: "#f6d75a", label: "Le héros",
        html: `${sfx("BUT", "Informatique · 2e année", "left:22px;top:26px")}${cap(esc(P.school), "left:18px;bottom:18px", "small", 500)}`,
        note: { title: "Sa formation", sum: `${P.status} — ${P.school}.`, details: P.languages } },
    ] },
  ], "1");

  /* ---------- Un épisode par chapitre ---------- */
  let folio = 2;
  D.chapters.forEach(ch => {
    const ps = D.projects.filter(p => p.chapter === ch.id);
    const rows = [{ h: 170, cells: [{ f: 1, cls: "chap", tint: "#141210", label: `Chapitre ${ch.n}`,
      html: `<b class="pop">${ch.n}</b><div class="pop" style="--d:150"><h2>${esc(ch.title)}</h2><p>${esc(ch.line)}</p></div>`,
      note: { title: `Chapitre ${ch.n} · ${ch.years}`, sum: ch.line } }] }];
    const big = ps.filter(p => p.featured), small = ps.filter(p => !p.featured);
    big.forEach((p, i) => {
      const left = i % 2 === 0, n = p.numbers[0];
      rows.push({ h: 470, cells: [{ f: 1, label: p.title, note: noteOf(p),
        html: `${p.images.length ? art(img(p.images[0])) : `<div class="art"></div>`}
          ${cap(`${esc(p.title)} — ${esc(p.kind)}`, left ? "left:18px;top:18px" : "right:18px;top:18px")}
          ${bub(isWip(p) ? "Nathan, en direct" : "Nathan", p.hook, left ? "right:26px;bottom:30px" : "left:26px;bottom:30px", left ? "" : "tl")}
          ${n ? sfx(n[0], n[1], left ? "left:30px;bottom:34px" : "right:40px;top:80px") : ""}` }] });
    });
    for (let i = 0; i < small.length; i += 2) {
      const pair = small.slice(i, i + 2);
      rows.push({ h: 330, cells: pair.map(p => ({ f: 1 / pair.length, label: p.title, note: noteOf(p),
        html: `${p.images.length ? art(img(p.images[0])) : `<div class="speed"></div>`}${cap(esc(p.title), "left:14px;top:14px", "small")}${bub("", p.hook, "right:16px;bottom:18px;max-width:80%;font-size:17px;padding:16px 18px")}` })) });
    }
    page(rows, String(folio++));
  });

  /* ---------- Dernière planche : inventaire et suite ---------- */
  page([
    { h: 420, cells: [{ f: 1, cls: "flat", tint: "#b9dca0", label: "L'inventaire",
      html: `${cap("L'inventaire du héros", "left:18px;top:18px")}
        <div class="pop" style="position:absolute;left:24px;right:24px;top:84px;display:grid;grid-template-columns:repeat(3,1fr);gap:12px 22px;--d:200">
        ${D.skills.map(c => `<div><p style="font:400 22px/1 var(--sfx)">${esc(c.cat)}</p><p style="font:600 15px/1.35 var(--letter);margin-top:4px">${c.items.map(esc).join(", ")}</p></div>`).join("")}</div>`,
      note: { title: "Qualités", sum: P.soft.join(" · ") } }] },
    { h: 520, cells: [
      { f: .5, tint: "#f3a7b1", label: "À suivre", html: `${art(PF.ROOT + "assets/people/nathan.webp", "50% 22%")}${bub("Nathan", "Et le prochain épisode, on l'écrit ensemble ?", "left:20px;top:22px;max-width:80%")}`,
        note: { title: "À suivre…", sum: P.looking } },
      { f: .5, cls: "flat", tint: "#f6d75a", label: "Contact",
        html: `<div class="speed"></div>${sfx("À SUIVRE !", "", "left:24px;top:30px;font-size:58px")}
          <div class="pop" style="position:absolute;left:24px;right:24px;bottom:26px;display:grid;gap:10px;--d:400">
          ${[["mailto:" + P.email, P.email], [P.links.github, "GitHub · " + P.handle], [P.links.linkedin, "LinkedIn"]].map(([h, t]) => `<a href="${h}" ${h.startsWith("http") ? 'target="_blank" rel="noopener"' : ""} style="display:block;background:#fff;border:3px solid var(--ink);box-shadow:4px 4px 0 var(--ink);padding:10px 14px;font:800 18px var(--letter);text-decoration:none">${esc(t)}</a>`).join("")}</div>`,
        note: { title: "Écrire à l'auteur", sum: `${P.email} — ${P.looking}` } },
    ] },
  ], String(folio));

  comic.style.width = PW + "px"; comic.style.height = y0 + "px";
  return { shots, pages, total: { w: PW, h: y0 - PAGE_GAP } };
})();
