/* =====================================================================
   WELT – Höhlenflug: Ein Glühwürmchen fliegt durch eine dunkle Höhle. ↑ halten = steigen,
   loslassen = sinken. Leuchtpilze merken sich den Weg, am Ende wartet die Tür.
   ===================================================================== */
function makeHoehlenflug(next, level = 0) {
  // Je Level: schneller, enger, länger, steilere Windungen; ab Level 3 Tropfsteine, die in den Gang ragen.
  const SPEED = [110, 120, 130, 138, 146, 154, 162, 170, 178, 186][level], GAP = [170, 155, 142, 132, 124, 116, 110, 104, 99, 95][level];
  const LEN = [1400, 1700, 2000, 2300, 2500, 2700, 2900, 3100, 3300, 3500][level], DY = [50, 70, 85, 95, 105, 115, 120, 125, 130, 135][level];
  const SPIKES = [0, 0, 0, 1, 1.5, 2, 2.5, 3, 3, 3.5][level], NARROW = [0, 0, 0, 0, 0.1, 0.12, 0.14, 0.16, 0.18, 0.2][level];
  const G = 460, THR = 1000, SX = 140, SEG = 220, CP = 900, FR = 6, R = rng(211 + level * 17);
  const pts = [200, 200]; while (pts.length * SEG < LEN + 600) pts.push(clamp(pts[pts.length - 1] + (R() * 2 - 1) * DY, 70 + GAP / 2, 330 - GAP / 2));
  const wid = pts.map((_, i) => i < 2 ? 1 : 1 - NARROW * R());
  const spikes = [];
  for (let x = 500; x < LEN - 200; x += 1000 / Math.max(SPIKES, 0.01)) if (SPIKES) { const sx = x + R() * 200; if (Math.abs((sx - SX) % CP) > 80 && Math.abs((sx - SX) % CP) < CP - 40) spikes.push({ x: sx, top: R() < 0.5, h: GAP * (0.28 + R() * 0.1) }); }
  const door = { x: LEN + 160, y: 168, w: 30, h: 64 };
  const lerp = (arr, x) => { const i = clamp(x / SEG, 0, arr.length - 1.001), a = Math.floor(i), k = (1 - Math.cos((i - a) * Math.PI)) / 2; return arr[a] + (arr[a + 1] - arr[a]) * k; };
  const mid = x => { const e = clamp((x - LEN) / 200, 0, 1); return lerp(pts, x) * (1 - e) + 200 * e; };
  const half = x => { const e = clamp((x - LEN) / 200, 0, 1); return (GAP * lerp(wid, x) * (1 - e) + 150 * e) / 2; };
  const spikeAt = (x, top) => { let d = 0; for (const s of spikes) if (s.top === top && Math.abs(x - s.x) < 22) d = Math.max(d, s.h * (1 - Math.abs(x - s.x) / 22)); return d; };
  const ceil = x => mid(x) - half(x) + spikeAt(x, true), floor = x => mid(x) + half(x) - spikeAt(x, false);
  const dots = Array.from({ length: 60 }, () => ({ x: R() * W, y: R() * H, p: R() * 6 }));
  let cam, y, vy, wait, cp = 0, dead = 0, t = 0, trail = [], sparks = [], msg = '', msgT = 0;
  function spawn() { cam = cp * CP; y = mid(cam + SX); vy = 0; trail = []; wait = true; }
  spawn();
  const self = {
    done: false, door: () => ({ x: door.x - cam, y: door.y, w: door.w, h: door.h }),
    test: () => ({ x: cam + SX, y, vy, dead: dead > 0, wait, speed: SPEED, mid, ceil, floor, door: { ...door } }), // für Testprogramme
    update(dt) {
      t += dt; msgT -= dt;
      for (const s of sparks) { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 120 * dt; s.life -= dt; }
      sparks = sparks.filter(s => s.life > 0);
      if (dead > 0) { dead -= dt; if (dead <= 0) { died(); spawn(); } return; }
      if (wait) { if (pressed.up || pressed.action) wait = false; else return; }
      vy = clamp(vy + (G - (keys.up ? THR : 0)) * dt, -230, 230);
      y += vy * dt; cam += SPEED * dt;
      const wx = cam + SX;
      trail.push({ x: wx, y }); if (trail.length > 24) trail.shift();
      if (Math.floor(wx / CP) > cp && wx < LEN) { cp = Math.floor(wx / CP); msg = 'Leuchtpilz erreicht'; msgT = 1.2; Klang.tone(880, 0.12); }
      if (wx + FR >= door.x) {
        if (y > door.y && y < door.y + door.h) { self.done = true; return; }
      }
      let hit = wx + FR >= door.x;
      for (const dx of [-FR, 0, FR]) if (y - FR < ceil(wx + dx) || y + FR > floor(wx + dx)) hit = true;
      if (hit) {
        dead = 1; msg = 'Autsch! Zurück zum letzten Leuchtpilz.'; msgT = 1.5; Klang.tone(140, 0.25);
        for (let i = 0; i < 20; i++) { const a = Math.random() * 7, v = 30 + Math.random() * 90; sparks.push({ x: SX, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.9 }); }
      }
    },
    draw(c) {
      c.fillStyle = '#0b0614'; c.fillRect(0, 0, W, H);
      for (const d of dots) { c.fillStyle = `rgba(150,110,255,${0.15 + 0.15 * Math.sin(t * 1.5 + d.p)})`; const px = ((d.x - cam * 0.3) % W + W) % W; c.fillRect(px, d.y, 1.5, 1.5); }
      // Felsen
      const rock = (fn, top) => {
        c.beginPath(); c.moveTo(0, top ? 0 : H);
        for (let sx = 0; sx <= W; sx += 6) c.lineTo(sx, fn(cam + sx));
        c.lineTo(W, top ? 0 : H); c.closePath();
        c.fillStyle = '#1d1230'; c.fill();
        c.beginPath(); for (let sx = 0; sx <= W; sx += 6) c.lineTo(sx, fn(cam + sx));
        c.strokeStyle = '#3ff0c8'; c.lineWidth = 2; c.shadowColor = '#3ff0c8'; c.shadowBlur = 8; c.stroke(); c.shadowBlur = 0;
      };
      rock(ceil, true); rock(floor, false);
      for (let k = Math.floor(cam / 37); k * 37 < cam + W; k++) { // Kristalle im Fels
        const sx = k * 37 - cam, top = k % 2 === 0, d = 18 + (k * 53 % 70), yy = top ? ceil(k * 37) - d : floor(k * 37) + d;
        c.fillStyle = k % 3 ? 'rgba(180,120,255,0.35)' : 'rgba(63,240,200,0.3)';
        c.beginPath(); c.moveTo(sx, yy - 6); c.lineTo(sx + 3, yy); c.lineTo(sx, yy + 6); c.lineTo(sx - 3, yy); c.fill();
      }
      // Leuchtpilze (Zwischenstände)
      for (let k = 1; k * CP < LEN; k++) {
        const sx = k * CP - cam; if (sx < -20 || sx > W + 20) continue;
        const fy = floor(k * CP); c.fillStyle = k <= cp ? next : '#7a5aa8';
        c.fillRect(sx - 2, fy - 10, 4, 10); c.beginPath(); c.arc(sx, fy - 10, 8, Math.PI, 0); c.fill();
      }
      // Endkammer mit Tür
      const dsx = door.x - cam;
      if (dsx < W + 40) {
        c.fillStyle = '#1d1230'; c.fillRect(dsx, 0, W, H);
        paintDoor(c, { x: dsx, y: door.y, w: door.w, h: door.h }, { frame: '#3ff0c8', panel: '#3a2460', knob: next, light: next, glow: next, open: clamp(1 - (dsx - SX) / 160, 0, 1) });
      }
      // Glühwürmchen
      c.save(); c.globalCompositeOperation = 'lighter';
      const lg = c.createRadialGradient(SX, y, 2, SX, y, 70); lg.addColorStop(0, 'rgba(255,230,120,0.35)'); lg.addColorStop(1, 'rgba(255,230,120,0)');
      c.fillStyle = lg; c.fillRect(SX - 70, y - 70, 140, 140);
      for (const [i, p] of trail.entries()) { c.fillStyle = `rgba(255,220,100,${i / trail.length * 0.4})`; c.fillRect(p.x - cam - 1, p.y - 1, 2, 2); }
      c.restore();
      if (dead <= 0) {
        c.fillStyle = 'rgba(220,240,255,0.6)'; const fl = Math.sin(t * 40) * 3;
        c.beginPath(); c.ellipse(SX - 2, y - 5, 5, 2.5 + fl * 0.3, -0.5, 0, 7); c.ellipse(SX + 2, y - 5, 5, 2.5 - fl * 0.3, 0.5, 0, 7); c.fill();
        c.fillStyle = '#ffe066'; c.beginPath(); c.arc(SX, y, FR - 1, 0, 7); c.fill();
      }
      for (const s of sparks) { c.fillStyle = `rgba(255,220,100,${s.life})`; c.fillRect(s.x, s.y, 2, 2); }
      label(c, `${Math.round(clamp((cam + SX) / door.x, 0, 1) * 100)} % der Höhle`, 16, 24, '#d8c8ff');
      label(c, msgT > 0 ? msg : wait ? '↑ drücken, dann geht der Flug los' : '↑ halten: steigen · loslassen: sinken', W / 2, H - 12, '#d8c8ff', 'center');
    }
  };
  return self;
}
