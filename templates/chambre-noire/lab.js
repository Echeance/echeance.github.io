/* Le laboratoire : planche contact, développement dans les bacs, séchage sur le fil. */
window.Lab = (() => {
  const { D, esc, $, $$, sleep, reduce, img } = PF;
  const negs = $("#negs"), hung = $("#hung"), paper = $("#paper"), print = $("#print"), timer = $("#timer");
  const trays = $$(".tray"), baths = trays.map(t => $(".bath", t)), turb = document.getElementById("turb");
  let busy = false, onOpen = () => {}, onDone = () => {};
  const done = new Set();

  function build(cbs) {
    onOpen = cbs.onOpen; onDone = cbs.onDone;
    negs.innerHTML = D.projects.map((p, i) => `<div class="neg" tabindex="0" role="button" data-i="${i}" aria-label="Révéler ${esc(p.title)}">
      <div class="im">${p.images.length ? `<img src="${img(p.images[0])}" alt="">` : `<div class="blankneg">${esc(p.title)}</div>`}</div>
      <small><span>${String(i + 1).padStart(2, "0")}A</span><span>${esc(p.title.slice(0, 12))}</span></small></div>`).join("");
    $$(".neg", negs).forEach(n => {
      const go = () => develop(+n.dataset.i);
      n.addEventListener("click", go);
      n.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
    });
  }

  /* agitation du bac : maintenir le pointeur dessus accélère la révélation */
  let agitate = false;
  baths[0].addEventListener("pointerenter", () => (agitate = true));
  baths[0].addEventListener("pointerleave", () => (agitate = false));
  baths[0].addEventListener("touchstart", () => (agitate = true), { passive: true });
  baths[0].addEventListener("touchend", () => (agitate = false));

  async function develop(i) {
    if (busy) return;
    const p = D.projects[i];
    if (done.has(i)) { onOpen(p, i); return; }
    busy = true;
    trays.forEach((t, k) => t.classList.toggle("active", k === 0));
    baths[0].appendChild(paper);
    paper.style.setProperty("--b", 4); paper.style.setProperty("--c", .1);
    if (p.images.length) { print.src = img(p.images[0]); print.style.display = ""; paper.style.background = ""; }
    else { print.style.display = "none"; }
    paper.dataset.title = p.title;
    await sleep(40); paper.classList.add("in");
    // révélation : l'image monte du blanc, plus vite si on agite
    let k = 0, last = performance.now(), ph = 0;
    await new Promise(res => {
      const step = now => {
        const dt = now - last; last = now;
        k = Math.min(1, k + dt / (reduce ? 1 : agitate ? 1500 : 4200));
        ph += dt * (agitate ? .004 : .0012);
        if (turb) turb.setAttribute("baseFrequency", `${(.012 + Math.sin(ph) * .004).toFixed(4)} ${(.03 + Math.cos(ph * .7) * .01).toFixed(4)}`);
        const e = PF.ease.out(k);
        paper.style.setProperty("--b", (4 - 3 * e).toFixed(3));
        paper.style.setProperty("--c", (.1 + .9 * e).toFixed(3));
        timer.textContent = `${Math.round(k * 60)} s`;
        k < 1 ? requestAnimationFrame(step) : res();
      };
      requestAnimationFrame(step);
    });
    for (const s of [1, 2]) {
      await sleep(reduce ? 0 : 350);
      paper.classList.remove("in"); await sleep(reduce ? 0 : 250);
      baths[s].appendChild(paper); trays.forEach((t, k2) => t.classList.toggle("active", k2 === s));
      await sleep(30); paper.classList.add("in");
      timer.textContent = s === 1 ? "arrêt" : "fixage";
      await sleep(reduce ? 0 : 700);
    }
    paper.classList.remove("in"); trays.forEach(t => t.classList.remove("active")); timer.textContent = "—";
    await sleep(reduce ? 0 : 300);
    hang(i, true);
    done.add(i); $(`.neg[data-i="${i}"]`).classList.add("used");
    busy = false; onDone(done.size);
  }

  function hang(i, fresh) {
    const p = D.projects[i], n = D.projects.length;
    const slot = D.projects.indexOf(p), t = (slot + .5) / n;
    const el = document.createElement("button");
    el.className = "print" + (fresh ? " fresh" : "");
    el.style.left = `calc(${(t * 100).toFixed(2)}% - clamp(45px, 4.5vw, 70px))`;
    el.style.top = `${(4 * 22 * t * (1 - t)).toFixed(1)}px`;
    el.style.animationDelay = fresh ? "" : `${-Math.random() * 4}s`;
    el.setAttribute("aria-label", `Regarder le tirage ${p.title}`);
    el.innerHTML = `${p.images.length ? `<img src="${img(p.images[0])}" alt="">` : `<div class="blank">${esc(p.title)}</div>`}<span>${esc(p.title)}</span>`;
    el.onclick = () => onOpen(p, i);
    hung.appendChild(el);
  }

  return { build, develop, revealed: () => done.size, isBusy: () => busy };
})();
