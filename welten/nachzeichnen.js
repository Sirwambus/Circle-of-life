/* =====================================================================
   WELT – Nachzeichnen: Führe den Lichtpunkt mit den Pfeiltasten genau die Hennalinie entlang.
   Wer vom Weg abkommt, verbraucht Farbe. Ab Level 5 brennt hinter dir eine Zündschnur.
   ===================================================================== */
function makeNachzeichnen(next, level = 0) {
  // Je Level: längere und verschlungenere Linie, schmalerer Pfad, weniger Farbe; ab Level 4 eine Zündschnur, die immer schneller brennt.
  const LEN = [500, 650, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500][level], TMAX = [0.06, 0.08, 0.1, 0.12, 0.14, 0.16, 0.18, 0.2, 0.22, 0.24][level];
  const BAND = [24, 21, 19, 17, 16, 15, 14, 13, 12.5, 12][level], INK = [4, 3.5, 3, 2.7, 2.4, 2.2, 2, 1.8, 1.7, 1.6][level];
  const FUSE = [0, 0, 0, 0, 30, 38, 45, 52, 58, 64][level], ACC = 560, STEP = 6, R = rng(401 + level * 23);
  // Linie als Zufallsweg mit gedämpfter Krümmung, der im Feld bleibt
  const pts = [{ x: 60, y: 200 + (R() - 0.5) * 120 }];
  let hd = (R() - 0.5) * 0.6, tv = 0;
  while (pts.length * STEP < LEN) {
    const p = pts[pts.length - 1];
    tv = clamp(tv + (R() * 2 - 1) * TMAX * 0.35, -TMAX, TMAX);
    const lx = p.x + Math.cos(hd) * 50, ly = p.y + Math.sin(hd) * 50;
    if (lx < 50 || lx > W - 70 || ly < 70 || ly > H - 50) { // zum Rand: zur Mitte drehen
      const want = Math.atan2(215 - p.y, 330 - p.x), d = Math.atan2(Math.sin(want - hd), Math.cos(want - hd));
      tv = clamp(d * 0.5, -0.12 - TMAX, 0.12 + TMAX) * STEP / 6;
    }
    hd += tv * STEP / 6;
    pts.push({ x: p.x + Math.cos(hd) * STEP, y: p.y + Math.sin(hd) * STEP });
  }
  const end = pts[pts.length - 1], N = pts.length;
  const door = { x: end.x - 12, y: end.y - 34, w: 24, h: 40 };
  const motif = Array.from({ length: 7 }, () => ({ x: R() * W, y: R() * H, r: 20 + R() * 40, n: 6 + Math.floor(R() * 6) }));
  let dot, s, ink, fuse, started, state, timer, t = 0, msg = '', msgT = 0, trail = [];
  function reset() { dot = { x: pts[0].x, y: pts[0].y, vx: 0, vy: 0 }; s = 0; ink = INK; fuse = -FUSE * 1.5 / STEP - 1; started = false; state = 'play'; timer = 0; trail = []; }
  reset();
  // nächster Punkt der Linie im Fenster um den Fortschritt
  const near = (x, y, a, b) => { let bi = a, bd = 1e9; for (let i = Math.max(0, a); i <= Math.min(N - 1, b); i++) { const d = Math.hypot(pts[i].x - x, pts[i].y - y); if (d < bd) { bd = d; bi = i; } } return { i: bi, d: bd }; };
  const fail = m => { state = 'fail'; timer = 1.4; msg = m; msgT = 1.4; Klang.tone(150, 0.3); };
  const self = {
    done: false, door: () => door,
    test: () => ({ x: dot.x, y: dot.y, vx: dot.vx, vy: dot.vy, s, ink, fuse, state, band: BAND, fuseSpeed: FUSE, pts, step: STEP }), // für Testprogramme
    update(dt) {
      t += dt; msgT -= dt;
      if (state === 'fail') { timer -= dt; if (timer <= 0) { died(); reset(); } return; }
      const ix = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), iy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
      if (ix || iy) started = true;
      dot.vx += ix * ACC * dt; dot.vy += iy * ACC * dt;
      const k = Math.max(0, 1 - 2.6 * dt); dot.vx *= k; dot.vy *= k;
      dot.x = clamp(dot.x + dot.vx * dt, 4, W - 4); dot.y = clamp(dot.y + dot.vy * dt, 4, H - 4);
      if (started) { trail.push({ x: dot.x, y: dot.y }); if (trail.length > 30) trail.shift(); }
      const si = Math.round(s), nb = near(dot.x, dot.y, si - 6, si + 10);
      if (nb.d <= BAND) s = Math.max(s, nb.i);
      else if (started) { ink -= dt; if (ink <= 0) { ink = 0; fail('Die Farbe ist aufgebraucht. Noch einmal!'); return; } }
      if (FUSE && started) { fuse += FUSE * dt / STEP; if (fuse >= s && s < N - 2) { fail('Die Zündschnur hat dich eingeholt!'); return; } }
      if (s >= N - 3 && Math.hypot(dot.x - end.x, dot.y - end.y) < 18) self.done = true;
    },
    draw(c) {
      const bg = c.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, 420); bg.addColorStop(0, '#c4623a'); bg.addColorStop(1, '#6a2416');
      c.fillStyle = bg; c.fillRect(0, 0, W, H);
      c.strokeStyle = 'rgba(255,220,180,0.12)'; c.lineWidth = 1.5;
      for (const m of motif) for (let i = 0; i < m.n; i++) { const a = i / m.n * Math.PI * 2 + t * 0.05; c.beginPath(); c.ellipse(m.x + Math.cos(a) * m.r * 0.5, m.y + Math.sin(a) * m.r * 0.5, m.r * 0.5, m.r * 0.18, a, 0, 7); c.stroke(); }
      // Pfadbreite andeuten
      c.lineCap = 'round'; c.lineJoin = 'round';
      c.strokeStyle = 'rgba(255,235,210,0.13)'; c.lineWidth = BAND * 2;
      c.beginPath(); for (const p of pts) c.lineTo(p.x, p.y); c.stroke();
      // Hennalinie: gepunktet, geschaffter Teil golden, verbrannter Teil schwarz
      for (let i = 0; i < N; i += 2) {
        const p = pts[i];
        c.fillStyle = i <= fuse ? '#2a0e08' : i <= s ? next : '#fff4e4';
        c.beginPath(); c.arc(p.x, p.y, i <= s ? 2.6 : 1.8, 0, 7); c.fill();
      }
      if (FUSE && fuse > 0) { const p = pts[clamp(Math.floor(fuse), 0, N - 1)]; c.fillStyle = `rgba(255,${180 + Math.random() * 60 | 0},60,0.9)`; c.beginPath(); c.arc(p.x, p.y, 4 + Math.random() * 3, 0, 7); c.fill(); }
      c.fillStyle = '#fff4e4'; c.beginPath(); c.arc(pts[0].x, pts[0].y, 6, 0, 7); c.fill();
      paintDoor(c, door, { frame: '#3a120a', panel: '#e8a060', knob: '#fff4e4', light: next, glow: next, open: clamp(s / N * 1.5 - 0.5, 0, 1) });
      for (const [i, p] of trail.entries()) { c.fillStyle = `rgba(255,240,200,${i / trail.length * 0.5})`; c.fillRect(p.x - 1, p.y - 1, 2, 2); }
      const g = c.createRadialGradient(dot.x, dot.y, 1, dot.x, dot.y, 14); g.addColorStop(0, '#ffffff'); g.addColorStop(0.4, 'rgba(255,230,160,0.9)'); g.addColorStop(1, 'rgba(255,200,100,0)');
      c.fillStyle = g; c.beginPath(); c.arc(dot.x, dot.y, 14, 0, 7); c.fill();
      // Anzeigen
      label(c, 'Farbe', 16, 24, '#fff4e4');
      c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(70, 15, 100, 10); c.fillStyle = ink / INK < 0.3 ? '#ff4a3a' : '#ffd23f'; c.fillRect(70, 15, 100 * ink / INK, 10);
      label(c, `${Math.round(s / (N - 1) * 100)} %`, 180, 24, '#fff4e4');
      label(c, msgT > 0 ? msg : started ? 'Bleib auf der Linie' : 'Pfeiltasten: Lichtpunkt führen · der Linie bis zur Tür folgen', W / 2, H - 12, '#fff4e4', 'center');
      if (state === 'fail') flashOverlay(c, 0.25, '40,10,5');
    }
  };
  return self;
}
