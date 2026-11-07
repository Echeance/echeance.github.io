/* Moteur du tunnel : le défilement fait avancer une caméra le long de l'axe Z.
 * Les fragments se précisent en approchant, les mots dérivent, la poussière file. */
window.Tunnel = (() => {
  const { reduce, clamp } = PF;
  const GAP = 1500, PER = 110; // profondeur entre deux souvenirs, hauteur de défilement par souvenir (vh)
  let frags = [], words = [], onActive = () => {}, onDepth = () => {};
  let cur = 0, target = 0, vel = 0, active = -1, depth = 0;
  let mx = 0, my = 0, smx = 0, smy = 0;
  const world = document.getElementById("world");
  const track = document.getElementById("track");

  const scrollMax = () => document.documentElement.scrollHeight - innerHeight || 1;
  const read = () => { target = scrollY / scrollMax() * depth; };

  function setup(f, w, cbs) {
    frags = f.map((x, i) => ({ ...x, z: i * GAP }));
    words = w; depth = (frags.length - 1) * GAP;
    words.forEach(x => (x.z = 600 + x.r * (depth - 900)));
    onActive = cbs.onActive; onDepth = cbs.onDepth;
    track.style.height = `calc(${(frags.length - 1) * PER}vh + 100vh)`;
    addEventListener("scroll", read, { passive: true });
    addEventListener("pointermove", e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });
  }
  function goTo(i, smooth = true) { scrollTo({ top: i / (frags.length - 1) * scrollMax(), behavior: smooth && !reduce ? "smooth" : "auto" }); }
  function jump(i) { goTo(i, false); read(); cur = target; }
  const nearest = () => Math.round(cur / GAP);

  function frame() {
    const prev = cur;
    cur += (target - cur) * (reduce ? 1 : .075); vel = cur - prev;
    smx += (mx - smx) * .05; smy += (my - smy) * .05;
    const vw = innerWidth, vh = innerHeight, mob = vw <= 760, side = Math.min(vw * .3, 460);
    world.style.transform = `rotateY(${smx * 5}deg) rotateX(${-smy * 3.5}deg)`;
    let best = 0, bd = 1e9;
    frags.forEach((f, i) => {
      const rel = f.z - cur, near = clamp(1 - rel / 900, 0, 1);
      const cw = Math.min(vw * .46, 660), fx = f.side ? (mob ? 0 : Math.max(0, vw / 2 - cw / 2 - 100)) : 0;
      const x = f.side * side * (1 - near) + fx * near, y = f.side ? (mob ? -vh * .15 : -vh * .07) : 0;
      let o = rel > 5200 ? 0 : rel > 3000 ? (5200 - rel) / 2200 : 1;
      if (rel < 0) o *= Math.max(0, 1 + rel / 420);
      const blur = rel > 650 ? Math.min(7, (rel - 650) / 450) : rel < -60 ? Math.min(8, -rel / 50) : 0;
      const tilt = f.side * (1 - near) * -9;
      f.el.style.transform = `translate3d(${x}px,${y}px,${-rel}px) rotateY(${tilt}deg) rotateZ(${f.roll || 0}deg)`;
      f.el.style.opacity = o.toFixed(3);
      f.el.style.filter = blur > .2 ? `blur(${blur.toFixed(1)}px)` : "none";
      f.el.style.visibility = o < .01 ? "hidden" : "visible";
      f.el.style.pointerEvents = Math.abs(rel - 150) < 700 ? "auto" : "none";
      const d = Math.abs(rel - 150); if (d < bd) { bd = d; best = i; }
    });
    words.forEach(w => {
      const rel = w.z - cur;
      let o = rel > 4200 ? 0 : rel > 2400 ? (4200 - rel) / 1800 : 1; if (rel < 200) o *= Math.max(0, (rel + 200) / 400);
      o *= w.max;
      w.el.style.transform = `translate3d(${w.x * vw * .55}px,${w.y * vh * .45}px,${-rel}px)`;
      w.el.style.opacity = o.toFixed(3);
      w.el.style.visibility = o < .01 ? "hidden" : "visible";
    });
    if (best !== active) { active = best; onActive(best); }
    onDepth(cur / depth);
    dust(vel);
    requestAnimationFrame(frame);
  }

  /* Poussière de projection : points qui deviennent des traînées quand on file vite */
  const cv = document.getElementById("dust"), cx = cv.getContext("2d");
  const pts = [...Array(240)].map(() => ({ x: (Math.random() * 2 - 1) * 1600, y: (Math.random() * 2 - 1) * 1000, z: Math.random() * 3000, warm: Math.random() < .2 }));
  const size = () => { cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio; cx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); };
  size(); addEventListener("resize", size);
  function dust(v) {
    const w = innerWidth, h = innerHeight, f = 600, sp = 1 + Math.abs(v) * .9;
    cx.clearRect(0, 0, w, h);
    for (const p of pts) {
      const pz = p.z;
      p.z -= v >= 0 ? sp : -sp; if (p.z < 1) p.z += 3000; if (p.z > 3000) p.z -= 3000;
      const s = f / p.z, X = w / 2 + (p.x + smx * 120) * s, Y = h * .44 + (p.y + smy * 80) * s;
      const s2 = f / Math.max(1, pz), X2 = w / 2 + (p.x + smx * 120) * s2, Y2 = h * .44 + (p.y + smy * 80) * s2;
      const a = Math.min(1, (3000 - p.z) / 1600) * .6;
      cx.strokeStyle = p.warm ? `rgba(240,163,58,${a})` : `rgba(239,228,207,${a * .7})`;
      cx.lineWidth = Math.max(.6, s * 1.3);
      cx.beginPath(); cx.moveTo(X, Y);
      Math.abs(v) > 2 ? cx.lineTo(X2, Y2) : cx.lineTo(X + .6, Y + .6);
      cx.stroke();
    }
  }
  return { setup, start: () => requestAnimationFrame(frame), goTo, jump, nearest, count: () => frags.length };
})();
