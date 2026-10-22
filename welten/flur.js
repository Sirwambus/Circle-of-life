/* =====================================================================
   WELT – Der Flur: frei laufen, sonst nichts.
   ===================================================================== */
function makeFlur(next, level = 0) {
  // Level 1: drei Wände. Level 2: fünf Wände, engere Gänge. Level 3: dazu rollende Wollknäuel.
  const slalom = level === 0 ? [[160, 0], [320, 1], [480, 0]] : [[110, 0], [210, 1], [310, 0], [410, 1], [510, 0]];
  const walls = [
    { x: 0, y: 0, w: 640, h: 24 }, { x: 0, y: 376, w: 640, h: 24 }, { x: 0, y: 0, w: 20, h: 400 }, { x: 620, y: 0, w: 20, h: 400 },
    ...slalom.map(([x, low]) => ({ x, y: low ? 140 : 24, w: level === 0 ? 26 : 22, h: 236 }))
  ];
  const BSP = [0, 0, 1, 1.4, 1.8, 2, 2.2, 2.4, 2.6, 2.8][level]; // Level 4 und 5: schnellere Wollknäuel
  const balls = level < 2 ? [] : [[160, 120], [260, 150], [360, 135], [460, 165]].map(([x, sp], i) => ({ x: x + 11, y: 60 + i * 70, sp: (i % 2 ? -sp : sp) * BSP }));
  const start = { x: 50, y: 50 };
  const door = { x: 584, y: 300, w: 34, h: 62 };
  const p = { x: 50, y: 50, w: 22, h: 22, fx: 1, fy: 0 };
  const trail = []; let t = 0;
  const self = {
    done: false, door: () => door,
    update(dt) {
      t += dt;
      let dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), dy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
      const l = Math.hypot(dx, dy) || 1;
      if (dx || dy) { p.fx = dx / l; p.fy = dy / l; }
      moveAndCollide(p, dx / l * 170 * dt, dy / l * 170 * dt, walls);
      if ((dx || dy) && t - (trail.length ? trail[trail.length - 1].t : -1) > 0.13) trail.push({ x: p.x + 11, y: p.y + 18, t });
      while (trail.length && t - trail[0].t > 2.4) trail.shift();
      for (const b of balls) {
        b.y += b.sp * dt; if (b.y < 40 || b.y > 360) { b.sp *= -1; b.y = clamp(b.y, 40, 360); }
        if (Math.hypot(b.x - (p.x + 11), b.y - (p.y + 11)) < 21) { died(); Object.assign(p, start); }
      }
      if (overlap(p, door)) self.done = true;
    },
    draw(c) {
      c.fillStyle = '#dce8e1'; c.fillRect(0, 0, W, H);
      c.fillStyle = '#d2e1d8';
      for (let y = 0; y < H; y += 40) for (let x = (y / 40 % 2) * 40; x < W; x += 80) c.fillRect(x, y, 40, 40);
      c.fillStyle = 'rgba(40,80,64,0.13)';
      for (const w of walls) c.fillRect(w.x + 7, w.y + 7, w.w, w.h);
      for (const w of walls) {
        c.fillStyle = '#7fa392'; c.fillRect(w.x, w.y, w.w, w.h);
        c.fillStyle = '#a7c6b7'; c.fillRect(w.x, w.y, w.w, Math.min(w.h, w.h > 30 ? w.h - 10 : w.h - 4));
      }
      for (const s of trail) {
        c.globalAlpha = 0.45 * (1 - (t - s.t) / 2.4); c.fillStyle = '#b98f7c';
        c.beginPath(); c.ellipse(s.x, s.y, 3, 2, 0, 0, 7); c.fill();
      }
      c.globalAlpha = 1;
      for (const b of balls) {
        c.fillStyle = 'rgba(40,60,50,0.2)'; c.beginPath(); c.ellipse(b.x, b.y + 10, 10, 3, 0, 0, 7); c.fill();
        c.fillStyle = '#c86b98'; c.beginPath(); c.arc(b.x, b.y, 10, 0, 7); c.fill();
        c.strokeStyle = '#f2b6d2'; c.lineWidth = 1.5; for (const k of [-4, 0, 4]) { c.beginPath(); c.arc(b.x + k, b.y - 14, 14, 0.9, 2.2); c.stroke(); }
      }
      paintDoor(c, door, { frame: '#5e4130', panel: '#a8734f', knob: '#f1d28a', light: next, open: doorOpenness(p, door) });
      const cx = p.x + 11, cy = p.y + 11;
      c.fillStyle = 'rgba(40,60,50,0.2)'; c.beginPath(); c.ellipse(cx, cy + 11, 11, 4, 0, 0, 7); c.fill();
      c.fillStyle = '#ef7a5a'; c.beginPath(); c.arc(cx, cy, 12, 0, 7); c.fill();
      c.fillStyle = '#fff';
      const ex = -p.fy * 4, ey = p.fx * 4;
      for (const s of [-1, 1]) { c.beginPath(); c.arc(cx + p.fx * 5 + ex * s, cy + p.fy * 5 + ey * s - 2, 2.6, 0, 7); c.fill(); }
      c.fillStyle = '#3c2a24';
      for (const s of [-1, 1]) { c.beginPath(); c.arc(cx + p.fx * 6 + ex * s, cy + p.fy * 6 + ey * s - 2, 1.3, 0, 7); c.fill(); }
    }
  };
  return self;
}
