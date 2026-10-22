/* =====================================================================
   WELT – Kugellabyrinth: Kipp das Holzbrett mit den Pfeiltasten. Die Kugel rollt mit
   Schwung zur Tür, die Löcher schlucken sie. Leuchtringe merken sich den Fortschritt.
   ===================================================================== */
function makeKugellabyrinth(next, level = 0) {
  // Je Level: mehr Gänge, mehr Löcher, ab Level 2 auch Löcher direkt am Weg, stärkere Neigung.
  const COLS = [4, 5, 5, 6, 6, 7, 7, 8, 8, 9][level], ROWS = [3, 3, 4, 4, 4, 4, 5, 5, 5, 6][level];
  const HOFF = [1, 2, 2, 3, 3, 4, 4, 5, 5, 6][level], ONP = [0, 0, 1, 2, 3, 4, 5, 6, 7, 8][level], ACC = [160, 170, 180, 190, 200, 210, 220, 230, 240, 250][level];
  const BX = 20, BY = 44, BW = 600, BH = 340, WT = 8, HR = 10, BR = 7, R = rng(101 + level * 13);
  const cw = BW / COLS, ch = BH / ROWS, ID = (i, j) => j * COLS + i;
  const cx = i => BX + (i + 0.5) * cw, cy = j => BY + (j + 0.5) * ch;
  // Labyrinth mit Rücksprung-Suche
  const open = Array.from({ length: COLS * ROWS }, () => ({ r: false, d: false })), seen = new Set([0]), st = [[0, 0]];
  while (st.length) {
    const [i, j] = st[st.length - 1];
    const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => [i + a, j + b]).filter(([a, b]) => a >= 0 && b >= 0 && a < COLS && b < ROWS && !seen.has(ID(a, b)));
    if (!nb.length) { st.pop(); continue; }
    const [a, b] = nb[Math.floor(R() * nb.length)];
    if (a > i) open[ID(i, j)].r = true; else if (a < i) open[ID(a, b)].r = true; else if (b > j) open[ID(i, j)].d = true; else open[ID(a, b)].d = true;
    seen.add(ID(a, b)); st.push([a, b]);
  }
  const linked = (i, j, a, b) => a > i ? open[ID(i, j)].r : a < i ? open[ID(a, b)].r : b > j ? open[ID(i, j)].d : open[ID(a, b)].d;
  const nbs = (i, j) => [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => [i + a, j + b]).filter(([a, b]) => a >= 0 && b >= 0 && a < COLS && b < ROWS && linked(i, j, a, b));
  // Weg von Start (oben links) zur Tür (unten rechts)
  const prev = { 0: null }, q = [[0, 0]];
  while (q.length) { const [i, j] = q.shift(); for (const [a, b] of nbs(i, j)) if (!(ID(a, b) in prev)) { prev[ID(a, b)] = [i, j]; q.push([a, b]); } }
  const path = []; for (let c = [COLS - 1, ROWS - 1]; c; c = prev[ID(...c)]) path.unshift(c);
  const onPath = new Set(path.map(c => ID(...c)));
  const walls = [{ x: BX - WT, y: BY - WT, w: BW + 2 * WT, h: WT }, { x: BX - WT, y: BY + BH, w: BW + 2 * WT, h: WT }, { x: BX - WT, y: BY - WT, w: WT, h: BH + 2 * WT }, { x: BX + BW, y: BY - WT, w: WT, h: BH + 2 * WT }];
  for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
    if (i < COLS - 1 && !open[ID(i, j)].r) walls.push({ x: BX + (i + 1) * cw - WT / 2, y: BY + j * ch - WT / 2, w: WT, h: ch + WT });
    if (j < ROWS - 1 && !open[ID(i, j)].d) walls.push({ x: BX + i * cw - WT / 2, y: BY + (j + 1) * ch - WT / 2, w: cw + WT, h: WT });
  }
  // Löcher: in Sackgassen und (ab Level 2) direkt am Weg
  const holes = [], way = path.map(([i, j]) => ({ x: cx(i), y: cy(j) }));
  const shuffle = a => { for (let k = a.length - 1; k > 0; k--) { const m = Math.floor(R() * (k + 1)); [a[k], a[m]] = [a[m], a[k]]; } return a; };
  const dead = shuffle([...Array(COLS * ROWS).keys()].filter(k => !onPath.has(k) && nbs(k % COLS, k / COLS | 0).length === 1));
  for (const k of dead.slice(0, HOFF)) holes.push({ x: cx(k % COLS), y: cy(k / COLS | 0) });
  const cand = shuffle(path.map((c, k) => k).filter(k => k > 1 && k < path.length - 1));
  let placed = 0;
  for (const k of cand) {
    if (placed >= ONP) break;
    const [i, j] = path[k], [pi, pj] = path[k - 1], [ni, nj] = path[k + 1], ex = i - pi, ey = j - pj, ox = ni - i, oy = nj - j;
    if (ex === ox && ey === oy) { // gerade Strecke: Loch seitlich, Weg weicht zur anderen Seite aus
      const sgn = R() < 0.5 ? -1 : 1, off = ex ? ch / 2 - WT / 2 - HR + 1 : cw / 2 - WT / 2 - HR + 1;
      holes.push({ x: cx(i) + (ex ? 0 : sgn * off), y: cy(j) + (ex ? sgn * off : 0) });
      way[k] = { x: cx(i) - (ex ? 0 : sgn * 7), y: cy(j) - (ex ? sgn * 7 : 0) };
    } else { // Kurve: Loch an der Wand, gegen die man mit zu viel Schwung rollt
      holes.push({ x: cx(i) + ex * (cw / 2 - WT / 2 - 3), y: cy(j) + ey * (ch / 2 - WT / 2 - 3) });
    }
    placed++;
  }
  const checks = path.map((c, k) => k).filter(k => k > 0 && k % 8 === 0 && k < path.length - 2);
  const door = { x: BX + BW - 20, y: cy(ROWS - 1) - 20, w: 16, h: 40 };
  const grain = Array.from({ length: 40 }, () => ({ y: BY + R() * BH, a: R() * 6, f: 0.01 + R() * 0.02 }));
  let ball, tilt = { x: 0, y: 0 }, fall = 0, cp = 0, t = 0, msg = '', msgT = 0;
  const reset = () => { const [i, j] = path[cp ? checks[cp - 1] : 0]; ball = { x: cx(i), y: cy(j), vx: 0, vy: 0 }; fall = 0; };
  reset();
  const self = {
    done: false, door: () => door,
    test: () => ({ x: ball.x, y: ball.y, vx: ball.vx, vy: ball.vy, falling: fall > 0, cp, way: way.map(p => ({ ...p })), cpIndex: checks[cp - 1] || 0, holes, cw, ch }), // für Testprogramme
    update(dt) {
      t += dt; msgT -= dt;
      if (fall > 0) { fall -= dt; if (fall <= 0) { died(); reset(); } return; }
      const ix = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), iy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
      tilt.x += clamp(ix - tilt.x, -7 * dt, 7 * dt); tilt.y += clamp(iy - tilt.y, -7 * dt, 7 * dt);
      ball.vx += tilt.x * ACC * dt; ball.vy += tilt.y * ACC * dt;
      ball.vx -= ball.vx * 1.0 * dt; ball.vy -= ball.vy * 1.0 * dt;
      const N = 4;
      for (let n = 0; n < N; n++) {
        ball.x += ball.vx * dt / N; ball.y += ball.vy * dt / N;
        for (const w of walls) {
          const h = circleRect(ball.x, ball.y, BR, w); if (!h) continue;
          ball.x += h.nx * h.depth; ball.y += h.ny * h.depth;
          const d = ball.vx * h.nx + ball.vy * h.ny;
          if (d < 0) { ball.vx -= 1.35 * d * h.nx; ball.vy -= 1.35 * d * h.ny; if (d < -60) Klang.tone(180 + Math.random() * 40, 0.04); }
        }
      }
      for (const h of holes) if (Math.hypot(ball.x - h.x, ball.y - h.y) < HR - 1) {
        fall = 0.7; ball.x = h.x; ball.y = h.y; msg = 'Plopp! Ins Loch gefallen.'; msgT = 1.4; Klang.tone(110, 0.3); return;
      }
      // Leuchtringe als Zwischenstand
      const k = checks[cp];
      if (k !== undefined) { const [i, j] = path[k]; if (Math.hypot(ball.x - cx(i), ball.y - cy(j)) < 16) { cp++; msg = 'Zwischenstand gespeichert'; msgT = 1.2; Klang.tone(880, 0.12); } }
      if (circleRect(ball.x, ball.y, BR, door)) self.done = true;
    },
    draw(c) {
      c.fillStyle = '#2b1a10'; c.fillRect(0, 0, W, H);
      c.save(); c.translate(W / 2, H / 2 + 14); c.transform(1, tilt.y * 0.015, tilt.x * 0.015, 1, 0, 0); c.translate(-W / 2, -H / 2 - 14);
      const wood = c.createLinearGradient(0, BY, 0, BY + BH); wood.addColorStop(0, '#d9a866'); wood.addColorStop(1, '#c08a4a');
      c.fillStyle = wood; c.fillRect(BX, BY, BW, BH);
      c.strokeStyle = 'rgba(120,70,30,0.25)'; c.lineWidth = 1;
      for (const g of grain) { c.beginPath(); for (let x = BX; x <= BX + BW; x += 20) c.lineTo(x, g.y + Math.sin(x * g.f + g.a) * 5); c.stroke(); }
      // aufgemalte Weglinie wie beim echten Spiel
      c.strokeStyle = 'rgba(60,30,10,0.35)'; c.lineWidth = 2; c.setLineDash([2, 6]); c.beginPath();
      for (const p of way) c.lineTo(p.x, p.y); c.stroke(); c.setLineDash([]);
      for (const [n, k] of checks.entries()) { const [i, j] = path[k]; c.strokeStyle = n < cp ? next : 'rgba(255,240,200,0.6)'; c.lineWidth = 2; c.beginPath(); c.arc(cx(i), cy(j), 12, 0, 7); c.stroke(); }
      for (const h of holes) {
        const g = c.createRadialGradient(h.x, h.y, 2, h.x, h.y, HR + 2); g.addColorStop(0, '#000'); g.addColorStop(0.7, '#1a0d05'); g.addColorStop(1, 'rgba(90,50,20,0.9)');
        c.fillStyle = g; c.beginPath(); c.arc(h.x, h.y, HR + 1, 0, 7); c.fill();
      }
      for (const w of walls) { c.fillStyle = 'rgba(40,20,5,0.35)'; c.fillRect(w.x + 3, w.y + 3, w.w, w.h); }
      for (const w of walls) { c.fillStyle = '#7a4a22'; c.fillRect(w.x, w.y, w.w, w.h); c.fillStyle = '#a06a38'; c.fillRect(w.x + 1, w.y + 1, w.w - 2, 2); }
      paintDoor(c, door, { frame: '#5a3418', panel: '#e8c890', knob: '#ffd23f', light: next, glow: next, open: doorOpenness({ x: ball.x - BR, y: ball.y - BR, w: 2 * BR, h: 2 * BR }, door, 120) });
      // Kugel
      const sc = fall > 0 ? fall / 0.7 : 1;
      c.fillStyle = 'rgba(30,15,5,0.35)'; c.beginPath(); c.arc(ball.x + 3, ball.y + 3, BR * sc, 0, 7); c.fill();
      const bg = c.createRadialGradient(ball.x - 2, ball.y - 3, 1, ball.x, ball.y, BR * sc + 0.5); bg.addColorStop(0, '#ffffff'); bg.addColorStop(0.4, '#c8ccd8'); bg.addColorStop(1, '#4a4e5c');
      c.fillStyle = bg; c.beginPath(); c.arc(ball.x, ball.y, BR * sc, 0, 7); c.fill();
      c.restore();
      // Neigungsanzeige
      c.strokeStyle = 'rgba(255,230,190,0.5)'; c.lineWidth = 1.5; c.beginPath(); c.arc(W - 30, 22, 13, 0, 7); c.stroke();
      c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(W - 30 + tilt.x * 9, 22 + tilt.y * 9, 3.5, 0, 7); c.fill();
      label(c, `Ringe ${cp} / ${checks.length}`, 16, 26, '#f5dcb0');
      label(c, msgT > 0 ? msg : 'Pfeiltasten kippen das Brett · Löcher meiden', W / 2, 26, '#f5dcb0', 'center');
    }
  };
  return self;
}
