/* =====================================================================
   WELT – Abwehr: Dreh den Schild um den Kern und fang die Geschosse ab, die von allen Seiten kommen.
   ===================================================================== */
function makeAbwehr(next, level = 0) {
  const NEED = [12, 16, 20, 24, 28, 30, 32, 34, 36, 40][level], SPEED = [90, 110, 128, 145, 160, 170, 180, 190, 200, 210][level], EVERY = [1.2, 1, 0.86, 0.76, 0.68, 0.63, 0.59, 0.55, 0.52, 0.49][level];
  const HALF = [0.62, 0.56, 0.5, 0.46, 0.42, 0.4, 0.38, 0.36, 0.35, 0.34][level], SR = 50, LIVES = 3;
  const finale = makeFinale(next);
  const C0 = { x: W / 2, y: H / 2 + 8 };
  let ang, shots, blocked, lives, spawnT, t = 0, hit = 0;
  function reset() { ang = -Math.PI / 2; shots = []; blocked = 0; lives = LIVES; spawnT = 1; }
  reset();
  const diff = (a, b) => Math.abs(((a - b + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ fin: finale.active, ang, shots }), // für Testprogramme
    update(dt) {
      t += dt; hit = Math.max(0, hit - dt * 2);
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      ang += ((keys.right ? 1 : 0) - (keys.left ? 1 : 0)) * 5 * dt;
      spawnT -= dt;
      if (spawnT <= 0) {
        spawnT = EVERY * (0.75 + Math.random() * 0.5);
        const a = Math.random() * Math.PI * 2;
        shots.push({ a, r: 300, sp: SPEED * (level >= 3 && Math.random() < 0.3 ? 1.5 : 1), curve: level >= 4 ? (Math.random() - 0.5) * 0.8 : 0 });
      }
      for (const s of shots) {
        s.r -= s.sp * dt; s.a += s.curve * dt;
        if (!s.gone && s.r <= SR + 4 && s.r > SR - 8 && diff(s.a, ang) < HALF) { s.gone = true; blocked++; Klang.tone(660, 0.2); if (blocked >= NEED) { finale.start(); return; } }
        if (!s.gone && s.r < 22) { s.gone = true; lives--; hit = 1; if (lives <= 0) { died(); reset(); return; } }
      }
      shots = shots.filter(s => !s.gone);
    },
    draw(c) {
      const bg = c.createRadialGradient(C0.x, C0.y, 10, C0.x, C0.y, 400); bg.addColorStop(0, '#2b0a2e'); bg.addColorStop(1, '#05020a');
      c.fillStyle = bg; c.fillRect(0, 0, W, H);
      c.save(); c.translate(C0.x, C0.y);
      c.strokeStyle = 'rgba(255,120,220,0.08)';
      for (let i = 1; i < 9; i++) { c.beginPath(); c.arc(0, 0, i * 36, 0, 7); c.stroke(); }
      c.rotate(t * 0.2);
      for (let i = 0; i < 12; i++) { c.rotate(Math.PI / 6); c.beginPath(); c.moveTo(0, 0); c.lineTo(300, 0); c.stroke(); }
      c.rotate(-t * 0.2);
      c.fillStyle = hit > 0 ? '#ff3b6b' : '#ff7ad9'; c.shadowColor = '#ff7ad9'; c.shadowBlur = 20;
      c.beginPath(); c.arc(0, 0, 18, 0, 7); c.fill();
      c.strokeStyle = '#ffe1f6'; c.lineWidth = 6; c.lineCap = 'round';
      c.beginPath(); c.arc(0, 0, SR, ang - HALF, ang + HALF); c.stroke();
      c.shadowBlur = 0;
      for (const s of shots) { c.fillStyle = s.sp > SPEED ? '#ffd23f' : '#9df2ff'; c.beginPath(); c.arc(Math.cos(s.a) * s.r, Math.sin(s.a) * s.r, 5, 0, 7); c.fill(); }
      c.restore();
      label(c, `Abgewehrt ${blocked} / ${NEED}`, 16, 26, '#ffe1f6');
      label(c, '♥'.repeat(lives), W - 16, 26, '#ff3b6b', 'right', 16);
      if (hit > 0) { c.fillStyle = `rgba(255,59,107,${hit * 0.15})`; c.fillRect(0, 0, W, H); }
      finale.draw(c, '#ffe1f6', '#2b0a2e');
    }
  };
  return self;
}
