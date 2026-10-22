/* =====================================================================
   WELT – Dunkelheit: Labyrinth mit Lichtkreis, Funken sammeln, Schatten meiden.
   ===================================================================== */
let dark = null; // Ebene für die Dunkelheit, wird beim ersten Start angelegt
function makeDunkel(next, level = 0) {
  if (!dark) { dark = document.createElement('canvas'); dark.width = W * 2; dark.height = H * 2; }
  // Je Level: mehr Funken und Schatten, kleinerer Lichtkreis (Erreichbarkeit per Skript geprüft).
  const LIGHT = [96, 80, 68, 60, 54, 52, 50, 48, 46, 44][level];
  // Ab Level 6: großes Labyrinth (Kamera folgt) aus festem Startwert; der Generator prüft, dass alle Funken und die Tür
  // erreichbar sind, ohne je längs durch die Bahn eines Schattens laufen zu müssen (Kreuzen ist erlaubt).
  function makeMaze() {
    const d = level - 5, C = [21, 23, 25, 27, 29][d], R = [11, 13, 13, 15, 15][d], NO = [8, 8, 9, 10, 10][d], NG = [7, 8, 9, 10, 11][d];
    const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (let seed = [695, 689, 996, 951, 790][d]; ; seed++) { // Startwerte vorab gesucht (erster gültiger ab 500 + level · 31)
      const r = rng(seed), ri = n => Math.floor(r() * n);
      const g = Array.from({ length: R }, () => Array(C).fill('#')), st = [[1, 1]];
      g[1][1] = '.';
      while (st.length) {
        const [x, y] = st[st.length - 1];
        const nb = N4.filter(([dx, dy]) => x + 2 * dx > 0 && x + 2 * dx < C - 1 && y + 2 * dy > 0 && y + 2 * dy < R - 1 && g[y + 2 * dy][x + 2 * dx] === '#');
        if (!nb.length) { st.pop(); continue; }
        const [dx, dy] = nb[ri(nb.length)]; g[y + dy][x + dx] = g[y + 2 * dy][x + 2 * dx] = '.'; st.push([x + 2 * dx, y + 2 * dy]);
      }
      for (let y = 1; y < R - 1; y++) for (let x = 1; x < C - 1; x++) // einige Zwischenwände öffnen -> Rundwege
        if (g[y][x] === '#' && (x + y) % 2 && r() < 0.12 && (g[y][x - 1] === '.' && g[y][x + 1] === '.' || g[y - 1][x] === '.' && g[y + 1][x] === '.')) g[y][x] = '.';
      const free = (x, y) => g[y] && g[y][x] === '.', key = (x, y) => x + ',' + y, dx0 = C - 2, dy0 = R - 2;
      const dist = { [key(1, 1)]: 0 }, q = [[1, 1]];
      while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of N4) if (free(x + dx, y + dy) && dist[key(x + dx, y + dy)] === undefined) { dist[key(x + dx, y + dy)] = dist[key(x, y)] + 1; q.push([x + dx, y + dy]); } }
      // Schatten auf geraden Gängen (Länge 3–5), nicht nahe am Start, nicht über der Tür
      const runs = [];
      for (let y = 1; y < R - 1; y++) for (let x = 1; x < C - 1; x++) for (const [dx, dy] of [[1, 0], [0, 1]]) {
        if (!free(x, y) || free(x - dx, y - dy)) continue;
        let n = 0; while (free(x + n * dx, y + n * dy)) n++;
        if (n >= 3) runs.push([x, y, dx, dy, n]);
      }
      const gcell = {}, segs = [];
      for (let tries = 0; tries < 200 && segs.length < NG; tries++) {
        const [x, y, dx, dy, n] = runs[ri(runs.length)], L = Math.min(n, 3 + ri(3)), o = ri(n - L + 1), cells = [];
        for (let k = 0; k < L; k++) cells.push([x + (o + k) * dx, y + (o + k) * dy]);
        if (cells.some(([cx, cy]) => dist[key(cx, cy)] < 5 || gcell[key(cx, cy)] || cx === dx0 && cy === dy0)) continue;
        cells.forEach(([cx, cy]) => gcell[key(cx, cy)] = dx ? 'h' : 'v');
        const [a, b] = r() < 0.5 ? [cells[0], cells[L - 1]] : [cells[L - 1], cells[0]];
        segs.push([a[0], a[1], b[0], b[1], 70 + d * 5 + ri(16), Math.round(r() * 20) / 10]);
      }
      // Funken: zuerst Sackgassen, mit Abstand zueinander
      const cand = [];
      for (let y = 1; y < R - 1; y++) for (let x = 1; x < C - 1; x++)
        if (free(x, y) && dist[key(x, y)] >= 4 && !gcell[key(x, y)] && !(x === dx0 && y === dy0)) cand.push([x, y, N4.filter(([dx, dy]) => free(x + dx, y + dy)).length === 1 ? 0 : 1, r()]);
      cand.sort((u, v) => u[2] - v[2] || u[3] - v[3]);
      const orbs = [];
      for (const [x, y] of cand) if (orbs.length < NO && orbs.every(([ox, oy]) => Math.abs(ox - x) + Math.abs(oy - y) >= 4)) orbs.push([x, y]);
      // Prüfung: Wege, die nie längs in eine Schattenbahn führen
      const ok = { [key(1, 1)]: true }, q2 = [[1, 1]];
      while (q2.length) { const [x, y] = q2.shift(); for (const [dx, dy] of N4) { const nx = x + dx, ny = y + dy, gk = gcell[key(nx, ny)];
        if (!free(nx, ny) || ok[key(nx, ny)] || gk === (dx ? 'h' : 'v')) continue; ok[key(nx, ny)] = true; if (nx !== dx0 || ny !== dy0) q2.push([nx, ny]); } } // durch die Tür geht es nicht
      if (segs.length < NG || orbs.length < NO || !ok[key(dx0, dy0)] || orbs.some(([x, y]) => !ok[key(x, y)])) continue;
      orbs.forEach(([x, y]) => g[y][x] = 'o'); g[1][1] = 'P'; g[dy0][dx0] = 'D';
      return { map: g.map(row => row.join('')), ghosts: segs };
    }
  }
  const MAZE = level >= 5 ? makeMaze() : null;
  const MAP = MAZE ? MAZE.map : [[
    '################',
    '#P....#........#',
    '#.###.#.####.#.#',
    '#.#o..#....#.#.#',
    '#.#.####.#.#.#.#',
    '#........#...#o#',
    '###.#.####.###.#',
    '#o..#....#.....#',
    '#.#####.##.###D#',
    '################'
  ], [
    '################',
    '#P...#....o....#',
    '#.##.#.##.###..#',
    '#.#o.....#...#.#',
    '#.####.#.#.#.#.#',
    '#......#...#o..#',
    '#.#.##.#####.#.#',
    '#o#.#........#.#',
    '#...#.##.###..D#',
    '################'
  ], [
    '################',
    '#P..#.....#...o#',
    '#.#.#.###.#.##.#',
    '#.#...#o..#....#',
    '#.###.#.####.#.#',
    '#o....#......#.#',
    '###.#.#.###.##.#',
    '#...#...#o#....#',
    '#.o.....#.....D#',
    '################'
  ], [
    '################',
    '#P.#...o#.....o#',
    '#..#.#.##.###..#',
    '#o...#....#...##',
    '##.###.##.#.#..#',
    '#...o#..#...#o.#',
    '#.#.##.##.###..#',
    '#.#....o#.....##',
    '#o..##......#.D#',
    '################'
  ], [
    '################',
    '#P...#o.....#.o#',
    '#.##.#.####.#..#',
    '#.#o.....#..##.#',
    '#.#.##.#.#.#...#',
    '#o..#..#...#.#o#',
    '##.##.###.##.#.#',
    '#o.#...o#....#.#',
    '#....#....#o..D#',
    '################'
  ]][level];
  // Schatten: Start- und Endfeld, Tempo, Phase
  const GHOSTS = MAZE ? MAZE.ghosts : [
    [[7, 1, 14, 1, 70, 0], [10, 7, 14, 7, 55, 0.5], [1, 5, 8, 5, 60, 1.2]],
    [[6, 1, 13, 1, 72, 0], [5, 7, 12, 7, 64, 0.6], [1, 5, 6, 5, 62, 1.2], [14, 2, 14, 6, 58, 0.3]],
    [[5, 1, 9, 1, 74, 0], [7, 5, 12, 5, 70, 0.7], [1, 8, 7, 8, 66, 1.1], [11, 3, 14, 3, 64, 0.2], [11, 7, 14, 7, 60, 1.6]],
    [[4, 1, 7, 1, 70, 0], [9, 1, 14, 1, 78, 0.4], [1, 3, 4, 3, 66, 1.0], [1, 5, 4, 5, 70, 0.2], [9, 7, 13, 7, 74, 1.3], [6, 8, 11, 8, 68, 0.8]],
    [[6, 1, 11, 1, 80, 0], [3, 3, 8, 3, 76, 0.5], [8, 5, 10, 5, 70, 1.1], [1, 8, 4, 8, 74, 0.3], [6, 8, 9, 8, 78, 1.4], [11, 7, 12, 7, 60, 0.9]]
  ][level];
  const T = 40, walls = [], orbs = [], MW = MAP[0].length * T, MH = MAP.length * T, cam = { x: 0, y: 0 };
  let start, door;
  MAP.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === '#') walls.push({ x: x * T, y: y * T, w: T, h: T });
    if (ch === 'o') orbs.push({ x: x * T + 20, y: y * T + 20, got: false });
    if (ch === 'P') start = { x: x * T + 9, y: y * T + 9 };
    if (ch === 'D') door = { x: x * T, y: y * T, w: T, h: T };
  }));
  const ghosts = GHOSTS.map(([ax, ay, bx, by, sp, ph]) => {
    const a = { x: ax * T + 20, y: ay * T + 20 }, b = { x: bx * T + 20, y: by * T + 20 };
    return { a, b, t: ph, rate: sp / Math.hypot(b.x - a.x, b.y - a.y), x: a.x, y: a.y };
  });
  const p = { x: start.x, y: start.y, w: 22, h: 22 };
  let t = 0, hurt = 0, got = 0;
  const open = () => got === orbs.length, dr = { x: door.x + 6, y: door.y + 2, w: 28, h: 36 };
  const follow = () => { const pc = center(p); cam.x = clamp(pc.x - W / 2, 0, MW - W); cam.y = clamp(pc.y - H / 2, 0, MH - H); };
  follow();
  const self = {
    done: false,
    door: () => ({ ...dr, x: dr.x - cam.x, y: dr.y - cam.y }),
    test: () => ({ p, ghosts, orbs, map: MAP, T, got, hurt, open: open() }), // für Testprogramme
    update(dt) {
      t += dt;
      let dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), dy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
      const l = Math.hypot(dx, dy) || 1;
      moveAndCollide(p, dx / l * 140 * dt, dy / l * 140 * dt, open() ? walls : walls.concat(door));
      const pc = center(p);
      for (const o of orbs) if (!o.got && Math.hypot(o.x - pc.x, o.y - pc.y) < 22) { o.got = true; got++; }
      for (const g of ghosts) {
        g.t += g.rate * dt; const u = g.t % 2, k = u < 1 ? u : 2 - u;
        g.x = g.a.x + (g.b.x - g.a.x) * k; g.y = g.a.y + (g.b.y - g.a.y) * k;
        if (hurt <= 0 && Math.hypot(g.x - pc.x, g.y - pc.y) < 21) { died(); hurt = 0.6; p.x = start.x; p.y = start.y; }
      }
      hurt -= dt; follow();
      if (open() && overlap(p, door)) self.done = true;
    },
    draw(c) {
      c.fillStyle = '#140b24'; c.fillRect(0, 0, W, H);
      c.save(); c.translate(-cam.x, -cam.y);
      c.strokeStyle = 'rgba(140,110,220,0.12)'; c.lineWidth = 1;
      for (let x = 0; x <= MW; x += T) { c.beginPath(); c.moveTo(x + 0.5, 0); c.lineTo(x + 0.5, MH); c.stroke(); }
      for (let y = 0; y <= MH; y += T) { c.beginPath(); c.moveTo(0, y + 0.5); c.lineTo(MW, y + 0.5); c.stroke(); }
      for (const w of walls) {
        if (w.x + T < cam.x || w.x > cam.x + W || w.y + T < cam.y || w.y > cam.y + H) continue;
        c.fillStyle = '#251645'; c.fillRect(w.x, w.y, w.w, w.h);
        c.strokeStyle = 'rgba(80,230,255,0.55)'; c.strokeRect(w.x + 3.5, w.y + 3.5, w.w - 7, w.h - 7);
      }
      paintDoor(c, dr, { frame: '#3b2a6b', panel: open() ? '#6a4bc4' : '#2a1d4f', knob: '#ffe680', light: open() ? next : '#0c0618',
        glow: open() ? '#b06cff' : null, open: open() ? doorOpenness(p, dr, 80) : 0 });
      for (const o of orbs) if (!o.got) {
        const r = 6 + Math.sin(t * 4 + o.x) * 1.5;
        c.save(); c.shadowColor = '#ffd84d'; c.shadowBlur = 18; c.fillStyle = '#fff1a8';
        c.beginPath(); c.arc(o.x, o.y, r, 0, 7); c.fill(); c.restore();
      }
      c.restore();
      const pc = center(p), sx = pc.x - cam.x, sy = pc.y - cam.y;
      // Dunkelheit: schwarze Ebene, aus der Lichtkreise ausgestanzt werden
      const d = dark.getContext('2d');
      d.setTransform(2, 0, 0, 2, 0, 0); d.globalCompositeOperation = 'source-over';
      d.clearRect(0, 0, W, H); d.fillStyle = 'rgba(5,2,12,0.97)'; d.fillRect(0, 0, W, H);
      d.globalCompositeOperation = 'destination-out';
      const hole = (x, y, r, a) => { const gr = d.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(0.6, `rgba(0,0,0,${a * 0.7})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); d.fillStyle = gr; d.beginPath(); d.arc(x, y, r, 0, 7); d.fill(); };
      hole(sx, sy, LIGHT + Math.sin(t * 9) * 2 + Math.sin(t * 23), 1);
      for (const o of orbs) if (!o.got) hole(o.x - cam.x, o.y - cam.y, 34, 0.9);
      if (open()) hole(dr.x + 14 - cam.x, dr.y + 18 - cam.y, 70, 0.9);
      for (const g of ghosts) hole(g.x - cam.x, g.y - cam.y, 26, 0.35);
      c.drawImage(dark, 0, 0, W, H);
      c.save(); c.translate(-cam.x, -cam.y);
      for (const g of ghosts) { // Schatten bleiben schwach sichtbar
        const near = clamp(1 - Math.hypot(g.x - pc.x, g.y - pc.y) / 120, 0.25, 1);
        c.save(); c.globalAlpha = near; c.fillStyle = '#ff4fa8'; c.shadowColor = '#ff4fa8'; c.shadowBlur = 12;
        c.beginPath(); c.arc(g.x, g.y - 3, 11, Math.PI, 0);
        for (let i = 0; i <= 4; i++) c.lineTo(g.x + 11 - i * 5.5, g.y + 9 + (i % 2 ? -3 : 0) + Math.sin(t * 8 + i) * 1.2);
        c.fill(); c.shadowBlur = 0; c.fillStyle = '#1a0820';
        c.fillRect(g.x - 6, g.y - 5, 4, 4); c.fillRect(g.x + 2, g.y - 5, 4, 4); c.restore();
      }
      c.save(); c.shadowColor = '#bdf6ff'; c.shadowBlur = 14; c.fillStyle = hurt > 0 && Math.floor(t * 20) % 2 ? '#ff6b9a' : '#e8fbff';
      c.beginPath(); c.moveTo(pc.x, pc.y - 11); c.lineTo(pc.x + 9, pc.y); c.lineTo(pc.x, pc.y + 11); c.lineTo(pc.x - 9, pc.y); c.fill(); c.restore();
      c.restore();
      c.font = '600 12px "IBM Plex Mono", monospace'; c.fillStyle = '#ffe680'; c.textAlign = 'left';
      c.fillText(`Funken ${got}/${orbs.length}` + (open() ? '  – die Tür ist offen' : ''), 14, 24);
    }
  };
  return self;
}
