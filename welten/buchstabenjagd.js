/* =====================================================================
   WELT – Buchstabenjagd: Im Setzkasten steckt genau einmal der gesuchte Buchstabe.
   Finde ihn, fahr mit den Pfeiltasten hin und greif mit der Leertaste zu. Ab Level 5 lauern ähnliche Lettern.
   ===================================================================== */
function makeBuchstabenjagd(next, level = 0) {
  const COLS = [5, 6, 6, 7, 8, 8, 9, 9, 10, 10][level], ROWS = [3, 4, 4, 5, 5, 5, 6, 6, 6, 7][level];
  const ROUNDS = [4, 5, 5, 6, 6, 6, 7, 7, 8, 8][level], SIM = [0, 0, 0, 0, 0.4, 0.55, 0.7, 0.8, 0.9, 1][level];
  const F = [1.7, 1.6, 1.5, 1.45, 1.4, 1.35, 1.3, 1.25, 1.2, 1.15][level];
  const TIME = Math.round(ROUNDS * (2 + COLS * ROWS * 0.045 + (COLS + ROWS) * 0.13) * F);
  const ABC = 'ABCDEFGHJKLMNPRSTUVWXYZ'.split('');
  const GROUPS = ['OQCGD', 'EFBPR', 'MNWH', 'VYUX', 'KXYZ', 'bdpq', 'S5Z2', 'mnhu', '8B3E'].map(s => s.split(''));
  const CELL = Math.min(56, Math.floor(560 / COLS), Math.floor(280 / ROWS)), GX = W / 2 - COLS * CELL / 2, GY = 80 + (280 - ROWS * CELL) / 2;
  const finale = makeFinale(next);
  const rep = makeRepeater(0.22, 0.09);
  const ri = n => Math.floor(Math.random() * n);
  let grid, target, tpos, cur, roundI, timeLeft, failed, failT, wrong, found, t = 0, id = 0;
  function newRound() {
    let pool;
    if (SIM > 0) { const g = GROUPS[ri(GROUPS.length)], lt = g.filter(ch => /[A-Za-z]/.test(ch)); target = lt[ri(lt.length)]; pool = g.filter(ch => ch !== target); }
    else { target = ABC[ri(ABC.length)]; pool = []; }
    const other = ABC.filter(ch => ch !== target && !pool.includes(ch));
    grid = [];
    for (let i = 0; i < COLS * ROWS; i++) grid.push(pool.length && Math.random() < SIM ? pool[ri(pool.length)] : other[ri(other.length)]);
    tpos = ri(COLS * ROWS); grid[tpos] = target; id++;
  }
  function reset() { roundI = 0; timeLeft = TIME; failed = false; wrong = null; found = 0; cur = { x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2) }; newRound(); }
  reset();
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ fin: finale.active, failed, cur, tx: tpos % COLS, ty: Math.floor(tpos / COLS), cells: COLS * ROWS, id }), // für Testprogramme
    update(dt) {
      t += dt; found = Math.max(0, found - dt * 3);
      if (wrong) { wrong.t -= dt; if (wrong.t <= 0) wrong = null; }
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      if (failed) { failT += dt; if (failT > 0.6 && pressed.action) { died(); reset(); } return; }
      timeLeft -= dt;
      if (timeLeft <= 0) { timeLeft = 0; failed = true; failT = 0; Klang.tone(90, 0.5); return; }
      const d = rep(dt);
      if (d) { cur.x = clamp(cur.x + d[0], 0, COLS - 1); cur.y = clamp(cur.y + d[1], 0, ROWS - 1); Klang.tone(500, 0.02); }
      if (pressed.action) {
        if (cur.y * COLS + cur.x === tpos) {
          roundI++; found = 1; Klang.tone(880, 0.12);
          if (roundI >= ROUNDS) finale.start(); else newRound();
        } else { timeLeft = Math.max(0, timeLeft - 3); wrong = { x: cur.x, y: cur.y, t: 0.5 }; Klang.tone(130, 0.15); }
      }
    },
    draw(c) {
      c.fillStyle = '#2a1a10'; c.fillRect(0, 0, W, H);
      c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 2;
      for (let y = 6; y < H; y += 18) { c.beginPath(); c.moveTo(0, y); for (let x = 0; x <= W; x += 40) c.lineTo(x, y + Math.sin(x * 0.03 + y) * 3); c.stroke(); }
      // Setzkasten-Rahmen
      c.fillStyle = '#5a3a1e'; c.fillRect(GX - 14, GY - 14, COLS * CELL + 28, ROWS * CELL + 28);
      c.fillStyle = '#3a2412'; c.fillRect(GX - 4, GY - 4, COLS * CELL + 8, ROWS * CELL + 8);
      const fs = Math.round(CELL * 0.5);
      for (let i = 0; i < COLS * ROWS; i++) {
        const cx = i % COLS, cy = Math.floor(i / COLS), x = GX + cx * CELL, y = GY + cy * CELL;
        c.fillStyle = '#1e120a'; c.fillRect(x + 2, y + 2, CELL - 4, CELL - 4);
        c.fillStyle = (wrong && wrong.x === cx && wrong.y === cy) ? '#d85a4a' : '#d9c79e'; c.fillRect(x + 6, y + 6, CELL - 12, CELL - 12);
        c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(x + 6, y + 6, CELL - 12, 3);
        label(c, grid[i], x + CELL / 2, y + CELL / 2 + fs * 0.36, '#2a1a10', 'center', fs);
      }
      // Cursor
      const qx = GX + cur.x * CELL, qy = GY + cur.y * CELL;
      c.strokeStyle = '#ffd24a'; c.lineWidth = 3; c.strokeRect(qx + 2.5, qy + 2.5, CELL - 5, CELL - 5);
      c.strokeStyle = `rgba(255,210,74,${0.4 + 0.3 * Math.sin(t * 8)})`; c.lineWidth = 1; c.strokeRect(qx - 1.5, qy - 1.5, CELL + 3, CELL + 3);
      // Ziel
      c.fillStyle = '#5a3a1e'; c.fillRect(W / 2 - 34, 8, 68, 58);
      c.fillStyle = found > 0 ? '#9dffb0' : '#f2e4bc'; c.fillRect(W / 2 - 28, 14, 56, 46);
      label(c, target, W / 2, 50, '#2a1a10', 'center', 32);
      label(c, 'Suche:', W / 2 - 44, 44, '#e8d4a8', 'right', 13);
      label(c, `Runde ${Math.min(roundI + 1, ROUNDS)} / ${ROUNDS}`, 16, 26, '#e8d4a8');
      label(c, `${Math.ceil(timeLeft)} s`, W - 16, 26, timeLeft < 8 ? '#ff7a6a' : '#e8d4a8', 'right', 14);
      c.fillStyle = 'rgba(255,255,255,0.1)'; c.fillRect(16, H - 14, W - 32, 5);
      c.fillStyle = timeLeft < 8 ? '#ff7a6a' : '#ffd24a'; c.fillRect(16, H - 14, (W - 32) * clamp(timeLeft / TIME, 0, 1), 5);
      label(c, 'Pfeiltasten: Greifer bewegen · Leertaste: zugreifen · Fehlgriff −3 s', W / 2, H - 24, '#bfa47a', 'center', 11);
      if (failed) { c.fillStyle = 'rgba(42,26,16,0.94)'; c.fillRect(0, 160, W, 80); label(c, `Zeit abgelaufen in Runde ${roundI + 1}. Leertaste: neuer Versuch`, W / 2, 205, '#ffd0b0', 'center', 14); }
      finale.draw(c, '#e8d4a8', '#5a3a1e');
    }
  };
  return self;
}
