/* =====================================================================
   WELT – Wächter: Schleich an den Wachen vorbei. Ihr Sichtkegel wird von Wänden blockiert.
   Grafik: Bauplan, weiße Linien auf Blau.
   ===================================================================== */
function makeWaechter(next, level = 0) {
  // Je Level: schnellere Wachen mit größerer Sichtweite und kürzeren Pausen. Level 3: rotierender Posten vor der Tür.
  const FAST = [1, 1.2, 1.3, 1.4, 1.5, 1.55, 1.6, 1.65, 1.7, 1.75][level], PAUSE = [0.7, 0.5, 0.4, 0.35, 0.3, 0.28, 0.26, 0.24, 0.22, 0.2][level];
  const B = 16;
  const walls = [
    { x: 0, y: 0, w: W, h: B }, { x: 0, y: H - B, w: W, h: B }, { x: 0, y: 0, w: B, h: H }, { x: W - B, y: 0, w: B, h: H },
    { x: 120, y: B, w: 16, h: 250 }, { x: 250, y: 140, w: 16, h: H - 140 - B }, { x: 380, y: B, w: 16, h: 250 }, { x: 500, y: 140, w: 16, h: H - 140 - B },
    { x: 170, y: 300, w: 36, h: 36 }, { x: 300, y: 70, w: 40, h: 30 }, { x: 430, y: 300, w: 36, h: 36 }
  ];
  const door = { x: 586, y: 300, w: 32, h: 60 };
  const start = { x: 44, y: 340 };
  const RANGE = [135, 150, 160, 168, 176, 180, 184, 188, 192, 196][level], HALF = 0.5;
  const guards = [
    { path: [[190, 50], [190, 250]], sp: 55 }, { path: [[320, 360], [320, 140]], sp: 60 },
    { path: [[450, 50], [450, 260]], sp: 50 }, { path: [[540, 60], [600, 60], [600, 240], [540, 240]], sp: 55 },
    ...(level >= 2 ? [{ path: [[560, 330]], sp: 0, spin: [0, 0, 1.1, 1.3, 1.5, 1.6, 1.7, 1.8, 1.9, 2][level] }] : []),
    ...(level >= 4 ? [{ path: [[60, 200]], sp: 0, spin: -1.2 }] : [])
  ].map(g => ({ ...g, sp: g.sp * FAST, i: 0, x: g.path[0][0], y: g.path[0][1], a: 0, wait: 0 }));
  const p = { x: start.x, y: start.y, w: 18, h: 18 };
  let flash = 0, t = 0, caught = 0;
  function cone(g) {
    const pts = [[g.x, g.y]];
    for (let k = 0; k <= 20; k++) {
      const a = g.a - HALF + k / 20 * HALF * 2;
      let r = 0; while (r < RANGE) { r += 6; const x = g.x + Math.cos(a) * r, y = g.y + Math.sin(a) * r; if (walls.some(s => x > s.x && x < s.x + s.w && y > s.y && y < s.y + s.h)) break; }
      pts.push([g.x + Math.cos(a) * r, g.y + Math.sin(a) * r]);
    }
    return pts;
  }
  const self = {
    done: false, door: () => door,
    update(dt) {
      t += dt; flash = Math.max(0, flash - dt);
      let dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), dy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0); const l = Math.hypot(dx, dy) || 1;
      moveAndCollide(p, dx / l * 115 * dt, dy / l * 115 * dt, walls);
      const pc = center(p);
      for (const g of guards) {
        if (g.spin) g.a += g.spin * dt;
        else if (g.wait > 0) { g.wait -= dt; }
        else {
          const [tx, ty] = g.path[(g.i + 1) % g.path.length], ddx = tx - g.x, ddy = ty - g.y, d = Math.hypot(ddx, ddy);
          const want = Math.atan2(ddy, ddx); let diff = ((want - g.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
          g.a += clamp(diff, -4 * dt, 4 * dt);
          if (Math.abs(diff) < 0.2) { const st = Math.min(d, g.sp * dt); g.x += ddx / d * st || 0; g.y += ddy / d * st || 0; }
          if (d < 1) { g.i = (g.i + 1) % g.path.length; g.wait = PAUSE; }
        }
        const vx = pc.x - g.x, vy = pc.y - g.y, dist = Math.hypot(vx, vy);
        let ad = Math.abs(((Math.atan2(vy, vx) - g.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
        if ((dist < RANGE && ad < HALF && lineOfSight(g.x, g.y, pc.x, pc.y, walls)) || dist < 16) {
          died(); flash = 0.5; caught++; Object.assign(p, start); return;
        }
      }
      if (overlap(p, door)) self.done = true;
    },
    draw(c) {
      c.fillStyle = '#1d4e89'; c.fillRect(0, 0, W, H);
      c.strokeStyle = 'rgba(255,255,255,0.07)'; c.lineWidth = 1;
      for (let x = 0; x < W; x += 16) { c.beginPath(); c.moveTo(x + 0.5, 0); c.lineTo(x + 0.5, H); c.stroke(); }
      for (let y = 0; y < H; y += 16) { c.beginPath(); c.moveTo(0, y + 0.5); c.lineTo(W, y + 0.5); c.stroke(); }
      for (const g of guards) {
        const pts = cone(g);
        c.fillStyle = 'rgba(255,214,90,0.22)'; c.beginPath(); pts.forEach(([x, y], i) => c[i ? 'lineTo' : 'moveTo'](x, y)); c.closePath(); c.fill();
        c.strokeStyle = 'rgba(255,214,90,0.6)'; c.stroke();
      }
      for (const s of walls) {
        c.save(); c.beginPath(); c.rect(s.x, s.y, s.w, s.h); c.clip();
        c.strokeStyle = 'rgba(255,255,255,0.35)'; for (let k = -s.h; k < s.w; k += 7) { c.beginPath(); c.moveTo(s.x + k, s.y + s.h); c.lineTo(s.x + k + s.h, s.y); c.stroke(); }
        c.restore(); c.strokeStyle = '#ffffff'; c.lineWidth = 1.5; c.strokeRect(s.x + 0.5, s.y + 0.5, s.w - 1, s.h - 1); c.lineWidth = 1;
      }
      // Maßlinie und Schriftfeld
      c.strokeStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.moveTo(136, 380); c.lineTo(250, 380); c.moveTo(136, 376); c.lineTo(136, 384); c.moveTo(250, 376); c.lineTo(250, 384); c.stroke();
      label(c, '2,85 m', 193, 377, 'rgba(255,255,255,0.6)', 'center', 9);
      c.strokeStyle = '#fff'; c.strokeRect(24.5, 24.5, 84, 34); label(c, 'GRUNDRISS', 66, 38, '#fff', 'center', 9); label(c, 'EBENE 19 · 1:50', 66, 52, 'rgba(255,255,255,0.7)', 'center', 9);
      paintDoor(c, door, { frame: '#ffffff', panel: '#2b63a3', knob: '#ffd65a', light: next, open: doorOpenness(p, door, 90) });
      for (const g of guards) {
        c.fillStyle = '#1d4e89'; c.strokeStyle = '#ffd65a'; c.lineWidth = 2; c.beginPath(); c.arc(g.x, g.y, 9, 0, 7); c.fill(); c.stroke();
        c.beginPath(); c.moveTo(g.x, g.y); c.lineTo(g.x + Math.cos(g.a) * 12, g.y + Math.sin(g.a) * 12); c.stroke();
      }
      const pc = center(p);
      c.fillStyle = '#ffffff'; c.beginPath(); c.arc(pc.x, pc.y, 8, 0, 7); c.fill();
      c.strokeStyle = '#1d4e89'; c.lineWidth = 2; c.beginPath(); c.arc(pc.x, pc.y, 4, 0, 7); c.stroke(); c.lineWidth = 1;
      label(c, `Erwischt ${caught}×`, W - 26, 38, '#ffffff', 'right');
      flashOverlay(c, flash, '255,214,90');
    }
  };
  return self;
}
