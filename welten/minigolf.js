/* =====================================================================
   WELT – Minigolf: Zielen, Kraft aufladen, loslassen. Der Ball muss in die Tür rollen.
   ===================================================================== */
function makeMinigolf(next, level = 0) {
  const B = 16;
  // Bahnen: Innenwände, Teiche, Tür, Start, Par und bewegliche Schranken (y pendelt zwischen y0 und y1)
  const COURSE = [
    { walls: [{ x: 196, y: B, w: 18, h: 244 }, { x: 420, y: 140, w: 18, h: H - 140 - B }, { x: 500, y: 200, w: 70, h: 16 }],
      waters: [{ x: 250, y: 180, w: 120, h: 70 }], door: { x: 560, y: 300, w: 36, h: 62 }, start: { x: 100, y: 330 }, par: 4, movers: [] },
    { walls: [{ x: 150, y: B, w: 18, h: 280 }, { x: 300, y: 104, w: 18, h: 280 }, { x: 450, y: B, w: 18, h: 280 }, { x: 500, y: 180, w: 90, h: 16 }],
      waters: [{ x: 195, y: 150, w: 80, h: 80 }, { x: 330, y: 250, w: 70, h: 50 }], door: { x: 578, y: 30, w: 36, h: 62 }, start: { x: 80, y: 340 }, par: 5, movers: [] },
    { walls: [{ x: B, y: 130, w: 420, h: 18 }, { x: 200, y: 262, w: W - 200 - B, h: 18 }],
      waters: [{ x: 280, y: 170, w: 90, h: 70 }, { x: 60, y: 300, w: 70, h: 60 }], door: { x: 580, y: 314, w: 36, h: 62 }, start: { x: 70, y: 70 }, par: 6,
      movers: [{ x: 420, y: 280, w: 16, h: 58, y0: 280, y1: 326, sp: 1.6 }, { x: 500, y: 326, w: 16, h: 58, y0: 280, y1: 326, sp: 2.1 }] },
    { walls: [{ x: 150, y: B, w: 18, h: 300 }, { x: 300, y: 84, w: 18, h: 300 }, { x: 450, y: B, w: 18, h: 300 }],
      waters: [{ x: 40, y: 130, w: 80, h: 60 }, { x: 480, y: 250, w: 100, h: 50 }], door: { x: 578, y: 30, w: 36, h: 62 }, start: { x: 80, y: 60 }, par: 6,
      movers: [{ x: 175, y: 200, w: 60, h: 16, x0: 175, x1: 235, sp: 1.4 }, { x: 325, y: 150, w: 60, h: 16, x0: 325, x1: 385, sp: 1.9 }] },
    { walls: [{ x: 120, y: B, w: 18, h: 320 }, { x: 240, y: 64, w: 18, h: 320 }, { x: 360, y: B, w: 18, h: 320 }, { x: 480, y: 64, w: 18, h: 320 }],
      waters: [{ x: 150, y: 150, w: 60, h: 60 }, { x: 270, y: 250, w: 60, h: 60 }, { x: 390, y: 120, w: 60, h: 60 }, { x: 525, y: 150, w: 70, h: 50 }],
      door: { x: 580, y: 314, w: 36, h: 62 }, start: { x: 60, y: 60 }, par: 7,
      movers: [{ x: 240, y: B, w: 18, h: 24, y0: B, y1: 40, sp: 1.5 }, { x: 360, y: 336, w: 18, h: 24, y0: 336, y1: 360, sp: 1.8 }] },
    // ab Level 6: Teichslalom, Querbahnen, bewachte Durchgänge, Spirale
    { walls: [{ x: 470, y: 220, w: 18, h: H - 220 - B }, { x: 470, y: 220, w: 100, h: 18 }, { x: 60, y: 90, w: 26, h: 26 }, { x: 240, y: 300, w: 26, h: 26 }, { x: 400, y: 60, w: 26, h: 26 }],
      waters: [{ x: 130, y: 150, w: 90, h: H - 150 - B }, { x: 270, y: B, w: 90, h: 230 }, { x: 500, y: 90, w: 70, h: 60 }, { x: 380, y: 290, w: 70, h: 60 }],
      door: { x: 570, y: 316, w: 36, h: 62 }, start: { x: 60, y: 340 }, par: 5,
      movers: [{ x: 570, y: 220, w: 27, h: 18, x0: 570, x1: 597, sp: 1.5 }] },
    { walls: [{ x: B, y: 96, w: 500, h: 18 }, { x: 124, y: 192, w: W - 124 - B, h: 18 }, { x: B, y: 288, w: 500, h: 18 }],
      waters: [{ x: 240, y: 114, w: 110, h: 40 }, { x: 330, y: 248, w: 110, h: 40 }, { x: 200, y: 306, w: 100, h: 38 }],
      door: { x: 30, y: 314, w: 36, h: 62 }, start: { x: 60, y: 56 }, par: 6,
      movers: [{ x: 516, y: 96, w: 54, h: 18, x0: 516, x1: 570, sp: 1.7 }, { x: B, y: 192, w: 54, h: 18, x0: B, x1: 70, sp: 2.0 }] },
    { walls: [{ x: 140, y: B, w: 18, h: 290 }, { x: 290, y: 94, w: 18, h: 290 }, { x: 440, y: B, w: 18, h: 290 }],
      waters: [{ x: 40, y: 170, w: 70, h: 50 }, { x: 175, y: 150, w: 95, h: 70 }, { x: 325, y: 240, w: 95, h: 70 }, { x: 470, y: 150, w: 80, h: 60 }],
      door: { x: 578, y: 30, w: 36, h: 62 }, start: { x: 75, y: 60 }, par: 7,
      movers: [{ x: 140, y: 306, w: 18, h: 36, y0: 306, y1: 348, sp: 1.6 }, { x: 290, y: B, w: 18, h: 36, y0: B, y1: 58, sp: 1.9 }, { x: 440, y: 306, w: 18, h: 36, y0: 306, y1: 348, sp: 2.2 }] },
    { walls: [{ x: 72, y: 72, w: 496, h: 16 }, { x: 72, y: 312, w: 496, h: 16 }, { x: 72, y: 150, w: 16, h: 178 }, { x: 552, y: 72, w: 16, h: 256 },
      { x: 144, y: 144, w: 352, h: 16 }, { x: 144, y: 240, w: 352, h: 16 }, { x: 144, y: 144, w: 16, h: 112 }, { x: 480, y: 144, w: 16, h: 40 }],
      waters: [{ x: 20, y: 330, w: 44, h: 50 }, { x: 280, y: 88, w: 60, h: 28 }, { x: 580, y: 170, w: 40, h: 60 }],
      door: { x: 200, y: 169, w: 36, h: 62 }, start: { x: 320, y: 350 }, par: 7,
      movers: [{ x: 496, y: 120, w: 28, h: 16, x0: 496, x1: 524, sp: 1.5 }, { x: 340, y: 160, w: 16, h: 40, y0: 160, y1: 200, sp: 1.3 }] },
    { walls: [{ x: 110, y: B, w: 18, h: 308 }, { x: 230, y: 76, w: 18, h: 308 }, { x: 350, y: B, w: 18, h: 308 }, { x: 470, y: 76, w: 18, h: 308 }],
      waters: [{ x: B, y: 160, w: 50, h: 60 }, { x: 150, y: 220, w: 60, h: 60 }, { x: 290, y: 120, w: 60, h: 60 }, { x: 368, y: 230, w: 55, h: 60 }, { x: 520, y: 130, w: 90, h: 50 }],
      door: { x: 580, y: 314, w: 36, h: 62 }, start: { x: 60, y: 60 }, par: 8,
      movers: [{ x: 110, y: 324, w: 18, h: 26, y0: 324, y1: 358, sp: 1.5 }, { x: 230, y: B, w: 18, h: 26, y0: B, y1: 50, sp: 1.8 },
        { x: 350, y: 324, w: 18, h: 26, y0: 324, y1: 358, sp: 2.1 }, { x: 470, y: B, w: 18, h: 26, y0: B, y1: 50, sp: 2.4 }] }
  ][level];
  const walls = [
    { x: 0, y: 0, w: W, h: B }, { x: 0, y: H - B, w: W, h: B }, { x: 0, y: 0, w: B, h: H }, { x: W - B, y: 0, w: B, h: H },
    ...COURSE.walls, ...COURSE.movers
  ];
  const waters = COURSE.waters, door = COURSE.door, movers = COURSE.movers;
  let water = waters[0];
  const ball = { x: COURSE.start.x, y: COURSE.start.y, vx: 0, vy: 0, r: 7 };
  let aim = -Math.PI / 2, power = 0, pdir = 1, charging = false, strokes = 0, rest = { ...COURSE.start }, t = 0, splash = 0;
  const moving = () => Math.hypot(ball.vx, ball.vy) > 4;
  const self = {
    done: false, door: () => door,
    test: { ball, shoot: (a, pw) => { const v = 60 + pw * 520; ball.vx = Math.cos(a) * v; ball.vy = Math.sin(a) * v; } }, // für Testprogramme
    update(dt) {
      t += dt; splash = Math.max(0, splash - dt);
      for (const m of movers) { const k = 0.5 + 0.5 * Math.sin(t * m.sp); if (m.x0 !== undefined) m.x = m.x0 + (m.x1 - m.x0) * k; else m.y = m.y0 + (m.y1 - m.y0) * k; }
      if (!moving()) {
        ball.vx = ball.vy = 0; rest = { x: ball.x, y: ball.y };
        aim += ((keys.right ? 1 : 0) - (keys.left ? 1 : 0)) * 2.2 * dt;
        if (keys.action || keys.up) { charging = true; power += pdir * 1.1 * dt; if (power > 1) { power = 1; pdir = -1; } if (power < 0) { power = 0; pdir = 1; } }
        else if (charging) { charging = false; const v = 60 + power * 520; ball.vx = Math.cos(aim) * v; ball.vy = Math.sin(aim) * v; strokes++; power = 0; pdir = 1; }
        return;
      }
      const N = 4;
      for (let s = 0; s < N; s++) {
        ball.x += ball.vx * dt / N; ball.y += ball.vy * dt / N;
        for (const w of walls) {
          const h = circleRect(ball.x, ball.y, ball.r, w);
          if (!h) continue;
          ball.x += h.nx * h.depth; ball.y += h.ny * h.depth;
          const dot = ball.vx * h.nx + ball.vy * h.ny;
          if (dot < 0) { ball.vx -= 1.85 * dot * h.nx; ball.vy -= 1.85 * dot * h.ny; }
        }
      }
      const sp = Math.hypot(ball.vx, ball.vy), ns = Math.max(0, sp - (sp * 0.9 + 25) * dt);
      ball.vx *= ns / sp; ball.vy *= ns / sp;
      const wet = waters.find(w => ball.x > w.x && ball.x < w.x + w.w && ball.y > w.y && ball.y < w.y + w.h);
      if (wet) { water = wet;
        strokes++; splash = 0.6; Object.assign(ball, { x: rest.x, y: rest.y, vx: 0, vy: 0 });
      }
      if (circleRect(ball.x, ball.y, ball.r - 2, door)) self.done = true;
    },
    draw(c) {
      c.fillStyle = '#3f9f45'; c.fillRect(0, 0, W, H);
      c.fillStyle = '#47ab4d'; for (let x = 0; x < W; x += 40) c.fillRect(x, 0, 20, H);
      for (const water of waters) {
      c.fillStyle = '#3f9be0'; c.beginPath(); c.roundRect(water.x, water.y, water.w, water.h, 26); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.4)'; c.lineWidth = 2;
      for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(water.x + water.w / 2 - 22 + i * 22, water.y + water.h / 2, 6 + ((t * 10 + i * 7) % 14), 0, 7); c.stroke(); }
      }
      for (const w of walls) {
        if (movers.includes(w)) { c.fillStyle = '#d23c3c'; c.fillRect(w.x, w.y, w.w, w.h); c.fillStyle = '#fff'; if (w.w > w.h) for (let k = 6; k < w.w; k += 16) c.fillRect(w.x + k, w.y, 6, w.h); else for (let k = 6; k < w.h; k += 16) c.fillRect(w.x, w.y + k, w.w, 6); continue; }
        c.fillStyle = '#6b4220'; c.fillRect(w.x, w.y, w.w, w.h);
        c.fillStyle = '#9a6332'; c.fillRect(w.x + 2, w.y + 2, w.w - 4, Math.max(2, w.h - 6));
      }
      paintDoor(c, door, { frame: '#6b4220', panel: '#e9e1c8', knob: '#d4a017', light: next, open: doorOpenness({ x: ball.x - 7, y: ball.y - 7, w: 14, h: 14 }, door, 100) });
      if (!moving()) {
        c.strokeStyle = 'rgba(255,255,255,0.85)'; c.setLineDash([4, 6]); c.lineWidth = 2;
        const len = 40 + power * 90;
        c.beginPath(); c.moveTo(ball.x, ball.y); c.lineTo(ball.x + Math.cos(aim) * len, ball.y + Math.sin(aim) * len); c.stroke(); c.setLineDash([]);
        c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(24, H - 44, 120, 12);
        c.fillStyle = power > 0.8 ? '#ff6b3d' : '#ffe066'; c.fillRect(24, H - 44, 120 * power, 12);
        label(c, 'Kraft', 150, H - 34, '#fff');
      }
      c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(ball.x + 2, ball.y + 3, 7, 5, 0, 0, 7); c.fill();
      c.fillStyle = '#ffffff'; c.beginPath(); c.arc(ball.x, ball.y, ball.r, 0, 7); c.fill();
      c.fillStyle = '#dcdcdc'; c.beginPath(); c.arc(ball.x + 2, ball.y + 2, 3, 0, 7); c.fill();
      label(c, `Schläge ${strokes}   ·   Par ${COURSE.par}`, W - 26, 36, '#fff', 'right');
      if (splash > 0) label(c, 'Platsch! +1 Schlag', water.x + water.w / 2, water.y - 10, '#fff', 'center');
    }
  };
  return self;
}
