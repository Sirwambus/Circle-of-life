/* =====================================================================
   WELT – Farbwechsel: Jump'n'Run, bei dem nur Blöcke der aktiven Farbe fest sind.
   ===================================================================== */
function makeFarbwechsel(next, level = 0) {
  const T = 20, R = 20, C = [48, 64, 80, 96, 112, 124, 136, 148, 160, 172][level];
  const COL = { 1: '#17171c', 2: '#e63b2e', 3: '#1f4fd1' }, NAME = { 2: 'ROT', 3: 'BLAU' };
  const g = [...Array(R)].map(() => Array(C).fill(0)); // 1 schwarz (immer fest), 2 rot, 3 blau
  const fill = (x0, x1, y0, y1, v) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = v; };
  if (level === 0) {
    fill(0, 7, 16, 19, 1); fill(8, 15, 16, 16, 2);
    fill(16, 23, 16, 19, 1); fill(18, 18, 9, 15, 2); fill(21, 21, 9, 15, 3);
    fill(24, 31, 16, 16, 3);
    fill(32, 35, 16, 19, 1); fill(36, 37, 13, 13, 2); fill(39, 40, 10, 10, 3); fill(42, 47, 10, 19, 1);
  } else if (level === 1) {
    // Brücken mit wechselnden Farben, Treppe mit Wechsel im Sprung, zwei Farbwände vor der Tür
    fill(0, 6, 16, 19, 1); fill(7, 12, 16, 16, 3);
    fill(13, 18, 16, 19, 1); fill(15, 15, 8, 15, 2); fill(17, 17, 8, 15, 3);
    fill(19, 21, 16, 16, 2); fill(22, 24, 16, 16, 3); fill(25, 27, 16, 16, 2);
    fill(28, 33, 16, 19, 1);
    fill(35, 36, 13, 13, 2); fill(38, 39, 10, 10, 3); fill(41, 42, 7, 7, 2); fill(44, 49, 7, 19, 1);
    fill(50, 63, 16, 19, 1); fill(55, 55, 9, 15, 3); fill(58, 58, 9, 15, 2);
  } else if (level === 2) {
    fill(0, 5, 16, 19, 1);
    for (let x = 6; x <= 15; x += 2) fill(x, x + 1, 16, 16, (x / 2) % 2 ? 2 : 3);
    fill(16, 21, 16, 19, 1); fill(18, 18, 6, 15, 2); fill(20, 20, 6, 15, 3);
    fill(24, 25, 14, 14, 3); fill(28, 29, 12, 12, 2);
    fill(31, 36, 16, 19, 1);
    fill(38, 39, 13, 13, 2); fill(41, 42, 10, 10, 3); fill(44, 45, 7, 7, 2); fill(47, 48, 4, 4, 3); fill(50, 55, 4, 19, 1);
    fill(56, 79, 16, 19, 1); fill(60, 60, 6, 15, 2); fill(63, 63, 6, 15, 3); fill(66, 66, 6, 15, 2);
  } else if (level === 3) {
    fill(0, 5, 16, 19, 1);
    for (let x = 6; x <= 23; x += 3) fill(x, x + 2, 16, 16, (x / 3) % 2 ? 3 : 2);
    fill(24, 29, 16, 19, 1); fill(26, 26, 5, 15, 2); fill(28, 28, 5, 15, 3);
    fill(32, 32, 13, 13, 2); fill(35, 35, 11, 11, 3); fill(38, 38, 13, 13, 2); fill(41, 41, 11, 11, 3);
    fill(44, 49, 16, 19, 1);
    fill(51, 52, 13, 13, 3); fill(54, 55, 10, 10, 2); fill(57, 58, 7, 7, 3); fill(60, 61, 4, 4, 2); fill(63, 68, 4, 19, 1);
    fill(69, 95, 16, 19, 1); fill(72, 72, 6, 15, 2); fill(74, 74, 6, 15, 3); fill(76, 76, 6, 15, 2); fill(78, 78, 6, 15, 3);
    fill(82, 87, 16, 19, 0); fill(82, 84, 16, 16, 2); fill(85, 87, 16, 16, 3);
  } else if (level === 4) {
    fill(0, 5, 16, 19, 1);
    for (let x = 6; x <= 23; x += 2) fill(x, x + 1, 16, 16, (x / 2) % 2 ? 2 : 3);
    fill(24, 29, 16, 19, 1); fill(26, 26, 5, 15, 2); fill(28, 28, 5, 15, 3);
    for (const [x, y, v] of [[31, 13, 2], [34, 11, 3], [37, 13, 2], [40, 11, 3], [43, 13, 2], [46, 11, 3]]) fill(x, x, y, y, v);
    fill(49, 53, 16, 19, 1);
    fill(55, 55, 13, 13, 2); fill(58, 58, 10, 10, 3); fill(61, 61, 7, 7, 2); fill(64, 64, 4, 4, 3); fill(66, 71, 4, 19, 1);
    fill(72, 111, 16, 19, 1); for (const [x, v] of [[75, 2], [77, 3], [79, 2], [81, 3], [83, 2]]) fill(x, x, 6, 15, v);
    fill(87, 96, 16, 19, 0); for (let x = 87; x <= 96; x += 2) fill(x, x + 1, 16, 16, (x - 87) / 2 % 2 ? 3 : 2);
  } else if (level >= 5) {
    // Level 6–10: Abschnitte aus festem Zufall (Seed je Level); ab Level 7 Farbwände über Brücken und in der Luft
    const d = level - 5, r = rng(5200 + level * 31), ri = (a, b) => a + Math.floor(r() * (b - a + 1)), other = v => 5 - v;
    let x = 6, gy = 16, c = 2;
    fill(0, 5, 16, 19, 1);
    const black = (len, y) => { fill(x, x + len - 1, y, 19, 1); gy = y; x += len; };
    const wall = (cx, y0, y1, v) => fill(cx, cx, Math.max(0, y0), y1, v);
    const pool = [0, 1, 2, 3, ...(d >= 1 ? [4] : []), ...(d >= 2 ? [3, 4] : []), ...(d >= 3 ? [0, 4] : [])];
    while (x < C - 40) {
      const kind = pool[ri(0, pool.length - 1)];
      if (kind === 0) { // Brücke aus Farbstücken, ab Level 7 mit Wänden der Gegenfarbe darüber
        const k = d >= 2 ? 2 : ri(2, 3);
        for (let i = ri(3, 4 + Math.min(d, 2)); i > 0 && x < C - 26; i--) { fill(x, x + k - 1, gy, gy, c); if (d >= 1 && i % 2) wall(x, gy - 8, gy - 1, other(c)); c = other(c); x += k; }
        black(ri(3, 5), gy);
      } else if (kind === 1) { // Farbwände auf schwarzem Boden
        const n = ri(2, 3 + Math.min(d, 2)), x0 = x; black(n * 3 + 2, gy);
        for (let i = 0; i < n; i++) { wall(x0 + 2 + i * 3, gy - 7, gy - 1, c); c = other(c); }
      } else if (kind === 2) { // Treppe aus Farbsteinen: im Sprung wechseln
        let y = gy;
        for (let i = ri(2, 3 + Math.min(d, 1)); i > 0 && y > 7 && x < C - 26; i--) { const sw = 2; x += 2; y -= ri(2, 3); fill(x, x + sw - 1, y, y, c); c = other(c); x += sw; }
        x += 2; black(ri(4, 5), y);
      } else if (kind === 3) { // Kette einzelner Farbsteine über dem Abgrund
        let y = gy;
        for (let i = ri(3, 4 + Math.min(d, 2)); i > 0 && x < C - 26; i--) { const sw = d >= 3 ? 1 : 2; x += sw === 1 ? 2 : ri(2, 3); y = clamp(y + ri(-2, 2) + (y < 11 ? 1 : 0), 6, 15); fill(x, x + sw - 1, y, y, c); c = other(c); x += sw; }
        x += 2; black(ri(3, 5), clamp(y + ri(-1, 2), 6, 16));
      } else { // Wände in der Luft: im Sprung zweimal wechseln
        let y = gy;
        for (let i = ri(2, 2 + Math.min(d, 2)); i > 0 && x < C - 26; i--) { const sw = d >= 3 ? 1 : 2; wall(x + 1, y - 8, y - 1, c); x += 3; fill(x, x + sw - 1, y, y, c); x += sw; }
        wall(x + 1, y - 8, y - 1, c); c = other(c); x += 3; black(ri(3, 5), y);
      }
    }
    x += 2; black(C - x, 16);
    wall(C - 13, 9, 15, 2); wall(C - 10, 9, 15, 3);
  }
  const door = level === 0 ? { x: 900, y: 150, w: 28, h: 50 } : { x: (C - 4) * T, y: 270, w: 28, h: 50 };
  const p = { x: 40, y: 280, w: 14, h: 18, vx: 0, vy: 0, ground: false, coyote: 0, buffer: 0, face: 1, run: 0 };
  let mode = 2, cam = 0, flash = 0, denied = 0, safe = { x: 40, y: 280 };
  const solidAt = (cx, cy) => cx < 0 || cx >= C ? true : cy < 0 || cy >= R ? false : g[cy][cx] === 1 || g[cy][cx] === mode;
  const touches = v => {
    for (let y = Math.floor(p.y / T); y <= Math.floor((p.y + p.h - 0.01) / T); y++)
      for (let x = Math.floor(p.x / T); x <= Math.floor((p.x + p.w - 0.01) / T); x++) if (g[y]?.[x] === v) return true;
    return false;
  };
  const self = {
    done: false, p, getMode: () => mode, setMode: m => { mode = m; }, // für Testprogramme
    door: () => ({ ...door, x: door.x - cam }),
    update(dt) {
      flash = Math.max(0, flash - dt); denied = Math.max(0, denied - dt);
      if (pressed.action) { const nm = mode === 2 ? 3 : 2; if (touches(nm)) denied = 1.2; else mode = nm; }
      platformPhysics(p, dt, T, solidAt, pressed.up, keys.up);
      if (p.ground) { // Rücksetzpunkt: zuletzt auf schwarzem Boden gestanden
        const under = g[Math.floor((p.y + p.h + 1) / T)]?.[Math.floor((p.x + p.w / 2) / T)];
        if (under === 1) safe = { x: p.x, y: p.y };
      }
      if (p.y > H + 40) { died(); flash = 0.35; Object.assign(p, { ...safe, vx: 0, vy: 0 }); }
      cam = clamp(p.x - W * 0.4, 0, C * T - W);
      if (overlap(p, door)) self.done = true;
    },
    draw(c) {
      c.fillStyle = '#e7e5df'; c.fillRect(0, 0, W, H);
      c.fillStyle = '#f2c230'; c.beginPath(); c.arc(470 - cam * 0.2, 110, 86, 0, 7); c.fill();
      c.fillStyle = 'rgba(230,59,46,0.12)'; c.beginPath(); c.moveTo(120 - cam * 0.1, H); c.arc(120 - cam * 0.1, H, 220, Math.PI, Math.PI * 1.5); c.fill();
      c.strokeStyle = '#17171c'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 62); c.lineTo(W, 62); c.moveTo(560 - cam * 0.3, 0); c.lineTo(560 - cam * 0.3, H); c.stroke();
      c.save(); c.translate(-Math.round(cam), 0);
      for (let y = 0; y < R; y++) for (let x = Math.floor(cam / T); x <= Math.min(C - 1, Math.floor(cam / T) + 33); x++) {
        const v = g[y][x]; if (!v) continue;
        const px = x * T, py = y * T;
        if (v === 1 || v === mode) { c.fillStyle = COL[v]; c.fillRect(px, py, T, T); }
        else {
          c.strokeStyle = COL[v]; c.globalAlpha = 0.55; c.lineWidth = 2; c.strokeRect(px + 2, py + 2, T - 4, T - 4);
          c.beginPath(); c.moveTo(px + 4, py + T - 4); c.lineTo(px + T - 4, py + 4); c.stroke(); c.globalAlpha = 1;
        }
      }
      paintDoor(c, door, { frame: '#17171c', panel: '#f2c230', knob: '#17171c', light: next, open: doorOpenness(p, door, 80) });
      const px = Math.round(p.x), py = Math.round(p.y);
      c.fillStyle = '#17171c'; c.fillRect(px - 2, py - 2, p.w + 4, p.h + 4);
      c.fillStyle = COL[mode]; c.fillRect(px, py, p.w, p.h);
      c.fillStyle = '#fff'; c.fillRect(p.face > 0 ? px + 8 : px + 2, py + 4, 4, 4);
      c.restore();
      c.fillStyle = COL[mode]; c.beginPath(); c.arc(24, 28, 9, 0, 7); c.fill();
      c.font = '600 12px "IBM Plex Mono", monospace'; c.fillStyle = '#17171c'; c.textAlign = 'left';
      c.fillText(`${NAME[mode]} ist fest   ·   Leertaste / A: Farbe wechseln`, 42, 32);
      if (denied > 0) { c.fillStyle = '#e63b2e'; c.fillText('Wechsel blockiert: Du stehst gerade in einem Block dieser Farbe.', 14, 52); }
      if (flash > 0) { c.fillStyle = `rgba(23,23,28,${flash})`; c.fillRect(0, 0, W, H); }
    }
  };
  return self;
}
