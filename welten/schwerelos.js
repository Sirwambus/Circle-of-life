/* =====================================================================
   WELT – Schwerelos: Raumschiff mit Trägheit, Planetengravitation, Asteroiden.
   ===================================================================== */
function makeSchwerelos(next, level = 0) {
  // Je Level: mehr Asteroiden, stärkere Anziehung. Level 3 hat zwei Planeten.
  const R = rng(7 + level), NROCK = [7, 9, 11, 12, 13, 14, 15, 16, 17, 18][level], GRAV = [1.5e6, 1.75e6, 1.5e6, 1.65e6, 1.5e6, 1.6e6, 1.7e6, 1.6e6, 1.7e6, 1.8e6][level];
  const planets = level < 2 ? [{ x: 320, y: 200, r: 44 }] : level < 4 ? [{ x: 250, y: 130, r: 38 }, { x: 420, y: 280, r: 40 }]
    : [{ x: 220, y: 110, r: 32 }, { x: 430, y: 110, r: 30 }, { x: 330, y: 295, r: 38 }];
  const start = { x: 60, y: 200 };
  const door = { x: 586, y: 172, w: 30, h: 56 };
  const stars = Array.from({ length: 90 }, () => ({ x: R() * W, y: R() * H, s: R() < 0.15 ? 1.6 : 0.8 }));
  const rocks = [];
  while (rocks.length < NROCK) {
    const r = 11 + R() * 14, x = R() * W, y = R() * H;
    const far = (a, b, d) => Math.hypot(x - a, y - b) > d;
    if (!far(start.x, start.y, 130) || !far(600, 200, 90) || planets.some(pl => !far(pl.x, pl.y, pl.r + r + 30))) continue;
    const a = R() * 7, sp = 18 + R() * 30;
    rocks.push({ x, y, r, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, rot: 0, spin: (R() - 0.5) * 1.5,
      pts: Array.from({ length: 9 }, () => 0.72 + R() * 0.35) });
  }
  const s = { x: start.x, y: start.y, a: 0, vx: 0, vy: 0, dead: 0, safe: 1.2 };
  const parts = [];
  let t = 0;
  const wrap = o => { o.x = (o.x + W) % W; o.y = (o.y + H) % H; };
  function explode() {
    died(); s.dead = 1.1;
    for (let i = 0; i < 26; i++) { const a = Math.random() * 7, v = 40 + Math.random() * 120; parts.push({ x: s.x, y: s.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.9, col: '#ffcf6b' }); }
  }
  const self = {
    done: false, door: () => door,
    update(dt) {
      t += dt;
      for (const r of rocks) { r.x += r.vx * dt; r.y += r.vy * dt; r.rot += r.spin * dt; wrap(r); }
      for (const q of parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt; }
      while (parts.length && parts[0].life <= 0) parts.shift();
      if (s.dead > 0) { s.dead -= dt; if (s.dead <= 0) Object.assign(s, { x: start.x, y: start.y, a: 0, vx: 0, vy: 0, safe: 1.2 }); return; }
      s.safe -= dt;
      s.a += ((keys.right ? 1 : 0) - (keys.left ? 1 : 0)) * 3.4 * dt;
      if (keys.up || keys.action) {
        s.vx += Math.cos(s.a) * 230 * dt; s.vy += Math.sin(s.a) * 230 * dt;
        if (Math.random() < 0.8) parts.push({ x: s.x - Math.cos(s.a) * 9, y: s.y - Math.sin(s.a) * 9,
          vx: s.vx - Math.cos(s.a + (Math.random() - 0.5) * 0.6) * 90, vy: s.vy - Math.sin(s.a + (Math.random() - 0.5) * 0.6) * 90, life: 0.35, col: '#ff8a3d' });
      }
      for (const pl of planets) {
        const dx = pl.x - s.x, dy = pl.y - s.y, d = Math.max(60, Math.hypot(dx, dy)), g = GRAV / (d * d);
        s.vx += dx / d * g * dt; s.vy += dy / d * g * dt;
      }
      s.vx *= 1 - 0.25 * dt; s.vy *= 1 - 0.25 * dt;
      const sp = Math.hypot(s.vx, s.vy); if (sp > 250) { s.vx *= 250 / sp; s.vy *= 250 / sp; }
      s.x += s.vx * dt; s.y += s.vy * dt; wrap(s);
      if (planets.some(pl => Math.hypot(pl.x - s.x, pl.y - s.y) < pl.r + 7)) return explode();
      if (s.safe <= 0) for (const r of rocks) if (Math.hypot(r.x - s.x, r.y - s.y) < r.r * 0.9 + 6) return explode();
      if (overlap({ x: s.x - 6, y: s.y - 6, w: 12, h: 12 }, door)) self.done = true;
    },
    draw(c) {
      const bg = c.createRadialGradient(W * 0.5, H * 0.5, 40, W * 0.5, H * 0.5, W * 0.7);
      bg.addColorStop(0, '#13204a'); bg.addColorStop(1, '#060a1c'); c.fillStyle = bg; c.fillRect(0, 0, W, H);
      for (const st of stars) { c.globalAlpha = 0.5 + 0.5 * Math.sin(t * 2 + st.x); c.fillStyle = '#dfe6ff'; c.fillRect(st.x, st.y, st.s, st.s); }
      c.globalAlpha = 1; c.lineWidth = 1.5; c.lineJoin = 'round';
      // Planet mit Gravitationsringen
      c.save(); c.strokeStyle = 'rgba(255,207,107,0.18)'; c.setLineDash([3, 7]);
      for (const planet of planets) for (const rr of [80, 120, 170]) { c.lineDashOffset = -t * 8 * (200 / rr); c.beginPath(); c.arc(planet.x, planet.y, rr, 0, 7); c.stroke(); }
      c.setLineDash([]); c.shadowColor = '#ffcf6b'; c.shadowBlur = 16; c.strokeStyle = '#ffcf6b';
      for (const planet of planets) {
        c.beginPath(); c.arc(planet.x, planet.y, planet.r, 0, 7); c.stroke();
        c.beginPath(); c.ellipse(planet.x, planet.y, planet.r * 1.6, planet.r * 0.35, -0.3, 0, 7); c.stroke();
      }
      // Asteroiden
      c.strokeStyle = '#cfd7ff'; c.shadowColor = '#8fa3ff'; c.shadowBlur = 8;
      for (const r of rocks) for (const [ox, oy] of [[0, 0], [W, 0], [-W, 0], [0, H], [0, -H]]) {
        if (r.x + ox < -40 || r.x + ox > W + 40 || r.y + oy < -40 || r.y + oy > H + 40) continue;
        c.beginPath();
        r.pts.forEach((k, i) => { const a = r.rot + i / r.pts.length * Math.PI * 2; c[i ? 'lineTo' : 'moveTo'](r.x + ox + Math.cos(a) * r.r * k, r.y + oy + Math.sin(a) * r.r * k); });
        c.closePath(); c.stroke();
      }
      c.restore();
      paintDoor(c, door, { frame: '#ffffff', panel: '#1b2a5c', knob: '#ffcf6b', light: next, glow: '#ffffff', open: doorOpenness({ x: s.x - 6, y: s.y - 6, w: 12, h: 12 }, door, 110) });
      for (const q of parts) { c.globalAlpha = clamp(q.life * 2.5, 0, 1); c.fillStyle = q.col; c.fillRect(q.x - 1, q.y - 1, 2.4, 2.4); }
      c.globalAlpha = 1;
      if (s.dead <= 0 && (s.safe <= 0 || Math.floor(t * 12) % 2)) {
        c.save(); c.translate(s.x, s.y); c.rotate(s.a); c.strokeStyle = '#ffffff'; c.shadowColor = '#ffffff'; c.shadowBlur = 10;
        c.beginPath(); c.moveTo(11, 0); c.lineTo(-8, -7); c.lineTo(-4, 0); c.lineTo(-8, 7); c.closePath(); c.stroke(); c.restore();
      }
      c.font = '600 12px "IBM Plex Mono", monospace'; c.fillStyle = 'rgba(223,230,255,0.7)'; c.textAlign = 'left';
      c.fillText(`Tempo ${Math.round(Math.hypot(s.vx, s.vy))}`, 14, 24);
    }
  };
  return self;
}
