/* Petits outils communs à tous les templates (script classique, compatible file://). */
window.PF = (() => {
  const ROOT = "../../";
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const img = file => ROOT + "assets/projects/" + file;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = {
    inOut: t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    out: t => 1 - Math.pow(1 - t, 3),
    outBack: t => 1 + 2.4 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2),
  };
  /* Anime une valeur de 0 à 1 ; renvoie une promesse et une fonction d'annulation. */
  function tween(dur, onStep, easing = ease.inOut) {
    let raf, stop = false;
    const p = new Promise(res => {
      if (reduce || dur <= 0) { onStep(1); return res(); }
      const t0 = performance.now();
      const step = now => {
        if (stop) return res();
        const k = clamp((now - t0) / dur, 0, 1);
        onStep(easing(k));
        k < 1 ? (raf = requestAnimationFrame(step)) : res();
      };
      raf = requestAnimationFrame(step);
    });
    p.cancel = () => { stop = true; cancelAnimationFrame(raf); };
    return p;
  }
  const D = window.PORTFOLIO;
  const chapterOf = p => D.chapters.find(c => c.id === p.chapter);
  const isWip = p => /en cours/i.test(p.year);
  return { ROOT, esc, $, $$, sleep, reduce, img, clamp, lerp, ease, tween, D, chapterOf, isWip };
})();
