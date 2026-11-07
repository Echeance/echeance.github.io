/* Stations, émissions et cartes QSL. */
(() => {
  const { D, esc, $, $$, sleep, reduce, img, chapterOf, isWip } = PF;
  const P = D.person;

  /* ---------- Grille des stations ---------- */
  const list = [{ kind: "id", label: "NG · indicatif" }, ...D.projects.map(p => ({ kind: "p", label: p.title, p })), { kind: "skills", label: "Le studio" }, { kind: "contact", label: "QSL ?" }];
  const span = 107.2 - 88.2;
  list.forEach((s, i) => { s.f = +(88.2 + i * span / (list.length - 1)).toFixed(1); s.call = "NG-" + String(i).padStart(2, "0"); s.seed = i * 3 + 1; });
  Dial.build(list, onTune);

  /* ---------- Rendu d'une émission ---------- */
  const bc = $("#broadcast"), qsl = $("#qsl");
  let current = null;
  function render(st) {
    let h = "";
    const call = `<p class="call"><b>${st.call}</b><span>${st.f.toFixed(1)} MHz</span><span>${esc(st.label)}</span></p>`;
    if (st.kind === "id") {
      h = `${call}<h1>${esc(P.first)}<br>${esc(P.last)}</h1><p class="hook">${esc(P.hook)}</p><p class="sum">${esc(P.pitch)}</p>
        <p class="sum">${esc(P.status)} · ${esc(P.school)}. ${esc(P.looking)}</p><p class="kit">Tournez le bouton : chaque station diffuse un projet.</p>`;
    } else if (st.kind === "p") {
      const p = st.p, ch = chapterOf(p);
      h = `${call}<h1>${esc(p.title)}</h1><p class="hook">${esc(p.hook)}</p><p class="sum">${esc(p.summary)}</p>
        ${p.numbers.length ? `<div class="nums">${p.numbers.map(([a, b]) => `<div><b>${esc(a)}</b><span>${esc(b)}</span></div>`).join("")}</div>` : ""}
        <ul class="det">${p.details.map(d => `<li>${esc(d)}</li>`).join("")}</ul>
        <p class="kit">${esc(p.kind)} · ${esc(p.year)}${ch ? " · " + esc(ch.title) : ""}${p.stack.length ? " — " + p.stack.map(esc).join(" · ") : ""}</p>
        ${p.links.github ? `<a class="code" href="${p.links.github}" target="_blank" rel="noopener">Écouter le code source →</a>` : ""}`;
    } else if (st.kind === "skills") {
      h = `${call}<h1>Le studio</h1><p class="hook">Le matériel avec lequel j'émets.</p>
        <div class="skills">${D.skills.map(c => `<div><h3>${esc(c.cat)}</h3><p>${c.items.map(esc).join(", ")}</p></div>`).join("")}
        <div><h3>Langues</h3><p>${P.languages.map(esc).join(", ")}</p></div><div><h3>Qualités</h3><p>${P.soft.map(esc).join(", ")}</p></div></div>`;
    } else {
      h = `${call}<h1>QSL&nbsp;?</h1><p class="hook">Chez les radioamateurs, on confirme un contact par une carte. À vous d'envoyer la vôtre.</p><p class="sum">${esc(P.looking)}</p>
        <div class="contact"><a href="mailto:${P.email}"><span>Par e-mail</span><span>${esc(P.email)}</span></a>
        <a href="${P.links.github}" target="_blank" rel="noopener"><span>GitHub</span><span>github.com/${esc(P.handle)}</span></a>
        <a href="${P.links.linkedin}" target="_blank" rel="noopener"><span>LinkedIn</span><span>Nathan Ghys</span></a></div>`;
    }
    bc.innerHTML = h; bc.scrollTop = 0;
    renderQsl(st);
  }
  function renderQsl(st) {
    const p = st.p, pics = p ? p.images : [];
    const pic = pics.length ? `<img src="${img(pics[0])}" alt="${esc(p.title)}">${pics.length > 1 ? `<div class="pics">${pics.map((_, k) => `<button data-k="${k}" class="${k ? "" : "on"}" aria-label="Image ${k + 1}"></button>`).join("")}</div>` : ""}`
      : `<div class="blank">${esc(st.kind === "p" ? p.title : st.kind === "id" ? P.first + " " + P.last : st.label)}</div>`;
    const year = p ? p.year : "2026";
    qsl.classList.remove("in");
    qsl.innerHTML = `<span class="stamp">${st.f.toFixed(1)}</span><div class="pic">${pic}</div>
      <div class="row"><span class="callsign">${st.call}</span>
      <p class="mid">${p ? esc(p.kind) : "Station de " + esc(P.first) + " " + esc(P.last)}<i>${p && isWip(p) ? "Émission en direct, programme en construction" : "Merci pour le contact, signal reçu"}</i></p>
      <table><tr><td>MHz<b>${st.f.toFixed(1)}</b></td><td>Année<b>${esc(year.replace(/[^0-9→–\- ]/g, "").trim() || year)}</b></td><td>RST<b>5-9</b></td></tr></table></div>`;
    requestAnimationFrame(() => qsl.classList.add("in"));
    $$(".pics button", qsl).forEach(b => b.onclick = () => { $(".pic img", qsl).src = img(pics[+b.dataset.k]); $$(".pics button", qsl).forEach(x => x.classList.toggle("on", x === b)); });
  }
  function noise() {
    bc.innerHTML = `<p class="noise-msg">Pfffshhh<small>Entre deux stations. Tournez encore un peu.</small></p>`;
    qsl.classList.remove("in"); current = null;
  }

  /* ---------- À chaque image : lecture, vumètre, signal ---------- */
  const mhz = $("#mhz"), meter = $("#meter"), lampLock = $("#lampLock");
  meter.innerHTML = "<i></i>".repeat(14);
  const bars = $$("i", meter);
  bars.forEach((b, i) => (b.style.height = 20 + i * 5.7 + "%"));
  let last = -1;
  function onTune(f, st, s) {
    mhz.textContent = f.toFixed(1);
    const lit = Math.round(s * bars.length);
    bars.forEach((b, i) => { b.classList.toggle("on", i < lit); b.classList.toggle("hot", i >= bars.length - 3); });
    lampLock.classList.toggle("on", s > .75);
    Signal.set(s, st.seed);
    // la largeur du titre suit la force du signal
    bc.style.setProperty("--wd", (55 + s * 45).toFixed(0) + "%");
    bc.style.filter = s > .9 ? "none" : `blur(${((1 - s) * 5).toFixed(1)}px)`;
    bc.style.opacity = (.25 + s * .75).toFixed(2);
    const key = s > .5 ? list.indexOf(st) : -2;
    if (key !== last) {
      last = key;
      if (key >= 0) { current = st; render(st); $$(".scale .st").forEach((b, i) => b.classList.toggle("on", i === key)); history.replaceState(null, "", "#" + st.f.toFixed(1)); }
      else { noise(); $$(".scale .st").forEach(b => b.classList.remove("on")); }
    }
  }

  /* ---------- Commandes ---------- */
  $("#prev").onclick = () => Dial.step(-1);
  $("#next").onclick = () => Dial.step(1);
  addEventListener("keydown", e => {
    if (!document.body.classList.contains("on")) return;
    if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); Dial.step(1); }
    if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); Dial.step(-1); }
  });
  const snd = $("#sound");
  snd.onclick = () => { const on = Signal.toggleSound(); snd.setAttribute("aria-pressed", on); snd.textContent = on ? "Son allumé" : "Son coupé"; };
  $("#maker").textContent = `${P.first} ${P.last}`;

  /* ---------- Mise sous tension ---------- */
  const power = $("#power");
  let started = false;
  async function powerOn() {
    if (started) return; started = true;
    power.classList.add("gone");
    document.body.classList.add("on"); $("#lampOn").classList.add("on");
    Signal.start(); Dial.start();
    const m = location.hash.match(/^#(\d+\.\d)$/);
    const wanted = m ? list.find(s => s.f.toFixed(1) === m[1]) : null;
    if (reduce || wanted) { Dial.set((wanted || list[0]).f); return; }
    Dial.set(87.5);
    await sleep(500);
    await Dial.tuneTo(108, 1800);
    await Dial.tuneTo(list[0].f, 1400);
  }
  $("#powerBtn").onclick = powerOn;
  addEventListener("keydown", e => { if (!started && (e.key === "Enter" || e.key === " ")) powerOn(); });
  if (location.hash) powerOn();
})();
