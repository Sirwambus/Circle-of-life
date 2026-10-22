/* =====================================================================
   WELT – Röhren: Dreh die Rohrstücke, bis das leuchtende Wasser von der Quelle links zur Tür rechts fließt.
   Der Plan wird so erzeugt, dass es immer eine Lösung gibt: Erst wird ein Weg gelegt, dann alles verdreht.
   ===================================================================== */
function makeRoehren(next, level = 0) {
  const CW = [5, 6, 7, 8, 9, 9, 10, 10, 11, 11][level], CH = [4, 5, 5, 6, 6, 7, 7, 8, 8, 8][level];
  const CS = Math.floor(Math.min(440 / CW, 320 / CH)), OX = (W - CW * CS) / 2, OY = 40 + (330 - CH * CS) / 2;
  const N = 1, E = 2, S = 4, Wd = 8, DIR = [[0, -1, N, S], [1, 0, E, Wd], [0, 1, S, N], [-1, 0, Wd, E]];
  const rot = m => ((m << 1) | (m >> 3)) & 15; // 90° im Uhrzeigersinn
  const finale = makeFinale(next);
  let grid, src, out, cur, flow, turns, t = 0;
  function build() {
    src = Math.floor(Math.random() * CH); out = Math.floor(Math.random() * CH);
    for (;;) { // selbstvermeidender Zufallsweg von links nach rechts
      const path = [[0, src]], seen = new Set(['0,' + src]);
      let ok = false;
      for (let step = 0; step < 400; step++) {
        const [x, y] = path[path.length - 1];
        if (x === CW - 1 && y === out) { ok = true; break; }
        const opts = DIR.filter(([dx, dy]) => { const nx = x + dx, ny = y + dy; return nx >= 0 && ny >= 0 && nx < CW && ny < CH && !seen.has(nx + ',' + ny); });
        if (!opts.length) break;
        const pref = opts.filter(o => o[0] === 1), pool = pref.length && Math.random() < 0.45 ? pref : opts; // leicht nach rechts ziehen
        const [dx, dy] = pool[Math.floor(Math.random() * pool.length)];
        path.push([x + dx, y + dy]); seen.add((x + dx) + ',' + (y + dy));
      }
      if (!ok || path.length < CW + 1) continue;
      grid = Array.from({ length: CH }, () => Array(CW).fill(0));
      path.forEach(([x, y], i) => {
        let m = 0;
        const prev = i === 0 ? [x - 1, y] : path[i - 1], nxt = i === path.length - 1 ? [x + 1, y] : path[i + 1];
        for (const [px, py] of [prev, nxt]) { const d = DIR.find(([dx, dy]) => x + dx === px && y + dy === py); m |= d[2]; }
        grid[y][x] = m;
      });
      const kinds = [N | S, N | E, N | E | S, N | E | S | Wd];
      for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) if (!grid[y][x]) grid[y][x] = kinds[Math.floor(Math.random() * 3)];
      for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) { const k = Math.floor(Math.random() * 4); for (let i = 0; i < k; i++) grid[y][x] = rot(grid[y][x]); }
      if (!connected()) return;
    }
  }
  function connected() {
    flow = new Set();
    if (!(grid[src][0] & Wd)) return false;
    const q = [[0, src]]; flow.add('0,' + src);
    while (q.length) {
      const [x, y] = q.shift();
      for (const [dx, dy, a, b] of DIR) {
        const nx = x + dx, ny = y + dy;
        if (!(grid[y][x] & a)) continue;
        if (nx === CW && ny === out && a === E) return true;
        if (nx < 0 || ny < 0 || nx >= CW || ny >= CH || flow.has(nx + ',' + ny) || !(grid[ny][nx] & b)) continue;
        flow.add(nx + ',' + ny); q.push([nx, ny]);
      }
    }
    return false;
  }
  build(); connected(); cur = { x: 0, y: src }; turns = 0;
  const rep = makeRepeater();
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ fin: finale.active, grid, cur, src, out, CW, CH, connected }), // für Testprogramme
    update(dt) {
      t += dt;
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      const d = rep(dt); if (d) { cur.x = clamp(cur.x + d[0], 0, CW - 1); cur.y = clamp(cur.y + d[1], 0, CH - 1); }
      if (pressed.action) { grid[cur.y][cur.x] = rot(grid[cur.y][cur.x]); turns++; Klang.tone(220, 0.08); if (connected()) { Klang.tone(523, 0.8); finale.start(); } }
    },
    draw(c) {
      c.fillStyle = '#16191d'; c.fillRect(0, 0, W, H);
      c.fillStyle = '#1f2429'; c.fillRect(OX - 8, OY - 8, CW * CS + 16, CH * CS + 16);
      for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
        const m = grid[y][x], cx = OX + x * CS + CS / 2, cy = OY + y * CS + CS / 2, wet = flow.has(x + ',' + y);
        c.strokeStyle = 'rgba(255,255,255,0.05)'; c.strokeRect(OX + x * CS + 0.5, OY + y * CS + 0.5, CS - 1, CS - 1);
        for (const [lw, col] of [[CS * 0.32, '#5a3b22'], [CS * 0.22, '#b8743a'], [CS * 0.12, wet ? '#5ff2ff' : '#2a1c12']]) {
          c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round';
          if (wet && col === '#5ff2ff') { c.shadowColor = '#5ff2ff'; c.shadowBlur = 12; }
          c.beginPath();
          for (const [dx, dy, a] of DIR) if (m & a) { c.moveTo(cx, cy); c.lineTo(cx + dx * CS / 2, cy + dy * CS / 2); }
          c.stroke(); c.shadowBlur = 0;
        }
      }
      // Quelle und Ausgang
      c.fillStyle = '#5ff2ff'; c.beginPath(); c.arc(OX - 14, OY + src * CS + CS / 2, 10, 0, 7); c.fill();
      paintDoor(c, { x: OX + CW * CS + 10, y: OY + out * CS + CS / 2 - 26, w: 26, h: 46 }, { frame: '#5a3b22', panel: '#b8743a', knob: '#5ff2ff', light: next, open: finale.active ? 0.8 : 0.1 });
      c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.strokeRect(OX + cur.x * CS + 2, OY + cur.y * CS + 2, CS - 4, CS - 4);
      label(c, `Drehungen ${turns}`, 16, 26, '#d7e4ea');
      label(c, 'Pfeile wählen · Leertaste dreht', W - 16, 26, '#d7e4ea', 'right');
      finale.draw(c, '#d7e4ea', '#1f2429');
    }
  };
  return self;
}
