/* Lumière, lecture des tirages, carnet de labo, porte d'entrée. */
(() => {
  const { D, esc, $, $$, sleep, reduce, img, chapterOf, isWip } = PF;
  const P = D.person;
  const view = $("#view"), book = $("#book"), lightBtn = $("#lightBtn");

  /* ---------- Lumière blanche ---------- */
  function setLight(on) {
    if (on === document.body.classList.contains("white")) return;
    if (on && !reduce) { document.body.classList.add("flicker"); setTimeout(() => document.body.classList.remove("flicker"), 750); }
    document.body.classList.toggle("white", on);
    lightBtn.setAttribute("aria-pressed", on);
    lightBtn.textContent = on ? "Éteindre la lumière" : "Allumer la lumière";
  }
  lightBtn.onclick = () => { if (Lab.isBusy() && !document.body.classList.contains("white")) { flash("Pas pendant un développement : le papier serait voilé."); return; } setLight(!document.body.classList.contains("white")); };

  const sign = $("#sign");
  let st;
  function flash(t) { sign.textContent = t; clearTimeout(st); st = setTimeout(() => (sign.textContent = signText()), 3200); }
  const signText = () => `${Lab.revealed()} tirage${Lab.revealed() > 1 ? "s" : ""} sur ${D.projects.length} révélé${Lab.revealed() > 1 ? "s" : ""}`;

  /* ---------- Lecture d'un tirage (recto : image, verso : notes) ---------- */
  function open(p, i) {
    setLight(true);
    const ch = chapterOf(p), pics = p.images;
    view.innerHTML = `<figure class="big">${pics.length ? `<img id="vimg" src="${img(pics[0])}" alt="${esc(p.title)}">` : `<div class="blank">${esc(p.title)}</div>`}
        <figcaption><span>${esc(p.title)} — ${esc(p.year)}</span>${pics.length > 1 ? `<span class="dots">${pics.map((_, k) => `<button data-k="${k}" class="${k ? "" : "on"}" aria-label="Image ${k + 1}"></button>`).join("")}</span>` : ""}</figcaption></figure>
      <article class="back">
        <p class="ref">Tirage n° ${String(i + 1).padStart(2, "0")}${ch ? " · " + esc(ch.title) : ""}${isWip(p) ? " · encore humide" : ""}</p>
        <h2>${esc(p.title)}</h2><p class="kind">${esc(p.kind)}</p>
        <p class="hook">${esc(p.hook)}</p>
        <p class="sum">${esc(p.summary)}</p>
        ${p.numbers.length ? `<div class="nums">${p.numbers.map(([a, b]) => `<div><b>${esc(a)}</b><span>${esc(b)}</span></div>`).join("")}</div>` : ""}
        <ul>${p.details.map(d => `<li>${esc(d)}</li>`).join("")}</ul>
        ${p.stack.length ? `<p class="kit">Révélé avec : ${p.stack.map(esc).join(", ")}</p>` : ""}
        <p class="kit">Ce que j'en garde : ${esc(p.learnings)}</p>
        <div class="acts"><button data-nav="-1">← Tirage précédent</button>${p.links.github ? `<a href="${p.links.github}" target="_blank" rel="noopener">Le code</a>` : ""}<button data-nav="1">Tirage suivant →</button><button data-close>Retour à la lampe rouge</button></div>
      </article>`;
    view.classList.add("open");
    $$(".dots button", view).forEach(b => b.onclick = () => { $("#vimg").src = img(pics[+b.dataset.k]); $$(".dots button", view).forEach(x => x.classList.toggle("on", x === b)); });
    $$("[data-nav]", view).forEach(b => b.onclick = () => { const j = (i + +b.dataset.nav + D.projects.length) % D.projects.length; open(D.projects[j], j); });
    $("[data-close]", view).onclick = closeView;
    history.replaceState(null, "", "#tirage-" + (i + 1));
  }
  function closeView() { view.classList.remove("open"); setLight(false); history.replaceState(null, "", location.pathname); }
  view.addEventListener("click", e => { if (e.target === view) closeView(); });

  /* ---------- Carnet de labo (compétences + contact) ---------- */
  function openBook(section) {
    book.innerHTML = `<button class="x" aria-label="Fermer">×</button>
      <h2>Carnet de labo</h2><p class="sub">${esc(P.first)} ${esc(P.last)} — ${esc(P.role)}, ${esc(P.school)}</p>
      ${section === "order" ? `<h3>Commander un tirage</h3><p class="items">${esc(P.looking)} Pour un stage, une alternance ou un projet :</p>
        <div class="contact"><a href="mailto:${P.email}">${esc(P.email)}</a><a href="${P.links.github}" target="_blank" rel="noopener">github.com/${esc(P.handle)}</a><a href="${P.links.linkedin}" target="_blank" rel="noopener">LinkedIn</a></div>` : ""}
      <h3>Les produits du labo</h3>
      ${D.skills.map(c => `<p class="items"><b>${esc(c.cat)} :</b> ${c.items.map(esc).join(", ")}.</p>`).join("")}
      <h3>Le tour de main</h3><p class="items">${P.soft.map(esc).join(", ")}.</p>
      <h3>Langues</h3><p class="items">${P.languages.map(esc).join(" · ")}</p>`;
    book.classList.add("open");
    $(".x", book).onclick = () => book.classList.remove("open");
  }
  $("#notebook").onclick = () => openBook("skills");
  $("#order").onclick = () => openBook("order");

  addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    if (book.classList.contains("open")) book.classList.remove("open");
    else if (view.classList.contains("open")) closeView();
  });

  Lab.build({
    onOpen: open,
    onDone: n => { sign.textContent = signText(); if (n === D.projects.length) flash("Toute la pellicule est révélée. Le carnet de labo vous attend."); },
  });
  sign.textContent = signText();

  /* ---------- La porte ---------- */
  const door = $("#door");
  $("#doorWho").textContent = `de ${P.first} ${P.last}, ${P.role.toLowerCase()}`;
  setLight(true);
  async function enter() {
    door.classList.add("gone");
    setLight(false);
    if (!reduce) {
      const sl = $("#safelight"); sl.style.transition = "opacity 2.4s"; sl.style.opacity = 0;
      await sleep(60); sl.style.opacity = 1; await sleep(2400); sl.style.transition = ""; sl.style.opacity = "";
    }
    const m = location.hash.match(/^#tirage-(\d+)$/);
    if (m && D.projects[m[1] - 1]) open(D.projects[m[1] - 1], m[1] - 1);
    else if (!reduce) { await sleep(500); Lab.develop(D.projects.findIndex(p => p.id === "avenoir")); flash("Premier tirage : le projet en cours."); }
  }
  $("#doorBtn").onclick = enter;
  if (location.hash) enter();
})();
