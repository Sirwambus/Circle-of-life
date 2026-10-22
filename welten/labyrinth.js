/* =====================================================================
   WELT – Labyrinth: Ein zufälliges Heckenlabyrinth. Lauf zur Tür, bevor die Zeit abläuft.
   ===================================================================== */
function makeLabyrinth(next, level = 0) {
  const CWN = [10, 13, 16, 19, 22, 24, 26, 28, 30, 32][level], CHN = [6, 8, 9, 11, 12, 13, 14, 15, 16, 17][level], PER = [0.5, 0.42, 0.36, 0.32, 0.29, 0.27, 0.25, 0.24, 0.23, 0.22][level];
  const CS = Math.floor(Math.min(600 / CWN, 350 / CHN)), OX = (W - CWN * CS) / 2, OY = 32 + (360 - CHN * CS) / 2;
  let walls, pl, vis, timeLeft, total, started, failed, trail, t = 0;
  const rep = makeRepeater(0.14, 0.075);
  // Wände pro Zelle als Bits: 1 oben, 2 rechts, 4 unten, 8 links
  function build() {
    walls = Array.from({ length: CHN }, () => Array(CWN).fill(15));
    const seen = Array.from({ length: CHN }, () => Array(CWN).fill(false)), st = [[0, 0]]; seen[0][0] = true;
    const D = [[0, -1, 1, 4], [1, 0, 2, 8], [0, 1, 4, 1], [-1, 0, 8, 2]];
    while (st.length) {
      const [x, y] = st[st.length - 1];
      const opts = D.filter(([dx, dy]) => { const nx = x + dx, ny = y + dy; return nx >= 0 && ny >= 0 && nx < CWN && ny < CHN && !seen[ny][nx]; });
      if (!opts.length) { st.pop(); continue; }
      const [dx, dy, a, b] = opts[Math.floor(Math.random() * opts.length)];
      walls[y][x] &= ~a; walls[y + dy][x + dx] &= ~b; seen[y + dy][x + dx] = true; st.push([x + dx, y + dy]);
    }
    // kürzester Weg für das Zeitlimit
    const dist = Array.from({ length: CHN }, () => Array(CWN).fill(-1)), q = [[0, 0]]; dist[0][0] = 0;
    while (q.length) { const [x, y] = q.shift(); for (const [dx, dy, a] of D) { const nx = x + dx, ny = y + dy; if (!(walls[y][x] & a) && dist[ny][nx] < 0) { dist[ny][nx] = dist[y][x] + 1; q.push([nx, ny]); } } }
    total = dist[CHN - 1][CWN - 1] * PER + 4; timeLeft = total;
  }
  function reset() { build(); pl = { x: 0, y: 0 }; vis = { x: 0, y: 0 }; started = false; failed = false; trail = []; }
  reset();
  const self = {
    done: false,
    door: () => ({ x: OX + (CWN - 1) * CS + CS * 0.2, y: OY + (CHN - 1) * CS + CS * 0.08, w: CS * 0.6, h: CS * 0.84 }),
    test: () => ({ walls, pl }), // für Testprogramme
    update(dt) {
      t += dt;
      if (failed) { if (pressed.action || dirOf(pressed)) { died(); reset(); } return; }
      const d = rep(dt);
      if (d) {
        started = true;
        const bit = d[1] === -1 ? 1 : d[0] === 1 ? 2 : d[1] === 1 ? 4 : 8;
        if (!(walls[pl.y][pl.x] & bit)) { trail.push({ ...pl }); if (trail.length > 30) trail.shift(); pl.x += d[0]; pl.y += d[1]; }
      }
      if (started) { timeLeft -= dt; if (timeLeft <= 0) failed = true; }
      vis.x += (pl.x - vis.x) * Math.min(1, dt * 20); vis.y += (pl.y - vis.y) * Math.min(1, dt * 20);
      if (pl.x === CWN - 1 && pl.y === CHN - 1) self.done = true;
    },
    draw(c) {
      c.fillStyle = '#04140c'; c.fillRect(0, 0, W, H);
      c.fillStyle = '#0a2416'; c.fillRect(OX, OY, CWN * CS, CHN * CS);
      paintDoor(c, self.door(), { frame: '#1d6b3c', panel: '#2e9a58', knob: '#d9ff6b', light: next, open: 0.5 });
      c.save(); c.shadowColor = '#3dff8f'; c.shadowBlur = 8; c.strokeStyle = '#3dff8f'; c.lineWidth = Math.max(2, CS * 0.12); c.lineCap = 'round';
      c.beginPath();
      for (let y = 0; y < CHN; y++) for (let x = 0; x < CWN; x++) {
        const w = walls[y][x], px = OX + x * CS, py = OY + y * CS;
        if (w & 1) { c.moveTo(px, py); c.lineTo(px + CS, py); }
        if (w & 8) { c.moveTo(px, py); c.lineTo(px, py + CS); }
        if (y === CHN - 1 && (w & 4)) { c.moveTo(px, py + CS); c.lineTo(px + CS, py + CS); }
        if (x === CWN - 1 && (w & 2)) { c.moveTo(px + CS, py); c.lineTo(px + CS, py + CS); }
      }
      c.stroke(); c.restore();
      trail.forEach((p, i) => { c.fillStyle = `rgba(217,255,107,${i / trail.length * 0.4})`; c.beginPath(); c.arc(OX + p.x * CS + CS / 2, OY + p.y * CS + CS / 2, CS * 0.12, 0, 7); c.fill(); });
      c.save(); c.shadowColor = '#d9ff6b'; c.shadowBlur = 14; c.fillStyle = '#f2ffc4';
      c.beginPath(); c.arc(OX + vis.x * CS + CS / 2, OY + vis.y * CS + CS / 2, CS * 0.28, 0, 7); c.fill(); c.restore();
      label(c, started ? `${Math.ceil(Math.max(0, timeLeft))} s` : `${Math.round(total)} s Zeit · die Uhr startet beim ersten Schritt`, W - 16, 22, timeLeft < 5 ? '#ff6b6b' : '#c9ffd9', 'right');
      label(c, 'Lauf zur Tür unten rechts', 16, 22, '#c9ffd9');
      if (failed) { c.fillStyle = 'rgba(4,20,12,0.9)'; c.fillRect(0, 160, W, 80); label(c, 'Zeit abgelaufen. Taste: neues Labyrinth', W / 2, 205, '#ff9db0', 'center', 14); }
    }
  };
  return self;
}
