/* Cadran : graduations, stations, aiguille, bouton rotatif et accord « magnétique ». */
window.Dial = (() => {
  const { clamp, reduce, esc } = PF;
  const MIN = 87.5, MAX = 108;
  const scale = document.getElementById("scale"), needle = document.getElementById("needle"), glass = scale.parentElement, knob = document.getElementById("knob");
  let stations = [], onChange = () => {};
  let f = MIN, target = MIN, idle = 0, sweeping = null;

  const pct = x => (x - MIN) / (MAX - MIN);
  function build(list, cb) {
    stations = list; onChange = cb;
    let s = "";
    for (let x = 88; x <= 108; x += .5) {
      const major = Math.abs(x % 2) < .01;
      s += `<i class="tick ${major ? "major" : ""}" style="left:${pct(x) * 100}%;height:${major ? 22 : 11}px"></i>`;
      if (major) s += `<span class="num" style="left:${pct(x) * 100}%">${x}</span>`;
    }
    stations.forEach((st, i) => { s += `<span class="dot" style="left:${pct(st.f) * 100}%"></span><button class="st" data-i="${i}" style="left:${pct(st.f) * 100}%">${esc(st.label)}</button>`; });
    scale.innerHTML = s;
    scale.querySelectorAll(".st").forEach(b => b.onclick = () => tuneTo(stations[+b.dataset.i].f));
  }

  /* Accord animé (balayage de l'aiguille) */
  function tuneTo(x, dur = 900) {
    x = clamp(x, MIN, MAX);
    if (sweeping) sweeping.cancel();
    const a = f;
    const p = PF.tween(reduce ? 0 : dur, k => { f = target = a + (x - a) * k; });
    sweeping = p; p.then(() => { if (sweeping === p) sweeping = null; idle = 0; });
    return p;
  }
  const nudge = dx => { if (sweeping) { sweeping.cancel(); sweeping = null; } target = clamp(target + dx, MIN, MAX); idle = 0; };

  // molette / défilement
  addEventListener("wheel", e => { if (!document.body.classList.contains("on")) return; e.preventDefault(); nudge((e.deltaY + e.deltaX) * .004); }, { passive: false });
  // bouton rotatif : on tourne autour de son centre
  let rot = null;
  knob.addEventListener("pointerdown", e => { knob.setPointerCapture(e.pointerId); const r = knob.getBoundingClientRect(); rot = { cx: r.left + r.width / 2, cy: r.top + r.height / 2, a: Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) }; });
  knob.addEventListener("pointermove", e => {
    if (!rot) return;
    const a = Math.atan2(e.clientY - rot.cy, e.clientX - rot.cx); let d = a - rot.a;
    if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI;
    rot.a = a; nudge(d * 1.6);
  });
  knob.addEventListener("pointerup", () => (rot = null));
  knob.addEventListener("keydown", e => { if (e.key === "ArrowUp") { e.preventDefault(); nudge(.1); } if (e.key === "ArrowDown") { e.preventDefault(); nudge(-.1); } });
  // glisser directement sur le cadran
  let drag = null;
  glass.addEventListener("pointerdown", e => { if (e.target.closest(".st")) return; glass.setPointerCapture(e.pointerId); drag = true; setFromX(e.clientX); });
  glass.addEventListener("pointermove", e => drag && setFromX(e.clientX));
  glass.addEventListener("pointerup", () => (drag = null));
  function setFromX(x) { const r = glass.getBoundingClientRect(); nudge(0); target = clamp(MIN + (x - r.left) / r.width * (MAX - MIN), MIN, MAX); }

  function nearest() { let b = stations[0], d = 1e9; stations.forEach(s => { const k = Math.abs(s.f - f); if (k < d) { d = k; b = s; } }); return { st: b, d }; }
  function loop() {
    if (!sweeping) {
      f += (target - f) * (reduce ? 1 : .18);
      idle++;
      // accord magnétique : au repos, l'aiguille glisse vers la station proche
      const n = nearest();
      if (idle > 22 && n.d < .45 && n.d > .005 && !rot && !drag) target += (n.st.f - target) * .12;
    }
    needle.style.transform = `translateX(${pct(f) * glass.clientWidth}px)`;
    knob.style.transform = `rotate(${(f - MIN) * 34}deg)`;
    const n = nearest(), strength = clamp(1 - n.d / .45, 0, 1);
    onChange(f, n.st, strength);
    requestAnimationFrame(loop);
  }
  return {
    build, tuneTo, start: () => requestAnimationFrame(loop),
    step(dir) { const n = nearest(); let i = stations.indexOf(n.st); if ((dir > 0 && n.st.f <= f + .05) || (dir < 0 && n.st.f >= f - .05)) i += dir; i = clamp(i, 0, stations.length - 1); return tuneTo(stations[i].f); },
    set(x) { f = target = x; },
  };
})();
