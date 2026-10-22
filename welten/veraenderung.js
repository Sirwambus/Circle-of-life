/* =====================================================================
   WELT – Veränderung: Merk dir die Steine im Zengarten. Nach einem kurzen Blinzeln
   hat sich einer verändert: Farbe, Form oder (ab Level 2) Platz. Finde ihn.
   ===================================================================== */
function makeVeraenderung(next, level = 0) {
  const COUNT = [5, 7, 9, 10, 12, 12, 13, 13, 14, 14][level], SHOWT = [3.2, 2.6, 2.1, 1.9, 1.7, 1.6, 1.5, 1.4, 1.3, 1.2][level], ROUNDS = 4, LIVES = 3, MIND = COUNT > 9 ? 70 : 80;
  const COLS = ['#d9534f', '#3e7cb1', '#e8b04a', '#5aa469', '#8e6cc9', '#e07a9f'];
  const SHAPES = ['kreis', 'quadrat', 'dreieck', 'raute', 'stern'];
  const finale = makeFinale(next);
  let items, changed, phase, timer, cur, roundI, lives, t = 0, msg = '', msgT = 0;
  const rep = makeRepeater(0.3, 0.2);
  function place() {
    let out = [], tries = 0;
    while (out.length < COUNT) {
      if (++tries > 4000) { out = []; tries = 0; } // festgefahren: neu verteilen
      const x = 70 + Math.random() * (W - 140), y = 70 + Math.random() * (H - 150);
      if (out.every(o => Math.hypot(o.x - x, o.y - y) > MIND)) out.push({ x, y, shape: SHAPES[Math.floor(Math.random() * 5)], col: COLS[Math.floor(Math.random() * 6)] });
    }
    return out;
  }
  function newRound() { items = place(); changed = -1; phase = 'show'; timer = SHOWT; cur = 0; }
  function mutate() {
    changed = Math.floor(Math.random() * COUNT);
    const it = items[changed], kinds = level === 0 ? ['col', 'shape'] : ['col', 'shape', 'move'];
    const k = kinds[Math.floor(Math.random() * kinds.length)];
    if (k === 'col') it.col = COLS[(COLS.indexOf(it.col) + 1 + Math.floor(Math.random() * 5)) % 6];
    else if (k === 'shape') it.shape = SHAPES[(SHAPES.indexOf(it.shape) + 1 + Math.floor(Math.random() * 4)) % 5];
    else for (let tries = 0; tries < 50; tries++) {
      const x = 70 + Math.random() * (W - 140), y = 70 + Math.random() * (H - 150);
      if (items.every((o, i) => i === changed || Math.hypot(o.x - x, o.y - y) > MIND) && Math.hypot(it.x - x, it.y - y) > 90) { it.x = x; it.y = y; break; }
    }
  }
  function reset() { roundI = 0; lives = LIVES; newRound(); }
  reset();
  function shape(c, s, x, y, r) {
    c.beginPath();
    if (s === 'kreis') c.arc(x, y, r, 0, 7);
    else if (s === 'quadrat') c.rect(x - r * 0.85, y - r * 0.85, r * 1.7, r * 1.7);
    else if (s === 'dreieck') { c.moveTo(x, y - r); c.lineTo(x + r, y + r * 0.8); c.lineTo(x - r, y + r * 0.8); c.closePath(); }
    else if (s === 'raute') { c.moveTo(x, y - r * 1.1); c.lineTo(x + r * 0.8, y); c.lineTo(x, y + r * 1.1); c.lineTo(x - r * 0.8, y); c.closePath(); }
    else for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r * 1.1; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    c.fill();
  }
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ fin: finale.active, phase, changed, cur, items }), // für Testprogramme
    update(dt) {
      t += dt; msgT -= dt;
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      if (phase === 'show') { timer -= dt; if (timer <= 0) { phase = 'blink'; timer = 0.8; } }
      else if (phase === 'blink') { timer -= dt; if (timer <= 0) { mutate(); phase = 'pick'; } }
      else if (phase === 'pick') {
        const d = rep(dt);
        if (d && d[0]) { // ← →: der Reihe nach von links nach rechts, so ist jeder Stein erreichbar
          const order = items.map((o, i) => i).sort((i, j) => items[i].x - items[j].x);
          cur = order[(order.indexOf(cur) + d[0] + order.length) % order.length];
        } else if (d) { // ↑ ↓: nächster Stein in Pfeilrichtung
          const a = items[cur]; let best = -1, bd = 1e9;
          items.forEach((o, i) => { if (i === cur) return; const vx = o.x - a.x, vy = o.y - a.y, along = vx * d[0] + vy * d[1]; if (along <= 0) return; const s = Math.hypot(vx, vy) + Math.abs(vx * d[1] - vy * d[0]); if (s < bd) { bd = s; best = i; } });
          if (best >= 0) cur = best;
        }
        if (pressed.action) {
          if (cur === changed) {
            roundI++; Klang.tone(523, 0.8);
            if (roundI >= ROUNDS) { finale.start(); return; }
            msg = 'Gefunden!'; msgT = 1; newRound();
          } else { lives--; msg = lives > 0 ? 'Das war es nicht.' : 'Keine Versuche mehr. Von vorn.'; msgT = 1.6; phase = 'reveal'; timer = 1.5; }
        }
      } else if (phase === 'reveal') { timer -= dt; if (timer <= 0) { if (lives <= 0) { died(); reset(); } else newRound(); } }
    },
    draw(c) {
      c.fillStyle = '#e8dcc4'; c.fillRect(0, 0, W, H);
      c.strokeStyle = 'rgba(150,125,90,0.35)'; c.lineWidth = 1.5;
      for (let y = 10; y < H; y += 12) { c.beginPath(); for (let x = 0; x <= W; x += 16) c.lineTo(x, y + Math.sin(x * 0.02 + y * 0.1) * 3); c.stroke(); }
      if (phase !== 'blink') for (const [i, it] of items.entries()) {
        c.strokeStyle = 'rgba(150,125,90,0.45)'; c.beginPath(); c.ellipse(it.x, it.y + 4, 34, 26, 0, 0, 7); c.stroke();
        c.fillStyle = 'rgba(60,40,20,0.18)'; c.beginPath(); c.ellipse(it.x + 3, it.y + 20, 20, 6, 0, 0, 7); c.fill();
        c.fillStyle = it.col; shape(c, it.shape, it.x, it.y, 18);
        if (phase === 'pick' && i === cur) { c.strokeStyle = '#2b2118'; c.lineWidth = 3; c.setLineDash([5, 4]); c.beginPath(); c.arc(it.x, it.y, 30, 0, 7); c.stroke(); c.setLineDash([]); c.lineWidth = 1.5; }
        if (phase === 'reveal' && i === changed) { c.strokeStyle = '#d9534f'; c.lineWidth = 3; c.beginPath(); c.arc(it.x, it.y, 32, 0, 7); c.stroke(); c.lineWidth = 1.5; }
      }
      else { c.fillStyle = 'rgba(232,220,196,0.6)'; c.fillRect(0, 0, W, H); }
      label(c, `Runde ${Math.min(roundI + 1, ROUNDS)} / ${ROUNDS}`, 16, 26, '#3b2e20');
      label(c, '♥'.repeat(lives), W - 16, 26, '#b8463f', 'right', 16);
      const hint = phase === 'show' ? `Merk dir alles … ${Math.ceil(timer)}` : phase === 'blink' ? '…' : 'Welcher Stein hat sich verändert? Pfeile wählen, Leertaste bestätigt';
      label(c, msgT > 0 ? msg : hint, W / 2, H - 18, '#3b2e20', 'center');
      finale.draw(c, '#3b2e20', '#c9b48e');
    }
  };
  return self;
}
