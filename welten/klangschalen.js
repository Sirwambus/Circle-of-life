/* =====================================================================
   WELT – Klangschalen: Vier Schalen erklingen in einer Folge. Spiel sie RÜCKWÄRTS nach.
   ===================================================================== */
function makeKlangschalen(next, level = 0) {
  const GOAL = [4, 5, 6, 7, 8, 9, 9, 10, 10, 11][level], STEP = [0.75, 0.66, 0.58, 0.52, 0.46, 0.43, 0.4, 0.38, 0.36, 0.34][level], LIVES = 3;
  const BOWLS = [{ key: 'left', f: 196 }, { key: 'up', f: 246.9 }, { key: 'right', f: 293.7 }, { key: 'down', f: 349.2 }];
  const POS = { left: [-170, 10], up: [0, -100], right: [170, 10], down: [0, 120] };
  const finale = makeFinale(next);
  let seq, pos, phase, timer, ring, lives, t = 0, msg = '', msgT = 0;
  const strike = i => { ring[i] = 1; Klang.tone(BOWLS[i].f, 1.4); };
  function play() { phase = 'show'; pos = 0; timer = 0.9; }
  function reset() { seq = [0, 1, 2].map(() => Math.floor(Math.random() * 4)); lives = LIVES; ring = [0, 0, 0, 0]; play(); }
  reset();
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ fin: finale.active, seq, phase, pos, keyOf: i => BOWLS[i].key }), // für Testprogramme
    update(dt) {
      t += dt; msgT -= dt; ring = ring.map(r => Math.max(0, r - dt * 1.2));
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      if (phase === 'show') {
        timer -= dt;
        if (timer <= 0) { if (pos >= seq.length) { phase = 'input'; pos = 0; return; } strike(seq[pos]); pos++; timer = STEP; }
      } else if (phase === 'input') {
        const k = BOWLS.findIndex(b => pressed[b.key]); if (k < 0) return;
        strike(k);
        const want = seq[seq.length - 1 - pos];
        if (k !== want) { lives--; msg = lives > 0 ? 'Falsch. Noch einmal hören, dann rückwärts.' : 'Keine Versuche mehr. Von vorn.'; msgT = 1.8; if (lives <= 0) { died(); reset(); } else play(); timer = 1.6; return; }
        pos++;
        if (pos >= seq.length) { if (seq.length >= GOAL) { finale.start(); return; } seq.push(Math.floor(Math.random() * 4)); msg = 'Richtig!'; msgT = 1; play(); timer = 1.3; }
      }
    },
    draw(c) {
      const bg = c.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, 380); bg.addColorStop(0, '#3a1f10'); bg.addColorStop(1, '#0e0604'); c.fillStyle = bg; c.fillRect(0, 0, W, H);
      c.strokeStyle = 'rgba(255,200,120,0.07)'; for (let i = 0; i < 8; i++) { c.beginPath(); c.arc(W / 2, H / 2 + 10, 40 + i * 30, 0, 7); c.stroke(); }
      BOWLS.forEach((b, i) => {
        const [dx, dy] = POS[b.key], x = W / 2 + dx, y = H / 2 + dy;
        for (let k = 1; k <= 3; k++) { c.strokeStyle = `rgba(255,214,140,${ring[i] * (0.5 - k * 0.12)})`; c.lineWidth = 2; c.beginPath(); c.ellipse(x, y - 6, 34 + k * 14 * (1 - ring[i] + 0.3), 10 + k * 5, 0, 0, 7); c.stroke(); }
        const g = c.createLinearGradient(x - 34, 0, x + 34, 0); g.addColorStop(0, '#7a4a1c'); g.addColorStop(0.5, ring[i] > 0.3 ? '#ffd28a' : '#c88a3a'); g.addColorStop(1, '#6a3a14');
        c.fillStyle = g; c.beginPath(); c.moveTo(x - 34, y - 6); c.quadraticCurveTo(x, y + 40, x + 34, y - 6); c.closePath(); c.fill();
        c.fillStyle = '#2a1608'; c.beginPath(); c.ellipse(x, y - 6, 34, 8, 0, 0, 7); c.fill();
        label(c, { left: '←', up: '↑', right: '→', down: '↓' }[b.key], x, y + 36, 'rgba(255,220,170,0.6)', 'center', 12);
      });
      label(c, `Folge ${seq.length} / ${GOAL} · rückwärts`, 16, 26, '#ffdca8');
      label(c, '♥'.repeat(lives), W - 16, 26, '#ff9a6a', 'right', 16);
      const hint = phase === 'show' ? 'Hör zu …' : `Rückwärts nachspielen: ${pos} / ${seq.length}`;
      label(c, msgT > 0 ? msg : hint, W / 2, H - 14, '#ffdca8', 'center');
      finale.draw(c, '#ffdca8', '#3a1f10');
    }
  };
  return self;
}
