/* =====================================================================
   WELT – Treppensprint: Eine endlose Treppe in den Himmel. Jede Stufe liegt links (←) oder rechts (→),
   ab Level 5 auch goldene Stufen genau darüber (↑). Die Ausdauer sinkt ständig – nur Tempo füllt sie auf.
   Ab Level 8 verhüllt Nebel die Treppe weiter oben.
   ===================================================================== */
function makeTreppensprint(next, level = 0) {
  const NEED = [25, 30, 40, 50, 60, 70, 80, 90, 100, 110][level], DRAIN = [0.1, 0.12, 0.14, 0.16, 0.18, 0.2, 0.22, 0.24, 0.26, 0.28][level];
  const UP = [0, 0, 0, 0, 0.12, 0.15, 0.18, 0.2, 0.22, 0.25][level], VIS = [12, 12, 12, 12, 12, 12, 12, 4, 3, 3][level], GAIN = 0.1, SLIP = 0.2;
  const DX = 46, DY = 34, KEY = { '-1': 'left', '1': 'right', '0': 'up' };
  const finale = makeFinale(next);
  let steps, cur, bar, started, failed, failT, fallT, hop, shake, camX, camY, t = 0, msg = '', msgT = 0;
  const clouds = Array.from({ length: 12 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: 0.6 + Math.random() }));
  function grow() {
    const p = steps[steps.length - 1], i = steps.length;
    let d = Math.random() < UP && p.d !== 0 && i > 2 ? 0 : (Math.random() < 0.5 ? -1 : 1);
    steps.push({ x: p.x + d * DX, y: p.y - (d === 0 ? DY * 1.3 : DY), d, gold: d === 0, top: i === NEED });
  }
  function reset() {
    steps = [{ x: 0, y: 0, d: 1 }]; while (steps.length < NEED + 1) grow();
    cur = 0; bar = 1; started = false; failed = false; fallT = 0; hop = 1; shake = 0; camX = 0; camY = 0;
  }
  reset();
  const want = () => KEY[steps[cur + 1].d];
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ fin: finale.active, failed, want: cur < NEED ? want() : null, cur, bar }), // für Testprogramme
    update(dt) {
      t += dt; hop = Math.min(1, hop + dt * 9); shake = Math.max(0, shake - dt * 4); msgT -= dt;
      const p = steps[cur]; camX += (p.x - camX) * Math.min(1, dt * 8); camY += (p.y - camY) * Math.min(1, dt * 8);
      for (const c of clouds) { c.x -= c.s * 12 * dt; if (c.x < -80) { c.x = W + 80; c.y = Math.random() * H; } }
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      if (failed) { fallT += dt; failT += dt; if (failT > 0.8 && pressed.action) { died(); reset(); } return; }
      if (started) { bar -= DRAIN * dt; if (bar <= 0) { bar = 0; failed = true; failT = 0; Klang.tone(90, 0.5); return; } }
      const k = ['left', 'right', 'up'].find(d => pressed[d]);
      if (!k) return;
      started = true;
      if (k === want()) {
        cur++; hop = 0; bar = Math.min(1, bar + GAIN); Klang.tone(300 + (cur % 12) * 30, 0.05);
        if (cur >= NEED) { finale.start(); Klang.tone(990, 0.3); }
      } else { bar -= SLIP; shake = 1; msg = 'Gestolpert!'; msgT = 0.8; Klang.tone(120, 0.15); if (bar <= 0) { bar = 0; failed = true; failT = 0; } }
    },
    draw(c) {
      const hue = (210 + cur * 4) % 360;
      const sky = c.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, `hsl(${hue},70%,22%)`); sky.addColorStop(0.6, `hsl(${(hue + 40) % 360},75%,55%)`); sky.addColorStop(1, `hsl(${(hue + 70) % 360},85%,75%)`);
      c.fillStyle = sky; c.fillRect(0, 0, W, H);
      // Strahlen
      c.save(); c.translate(W / 2, H + 60); c.rotate(t * 0.05); c.fillStyle = 'rgba(255,255,255,0.06)';
      for (let i = 0; i < 12; i++) { c.rotate(Math.PI / 6); c.beginPath(); c.moveTo(0, 0); c.lineTo(-40, -700); c.lineTo(40, -700); c.fill(); } c.restore();
      for (const cl of clouds) { c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.ellipse(cl.x, cl.y, 50 * cl.s, 14 * cl.s, 0, 0, 7); c.ellipse(cl.x + 24 * cl.s, cl.y - 8 * cl.s, 28 * cl.s, 12 * cl.s, 0, 0, 7); c.fill(); }
      const sx = Math.sin(t * 60) * 5 * shake, ox = W / 2 - camX + sx, oy = H * 0.64 - camY;
      for (let i = Math.max(0, cur - 7); i <= Math.min(steps.length - 1, cur + 12); i++) {
        const s = steps[i], x = ox + s.x, y = oy + s.y;
        let a = i < cur ? 0.35 + 0.65 * (1 - (cur - i) / 8) : 1;
        if (i > cur + VIS) continue;
        if (VIS < 12 && i > cur + 1) a *= clamp(1 - (i - cur - 1) / VIS, 0.15, 1);
        c.globalAlpha = a;
        c.fillStyle = s.gold ? '#c9961a' : `hsl(${(hue + 180 + i * 7) % 360},35%,32%)`; c.fillRect(x - 28, y + 6, 56, 12);
        c.fillStyle = s.gold ? '#ffd24a' : s.top ? '#ffffff' : `hsl(${(hue + 180 + i * 7) % 360},45%,82%)`; c.fillRect(x - 28, y, 56, 8);
        if (i === cur + 1 && !failed && !finale.active) { c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.strokeRect(x - 30, y - 2, 60, 22); }
        c.globalAlpha = 1;
      }
      if (VIS < 12) { const fog = c.createLinearGradient(0, 0, 0, H * 0.5); fog.addColorStop(0, 'rgba(240,240,255,0.9)'); fog.addColorStop(1, 'rgba(240,240,255,0)'); c.fillStyle = fog; c.fillRect(0, 0, W, H * 0.5); }
      // Kletterer
      const s0 = steps[Math.max(0, cur - 1)], s1 = steps[cur], k = cur === 0 ? 1 : hop;
      let px = ox + s0.x + (s1.x - s0.x) * k, py = oy + s0.y + (s1.y - s0.y) * k - Math.sin(Math.PI * k) * 14;
      if (failed) py += fallT * fallT * 600;
      c.save(); c.translate(px, py); if (failed) c.rotate(fallT * 6);
      c.fillStyle = '#2a1a3a'; c.fillRect(-6, -22, 12, 16);
      c.strokeStyle = '#2a1a3a'; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(-3, -6); c.lineTo(-5, 0); c.moveTo(3, -6); c.lineTo(5, 0); c.stroke();
      c.fillStyle = '#ffe0c0'; c.beginPath(); c.arc(0, -28, 6, 0, 7); c.fill();
      c.strokeStyle = '#ff3a6a'; c.lineWidth = 3; c.beginPath(); c.moveTo(-5, -21); c.quadraticCurveTo(-14, -20 + Math.sin(t * 12) * 3, -20, -16 + Math.sin(t * 12) * 4); c.stroke();
      c.restore();
      // Anzeigen
      label(c, `Stufe ${cur} / ${NEED}`, 16, 26, '#ffffff');
      c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(W - 216, 16, 200, 12);
      c.fillStyle = bar < 0.3 ? '#ff4a5a' : '#7dffb0'; c.fillRect(W - 216, 16, 200 * bar, 12);
      label(c, 'Ausdauer', W - 222, 26, '#ffffff', 'right', 11);
      if (!started && !failed) label(c, UP ? '← → zur nächsten Stufe · ↑ goldene Stufe darüber' : '← → zur nächsten Stufe', W / 2, 380, '#ffffff', 'center', 14);
      if (msgT > 0) label(c, msg, W / 2, 380, '#ff4a5a', 'center', 15);
      if (failed) { c.fillStyle = 'rgba(30,10,50,0.85)'; c.fillRect(0, 160, W, 80); label(c, `Abgestürzt auf Stufe ${cur}. Leertaste: neuer Versuch`, W / 2, 205, '#ffd0e0', 'center', 14); }
      finale.draw(c, '#ffffff', `hsl(${hue},50%,30%)`);
    }
  };
  return self;
}
