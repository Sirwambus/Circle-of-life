/* =====================================================================
   WELT – Umkehr: Du kannst nicht springen, nur die Schwerkraft umdrehen.
   Grafik: CGA-Palette (Schwarz, Cyan, Magenta, Weiß).
   ===================================================================== */
function makeUmkehr(next, level = 0) {
  const T = 20, R = 20, C = [64, 80, 96, 112, 128, 140, 152, 164, 176, 188][level];
  const g = [...Array(R)].map(() => Array(C).fill(0)); // 1 Block, 2 Stachel
  const fill = (x0, x1, y0, y1, v) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = v; };
  fill(0, C - 1, 0, 1, 1); fill(0, C - 1, 18, 19, 1);
  if (level === 0) {
    fill(10, 14, 17, 17, 2);            // Stacheln am Boden -> oben laufen
    fill(20, 24, 2, 2, 2);              // Stacheln an der Decke -> unten laufen
    fill(30, 34, 18, 19, 0);            // Loch im Boden
    fill(38, 42, 0, 1, 0);              // Loch in der Decke
    fill(48, 48, 2, 9, 1);              // Wand oben
    fill(51, 53, 17, 17, 2);
    fill(54, 54, 10, 17, 1);            // Wand unten
    fill(57, 59, 2, 2, 2);
  } else if (level === 1) {
    fill(8, 13, 17, 17, 2); fill(18, 23, 2, 2, 2); fill(28, 33, 17, 17, 2); fill(38, 43, 2, 2, 2);
    fill(47, 56, 18, 19, 0); fill(47, 56, 0, 1, 0); fill(46, 57, 9, 10, 1);   // schwebender Block über zwei Löchern
    fill(64, 64, 2, 9, 1); fill(68, 68, 10, 17, 1); fill(72, 72, 2, 9, 1);
  } else if (level === 2) {
    fill(6, 9, 17, 17, 2); fill(12, 15, 2, 2, 2); fill(18, 21, 17, 17, 2); fill(24, 27, 2, 2, 2);
    fill(32, 34, 18, 19, 0); fill(37, 39, 0, 1, 0);
    fill(48, 67, 18, 19, 0); fill(50, 67, 0, 1, 0);                         // langes Loch oben und unten
    fill(49, 56, 5, 6, 1); fill(58, 65, 12, 13, 1);                           // zwei Blöcke als Treppe
    fill(74, 74, 2, 9, 1); fill(78, 78, 10, 17, 1); fill(82, 82, 2, 9, 1); fill(86, 88, 17, 17, 2);
  } else if (level === 3) {
    fill(6, 8, 17, 17, 2); fill(11, 13, 2, 2, 2); fill(16, 18, 17, 17, 2); fill(21, 23, 2, 2, 2); fill(26, 28, 17, 17, 2);
    fill(32, 37, 18, 19, 0); fill(32, 37, 0, 1, 0); fill(31, 38, 9, 10, 1);
    fill(48, 65, 18, 19, 0); fill(50, 65, 0, 1, 0); fill(49, 54, 5, 6, 1); fill(56, 63, 12, 13, 1);
    for (const [x, top] of [[70, 1], [73, 0], [76, 1], [79, 0], [82, 1]]) fill(x, x, top ? 2 : 10, top ? 9 : 17, 1);
    fill(86, 88, 17, 17, 2); fill(92, 94, 2, 2, 2); fill(98, 100, 17, 17, 2);
  } else if (level === 4) {
    for (const [x, floor] of [[5, 1], [9, 0], [13, 1], [17, 0], [21, 1], [25, 0]]) fill(x, x + 1, floor ? 17 : 2, floor ? 17 : 2, 2);
    fill(31, 60, 0, 1, 0); fill(30, 60, 18, 19, 0);
    fill(29, 35, 5, 6, 1); fill(37, 43, 12, 13, 1); fill(45, 51, 5, 6, 1); fill(53, 59, 12, 13, 1);   // vier schwebende Blöcke
    for (const [x, top] of [[66, 1], [69, 0], [72, 1], [75, 0], [78, 1], [81, 0]]) fill(x, x, top ? 2 : 10, top ? 9 : 17, 1);
    fill(86, 87, 17, 17, 2); fill(90, 91, 2, 2, 2); fill(94, 95, 17, 17, 2);
  } else if (level >= 5) {
    // Level 6–10: Abschnitte aus festem Zufall (Seed je Level): Stachelreihen, Zickzackwände, Löcher mit Inseln
    const d = level - 5, r = rng(6300 + level * 53), ri = (a, b) => a + Math.floor(r() * (b - a + 1));
    const pool = [0, 1, 2, 2, 3, ...(d >= 1 ? [3] : []), ...(d >= 2 ? [2, 1] : [])];
    let x = 5;
    while (x < C - 40) {
      const kind = pool[ri(0, pool.length - 1)];
      if (kind === 0) { // abwechselnd Stacheln am Boden und an der Decke
        let fl = r() < 0.5;
        for (let i = ri(4, 5 + d); i > 0 && x < C - 20; i--) { const len = ri(2, 3); fill(x, x + len - 1, fl ? 17 : 2, fl ? 17 : 2, 2); fl = !fl; x += len + (d >= 3 ? ri(1, 2) : 2); }
      } else if (kind === 1) { // Zickzackwände
        let top = r() < 0.5;
        for (let i = ri(3, 5 + d); i > 0 && x < C - 20; i--) { fill(x, x, top ? 2 : 10, top ? 9 : 17, 1); top = !top; x += d >= 2 ? ri(2, 3) : 3; }
        x += 1;
      } else if (kind === 2) { // Loch oben und unten, dazwischen schwebende Inseln, später kürzer und weiter auseinander
        const x0 = x; let top = r() < 0.5; x += 1;
        for (let i = ri(3, 3 + Math.min(d, 2)); i > 0 && x < C - 26; i--) {
          const len = ri(d >= 3 ? 4 : 5, d >= 3 ? 5 : 7), y = top ? 5 : 12;
          fill(x, x + len - 1, y, y + 1, 1);
          top = !top; x += len + (d >= 1 ? ri(1, 2) : 1);
        }
        fill(x0 + 1, x - 1, 0, 1, 0); fill(x0 + 1, x - 1, 18, 19, 0); x += 2;
      } else { // versetzte Löcher: im Flug über das Ende des einen Lochs hinweg
        const a = ri(3, 4), b = ri(3, 4), o = ri(1, Math.min(2, a - 1));
        if (r() < 0.5) { fill(x, x + a - 1, 18, 19, 0); fill(x + a - o, x + a - o + b - 1, 0, 1, 0); }
        else { fill(x, x + a - 1, 0, 1, 0); fill(x + a - o, x + a - o + b - 1, 18, 19, 0); }
        x += a - o + b + 3;
      }
      x += 2;
    }
    fill(C - 14, C - 13, 17, 17, 2); fill(C - 10, C - 9, 2, 2, 2);
  }
  const door = { x: (C - 3) * T, y: 18 * T - 50, w: 28, h: 50 };
  const p = { x: 40, y: 18 * T - 20, w: 14, h: 20, vx: 0, vy: 0, grav: 1, ground: false };
  let safe = { x: p.x, y: p.y, grav: 1 }, cam = 0, t = 0, flash = 0, flips = 0;
  const solidAt = (cx, cy) => cx < 0 || cx >= C ? true : cy < 0 || cy >= R ? false : g[cy][cx] === 1;
  function collide(axis, d) {
    const x0 = Math.floor(p.x / T), x1 = Math.floor((p.x + p.w - 0.01) / T), y0 = Math.floor(p.y / T), y1 = Math.floor((p.y + p.h - 0.01) / T);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (!solidAt(x, y)) continue;
      if (axis === 'x') { p.x = d > 0 ? x * T - p.w : (x + 1) * T; p.vx = 0; }
      else { if (d > 0) p.y = y * T - p.h; else p.y = (y + 1) * T; if (Math.sign(d) === p.grav) p.ground = true; p.vy = 0; }
      return;
    }
  }
  function die() { died(); flash = 0.4; Object.assign(p, { x: safe.x, y: safe.y, grav: safe.grav, vx: 0, vy: 0 }); }
  const self = {
    done: false, p, // für Testprogramme
    door: () => ({ ...door, x: door.x - cam }),
    update(dt) {
      t += dt; flash = Math.max(0, flash - dt);
      if ((pressed.action || pressed.up || pressed.down) && p.ground) { p.grav *= -1; p.ground = false; flips++; }
      const ax = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
      p.vx += (ax * 160 - p.vx) * Math.min(1, dt * 14);
      p.vy = clamp(p.vy + 1400 * p.grav * dt, -560, 560);
      const dx = p.vx * dt; p.x += dx; collide('x', dx);
      const dy = p.vy * dt; p.y += dy; p.ground = false; collide('y', dy);
      const hb = { x: p.x + 2, y: p.y + 2, w: p.w - 4, h: p.h - 4 };
      for (let y = Math.floor(hb.y / T); y <= Math.floor((hb.y + hb.h) / T); y++)
        for (let x = Math.floor(hb.x / T); x <= Math.floor((hb.x + hb.w) / T); x++)
          if (g[y]?.[x] === 2 && overlap(hb, { x: x * T + 3, y: y * T + 3, w: T - 6, h: T - 6 })) return die();
      if (p.y < -40 || p.y > H + 40) return die();
      if (p.ground) safe = { x: p.x, y: p.y, grav: p.grav };
      cam = clamp(p.x - W * 0.4, 0, C * T - W);
      if (overlap(p, door)) self.done = true;
    },
    draw(c) {
      const CY = '#55ffff', MG = '#ff55ff', WH = '#ffffff';
      c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
      c.fillStyle = MG; for (let i = 0; i < 60; i++) c.fillRect(((i * 157 - cam * 0.3) % W + W) % W, (i * 89) % H, 2, 2);
      c.save(); c.translate(-Math.round(cam), 0);
      for (let y = 0; y < R; y++) for (let x = Math.floor(cam / T); x <= Math.min(C - 1, Math.floor(cam / T) + 33); x++) {
        const v = g[y][x], px = x * T, py = y * T;
        if (v === 1) {
          c.fillStyle = CY; c.fillRect(px, py, T, T);
          c.fillStyle = MG; for (let k = 0; k < T; k += 4) for (let m = (k / 4) % 2 * 2; m < T; m += 4) c.fillRect(px + m, py + k, 2, 2);
          c.fillStyle = '#000'; c.fillRect(px, py + T - 1, T, 1); c.fillRect(px + T - 1, py, 1, T);
        } else if (v === 2) {
          const up = solidAt(x, y + 1);
          c.fillStyle = WH;
          for (const o of [0, 10]) { c.beginPath(); if (up) { c.moveTo(px + o, py + T); c.lineTo(px + o + 5, py + 4); c.lineTo(px + o + 10, py + T); } else { c.moveTo(px + o, py); c.lineTo(px + o + 5, py + T - 4); c.lineTo(px + o + 10, py); } c.fill(); }
        }
      }
      paintDoor(c, door, { frame: WH, panel: MG, knob: CY, light: next, open: doorOpenness(p, door, 80) });
      // Figur, bei umgedrehter Schwerkraft auf dem Kopf
      c.save(); c.translate(Math.round(p.x + p.w / 2), Math.round(p.y + p.h / 2)); if (p.grav < 0) c.scale(1, -1);
      c.fillStyle = WH; c.fillRect(-5, -10, 10, 8); c.fillRect(-4, -2, 8, 7); c.fillRect(-6, 5, 4, 5); c.fillRect(2, 5, 4, 5);
      c.fillStyle = '#000'; c.fillRect(-2, -8, 2, 2); c.fillRect(2, -8, 2, 2);
      c.restore(); c.restore();
      c.fillStyle = '#000'; c.fillRect(8, H - 34, 170, 24); label(c, `UMKEHRUNGEN ${flips}`, 14, H - 17, CY);
      flashOverlay(c, flash, '255,85,255');
    }
  };
  return self;
}
