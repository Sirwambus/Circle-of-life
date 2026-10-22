/* =====================================================================
   WELT – Positionen: Einige Felder leuchten kurz auf. Markier danach genau diese Felder.
   ===================================================================== */
function makePositionen(next, level = 0) {
  const N = [4, 4, 5, 5, 6, 6, 6, 7, 7, 7][level], K = [3, 5, 6, 8, 10, 11, 12, 13, 14, 15][level], SHOWT = [1.6, 2, 2, 2.2, 2.4, 2.3, 2.2, 2.3, 2.2, 2.1][level], ROUNDS = 3, LIVES = 3;
  const finale = makeFinale(next);
  const CELL = Math.min(300 / N, 64), X0 = W / 2 - CELL * N / 2, Y0 = H / 2 - CELL * N / 2 + 8;
  let lit, marked, phase, timer, cur, roundI, lives, t = 0, msg = '', msgT = 0;
  const rep = makeRepeater();
  function newRound() { lit = new Set(); while (lit.size < K) lit.add(Math.floor(Math.random() * N * N)); marked = new Set(); phase = 'show'; timer = SHOWT + 0.5; }
  function reset() { roundI = 0; lives = LIVES; cur = { x: 0, y: 0 }; newRound(); }
  reset();
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ fin: finale.active, lit, marked, phase, cur, N }), // für Testprogramme
    update(dt) {
      t += dt; msgT -= dt;
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      if (phase === 'show') { timer -= dt; if (timer <= 0) phase = 'pick'; }
      else if (phase === 'pick') {
        const d = rep(dt); if (d) { cur.x = clamp(cur.x + d[0], 0, N - 1); cur.y = clamp(cur.y + d[1], 0, N - 1); }
        if (pressed.action) {
          const i = cur.y * N + cur.x;
          if (marked.has(i)) marked.delete(i); else marked.add(i);
          if (marked.size === K) {
            const ok = [...marked].every(m => lit.has(m));
            if (ok) { roundI++; Klang.tone(587, 0.6); if (roundI >= ROUNDS) { finale.start(); return; } msg = 'Alle gefunden!'; msgT = 1.2; phase = 'wait'; timer = 1.2; }
            else { lives--; msg = lives > 0 ? 'Nicht ganz. Die richtigen Felder:' : 'Keine Versuche mehr. Von vorn.'; msgT = 1.8; phase = 'reveal'; timer = 1.8; }
          }
        }
      } else if (phase === 'wait' || phase === 'reveal') { timer -= dt; if (timer <= 0) { if (lives <= 0) { died(); reset(); } else newRound(); } }
    },
    draw(c) {
      const bg = c.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#0d1a2b'); bg.addColorStop(1, '#1f0d2b'); c.fillStyle = bg; c.fillRect(0, 0, W, H);
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const i = y * N + x, px = X0 + x * CELL, py = Y0 + y * CELL;
        const showLit = (phase === 'show' && timer < SHOWT) || phase === 'reveal';
        const on = showLit && lit.has(i), mk = phase !== 'show' && marked.has(i);
        c.fillStyle = on ? '#7ad7ff' : mk ? (phase === 'reveal' && !lit.has(i) ? '#ff6b8a' : '#c49bff') : 'rgba(255,255,255,0.06)';
        c.save(); if (on || mk) { c.shadowColor = c.fillStyle; c.shadowBlur = 18; }
        c.beginPath(); c.roundRect(px + 4, py + 4, CELL - 8, CELL - 8, 10); c.fill(); c.restore();
        if (phase === 'pick' && x === cur.x && y === cur.y) { c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.beginPath(); c.roundRect(px + 1, py + 1, CELL - 2, CELL - 2, 12); c.stroke(); }
      }
      label(c, `Runde ${Math.min(roundI + 1, ROUNDS)} / ${ROUNDS} · ${K} Felder`, 16, 26, '#d8e8ff');
      label(c, '♥'.repeat(lives), W - 16, 26, '#ff8fb0', 'right', 16);
      const hint = phase === 'show' ? 'Merk dir die leuchtenden Felder …' : phase === 'pick' ? `Markiert ${marked.size} / ${K} · Pfeile und Leertaste` : '';
      label(c, msgT > 0 ? msg : hint, W / 2, H - 14, '#d8e8ff', 'center');
      finale.draw(c, '#d8e8ff', '#1f0d2b');
    }
  };
  return self;
}
