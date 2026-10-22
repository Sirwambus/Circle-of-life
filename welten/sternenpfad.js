/* =====================================================================
   WELT – Sternenpfad: Ein Sternbild zeichnet sich Stern für Stern. Danach verlischt es,
   und du gehst den Weg aus dem Gedächtnis nach.
   ===================================================================== */
function makeSternenpfad(next, level = 0) {
  const N = [5, 6, 6, 7, 7, 7, 8, 8, 8, 8][level], LENS = [[4, 5, 6], [6, 7, 8], [8, 9, 10], [10, 11, 12], [12, 13, 14], [13, 14, 15], [14, 15, 16], [15, 16, 17], [16, 17, 18], [17, 18, 19]][level], SHOW = [0.5, 0.42, 0.34, 0.3, 0.27, 0.26, 0.25, 0.24, 0.23, 0.22][level], LIVES = 3;
  const finale = makeFinale(next);
  const CELL = Math.min(300 / N, 56), X0 = W / 2 - CELL * (N - 1) / 2, Y0 = H / 2 - CELL * (N - 1) / 2 + 6;
  const twinkle = Array.from({ length: 120 }, () => [Math.random() * W, Math.random() * H, Math.random() * 6]);
  let roundI, path, phase, timer, shown, walked, lives, t = 0, msg = '', msgT = 0;
  function makePath(len) {
    for (;;) {
      const p = [[Math.floor(Math.random() * N), Math.floor(Math.random() * N)]];
      while (p.length < len) {
        const [x, y] = p[p.length - 1];
        const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [x + dx, y + dy]).filter(([a, b]) => a >= 0 && b >= 0 && a < N && b < N && !p.some(q => q[0] === a && q[1] === b));
        if (!opts.length) break;
        p.push(opts[Math.floor(Math.random() * opts.length)]);
      }
      if (p.length === len) return p;
    }
  }
  function newRound() { path = makePath(LENS[roundI]); phase = 'show'; timer = 0.8; shown = 0; walked = 1; }
  function reset() { roundI = 0; lives = LIVES; newRound(); }
  reset();
  const sx = x => X0 + x * CELL, sy = y => Y0 + y * CELL;
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ fin: finale.active, path, walked, phase }), // für Testprogramme
    update(dt) {
      t += dt; msgT -= dt;
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      if (phase === 'show') {
        timer -= dt;
        if (timer <= 0) { shown++; timer = SHOW; if (shown <= path.length) Klang.tone(330 * Math.pow(1.122, shown), 0.6); if (shown > path.length + 1) phase = 'input'; }
      } else if (phase === 'input') {
        const d = dirOf(pressed); if (!d) return;
        const [x, y] = path[walked - 1], want = path[walked];
        if (x + d[0] === want[0] && y + d[1] === want[1]) {
          walked++; Klang.tone(330 * Math.pow(1.122, walked), 0.5);
          if (walked >= path.length) {
            roundI++;
            if (roundI >= LENS.length) { finale.start(); return; }
            msg = 'Sternbild vollendet'; msgT = 1.2; newRound(); timer = 1.4;
          }
        } else {
          lives--; msg = lives > 0 ? 'Falscher Stern. Ein neues Sternbild …' : 'Keine Versuche mehr. Von vorn.'; msgT = 1.6;
          phase = 'reveal'; timer = 1.4;
        }
      } else if (phase === 'reveal') {
        timer -= dt;
        if (timer <= 0) { if (lives <= 0) { died(); reset(); } else newRound(); }
      }
    },
    draw(c) {
      c.fillStyle = '#030616'; c.fillRect(0, 0, W, H);
      for (const [x, y, p] of twinkle) { c.fillStyle = `rgba(200,220,255,${0.25 + 0.25 * Math.sin(t * 2 + p)})`; c.fillRect(x, y, 1.5, 1.5); }
      const visible = phase === 'show' ? Math.min(shown, path.length) : phase === 'reveal' ? path.length : walked;
      c.strokeStyle = phase === 'reveal' ? 'rgba(255,120,150,0.8)' : 'rgba(170,200,255,0.8)'; c.lineWidth = 2;
      c.beginPath(); for (let i = 0; i < visible; i++) c[i ? 'lineTo' : 'moveTo'](sx(path[i][0]), sy(path[i][1])); c.stroke();
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const idx = path.findIndex(q => q[0] === x && q[1] === y), on = idx >= 0 && idx < visible;
        c.fillStyle = on ? '#ffffff' : 'rgba(150,170,230,0.35)';
        c.save(); if (on) { c.shadowColor = '#bcd4ff'; c.shadowBlur = 16; }
        c.beginPath(); c.arc(sx(x), sy(y), on ? 6 : 3, 0, 7); c.fill(); c.restore();
      }
      if (phase === 'input') { const [x, y] = path[walked - 1]; c.strokeStyle = '#ffd86b'; c.lineWidth = 2; c.beginPath(); c.arc(sx(x), sy(y), 13 + Math.sin(t * 6) * 2, 0, 7); c.stroke(); }
      if (phase !== 'show') { const [x, y] = path[0]; c.strokeStyle = 'rgba(255,216,107,0.5)'; c.beginPath(); c.arc(sx(x), sy(y), 18, 0, 7); c.stroke(); }
      label(c, `Sternbild ${Math.min(roundI + 1, LENS.length)} / ${LENS.length} · ${LENS[Math.min(roundI, LENS.length - 1)]} Sterne`, 16, 26, '#d8e4ff');
      label(c, '♥'.repeat(lives), W - 16, 26, '#ff8fb0', 'right', 16);
      label(c, msgT > 0 ? msg : phase === 'show' ? 'Präg dir den Weg ein …' : 'Geh den Weg mit den Pfeiltasten nach', W / 2, H - 16, '#aab8e8', 'center');
      finale.draw(c, '#d8e4ff', '#0b1236');
    }
  };
  return self;
}
