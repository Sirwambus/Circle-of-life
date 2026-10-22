/* =====================================================================
   WELT – Flanker: Ein Schwarm Kois zieht durch den Mondteich. Nur der mittlere Fisch zählt:
   ← oder → in seine Schwimmrichtung. Die Nachbarn lenken ab. Später taucht der Schwarm an
   wechselnden Orten auf, verschwindet schneller, und ein violetter Mittelfisch verlangt die Gegenrichtung.
   ===================================================================== */
function makeFlanker(next, level = 0) {
  const NEED = [10, 12, 14, 15, 16, 18, 18, 20, 22, 24][level], LIVES = 3;
  const SHOW = [99, 1.6, 1.3, 1.1, 0.95, 0.85, 0.8, 0.75, 0.7, 0.65][level], RESP = [3, 2.6, 2.3, 2.1, 1.9, 1.75, 1.7, 1.6, 1.55, 1.5][level];
  const INC = [0.35, 0.5, 0.55, 0.6, 0.6, 0.65, 0.65, 0.7, 0.7, 0.7][level], N = level >= 4 ? 7 : 5;
  const SCATTER = level >= 3, MIRROR = [0, 0, 0, 0, 0, 0, 0.3, 0.33, 0.38, 0.42][level];
  const finale = makeFinale(next);
  let trial, phase, timer, score, lives, failed, fb, fbOk, t = 0, msg = '', msgT = 0;
  const rand = (a, b) => a + Math.random() * (b - a);
  function newTrial() {
    const dir = Math.random() < 0.5 ? -1 : 1, inc = Math.random() < INC, mirror = Math.random() < MIRROR;
    trial = { dir, flank: inc ? -dir : dir, mirror, x: SCATTER ? rand(-100, 100) * (N > 5 ? 0.75 : 1) : 0, y: SCATTER ? rand(-80, 80) : 0, age: 0 };
    phase = 'fix'; timer = rand(0.55, 0.95);
  }
  function reset() { score = 0; lives = LIVES; failed = false; fb = 0; newTrial(); }
  reset();
  const answer = () => (trial.mirror ? -trial.dir : trial.dir) < 0 ? 'left' : 'right';
  function judge(ok, why) {
    fb = 1; fbOk = ok;
    if (ok) { score++; Klang.tone(520 + score * 12, 0.12); if (score >= NEED) { finale.start(); return; } }
    else { lives--; Klang.tone(150, 0.3); msg = why; msgT = 1.2; if (lives <= 0) { failed = true; timer = 0.6; return; } }
    phase = 'pause'; timer = ok ? 0.3 : 0.8;
  }
  function fish(c, x, y, dir, body, spot, s) {
    c.save(); c.translate(x, y); c.scale(dir * s, s);
    const wig = Math.sin(t * 9 + x * 0.05) * 0.18;
    c.fillStyle = body; c.beginPath(); c.moveTo(-14, 0); c.lineTo(-28, -9 + wig * 20); c.lineTo(-25, 0); c.lineTo(-28, 9 + wig * 20); c.closePath(); c.fill();
    c.beginPath(); c.ellipse(0, 0, 18, 8, 0, 0, 7); c.fill();
    c.beginPath(); c.moveTo(-2, -6); c.lineTo(-8, -13); c.lineTo(4, -7); c.fill();
    c.fillStyle = spot; c.beginPath(); c.ellipse(4, -2, 6, 4, 0.3, 0, 7); c.fill(); c.beginPath(); c.ellipse(-7, 2, 4, 3, 0, 0, 7); c.fill();
    c.fillStyle = '#10161c'; c.beginPath(); c.arc(12, -2, 1.6, 0, 7); c.fill();
    c.restore();
  }
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ fin: finale.active, failed, phase, age: trial.age, answer: answer() }), // für Testprogramme
    update(dt) {
      t += dt; msgT -= dt; fb = Math.max(0, fb - dt * 2.5);
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      if (failed) { timer -= dt; if (timer <= 0 && pressed.action) { died(); reset(); } return; }
      if (phase === 'fix') { timer -= dt; if (timer <= 0) { phase = 'stim'; trial.age = 0; } }
      else if (phase === 'stim') {
        trial.age += dt;
        const k = pressed.left ? 'left' : pressed.right ? 'right' : null;
        if (k) judge(k === answer(), trial.mirror ? 'Falsch – violett heißt Gegenrichtung!' : 'Falsch – nur der mittlere Fisch zählt.');
        else if (trial.age >= RESP) judge(false, 'Zu langsam!');
      } else if (phase === 'pause') { timer -= dt; if (timer <= 0) newTrial(); }
    },
    draw(c) {
      const g = c.createRadialGradient(W / 2, H / 2, 30, W / 2, H / 2, 420); g.addColorStop(0, '#0f4a4f'); g.addColorStop(1, '#03161c');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.strokeStyle = 'rgba(180,240,230,0.08)'; c.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) { const r = ((t * 22 + i * 60) % 240); c.beginPath(); c.ellipse(W / 2 + 180, 90, r, r * 0.4, 0, 0, 7); c.stroke(); }
      for (const [x, y, r] of [[70, 80, 26], [580, 330, 32], [96, 330, 20], [540, 70, 18]]) { // Seerosenblätter
        c.fillStyle = '#1f6b45'; c.beginPath(); c.arc(x, y, r, 0.3, Math.PI * 2 - 0.1); c.lineTo(x, y); c.fill();
      }
      c.fillStyle = 'rgba(255,250,220,0.12)'; c.beginPath(); c.ellipse(W / 2 - 150, 300, 40, 12, 0, 0, 7); c.fill();
      const cx = W / 2 + trial.x, cy = H / 2 + 10 + trial.y;
      if (phase === 'fix' || phase === 'pause') { c.fillStyle = 'rgba(255,240,220,0.6)'; c.beginPath(); c.arc(W / 2, H / 2 + 10, 3, 0, 7); c.fill(); }
      if (phase === 'stim' && trial.age < SHOW) {
        const sp = 60;
        for (let i = 0; i < N; i++) {
          const mid = i === (N - 1) / 2, x = cx + (i - (N - 1) / 2) * sp;
          const body = mid && trial.mirror ? '#b06cff' : '#ff8a3c', spot = mid && trial.mirror ? '#f0e2ff' : '#fff4e6';
          fish(c, x, cy, mid ? trial.dir : trial.flank, body, spot, 1.25);
        }
      }
      if (fb > 0) { c.strokeStyle = fbOk ? `rgba(125,255,176,${fb})` : `rgba(255,77,109,${fb})`; c.lineWidth = 3; c.beginPath(); c.arc(cx, cy, 40 + (1 - fb) * 50, 0, 7); c.stroke(); }
      label(c, `Richtig ${score} / ${NEED}`, 16, 26, '#bdf2e6');
      label(c, '♥'.repeat(Math.max(0, lives)), W - 16, 26, '#ff8a9a', 'right', 16);
      if (msgT > 0) label(c, msg, W / 2, 372, '#ffb3c0', 'center', 13);
      else label(c, MIRROR ? '← → Richtung des MITTLEREN Fisches · violett: Gegenrichtung' : '← → Richtung des MITTLEREN Fisches', W / 2, 372, '#8fd3c4', 'center', 13);
      c.fillStyle = 'rgba(255,255,255,0.08)'; c.fillRect(16, 384, W - 32, 4);
      c.fillStyle = '#ff8a3c'; c.fillRect(16, 384, (W - 32) * score / NEED, 4);
      if (failed) { c.fillStyle = 'rgba(3,22,28,0.92)'; c.fillRect(0, 160, W, 80); label(c, 'Zu viele Fehler. Leertaste: neuer Versuch', W / 2, 205, '#ff9db0', 'center', 14); }
      finale.draw(c, '#bdf2e6', '#0f4a4f');
    }
  };
  return self;
}
