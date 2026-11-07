/* Signal : oscilloscope, neige à l'écran et son (désactivé par défaut). */
window.Signal = (() => {
  const { reduce } = PF;
  const scope = document.getElementById("scope"), sc = scope.getContext("2d");
  const stat = document.getElementById("static"), st = stat.getContext("2d");
  let s = 0, seed = 1, t = 0, running = false;

  function fit(c) { const r = c.getBoundingClientRect(); c.width = Math.max(1, r.width * devicePixelRatio); c.height = Math.max(1, r.height * devicePixelRatio); }
  const resize = () => { fit(scope); stat.width = Math.max(1, stat.clientWidth / 2); stat.height = Math.max(1, stat.clientHeight / 2); };
  addEventListener("resize", resize);

  function drawScope() {
    const w = scope.width, h = scope.height, mid = h / 2;
    sc.clearRect(0, 0, w, h);
    sc.strokeStyle = "rgba(255,181,71,.12)"; sc.lineWidth = 1;
    for (let x = 0; x < w; x += w / 12) { sc.beginPath(); sc.moveTo(x, 0); sc.lineTo(x, h); sc.stroke(); }
    sc.beginPath(); sc.moveTo(0, mid); sc.lineTo(w, mid); sc.stroke();
    sc.strokeStyle = s > .55 ? "#ffb547" : "#c98a3a"; sc.lineWidth = 2 * devicePixelRatio; sc.shadowColor = "#ffb547"; sc.shadowBlur = 8 * s;
    sc.beginPath();
    for (let x = 0; x <= w; x += 2) {
      const k = x / w * Math.PI * 2;
      const tone = Math.sin(k * (3 + seed % 4) + t * 3) * .55 + Math.sin(k * (7 + seed % 5) - t * 5) * .25 + Math.sin(k * 13 + t * 9) * .1;
      const noise = (Math.random() * 2 - 1);
      const y = mid - (tone * s + noise * (1 - s) * .9) * (h * .4);
      x ? sc.lineTo(x, y) : sc.moveTo(x, y);
    }
    sc.stroke(); sc.shadowBlur = 0;
  }
  function drawStatic() {
    const a = Math.max(0, 1 - s * 1.4);
    stat.style.opacity = (a * .38).toFixed(3);
    if (a < .02) return;
    const w = stat.width, h = stat.height, img = st.createImageData(w, h), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const v = Math.random() * 255 | 0; d[i] = v; d[i + 1] = v * .85; d[i + 2] = v * .6; d[i + 3] = 255; }
    st.putImageData(img, 0, 0);
  }
  function loop() { t += .016; drawScope(); drawStatic(); requestAnimationFrame(loop); }

  /* Son : bruit filtré entre les stations, accord doux quand on est calé. */
  let ac, noiseGain, toneGain, oscs = [];
  function startAudio() {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    const buf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), ch = buf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
    const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1800; bp.Q.value = .6;
    noiseGain = ac.createGain(); noiseGain.gain.value = 0;
    src.connect(bp).connect(noiseGain).connect(ac.destination); src.start();
    toneGain = ac.createGain(); toneGain.gain.value = 0; toneGain.connect(ac.destination);
    [220, 277.18, 329.63].forEach(f => { const o = ac.createOscillator(); o.type = "sine"; o.frequency.value = f; o.connect(toneGain); o.start(); oscs.push(o); });
  }
  function updateAudio() {
    if (!ac) return;
    const now = ac.currentTime;
    noiseGain.gain.setTargetAtTime(Math.max(0, 1 - s * 1.3) * .06, now, .05);
    toneGain.gain.setTargetAtTime(Math.max(0, s - .6) * .045, now, .1);
    const base = 196 * Math.pow(2, (seed % 7) / 12);
    oscs.forEach((o, i) => o.frequency.setTargetAtTime(base * [1, 1.26, 1.5][i], now, .2));
  }

  return {
    start() { if (running) return; running = true; resize(); if (!reduce) requestAnimationFrame(loop); else drawScope(); },
    set(strength, sd) { s = strength; seed = sd; updateAudio(); if (reduce) { drawScope(); drawStatic(); } },
    toggleSound() {
      if (!ac) { startAudio(); updateAudio(); return true; }
      if (ac.state === "running") { ac.suspend(); return false; }
      ac.resume(); return true;
    },
  };
})();
