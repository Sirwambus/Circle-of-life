/* =====================================================================
   WELT – Blöcke: Fallende Steine. Räum vier Reihen ab, dann öffnet sich die Tür.
   Grafik: Plakat im Stil der Konstruktivisten.
   ===================================================================== */
function makeBloecke(next, level = 0) {
  // Je Level: mehr Reihen, schnellerer Fall. Level 3 beginnt mit vier Müllreihen.
  const CW = 10, CH = 18, S = 20, OX = 220, OY = 20, GOAL = [4, 8, 12, 16, 20, 24, 28, 32, 36, 40][level], FALL = [0.65, 0.5, 0.38, 0.31, 0.25, 0.22, 0.19, 0.17, 0.15, 0.13][level], JUNK = [0, 0, 4, 6, 8, 8, 9, 10, 10, 11][level];
  const SHAPES = [
    [[1, 1, 1, 1]], [[1, 1], [1, 1]], [[0, 1, 0], [1, 1, 1]], [[1, 0, 0], [1, 1, 1]],
    [[0, 0, 1], [1, 1, 1]], [[0, 1, 1], [1, 1, 0]], [[1, 1, 0], [0, 1, 1]]
  ];
  const COLS = ['#c62828', '#1a1a1a', '#6b6b6b', '#d9a441', '#c62828', '#1a1a1a', '#9a9a9a'];
  let board, cur, nxt, fall, lines, winT, flash = 0, t = 0;
  const hrep = makeRepeater(0.17, 0.06);
  const rand = () => Math.floor(Math.random() * SHAPES.length);
  const spawn = k => ({ m: SHAPES[k], k, x: Math.floor((CW - SHAPES[k][0].length) / 2), y: 0 });
  const rot = m => m[0].map((_, i) => m.map(r => r[i]).reverse());
  const fits = (m, x, y) => m.every((r, j) => r.every((v, i) => !v || (x + i >= 0 && x + i < CW && y + j < CH && (y + j < 0 || !board[y + j][x + i]))));
  function reset() { board = [...Array(CH)].map(() => Array(CW).fill(0));
    for (let y = CH - JUNK; y < CH; y++) { const hole = Math.floor(Math.random() * CW); board[y] = board[y].map((_, x) => x === hole ? 0 : 3); }
    cur = spawn(rand()); nxt = rand(); fall = 0; lines = 0; winT = -1; }
  reset();
  function lock() {
    cur.m.forEach((r, j) => r.forEach((v, i) => { if (v && cur.y + j >= 0) board[cur.y + j][cur.x + i] = cur.k + 1; }));
    const before = board.length;
    board = board.filter(r => r.some(v => !v));
    const n = before - board.length;
    while (board.length < CH) board.unshift(Array(CW).fill(0));
    lines += n;
    if (lines >= GOAL) { winT = 0; return; }
    cur = spawn(nxt); nxt = rand();
    if (!fits(cur.m, cur.x, cur.y)) { died(); flash = 0.5; reset(); }
  }
  const self = {
    done: false,
    door: () => ({ x: 486, y: 230, w: 50, h: 90 }),
    update(dt) {
      t += dt; flash = Math.max(0, flash - dt);
      if (winT >= 0) { winT += dt; if (winT > 1.3) self.done = true; return; }
      const d = hrep(dt);
      if (d && d[0] && fits(cur.m, cur.x + d[0], cur.y)) cur.x += d[0];
      if (pressed.up) { const r = rot(cur.m); for (const k of [0, -1, 1, -2, 2]) if (fits(r, cur.x + k, cur.y)) { cur.m = r; cur.x += k; break; } }
      if (pressed.action) { while (fits(cur.m, cur.x, cur.y + 1)) cur.y++; lock(); return; }
      fall += dt;
      const iv = keys.down ? 0.04 : FALL;
      if (fall >= iv) { fall = 0; if (fits(cur.m, cur.x, cur.y + 1)) cur.y++; else lock(); }
    },
    draw(c) {
      c.fillStyle = '#e9dfcc'; c.fillRect(0, 0, W, H);
      c.fillStyle = '#c62828'; c.beginPath(); c.moveTo(0, 300); c.lineTo(200, 0); c.lineTo(260, 0); c.lineTo(40, 400); c.lineTo(0, 400); c.fill();
      c.fillStyle = '#1a1a1a'; c.beginPath(); c.arc(110, 300, 60, 0, 7); c.fill();
      c.save(); c.translate(70, 170); c.rotate(-Math.PI / 2.6);
      c.font = '26px Bungee, "Arial Black", sans-serif'; c.fillStyle = '#1a1a1a'; c.fillText(`${GOAL} REIHEN`, 0, 0); c.restore();
      c.fillStyle = '#1a1a1a'; c.fillRect(OX - 6, OY - 6, CW * S + 12, CH * S + 12);
      c.fillStyle = '#f3ecdd'; c.fillRect(OX, OY, CW * S, CH * S);
      const cell = (x, y, k) => { c.fillStyle = COLS[k]; c.fillRect(OX + x * S + 1, OY + y * S + 1, S - 2, S - 2); c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(OX + x * S + 4, OY + y * S + 4, S - 8, S - 8); };
      board.forEach((r, y) => r.forEach((v, x) => { if (v) cell(x, y, v - 1); }));
      if (winT < 0) {
        let gy = cur.y; while (fits(cur.m, cur.x, gy + 1)) gy++;
        c.strokeStyle = 'rgba(26,26,26,0.3)';
        cur.m.forEach((r, j) => r.forEach((v, i) => { if (v) c.strokeRect(OX + (cur.x + i) * S + 2.5, OY + (gy + j) * S + 2.5, S - 5, S - 5); }));
        cur.m.forEach((r, j) => r.forEach((v, i) => { if (v && cur.y + j >= 0) cell(cur.x + i, cur.y + j, cur.k); }));
      }
      // Seitenleiste: nächster Stein, Fortschritt, Tür
      label(c, 'NÄCHSTER', 470, 40, '#1a1a1a');
      SHAPES[nxt].forEach((r, j) => r.forEach((v, i) => { if (v) { c.fillStyle = COLS[nxt]; c.fillRect(470 + i * 16, 52 + j * 16, 14, 14); } }));
      label(c, 'REIHEN', 470, 130, '#1a1a1a');
      c.font = '44px Bungee, "Arial Black", sans-serif'; c.fillStyle = '#c62828'; c.fillText(`${Math.min(lines, GOAL)}/${GOAL}`, 466, 180);
      const dr = self.door(), k = Math.min(lines, GOAL) / GOAL;
      paintDoor(c, dr, { frame: '#1a1a1a', panel: '#c62828', knob: '#e9dfcc', light: winT >= 0 ? next : '#3a3a3a', open: winT >= 0 ? clamp(winT, 0, 0.9) : 0 });
      for (let i = 0; i < GOAL; i++) { c.fillStyle = i < lines ? '#c62828' : 'rgba(26,26,26,0.15)'; c.fillRect(dr.x + i * 13, dr.y + dr.h + 10, 11, 8); }
      label(c, '↑ drehen · ↓ schneller · Leertaste fallen lassen', W / 2, H - 4, '#1a1a1a', 'center', 10);
      flashOverlay(c, flash, '198,40,40');
    }
  };
  return self;
}
