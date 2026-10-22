/* =====================================================================
   WELT – Flattern: Ein-Knopf-Flug durch Säulen, Abendhimmel.
   ===================================================================== */
function makeFlattern(next, level = 0) {
  // Je Level: kleinere Lücke, mehr Säulen, schneller. In Level 3 wandern die Lücken auf und ab.
  const R = rng(11 + level), GAP = [128, 112, 102, 96, 92, 90, 88, 86, 84, 82][level], PW = 46, N = [8, 11, 14, 16, 18, 20, 22, 24, 26, 28][level], SPEED = [125, 138, 148, 154, 160, 164, 168, 172, 176, 180][level], SWAY = [0, 0, 34, 40, 46, 48, 50, 52, 54, 56][level];
  const pillars = Array.from({ length: N }, (_, i) => { const gy = i < 2 ? 200 : 125 + R() * 150; return { x: 420 + i * 190, gy, base: gy, ph: R() * 6 }; });
  const door = { x: 420 + N * 190 + 80, y: 166, w: 34, h: 64 };
  const GROUND = H - 30;
  const p = { x: 80, y: 190, w: 18, h: 14, vy: 0 };
  let started = false, cam = 0, t = 0, flap = 0, flash = 0;
  const rects = pl => [{ x: pl.x, y: -60, w: PW, h: pl.gy - GAP / 2 + 60 }, { x: pl.x, y: pl.gy + GAP / 2, w: PW, h: H }];
  function die() { died(); flash = 0.35; Object.assign(p, { x: 80, y: 190, vy: 0 }); started = false; cam = 0; }
  const self = {
    done: false,
    door: () => ({ ...door, x: door.x - cam }),
    update(dt) {
      t += dt; flash = Math.max(0, flash - dt); flap = Math.max(0, flap - dt);
      if (pressed.up || pressed.action) { started = true; p.vy = -270; flap = 0.18; }
      if (!started) { p.y = 190 + Math.sin(t * 3) * 6; return; }
      p.vy = Math.min(p.vy + 900 * dt, 420);
      p.y += p.vy * dt; p.x += SPEED * dt; cam = p.x - 140;
      for (const pl of pillars) pl.gy = clamp(pl.base + Math.sin(t * 1.4 + pl.ph) * SWAY, GAP / 2 + 20, GROUND - GAP / 2 - 10);
      const hb = { x: p.x + 2, y: p.y + 2, w: p.w - 4, h: p.h - 4 };
      if (p.y < -10 || p.y + p.h > GROUND) return die();
      for (const pl of pillars) for (const r of rects(pl)) if (overlap(hb, r)) return die();
      if (overlap(p, door)) self.done = true;
      else if (p.x > door.x + door.w + 30) die(); // Tür verfehlt
    },
    draw(c) {
      const sky = c.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#3e3170'); sky.addColorStop(0.55, '#d8708a'); sky.addColorStop(1, '#ffc78c');
      c.fillStyle = sky; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(255,226,170,0.85)'; c.beginPath(); c.arc(470 - cam * 0.04, 265, 70, 0, 7); c.fill();
      for (const [par, col, amp, base] of [[0.15, 'rgba(150,72,120,0.55)', 40, 270], [0.35, 'rgba(98,50,100,0.8)', 30, 305]]) {
        c.fillStyle = col; c.beginPath(); c.moveTo(0, H);
        for (let x = 0; x <= W; x += 10) { const wx = x + cam * par; c.lineTo(x, base - amp * Math.abs(Math.sin(wx * 0.006)) - 12 * Math.sin(wx * 0.021)); }
        c.lineTo(W, H); c.fill();
      }
      c.save(); c.translate(-cam, 0);
      for (const pl of pillars) {
        if (pl.x - cam > W + 10 || pl.x + PW - cam < -10) continue;
        const [top, bot] = rects(pl);
        c.fillStyle = '#3a2752'; c.fillRect(top.x, top.y, PW, top.h); c.fillRect(bot.x, bot.y, PW, bot.h);
        c.fillStyle = '#4f3a72'; c.fillRect(top.x + 6, top.y, 8, top.h); c.fillRect(bot.x + 6, bot.y, 8, bot.h);
        c.fillStyle = '#5d4685'; c.fillRect(top.x - 5, top.y + top.h - 14, PW + 10, 14); c.fillRect(bot.x - 5, bot.y, PW + 10, 14);
      }
      // Wolke unter der schwebenden Tür
      c.fillStyle = 'rgba(255,240,230,0.9)';
      for (const [ox, r] of [[-6, 14], [10, 18], [30, 15], [44, 11]]) { c.beginPath(); c.arc(door.x + ox, door.y + door.h + 8, r, 0, 7); c.fill(); }
      paintDoor(c, door, { frame: '#3a2752', panel: '#c86a7a', knob: '#ffe2aa', light: next, glow: '#ffe2aa', open: doorOpenness(p, door, 160) });
      // Vogel
      const cx = p.x + 9, cy = p.y + 7, tilt = started ? clamp(p.vy / 600, -0.5, 0.7) : 0;
      c.save(); c.translate(cx, cy); c.rotate(tilt);
      c.fillStyle = '#fff2dc'; c.beginPath(); c.ellipse(0, 0, 10, 8, 0, 0, 7); c.fill();
      c.fillStyle = '#f2c9b0'; c.beginPath(); c.moveTo(-3, 0); c.lineTo(-13, flap > 0 ? -10 : 4); c.lineTo(3, 2); c.fill();
      c.fillStyle = '#ff9d4d'; c.beginPath(); c.moveTo(8, -1); c.lineTo(15, 1); c.lineTo(8, 4); c.fill();
      c.fillStyle = '#2a1d3a'; c.beginPath(); c.arc(4, -3, 1.6, 0, 7); c.fill();
      c.restore(); c.restore();
      c.fillStyle = '#2a1d3a'; c.fillRect(0, GROUND, W, H - GROUND);
      c.strokeStyle = 'rgba(255,199,140,0.5)'; c.beginPath();
      for (let x = 0; x <= W; x += 8) c.lineTo(x, GROUND + 6 + Math.sin((x + cam) * 0.08 + t * 3) * 2); c.stroke();
      const passed = pillars.filter(pl => pl.x + PW < p.x).length;
      c.font = '600 12px "IBM Plex Mono", monospace'; c.fillStyle = 'rgba(255,240,230,0.85)'; c.textAlign = 'left';
      c.fillText(`Säulen ${passed}/${N}`, 14, 24);
      if (!started) { c.textAlign = 'center'; c.fillText('↑ oder Leertaste zum Flattern', W / 2, 120); c.textAlign = 'left'; }
      if (flash > 0) { c.fillStyle = `rgba(255,80,60,${flash})`; c.fillRect(0, 0, W, H); }
    }
  };
  return self;
}
