/* Lecture : case suivante / précédente, vue planche, notes de l'éditeur, ouverture. */
(() => {
  const { esc, $, $$, reduce, sleep } = PF;
  const { shots, pages, total } = Layout;
  const note = $("#note"), pos = $("#pos");
  let cur = -1, pageView = false, lock = false;

  function pageOf(r) { return pages.find(p => r.y >= p.y && r.y < p.y + p.h) || pages[0]; }

  function showNote(n) {
    document.body.classList.toggle("noted", !!n);
    if (!n) { note.classList.remove("on"); return; }
    note.innerHTML = `<h3>Note de l'éditeur${n.kind ? " · " + esc(n.kind) : ""}</h3>
      ${n.title ? `<p><b>${esc(n.title)}.</b> ${esc(n.sum || "")}</p>` : `<p>${esc(n.sum || "")}</p>`}
      ${n.details ? `<ul>${n.details.map(d => `<li>${esc(d)}</li>`).join("")}</ul>` : ""}
      ${n.stack && n.stack.length ? `<p class="kit">Matériel : ${n.stack.map(esc).join(", ")}</p>` : ""}
      ${n.learn ? `<p class="kit">Leçon de l'épisode : ${esc(n.learn)}</p>` : ""}
      ${n.link ? `<a href="${n.link}" target="_blank" rel="noopener">Lire le code</a>` : ""}`;
    note.classList.remove("on"); void note.offsetWidth; note.classList.add("on");
  }

  async function go(i) {
    i = Math.max(0, Math.min(shots.length - 1, i));
    if (i === cur && !pageView) return;
    const prev = shots[cur];
    pageView = false; document.body.classList.remove("pageview");
    if (prev) { prev.el.classList.remove("cur"); prev.el.classList.add("seen"); }
    cur = i;
    const s = shots[i];
    // changement de planche : on recule d'abord pour voir la page entière, puis on plonge
    if (prev && pageOf(prev.rect) !== pageOf(s.rect) && !reduce) {
      lock = true; showNote(null);
      await Camera.fly(pageOf(s.rect), 900, 60);
      await sleep(250);
      lock = false;
    }
    showNote(s.note);
    Camera.fly(s.rect, 950);
    s.el.classList.add("cur");
    pos.textContent = s.label || "";
    history.replaceState(null, "", "#case-" + (i + 1));
  }
  function togglePage() {
    if (pageView) return go(cur);
    pageView = true; document.body.classList.add("pageview"); showNote(null);
    Camera.fly(pageOf(shots[Math.max(cur, 0)].rect), 900, 40);
    pos.textContent = "Vue planche — cliquer une case";
  }
  shots.forEach((s, i) => s.el.addEventListener("click", e => { if (e.target.closest("a")) return; if (i !== cur || pageView) go(i); }));

  $("#next").onclick = () => go(cur + 1);
  $("#prev").onclick = () => go(cur - 1);
  $("#page").onclick = togglePage;
  addEventListener("keydown", e => {
    if (["ArrowRight", "ArrowDown", " ", "PageDown", "Enter"].includes(e.key)) { e.preventDefault(); go(cur + 1); }
    if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) { e.preventDefault(); go(cur - 1); }
    if (e.key.toLowerCase() === "p" || e.key === "Escape") togglePage();
  });
  // molette : une case par cran (avec un petit temps mort)
  let wt = 0;
  addEventListener("wheel", e => { e.preventDefault(); const now = Date.now(); if (now - wt < 650 || lock) return; wt = now; go(cur + (e.deltaY > 0 ? 1 : -1)); }, { passive: false });
  // glissé tactile
  let tx = null;
  addEventListener("touchstart", e => (tx = [e.touches[0].clientX, e.touches[0].clientY]), { passive: true });
  addEventListener("touchend", e => { if (!tx) return; const dx = e.changedTouches[0].clientX - tx[0], dy = e.changedTouches[0].clientY - tx[1]; if (Math.max(Math.abs(dx), Math.abs(dy)) > 40) go(cur + ((Math.abs(dx) > Math.abs(dy) ? dx : dy) < 0 ? 1 : -1)); tx = null; });
  addEventListener("resize", () => { if (cur >= 0) (pageView ? Camera.jump(pageOf(shots[cur].rect), 40) : Camera.jump(shots[cur].rect)); });

  /* ouverture : on voit toute la BD posée sur la table, puis la caméra plonge sur la couverture */
  async function intro() {
    const m = location.hash.match(/^#case-(\d+)$/);
    if (m && shots[m[1] - 1]) { Camera.jump(shots[m[1] - 1].rect); return go(m[1] - 1); }
    Camera.jump({ x: -total.w * .6, y: 0, w: total.w * 2.2, h: total.h }, 0);
    if (reduce) return go(0);
    await sleep(500);
    document.body.classList.add("pageview");
    await Camera.fly(pages[0], 1700, 50);
    await sleep(600);
    document.body.classList.remove("pageview");
    go(0);
  }
  intro();
})();
