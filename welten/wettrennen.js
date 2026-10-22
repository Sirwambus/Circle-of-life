/* =====================================================================
   WELT – Wettrennen: Renn gegen den Schattenläufer. Drück abwechselnd ← und →, um Tempo zu machen.
   Ab Level 4 stehen Hürden auf der Bahn: rechtzeitig mit ↑ springen, sonst stolperst du.
   ===================================================================== */
function makeWettrennen(next, level = 0) {
  const LEN = [1500, 1700, 1900, 2100, 2200, 2300, 2400, 2500, 2600, 2700][level];
  const OPP = [55, 64, 72, 78, 82, 86, 90, 94, 98, 102][level], HUR = [0, 0, 0, 4, 5, 6, 8, 9, 10, 12][level];
  const BOOST = 30, DRAG = 1.2, VMAX = 230, AIR = 0.5, PX = 170;
  const finale = makeFinale(next);
  let me, opp, hurdles, phase, count, last, failed, failT, msg, msgT, t = 0;
  function reset() {
    me = { x: 0, v: 0, air: 0, trip: 0, step: 0 }; opp = { x: 0 }; last = null; failed = false; msgT = 0;
    phase = 'count'; count = 3;
    hurdles = [];
    for (let i = 0; i < HUR; i++) hurdles.push(300 + (LEN - 450) * (i + 0.3 + Math.random() * 0.4) / HUR);
  }
  reset();
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ fin: finale.active, failed, phase, x: me.x, v: me.v, air: me.air, opp: opp.x, last, hurdle: hurdles.find(h => h > me.x) }), // für Testprogramme
    update(dt) {
      t += dt; msgT -= dt;
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      if (failed) { failT += dt; if (failT > 0.8 && pressed.action) { died(); reset(); } return; }
      if (phase === 'count') {
        const c0 = Math.ceil(count); count -= dt;
        if (Math.ceil(count) !== c0) Klang.tone(count <= 0 ? 880 : 440, 0.15);
        if (count <= 0) phase = 'run';
        return;
      }
      if (phase === 'won') { count -= dt; if (count <= 0) finale.start(); return; }
      opp.x += OPP * dt;
      const k = pressed.left ? 'left' : pressed.right ? 'right' : null;
      if (me.trip > 0) me.trip -= dt;
      else if (me.air > 0) me.air -= dt;
      else {
        if (pressed.up) { me.air = AIR; Klang.tone(600, 0.08); }
        else if (k) {
          if (k !== last) { me.v = Math.min(VMAX, me.v + BOOST); me.step++; Klang.tone(k === 'left' ? 300 : 340, 0.03); }
          else { me.v *= 0.8; msg = 'Abwechselnd ← → drücken!'; msgT = 1; }
          last = k;
        }
        me.v -= me.v * DRAG * dt;
      }
      const x0 = me.x; me.x += me.v * dt;
      for (const h of hurdles) if (x0 < h && me.x >= h && me.air <= 0) { me.v *= 0.25; me.trip = 0.45; msg = 'Hürde gerissen! ↑ springt'; msgT = 1.2; Klang.tone(120, 0.2); }
      if (me.x >= LEN) { phase = 'won'; count = 0.8; Klang.tone(990, 0.3); return; }
      if (opp.x >= LEN) { failed = true; failT = 0; Klang.tone(90, 0.5); }
    },
    draw(c) {
      const cam = me.x - PX;
      const sky = c.createLinearGradient(0, 0, 0, 200); sky.addColorStop(0, '#12002a'); sky.addColorStop(1, '#ff4fa0');
      c.fillStyle = sky; c.fillRect(0, 0, W, 200);
      // Sonne mit Streifen
      const sun = c.createLinearGradient(0, 60, 0, 190); sun.addColorStop(0, '#ffe46a'); sun.addColorStop(1, '#ff6a3a');
      c.fillStyle = sun; c.beginPath(); c.arc(W / 2, 190, 90, Math.PI, 0); c.fill();
      c.fillStyle = '#ff4fa0'; for (let i = 0; i < 6; i++) c.fillRect(W / 2 - 92, 128 + i * 11, 184, 2 + i);
      // Berge mit Parallaxe
      c.fillStyle = '#3a0a5a'; c.beginPath(); c.moveTo(0, 200);
      for (let x = 0; x <= W; x += 20) c.lineTo(x, 170 - Math.abs(Math.sin((x + cam * 0.1) * 0.012)) * 50); c.lineTo(W, 200); c.fill();
      // Boden mit Gitter
      c.fillStyle = '#1a0630'; c.fillRect(0, 200, W, 200);
      c.strokeStyle = 'rgba(255,79,200,0.5)'; c.lineWidth = 1; c.beginPath();
      for (let i = 0; i < 9; i++) { const y = 200 + Math.pow(i / 8, 1.8) * 200; c.moveTo(0, y); c.lineTo(W, y); }
      for (let i = -12; i <= 12; i++) { const bx = W / 2 + i * 60 - ((cam * 0.6) % 60); c.moveTo(W / 2 + (bx - W / 2) * 0.15, 200); c.lineTo(W / 2 + (bx - W / 2) * 2.2, H); }
      c.stroke();
      // Bahnen
      const LANES = [250, 330];
      for (const y of LANES) { c.fillStyle = 'rgba(80,20,120,0.75)'; c.fillRect(0, y - 22, W, 44); c.fillStyle = '#ff9ad8'; c.fillRect(0, y + 22, W, 2); }
      for (let m = Math.floor(cam / 100) * 100; m < cam + W; m += 100) { const x = m - cam; if (m < 0) continue; c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(x, 228, 2, 124); if (m % 500 === 0) label(c, `${m / 10} m`, x + 4, 222, 'rgba(255,220,255,0.6)', 'left', 10); }
      // Ziel
      const fx = LEN - cam;
      if (fx > -20 && fx < W + 20) for (let i = 0; i < 12; i++) for (let j = 0; j < 2; j++) { c.fillStyle = (i + j) % 2 ? '#ffffff' : '#12002a'; c.fillRect(fx + j * 8, 228 + i * 10.5, 8, 10.5); }
      // Hürden (nur auf der eigenen Bahn)
      for (const h of hurdles) {
        const x = h - cam; if (x < -20 || x > W + 20) continue;
        c.strokeStyle = '#6afcff'; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 6, 352); c.lineTo(x - 6, 322); c.moveTo(x + 6, 352); c.lineTo(x + 6, 322); c.stroke();
        c.fillStyle = '#6afcff'; c.fillRect(x - 10, 318, 20, 6);
      }
      // Läufer
      const runner = (x, y, stride, col, glow, jump) => {
        const lift = jump > 0 ? Math.sin(Math.PI * (1 - jump / AIR)) * 34 : 0, s = Math.sin(stride);
        c.save(); c.translate(x, y - lift); c.shadowColor = glow; c.shadowBlur = 12; c.strokeStyle = col; c.lineWidth = 4; c.lineCap = 'round';
        c.beginPath(); c.moveTo(0, -10); c.lineTo(s * 12, 12); c.moveTo(0, -10); c.lineTo(-s * 12, 12);
        c.moveTo(0, -10); c.lineTo(2, -32); c.moveTo(1, -26); c.lineTo(-s * 12, -14); c.moveTo(1, -26); c.lineTo(s * 12, -14); c.stroke();
        c.fillStyle = col; c.beginPath(); c.arc(3, -38, 6, 0, 7); c.fill(); c.restore();
      };
      runner(opp.x - cam, LANES[0] + 6, opp.x * 0.06, '#0a0014', '#b04aff', 0);
      if (opp.x - cam > -10 && opp.x - cam < W + 10) { c.fillStyle = '#ff3a6a'; c.fillRect(opp.x - cam + 3, LANES[0] - 34, 3, 2); }
      runner(PX, LANES[1] + 6, me.x * 0.06, '#ffffff', '#6afcff', me.air);
      if (me.trip > 0) label(c, '!', PX + 14, LANES[1] - 46, '#ff6a6a', 'center', 18);
      // Fortschritt
      c.fillStyle = 'rgba(255,255,255,0.15)'; c.fillRect(160, 48, 320, 6);
      c.fillStyle = '#b04aff'; c.beginPath(); c.arc(160 + 320 * clamp(opp.x / LEN, 0, 1), 51, 6, 0, 7); c.fill();
      c.fillStyle = '#6afcff'; c.beginPath(); c.arc(160 + 320 * clamp(me.x / LEN, 0, 1), 51, 6, 0, 7); c.fill();
      label(c, `${Math.round(me.v / 10 * 3.6)} km/h`, 16, 26, '#ffe0ff');
      label(c, `${Math.max(0, Math.round((LEN - me.x) / 10))} m bis zum Ziel`, W - 16, 26, '#ffe0ff', 'right');
      if (phase === 'count') label(c, count > 0.0 ? String(Math.ceil(count)) : 'LOS!', W / 2, 120, '#ffffff', 'center', 48);
      if (phase === 'count') label(c, HUR ? '← → abwechselnd: rennen · ↑ springen' : '← → abwechselnd drücken', W / 2, 160, '#ffe0ff', 'center', 14);
      if (msgT > 0) label(c, msg, W / 2, 390, '#ffb0e0', 'center', 13);
      if (failed) { c.fillStyle = 'rgba(18,0,42,0.92)'; c.fillRect(0, 160, W, 80); label(c, 'Der Schattenläufer war schneller. Leertaste: neues Rennen', W / 2, 205, '#ffb0e0', 'center', 14); }
      finale.draw(c, '#ffe0ff', '#3a0a5a');
    }
  };
  return self;
}
