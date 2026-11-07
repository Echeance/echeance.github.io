/* Sommaire : aperçu au survol, transition de sortie. */
(() => {
  const links = [...document.querySelectorAll("#list a")];
  const pv = document.getElementById("pv"), pvd = document.getElementById("pvd");
  const leave = document.createElement("div"); leave.className = "leave"; document.body.appendChild(leave);
  let cur = null, t;
  function show(a) {
    if (a === cur) return; cur = a;
    links.forEach(l => l.classList.toggle("on", l === a));
    pv.classList.add("swap"); clearTimeout(t);
    t = setTimeout(() => { pv.src = a.dataset.pv; pv.alt = "Aperçu : " + a.textContent.trim(); pvd.textContent = a.dataset.d; pv.classList.remove("swap"); }, 220);
  }
  links.forEach(a => {
    a.addEventListener("mouseenter", () => show(a));
    a.addEventListener("focus", () => show(a));
    a.addEventListener("click", e => {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault(); leave.classList.add("on");
      setTimeout(() => (location.href = a.getAttribute("href")), 600);
    });
  });
  addEventListener("pageshow", () => leave.classList.remove("on"));
  show(links[0]);
})();
