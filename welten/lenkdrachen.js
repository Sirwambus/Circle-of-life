/* =====================================================================
   WELT – Lenkdrachen: Der Drachen fliegt immer dorthin, wohin seine Nase zeigt. ← → drehen ihn,
   ↑ zieht an der Leine (schneller). Flieg durch alle Ringe, dann durch die Tür im Himmel.
   ===================================================================== */
function makeLenkdrachen(next, level = 0) {
  // Je Level: mehr und kleinere Ringe, schnellerer Drachen; ab Level 3 Böen, ab Level 5 Vögel, ab Level 7 Ringe am Rand des Windfensters.
  const NR = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13][level], RR = [34, 31, 28, 26, 24, 22, 21, 20, 19, 18][level], V0 = [120, 130, 140, 150, 160, 168, 176, 184, 192, 200][level];
  const GUST = [0, 0, 0, 20, 30, 40, 48, 54, 60, 65][level], NBIRD = [0, 0, 0, 0, 0, 1, 2, 2, 3, 3][level], EDGE = [0.6, 0.62, 0.65, 0.68, 0.7, 0.72, 0.8, 0.85, 0.88, 0.9][level];
  const AX = 320, AY = 384, LR = 330, GROUND = 352, TURN = 2.8, R = rng(601 + level * 31);
  const inWin = (x, y) => Math.hypot(x - AX, y - AY) < LR * EDGE && y < GROUND - 50 && y > 40;
  const rings = [];
  let px = AX, py = 200;
  while (rings.length < NR) {
    const x = 70 + R() * 500, y = 60 + R() * 220, d = Math.hypot(x - px, y - py);
    if (!inWin(x, y) || d < 120 || d > 300 || rings.some(o => Math.hypot(o.x - x, o.y - y) < 70)) continue;
    rings.push({ x, y, ok: false }); px = x; py = y;
  }
  let door; do { door = { x: 120 + R() * 370, y: 70 + R() * 120, w: 36, h: 56 }; } while (Math.hypot(door.x - px, door.y - py) < 150 || Math.hypot(door.x + 18 - AX, door.y + 28 - AY) > LR * 0.85);
  const birds = Array.from({ length: NBIRD }, (_, i) => ({ y: 90 + i * 70 + R() * 30, sp: (50 + R() * 30) * (i % 2 ? -1 : 1), x: R() * W, ph: R() * 6 }));
  const clouds = Array.from({ length: 6 }, () => ({ x: R() * W, y: 30 + R() * 160, s: 20 + R() * 30 }));
  let k, idx, state, timer, t = 0, gust = 0, msg = '', msgT = 0, tail = [];
  function spawn() { k = { x: AX, y: AY - LR * 0.55, a: -Math.PI / 2 }; state = 'ready'; tail = []; }
  function reset() { idx = 0; for (const o of rings) o.ok = false; spawn(); }
  reset();
  const crash = m => { state = 'crash'; timer = 1.2; msg = m; msgT = 1.4; Klang.tone(130, 0.3); };
  const self = {
    done: false, door: () => door,
    test: () => ({ x: k.x, y: k.y, a: k.a, state, idx, gust, v0: V0, rings: rings.map(o => ({ x: o.x, y: o.y })), rr: RR, door: { ...door }, open: idx >= NR, ground: GROUND, ax: AX, ay: AY, lr: LR,
      birds: birds.map(b => ({ x: b.x, y: b.y, sp: b.sp })) }), // für Testprogramme
    update(dt) {
      t += dt; msgT -= dt;
      for (const b of birds) { b.x += b.sp * dt; if (b.x < -30) b.x = W + 30; if (b.x > W + 30) b.x = -30; }
      if (state === 'crash') { timer -= dt; if (timer <= 0) { died(); spawn(); } return; }
      const inp = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
      if (state === 'ready') { if (inp || pressed.up || pressed.action) state = 'fly'; else return; }
      k.a += inp * TURN * dt;
      gust = GUST * (Math.sin(t * 0.8) * 0.7 + Math.sin(t * 2.1 + 1) * 0.3);
      // Tempo: in der Mitte des Windfensters stark, am Rand schwach
      const r = Math.hypot(k.x - AX, k.y - AY) / LR, v = V0 * (1.05 - 0.6 * r * r) * (keys.up ? 1.35 : 1);
      k.x += (Math.cos(k.a) * v + gust) * dt; k.y += Math.sin(k.a) * v * dt;
      const d = Math.hypot(k.x - AX, k.y - AY);
      if (d > LR) { k.x = AX + (k.x - AX) / d * LR; k.y = AY + (k.y - AY) / d * LR; } // Leine straff
      if (k.y > AY - 10) k.y = AY - 10;
      tail.push({ x: k.x, y: k.y }); if (tail.length > 14) tail.shift();
      if (k.y > GROUND - 8) { crash('Bruchlandung im Gras!'); return; }
      for (const b of birds) if (Math.hypot(b.x - k.x, b.y - k.y) < 16) { crash('Zusammenstoß mit einem Vogel!'); return; }
      const o = rings[idx];
      if (o && Math.hypot(o.x - k.x, o.y - k.y) < RR) { o.ok = true; idx++; Klang.tone(620 + idx * 40, 0.12); msg = idx >= NR ? 'Alle Ringe! Jetzt durch die Tür.' : 'Ring!'; msgT = 1.2; }
      if (idx >= NR && k.x > door.x && k.x < door.x + door.w && k.y > door.y && k.y < door.y + door.h) self.done = true;
    },
    draw(c) {
      const sky = c.createLinearGradient(0, 0, 0, GROUND); sky.addColorStop(0, '#5ec8f2'); sky.addColorStop(1, '#d8f4ff');
      c.fillStyle = sky; c.fillRect(0, 0, W, GROUND);
      c.fillStyle = 'rgba(255,255,255,0.85)';
      for (const cl of clouds) { const x = (cl.x + t * 8) % (W + 80) - 40; c.beginPath(); c.arc(x, cl.y, cl.s, 0, 7); c.arc(x + cl.s, cl.y + 5, cl.s * 0.8, 0, 7); c.arc(x - cl.s, cl.y + 6, cl.s * 0.7, 0, 7); c.fill(); }
      // Windfenster andeuten
      c.strokeStyle = 'rgba(255,255,255,0.5)'; c.setLineDash([6, 8]); c.lineWidth = 1.5; c.beginPath(); c.arc(AX, AY, LR * EDGE + RR, Math.PI, 0); c.stroke(); c.setLineDash([]);
      c.fillStyle = '#6cc04a'; c.fillRect(0, GROUND, W, H - GROUND);
      c.fillStyle = '#58a83c'; for (let x = 0; x < W; x += 14) { c.beginPath(); c.moveTo(x, GROUND); c.lineTo(x + 4, GROUND - 7); c.lineTo(x + 8, GROUND); c.fill(); }
      // Ringe
      rings.forEach((o, i) => {
        if (o.ok) return;
        const act = i === idx;
        c.strokeStyle = act ? '#ff5aa8' : 'rgba(255,90,168,0.35)'; c.lineWidth = act ? 5 : 3;
        c.beginPath(); c.arc(o.x, o.y, RR, 0, 7); c.stroke();
        if (act) { c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 1.5; c.beginPath(); c.arc(o.x, o.y, RR + 4 + Math.sin(t * 6) * 2, 0, 7); c.stroke(); }
        label(c, String(i + 1), o.x, o.y + 4, act ? '#ff5aa8' : 'rgba(255,90,168,0.5)', 'center');
      });
      const open = idx >= NR;
      paintDoor(c, door, { frame: open ? '#ffffff' : 'rgba(255,255,255,0.4)', panel: open ? '#ff5aa8' : 'rgba(255,170,210,0.4)', knob: '#fff', light: open ? next : 'rgba(255,255,255,0.2)', glow: open ? next : null, open: open ? 0.5 + 0.2 * Math.sin(t * 3) : 0 });
      for (const b of birds) { c.strokeStyle = '#2a2a3a'; c.lineWidth = 2; const f = Math.sin(t * 10 + b.ph) * 5; c.beginPath(); c.moveTo(b.x - 9, b.y - f); c.quadraticCurveTo(b.x - 4, b.y - 4, b.x, b.y); c.quadraticCurveTo(b.x + 4, b.y - 4, b.x + 9, b.y - f); c.stroke(); }
      // Leine, Figur, Drachen
      c.strokeStyle = 'rgba(40,40,60,0.6)'; c.lineWidth = 1; c.beginPath(); c.moveTo(AX, AY - 22); c.quadraticCurveTo((AX + k.x) / 2, (AY + k.y) / 2 + 20, k.x, k.y); c.stroke();
      c.fillStyle = '#2a2a3a'; c.beginPath(); c.arc(AX, AY - 30, 6, 0, 7); c.fill(); c.fillRect(AX - 4, AY - 24, 8, 16);
      c.strokeStyle = '#ffd23f'; c.lineWidth = 2; c.beginPath(); for (const p of tail) c.lineTo(p.x, p.y); c.stroke();
      if (state !== 'crash' || Math.floor(t * 10) % 2) {
        c.save(); c.translate(k.x, k.y); c.rotate(k.a + Math.PI / 2);
        c.fillStyle = '#ff5aa8'; c.beginPath(); c.moveTo(0, -16); c.lineTo(18, 6); c.lineTo(0, 2); c.lineTo(-18, 6); c.closePath(); c.fill();
        c.fillStyle = '#ffd23f'; c.beginPath(); c.moveTo(0, -16); c.lineTo(6, 2); c.lineTo(-6, 2); c.fill();
        c.restore();
      }
      label(c, `Ringe ${idx} / ${NR}`, 16, 24, '#1a3a5a');
      if (GUST) label(c, gust > 5 ? 'Böe →' : gust < -5 ? '← Böe' : '', W - 16, 24, '#1a3a5a', 'right');
      label(c, msgT > 0 ? msg : state === 'ready' ? '← → zum Losfliegen' : '← → Nase drehen · ↑ an der Leine ziehen', W / 2, H - 14, '#1a3a1a', 'center');
      if (state === 'crash') flashOverlay(c, 0.15, '255,255,255');
    }
  };
  return self;
}
