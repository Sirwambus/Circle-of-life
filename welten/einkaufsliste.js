/* =====================================================================
   WELT – Einkaufsliste: Auf dem Zettel stehen ein paar Dinge. Danach liegt alles im Marktregal –
   pack genau die Dinge vom Zettel in den Korb. Pfeile wählen, Leertaste packt ein / legt zurück.
   ===================================================================== */
function makeEinkaufsliste(next, level = 0) {
  // Ab Level 4 liegen dieselben Dinge in anderer Farbe als Ablenker im Regal
  const K = [3, 4, 4, 5, 5, 6, 6, 7, 7, 8][level], M = [6, 8, 9, 10, 12, 12, 14, 14, 15, 16][level];
  const SIM = [0, 0, 0, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9][level], SHOWT = [4.5, 5, 5, 5.5, 5.5, 6, 6, 6.5, 6.5, 7][level], ROUNDS = 3, LIVES = 3;
  const KINDS = {
    apfel: ['#e8343a', '#7cc242', '#f2c230'], birne: ['#a8c94a', '#e0b04a'], moehre: ['#f28a1f'], fisch: ['#4a90d9', '#f28a1f', '#b8c4cc'],
    brot: ['#c98a4a'], flasche: ['#f4f4f4', '#3fa34d', '#3f7fd9'], kaese: ['#f2cf4a'], ei: ['#f6efe0', '#b9804a'], banane: ['#f2d94a', '#9cc94a'],
    trauben: ['#8a4ac9', '#9cd04a'], kirsche: ['#d62a3a'], pilz: ['#c99a6a', '#e0402a'], bonbon: ['#ff6fb5', '#4ad9d9']
  };
  const CAT = []; for (const k in KINDS) for (const col of KINDS[k]) CAT.push({ k, col });
  const finale = makeFinale(next);
  const ROWS = M <= 8 ? 2 : M <= 12 ? 3 : 4, COLS = Math.ceil(M / ROWS), CW = Math.min(96, 560 / COLS), CH = Math.min(82, 290 / ROWS);
  const X0 = W / 2 - CW * COLS / 2, Y0 = 72 + (290 - CH * ROWS) / 2;
  let want, shelf, picked, phase, timer, cur, roundI, lives, t = 0, msg = '', msgT = 0;
  const rep = makeRepeater();
  const pick = a => a[Math.floor(Math.random() * a.length)];
  function newRound() {
    const pool = CAT.slice(); want = [];
    while (want.length < K) want.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    const items = want.slice();
    while (items.length < M) {
      const sim = pool.filter(p => want.some(w => w.k === p.k));
      const src = sim.length && Math.random() < SIM ? sim : pool;
      const p = pick(src); pool.splice(pool.indexOf(p), 1); items.push(p);
    }
    for (let i = items.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [items[i], items[j]] = [items[j], items[i]]; }
    shelf = items; picked = new Set(); phase = 'show'; timer = SHOWT + 0.4; cur = 0;
  }
  function reset() { roundI = 0; lives = LIVES; newRound(); }
  reset();
  const cellPos = i => ({ x: X0 + (i % COLS) * CW + CW / 2, y: Y0 + Math.floor(i / COLS) * CH + CH / 2 });
  function item(c, it, x, y, r) {
    const { k, col } = it; c.save(); c.lineWidth = 2; c.strokeStyle = 'rgba(40,20,10,0.55)'; c.fillStyle = col;
    if (k === 'apfel') {
      c.beginPath(); c.arc(x - r * 0.3, y + r * 0.1, r * 0.62, 0, 7); c.arc(x + r * 0.3, y + r * 0.1, r * 0.62, 0, 7); c.fill();
      c.strokeStyle = '#6b4226'; c.beginPath(); c.moveTo(x, y - r * 0.4); c.lineTo(x + r * 0.1, y - r * 0.85); c.stroke();
      c.fillStyle = '#4caf50'; c.beginPath(); c.ellipse(x + r * 0.35, y - r * 0.7, r * 0.28, r * 0.13, -0.5, 0, 7); c.fill();
    } else if (k === 'birne') {
      c.beginPath(); c.arc(x, y + r * 0.3, r * 0.62, 0, 7); c.arc(x, y - r * 0.3, r * 0.38, 0, 7); c.fill();
      c.strokeStyle = '#6b4226'; c.beginPath(); c.moveTo(x, y - r * 0.65); c.lineTo(x + r * 0.15, y - r); c.stroke();
    } else if (k === 'moehre') {
      c.beginPath(); c.moveTo(x - r * 0.4, y - r * 0.55); c.lineTo(x + r * 0.4, y - r * 0.55); c.lineTo(x, y + r); c.closePath(); c.fill(); c.stroke();
      c.strokeStyle = '#4caf50'; c.lineWidth = 3; c.beginPath();
      for (const a of [-0.5, 0, 0.5]) { c.moveTo(x, y - r * 0.55); c.lineTo(x + Math.sin(a) * r * 0.5, y - r * 0.55 - Math.cos(a) * r * 0.45); } c.stroke();
    } else if (k === 'fisch') {
      c.beginPath(); c.ellipse(x + r * 0.1, y, r * 0.7, r * 0.4, 0, 0, 7); c.fill();
      c.beginPath(); c.moveTo(x - r * 0.5, y); c.lineTo(x - r, y - r * 0.4); c.lineTo(x - r, y + r * 0.4); c.closePath(); c.fill();
      c.fillStyle = '#111'; c.beginPath(); c.arc(x + r * 0.5, y - r * 0.08, r * 0.08, 0, 7); c.fill();
    } else if (k === 'brot') {
      c.beginPath(); c.ellipse(x, y, r * 0.95, r * 0.55, 0, 0, 7); c.fill(); c.stroke();
      c.strokeStyle = '#f0d3a0'; c.beginPath(); for (const o of [-0.4, 0, 0.4]) { c.moveTo(x + r * o - r * 0.12, y - r * 0.3); c.lineTo(x + r * o + r * 0.12, y + r * 0.2); } c.stroke();
    } else if (k === 'flasche') {
      c.beginPath(); c.roundRect(x - r * 0.38, y - r * 0.25, r * 0.76, r * 1.2, 4); c.rect(x - r * 0.16, y - r * 0.85, r * 0.32, r * 0.7); c.fill(); c.stroke();
      c.fillStyle = '#d33'; c.fillRect(x - r * 0.19, y - r * 0.98, r * 0.38, r * 0.18);
      c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(x - r * 0.25, y + r * 0.1, r * 0.5, r * 0.3);
    } else if (k === 'kaese') {
      c.beginPath(); c.moveTo(x - r * 0.9, y + r * 0.5); c.lineTo(x + r * 0.9, y + r * 0.5); c.lineTo(x + r * 0.9, y - r * 0.1); c.lineTo(x - r * 0.9, y + r * 0.1 - r * 0.4); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#c9a42a'; for (const [a, b, s] of [[-0.4, 0.2, 0.12], [0.3, 0.25, 0.15], [0.5, -0.02, 0.08]]) { c.beginPath(); c.arc(x + r * a, y + r * b, r * s, 0, 7); c.fill(); }
    } else if (k === 'ei') {
      c.beginPath(); c.ellipse(x, y + r * 0.05, r * 0.55, r * 0.75, 0, 0, 7); c.fill(); c.stroke();
    } else if (k === 'banane') {
      c.strokeStyle = col; c.lineWidth = r * 0.42; c.lineCap = 'round'; c.beginPath(); c.arc(x, y - r * 0.6, r * 1.05, 0.55, Math.PI - 0.55); c.stroke();
      c.strokeStyle = '#5a3d1e'; c.lineWidth = 3; c.beginPath(); c.arc(x, y - r * 0.6, r * 1.05, 0.5, 0.56); c.stroke();
    } else if (k === 'trauben') {
      for (const [a, b] of [[-0.4, -0.35], [0, -0.35], [0.4, -0.35], [-0.2, 0.05], [0.2, 0.05], [0, 0.45]]) { c.beginPath(); c.arc(x + r * a, y + r * b, r * 0.24, 0, 7); c.fill(); c.stroke(); }
      c.strokeStyle = '#6b4226'; c.beginPath(); c.moveTo(x, y - r * 0.6); c.lineTo(x + r * 0.1, y - r * 0.95); c.stroke();
    } else if (k === 'kirsche') {
      c.strokeStyle = '#5a7a2a'; c.beginPath(); c.moveTo(x - r * 0.4, y + r * 0.2); c.quadraticCurveTo(x - r * 0.1, y - r * 0.5, x + r * 0.1, y - r * 0.9); c.moveTo(x + r * 0.4, y + r * 0.3); c.quadraticCurveTo(x + r * 0.3, y - r * 0.4, x + r * 0.1, y - r * 0.9); c.stroke();
      for (const [a, b] of [[-0.4, 0.4], [0.4, 0.5]]) { c.beginPath(); c.arc(x + r * a, y + r * b, r * 0.33, 0, 7); c.fill(); }
    } else if (k === 'pilz') {
      c.fillStyle = '#f2e8d5'; c.fillRect(x - r * 0.2, y - r * 0.1, r * 0.4, r * 0.8);
      c.fillStyle = col; c.beginPath(); c.ellipse(x, y - r * 0.1, r * 0.85, r * 0.6, 0, Math.PI, 0); c.closePath(); c.fill(); c.stroke();
      if (col === '#e0402a') { c.fillStyle = '#fff'; for (const [a, b] of [[-0.45, -0.3], [0.1, -0.5], [0.45, -0.25]]) { c.beginPath(); c.arc(x + r * a, y + r * b, r * 0.1, 0, 7); c.fill(); } }
    } else if (k === 'bonbon') {
      c.beginPath(); c.moveTo(x - r * 0.4, y); c.lineTo(x - r * 0.95, y - r * 0.35); c.lineTo(x - r * 0.95, y + r * 0.35); c.closePath();
      c.moveTo(x + r * 0.4, y); c.lineTo(x + r * 0.95, y - r * 0.35); c.lineTo(x + r * 0.95, y + r * 0.35); c.closePath(); c.fill();
      c.beginPath(); c.arc(x, y, r * 0.45, 0, 7); c.fill(); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); c.arc(x, y, r * 0.25, 0.5, 2.5); c.stroke();
    }
    c.restore();
  }
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ fin: finale.active, phase, want, shelf, picked, cur, cols: COLS, K }), // für Testprogramme
    update(dt) {
      t += dt; msgT -= dt;
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      if (phase === 'show') { timer -= dt; if (timer <= 0) phase = 'pick'; }
      else if (phase === 'pick') {
        const d = rep(dt);
        if (d) { const x = clamp(cur % COLS + d[0], 0, COLS - 1), y = clamp(Math.floor(cur / COLS) + d[1], 0, ROWS - 1); if (y * COLS + x < M) cur = y * COLS + x; }
        if (pressed.action) {
          if (picked.has(cur)) picked.delete(cur); else { picked.add(cur); Klang.tone(440 + picked.size * 40, 0.15); }
          if (picked.size === K) {
            if ([...picked].every(i => want.includes(shelf[i]))) {
              roundI++; Klang.tone(660, 0.5);
              if (roundI >= ROUNDS) { finale.start(); return; }
              msg = 'Alles im Korb!'; msgT = 1.2; phase = 'wait'; timer = 1.2;
            } else { lives--; msg = lives > 0 ? 'Nicht ganz – grün war richtig.' : 'Keine Versuche mehr. Von vorn.'; msgT = 2; phase = 'reveal'; timer = 2.2; }
          }
        }
      } else { timer -= dt; if (timer <= 0) { if (lives <= 0) { died(); reset(); } else newRound(); } }
    },
    draw(c) {
      c.fillStyle = '#3a2416'; c.fillRect(0, 0, W, H);
      for (let x = 0; x < W; x += 40) { c.fillStyle = x % 80 ? '#43291a' : '#3d2617'; c.fillRect(x, 0, 40, H); }
      for (let x = 0; x < W; x += 40) { c.fillStyle = x % 80 ? '#e8e0cc' : '#c8463a'; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 40, 0); c.lineTo(x + 40, 36); c.arc(x + 20, 36, 20, 0, Math.PI); c.fill(); }
      if (phase === 'show') {
        const pw = Math.min(520, 120 + Math.min(K, 4) * 96), ph = 110 + Math.ceil(K / 4) * 86, px = W / 2 - pw / 2, py = 200 - ph / 2 + 16;
        c.save(); c.translate(W / 2, 200); c.rotate(-0.015); c.translate(-W / 2, -200);
        c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(px + 6, py + 8, pw, ph);
        c.fillStyle = '#fbf6e6'; c.fillRect(px, py, pw, ph);
        c.strokeStyle = 'rgba(80,120,200,0.25)'; c.lineWidth = 1; for (let y = py + 30; y < py + ph; y += 18) { c.beginPath(); c.moveTo(px, y); c.lineTo(px + pw, y); c.stroke(); }
        c.strokeStyle = 'rgba(220,80,80,0.4)'; c.beginPath(); c.moveTo(px + 30, py); c.lineTo(px + 30, py + ph); c.stroke();
        label(c, 'Einkaufsliste', W / 2, py + 34, '#3a2a6a', 'center', 18);
        if (timer < SHOWT) want.forEach((it, i) => {
          const row = Math.floor(i / 4), inRow = Math.min(4, K - row * 4), col = i % 4;
          item(c, it, W / 2 + (col - (inRow - 1) / 2) * 96, py + 95 + row * 86, 26);
        });
        c.restore();
        label(c, `Merk dir die Liste … ${Math.ceil(Math.min(timer, SHOWT))}`, W / 2, H - 16, '#f6e7c8', 'center');
      } else {
        for (let r = 0; r < ROWS; r++) { c.fillStyle = '#8a5a34'; c.fillRect(X0 - 12, Y0 + (r + 1) * CH - 10, CW * COLS + 24, 8); c.fillStyle = '#5e3a20'; c.fillRect(X0 - 12, Y0 + (r + 1) * CH - 2, CW * COLS + 24, 4); }
        shelf.forEach((it, i) => {
          const { x, y } = cellPos(i), sel = picked.has(i), right = want.includes(it);
          if (sel || (phase === 'reveal' && right)) {
            c.fillStyle = phase === 'reveal' ? (right ? 'rgba(90,220,120,0.35)' : 'rgba(255,80,60,0.4)') : 'rgba(255,230,140,0.3)';
            c.beginPath(); c.arc(x, y - 6, Math.min(CW, CH) * 0.42, 0, 7); c.fill();
          }
          item(c, it, x, y - 8, Math.min(CW, CH) * 0.3);
          if (sel) { c.fillStyle = '#ffe48a'; c.beginPath(); c.arc(x + CW * 0.3, y - CH * 0.32, 8, 0, 7); c.fill(); label(c, '✓', x + CW * 0.3, y - CH * 0.32 + 4, '#3a2416', 'center', 11); }
          if (phase === 'pick' && i === cur) { c.strokeStyle = '#ffffff'; c.lineWidth = 2.5; c.beginPath(); c.roundRect(x - CW / 2 + 4, y - CH / 2 - 4, CW - 8, CH - 6, 10); c.stroke(); }
        });
        label(c, msgT > 0 ? msg : phase === 'pick' ? `Im Korb ${picked.size} / ${K} · Pfeile wählen, Leertaste einpacken` : '', W / 2, H - 16, '#f6e7c8', 'center');
      }
      c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(8, 48, 210, 22);
      label(c, `Runde ${Math.min(roundI + 1, ROUNDS)} / ${ROUNDS} · ${K} Dinge`, 16, 64, '#f6e7c8');
      c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(W - 78, 48, 70, 22);
      label(c, '♥'.repeat(lives), W - 16, 65, '#ff7a6a', 'right', 16);
      finale.draw(c, '#f6e7c8', '#3a2416');
    }
  };
  return self;
}
