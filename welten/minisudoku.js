/* =====================================================================
   WELT – Mini-Sudoku: In jeder Zeile, jeder Spalte und jedem Kasten steht jede Zahl genau einmal.
   ↑ ↓ ← → Feld wählen, Leertaste zählt die Zahl hoch.
   ===================================================================== */
function makeMinisudoku(next, level = 0) {
  // Jedes Rätsel wird neu erzeugt und per Löser auf genau eine Lösung geprüft.
  const N = level < 4 ? 4 : 6, BH = 2, BW = N / 2, GIVEN = [11, 9, 7, 6, 24, 20, 17, 14, 12, 11][level], HINT = level < 8;
  const S = N === 4 ? 66 : 50, GX = W / 2 - N * S / 2 - 70, GY = 62 + (N === 4 ? 6 : 0);
  const finale = makeFinale(next);
  let sol, given, grid, cx = 0, cy = 0, t = 0, msg = '', msgT = 0, solvedT = -1;
  const box = (r, c) => Math.floor(r / BH) * BH + Math.floor(c / BW);
  const ok = (g, r, c, v) => { for (let i = 0; i < N; i++) { if (g[r * N + i] === v || g[i * N + c] === v) return false; } const r0 = r - r % BH, c0 = c - c % BW; for (let y = r0; y < r0 + BH; y++) for (let x = c0; x < c0 + BW; x++) if (g[y * N + x] === v) return false; return true; };
  // Zählt Lösungen (bricht bei 'lim' ab); füllt optional zufällig
  function solve(g, lim, rand) {
    let best = -1, cands = null;
    for (let i = 0; i < N * N; i++) if (!g[i]) {
      const cs = []; for (let v = 1; v <= N; v++) if (ok(g, Math.floor(i / N), i % N, v)) cs.push(v);
      if (best < 0 || cs.length < cands.length) { best = i; cands = cs; if (cs.length < 2) break; }
    }
    if (best < 0) return 1;
    if (rand) for (let i = cands.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [cands[i], cands[j]] = [cands[j], cands[i]]; }
    let n = 0;
    for (const v of cands) { g[best] = v; n += solve(g, lim - n, rand); if (n >= lim) { if (!rand) g[best] = 0; return n; } }
    g[best] = 0; return n;
  }
  function generate() {
    let bestG = null;
    for (let tries = 0; tries < 60; tries++) {
      const full = Array(N * N).fill(0); solve(full, 1, true);
      const g = full.slice(), order = Array.from({ length: N * N }, (_, i) => i);
      for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
      let cnt = N * N;
      for (const i of order) { if (cnt <= GIVEN) break; const v = g[i]; g[i] = 0; if (solve(g.slice(), 2, false) !== 1) g[i] = v; else cnt--; }
      if (!bestG || cnt < bestG.cnt) bestG = { g, full, cnt };
      if (cnt <= GIVEN) break;
    }
    sol = bestG.full; given = bestG.g.map(v => v > 0); grid = bestG.g.slice();
  }
  generate();
  const conflict = i => { const v = grid[i]; if (!v) return false; const r = Math.floor(i / N), c = i % N; for (let j = 0; j < N * N; j++) { if (j === i || grid[j] !== v) continue; const r2 = Math.floor(j / N), c2 = j % N; if (r2 === r || c2 === c || box(r2, c2) === box(r, c)) return true; } return false; };
  const rep = makeRepeater(0.24, 0.1);
  const INK = ['#1f2a5c', '#b8322a', '#2c6e49', '#a0602a', '#5b3a8c', '#1d6f86'];
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ N, grid: grid.slice(), given: given.slice(), cx, cy, fin: finale.active, solved: solvedT >= 0 }), // für Testprogramme
    update(dt) {
      t += dt; msgT -= dt;
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      if (solvedT >= 0) { solvedT += dt; if (solvedT > 1.2) finale.start(); return; }
      const d = rep(dt);
      if (d) { cx = (cx + d[0] + N) % N; cy = (cy + d[1] + N) % N; }
      if (pressed.action) {
        const i = cy * N + cx;
        if (given[i]) { msg = 'Diese Zahl steht fest.'; msgT = 1.2; return; }
        grid[i] = (grid[i] + 1) % (N + 1); Klang.tone(300 + grid[i] * 50, 0.08);
        if (grid.every(v => v)) {
          let good = true; for (let j = 0; j < N * N; j++) if (conflict(j)) good = false;
          if (good) { solvedT = 0; Klang.tone(880, 0.3); } else { msg = 'Noch nicht ganz – irgendwo doppelt.'; msgT = 2; }
        }
      }
    },
    draw(c) {
      // Washi-Papier mit Fasern
      c.fillStyle = '#efe6d2'; c.fillRect(0, 0, W, H);
      c.strokeStyle = 'rgba(160,130,90,0.12)'; c.lineWidth = 1;
      for (let i = 0; i < 40; i++) { const y = (i * 53) % H, x = (i * 97) % W; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 30, y + 8, x + 70, y - 4); c.stroke(); }
      // Pinselkreis (Ensō) und Hanko-Stempel
      c.strokeStyle = 'rgba(31,42,92,0.12)'; c.lineWidth = 14; c.beginPath(); c.arc(520, 240, 90, 0.4, 5.9); c.stroke();
      c.fillStyle = solvedT >= 0 ? '#c8372d' : 'rgba(200,55,45,0.75)'; c.beginPath(); c.roundRect(552, 300, 46, 46, 6); c.fill();
      c.strokeStyle = '#efe6d2'; c.lineWidth = 3; c.beginPath(); c.arc(575, 323, 12, 0, 7); c.moveTo(575, 311); c.lineTo(575, 335); c.stroke();
      // Raster
      c.fillStyle = '#f8f3e6'; c.fillRect(GX, GY, N * S, N * S);
      for (let i = 0; i < N * N; i++) {
        const x = GX + (i % N) * S, y = GY + Math.floor(i / N) * S;
        if (Math.floor(i / N) === cy || i % N === cx || box(Math.floor(i / N), i % N) === box(cy, cx)) { c.fillStyle = 'rgba(31,42,92,0.05)'; c.fillRect(x, y, S, S); }
        if (HINT && conflict(i) && !given[i]) { c.fillStyle = 'rgba(200,55,45,0.18)'; c.fillRect(x, y, S, S); }
        if (grid[i]) {
          const col = given[i] ? '#1f2a5c' : INK[(grid[i] - 1) % INK.length];
          label(c, String(grid[i]), x + S / 2, y + S / 2 + S * 0.17, solvedT >= 0 && !given[i] ? '#c8372d' : col, 'center', Math.round(S * (given[i] ? 0.5 : 0.46)));
          if (given[i]) { c.fillStyle = 'rgba(31,42,92,0.35)'; c.fillRect(x + S / 2 - 6, y + S - 9, 12, 2); }
        }
      }
      c.strokeStyle = '#1f2a5c';
      for (let i = 0; i <= N; i++) {
        c.lineWidth = i % BW === 0 ? 3 : 1; c.beginPath(); c.moveTo(GX + i * S, GY); c.lineTo(GX + i * S, GY + N * S); c.stroke();
        c.lineWidth = i % BH === 0 ? 3 : 1; c.beginPath(); c.moveTo(GX, GY + i * S); c.lineTo(GX + N * S, GY + i * S); c.stroke();
      }
      if (!finale.active) { c.strokeStyle = '#c8372d'; c.lineWidth = 3; c.beginPath(); c.roundRect(GX + cx * S + 3, GY + cy * S + 3, S - 6, S - 6, 6); c.stroke(); }
      const free = grid.filter(v => !v).length;
      label(c, `${N}×${N}   ·   ${GIVEN} Zahlen vorgegeben   ·   noch ${free} frei`, 16, 26, '#1f2a5c');
      const TX = GX + N * S + 26;
      label(c, `Zahlen 1 bis ${N}`, TX, 96, '#1f2a5c', 'left', 13);
      label(c, 'jede Zeile, jede Spalte', TX, 118, 'rgba(31,42,92,0.75)', 'left', 11);
      label(c, `und jeder ${BH}×${BW}-Kasten:`, TX, 134, 'rgba(31,42,92,0.75)', 'left', 11);
      label(c, 'jede Zahl genau einmal', TX, 150, 'rgba(31,42,92,0.75)', 'left', 11);
      label(c, HINT ? 'Doppelte werden rot.' : 'Keine Hilfe:', TX, 176, HINT ? 'rgba(31,42,92,0.6)' : '#b8322a', 'left', 11);
      if (!HINT) label(c, 'Fehler bleiben unsichtbar.', TX, 192, '#b8322a', 'left', 11);
      if (msgT > 0) label(c, msg, W / 2, H - 14, '#b8322a', 'center', 13);
      else if (!finale.active) label(c, 'Pfeile: Feld · Leertaste: Zahl hochzählen', W / 2, H - 14, 'rgba(31,42,92,0.7)', 'center', 12);
      finale.draw(c, '#c8372d', '#efe6d2');
    }
  };
  return self;
}
