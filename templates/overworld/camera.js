/* Caméra de la carte : vols animés, glisser, molette, pincement, mini-carte. */
window.Cam = (() => {
  const { W, H, islands, routeD, smooth } = World;
  const { reduce, clamp } = PF;
  const svg = document.getElementById("world"), cam = document.getElementById("cam");
  let V = { x: W / 2, y: H / 2, z: .5 };
  const listeners = [];

  const fitZ = () => Math.min(innerWidth / (W + 260), innerHeight / (H + 320));
  function apply() {
    svg.setAttribute("viewBox", `0 0 ${innerWidth} ${innerHeight}`);
    cam.setAttribute("transform", `translate(${innerWidth / 2} ${innerHeight / 2}) scale(${V.z}) translate(${-V.x} ${-V.y})`);
    drawMini();
    listeners.forEach(f => f(V));
  }

  let raf = 0;
  /* Vol façon caméra de cinéma : on prend de la hauteur au milieu du trajet. */
  function flyTo(t, dur = 1500) {
    cancelAnimationFrame(raf);
    if (reduce) { V = { ...t }; apply(); return Promise.resolve(); }
    const s = { ...V }, dist = Math.hypot(t.x - s.x, t.y - s.y), bump = Math.min(.42, dist / 3200), t0 = performance.now();
    return new Promise(res => {
      const step = now => {
        const k = Math.min(1, (now - t0) / dur), e = PF.ease.inOut(k);
        V.x = s.x + (t.x - s.x) * e; V.y = s.y + (t.y - s.y) * e;
        V.z = (s.z + (t.z - s.z) * e) * (1 - bump * Math.sin(Math.PI * k));
        apply(); k < 1 ? (raf = requestAnimationFrame(step)) : res();
      };
      raf = requestAnimationFrame(step);
    });
  }
  const overview = d => flyTo({ x: W / 2, y: H / 2 + 20, z: fitZ() }, d);

  // glisser, pincer
  const pts = new Map(); let drag = null, pinch = null; let moved = false;
  svg.addEventListener("pointerdown", e => {
    if (e.button > 0) return;
    // pas de capture du pointeur tout de suite : sinon le clic sur une étape serait « volé » par la carte
    pts.set(e.pointerId, e); cancelAnimationFrame(raf); moved = false;
    if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), z: V.z }; drag = null; }
    else drag = { x: e.clientX, y: e.clientY, vx: V.x, vy: V.y };
  });
  svg.addEventListener("pointermove", e => {
    if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, e);
    if (pinch && pts.size === 2) { const [a, b] = [...pts.values()]; V.z = clamp(pinch.z * Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) / pinch.d, fitZ() * .8, 3); moved = true; apply(); return; }
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!moved && Math.abs(dx) + Math.abs(dy) > 5) { moved = true; svg.setPointerCapture(e.pointerId); svg.classList.add("drag"); }
    if (!moved) return;
    V.x = drag.vx - dx / V.z; V.y = drag.vy - dy / V.z; apply();
  });
  const up = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = null; if (!pts.size) { drag = null; svg.classList.remove("drag"); } };
  svg.addEventListener("pointerup", up); svg.addEventListener("pointercancel", up);
  svg.addEventListener("wheel", e => {
    e.preventDefault(); cancelAnimationFrame(raf);
    const nz = clamp(V.z * Math.exp(-e.deltaY * .0015), fitZ() * .8, 3);
    const mx = (e.clientX - innerWidth / 2) / V.z + V.x, my = (e.clientY - innerHeight / 2) / V.z + V.y;
    V.x = mx - (e.clientX - innerWidth / 2) / nz; V.y = my - (e.clientY - innerHeight / 2) / nz; V.z = nz; apply();
  }, { passive: false });
  addEventListener("resize", apply);

  // mini-carte
  const mini = document.getElementById("mini");
  mini.innerHTML = `<svg viewBox="-120 -120 ${W + 240} ${H + 240}"><rect x="-120" y="-120" width="${W + 240}" height="${H + 240}" fill="#e7dcc3"/>
    ${islands.map(g => `<path d="${smooth(g.coast)}" fill="#f7f0df" stroke="#2b2420" stroke-width="8"/>`).join("")}
    <path d="${routeD}" fill="none" stroke="#b3341f" stroke-width="10" stroke-dasharray="24 20"/><rect class="vp" id="vp"/></svg>`;
  mini.addEventListener("click", e => {
    const r = mini.getBoundingClientRect();
    flyTo({ x: -120 + (e.clientX - r.left) / r.width * (W + 240), y: -120 + (e.clientY - r.top) / r.height * (H + 240), z: V.z }, 800);
  });
  function drawMini() {
    const vp = document.getElementById("vp"); if (!vp) return;
    const w = innerWidth / V.z, h = innerHeight / V.z;
    vp.setAttribute("x", V.x - w / 2); vp.setAttribute("y", V.y - h / 2); vp.setAttribute("width", w); vp.setAttribute("height", h);
  }

  return {
    get V() { return V; }, set(v) { V = { ...v }; apply(); },
    flyTo, overview, fitZ, apply, wasDrag: () => moved, onMove: f => listeners.push(f),
  };
})();
