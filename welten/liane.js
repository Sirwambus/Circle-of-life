/* =====================================================================
   WELT – Liane: Halte die Leertaste, um dich an einen Ring zu hängen. Schwing und lass los.
   ===================================================================== */
function makeLiane(next, level = 0) {
  // Je Level: weiter auseinander liegende Ringe, unterschiedliche Höhen, weniger Inseln zum Ausruhen.
  const L = [
    { plats: [[-40, 300, 260], [900, 300, 110], [1440, 330, 220]], anchors: [[330, 130], [550, 120], [770, 130], [1120, 120], [1330, 130]], width: 1640 },
    { plats: [[-40, 300, 260], [1000, 320, 70], [1900, 340, 220]], anchors: [[340, 130], [580, 110], [820, 140], [1240, 120], [1480, 100], [1740, 120], [1840, 100]], width: 2100 },
    { plats: [[-40, 300, 260], [1820, 340, 220]], anchors: [[330, 140], [570, 110], [810, 150], [1050, 110], [1290, 150], [1530, 110], [1760, 100]], width: 2020 },
    { plats: [[-40, 300, 260], [2100, 340, 220]], anchors: [[330, 140], [575, 105], [815, 160], [1060, 100], [1305, 150], [1550, 95], [1790, 140], [2000, 100]], width: 2300 },
    { plats: [[-40, 300, 260], [2255, 362, 245]], anchors: [[330, 150], [565, 100], [800, 170], [1035, 95], [1270, 165], [1505, 90], [1740, 160], [1975, 95], [2200, 110]], width: 2490 },
    // Level 6–10: noch mehr Ringe, weitere Abstände, stärkere Höhenwechsel, schmalere Zielinsel
    { plats: [[-40, 300, 260], [2520, 360, 230]], anchors: [[330, 155], [565, 85], [805, 150], [1050, 95], [1285, 165], [1520, 95], [1755, 125], [1995, 90], [2230, 155], [2465, 90]], width: 2750 },
    { plats: [[-40, 300, 260], [2775, 370, 222]], anchors: [[330, 165], [570, 80], [805, 170], [1045, 95], [1290, 160], [1525, 125], [1765, 165], [2000, 80], [2240, 175], [2480, 90], [2720, 120]], width: 2997 },
    { plats: [[-40, 300, 260], [3055, 370, 214]], anchors: [[330, 165], [570, 90], [815, 170], [1060, 90], [1305, 170], [1545, 80], [1790, 175], [2030, 135], [2275, 175], [2515, 135], [2760, 170], [3000, 85]], width: 3269 },
    { plats: [[-40, 300, 260], [3320, 350, 206]], anchors: [[330, 165], [575, 85], [820, 175], [1065, 90], [1305, 125], [1550, 85], [1800, 170], [2045, 85], [2290, 130], [2535, 80], [2775, 160], [3025, 90], [3265, 120]], width: 3526 },
    { plats: [[-40, 300, 260], [3560, 360, 198]], anchors: [[330, 165], [580, 125], [825, 175], [1075, 90], [1320, 170], [1565, 130], [1805, 120], [2045, 85], [2290, 130], [2530, 80], [2775, 185], [3020, 80], [3265, 175], [3505, 120]], width: 3758 }
  ][level];
  const plats = L.plats.map(([x, y, w]) => ({ x, y, w, h: H - y + 40 }));
  const anchors = L.anchors.map(([x, y]) => ({ x, y }));
  const LEVELW = L.width, RANGE = 240;
  const door = { x: LEVELW - 80, y: plats[plats.length - 1].y - 50, w: 28, h: 50 };
  const p = { x: 120, y: 282, w: 14, h: 18, vx: 0, vy: 0, ground: false };
  let rope = null, safe = { x: 120, y: 282 }, cam = 0, t = 0, flash = 0;
  const flies = Array.from({ length: 24 }, () => ({ x: Math.random() * LEVELW, y: 60 + Math.random() * 260, ph: Math.random() * 6 }));
  function die() { died(); flash = 0.4; rope = null; Object.assign(p, { x: safe.x, y: safe.y, vx: 0, vy: 0 }); }
  const pc = () => ({ x: p.x + p.w / 2, y: p.y + 4 });
  const self = {
    done: false, p, anchors, plats, rope: () => rope, // für Testprogramme
    door: () => ({ ...door, x: door.x - cam }),
    update(dt) {
      t += dt; flash = Math.max(0, flash - dt);
      const ax = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
      if (keys.action && !rope) {
        const c0 = pc(); let best = null, bd = Infinity;
        const dir = Math.sign(p.vx || ax || 1); // Ringe in Bewegungsrichtung bevorzugen
        for (const a of anchors) { const d = Math.hypot(a.x - c0.x, a.y - c0.y), score = d - (a.x - c0.x) * dir * 0.5; if (a.y < c0.y - 20 && d < RANGE && score < bd) { bd = score; best = a; } }
        if (best) bd = Math.hypot(best.x - c0.x, best.y - c0.y);
        if (best) { rope = { a: best, len: bd }; p.ground = false; }
      }
      if (!keys.action) rope = null;
      if (pressed.up && p.ground) { p.vy = -430; p.ground = false; }
      p.vy = Math.min(p.vy + 1200 * dt, 700);
      if (rope) p.vx += ax * 380 * dt;
      else if (p.ground) p.vx = ax * 160;
      else p.vx = clamp(p.vx + ax * 220 * dt, -420, 420);
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (rope) {
        const c0 = pc(), dx = c0.x - rope.a.x, dy = c0.y - rope.a.y, d = Math.hypot(dx, dy);
        if (d > rope.len) {
          const nx = dx / d, ny = dy / d;
          p.x -= nx * (d - rope.len); p.y -= ny * (d - rope.len);
          const vr = p.vx * nx + p.vy * ny; if (vr > 0) { p.vx -= nx * vr; p.vy -= ny * vr; }
        }
      }
      p.ground = false;
      for (const s of plats) {
        if (!overlap(p, s)) continue;
        if (p.vy >= 0 && p.y + p.h - p.vy * dt <= s.y + 2) { p.y = s.y - p.h; p.vy = 0; p.ground = true; safe = { x: clamp(p.x, s.x + 10, s.x + s.w - 24), y: s.y - p.h }; }
        else { p.x = p.x + p.w / 2 < s.x + s.w / 2 ? s.x - p.w : s.x + s.w; p.vx = 0; } // zur näheren Seite hinaus
      }
      if (p.x < 0) { p.x = 0; p.vx = 0; }
      if (p.y > H + 40) return die();
      cam = clamp(p.x - W * 0.4, 0, LEVELW - W);
      if (overlap(p, door)) self.done = true;
    },
    draw(c) {
      const sky = c.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#2a1b3d'); sky.addColorStop(0.6, '#a8506a'); sky.addColorStop(1, '#ff9e5e');
      c.fillStyle = sky; c.fillRect(0, 0, W, H);
      for (const [par, col, base] of [[0.2, '#3b2a4a', 250], [0.45, '#1f3a2a', 280], [0.7, '#12261b', 320]]) {
        c.fillStyle = col; c.beginPath(); c.moveTo(0, H);
        for (let x = 0; x <= W; x += 8) { const wx = x + cam * par; c.lineTo(x, base - 40 * Math.abs(Math.sin(wx * 0.011)) - 25 * Math.abs(Math.sin(wx * 0.037))); }
        c.lineTo(W, H); c.fill();
      }
      c.save(); c.translate(-Math.round(cam), 0);
      c.strokeStyle = '#0d1f14'; c.lineWidth = 3;
      for (let x = 40; x < LEVELW; x += 90) { c.beginPath(); c.moveTo(x, 0); c.quadraticCurveTo(x + 10 + Math.sin(t + x) * 4, 50, x, 70 + (x % 4) * 18); c.stroke(); }
      c.fillStyle = '#0d1f14'; c.fillRect(0, 0, LEVELW, 18);
      for (const s of plats) {
        c.fillStyle = '#3a3f37'; c.beginPath(); c.roundRect(s.x, s.y, s.w, s.h, 10); c.fill();
        c.fillStyle = '#5c8f3a'; c.fillRect(s.x + 2, s.y, s.w - 4, 7);
      }
      for (const a of anchors) {
        c.strokeStyle = '#0d1f14'; c.lineWidth = 4; c.beginPath(); c.moveTo(a.x, 18); c.lineTo(a.x, a.y - 9); c.stroke();
        const near = Math.hypot(a.x - pc().x, a.y - pc().y) < RANGE && a.y < pc().y - 20;
        c.strokeStyle = near ? '#ffe08a' : '#c99a3a'; c.lineWidth = 3; c.beginPath(); c.arc(a.x, a.y, 8, 0, 7); c.stroke();
      }
      paintDoor(c, door, { frame: '#2a1a0e', panel: '#6b8f3a', knob: '#ffe08a', light: next, open: doorOpenness(p, door, 90) });
      if (rope) {
        const c0 = pc(); c.strokeStyle = '#8a5a2b'; c.lineWidth = 2.5;
        c.beginPath(); c.moveTo(rope.a.x, rope.a.y); c.quadraticCurveTo((rope.a.x + c0.x) / 2, (rope.a.y + c0.y) / 2 + 6, c0.x, c0.y); c.stroke();
      }
      const px = p.x + p.w / 2, py = p.y + p.h / 2;
      c.fillStyle = '#7a4a24'; c.beginPath(); c.arc(px, py, 9, 0, 7); c.fill();
      c.fillStyle = '#e8b98a'; c.beginPath(); c.arc(px + (p.vx >= 0 ? 2 : -2), py + 1, 5, 0, 7); c.fill();
      c.fillStyle = '#1a1a1a'; c.fillRect(px - 2, py - 1, 1.5, 2); c.fillRect(px + 2, py - 1, 1.5, 2);
      c.strokeStyle = '#7a4a24'; c.lineWidth = 2; c.beginPath(); c.moveTo(px - 7, py + 4); c.quadraticCurveTo(px - 16, py + 8, px - 12, py - 4); c.stroke();
      for (const f of flies) { c.fillStyle = `rgba(255,240,150,${0.4 + 0.6 * Math.abs(Math.sin(t * 2 + f.ph))})`; c.fillRect(f.x + Math.sin(t + f.ph) * 10, f.y + Math.cos(t * 0.7 + f.ph) * 8, 2, 2); }
      c.restore();
      label(c, 'Leertaste / A halten: am Ring festhalten · ↑ springen', 14, 40, '#ffe8d0');
      flashOverlay(c, flash);
    }
  };
  return self;
}
