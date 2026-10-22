/* =====================================================================
   WELT – Mehr oder weniger: Zwei Gläser voller Glühwürmchen. In welchem sind mehr? ← oder →.
   Ab Level 5 fragt die Wiese manchmal nach WENIGER, später schwirren die Tiere und sind verschieden groß.
   ===================================================================== */
function makeMehrOderWeniger(next, level = 0) {
  const NEED = [8, 9, 10, 10, 11, 12, 12, 13, 14, 15][level], TRIAL = [4, 3.6, 3.3, 3, 2.9, 2.7, 2.5, 2.4, 2.2, 2.1][level];
  const RATIO = [0.5, 0.55, 0.6, 0.64, 0.66, 0.68, 0.7, 0.72, 0.75, 0.77][level];
  const BMIN = [4, 5, 6, 7, 8, 9, 10, 10, 11, 12][level], BMAX = [8, 10, 12, 13, 14, 16, 18, 19, 20, 22][level];
  const ASKFEW = level >= 4, MOVE = [0, 0, 0, 0, 0, 12, 18, 24, 28, 32][level], SIZES = level >= 7, LIVES = 3;
  const finale = makeFinale(next);
  const JAR = [{ x: 90, y: 110, w: 190, h: 230 }, { x: 360, y: 110, w: 190, h: 230 }];
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  let trial, score, lives, phase, timer, failed, failT, fb, t = 0, grass;
  grass = Array.from({ length: 90 }, (_, i) => ({ x: i * 7.3 + Math.random() * 5, h: 18 + Math.random() * 30, p: Math.random() * 6 }));
  function fill(n, j) {
    const out = [];
    for (let k = 0; k < n; k++) {
      const r = SIZES ? 2.5 + Math.random() * 5 : 4;
      let x, y, tries = 0;
      do { x = j.x + 18 + Math.random() * (j.w - 36); y = j.y + 40 + Math.random() * (j.h - 58); tries++; }
      while (tries < 60 && out.some(o => Math.hypot(o.x - x, o.y - y) < o.r + r + 9));
      const a = Math.random() * 7;
      out.push({ x, y, r, vx: Math.cos(a) * MOVE, vy: Math.sin(a) * MOVE, p: Math.random() * 7 });
    }
    return out;
  }
  function newTrial() {
    const big = ri(BMIN, BMAX), small = clamp(Math.round(big * (RATIO - Math.random() * 0.08)), 1, big - 1);
    const moreLeft = Math.random() < 0.5, few = ASKFEW && Math.random() < 0.5;
    const n = moreLeft ? [big, small] : [small, big];
    trial = { n, few, flies: [fill(n[0], JAR[0]), fill(n[1], JAR[1])], answer: (moreLeft !== few) ? 'left' : 'right', id: (trial ? trial.id : 0) + 1 };
    phase = 'ask'; timer = TRIAL;
  }
  function reset() { score = 0; lives = LIVES; failed = false; fb = null; trial = null; newTrial(); }
  reset();
  function judge(ok, why) {
    fb = { ok, why, side: trial.answer }; phase = 'fb'; timer = ok ? 0.45 : 1.1;
    Klang.tone(ok ? 660 : 140, 0.15);
    if (ok) score++; else lives--;
  }
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ fin: finale.active, failed, phase, answer: trial.answer, id: trial.id }), // für Testprogramme
    update(dt) {
      t += dt;
      for (let s = 0; s < 2; s++) for (const f of trial.flies[s]) {
        const j = JAR[s]; f.x += f.vx * dt; f.y += f.vy * dt;
        if (f.x < j.x + 14 || f.x > j.x + j.w - 14) { f.vx *= -1; f.x = clamp(f.x, j.x + 14, j.x + j.w - 14); }
        if (f.y < j.y + 36 || f.y > j.y + j.h - 14) { f.vy *= -1; f.y = clamp(f.y, j.y + 36, j.y + j.h - 14); }
      }
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      if (failed) { failT += dt; if (failT > 0.6 && pressed.action) { died(); reset(); } return; }
      timer -= dt;
      if (phase === 'ask') {
        const k = pressed.left ? 'left' : pressed.right ? 'right' : null;
        if (k) judge(k === trial.answer, k === trial.answer ? '' : 'Falsch');
        else if (timer <= 0) judge(false, 'Zu langsam');
      } else if (phase === 'fb' && timer <= 0) {
        if (score >= NEED) finale.start();
        else if (lives <= 0) { failed = true; failT = 0; }
        else newTrial();
      }
    },
    draw(c) {
      const sky = c.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#04121a'); sky.addColorStop(0.7, '#0b2a2a'); sky.addColorStop(1, '#123a26');
      c.fillStyle = sky; c.fillRect(0, 0, W, H);
      c.fillStyle = '#e9f2d0'; c.beginPath(); c.arc(570, 60, 18, 0, 7); c.fill();
      c.fillStyle = '#0b2a2a'; c.beginPath(); c.arc(577, 55, 16, 0, 7); c.fill();
      c.strokeStyle = '#1d4a2a'; c.lineWidth = 2; c.beginPath();
      for (const g of grass) { c.moveTo(g.x, H); c.quadraticCurveTo(g.x + 4, H - g.h / 2, g.x + Math.sin(t * 1.5 + g.p) * 6, H - g.h); } c.stroke();
      const showN = phase === 'fb';
      for (let s = 0; s < 2; s++) {
        const j = JAR[s], hl = showN && fb.side === (s ? 'right' : 'left');
        // Glas
        c.fillStyle = 'rgba(160,220,210,0.08)'; c.beginPath(); c.roundRect ? c.roundRect(j.x, j.y + 20, j.w, j.h - 20, 22) : c.rect(j.x, j.y + 20, j.w, j.h - 20); c.fill();
        c.strokeStyle = hl ? (fb.ok ? '#b8ff8a' : '#ff8a8a') : 'rgba(190,240,230,0.45)'; c.lineWidth = hl ? 4 : 2; c.stroke();
        c.fillStyle = '#5a3d22'; c.fillRect(j.x + 20, j.y + 6, j.w - 40, 18);
        c.fillStyle = 'rgba(255,255,255,0.08)'; c.fillRect(j.x + 14, j.y + 40, 8, j.h - 70);
        for (const f of trial.flies[s]) {
          const b = 0.75 + 0.25 * Math.sin(t * 5 + f.p);
          const g = c.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 3.2); g.addColorStop(0, `rgba(255,240,120,${0.55 * b})`); g.addColorStop(1, 'rgba(255,240,120,0)');
          c.fillStyle = g; c.fillRect(f.x - f.r * 3.2, f.y - f.r * 3.2, f.r * 6.4, f.r * 6.4);
          c.fillStyle = `rgba(255,250,${170 + 60 * b},1)`; c.beginPath(); c.arc(f.x, f.y, f.r, 0, 7); c.fill();
        }
        label(c, s ? '→' : '←', j.x + j.w / 2, j.y + j.h + 30, '#cfe8c0', 'center', 18);
        if (showN) label(c, String(trial.n[s]), j.x + j.w / 2, j.y - 6, '#fff6b0', 'center', 18);
      }
      const q = trial.few ? 'Wo sind WENIGER?' : 'Wo sind MEHR?';
      label(c, q, W / 2, 62, trial.few ? '#ffb070' : '#fff6b0', 'center', 22);
      if (phase === 'ask') { c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(W / 2 - 90, 76, 180, 5); c.fillStyle = '#fff6b0'; c.fillRect(W / 2 - 90, 76, 180 * clamp(timer / TRIAL, 0, 1), 5); }
      if (phase === 'fb' && !fb.ok) label(c, fb.why + '!', W / 2, 100, '#ff9a8a', 'center', 14);
      label(c, `Richtig ${score} / ${NEED}`, 16, 26, '#cfe8c0');
      label(c, '♥'.repeat(Math.max(0, lives)), W - 16, 26, '#ff8a6a', 'right', 16);
      if (failed) { c.fillStyle = 'rgba(4,18,26,0.92)'; c.fillRect(0, 160, W, 80); label(c, `Keine Leben mehr: ${score} von ${NEED}. Leertaste: neuer Versuch`, W / 2, 205, '#ffb0a0', 'center', 14); }
      finale.draw(c, '#cfe8c0', '#0b2a2a');
    }
  };
  return self;
}
