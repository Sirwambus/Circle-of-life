/* =====================================================================
   WELT – Flipper: ← linker, → rechter Flipper. Roll über alle Lichter, dann öffnet sich die Tür.
   Die Kugel darf nicht durch die Mitte fallen. Grafik: Neon-Spielautomat.
   ===================================================================== */
function makeFlipper(next, level = 0) {
  // Je Level: mehr Lichter, stärkeres Gefälle (schnellere Kugel), kürzere Flipper (ab Level 4 kann die Kugel durch die Mitte fallen),
  // weniger Kugeln; ab Level 6 erlöschen die Lichter, wenn eine Kugel verloren geht.
  const NL = [3, 4, 5, 5, 6, 6, 7, 7, 8, 8][level], GY = [300, 315, 330, 345, 360, 375, 390, 405, 420, 440][level];
  const FL = [60, 59, 58, 56, 54, 52, 51, 50, 49, 48][level], BALLS = [5, 5, 5, 4, 4, 4, 3, 3, 3, 3][level], RESET = level >= 6;
  const L = 180, Rt = 460, BR = 7, FRAD = 5, R = rng(303 + level * 19);
  const segs = [[L, 330, L, 90], [Rt, 330, Rt, 90], [L, 330, 263, 362], [Rt, 330, 377, 362]];
  for (let i = 0; i < 12; i++) { // Dachbogen
    const a0 = Math.PI + i / 12 * Math.PI, a1 = Math.PI + (i + 1) / 12 * Math.PI;
    segs.push([320 + Math.cos(a0) * 140, 90 + Math.sin(a0) * 70, 320 + Math.cos(a1) * 140, 90 + Math.sin(a1) * 70]);
  }
  const bumpers = [{ x: 270, y: 130, r: 17 }, { x: 370, y: 130, r: 17 }, { x: 320, y: 185, r: 17 }];
  if (level >= 3) bumpers.push({ x: 230, y: 230, r: 13 }, { x: 410, y: 230, r: 13 });
  const flips = [{ px: 262, py: 368, dir: 1, a: 0.5, w: 0, key: 'left' }, { px: 378, py: 368, dir: -1, a: 0.5, w: 0, key: 'right' }];
  const lights = [];
  while (lights.length < NL) {
    const x = L + 25 + R() * (Rt - L - 50), y = 60 + R() * 230;
    if (Math.hypot(x - 320, y - 90) > 0 && (y < 90 && Math.hypot((x - 320) / 140, (y - 90) / 70) > 0.8)) continue;
    if (lights.some(o => Math.hypot(o.x - x, o.y - y) < 40) || bumpers.some(b => Math.hypot(b.x - x, b.y - y) < b.r + 22)) continue;
    lights.push({ x, y, on: false, glow: 0 });
  }
  const fin = makeFinale(next);
  let ball, balls, wait, still = 0, t = 0, msg = '', msgT = 0, shake = 0;
  const tip = f => { const a = f.dir > 0 ? f.a : Math.PI - f.a; return { x: f.px + Math.cos(a) * FL, y: f.py + Math.sin(a) * FL }; };
  function newBall() { ball = { x: 420 - R() * 40, y: 70, vx: -40 - R() * 60, vy: 0 }; wait = 0.8; }
  function reset() { balls = BALLS; for (const o of lights) o.on = false; newBall(); }
  reset();
  const say = m => { msg = m; msgT = 1.5; };
  // Kugel gegen Kapsel (Strecke mit Radius), optional mit bewegter Oberfläche
  function hitSeg(x1, y1, x2, y2, rad, e, vsurf) {
    const dx = x2 - x1, dy = y2 - y1, k = clamp(((ball.x - x1) * dx + (ball.y - y1) * dy) / (dx * dx + dy * dy), 0, 1);
    const qx = x1 + dx * k, qy = y1 + dy * k, ddx = ball.x - qx, ddy = ball.y - qy, d = Math.hypot(ddx, ddy);
    if (d >= BR + rad || d === 0) return false;
    const nx = ddx / d, ny = ddy / d; ball.x = qx + nx * (BR + rad); ball.y = qy + ny * (BR + rad);
    const [sx, sy] = vsurf ? vsurf(qx, qy) : [0, 0];
    let rx = ball.vx - sx, ry = ball.vy - sy; const vn = rx * nx + ry * ny;
    if (vn < 0) { rx -= (1 + e) * vn * nx; ry -= (1 + e) * vn * ny; ball.vx = rx + sx; ball.vy = ry + sy; }
    return true;
  }
  const self = {
    done: false, door: () => fin.rect,
    test: () => ({ x: ball.x, y: ball.y, vx: ball.vx, vy: ball.vy, wait: wait > 0, balls, finale: fin.active, gy: GY,
      lights: lights.map(o => ({ x: o.x, y: o.y, on: o.on })), flips: flips.map(f => ({ px: f.px, py: f.py, a: f.a, dir: f.dir })) }), // für Testprogramme
    update(dt) {
      t += dt; msgT -= dt; shake = Math.max(0, shake - dt);
      for (const o of lights) o.glow = Math.max(0, o.glow - dt);
      if (fin.active) { if (fin.update(dt)) self.done = true; return; }
      for (const f of flips) { // Flipper drehen: hoch schnell, runter langsamer
        const target = keys[f.key] ? -0.45 : 0.5, na = keys[f.key] ? Math.max(target, f.a - 20 * dt) : Math.min(target, f.a + 11 * dt);
        if (pressed[f.key]) Klang.tone(220, 0.04);
        f.w = (na - f.a) / dt; f.a = na;
      }
      if (wait > 0) { wait -= dt; return; }
      const N = 8, h = dt / N;
      for (let n = 0; n < N; n++) {
        ball.vy += GY * h; ball.x += ball.vx * h; ball.y += ball.vy * h;
        for (const s of segs) hitSeg(s[0], s[1], s[2], s[3], 0, 0.55);
        for (const f of flips) {
          const tp = tip(f), wv = f.w * f.dir; // Winkelgeschwindigkeit in Bildschirm-Drehsinn
          hitSeg(f.px, f.py, tp.x, tp.y, FRAD, 0.35, (qx, qy) => [-wv * (qy - f.py), wv * (qx - f.px)]);
        }
        for (const b of bumpers) {
          const dx = ball.x - b.x, dy = ball.y - b.y, d = Math.hypot(dx, dy);
          if (d < b.r + BR && d > 0) {
            const nx = dx / d, ny = dy / d; ball.x = b.x + nx * (b.r + BR); ball.y = b.y + ny * (b.r + BR);
            const vn = ball.vx * nx + ball.vy * ny; if (vn < 0) { ball.vx -= 2 * vn * nx; ball.vy -= 2 * vn * ny; }
            const sp = Math.hypot(ball.vx, ball.vy), ns = Math.max(sp, 300); ball.vx = ball.vx / sp * ns + nx * 40; ball.vy = ball.vy / sp * ns + ny * 40;
            b.flash = 0.15; Klang.tone(500 + b.r * 10, 0.05);
          }
        }
        const sp = Math.hypot(ball.vx, ball.vy); if (sp > 800) { ball.vx *= 800 / sp; ball.vy *= 800 / sp; }
      }
      for (const b of bumpers) b.flash = Math.max(0, (b.flash || 0) - dt);
      // Kugel liegt fest (z. B. in einer Ecke): Tisch rütteln
      still = Math.hypot(ball.vx, ball.vy) < 12 && !flips.some(f => keys[f.key]) ? still + dt : 0;
      if (still > 2.5) { still = 0; ball.vy = -160; ball.vx = (ball.x < 320 ? 1 : -1) * 60; shake = 0.3; say('Rüttel!'); }
      for (const o of lights) if (!o.on && Math.hypot(ball.x - o.x, ball.y - o.y) < 13) {
        o.on = true; o.glow = 0.6; Klang.tone(660 + lights.filter(q => q.on).length * 70, 0.12);
        if (lights.every(q => q.on)) { say('Alle Lichter an!'); fin.start(); } else say('Licht!');
      }
      if (ball.y > H + 20) {
        balls--; died(); shake = 0.3;
        if (balls <= 0) { say('Keine Kugel mehr. Alles von vorn!'); reset(); }
        else { say(RESET ? 'Kugel verloren, die Lichter sind aus.' : 'Kugel verloren!'); if (RESET) for (const o of lights) o.on = false; newBall(); }
      }
    },
    draw(c) {
      c.fillStyle = '#07030f'; c.fillRect(0, 0, W, H);
      c.save(); if (shake > 0) c.translate((Math.random() - 0.5) * 6, 0);
      const bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#1a0b3a'); bg.addColorStop(1, '#2a0a2a');
      c.fillStyle = bg; c.beginPath(); c.moveTo(L, H); c.lineTo(L, 90); c.ellipse(320, 90, 140, 70, 0, Math.PI, 0); c.lineTo(Rt, H); c.fill();
      c.strokeStyle = 'rgba(255,60,200,0.12)'; c.lineWidth = 1;
      for (let y = 40; y < H; y += 24) { c.beginPath(); c.moveTo(L, y); c.lineTo(Rt, y); c.stroke(); }
      c.shadowBlur = 10; c.lineCap = 'round';
      c.strokeStyle = '#ff3ec8'; c.shadowColor = '#ff3ec8'; c.lineWidth = 3;
      for (const s of segs) { c.beginPath(); c.moveTo(s[0], s[1]); c.lineTo(s[2], s[3]); c.stroke(); }
      for (const o of lights) {
        c.shadowColor = o.on ? next : '#5a4a8a'; c.fillStyle = o.on ? next : '#2a2050'; c.strokeStyle = o.on ? '#fff' : '#6a5aa0'; c.lineWidth = 2;
        c.beginPath(); c.arc(o.x, o.y, 10 + o.glow * 8, 0, 7); c.fill(); c.stroke();
        if (!o.on) { c.fillStyle = '#6a5aa0'; c.beginPath(); c.moveTo(o.x, o.y - 5); c.lineTo(o.x + 4, o.y + 3); c.lineTo(o.x - 4, o.y + 3); c.fill(); }
      }
      for (const b of bumpers) {
        c.shadowColor = '#3ef0ff'; c.fillStyle = b.flash ? '#ffffff' : '#123a5a'; c.strokeStyle = '#3ef0ff'; c.lineWidth = 3;
        c.beginPath(); c.arc(b.x, b.y, b.r, 0, 7); c.fill(); c.stroke();
        c.fillStyle = '#3ef0ff'; c.beginPath(); c.arc(b.x, b.y, b.r * 0.35, 0, 7); c.fill();
      }
      for (const f of flips) {
        const tp = tip(f); c.strokeStyle = '#ffd23f'; c.shadowColor = '#ffd23f'; c.lineWidth = FRAD * 2 + 2;
        c.beginPath(); c.moveTo(f.px, f.py); c.lineTo(tp.x, tp.y); c.stroke();
        c.fillStyle = '#fff'; c.beginPath(); c.arc(f.px, f.py, 3, 0, 7); c.fill();
      }
      c.shadowBlur = 0;
      if (wait <= 0 || Math.floor(t * 8) % 2) {
        const g = c.createRadialGradient(ball.x - 2, ball.y - 2, 1, ball.x, ball.y, BR); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#8a8aa8');
        c.fillStyle = g; c.beginPath(); c.arc(ball.x, ball.y, BR, 0, 7); c.fill();
      }
      c.restore();
      label(c, `Lichter ${lights.filter(o => o.on).length} / ${NL}`, 16, 26, '#ffd8f4');
      label(c, 'Kugeln', 16, 50, '#ffd8f4'); for (let i = 0; i < balls; i++) { c.fillStyle = '#d8d8f0'; c.beginPath(); c.arc(80 + i * 16, 46, 5, 0, 7); c.fill(); }
      label(c, msgT > 0 ? msg : '← linker Flipper', 16, H - 14, '#ffd8f4');
      label(c, msgT > 0 ? '' : 'rechter Flipper →', W - 16, H - 14, '#ffd8f4', 'right');
      fin.draw(c, '#ff3ec8', '#1a0b3a');
    }
  };
  return self;
}
