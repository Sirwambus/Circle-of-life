/* =====================================================================
   WELT – Sprung: Jump'n'Run mit Schwerkraft und Stacheln, Pixelgrafik.
   ===================================================================== */
function makeSprung(next, level = 0) {
  // Regeln für faire Strecken: Lücken höchstens 4 Felder, Stufen höchstens 3 Felder hoch.
  const T = 20, R = 20, C = [64, 80, 96, 112, 128, 136, 144, 152, 160, 168][level];
  const g = [...Array(R)].map(() => Array(C).fill(0)); // 0 leer, 1 Boden, 2 Stachel
  const fill = (x0, x1, y0, y1, v) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = v; };
  let flags = []; // Rücksetzpunkte (Spalte), dort wird man nach einem Sturz wieder abgesetzt
  if (level === 0) {
    fill(0, 12, 16, 19, 1);
    fill(16, 24, 16, 19, 1); fill(21, 22, 15, 15, 2);
    fill(26, 29, 13, 13, 1);
    fill(31, 40, 16, 19, 1); fill(35, 36, 14, 15, 1); fill(37, 40, 13, 15, 1);
    fill(45, 63, 16, 19, 1); fill(49, 50, 15, 15, 2); fill(54, 57, 12, 12, 1);
  } else if (level === 1) {
    fill(0, 10, 16, 19, 1);
    fill(14, 20, 16, 19, 1); fill(17, 18, 15, 15, 2);
    fill(21, 22, 14, 19, 1); fill(23, 26, 12, 19, 1);
    fill(31, 34, 13, 19, 1);
    fill(39, 48, 16, 19, 1);
    fill(50, 52, 14, 14, 1); fill(55, 57, 12, 12, 1); fill(60, 62, 14, 14, 1);
    fill(63, 79, 16, 19, 1); fill(66, 67, 15, 15, 2); fill(71, 73, 15, 15, 2);
    flags = [40];
  } else if (level === 2) {
    fill(0, 8, 16, 19, 1);
    fill(13, 18, 16, 19, 1); fill(16, 16, 15, 15, 2);
    fill(21, 22, 13, 13, 1); fill(26, 27, 11, 11, 1); fill(31, 32, 13, 13, 1); fill(36, 38, 14, 14, 1);
    fill(41, 50, 16, 19, 1); fill(44, 46, 15, 15, 2);
    fill(51, 54, 13, 19, 1); fill(55, 58, 10, 19, 1);
    fill(63, 66, 12, 12, 1); fill(71, 73, 14, 14, 1);
    fill(74, 95, 16, 19, 1); fill(77, 79, 15, 15, 2); fill(84, 86, 15, 15, 2);
    flags = [42, 75];
  }
  if (level === 3) {
    fill(0, 7, 16, 19, 1);
    fill(12, 16, 16, 19, 1); fill(14, 14, 15, 15, 2);
    fill(19, 20, 14, 14, 1); fill(24, 25, 12, 12, 1); fill(28, 29, 14, 14, 1); fill(32, 33, 11, 11, 1); fill(37, 38, 13, 13, 1); fill(42, 43, 15, 15, 1);
    fill(45, 60, 16, 19, 1); fill(48, 50, 15, 15, 2); fill(54, 56, 15, 15, 2);
    fill(61, 62, 13, 19, 1); fill(63, 64, 10, 19, 1);
    fill(69, 70, 12, 12, 1); fill(75, 76, 14, 14, 1);
    fill(77, 111, 16, 19, 1); fill(82, 92, 0, 12, 1); fill(86, 86, 15, 15, 2); fill(97, 99, 15, 15, 2); fill(103, 105, 15, 15, 2);
    flags = [46, 78];
  } else if (level === 4) {
    fill(0, 6, 16, 19, 1);
    for (const [x, y] of [[10, 14], [14, 12], [18, 14], [22, 11], [26, 13], [30, 15]]) fill(x, x, y, y, 1);   // einzelne Steine
    fill(33, 50, 16, 19, 1); fill(36, 38, 15, 15, 2); fill(42, 43, 15, 15, 2); fill(47, 49, 15, 15, 2);
    fill(51, 52, 13, 19, 1); fill(53, 54, 10, 19, 1); fill(55, 56, 7, 19, 1);
    fill(61, 62, 9, 9, 1); fill(66, 67, 11, 11, 1); fill(71, 72, 13, 13, 1);
    fill(75, 104, 16, 19, 1); fill(80, 96, 0, 12, 1); fill(84, 84, 15, 15, 2); fill(90, 90, 15, 15, 2); fill(100, 102, 15, 15, 2);
    fill(109, 109, 14, 14, 1); fill(113, 114, 13, 13, 1); fill(118, 127, 16, 19, 1); fill(121, 122, 15, 15, 2);
    flags = [34, 76, 118];
  } else if (level >= 5) {
    // Level 6–10: Strecke aus festen Zufallsabschnitten (Seed je Level), schwerer mit jedem Level
    const d = level - 5, r = rng(4100 + level * 77), ri = (a, b) => a + Math.floor(r() * (b - a + 1));
    let x = 7, gy = 16, lastFlag = 0;
    fill(0, 6, 16, 19, 1);
    const ground = (len, y) => { fill(x, x + len - 1, y, 19, 1); if (len >= 4 && x - lastFlag >= 26) { flags.push(x + 1); lastFlag = x; } gy = y; x += len; };
    const pool = [0, 1, 1, 2, 2, 3, 4, ...(d >= 2 ? [1, 2, 4] : []), ...(d >= 3 ? [1, 4] : [])];
    while (x < C - 34) {
      const kind = pool[ri(0, pool.length - 1)];
      if (kind === 0) { // Lücke, danach Boden auf anderer Höhe
        const w = ri(2, d < 2 ? 3 : 4); x += w; ground(ri(d >= 2 ? 3 : 4, 6), clamp(gy + ri(w === 4 ? -1 : -2, 2), 9, 16));
      } else if (kind === 1) { // Trittsteine über dem Abgrund
        let y = gy;
        for (let i = Math.min(ri(2, 3 + Math.min(d, 2)), Math.floor((C - 31 - x) / 5)); i > 0; i--) { x += ri(2, 3); y = clamp(y + ri(-2, 2), 9, 15); const sw = d >= 3 && r() < 0.5 + d * 0.1 ? 1 : 2; fill(x, x + sw - 1, y, y, 1); x += sw; }
        x += ri(2, 3); ground(ri(4, 6), clamp(y + ri(-1, 2), 9, 16));
      } else if (kind === 2) { // Stachelreihe, ab Level 8 auch unter einer niedrigen Decke
        const sw = ri(1, d >= 2 ? 3 : 2), x0 = x; ground(sw + 6, gy); fill(x0 + 3, x0 + 2 + sw, gy - 1, gy - 1, 2);
        if (d >= 2 && sw < 3 && r() < 0.7) fill(x0 + 2, x0 + 4 + sw, 0, gy - 5 + (d >= 3 && sw < 2 ? 1 : 0), 1);
      } else if (kind === 3) { // Treppe hinauf
        for (let i = ri(2, 3); i > 0 && gy > 10; i--) ground(ri(2, 3), gy - ri(1, 2));
        x += ri(2, 3); ground(ri(4, 6), clamp(gy + ri(1, 3), 9, 16));
      } else { // Stachelfeld mit Trittstein in der Mitte
        const sw = ri(2, 2 + Math.min(d, 1)), x0 = x; ground(sw * 2 + 6, gy);
        fill(x0 + 2, x0 + 2 + sw * 2, gy - 1, gy - 1, 2); fill(x0 + 2 + sw, x0 + 2 + sw, gy - 1 - (d >= 1 ? 1 : 0), gy - 1, 1);
      }
    }
    x += 2; fill(x, C - 1, 16, 19, 1); flags.push(x + 1);
    for (let sx = x + 5; sx < C - 9; sx += ri(6, 8)) fill(sx, sx + ri(0, d >= 2 ? 2 : 1), 15, 15, 2);   // Stachelspalier vor der Tür
  }
  const door = { x: (C - 4) * T, y: 270, w: 28, h: 50 };
  let start = { x: 40, y: 280 };
  const p = { x: start.x, y: start.y, w: 14, h: 18, vx: 0, vy: 0, ground: false, coyote: 0, buffer: 0, face: 1, run: 0 };
  let cam = 0, flash = 0;
  const solidAt = (cx, cy) => cx < 0 || cx >= C ? true : cy < 0 || cy >= R ? false : g[cy][cx] === 1;
  function die() { died(); flash = 0.35; Object.assign(p, { x: start.x, y: start.y, vx: 0, vy: 0 }); }
  const flagY = col => { let y = 0; while (y < R && !g[y][col]) y++; return y * T - 18; };
  const self = {
    done: false, p, // p ist für Testprogramme sichtbar
    door: () => ({ ...door, x: door.x - cam }),
    update(dt) {
      platformPhysics(p, dt, T, solidAt, pressed.up || pressed.action, keys.up || keys.action);
      // Stacheln (etwas kleinere Trefferzone, damit es fair bleibt)
      const hb = { x: p.x + 2, y: p.y + 2, w: p.w - 4, h: p.h - 2 };
      for (let y = Math.floor(hb.y / T); y <= Math.floor((hb.y + hb.h) / T); y++)
        for (let x = Math.floor(hb.x / T); x <= Math.floor((hb.x + hb.w) / T); x++)
          if (g[y]?.[x] === 2 && overlap(hb, { x: x * T + 3, y: y * T + 8, w: T - 6, h: T - 8 })) return die();
      if (p.y > H + 40) return die();
      flash = Math.max(0, flash - dt);
      for (const f of flags) if (p.x > f * T && start.x < f * T) start = { x: f * T, y: flagY(f) };
      cam = clamp(p.x - W * 0.4, 0, C * T - W);
      if (overlap(p, door)) self.done = true;
    },
    draw(c) {
      const sky = c.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#5fb8ef'); sky.addColorStop(1, '#c6ecff');
      c.fillStyle = sky; c.fillRect(0, 0, W, H);
      c.fillStyle = '#ffffff';
      for (const [cx, cy, s] of [[60, 60, 1], [260, 40, 1.4], [470, 90, 1], [700, 50, 1.2], [900, 80, 0.9]]) {
        const x = ((cx - cam * 0.25) % 1000 + 1000) % 1000 - 120;
        c.fillRect(x, cy, 60 * s, 12 * s); c.fillRect(x + 12 * s, cy - 10 * s, 30 * s, 10 * s); c.fillRect(x + 8 * s, cy + 12 * s, 48 * s, 6 * s);
      }
      c.fillStyle = '#93d38c';
      for (let i = Math.floor(cam * 0.5 / 20) - 1; i < Math.floor(cam * 0.5 / 20) + 34; i++) {
        const h = Math.round((70 + 30 * Math.sin(i * 0.33) + 14 * Math.sin(i * 0.9)) / 10) * 10;
        c.fillRect(i * 20 - cam * 0.5, H - h - 60, 20, h + 60);
      }
      c.save(); c.translate(-Math.round(cam), 0);
      const c0 = Math.floor(cam / T), c1 = Math.min(C - 1, c0 + 33);
      for (let y = 0; y < R; y++) for (let x = c0; x <= c1; x++) {
        const v = g[y][x], px = x * T, py = y * T;
        if (v === 1) {
          c.fillStyle = '#9b6a43'; c.fillRect(px, py, T, T);
          c.fillStyle = '#7d5232';
          if ((x * 7 + y * 13) % 5 === 0) c.fillRect(px + 4, py + 10, 3, 3);
          if ((x * 11 + y * 3) % 4 === 0) c.fillRect(px + 13, py + 5, 2, 2);
          if (!solidAt(x, y - 1) && y > 0) {
            c.fillStyle = '#5cbf4a'; c.fillRect(px, py, T, 6);
            c.fillStyle = '#3f9a37'; c.fillRect(px, py + 6, T, 2);
            c.fillStyle = '#7fd86b'; if (x % 3 === 0) c.fillRect(px + 6, py - 3, 2, 3); if (x % 4 === 1) c.fillRect(px + 14, py - 2, 2, 2);
          }
        } else if (v === 2) {
          c.fillStyle = '#c9ced8'; c.strokeStyle = '#5a6070'; c.lineWidth = 1;
          for (const o of [0, 10]) { c.beginPath(); c.moveTo(px + o, py + T); c.lineTo(px + o + 5, py + 6); c.lineTo(px + o + 10, py + T); c.fill(); c.stroke(); }
        }
      }
      for (const f of flags) { const fx = f * T + 8, fy = flagY(f) + 18; c.fillStyle = '#5a4030'; c.fillRect(fx, fy - 34, 3, 34); c.fillStyle = start.x >= f * T ? '#ffde59' : '#e85d4a'; c.fillRect(fx + 3, fy - 34, 14, 9); }
      paintDoor(c, door, { frame: '#4c2f1d', panel: '#c0763a', knob: '#ffe27a', light: next, open: doorOpenness(p, door, 70) });
      // Spielfigur
      const px = Math.round(p.x), py = Math.round(p.y);
      const leg = p.ground && Math.abs(p.vx) > 20 ? Math.floor(p.run / 6) % 2 : 0;
      c.fillStyle = '#3a2618'; c.fillRect(px + 2, py + 15, 4, 3 - leg); c.fillRect(px + 8, py + 15, 4, 2 + leg);
      c.fillStyle = '#ff8a3d'; c.fillRect(px, py + 2, 14, 13); c.fillRect(px + 2, py, 10, 2);
      c.fillStyle = '#d9652a'; c.fillRect(px, py + 12, 14, 3);
      const ex = p.face > 0 ? px + 7 : px + 2;
      c.fillStyle = '#fff'; c.fillRect(ex, py + 4, 5, 5);
      c.fillStyle = '#1d1d2b'; c.fillRect(ex + (p.face > 0 ? 3 : 0), py + 5, 2, 3);
      c.restore();
      if (flash > 0) { c.fillStyle = `rgba(255,80,60,${flash})`; c.fillRect(0, 0, W, H); }
      c.fillStyle = 'rgba(20,40,70,0.6)'; c.font = '600 12px "IBM Plex Mono", monospace'; c.textAlign = 'right';
      c.fillText(`Stürze: ${stats.deaths}`, W - 14, 22); c.textAlign = 'left';
    }
  };
  return self;
}
