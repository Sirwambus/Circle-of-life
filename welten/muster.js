/* =====================================================================
   WELT – Muster: Ein Glasfenster leuchtet kurz in bunten Farben auf und wird wieder dunkel.
   Bau das Muster nach: Pfeile wählen ein Feld, Leertaste wechselt dessen Farbe, „Fertig“ prüft.
   ===================================================================== */
function makeMuster(next, level = 0) {
  const N = [3, 3, 4, 4, 4, 5, 5, 5, 5, 5][level], F = [3, 4, 4, 5, 6, 6, 7, 8, 8, 9][level], C = [2, 2, 2, 3, 3, 3, 3, 4, 4, 4][level];
  const SHOWT = [3, 3, 3.5, 4, 4, 4.5, 4.5, 5, 4.5, 5][level], ROUNDS = 3, LIVES = 3;
  const GLAS = ['#e8323e', '#2f74ff', '#2fcf62', '#ffbf2f'], NAMES = ['Rubin', 'Saphir', 'Smaragd', 'Bernstein'];
  const CS = Math.min(56, 260 / N), X0 = W / 2 - N * CS / 2 - 50, Y0 = 62 + (260 - N * CS) / 2;
  const BTN = { x: X0, y: Y0 + N * CS + 14, w: N * CS, h: 30 };
  const finale = makeFinale(next);
  let goal, grid, phase, timer, cur, roundI, lives, t = 0, msg = '', msgT = 0;
  const rep = makeRepeater();
  function newRound() {
    goal = new Array(N * N).fill(0); let filled = 0, k = 0;
    while (filled < F) {
      const col = k < C ? k + 1 : 1 + Math.floor(Math.random() * C); k++;
      const free = goal.map((v, i) => v ? -1 : i).filter(i => i >= 0); let at = free[Math.floor(Math.random() * free.length)];
      const size = 1 + Math.floor(Math.random() * 3);
      for (let s = 0; s < size && filled < F && at >= 0; s++) {
        goal[at] = col; filled++;
        const x = at % N, y = Math.floor(at / N);
        const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [x + dx, y + dy]).filter(([a, b]) => a >= 0 && b >= 0 && a < N && b < N && !goal[b * N + a]);
        at = nb.length ? (([a, b]) => b * N + a)(nb[Math.floor(Math.random() * nb.length)]) : -1;
      }
    }
    grid = new Array(N * N).fill(0); phase = 'show'; timer = SHOWT + 0.5; cur = 0;
  }
  function reset() { roundI = 0; lives = LIVES; newRound(); }
  reset();
  function motif(c, col, x, y, r) { // kleines Lichtzeichen je Farbe, damit Farben auch ohne Farbsehen unterscheidbar sind
    c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath();
    if (col === 1) c.arc(x, y, r, 0, 7);
    else if (col === 2) { c.moveTo(x, y - r * 1.2); c.lineTo(x + r, y); c.lineTo(x, y + r * 1.2); c.lineTo(x - r, y); }
    else if (col === 3) { c.moveTo(x, y - r * 1.1); c.lineTo(x + r * 1.1, y + r * 0.8); c.lineTo(x - r * 1.1, y + r * 0.8); }
    else { c.rect(x - r * 1.1, y - r * 0.3, r * 2.2, r * 0.6); c.rect(x - r * 0.3, y - r * 1.1, r * 0.6, r * 2.2); }
    c.fill();
  }
  function glass(c, col, px, py, s, a) {
    if (!col) { c.fillStyle = '#141024'; c.fillRect(px, py, s, s); return; }
    c.save(); c.globalAlpha = a; c.shadowColor = GLAS[col - 1]; c.shadowBlur = 14;
    c.fillStyle = GLAS[col - 1]; c.fillRect(px, py, s, s); c.restore();
    c.globalAlpha = a; c.fillStyle = 'rgba(255,255,255,0.18)'; c.beginPath(); c.moveTo(px, py); c.lineTo(px + s * 0.6, py); c.lineTo(px, py + s * 0.6); c.fill();
    motif(c, col, px + s / 2, py + s / 2, s * 0.11); c.globalAlpha = 1;
  }
  const onBtn = () => cur === N * N;
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ fin: finale.active, phase, goal: phase === 'show' ? goal : null, grid, cur, N, C }), // für Testprogramme
    update(dt) {
      t += dt; msgT -= dt;
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      if (phase === 'show') { timer -= dt; if (timer <= 0) phase = 'build'; }
      else if (phase === 'build') {
        const d = rep(dt);
        if (d) {
          if (onBtn()) { if (d[1] < 0) cur = (N - 1) * N + Math.floor(N / 2); }
          else { const x = cur % N, y = Math.floor(cur / N); if (y === N - 1 && d[1] > 0) cur = N * N; else cur = clamp(y + d[1], 0, N - 1) * N + clamp(x + d[0], 0, N - 1); }
        }
        if (pressed.action) {
          if (!onBtn()) { grid[cur] = (grid[cur] + 1) % (C + 1); Klang.tone(300 + grid[cur] * 80, 0.12); }
          else if (grid.every((v, i) => v === goal[i])) { roundI++; Klang.tone(660, 0.5); if (roundI >= ROUNDS) { finale.start(); return; } msg = 'Genau so!'; msgT = 1.3; phase = 'wait'; timer = 1.4; }
          else { lives--; msg = lives > 0 ? 'Nicht ganz – rot markiert sind die Fehler.' : 'Keine Versuche mehr. Von vorn.'; msgT = 2.6; phase = 'reveal'; timer = 2.8; Klang.tone(150, 0.4); }
        }
      } else { timer -= dt; if (timer <= 0) { if (lives <= 0) { died(); reset(); } else newRound(); } }
    },
    draw(c) {
      const bg = c.createRadialGradient(W / 2, 180, 20, W / 2, 200, 400); bg.addColorStop(0, '#2a1f4a'); bg.addColorStop(1, '#0a0716'); c.fillStyle = bg; c.fillRect(0, 0, W, H);
      // Spitzbogen um das Fenster
      const cx = X0 + N * CS / 2;
      c.fillStyle = '#3a3050'; c.beginPath(); c.moveTo(X0 - 22, Y0 + N * CS + 8); c.lineTo(X0 - 22, Y0 + 10); c.quadraticCurveTo(X0 - 22, Y0 - 34, cx, Y0 - 44); c.quadraticCurveTo(X0 + N * CS + 22, Y0 - 34, X0 + N * CS + 22, Y0 + 10); c.lineTo(X0 + N * CS + 22, Y0 + N * CS + 8); c.fill();
      for (let i = 0; i < 6; i++) { c.fillStyle = `hsla(${(i * 60 + t * 20) % 360},70%,60%,0.5)`; c.beginPath(); c.arc(cx + Math.cos(i * Math.PI / 3) * 9, Y0 - 20 + Math.sin(i * Math.PI / 3) * 9, 5, 0, 7); c.fill(); }
      const showGoal = phase === 'show' && timer < SHOWT;
      for (let i = 0; i < N * N; i++) {
        const px = X0 + (i % N) * CS, py = Y0 + Math.floor(i / N) * CS;
        glass(c, showGoal ? goal[i] : phase === 'show' ? 0 : grid[i], px, py, CS, 1);
        if (phase === 'reveal' && grid[i] !== goal[i]) {
          c.strokeStyle = '#ff4a5a'; c.lineWidth = 3; c.strokeRect(px + 4, py + 4, CS - 8, CS - 8);
          if (goal[i]) { c.fillStyle = GLAS[goal[i] - 1]; c.beginPath(); c.arc(px + CS - 10, py + 10, 6, 0, 7); c.fill(); }
          else { c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.beginPath(); c.arc(px + CS - 10, py + 10, 5, 0, 7); c.stroke(); }
        }
      }
      c.strokeStyle = '#08060e'; c.lineWidth = 4; // Bleiruten
      for (let k = 0; k <= N; k++) { c.beginPath(); c.moveTo(X0 + k * CS, Y0); c.lineTo(X0 + k * CS, Y0 + N * CS); c.moveTo(X0, Y0 + k * CS); c.lineTo(X0 + N * CS, Y0 + k * CS); c.stroke(); }
      if (phase === 'build' && !onBtn()) { const px = X0 + (cur % N) * CS, py = Y0 + Math.floor(cur / N) * CS; c.strokeStyle = '#ffffff'; c.lineWidth = 3; c.strokeRect(px + 2, py + 2, CS - 4, CS - 4); }
      if (phase !== 'show') {
        c.fillStyle = onBtn() && phase === 'build' ? '#ffe9a8' : '#3a3050'; c.beginPath(); c.roundRect(BTN.x, BTN.y, BTN.w, BTN.h, 8); c.fill();
        label(c, 'Fertig ✓', BTN.x + BTN.w / 2, BTN.y + 20, onBtn() && phase === 'build' ? '#2a1f4a' : '#e8e0ff', 'center', 13);
      }
      // Farbleiste: Reihenfolge beim Wechseln
      const lx = X0 + N * CS + 50; label(c, 'Leertaste:', lx, Y0 + 12, '#cfc4ff');
      for (let k = 0; k <= C; k++) {
        const y = Y0 + 26 + k * 40; glass(c, k, lx, y, 30, 1); c.strokeStyle = '#08060e'; c.lineWidth = 2; c.strokeRect(lx, y, 30, 30);
        label(c, k ? NAMES[k - 1] : 'leer', lx + 40, y + 20, '#cfc4ff');
      }
      label(c, `Fenster ${Math.min(roundI + 1, ROUNDS)} / ${ROUNDS} · ${F} Gläser`, 16, 26, '#e8e0ff');
      label(c, '♥'.repeat(lives), W - 16, 26, '#ff8aa8', 'right', 16);
      const hint = finale.active ? '' : phase === 'show' ? 'Merk dir das Muster …' : phase === 'build' ? 'Pfeile wählen · Leertaste färbt · unten „Fertig“' : '';
      label(c, msgT > 0 ? msg : hint, W / 2, H - 12, '#e8e0ff', 'center');
      finale.draw(c, '#e8e0ff', '#2a1f4a');
    }
  };
  return self;
}
