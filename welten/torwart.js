/* =====================================================================
   WELT – Torwart: Ein Schütze im Sternenstadion zielt aufs Tor. ← → bewegt den Torwart, ↑ springt
   nach hohen Bällen. Ab Level 5 Effet (der Ball dreht ab), ab Level 7 Täuschungen beim Anlauf.
   ===================================================================== */
function makeTorwart(next, level = 0) {
  const NEED = [5, 6, 7, 8, 8, 9, 10, 10, 11, 12][level];
  const FLIGHT = [1.7, 1.58, 1.47, 1.37, 1.28, 1.2, 1.13, 1.06, 1.0, 0.95][level];      // Flugzeit in s
  const SPREAD = [125, 135, 145, 155, 162, 168, 174, 180, 190, 196][level];             // seitliche Streuung
  const HIGH = [0, 0, 0.3, 0.35, 0.4, 0.4, 0.45, 0.45, 0.5, 0.5][level];                // Anteil hoher Bälle
  const CURVE = [0, 0, 0, 0, 45, 55, 65, 80, 95, 110][level], FEINT = [0, 0, 0, 0, 0, 0, 0.3, 0.35, 0.4, 0.45][level], LIVES = 3;
  const GL = 110, GR = 530, BAR = 190, GROUND = 330, SX = 320, SY = 168, KSPD = 400;
  const finale = makeFinale(next);
  let kx, kh, kv, ball, phase, timer, saves, lives, failT, msg, msgT, t = 0, flash = 0, run, feinted, crowd;
  function reset() { kx = W / 2; kh = 0; kv = 0; ball = null; phase = 'wait'; timer = 1.2; saves = 0; lives = LIVES; failT = -1; msg = ''; msgT = 0; run = 0; feinted = false; }
  reset();
  crowd = Array.from({ length: 70 }, (_, i) => ({ x: (i * 37) % W, y: 40 + (i * 13) % 60, p: i * 0.7 }));
  function say(m) { msg = m; msgT = 1.3; }
  function shoot() {
    const high = Math.random() < HIGH;
    const tx = SX + (Math.random() * 2 - 1) * SPREAD;
    const ty = high ? 205 + Math.random() * 22 : 268 + Math.random() * 50;
    let cv = CURVE ? (Math.random() < 0.5 ? -1 : 1) * CURVE * (0.6 + Math.random() * 0.4) : 0;
    ball = { tx, ty, cv, p: 0, arc: high ? 40 : 15 + Math.random() * 20, x: SX, y: SY, r: 3 };
  }
  const bpos = (b, p) => ({ x: SX + (b.tx - SX) * p + b.cv * 4 * p * (1 - p), y: SY + (b.ty - SY) * p - b.arc * 4 * p * (1 - p), r: 3 + 9 * p * p });
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ fin: finale.active, fail: failT >= 0, kx, kh, phase, ball: ball && phase === 'fly' ? { x: ball.x, y: ball.y, r: ball.r, p: ball.p } : null }), // für Testprogramme
    update(dt) {
      t += dt; msgT -= dt; flash = Math.max(0, flash - dt * 2);
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      if (failT >= 0) { failT += dt; if ((failT > 0.8 && pressed.action) || failT > 4) { died(); reset(); } return; }
      // Torwart
      kx = clamp(kx + ((keys.right ? 1 : 0) - (keys.left ? 1 : 0)) * KSPD * dt, GL + 20, GR - 20);
      if (pressed.up && kh <= 0) kv = 430;
      if (kh > 0 || kv > 0) { kh += kv * dt; kv -= 1150 * dt; if (kh <= 0) { kh = 0; kv = 0; } }
      if (phase === 'wait') {
        timer -= dt; if (ball) ball.done -= dt;
        if (timer <= 0) { phase = 'run'; run = 0; feinted = !(Math.random() < FEINT); }
      } else if (phase === 'run') {
        run += dt;
        if (!feinted && run > 0.45) { feinted = true; run = -0.55; say('Täuschung!'); }
        if (run >= 0.8) { phase = 'fly'; shoot(); Klang.tone(180, 0.1); }
      } else if (phase === 'fly') {
        ball.p += dt / FLIGHT;
        const q = bpos(ball, Math.min(1, ball.p)); ball.x = q.x; ball.y = q.y; ball.r = q.r;
        if (ball.p >= 1) {
          const feet = GROUND - kh, box = { x: kx - 44, y: feet - 80, w: 88, h: 80 };
          if (circleRect(ball.x, ball.y, ball.r, box)) { saves++; say('Gehalten!'); Klang.tone(660, 0.2); if (saves >= NEED) { finale.start(); return; } }
          else { lives--; flash = 1; say('Tor!'); Klang.tone(120, 0.4); if (lives <= 0) { failT = 0; return; } }
          phase = 'wait'; timer = 1.3 + Math.random() * 0.5; ball.done = 0.5;
        }
      }
    },
    draw(c) {
      const bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#040a2a'); bg.addColorStop(0.45, '#13205a'); bg.addColorStop(0.46, '#0f4a3a'); bg.addColorStop(1, '#06281f');
      c.fillStyle = bg; c.fillRect(0, 0, W, H);
      // Flutlichter und Publikum
      for (const x of [60, 580]) { const g = c.createRadialGradient(x, 30, 2, x, 30, 140); g.addColorStop(0, 'rgba(255,240,200,0.55)'); g.addColorStop(1, 'rgba(255,240,200,0)'); c.fillStyle = g; c.fillRect(x - 140, 0, 280, 180); }
      for (const p of crowd) { c.fillStyle = `hsla(${(p.p * 50 + t * 30) % 360},80%,65%,0.5)`; c.beginPath(); c.arc(p.x, p.y + Math.sin(t * 4 + p.p) * (phase === 'fly' ? 2 : 0.5), 3, 0, 7); c.fill(); }
      // Rasenstreifen in Perspektive
      for (let i = -8; i <= 8; i++) { c.strokeStyle = 'rgba(120,255,190,0.08)'; c.beginPath(); c.moveTo(SX + i * 12, 184); c.lineTo(SX + i * 90, H); c.stroke(); }
      // Schütze
      const sx = SX + (phase === 'run' ? 0 : 0), sy = SY - 4, step = phase === 'run' ? Math.sin(run * 20) * 3 : 0, lean = phase === 'run' ? clamp(run, 0, 0.8) * 10 : 0;
      c.fillStyle = '#ff3fa4'; c.fillRect(sx - 4, sy - 22 - lean * 0.3, 8, 14);
      c.fillStyle = '#ffd6ea'; c.beginPath(); c.arc(sx, sy - 27 - lean * 0.3, 4, 0, 7); c.fill();
      c.strokeStyle = '#ffd6ea'; c.lineWidth = 2; c.beginPath(); c.moveTo(sx - 2, sy - 8); c.lineTo(sx - 3 - step, sy); c.moveTo(sx + 2, sy - 8); c.lineTo(sx + 3 + step, sy); c.stroke();
      // Tor mit Netz
      c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 1;
      for (let x = GL; x <= GR; x += 20) { c.beginPath(); c.moveTo(x, BAR); c.lineTo(x + (x - SX) * -0.08, BAR - 22); c.stroke(); }
      for (let y = BAR; y <= GROUND; y += 20) { c.beginPath(); c.moveTo(GL, y); c.lineTo(GR, y); c.stroke(); }
      c.strokeStyle = '#f4f8ff'; c.lineWidth = 6; c.shadowColor = '#9fd8ff'; c.shadowBlur = 12;
      c.beginPath(); c.moveTo(GL, GROUND); c.lineTo(GL, BAR); c.lineTo(GR, BAR); c.lineTo(GR, GROUND); c.stroke(); c.shadowBlur = 0;
      c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(GL - 30, GROUND, GR - GL + 60, 2);
      // Ball (hinter dem Torwart, solange er weit weg ist)
      const drawBall = () => {
        if (!ball || (phase !== 'fly' && !(ball.done > 0))) return;
        c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(ball.x, SY + (GROUND - SY) * ball.p + 4, ball.r, ball.r * 0.35, 0, 0, 7); c.fill();
        c.fillStyle = '#ffffff'; c.shadowColor = '#ffe36b'; c.shadowBlur = 12; c.beginPath(); c.arc(ball.x, ball.y, ball.r, 0, 7); c.fill(); c.shadowBlur = 0;
        c.fillStyle = '#ff3fa4'; c.beginPath(); c.arc(ball.x + ball.r * 0.3 * Math.cos(t * 12), ball.y + ball.r * 0.3 * Math.sin(t * 12), ball.r * 0.35, 0, 7); c.fill();
      };
      if (ball && ball.p < 0.92) drawBall();
      // Torwart
      const feet = GROUND - kh;
      c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(kx, GROUND + 4, 30 - kh * 0.1, 6, 0, 0, 7); c.fill();
      c.fillStyle = '#ffe36b'; c.fillRect(kx - 18, feet - 62, 36, 38);
      c.fillStyle = '#2b2f7a'; c.fillRect(kx - 16, feet - 24, 14, 24); c.fillRect(kx + 2, feet - 24, 14, 24);
      c.fillStyle = '#ffd9b8'; c.beginPath(); c.arc(kx, feet - 70, 10, 0, 7); c.fill();
      const arm = kh > 0 ? -30 : -8;
      c.strokeStyle = '#ffe36b'; c.lineWidth = 7; c.lineCap = 'round';
      c.beginPath(); c.moveTo(kx - 16, feet - 56); c.lineTo(kx - 38, feet - 52 + arm); c.moveTo(kx + 16, feet - 56); c.lineTo(kx + 38, feet - 52 + arm); c.stroke();
      c.fillStyle = '#7dffc8'; c.beginPath(); c.arc(kx - 40, feet - 54 + arm, 7, 0, 7); c.arc(kx + 40, feet - 54 + arm, 7, 0, 7); c.fill();
      if (ball && ball.p >= 0.92) drawBall();
      if (flash > 0) { c.fillStyle = `rgba(255,63,164,${flash * 0.2})`; c.fillRect(0, 0, W, H); }
      label(c, `Gehalten ${saves} / ${NEED}`, 16, 26, '#dfe8ff');
      label(c, '♥'.repeat(Math.max(0, lives)), W - 16, 26, '#ff3fa4', 'right', 16);
      if (failT >= 0) label(c, 'Drei Tore kassiert! Leertaste: noch einmal', W / 2, 375, '#ffb0d6', 'center', 14);
      else if (msgT > 0) label(c, msg, W / 2, 375, '#ffffff', 'center', 14);
      else label(c, HIGH ? '← → laufen · ↑ springen (hohe Bälle) · tief: unten bleiben' : '← → laufen und den Ball halten', W / 2, 375, '#a9c0f0', 'center');
      finale.draw(c, '#dfe8ff', '#13205a');
    }
  };
  return self;
}
