/* Interface de l'atlas : ouverture dessinée, fiches d'étape, légende, lettre. */
(() => {
  const { D, esc, $, $$, sleep, reduce, img, chapterOf, isWip } = PF;
  const { levels, REG } = World;
  const P = D.person;

  /* ---------- Fiche d'étape ---------- */
  const sheet = $("#sheet");
  let sel = -1;
  function open(i) {
    i = (i + levels.length) % levels.length; sel = i;
    const L = levels[i], p = L.p, ch = chapterOf(p);
    levels.forEach((x, k) => x.el.classList.toggle("sel", k === i));
    const wide = innerWidth > 760, sw = Math.min(500, innerWidth);
    const z = Math.max(1.1, Math.min(1.6, innerHeight / 720));
    Cam.flyTo({ x: L.x + (wide ? (sw / 2 + 20) / z : 0), y: L.y + (wide ? 0 : innerHeight * .2 / z), z }, 1500);
    const pics = p.images;
    sheet.innerHTML = `<div class="scroll">
      <div class="s-top"><span>${esc(REG[L.rid].name)}${ch ? " · chapitre " + ch.n : ""}</span><button class="s-x" aria-label="Fermer">×</button></div>
      <p class="s-no">${i + 1}<span style="font-size:.3em;color:var(--faded)"> / ${levels.length}</span></p>
      <h2>${esc(p.title)}</h2>
      <p class="s-kind">${esc(p.kind)} — ${esc(p.year)}${isWip(p) ? " · en chantier" : ""}</p>
      <p class="s-hook">${esc(p.hook)}</p>
      ${pics.length ? `<figure class="engrave" title="Cliquer pour voir en couleur"><img src="${img(pics[0])}" alt="${esc(p.title)}"><figcaption><span>Gravure d'après nature · cliquer pour la couleur</span>${pics.length > 1 ? `<span class="dots">${pics.map((_, k) => `<button data-k="${k}" class="${k ? "" : "on"}" aria-label="Image ${k + 1}"></button>`).join("")}</span>` : ""}</figcaption></figure>` : ""}
      <p class="s-sum">${esc(p.summary)}</p>
      ${p.numbers.length ? `<h3>Relevés</h3><div class="relev">${p.numbers.map(([n, l]) => `<div><b>${esc(n)}</b><span>${esc(l)}</span></div>`).join("")}</div>` : ""}
      <h3>Journal de bord</h3><ul>${p.details.map(d => `<li>${esc(d)}</li>`).join("")}</ul>
      ${p.stack.length ? `<h3>Instruments</h3><p class="kit">${p.stack.map(s => `<span>${esc(s)}</span>`).join("")}</p>` : ""}
      <p class="s-moral">Ce que j'en rapporte : ${esc(p.learnings)}</p>
    </div>
    <div class="s-foot"><button data-go="-1">◂ Étape précédente</button>${p.links.github ? `<a class="go" href="${p.links.github}" target="_blank" rel="noopener">Le code</a>` : ""}<button data-go="1">Étape suivante ▸</button></div>`;
    sheet.classList.add("open");
    $(".s-x", sheet).onclick = close;
    $$("[data-go]", sheet).forEach(b => b.onclick = () => open(sel + +b.dataset.go));
    const fig = $(".engrave", sheet);
    if (fig) {
      const im = $("img", fig);
      fig.addEventListener("click", e => { if (!e.target.closest(".dots")) fig.classList.toggle("color"); });
      $$(".dots button", fig).forEach(b => b.onclick = () => { im.src = img(pics[+b.dataset.k]); $$(".dots button", fig).forEach(x => x.classList.toggle("on", x === b)); });
    }
    $(".scroll", sheet).scrollTop = 0;
    history.replaceState(null, "", "#etape-" + (i + 1));
  }
  function close() {
    sel = -1; sheet.classList.remove("open"); levels.forEach(x => x.el.classList.remove("sel"));
    Cam.overview(1200); history.replaceState(null, "", location.pathname);
  }
  levels.forEach((L, i) => {
    L.el.addEventListener("click", e => { e.stopPropagation(); if (!Cam.wasDrag()) open(i); });
    L.el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(i); } });
  });
  $("#world").addEventListener("click", () => { if (sel >= 0 && !Cam.wasDrag()) close(); });

  /* ---------- Légende (compétences) ---------- */
  const glyphs = [
    `<circle cx="11" cy="11" r="8" fill="none" stroke="#2b2420" stroke-width="1.5"/><circle cx="11" cy="11" r="2.5" fill="#b3341f"/>`,
    `<path d="M3 18 L11 4 L19 18Z" fill="none" stroke="#2b2420" stroke-width="1.5"/>`,
    `<rect x="4" y="4" width="14" height="14" fill="url(#hatch)" stroke="#2b2420" stroke-width="1.5"/>`,
    `<path d="M11 2 L13 9 L20 11 L13 13 L11 20 L9 13 L2 11 L9 9Z" fill="#2b2420"/>`,
    `<path d="M3 15 Q11 3 19 15" fill="none" stroke="#2b2420" stroke-width="1.5"/><path d="M3 18 H19" stroke="#2b2420" stroke-width="1.5"/>`,
    `<circle cx="11" cy="11" r="8" fill="none" stroke="#b3341f" stroke-width="1.5" stroke-dasharray="3 3"/><path d="M11 3 V19 M3 11 H19" stroke="#2b2420"/>`,
  ];
  $("#legendBody").innerHTML = D.skills.map((c, i) => `<div><h3><svg viewBox="0 0 22 22">${glyphs[i % glyphs.length]}</svg>${esc(c.cat)}</h3><p>${c.items.map(esc).join(", ")}.</p></div>`).join("") +
    `<div><h3><svg viewBox="0 0 22 22">${glyphs[3]}</svg>Qualités du voyageur</h3><p>${P.soft.map(esc).join(", ")}.</p></div>
     <div><h3><svg viewBox="0 0 22 22">${glyphs[4]}</svg>Langues parlées</h3><p>${P.languages.map(esc).join(" ; ")}.</p></div>`;

  /* ---------- Lettre (contact) ---------- */
  $("#lDate").textContent = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  $("#lLinks").innerHTML = `<a href="mailto:${P.email}"><span>Par courrier électronique</span><span>${esc(P.email)}</span></a>
    <a href="${P.links.github}" target="_blank" rel="noopener"><span>Les archives du code</span><span>github.com/${esc(P.handle)}</span></a>
    <a href="${P.links.linkedin}" target="_blank" rel="noopener"><span>Le registre professionnel</span><span>LinkedIn</span></a>`;
  $("#seal").href = "mailto:" + P.email;
  let tok = 0;
  async function write(el, text) { const t = ++tok; el.textContent = ""; for (const c of text) { if (t !== tok) return; el.textContent += c; if (!reduce) await sleep(c === "\n" ? 260 : 16); } }

  function openOv(id) {
    $$(".ov").forEach(o => o.classList.toggle("open", o.id === id));
    if (id === "letter") write($("#lBody"), `Cher lecteur,\n\n${P.hook} ${P.status}, ${P.school}. ${P.looking}\nLa prochaine étape de cette carte, je la tracerais volontiers avec vous.\n\nN. Ghys`);
  }
  $$("[data-ov]").forEach(b => b.onclick = () => openOv(b.dataset.ov));
  $$(".ov").forEach(o => o.addEventListener("click", e => { if (e.target === o || e.target.closest(".ov-x")) o.classList.remove("open"); }));
  $("#recenter").onclick = () => (sel >= 0 ? close() : Cam.overview());

  addEventListener("keydown", e => {
    if (!ready) return;
    const k = e.key;
    if (k === "Escape") { const o = $(".ov.open"); o ? o.classList.remove("open") : sel >= 0 && close(); }
    if ($(".ov.open")) return;
    if (k === "ArrowRight") open(sel + 1);
    if (k === "ArrowLeft") open(sel < 0 ? levels.length - 1 : sel - 1);
  });

  $("#cName").textContent = `${P.first} ${P.last}`;
  $("#cRole").textContent = P.role;

  /* ---------- Ouverture : la carte se dessine à l'encre ---------- */
  let ready = false;
  async function intro() {
    const inks = $$("#cam path.ink, #cam line.ink"), texts = $$("#cam .ink-t, #cam .t-grid"), route = $("#route");
    Cam.set({ x: World.W / 2, y: World.H / 2, z: Cam.fitZ() * 1.25 });
    if (!reduce) {
      inks.forEach(p => { const L = p.getTotalLength ? p.getTotalLength() : 0; p.style.strokeDasharray = L; p.style.strokeDashoffset = L; p.style.fillOpacity = 0; });
      texts.forEach(t => (t.style.opacity = 0));
      const rl = route.getTotalLength(); route.style.strokeDasharray = `0 ${rl}`;
      await sleep(300);
      inks.forEach((p, i) => { p.style.transition = `stroke-dashoffset ${1.6 + Math.random()}s ease ${(i % 40) * 0.03}s, fill-opacity 1s ease 1.6s`; p.style.strokeDashoffset = 0; p.style.fillOpacity = 1; });
      Cam.overview(4200);
      await sleep(1700);
      texts.forEach((t, i) => { t.style.transition = `opacity .9s ease ${i * 0.02}s`; t.style.opacity = 1; });
      await sleep(600);
      const t0 = performance.now();
      await new Promise(res => { const st = now => { const k = Math.min(1, (now - t0) / 1800); route.style.strokeDasharray = `${k * rl} ${rl}`; k < 1 ? requestAnimationFrame(st) : res(); }; requestAnimationFrame(st); });
      route.style.strokeDasharray = "";
    } else Cam.overview(0);
    levels.forEach((L, i) => setTimeout(() => { L.el.classList.remove("ink"); L.el.classList.add("stamp"); }, reduce ? 0 : i * 110));
    $("#draft").classList.add("gone");
    await sleep(reduce ? 0 : levels.length * 110 + 300);
    $("#cartouche").classList.add("on");
    ready = true;
    const m = location.hash.match(/^#etape-(\d+)$/); if (m && levels[m[1] - 1]) open(m[1] - 1);
  }
  intro();
})();
