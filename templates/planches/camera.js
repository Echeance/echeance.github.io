/* Caméra de lecture guidée : cadre une case, une planche, ou glisse de l'une à l'autre. */
window.Camera = (() => {
  const comic = document.getElementById("comic"), note = document.getElementById("note");
  let V = { x: 0, y: 0, s: 1 }, anim = null;
  const set = v => { V = v; comic.style.transform = `translate(${V.x}px, ${V.y}px) scale(${V.s})`; };

  /* zone libre de l'écran : on retire la barre de lecture et la note de l'éditeur */
  function area() {
    const noted = document.body.classList.contains("noted"), wide = innerWidth > 1000;
    const right = noted && wide ? 440 : 0;
    const bottom = 86 + (noted && !wide ? Math.min(note.offsetHeight, innerHeight * .36) + 10 : 0);
    const w = innerWidth - right, h = innerHeight - bottom;
    return { w, h, ox: w / 2, oy: h / 2 + 6 };
  }
  /* vue qui centre le rectangle r (coordonnées de la BD) */
  function viewFor(r, pad = 36) {
    const A = area(), p = Math.min(pad, A.w * .05);
    const s = Math.min((A.w - p * 2) / r.w, (A.h - p * 2) / r.h);
    return { s, x: A.ox - (r.x + r.w / 2) * s, y: A.oy - (r.y + r.h / 2) * s };
  }
  /* vol avec un léger recul au milieu, comme un travelling */
  function fly(r, dur = 1100, pad) {
    if (anim) anim.cancel();
    const a = { ...V }, b = viewFor(r, pad), A = area();
    const dist = Math.hypot((b.x - a.x) / Math.max(a.s, .1), (b.y - a.y) / Math.max(a.s, .1));
    const pull = Math.min(.35, dist / 4000);
    anim = PF.tween(dur, k => {
      const s = PF.lerp(a.s, b.s, k) * (1 - pull * Math.sin(Math.PI * k));
      // on interpole le point visé, pas la translation, pour un mouvement naturel
      const cx = PF.lerp((A.ox - a.x) / a.s, (A.ox - b.x) / b.s, k), cy = PF.lerp((A.oy - a.y) / a.s, (A.oy - b.y) / b.s, k);
      set({ s, x: A.ox - cx * s, y: A.oy - cy * s });
    });
    return anim;
  }
  return { fly, jump: (r, pad) => set(viewFor(r, pad)), get V() { return V; } };
})();
